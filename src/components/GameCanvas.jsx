import { useEffect, useRef, useCallback, useState } from 'react'
import { CELL, WORLD_COLS, WORLD_ROWS } from '../game/constants.js'
import { drawWorld } from '../game/renderer.js'
import { tick, tryInteract } from '../game/engine.js'

const VIEWPORT_ZOOM = 0.88

export default function GameCanvas({ state, setState }) {
  const canvasRef = useRef(null)
  const keysRef = useRef({})
  const stateRef = useRef(state)
  const lastRef = useRef(0)
  const [size, setSize] = useState({ w: 800, h: 600 })

  stateRef.current = state

  useEffect(() => {
    const onResize = () => {
      const w = Math.max(800, Math.round(window.innerWidth * VIEWPORT_ZOOM))
      const h = Math.max(600, Math.round(window.innerHeight * VIEWPORT_ZOOM))
      setSize({ w, h })
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const down = (e) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
      keysRef.current[k] = true
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault()
      if (e.key === 'e' || e.key === 'E' || e.key === ' ') {
        setState((s) => tryInteract(s))
      }
    }
    const up = (e) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
      keysRef.current[k] = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [setState])

  useEffect(() => {
    let raf
    const loop = (t) => {
      const last = lastRef.current || t
      const dt = Math.min(0.05, (t - last) / 1000)
      lastRef.current = t

      const s = stateRef.current
      if (s.screen === 'playing') {
        const next = tick(s, dt, keysRef.current)
        if (next !== s) setState(next)
      }

      const canvas = canvasRef.current
      if (canvas && s.map && (s.screen === 'playing' || s.screen === 'shop')) {
        const ctx = canvas.getContext('2d')
        const cam = {
          x: s.player.x - size.w / 2,
          y: s.player.y - size.h / 2,
        }
        const worldW = WORLD_COLS * CELL
        const worldH = WORLD_ROWS * CELL
        cam.x = Math.max(-40, Math.min(worldW - size.w + 40, cam.x))
        cam.y = Math.max(-40, Math.min(worldH - size.h + 40, cam.y))
        drawWorld(ctx, s, cam, size.w, size.h)
      }

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [setState, size.w, size.h])

  const onClick = useCallback(
    (e) => {
      setState((s) => tryInteract(s))
    },
    [setState],
  )

  return (
    <canvas
      ref={canvasRef}
      width={size.w}
      height={size.h}
      className="game-canvas"
      onClick={onClick}
    />
  )
}
