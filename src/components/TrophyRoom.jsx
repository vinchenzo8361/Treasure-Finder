import { useEffect, useRef } from 'react'
import { formatTime } from '../game/engine.js'
import { COLLECTIBLE_COUNT } from '../data/collectibles.js'
import { drawRunMap } from '../game/renderer.js'

export default function TrophyRoom({ state, onBack, onViewRun }) {
  const maps = state.progress.completedMaps || []
  const best = state.progress.bestTimeMs

  return (
    <div className="panel-screen">
      <div className="panel-card wide">
        <header className="modal-header">
          <div>
            <h2>🏆 Trophy Room</h2>
            <p className="muted">Every completed island lives here.</p>
          </div>
          <button type="button" className="btn" onClick={onBack}>
            Back
          </button>
        </header>

        <div className="trophy-summary">
          <div>
            <span>Maps Completed</span>
            <strong>{maps.length}</strong>
          </div>
          <div>
            <span>Best Time</span>
            <strong>{best != null ? formatTime(best) : '—'}</strong>
          </div>
          <div>
            <span>Treasures</span>
            <strong>{maps.length}</strong>
          </div>
          <div>
            <span>Collectibles</span>
            <strong>
              {state.progress.collectedIds.length} / {COLLECTIBLE_COUNT}
            </strong>
          </div>
          <div>
            <span>Lifetime Earnings</span>
            <strong>{state.progress.totalCoinsEarned || 0}</strong>
          </div>
        </div>

        {maps.length === 0 ? (
          <p className="muted center">No completed maps yet. Find a treasure!</p>
        ) : (
          <div className="trophy-list">
            {[...maps].reverse().map((run, i) => (
              <div key={`${run.seed}-${run.completedAt}-${i}`} className="trophy-row">
                <div className="trophy-emoji">{run.treasure?.emoji || '🏆'}</div>
                <div className="trophy-info">
                  <strong>
                    MAP {run.mapId} · {run.treasure?.name}
                  </strong>
                  <div className="muted">
                    Time {formatTime(run.timeMs)} · Digs {run.digs} · Coins{' '}
                    {Math.round(
                      (run.coinsFromHoles || 0) +
                        (run.coinsFromCollectibles || 0) +
                        (run.coinsFromSand || 0),
                    )}{' '}
                    · Collectibles {run.collectiblesFound?.length || 0}
                  </div>
                </div>
                <button type="button" className="btn btn-sm" onClick={() => onViewRun(run)}>
                  View Run
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function TrophyDetail({ run, onBack }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !run) return
    const ctx = canvas.getContext('2d')
    const resize = () => {
      const parent = canvas.parentElement
      const w = parent?.clientWidth || 640
      const h = Math.min(420, Math.floor(w * 0.55))
      canvas.width = w
      canvas.height = h
      drawRunMap(ctx, run, w, h)
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [run])

  if (!run) return null

  return (
    <div className="panel-screen">
      <div className="panel-card wide">
        <header className="modal-header">
          <div>
            <h2>
              {run.treasure?.emoji} MAP {run.mapId}
            </h2>
            <p className="muted">{run.treasure?.name}</p>
          </div>
          <button type="button" className="btn" onClick={onBack}>
            Back
          </button>
        </header>

        <div className="run-map-wrap">
          <canvas ref={canvasRef} className="run-map-canvas" />
          <div className="run-legend">
            <span>
              <i className="leg start" /> Start
            </span>
            <span>
              <i className="leg path" /> Path
            </span>
            <span>
              <i className="leg hole" /> Holes
            </span>
            <span>
              <i className="leg treasure" /> Treasure
            </span>
          </div>
        </div>

        <div className="stats-grid">
          <Stat label="Time" value={formatTime(run.timeMs)} />
          <Stat label="Digs" value={run.digs} />
          <Stat label="Distance" value={`${run.distance}m`} />
          <Stat label="Exploration" value={`${run.exploration}%`} />
          <Stat label="Hole coins" value={run.coinsFromHoles} />
          <Stat label="Collectible coins" value={run.coinsFromCollectibles} />
          <Stat label="Sand coins" value={run.coinsFromSand} />
          <Stat label="Sand collected" value={run.sandCollected} />
          <Stat label="Sand disposed" value={run.sandDisposed} />
          <Stat label="Money spent" value={run.moneySpent} />
          <Stat label="Money left" value={run.moneyRemaining} />
          <Stat label="Equipment" value={run.equipmentName} />
          <Stat label="Sand capacity" value={run.sandCapacity} />
          <Stat label="Collectibles" value={run.collectiblesFound?.length || 0} />
          <Stat label="Collection" value={`${run.collectionTotal}/${COLLECTIBLE_COUNT}`} />
          <Stat label="Seed" value={run.seed} />
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
