import { COLLECTIBLE_COUNT } from '../data/collectibles.js'
import { formatTime, getEquipment } from '../game/engine.js'

export default function MainMenu({ state, onPlay, onBigMap, onCollection, onTrophy, onSettings }) {
  const { progress } = state
  const eq = getEquipment(progress.equipmentLevel)
  const hasSave = progress.mapsCompleted > 0 || progress.collectedIds.length > 0 || progress.money > 0 || progress.equipmentLevel > 1

  return (
    <div className="panel-screen menu-screen">
      <div className="menu-bg" />
      <div className="menu-card">
        <p className="menu-eyebrow">Island Exploration</p>
        <h1 className="menu-title">Buried Treasure</h1>
        <p className="menu-tagline">
          Dig the sand. Find the fortune. Collect all 25 relics.
        </p>

        <div className="menu-stats">
          <div>
            <span>Collection</span>
            <strong>
              {progress.collectedIds.length}/{COLLECTIBLE_COUNT}
            </strong>
          </div>
          <div>
            <span>Maps</span>
            <strong>{progress.mapsCompleted || 0}</strong>
          </div>
          <div>
            <span>Tool</span>
            <strong>{eq.name}</strong>
          </div>
          {progress.bestTimeMs != null && (
            <div>
              <span>Best</span>
              <strong>{formatTime(progress.bestTimeMs)}</strong>
            </div>
          )}
        </div>

        <div className="menu-actions">
          <button type="button" className="btn btn-primary" onClick={onPlay}>
            {hasSave ? 'Continue Digging' : 'Start Digging'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onBigMap}>
            Big Map
          </button>
          <button type="button" className="btn" onClick={onCollection}>
            Collection
          </button>
          <button type="button" className="btn" onClick={onTrophy}>
            Trophy Room
          </button>
          <button type="button" className="btn btn-ghost" onClick={onSettings}>
            Settings
          </button>
        </div>
      </div>
    </div>
  )
}
