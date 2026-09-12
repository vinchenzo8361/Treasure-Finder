import { CELL, WORLD_COLS, WORLD_ROWS, TILE, COLLECTIBLE_ISLAND_CHANCE, COLLECTIBLES_PER_ISLAND } from './constants.js'
import { COLLECTIBLES } from '../data/collectibles.js'
import { TREASURES } from '../data/treasures.js'
import { createRng, pick, shuffle, formatMapId } from './rng.js'

function key(x, y) {
  return `${x},${y}`
}

function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < WORLD_COLS && y < WORLD_ROWS
}

function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by)
}

/**
 * Generate a complete playable island map from a seed.
 * @param {number} seed
 * @param {string[]} collectedIds - permanently collected collectible ids
 * @param {number} mapNumber - sequential map count (1-based display)
 */
export function generateMap(seed, collectedIds = [], mapNumber = 1, options = {}) {
  const rng = createRng(seed)
  const bigMap = !!options.bigMap
  const tiles = new Uint8Array(WORLD_COLS * WORLD_ROWS)
  const diggable = []
  const decorations = []

  // Fill water
  tiles.fill(TILE.WATER)

  // --- Left island: shop + disposal on a dirt base ---
  const shopCx = 7
  const shopCy = 18
  for (let y = 11; y <= 25; y++) {
    for (let x = 2; x <= 13; x++) {
      const dx = (x - shopCx) / 5.8
      const dy = (y - shopCy) / 6.5
      if (dx * dx + dy * dy < 1) {
        tiles[y * WORLD_COLS + x] = TILE.SHOP_GROUND
      }
    }
  }

  // Shop + disposal markers on the left dirt island
  for (let x = 4; x <= 8; x++) {
    for (let y = 13; y <= 16; y++) {
      tiles[y * WORLD_COLS + x] = TILE.SHOP_BUILDING
    }
  }
  for (let x = 5; x <= 7; x++) {
    for (let y = 20; y <= 22; y++) {
      tiles[y * WORLD_COLS + x] = TILE.DISPOSAL
    }
  }

  // --- Middle sand island — irregular diggable island ---
  const sandCx = 30
  const sandCy = 18
  const rx = bigMap ? 16 + rng() * 2 : 11 + rng() * 1.5
  const ry = bigMap ? 12 + rng() * 2 : 9 + rng() * 1.5

  for (let y = 2; y < WORLD_ROWS - 2; y++) {
    for (let x = 18; x < WORLD_COLS - 2; x++) {
      const dx = (x - sandCx) / rx
      const dy = (y - sandCy) / ry
      const noise = (rng() - 0.5) * 0.18 + Math.sin(x * 0.45 + seed) * 0.04 + Math.cos(y * 0.38) * 0.04
      if (dx * dx + dy * dy < 1 + noise) {
        if (tiles[y * WORLD_COLS + x] === TILE.WATER || tiles[y * WORLD_COLS + x] === TILE.SHOP_GROUND) {
          tiles[y * WORLD_COLS + x] = TILE.SAND
          diggable.push({ x, y })
        }
      }
    }
  }

  // Guaranteed bridge landing area so the sand island always reaches the connection point.
  for (let x = 19; x <= 24; x++) {
    for (let y = 15; y <= 20; y++) {
      if (tiles[y * WORLD_COLS + x] === TILE.WATER) {
        tiles[y * WORLD_COLS + x] = TILE.SAND
        diggable.push({ x, y })
      }
    }
  }

  // --- Right-side hall island for pedestals and seen collectibles ---
  const hallCx = 54
  const hallCy = 18
  for (let y = 11; y <= 25; y++) {
    for (let x = 47; x <= 61; x++) {
      const dx = (x - hallCx) / (bigMap ? 10.8 : 9.2)
      const dy = (y - hallCy) / (bigMap ? 9.9 : 8.4)
      if (dx * dx + dy * dy < 1) {
        tiles[y * WORLD_COLS + x] = TILE.SHOP_GROUND
      }
    }
  }

  // Bridges: left -> sand and sand -> hall
  // Shift the right bridge farther right on Big Map so it sits at the island edge instead of being buried inland.
  const leftBridgeEnd = 18
  const rightBridgeEnd = bigMap ? 47 : 46

  for (let x = 13; x <= leftBridgeEnd; x++) {
    for (let y = 16; y <= 19; y++) {
      tiles[y * WORLD_COLS + x] = TILE.BRIDGE
    }
  }

  for (let x = 43; x <= rightBridgeEnd; x++) {
    for (let y = 16; y <= 19; y++) {
      tiles[y * WORLD_COLS + x] = TILE.BRIDGE
    }
  }

  // Ensure the east bridge has a solid sand landing area on the main sand island.
  for (let x = 37; x <= 42; x++) {
    for (let y = 15; y <= 20; y++) {
      if (tiles[y * WORLD_COLS + x] === TILE.WATER) {
        tiles[y * WORLD_COLS + x] = TILE.SAND
        diggable.push({ x, y })
      }
    }
  }

  // Deduplicate diggable
  const digSet = new Set()
  const diggableUnique = []
  for (const c of diggable) {
    const k = key(c.x, c.y)
    if (!digSet.has(k) && tiles[c.y * WORLD_COLS + c.x] === TILE.SAND) {
      digSet.add(k)
      diggableUnique.push(c)
    }
  }

  // Decorations on sand shore / shop
  for (let i = 0; i < 40; i++) {
    const c = pick(rng, diggableUnique)
    if (c && rng() < 0.4) {
      decorations.push({ x: c.x, y: c.y, type: pick(rng, ['rock', 'plant', 'shell']) })
    }
  }
  for (let i = 0; i < 8; i++) {
    decorations.push({
      x: 3 + Math.floor(rng() * 8),
      y: 12 + Math.floor(rng() * 12),
      type: pick(rng, ['crate', 'palm', 'rock']),
    })
  }

  // Player start on shop island near bridge
  const start = { x: 10.5 * CELL, y: 17.5 * CELL }

  // Prefer diggable cells away from start for specials
  const awayFromStart = diggableUnique.filter((c) => dist(c.x, c.y, start.x / CELL, start.y / CELL) > 6)
  const specialPool = awayFromStart.length >= 20 ? awayFromStart : diggableUnique

  // --- Treasure ---
  const treasureCell = pick(rng, specialPool)
  const treasureType = pick(rng, TREASURES)

  // --- Coins (about 30–45% of diggable cells) ---
  const coinCells = {}
  const coinCount = Math.floor(diggableUnique.length * (0.30 + rng() * 0.15))
  const coinCandidates = shuffle(rng, diggableUnique.filter((c) => !(c.x === treasureCell.x && c.y === treasureCell.y)))
  for (let i = 0; i < coinCount && i < coinCandidates.length; i++) {
    const c = coinCandidates[i]
    const roll = rng()
    let amount = 2
    if (roll > 0.7) amount = 5
    if (roll > 0.9) amount = 10
    if (roll > 0.97) amount = 18
    coinCells[key(c.x, c.y)] = amount
  }

  // --- Collectibles: once-per-island 25% roll ---
  const remaining = COLLECTIBLES.filter((c) => !collectedIds.includes(c.id))
  let collectibleCells = {}
  let collectibleRoll = false
  let placedCollectibles = []

  if (remaining.length > 0 && rng() < COLLECTIBLE_ISLAND_CHANCE) {
    collectibleRoll = true
    const count = Math.min(COLLECTIBLES_PER_ISLAND, remaining.length)
    const types = shuffle(rng, remaining).slice(0, count)

    // Spread locations
    const pool = shuffle(
      rng,
      specialPool.filter((c) => !(c.x === treasureCell.x && c.y === treasureCell.y) && !coinCells[key(c.x, c.y)]),
    )

    const chosen = []
    for (const c of pool) {
      if (chosen.length >= count) break
      const tooClose = chosen.some((o) => dist(o.x, o.y, c.x, c.y) < 5)
      if (!tooClose) chosen.push(c)
    }
    // Fallback if spread fails
    while (chosen.length < count && pool.length > chosen.length) {
      const c = pool[chosen.length]
      if (!chosen.some((o) => o.x === c.x && o.y === c.y)) chosen.push(c)
      else break
    }

    for (let i = 0; i < types.length && i < chosen.length; i++) {
      const c = chosen[i]
      collectibleCells[key(c.x, c.y)] = types[i].id
      placedCollectibles.push({ id: types[i].id, x: c.x, y: c.y })
      delete coinCells[key(c.x, c.y)] // exclusive contents
    }
  }

  // Validate
  if (!treasureCell || tiles[treasureCell.y * WORLD_COLS + treasureCell.x] !== TILE.SAND) {
    throw new Error('Invalid treasure placement')
  }
  if (collectibleCells[key(treasureCell.x, treasureCell.y)]) {
    throw new Error('Treasure and collectible cannot share a hole')
  }
  if (placedCollectibles.length > COLLECTIBLES_PER_ISLAND) {
    throw new Error('Too many collectibles')
  }

  return {
    seed,
    bigMap,
    mapId: formatMapId(seed),
    mapNumber,
    tiles,
    diggableCount: diggableUnique.length,
    treasure: {
      x: treasureCell.x,
      y: treasureCell.y,
      typeId: treasureType.id,
      name: treasureType.name,
      emoji: treasureType.emoji,
    },
    coinCells,
    collectibleCells,
    collectibleRoll,
    placedCollectibles,
    decorations,
    start,
    holes: {}, // key -> { contents revealed }
    sandPiles: {}, // key -> true
    dugCount: 0,
  }
}

export function getTile(map, x, y) {
  if (!inBounds(x, y)) return TILE.WATER
  return map.tiles[y * WORLD_COLS + x]
}

export function isWalkable(map, wx, wy) {
  const gx = Math.floor(wx / CELL)
  const gy = Math.floor(wy / CELL)
  const t = getTile(map, gx, gy)
  return (
    t === TILE.SAND ||
    t === TILE.SHOP_GROUND ||
    t === TILE.BRIDGE ||
    t === TILE.DISPOSAL ||
    t === TILE.SHOP_BUILDING
  )
}

export function isDiggable(map, gx, gy) {
  return getTile(map, gx, gy) === TILE.SAND && !map.holes[key(gx, gy)]
}

export { key, inBounds }
