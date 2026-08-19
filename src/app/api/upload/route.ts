import { NextRequest, NextResponse } from 'next/server'
import { mkdirSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'canchas')
const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(request: NextRequest) {
  try {
    if (!existsSync(UPLOAD_DIR)) {
      mkdirSync(UPLOAD_DIR, { recursive: true })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Use JPEG, PNG, WebP o GIF' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo de 5MB' },
        { status: 400 }
      )
    }

    const ext = file.name.split('.').pop() || 'jpg'
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const filePath = join(UPLOAD_DIR, uniqueName)

    const buffer = Buffer.from(await file.arrayBuffer())
    writeFileSync(filePath, buffer)

    return NextResponse.json({ url: `/uploads/canchas/${uniqueName}` })
  } catch {
    return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 })
  }
}
