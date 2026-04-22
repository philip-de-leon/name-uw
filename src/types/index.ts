// src/types/index.ts
export interface BuildingEntry {
    FacName: string
    Aliases: string
    DisplayPrefferedName: string
    ChildBuildings: string
  }
  
  export interface ResolvedBuilding {
    facName: string
    displayName: string
    highlightNames: string[]
  }