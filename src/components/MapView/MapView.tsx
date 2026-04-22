import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import * as Constants from '../../constants'
import { allowedFacNames } from '../../lib/building'
import type { ResolvedBuilding } from '../../types'
import type { FeatureCollection, Polygon } from 'geojson'
import testingBoundsRaw from '../../data/testing_bounds.json'

const testingBounds = testingBoundsRaw as FeatureCollection
const campusGeometry = testingBounds.features[0].geometry as Polygon

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

interface MapViewProps {
  guessed: Map<string, ResolvedBuilding>
}

export default function MapView({ guessed }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/philip-de-leon/cmo993j92000001spgrdz2vma',
      center: [-122.30551, 47.65683],
      zoom: 13.5,
      config: {
        basemap: {
          showBuildings: false
        }
      }
    })

    map.current.on('load', () => {
        map.current!.setConfigProperty('basemap', 'colorBuildings', 'rgba(0,0,0,0)')
        map.current!.flyTo({
            center: [-122.3035, 47.6553],
            zoom: 15.13,
            duration: 3000,  // milliseconds
          })


      const mask = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]],
              campusGeometry.coordinates[0]
            ]
          }
        }]
      }

      map.current!.addSource('mask', { type: 'geojson', data: mask as any })
      map.current!.addLayer({
        id: 'mask-layer',
        type: 'fill',
        source: 'mask',
        paint: {
          'fill-color': '#1a0636',
          'fill-opacity': 0.95,
        }
      })

      fetch(
        `${Constants.UW_LAYER_URL}/query?` +
        `&geometryType=esriGeometryEnvelope` +
        `&spatialRel=esriSpatialRelIntersects` +
        `&inSR=4326` +
        `&outFields=*&f=geojson`
      )
        .then(r => r.json())
        .then(data => {
          const filtered = {
            ...data,
            features: data.features.filter((f: any) =>
              allowedFacNames.has(f.properties.FacName)
            ),
          }

          map.current!.addSource('uw-buildings', { type: 'geojson', data: filtered })

          map.current!.addLayer({
            id: 'uw-buildings-fill',
            type: 'fill',
            source: 'uw-buildings',
            paint: {
              'fill-color': '#a1a09f',
              'fill-opacity': 1,
              'fill-outline-color': 'rgba(0,0,0,0)',
            },
          })

          map.current!.addLayer({
            id: 'uw-buildings-guessed',
            type: 'fill',
            source: 'uw-buildings',
            paint: {
              'fill-color': '#80d98f',
              'fill-opacity': 0.85,
              'fill-outline-color': 'rgba(0,0,0,0)',
            },
            filter: ['in', ['get', 'FacName'], ['literal', []]],
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
              'text-halo-color': Constants.UW_PURPLE,
              'text-halo-width': 1.5,
            },
            filter: ['in', ['get', 'FacName'], ['literal', []]],
          })
        })
    })

    return () => map.current?.remove()
  }, [])

  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return
    if (!map.current.getLayer('uw-buildings-guessed')) return

    const toHighlight: string[] = []
    guessed.forEach(resolved => {
      resolved.highlightNames.forEach(n => toHighlight.push(n))
    })

    map.current.setFilter('uw-buildings-guessed', [
      'in', ['get', 'FacName'], ['literal', toHighlight],
    ])
    map.current.setFilter('uw-buildings-labels', [
      'in', ['get', 'FacName'], ['literal', toHighlight],
    ])
  }, [guessed])

  return (
    <div
      ref={mapContainer}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    />
  )
}