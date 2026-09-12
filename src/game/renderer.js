import { CELL, WORLD_COLS, WORLD_ROWS, TILE, PLAYER_RADIUS } from './constants.js'
import { getTile } from './mapGenerator.js'

const SAND_A = '#e6c98a'
const SAND_B = '#d9b86c'
const SAND_C = '#c9a65a'
const WATER = '#3a8fb5'
const WATER_DEEP = '#2a6f94'
const SHOP_GROUND = '#8b6b45'
const BRIDGE = '#a67c52'
const HOLE = '#5c4030'

export function drawWorld(ctx, state, camera, w, h) {
  const { map, player, digging, floating } = state
  if (!map) return

  ctx.clearRect(0, 0, w, h)

  // Ocean background
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, '#4aa3c7')
  grad.addColorStop(1, WATER_DEEP)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // Soft water shimmer
  ctx.save()
  ctx.translate(-camera.x, -camera.y)
  drawWaterShimmer(ctx, camera, w, h)

  // Tiles
  const minX = Math.max(0, Math.floor(camera.x / CELL) - 1)
  const maxX = Math.min(WORLD_COLS - 1, Math.ceil((camera.x + w) / CELL) + 1)
  const minY = Math.max(0, Math.floor(camera.y / CELL) - 1)
  const maxY = Math.min(WORLD_ROWS - 1, Math.ceil((camera.y + h) / CELL) + 1)

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      drawTile(ctx, map, x, y)
    }
  }

  // Decorations
  for (const d of map.decorations || []) {
    const px = d.x * CELL
    const py = d.y * CELL
    if (px < camera.x - CELL || py < camera.y - CELL || px > camera.x + w + CELL || py > camera.y + h + CELL) continue
    drawDecoration(ctx, d)
  }

  // Sand piles
  for (const k of Object.keys(map.sandPiles || {})) {
    if (!map.sandPiles[k]) continue
    const [x, y] = k.split(',').map(Number)
    drawSandPile(ctx, x, y)
  }

  // Digging progress ring
  if (digging) {
    const cx = (digging.gx + 0.5) * CELL
    const cy = (digging.gy + 0.5) * CELL
    const p = digging.elapsed / digging.duration
    ctx.beginPath()
    ctx.arc(cx, cy, CELL * 0.45, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,220,120,0.9)'
    ctx.lineWidth = 4
    ctx.stroke()
  }

  // Shop & disposal markers
  drawShopBuilding(ctx)
  drawDisposal(ctx)
  drawBridgeRails(ctx)

  if (state.adminMode && state.adminBlock?.active) {
    drawAdminBlock(ctx, state.adminBlock)
  }

  if (state.adminMode && map.treasure) {
    drawTreasureXray(ctx, map.treasure)
  }

  if (state.adminMode && map.collectibleCells) {
    for (const [keyValue, id] of Object.entries(map.collectibleCells)) {
      drawCollectibleXray(ctx, keyValue, id)
    }
  }

  // Player
  drawPlayer(ctx, player, digging)

  // Floating text
  for (const f of floating || []) {
    ctx.globalAlpha = Math.min(1, f.life)
    ctx.fillStyle = f.color || '#fff'
    ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(f.text, f.x, f.y)
    ctx.globalAlpha = 1
  }

  ctx.restore()
}

function drawWaterShimmer(ctx, camera, w, h) {
  ctx.fillStyle = 'rgba(255,255,255,0.04)'
  const t = Date.now() / 1000
  for (let i = 0; i < 12; i++) {
    const x = camera.x + ((i * 97 + t * 18) % (w + 80)) - 40
    const y = camera.y + ((i * 53 + Math.sin(t + i) * 20) % (h + 60))
    ctx.beginPath()
    ctx.ellipse(x, y, 30, 6, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawTile(ctx, map, x, y) {
  const t = getTile(map, x, y)
  const px = x * CELL
  const py = y * CELL
  const k = `${x},${y}`

  if (t === TILE.WATER) return

  if (t === TILE.SAND) {
    const hash = (x * 17 + y * 31) % 3
    ctx.fillStyle = hash === 0 ? SAND_A : hash === 1 ? SAND_B : SAND_C
    ctx.fillRect(px, py, CELL + 0.5, CELL + 0.5)
    // Shore darkening near water
    const nearWater =
      getTile(map, x - 1, y) === TILE.WATER ||
      getTile(map, x + 1, y) === TILE.WATER ||
      getTile(map, x, y - 1) === TILE.WATER ||
      getTile(map, x, y + 1) === TILE.WATER
    if (nearWater) {
      ctx.fillStyle = 'rgba(180,140,80,0.25)'
      ctx.fillRect(px, py, CELL, CELL)
    }
    if (map.holes[k]) {
      drawHole(ctx, px, py)
    }
    return
  }

  if (t === TILE.SHOP_GROUND || t === TILE.SHOP_BUILDING || t === TILE.DISPOSAL) {
    ctx.fillStyle = SHOP_GROUND
    ctx.fillRect(px, py, CELL + 0.5, CELL + 0.5)
    ctx.fillStyle = 'rgba(0,0,0,0.08)'
    if ((x + y) % 2 === 0) ctx.fillRect(px, py, CELL, CELL)
    return
  }

  if (t === TILE.BRIDGE) {
    ctx.fillStyle = BRIDGE
    ctx.fillRect(px, py, CELL + 0.5, CELL + 0.5)
    ctx.strokeStyle = 'rgba(60,40,20,0.35)'
    ctx.beginPath()
    ctx.moveTo(px, py + CELL * 0.3)
    ctx.lineTo(px + CELL, py + CELL * 0.3)
    ctx.moveTo(px, py + CELL * 0.7)
    ctx.lineTo(px + CELL, py + CELL * 0.7)
    ctx.stroke()
  }
}

function drawHole(ctx, px, py) {
  const cx = px + CELL / 2
  const cy = py + CELL / 2
  ctx.beginPath()
  ctx.ellipse(cx, cy + 1, CELL * 0.38, CELL * 0.32, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(40,25,15,0.35)'
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(cx, cy, CELL * 0.34, CELL * 0.28, 0, 0, Math.PI * 2)
  ctx.fillStyle = HOLE
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(cx - 3, cy - 3, CELL * 0.12, CELL * 0.08, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,220,160,0.15)'
  ctx.fill()
  // Rim
  ctx.beginPath()
  ctx.ellipse(cx, cy, CELL * 0.34, CELL * 0.28, 0, 0, Math.PI * 2)
  ctx.strokeStyle = '#a07848'
  ctx.lineWidth = 2
  ctx.stroke()
}

function drawSandPile(ctx, x, y) {
  const cx = (x + 0.5) * CELL
  const cy = (y + 0.55) * CELL
  // Larger, darker mounds so they stand out from undug sand
  ctx.beginPath()
  ctx.ellipse(cx, cy + 6, 16, 7, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(cx - 16, cy + 4)
  ctx.quadraticCurveTo(cx, cy - 18, cx + 16, cy + 4)
  ctx.closePath()
  ctx.fillStyle = '#8a6230'
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(cx - 12, cy + 3)
  ctx.quadraticCurveTo(cx, cy - 12, cx + 12, cy + 3)
  ctx.closePath()
  ctx.fillStyle = '#a87838'
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(cx - 7, cy + 1)
  ctx.quadraticCurveTo(cx - 1, cy - 7, cx + 6, cy + 1)
  ctx.closePath()
  ctx.fillStyle = '#c49248'
  ctx.fill()
  // Rim outline for clarity
  ctx.beginPath()
  ctx.moveTo(cx - 16, cy + 4)
  ctx.quadraticCurveTo(cx, cy - 18, cx + 16, cy + 4)
  ctx.strokeStyle = 'rgba(50, 30, 10, 0.55)'
  ctx.lineWidth = 1.5
  ctx.stroke()
}

function drawDecoration(ctx, d) {
  const cx = (d.x + 0.5) * CELL
  const cy = (d.y + 0.5) * CELL
  if (d.type === 'rock') {
    ctx.fillStyle = '#8a8070'
    ctx.beginPath()
    ctx.ellipse(cx, cy + 2, 7, 5, 0, 0, Math.PI * 2)
    ctx.fill()
  } else if (d.type === 'plant') {
    ctx.strokeStyle = '#4a8f4a'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(cx, cy + 4)
    ctx.quadraticCurveTo(cx - 6, cy - 4, cx - 2, cy - 10)
    ctx.moveTo(cx, cy + 4)
    ctx.quadraticCurveTo(cx + 6, cy - 2, cx + 3, cy - 9)
    ctx.stroke()
  } else if (d.type === 'shell') {
    ctx.fillStyle = '#f0e0d0'
    ctx.beginPath()
    ctx.arc(cx, cy, 3, 0, Math.PI * 2)
    ctx.fill()
  } else if (d.type === 'crate') {
    ctx.fillStyle = '#7a5530'
    ctx.fillRect(cx - 6, cy - 6, 12, 12)
    ctx.strokeStyle = '#5a3a18'
    ctx.strokeRect(cx - 6, cy - 6, 12, 12)
  } else if (d.type === 'palm') {
    ctx.fillStyle = '#6b4423'
    ctx.fillRect(cx - 2, cy - 4, 4, 14)
    ctx.fillStyle = '#3d8f3d'
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2
      ctx.beginPath()
      ctx.ellipse(cx + Math.cos(a) * 8, cy - 8 + Math.sin(a) * 3, 8, 3, a, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function drawShopBuilding(ctx) {
  const x = 5 * CELL
  const y = 13.2 * CELL
  const w = 5 * CELL
  const h = 4.2 * CELL
  // Barn body
  ctx.fillStyle = '#a65d3a'
  ctx.fillRect(x, y + 18, w, h - 10)
  // Roof
  ctx.beginPath()
  ctx.moveTo(x - 6, y + 22)
  ctx.lineTo(x + w / 2, y)
  ctx.lineTo(x + w + 6, y + 22)
  ctx.closePath()
  ctx.fillStyle = '#6b3a22'
  ctx.fill()
  // Door
  ctx.fillStyle = '#3d2818'
  ctx.fillRect(x + w * 0.35, y + 28, w * 0.3, h - 20)
  // Glow at door so players know to interact
  ctx.fillStyle = 'rgba(255, 200, 80, 0.35)'
  ctx.beginPath()
  ctx.ellipse(x + w / 2, y + h + 4, 14, 5, 0, 0, Math.PI * 2)
  ctx.fill()
  // Sign
  ctx.fillStyle = '#f0d9a0'
  ctx.fillRect(x + w * 0.15, y + 12, w * 0.7, 14)
  ctx.fillStyle = '#5a3a18'
  ctx.font = 'bold 10px "Trebuchet MS", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('SHOP · E', x + w / 2, y + 22)
}

function drawDisposal(ctx) {
  const x = 5.45 * CELL
  const y = 20.15 * CELL
  ctx.fillStyle = '#5a6a70'
  ctx.fillRect(x, y, CELL * 2.95, CELL * 1.85)
  ctx.fillStyle = '#3a4a50'
  ctx.fillRect(x + 9, y + 6, CELL * 2.1, CELL * 1.0)
  ctx.fillStyle = '#8af0a0'
  ctx.beginPath()
  ctx.arc(x + CELL * 1.5, y + 11, 4.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#dfe8ec'
  ctx.font = 'bold 8px "Segoe UI", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('SAND BIN', x + CELL * 1.5, y + CELL * 1.55)
}

function drawAdminBlock(ctx, adminBlock) {
  const px = adminBlock.x * CELL
  const py = adminBlock.y * CELL

  ctx.fillStyle = 'rgba(255, 230, 120, 0.35)'
  ctx.fillRect(px - 2, py - 2, CELL + 4, CELL + 4)

  ctx.beginPath()
  ctx.ellipse(px + CELL / 2, py + CELL / 2, CELL * 0.85, CELL * 0.85, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255, 214, 80, 0.2)'
  ctx.fill()

  ctx.strokeStyle = '#ffe77a'
  ctx.lineWidth = 3
  ctx.strokeRect(px + 1, py + 1, CELL - 2, CELL - 2)

  ctx.fillStyle = '#f7bf4d'
  ctx.fillRect(px + 6, py + 6, CELL - 12, CELL - 12)

  ctx.fillStyle = '#fff1ad'
  ctx.fillRect(px + 10, py + 10, CELL - 20, CELL - 20)
}

function drawTreasureXray(ctx, treasure) {
  const cx = (treasure.x + 0.5) * CELL
  const cy = (treasure.y + 0.5) * CELL

  ctx.beginPath()
  ctx.arc(cx, cy, 14, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(46, 204, 113, 0.45)'
  ctx.fill()

  ctx.beginPath()
  ctx.arc(cx, cy, 7, 0, Math.PI * 2)
  ctx.fillStyle = '#2ee673'
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(cx, cy - 12)
  ctx.lineTo(cx + 6, cy - 18)
  ctx.lineTo(cx + 12, cy)
  ctx.lineTo(cx, cy + 12)
  ctx.lineTo(cx - 12, cy)
  ctx.lineTo(cx - 6, cy - 18)
  ctx.closePath()
  ctx.fillStyle = 'rgba(104, 255, 166, 0.95)'
  ctx.fill()
}

function drawCollectibleXray(ctx, keyValue, id) {
  const [x, y] = keyValue.split(',').map(Number)
  const cx = (x + 0.5) * CELL
  const cy = (y + 0.5) * CELL

  ctx.beginPath()
  ctx.arc(cx, cy, 11, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255, 89, 89, 0.42)'
  ctx.fill()

  ctx.beginPath()
  ctx.arc(cx, cy, 5, 0, Math.PI * 2)
  ctx.fillStyle = '#ff4d4d'
  ctx.fill()

  ctx.fillStyle = '#fff1f1'
  ctx.font = 'bold 8px "Segoe UI", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(id.slice(0, 1).toUpperCase(), cx, cy + 2)
}

function drawBridgeRails(ctx) {
  ctx.strokeStyle = '#6b4a2a'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(12 * CELL, 16 * CELL)
  ctx.lineTo(18 * CELL, 16 * CELL)
  ctx.moveTo(12 * CELL, 20 * CELL)
  ctx.lineTo(18 * CELL, 20 * CELL)
  ctx.stroke()
  // Plank lines across the wider bridge
  ctx.strokeStyle = 'rgba(60,40,20,0.35)'
  ctx.lineWidth = 1
  for (let x = 12; x <= 17; x++) {
    ctx.beginPath()
    ctx.moveTo(x * CELL, 16 * CELL)
    ctx.lineTo(x * CELL, 20 * CELL)
    ctx.stroke()
  }
}

function drawPlayer(ctx, player, digging) {
  const { x, y, facing } = player
  // Shadow
  ctx.beginPath()
  ctx.ellipse(x, y + 8, 9, 4, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.fill()

  // Body
  ctx.fillStyle = digging ? '#e8a060' : '#f0c090'
  ctx.beginPath()
  ctx.arc(x, y - 2, PLAYER_RADIUS, 0, Math.PI * 2)
  ctx.fill()

  // Hat
  ctx.fillStyle = '#c45c28'
  ctx.beginPath()
  ctx.ellipse(x, y - 10, 11, 4, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillRect(x - 6, y - 18, 12, 10)
  ctx.fillStyle = '#f5e6c8'
  ctx.fillRect(x - 6, y - 12, 12, 3)

  // Face direction
  ctx.fillStyle = '#2a2018'
  ctx.beginPath()
  ctx.arc(x + facing * 4, y - 3, 1.5, 0, Math.PI * 2)
  ctx.fill()

  // Tool hint while digging
  if (digging) {
    ctx.strokeStyle = '#8a6040'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x + facing * 8, y)
    ctx.lineTo(x + facing * 16, y + 8 + Math.sin(Date.now() / 80) * 4)
    ctx.stroke()
  }
}

/** Mini map for trophy room */
export function drawRunMap(ctx, run, w, h) {
  if (!run || !run.tiles) return
  const scaleX = w / (WORLD_COLS * CELL)
  const scaleY = h / (WORLD_ROWS * CELL)
  const scale = Math.min(scaleX, scaleY)
  const ox = (w - WORLD_COLS * CELL * scale) / 2
  const oy = (h - WORLD_ROWS * CELL * scale) / 2

  ctx.fillStyle = WATER
  ctx.fillRect(0, 0, w, h)

  const tiles = run.tiles
  for (let y = 0; y < WORLD_ROWS; y++) {
    for (let x = 0; x < WORLD_COLS; x++) {
      const t = tiles[y * WORLD_COLS + x]
      if (t === TILE.WATER) continue
      let color = SAND_A
      if (t === TILE.SHOP_GROUND || t === TILE.SHOP_BUILDING || t === TILE.DISPOSAL) color = SHOP_GROUND
      if (t === TILE.BRIDGE) color = BRIDGE
      ctx.fillStyle = color
      ctx.fillRect(ox + x * CELL * scale, oy + y * CELL * scale, CELL * scale + 0.5, CELL * scale + 0.5)
    }
  }

  // Holes
  ctx.fillStyle = HOLE
  for (const k of Object.keys(run.holes || {})) {
    const [x, y] = k.split(',').map(Number)
    ctx.beginPath()
    ctx.arc(ox + (x + 0.5) * CELL * scale, oy + (y + 0.5) * CELL * scale, 2.5 * scale * (CELL / 10), 0, Math.PI * 2)
    ctx.fill()
  }

  // Path
  if (run.path?.length > 1) {
    ctx.strokeStyle = 'rgba(255,80,60,0.7)'
    ctx.lineWidth = Math.max(1.5, 2 * scale * 8)
    ctx.lineJoin = 'round'
    ctx.beginPath()
    run.path.forEach((p, i) => {
      const px = ox + p.x * scale
      const py = oy + p.y * scale
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    })
    ctx.stroke()
  }

  // Start
  if (run.start) {
    ctx.fillStyle = '#4ade80'
    ctx.beginPath()
    ctx.arc(ox + run.start.x * scale, oy + run.start.y * scale, 5, 0, Math.PI * 2)
    ctx.fill()
  }

  // Treasure
  if (run.treasure) {
    ctx.fillStyle = '#fbbf24'
    ctx.beginPath()
    ctx.arc(
      ox + (run.treasure.x + 0.5) * CELL * scale,
      oy + (run.treasure.y + 0.5) * CELL * scale,
      6,
      0,
      Math.PI * 2,
    )
    ctx.fill()
    ctx.fillStyle = '#000'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('★', ox + (run.treasure.x + 0.5) * CELL * scale, oy + (run.treasure.y + 0.5) * CELL * scale + 3)
  }
}
