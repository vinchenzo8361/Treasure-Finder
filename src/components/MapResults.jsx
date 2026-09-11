import { formatTime } from '../game/engine.js'
import { COLLECTIBLE_COUNT, getCollectible } from '../data/collectibles.js'

export default function MapResults({ results, onNewMap, onTrophy, onViewMap }) {
  if (!results) return null
  const cols = results.collectiblesFound || []

  return (
    <div className="panel-screen results-screen">
      <div className="panel-card">
        <div className="results-hero">
          <div className="results-emoji">{results.treasure?.emoji || '🏆'}</div>
          <h2>Map Complete</h2>
          <p className="results-treasure">{results.treasure?.name}</p>
          <p className="muted">MAP {results.mapId}</p>
        </div>

        <div className="stats-grid">
          <Stat label="Time" value={formatTime(results.timeMs)} />
          <Stat label="Digs" value={results.digs} />
          <Stat label="Distance" value={`${results.distance}m`} />
          <Stat label="Exploration" value={`${results.exploration}%`} />
          <Stat label="Coins from holes" value={results.coinsFromHoles} />
          <Stat label="Collectible coins" value={results.coinsFromCollectibles} />
          <Stat label="Sand coins" value={results.coinsFromSand} />
          <Stat label="Sand collected" value={results.sandCollected} />
          <Stat label="Sand disposed" value={results.sandDisposed} />
          <Stat label="Money spent" value={results.moneySpent} />
          <Stat label="Money remaining" value={results.moneyRemaining} />
          <Stat label="Equipment" value={results.equipmentName} />
          <Stat label="Sand capacity" value={results.sandCapacity} />
          <Stat
            label="Collection"
            value={`${results.collectionTotal} / ${COLLECTIBLE_COUNT}`}
          />
        </div>

        {cols.length > 0 && (
          <div className="results-cols">
            <h3>Collectibles this map</h3>
            <ul>
              {cols.map((id) => {
                const c = getCollectible(id)
                return (
                  <li key={id}>
                    {c?.emoji} {c?.name || id}
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        <div className="menu-actions">
          <button type="button" className="btn btn-primary" onClick={onNewMap}>
            New Map
          </button>
          <button type="button" className="btn" onClick={onViewMap}>
            View Map
          </button>
          <button type="button" className="btn" onClick={onTrophy}>
            Trophy Room
          </button>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
