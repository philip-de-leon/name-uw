import './QuizPanel.css'

export default function QuizPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="quiz-panel">
      {children}
    </div>
  )
}