import { useState, useCallback } from 'react'
import {
  createInitialState,
  startNewMap,
  dismissDiscovery,
  buyEquipment,
  buySandCapacity,
  fullReset,
} from './game/engine.js'
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

  const goMenu = useCallback(() => {
    setState((s) => ({ ...s, screen: 'menu', shopOpen: false }))
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
          }))
        }
      />
      {state.shopOpen && (
        <ShopModal
          state={state}
          onBuyEquipment={() => setState((s) => buyEquipment(s))}
          onBuyCapacity={() => setState((s) => buySandCapacity(s))}
          onClose={() => setState((s) => ({ ...s, shopOpen: false }))}
        />
      )}
      <DiscoveryOverlay
        discovery={state.discovery}
        onContinue={() => setState((s) => dismissDiscovery(s))}
      />
    </div>
  )
}
