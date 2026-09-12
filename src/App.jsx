import { useState, useCallback } from 'react'
import {
  createInitialState,
  startNewMap,
  dismissDiscovery,
  buyEquipment,
  buySandCapacity,
  buyHint,
  fullReset,
  endRun,
} from './game/engine.js'
import { saveProgress } from './game/storage.js'
import GameCanvas from './components/GameCanvas.jsx'
import HUD from './components/HUD.jsx'
import MainMenu from './components/MainMenu.jsx'
import ShopModal from './components/ShopModal.jsx'
import CollectionScreen from './components/CollectionScreen.jsx'
import TrophyRoom, { TrophyDetail } from './components/TrophyRoom.jsx'
import MapResults from './components/MapResults.jsx'
import DiscoveryOverlay from './components/DiscoveryOverlay.jsx'
import SettingsScreen from './components/SettingsScreen.jsx'
import './App.css'

export default function App() {
  const [state, setState] = useState(() => createInitialState())

  const play = useCallback(() => {
    setState((s) => startNewMap(s))
  }, [])

  const toggleAdminMode = useCallback(() => {
    setState((s) => {
      if (s.adminMode) {
        return {
          ...s,
          adminMode: false,
          adminBlock: null,
          debugStatsOpen: false,
          toast: { text: 'Admin mode disabled.', life: 1.8 },
        }
      }

      const password = window.prompt('Enter admin password:')
      if (password !== '12345') {
        if (password !== null) {
          return {
            ...s,
            toast: { text: 'Invalid admin password.', life: 1.8 },
          }
        }
        return s
      }

      return {
        ...s,
        adminMode: true,
      }
    })
  }, [])

  const goMenu = useCallback(() => {
    setState((s) => ({
      ...s,
      screen: 'menu',
      shopOpen: false,
      adminMode: false,
      adminBlock: null,
      treasureFound: false,
      debugStatsOpen: false,
      digging: null,
    }))
  }, [])

  const addAdminMoney = useCallback(() => {
    setState((s) => {
      if (!s.adminMode) return s

      const progress = { ...s.progress, money: (s.progress.money || 0) + 1 }
      progress.totalCoinsEarned = (progress.totalCoinsEarned || 0) + 1

      const floating = [
        ...(s.floating || []),
        {
          id: `${Date.now()}-${Math.random()}`,
          x: s.player.x,
          y: s.player.y - 20,
          text: '+1',
          color: '#f5c842',
          life: 1.4,
        },
      ]

      saveProgress(progress)
      return { ...s, progress, floating }
    })
  }, [])

  const toggleDebugStats = useCallback(() => {
    setState((s) => ({
      ...s,
      debugStatsOpen: !s.debugStatsOpen,
    }))
  }, [])

  if (state.screen === 'menu') {
    return (
      <MainMenu
        state={state}
        onPlay={play}
        onCollection={() => setState((s) => ({ ...s, screen: 'collection' }))}
        onTrophy={() => setState((s) => ({ ...s, screen: 'trophy' }))}
        onSettings={() => setState((s) => ({ ...s, screen: 'settings' }))}
      />
    )
  }

  if (state.screen === 'collection') {
    return <CollectionScreen state={state} onBack={goMenu} />
  }

  if (state.screen === 'trophy') {
    return (
      <TrophyRoom
        state={state}
        onBack={goMenu}
        onViewRun={(run) => setState((s) => ({ ...s, screen: 'trophy_detail', viewingRun: run }))}
      />
    )
  }

  if (state.screen === 'trophy_detail') {
    return (
      <TrophyDetail
        run={state.viewingRun}
        onBack={() => setState((s) => ({ ...s, screen: 'trophy', viewingRun: null }))}
      />
    )
  }

  if (state.screen === 'settings') {
    return (
      <SettingsScreen
        onBack={goMenu}
        onReset={() => setState(fullReset())}
      />
    )
  }

  if (state.screen === 'results') {
    return (
      <MapResults
        results={state.results}
        onNewMap={play}
        onTrophy={() => setState((s) => ({ ...s, screen: 'trophy' }))}
        onViewMap={() =>
          setState((s) => ({
            ...s,
            screen: 'trophy_detail',
            viewingRun: s.results,
          }))
        }
      />
    )
  }

  // Playing
  return (
    <div className="game-root">
      <GameCanvas state={state} setState={setState} />
      <HUD
        state={state}
        onMenu={() =>
          setState((s) => ({
            ...s,
            screen: 'menu',
            shopOpen: false,
            digging: null,
            adminMode: false,
            adminBlock: null,
            treasureFound: false,
            debugStatsOpen: false,
          }))
        }
        onAdminToggle={toggleAdminMode}
        onDebugStatsToggle={toggleDebugStats}
        onEndRun={() => setState((s) => endRun(s))}
        onAddMoney={addAdminMoney}
      />
      {state.shopOpen && (
        <ShopModal
          state={state}
          onBuyEquipment={() => setState((s) => buyEquipment(s))}
          onBuyCapacity={() => setState((s) => buySandCapacity(s))}
          onBuyHint={() => setState((s) => buyHint(s))}
          onClose={() => setState((s) => ({ ...s, shopOpen: false }))}
        />
      )}
      {state.adminMode && state.debugStatsOpen && (
        <DebugStatsPanel state={state} onClose={() => setState((s) => ({ ...s, debugStatsOpen: false }))} />
      )}
      <DiscoveryOverlay
        discovery={state.discovery}
        onContinue={() => setState((s) => dismissDiscovery(s))}
      />
    </div>
  )
}

function DebugStatsPanel({ state, onClose }) {
  if (!state.map) return null

  const remainingDiggable = Math.max(0, state.map.diggableCount - (state.map.dugCount || 0))
  const remainingCoins = Object.keys(state.map.coinCells || {}).filter((k) => !state.map.holes?.[k]).length
  const remainingCollectibles = Object.keys(state.map.collectibleCells || {}).filter((k) => !state.map.holes?.[k]).length

  const stats = [
    ['Map ID', state.map.mapId],
    ['Map #', state.map.mapNumber],
    ['Treasure Found', state.treasureFound ? 'Yes' : 'No'],
    ['Collectibles Found', `${state.runStats.collectiblesFound.length}`],
    ['Collectibles Left', String(remainingCollectibles)],
    ['Remaining Diggable', String(remainingDiggable)],
    ['Remaining Coins', String(remainingCoins)],
    ['Current Money', formatMoney(state.progress.money)],
    ['Lifetime Earned', formatMoney(state.progress.totalCoinsEarned || 0)],
    ['Equipment', String(state.progress.equipmentLevel)],
    ['Sand Capacity', String(state.progress.sandCapacity)],
    ['Digs This Run', String(state.runStats.digs)],
    ['Time', formatTime(state.timerMs)],
    ['Distance', `${Math.round(state.runStats.distance)}m`],
    ['Hints Unlocked', String(state.hintLevel || 0)],
  ]

  return (
    <div className="modal-backdrop">
      <div className="modal debug-panel">
        <header className="modal-header">
          <div>
            <h2>Debug Stats</h2>
            <p className="muted">Admin-only diagnostics for this run.</p>
          </div>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="stats-grid">
          {stats.map(([label, value]) => (
            <div key={label} className="stat">
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function formatMoney(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function formatTime(ms) {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
