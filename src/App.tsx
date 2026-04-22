import { useState } from 'react'
import { buildings, buildingLookup } from './lib/building'
import type { ResolvedBuilding } from './types'
import MapView from './components/MapView/MapView'
import GuessList from './components/GuessList/GuessList'
import './css/App.css'
import NavBar from './components/NavBar/NavBar'
import SearchInput from './components/SearchInput/SearchInput'
import ScorePanel from './components/ScorePanel/ScorePanel'
import QuizPanel from './components/QuizPanel/QuizPanel'

export default function App() {
  const [query, setQuery] = useState('')
  const [guessed, setGuessed] = useState<Map<string, ResolvedBuilding>>(new Map())
  const [flash, setFlash] = useState<'correct' | null>(null)

  const total = buildings.length
  const score = guessed.size
  const pct = total > 0 ? Math.round((score / total) * 100) : 0

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    const normalized = value.toLowerCase().trim()
    const resolved = buildingLookup.get(normalized)

    if (resolved && !guessed.has(resolved.facName)) {
      const next = new Map(guessed)
      next.set(resolved.facName, resolved)
      setGuessed(next)
      setQuery('')
      setFlash('correct')
      setTimeout(() => setFlash(null), 800)
    }
  }

  return (
    <>
      <MapView guessed={guessed} />
      <div className="app-overlay">
        <NavBar />
        <div className="app-content">
          <QuizPanel>
            <SearchInput query={query} onChange={handleInput} flash={flash} />
            <ScorePanel score={score} total={total} pct={pct} />
          </QuizPanel>
          <GuessList guessed={guessed} />
        </div>
      </div>
    </>
  )
}