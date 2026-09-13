import { useEffect, useRef } from 'react'
import { EQUIPMENT, getEquipment, formatTime } from '../game/engine.js'
import { COLLECTIBLE_COUNT } from '../data/collectibles.js'
import { drawRunMap } from '../game/renderer.js'

export default function HUD({ state, onMenu, onAdminToggle, onDebugStatsToggle, onEndRun, onAddMoney, onEquipmentChange }) {
  const { progress, map, player, timerMs, digging } = state
  const selectedLevel = progress.selectedEquipmentLevel ?? progress.equipmentLevel ?? 1
  const eq = getEquipment(selectedLevel)
  const purchasedLevels = EQUIPMENT.slice(0, Math.max(1, progress.equipmentLevel || 1))

  return (
    <div className="hud">
      {map?.bigMap && <BigMapMinimap state={state} />}
      <div className="hud-left">
        <div className="hud-chip" title="Money">
          <span className="hud-ico">🪙</span>
          <strong>{formatMoney(progress.money)}</strong>
        </div>
        <div className="hud-chip" title="Sand carried">
          <span className="hud-ico">🏖️</span>
          <strong>
            {player.carriedSand} / {progress.sandCapacity}
          </strong>
        </div>
        <div className="hud-chip" title="Collection">
          <span className="hud-ico">💎</span>
          <strong>
            {progress.collectedIds.length} / {COLLECTIBLE_COUNT}
          </strong>
        </div>
      </div>

      <div className="hud-center">
        {map && (
          <div className="hud-map">
            MAP {map.mapId}
          </div>
        )}
        <div className="hud-timer">{formatTime(timerMs)}</div>
      </div>

      <div className="hud-right">
        <div className="hud-chip tool-selector-chip">
          <span className="hud-ico">🛠️</span>
          <select
            className="tool-selector"
            value={selectedLevel}
            onChange={(event) => onEquipmentChange(Number(event.target.value))}
            aria-label="Choose dig tool"
          >
            {purchasedLevels.map((tool) => (
              <option key={tool.id} value={tool.id}>
                {tool.name}
              </option>
            ))}
          </select>
          <span className="hud-sub">{eq.digTime.toFixed(1)}s</span>
        </div>
        <div className="hud-chip" title="Digs this map">
          <span className="hud-ico">🕳️</span>
          <strong>{state.runStats?.digs || 0}</strong>
        </div>
        <button type="button" className="hud-btn" onClick={onMenu}>
          Menu
        </button>
      </div>

      {digging && (
        <div className="dig-overlay">
          <div className="dig-card">
            <div className="dig-title">LOADING…</div>
            <div className="dig-tool">{digging.tool} • digging</div>
            <div className="dig-bar">
              <div
                className="dig-bar-fill"
                style={{ width: `${Math.min(100, (digging.elapsed / digging.duration) * 100)}%` }}
              />
            </div>
            <div className="dig-time">
              {(digging.duration - digging.elapsed).toFixed(1)}s
            </div>
          </div>
        </div>
      )}

      {state.toast && (
        <div className="toast">{state.toast.text}</div>
      )}

      <div className="hud-hint">
        WASD / Arrows to move · E or Space / Click to dig, pick up sand, shop & dispose
      </div>

      {state.treasureFound && !state.results && (
        <button type="button" className="end-run-btn" onClick={onEndRun}>
          End Run
        </button>
      )}

      {state.adminMode && (
        <button type="button" className="debug-stats-btn" onClick={onDebugStatsToggle}>
          Debug Stats
        </button>
      )}

      {state.adminMode && (
        <button type="button" className="money-btn" onClick={onAddMoney}>
          Money
        </button>
      )}

      <button
        type="button"
        className={`admin-btn ${state.adminMode ? 'admin-btn-on' : ''}`}
        onClick={onAdminToggle}
      >
        {state.adminMode ? 'Admin ON' : 'Admin Mode'}
      </button>
    </div>
  )
}

function BigMapMinimap({ state }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !state.map) return

    const ctx = canvas.getContext('2d')
    const run = {
      ...state.map,
      holes: state.map.holes || {},
      collectibleCells: state.map.collectibleCells || {},
      placedCollectibles: state.map.placedCollectibles || [],
      tiles: Array.from(state.map.tiles),
    }

    drawRunMap(ctx, run, canvas.width, canvas.height, {
      showTreasure: false,
      player: state.player,
    })
  }, [state.map, state.player])

  return (
    <div className="big-map-minimap">
      <div className="big-map-minimap-label">Big Map</div>
      <canvas ref={canvasRef} width={160} height={160} />
    </div>
  )
}

function formatMoney(n) {
  if (Number.isInteger(n)) return String(n)
  return n.toFixed(1)
}
