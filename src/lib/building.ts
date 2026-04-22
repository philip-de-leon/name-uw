import buildingData from '../data/filtered_uw_buildings.json'
import type { BuildingEntry, ResolvedBuilding } from '../types/index.ts'

export const buildings = buildingData as BuildingEntry[]

export const allowedFacNames = new Set<string>(
  buildings.flatMap(b =>
    b.ChildBuildings !== 'N/A'
      ? [b.FacName, ...b.ChildBuildings.split(',').map(s => s.trim())]
      : [b.FacName]
  )
)

export function buildLookup(): Map<string, ResolvedBuilding> {
  const lookup = new Map<string, ResolvedBuilding>()

  buildings.forEach(b => {
    const childNames = b.ChildBuildings !== 'N/A'
      ? b.ChildBuildings.split(',').map(s => s.trim())
      : []

    const resolved: ResolvedBuilding = {
      facName: b.FacName,
      displayName: b.DisplayPrefferedName !== 'N/A' ? b.DisplayPrefferedName : b.FacName,
      highlightNames: [b.FacName, ...childNames],
    }

    lookup.set(b.FacName.toLowerCase(), resolved)
    if (b.DisplayPrefferedName !== 'N/A')
      lookup.set(b.DisplayPrefferedName.toLowerCase(), resolved)
    b.Aliases.split(',').map(a => a.trim()).forEach(alias => {
      if (alias) lookup.set(alias.toLowerCase(), resolved)
    })
  })

  return lookup
}

export const buildingLookup = buildLookup() 