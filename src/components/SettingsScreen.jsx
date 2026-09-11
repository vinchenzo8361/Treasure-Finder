import { useState } from 'react'

export default function SettingsScreen({ onBack, onReset }) {
  const [confirm, setConfirm] = useState(false)

  return (
    <div className="panel-screen">
      <div className="panel-card">
        <header className="modal-header">
          <h2>Settings</h2>
          <button type="button" className="btn" onClick={onBack}>
            Back
          </button>
        </header>

        <p className="muted">
          Controls: WASD or Arrow keys to move. E, Space, or click to interact (dig, pick up sand,
          enter shop, dispose sand).
        </p>

        <div className="settings-danger">
          <h3>Reset Game</h3>
          <p className="muted">
            Clears collectibles, equipment, sand capacity, money, trophy room, and all statistics.
            This cannot be undone.
          </p>
          {!confirm ? (
            <button type="button" className="btn btn-danger" onClick={() => setConfirm(true)}>
              Reset Game…
            </button>
          ) : (
            <div className="confirm-row">
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  onReset()
                  setConfirm(false)
                }}
              >
                Yes, erase everything
              </button>
              <button type="button" className="btn" onClick={() => setConfirm(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
