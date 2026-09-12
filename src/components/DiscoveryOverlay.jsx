import { COLLECTIBLE_COUNT } from '../data/collectibles.js'
import { formatTime } from '../game/engine.js'

export default function DiscoveryOverlay({ discovery, onContinue }) {
  if (!discovery) return null

  if (discovery.type === 'collectible') {
    return (
      <div className="modal-backdrop discovery">
        <div className="modal discovery-card collectible-found">
          <div className="sparkle">✨</div>
          <h2>Collectible Found!</h2>
          <div className="discovery-emoji">{discovery.emoji}</div>
          <p className="discovery-name">{discovery.name}</p>
          <p className="discovery-reward">+20 coins</p>
          <p className="muted">
            Collection: {discovery.collection} / {COLLECTIBLE_COUNT}
          </p>
          <button type="button" className="btn btn-primary" onClick={onContinue}>
            Continue
          </button>
        </div>
      </div>
    )
  }
  

  if (discovery.type === 'treasure') {
    return (
      <div className="modal-backdrop discovery">
        <div className="modal discovery-card treasure-found">
          <div className="sparkle">🏆</div>
          <h2>Treasure Found!</h2>
          <div className="discovery-emoji big">{discovery.treasure.emoji}</div>
          <p className="discovery-name">{discovery.treasure.name}</p>
          <p className="muted">You can end the run whenever you want.</p>
          <p className="muted">Time: {formatTime(discovery.timeMs)}</p>
          <button type="button" className="btn btn-primary" onClick={onContinue}>
            Continue
          </button>
        </div>
      </div>
    )
  }

  return null
}
