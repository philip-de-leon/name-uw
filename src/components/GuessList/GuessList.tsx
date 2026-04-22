import type { ResolvedBuilding } from '../../types'
import './GuessList.css'

export default function GuessList({ guessed }: { guessed: Map<string, ResolvedBuilding> }) {
  if (guessed.size === 0) return null

  return (
    <div className="guess-list-container">
      <div className="guess-list-header">Guessed</div>
      <div className="guess-list-items">
        {[...guessed.values()].map(resolved => (
          <div key={resolved.facName} className="guess-list-item">
            ✓ {resolved.displayName}
          </div>
        ))}
      </div>
    </div>
  )
}