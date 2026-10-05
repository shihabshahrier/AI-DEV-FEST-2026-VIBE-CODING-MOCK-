export default function Toast({ message }) {
  if (!message) return null

  return (
    <div className="toast-container" aria-live="polite">
      <div key={message.id} className="toast-pill">
        <span className="toast-text">{message.text}</span>
      </div>
    </div>
  )
}
