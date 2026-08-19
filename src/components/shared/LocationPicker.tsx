'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'

export interface UbicacionData {
  lat: number
  lng: number
  descripcion: string
  calle: string
  altura: string
  localidad: string
  provincia: string
  pais: string
}

interface LocationPickerProps {
  value: UbicacionData | null
  onChange: (data: UbicacionData | null) => void
}

const DEFAULT_CENTER: [number, number] = [-34.6037, -58.3816]

async function reverseGeocode(lat: number, lng: number) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    )
    const data = await res.json()
    const addr = data.address || {}
    return {
      calle: addr.road || '',
      altura: addr.house_number || '',
      localidad: addr.city || addr.town || addr.village || '',
      provincia: addr.state || '',
      pais: addr.country || 'Argentina',
    }
  } catch {
    return { calle: '', altura: '', localidad: '', provincia: '', pais: 'Argentina' }
  }
}

function createPinIcon(L: typeof import('leaflet')) {
  return L.divIcon({
    className: '',
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
    html: `<div style="position:relative;width:32px;height:42px;">
      <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 26 16 26s16-14 16-26C32 7.16 24.84 0 16 0z" fill="#00d4ff"/>
        <circle cx="16" cy="16" r="7" fill="#0a0e1a" stroke="#fff" stroke-width="2"/>
        <circle cx="16" cy="16" r="3" fill="#00d4ff"/>
      </svg>
      <div style="position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);width:12px;height:4px;background:rgba(0,0,0,0.3);border-radius:50%;filter:blur(2px);"></div>
    </div>`,
  })
}

const TILES = {
  dark: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attr: '© OpenStreetMap contributors © CARTO' },
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: '© Esri' },
} as const

function MapView({
  value,
  onChange,
  mapType = 'dark',
}: {
  value: UbicacionData | null
  onChange: (data: UbicacionData | null) => void
  mapType?: 'dark' | 'satellite'
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)
  const markerRef = useRef<unknown>(null)
  const tileRef = useRef<unknown>(null)
  const onChangeRef = useRef(onChange)
  const valueRef = useRef(value)

  useEffect(() => { onChangeRef.current = onChange }, [onChange])
  useEffect(() => { valueRef.current = value }, [value])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    let cancelled = false

    const initMap = async () => {
      const L = (await import('leaflet')).default

      if (cancelled || !mapRef.current) return

      const hasCoords = value?.lat && value?.lng
      const map = L.map(mapRef.current, {
        center: hasCoords ? [value.lat, value.lng] : DEFAULT_CENTER,
        zoom: hasCoords ? 17 : 4,
      })

      const t = TILES[mapType]
      const tile = L.tileLayer(t.url, { attribution: t.attr, maxZoom: 19 }).addTo(map)
      tileRef.current = tile

      const pinIcon = createPinIcon(L)

      if (hasCoords) {
        const marker = L.marker([value.lat, value.lng], { icon: pinIcon, draggable: true }).addTo(map)
        marker.on('dragend', async () => {
          const pos = marker.getLatLng()
          const addr = await reverseGeocode(pos.lat, pos.lng)
          const prev = valueRef.current
          onChangeRef.current({ lat: pos.lat, lng: pos.lng, descripcion: prev?.descripcion || '', ...addr })
        })
        markerRef.current = marker
      }

      map.on('click', async (e: { latlng: { lat: number; lng: number } }) => {
        const { lat, lng } = e.latlng
        if (markerRef.current) map.removeLayer(markerRef.current as L.Marker)
        const marker = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(map)
        marker.on('dragend', async () => {
          const pos = marker.getLatLng()
          const addr = await reverseGeocode(pos.lat, pos.lng)
          const prev = valueRef.current
          onChangeRef.current({ lat: pos.lat, lng: pos.lng, descripcion: prev?.descripcion || '', ...addr })
        })
        markerRef.current = marker
        const addr = await reverseGeocode(lat, lng)
        const prev = valueRef.current
        onChange({ lat, lng, descripcion: prev?.descripcion || '', ...addr })
      })

      mapInstanceRef.current = map
    }

    initMap()

    return () => {
      cancelled = true
      if (mapInstanceRef.current) {
        ;(mapInstanceRef.current as { remove: () => void }).remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const map = mapInstanceRef.current as { removeLayer: (l: unknown) => void; addLayer: (l: unknown) => void } | null
    if (!map || !tileRef.current) return
    map.removeLayer(tileRef.current)
    const t = TILES[mapType]
    let newTile: unknown = null
    import('leaflet').then((Lmod) => {
      newTile = Lmod.default.tileLayer(t.url, { attribution: t.attr, maxZoom: 19 })
      map.addLayer(newTile)
      tileRef.current = newTile
    })
  }, [mapType])

  useEffect(() => {
    const map = mapInstanceRef.current as { setView: (c: [number, number], z: number) => void } | null
    if (!map) return
    if (value?.lat && value?.lng) {
      const existing = markerRef.current as { getLatLng: () => { lat: number; lng: number } } | null
      if (existing) {
        const pos = existing.getLatLng()
        if (Math.abs(pos.lat - value.lat) < 0.000001 && Math.abs(pos.lng - value.lng) < 0.000001) return
      }
      map.setView([value.lat, value.lng], 17)
    }
  }, [value?.lat, value?.lng])

  return <div ref={mapRef} className="w-full h-full min-h-[300px] rounded-lg" />
}

const DynamicMap = dynamic(() => Promise.resolve(MapView), { ssr: false })

export default function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [results, setResults] = useState<Array<{ lat: string; lon: string; display_name: string }>>([])
  const [showResults, setShowResults] = useState(false)
  const [mapType, setMapType] = useState<'dark' | 'satellite'>('dark')

  const updateField = useCallback(
    (field: keyof UbicacionData, fieldValue: string) => {
      onChange({
        lat: value?.lat ?? 0,
        lng: value?.lng ?? 0,
        descripcion: value?.descripcion || '',
        calle: value?.calle || '',
        altura: value?.altura || '',
        localidad: value?.localidad || '',
        provincia: value?.provincia || '',
        pais: value?.pais || 'Argentina',
        [field]: fieldValue,
      })
    },
    [value, onChange]
  )

  const selectResult = async (r: { lat: string; lon: string }) => {
    const lat = parseFloat(r.lat)
    const lng = parseFloat(r.lon)
    const addr = await reverseGeocode(lat, lng)
    onChange({
      lat, lng,
      descripcion: value?.descripcion || '',
      ...addr,
    })
    setShowResults(false)
    setSearchQuery('')
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    setShowResults(false)

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&countrycodes=ar`
      )
      const data = await res.json()

      if (data.length === 1) {
        const addr = data[0].address || {}
        onChange({
          lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon),
          descripcion: value?.descripcion || '',
          calle: addr.road || '', altura: addr.house_number || '',
          localidad: addr.city || addr.town || addr.village || '',
          provincia: addr.state || '', pais: addr.country || 'Argentina',
        })
        setSearchQuery('')
      } else if (data.length > 1) {
        setResults(data)
        setShowResults(true)
      }
    } catch {} finally {
      setSearching(false)
    }
  }

  const handleClear = () => {
    onChange(null)
    setSearchQuery('')
    setShowResults(false)
  }

  const detectMyLocation = () => {
    if (!navigator.geolocation) return
    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        const addr = await reverseGeocode(lat, lng)
        onChange({ lat, lng, descripcion: value?.descripcion || '', ...addr })
        setDetecting(false)
      },
      () => { setDetecting(false) },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const fields: { key: keyof UbicacionData; label: string; placeholder: string }[] = [
    { key: 'descripcion', label: 'Descripción', placeholder: 'Ej: Cancha de fútbol 5' },
    { key: 'calle', label: 'Calle', placeholder: 'Nombre de la calle' },
    { key: 'altura', label: 'Altura', placeholder: 'Nro' },
    { key: 'localidad', label: 'Localidad', placeholder: 'Ciudad o localidad' },
    { key: 'provincia', label: 'Provincia', placeholder: 'Provincia' },
    { key: 'pais', label: 'País', placeholder: 'País' },
  ]

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <div className="flex-1 space-y-4">
        <div className="flex gap-2 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowResults(false) }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar dirección..."
            className="input-dark flex-1"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching}
            className="px-4 py-2 bg-accent-cyan/20 hover:bg-accent-cyan/30 border border-accent-cyan/50 rounded-lg text-accent-cyan text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
          >
            {searching ? (
              <span className="inline-block w-4 h-4 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
            ) : (
              'Buscar'
            )}
          </button>
          {showResults && results.length > 0 && (
            <div className="absolute top-full left-0 right-12 z-50 mt-1 bg-bg-card border border-border-dim rounded-lg shadow-2xl max-h-48 overflow-y-auto">
              {results.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectResult(r)}
                  className="w-full text-left px-4 py-2.5 text-sm text-text-secondary hover:bg-white/[0.05] hover:text-text-primary transition-colors border-b border-border-dim/30 last:border-0"
                >
                  {r.display_name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {fields.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs text-text-muted mb-1">{label}</label>
              <input
                type="text"
                value={value?.[key] || ''}
                onChange={(e) => updateField(key, e.target.value)}
                placeholder={placeholder}
                className="input-dark w-full"
              />
            </div>
          ))}

          <div className="flex items-center gap-4 text-xs">
            <span className="text-text-muted">Lat:</span>
            <span className="text-accent-cyan font-mono">{value?.lat?.toFixed(6) || '—'}</span>
            <span className="text-text-muted">Lng:</span>
            <span className="text-accent-cyan font-mono">{value?.lng?.toFixed(6) || '—'}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 bg-bg-card hover:bg-bg-secondary border border-border-dim rounded-lg text-text-muted text-sm transition-colors cursor-pointer"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={detectMyLocation}
            disabled={detecting}
            className="px-4 py-2 bg-accent-green/15 hover:bg-accent-green/25 border border-accent-green/30 rounded-lg text-accent-green text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            {detecting ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-block w-3.5 h-3.5 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
                Detectando...
              </span>
            ) : (
              '📍 Mi ubicación'
            )}
          </button>
        </div>

        <p className="text-xs text-text-muted italic">Hacé click en el mapa para ubicar el pin. Podés arrastrarlo para ajustar.</p>
      </div>

      <div className="flex-1 min-h-[300px] lg:min-h-[400px] rounded-lg overflow-hidden border border-border-dim relative">
        <DynamicMap value={value} onChange={onChange} mapType={mapType} />
        <button
          type="button"
          onClick={() => setMapType(mapType === 'dark' ? 'satellite' : 'dark')}
          className="absolute top-2 right-2 z-[1000] px-3 py-1.5 bg-bg-card/90 backdrop-blur-sm border border-border-dim hover:border-accent-cyan/50 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
        >
          {mapType === 'dark' ? (
            <>
              <svg className="w-3.5 h-3.5 text-accent-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
              <span className="text-text-secondary">Satélite</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 text-accent-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              <span className="text-text-secondary">Oscuro</span>
            </>
          )}
        </button>
        {value?.lat && value?.lng && (
          <div className="absolute bottom-2 left-2 right-2 z-[1000] bg-bg-card/90 backdrop-blur-sm border border-border-dim rounded-lg px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-accent-cyan font-mono">
              📌 {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
            </span>
            <span className="text-[10px] text-text-muted">Arrastrá el pin para ajustar</span>
          </div>
        )}
      </div>
    </div>
  )
}

