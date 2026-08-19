'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'

interface PhotoUploadProps {
  photos: string[]
  onChange: (photos: string[]) => void
}

export default function PhotoUpload({ photos, onChange }: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (photos.length >= 5) {
      alert('Máximo 5 fotos permitidas')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Error al subir la foto')
        return
      }

      onChange([...photos, data.url])
    } catch {
      alert('Error de conexión al subir la foto')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemove = (index: number) => {
    onChange(photos.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {photos.map((url, index) => (
          <div
            key={url}
            className="relative group aspect-square rounded-lg overflow-hidden border border-border-dim"
          >
            <img
              src={url}
              alt={`Foto ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-1 right-1 w-6 h-6 bg-accent-magenta/80 hover:bg-accent-magenta rounded-full flex items-center justify-center text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              ✕
            </button>
          </div>
        ))}

        {photos.length < 5 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-lg border-2 border-dashed border-accent-cyan/40 hover:border-accent-cyan bg-bg-card flex flex-col items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {uploading ? (
              <div className="w-6 h-6 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span className="text-2xl text-accent-cyan">+</span>
                <span className="text-xs text-text-muted">Agregar foto</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
