import { COLLECTIBLES, COLLECTIBLE_COUNT } from '../data/collectibles.js'

export default function CollectionScreen({ state, onBack }) {
  const found = new Set(state.progress.collectedIds || [])
  const count = found.size
  const complete = count >= COLLECTIBLE_COUNT

  return (
    <div className="panel-screen">
      <div className="panel-card wide">
        <header className="modal-header">
          <div>
            <h2>Collection</h2>
            <p className="muted">
              {count} / {COLLECTIBLE_COUNT} FOUND
            </p>
          </div>
          <button type="button" className="btn" onClick={onBack}>
            Back
          </button>
        </header>

        {complete && (
          <div className="collection-complete">
            COLLECTION COMPLETE! You've discovered every collectible.
          </div>
        )}

        <div className="collection-grid">
          {COLLECTIBLES.map((c) => {
            const owned = found.has(c.id)
            return (
              <div key={c.id} className={`collect-card ${owned ? 'found' : 'locked'}`}>
                <div className="collect-emoji">{owned ? c.emoji : '?'}</div>
                <div className="collect-name">{owned ? c.name : '???'}</div>
                <div className="collect-desc">{owned ? c.description : 'Not yet discovered'}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
