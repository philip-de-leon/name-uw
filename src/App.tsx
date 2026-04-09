import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

const UW_PURPLE = '#4b2e83'
const UW_GOLD = '#b7a57a'


const UW_LAYER_URL =
  'https://gis.maps.uw.edu/federated/rest/services/' +
  'BaseComponents/UW_Seattle_Buildings_and_Paths/' +
  'FeatureServer/1'

export default function App() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const allBuildings = useRef<string[]>([])
  const [query, setQuery] = useState('')
  const [guessed, setGuessed] = useState<Set<string>>(new Set())
  const [flash, setFlash] = useState<'correct' | null>(null)

  useEffect(() => {

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-122.3035, 47.6553],
      zoom: 15,
    })

    map.current.on('load', () => {
      fetch(
        `${UW_LAYER_URL}/query?` +
        `&geometryType=esriGeometryEnvelope` +
        `&spatialRel=esriSpatialRelIntersects` +
        `&inSR=4326` +
        `&outFields=*&f=geojson`
      )
        .then(r => r.json())
        .then(data => {
          allBuildings.current = [
            ...new Set(
              data.features
                .map((f: any) => f.properties.FacName)
                .filter(Boolean)
            )
          ] as string[]

          map.current!.addSource('uw-buildings', { type: 'geojson', data })

          map.current!.addLayer({
            id: 'uw-buildings-fill',
            type: 'fill',
            source: 'uw-buildings',
            paint: {
              'fill-color': UW_PURPLE,
              'fill-opacity': 0.35,
            },
          })

          map.current!.addLayer({
            id: 'uw-buildings-guessed',
            type: 'fill',
            source: 'uw-buildings',
            paint: {
              'fill-color': UW_GOLD,
              'fill-opacity': 0.85,
            },
            filter: ['in', ['get', 'FacName'], ['literal', []]],
          })

          map.current!.addLayer({
            id: 'uw-buildings-outline',
            type: 'line',
            source: 'uw-buildings',
            paint: {
              'line-color': UW_PURPLE,
              'line-width': 1.2,
            },
          })
          
          map.current!.addLayer({
            id: 'uw-buildings-labels',
            type: 'symbol',
            source: 'uw-buildings',
            layout: {
              'text-field': ['coalesce', ['get', 'FacName'], ''],
              'text-size': 10,
              'text-anchor': 'center',
              'text-max-width': 8,
            },
            paint: {
              'text-color': '#ffffff',
              'text-halo-color': UW_PURPLE,
              'text-halo-width': 1.5,
            },
          })
        })
    })

    return () => map.current?.remove()
  }, [])

  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return
    if (!map.current.getLayer('uw-buildings-guessed')) return

    map.current.setFilter('uw-buildings-guessed', [
      'in', ['get', 'FacName'], ['literal', [...guessed]],
    ])
  }, [guessed])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    const normalized = value.toLowerCase().trim()
    const match = allBuildings.current.find(
      (name: string) => name.toLowerCase() === normalized
    )

    if (match && !guessed.has(match)) {
      setGuessed(prev => new Set([...prev, match]))
      setQuery('')
      setFlash('correct')
      setTimeout(() => setFlash(null), 800)

      const features = map.current!.querySourceFeatures('uw-buildings', {
        filter: ['==', ['get', 'FacName'], match],
      })
      if (features.length > 0) {
        const coords = (features[0].geometry as any).coordinates[0]
        const bounds = coords.reduce(
          (b: mapboxgl.LngLatBounds, c: [number, number]) => b.extend(c),
          new mapboxgl.LngLatBounds(coords[0], coords[0])
        )
        map.current!.fitBounds(bounds, { padding: 300, maxZoom: 18 })
      }
    }
  }

  const total = allBuildings.current.length
  const score = guessed.size
  const pct = total > 0 ? Math.round((score / total) * 100) : 0

  return (
    <>
      <div
        ref={mapContainer}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <div style={{
        position: 'absolute',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        zIndex: 10,
        width: 320,
      }}>
        {/* Main card: header + input + score joined */}
        <div style={{
          width: '100%',
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
        }}>
          {/* UW header bar */}
          <div style={{
            background: UW_PURPLE,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: UW_GOLD,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 600, color: UW_PURPLE, flexShrink: 0,
            }}>W</div>
            <div>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>UW Campus Quiz</div>
              <div style={{ color: UW_GOLD, fontSize: 11 }}>Name every building on the map</div>
            </div>
          </div>

          {/* Input — flush inside the card */}
          <input
            value={query}
            onChange={handleInput}
            placeholder="Type a building name..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 14px',
              border: 'none',
              borderTop: `2px solid ${flash === 'correct' ? UW_GOLD : 'transparent'}`,
              borderBottom: '1px solid #e5e7eb',
              fontSize: 14,
              outline: 'none',
              transition: 'background 0.2s',
              background: flash === 'correct' ? '#f9f5e7' : '#fff',
              color: '#111',
              display: 'block',
            }}
          />

          {/* Score panel */}
          <div style={{
            background: '#fff',
            padding: '10px 14px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 13,
              marginBottom: 6,
              color: '#374151',
            }}>
              <span>{score} / {total} buildings</span>
              <span style={{ color: UW_PURPLE, fontWeight: 600 }}>{pct}%</span>
            </div>
            <div style={{
              height: 8,
              background: '#e5e7eb',
              borderRadius: 99,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${UW_PURPLE}, ${UW_GOLD})`,
                borderRadius: 99,
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        </div>

        {/* Guessed list — separate card below */}
        {guessed.size > 0 && (
          <div style={{
            width: '100%',
            maxHeight: 160,
            overflowY: 'auto',
            background: 'white',
            borderRadius: 8,
            padding: '8px 12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            fontSize: 12,
            boxSizing: 'border-box',
          }}>
            <div style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: UW_GOLD,
              marginBottom: 4,
            }}>Guessed</div>
            {([...guessed] as string[]).map((name: string) => (
              <div key={name} style={{ padding: '2px 0', color: UW_PURPLE }}>
                ✓ {name}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}