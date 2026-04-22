import './SearchInput.css'

interface SearchInputProps {
  query: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  flash: 'correct' | null
}

export default function SearchInput({ query, onChange, flash }: SearchInputProps) {
  return (
    <input
      className={`search-input ${flash === 'correct' ? 'search-input--correct' : ''}`}
      value={query}
      onChange={onChange}
      placeholder="Type a building name..."
    />
  )
}