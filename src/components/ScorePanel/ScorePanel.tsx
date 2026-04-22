import './ScorePanel.css'

interface ScorePanelProps {
  score: number
  total: number
  pct: number
}

export default function ScorePanel({ score, total, pct }: ScorePanelProps) {
  return (
    <div className="score-panel">
      <div className="score-panel-row">
        <span>{score} / {total} buildings</span>
        <span className="score-panel-pct">{pct}%</span>
      </div>
      <div className="score-panel-bar-track">
        <div
          className="score-panel-bar-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}