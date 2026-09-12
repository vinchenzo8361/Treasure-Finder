import { getEquipment, sandCapacityCost, EQUIPMENT } from '../data/equipment.js'
import { COLLECTIBLE_COIN_REWARD, getCollectible, COLLECTIBLES } from '../data/collectibles.js'
import {
  CELL,
  PLAYER_SPEED,
  PLAYER_RADIUS,
  INTERACT_RANGE,
  SAND_PILE_SPAWN_CHANCE,
  SAND_DISPOSAL_RATE,
  TILE,
} from './constants.js'
import { generateMap, getTile, isWalkable, isDiggable, key, inBounds } from './mapGenerator.js'
import { randomSeed } from './rng.js'
import { loadProgress, saveProgress, resetProgress, defaultProgress } from './storage.js'

function cloneProgress(p) {
  return JSON.parse(JSON.stringify(p))
}

export function createInitialState() {
  const progress = loadProgress()
  return {
    screen: 'menu',
    progress,
    map: null,
    player: {
      x: 0,
      y: 0,
      carriedSand: 0,
      facing: 1,
    },
    digging: null, // { gx, gy, elapsed, duration }
    timerMs: 0,
    timerRunning: false,
    path: [],
    digLocations: [],
    runStats: emptyRunStats(),
    toast: null,
    floating: [], // { id, x, y, text, life, color }
    discovery: null, // collectible or treasure overlay
    results: null,
    viewingRun: null,
    shopOpen: false,
    message: null,
    keys: {},
    adminMode: false,
    adminBlock: null,
    treasureFound: false,
    hintLevel: 0,
  }
}

function emptyRunStats() {
  return {
    digs: 0,
    distance: 0,
    coinsFromHoles: 0,
    coinsFromCollectibles: 0,
    coinsFromSand: 0,
    sandCollected: 0,
    sandDisposed: 0,
    moneySpent: 0,
    collectiblesFound: [],
    startMoney: 0,
  }
}

function createAdminBlock() {
  return {
    x: 2,
    y: 18,
    active: true,
    respawnAt: 0,
  }
}

export function startNewMap(state) {
  const seed = randomSeed()
  const mapNumber = (state.progress.mapsCompleted || 0) + 1
  const map = generateMap(seed, state.progress.collectedIds || [], mapNumber, state.progress)
  const player = {
    x: map.start.x,
    y: map.start.y,
    carriedSand: 0,
    facing: 1,
  }

  const progress = cloneProgress(state.progress)
  progress.money = 0
  progress.equipmentLevel = 1
  saveProgress(progress)

  return {
    ...state,
    progress,
    screen: 'playing',
    map: {
      ...map,
      hallSlots: buildHallSlots(progress, map),
    },
    player,
    digging: null,
    timerMs: 0,
    timerRunning: true,
    path: [{ x: player.x, y: player.y, t: 0 }],
    digLocations: [],
    runStats: {
      ...emptyRunStats(),
      startMoney: 0,
    },
    toast: null,
    floating: [],
    discovery: null,
    results: null,
    shopOpen: false,
    message: null,
    adminMode: false,
    adminBlock: null,
    treasureFound: false,
    hintLevel: 0,
  }
}

function buildHallSlots(progress, map) {
  const collectibles = []
  const foundIds = new Set(progress.collectedIds || [])

  for (let i = 0; i < COLLECTIBLES.length; i++) {
    const collectible = COLLECTIBLES[i]
    const row = Math.floor(i / 5)
    const col = i % 5
    collectibles.push({
      kind: 'collectible',
      id: collectible.id,
      name: collectible.name,
      emoji: collectible.emoji,
      x: 50 + col * 2,
      y: 14 + row * 2,
      found: foundIds.has(collectible.id),
    })
  }

  return [
    {
      kind: 'treasure',
      id: 'treasure',
      name: map.treasure.name,
      emoji: map.treasure.emoji,
      x: 49,
      y: 12,
      found: (progress.completedMaps || []).length > 0,
    },
    ...collectibles,
  ]
}

export function tick(state, dt, keys) {
  if (state.screen !== 'playing' || !state.map) return state
  if (state.discovery?.type === 'treasure') return state

  const updates = {}

  // Timer continues while exploring, digging, shopping, disposing, etc.
  if (state.timerRunning) {
    updates.timerMs = state.timerMs + dt * 1000
  }

  if (state.adminMode && state.adminBlock && !state.adminBlock.active && updates.timerMs != null) {
    if (updates.timerMs >= state.adminBlock.respawnAt) {
      updates.adminBlock = { ...state.adminBlock, active: true, respawnAt: 0 }
    }
  }

  // Pause movement/dig while overlays are open (timer still runs)
  if (state.shopOpen || state.discovery) {
    updates.floating = decayFloating(state.floating, dt)
    if (state.toast && state.toast.life > 0) {
      updates.toast = { ...state.toast, life: state.toast.life - dt }
      if (updates.toast.life <= 0) updates.toast = null
    }
    return { ...state, ...updates }
  }

  // Digging progress
  if (state.digging) {
    const elapsed = state.digging.elapsed + dt
    if (elapsed >= state.digging.duration) {
      return finishDig({
        ...state,
        ...updates,
        digging: { ...state.digging, elapsed: state.digging.duration },
      })
    }
    updates.digging = { ...state.digging, elapsed }
    updates.floating = decayFloating(state.floating, dt)
    if (state.toast && state.toast.life > 0) {
      updates.toast = { ...state.toast, life: state.toast.life - dt }
      if (updates.toast.life <= 0) updates.toast = null
    }
    return { ...state, ...updates }
  }

  // Movement
  let { x, y, facing } = state.player
  let dx = 0
  let dy = 0
  if (keys.w || keys.ArrowUp) dy -= 1
  if (keys.s || keys.ArrowDown) dy += 1
  if (keys.a || keys.ArrowLeft) dx -= 1
  if (keys.d || keys.ArrowRight) dx += 1

  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy)
    dx /= len
    dy /= len
    const speed = PLAYER_SPEED * dt
    const nx = x + dx * speed
    const ny = y + dy * speed
    if (canStand(state.map, nx, y)) x = nx
    if (canStand(state.map, x, ny)) y = ny
    if (dx !== 0) facing = dx > 0 ? 1 : -1

    const dist = Math.hypot(x - state.player.x, y - state.player.y)
    const runStats = {
      ...state.runStats,
      distance: state.runStats.distance + dist,
    }
    updates.runStats = runStats
    updates.player = { ...state.player, x, y, facing }

    // Record path sparsely
    const path = state.path
    const last = path[path.length - 1]
    if (!last || Math.hypot(last.x - x, last.y - y) > 12) {
      updates.path = [...path, { x, y, t: (updates.timerMs ?? state.timerMs) }]
      if (updates.path.length > 8000) {
        updates.path = updates.path.filter((_, i) => i % 2 === 0)
      }
    }
  }

  updates.floating = decayFloating(state.floating, dt)

  // Clear toast
  if (state.toast && state.toast.life > 0) {
    updates.toast = { ...state.toast, life: state.toast.life - dt }
    if (updates.toast.life <= 0) updates.toast = null
  }

  return { ...state, ...updates }
}

function decayFloating(floating, dt) {
  return floating
    .map((f) => ({ ...f, life: f.life - dt, y: f.y - 20 * dt }))
    .filter((f) => f.life > 0)
}

function canStand(map, wx, wy) {
  // Check circle sample points
  const r = PLAYER_RADIUS * 0.7
  const points = [
    [wx, wy],
    [wx + r, wy],
    [wx - r, wy],
    [wx, wy + r],
    [wx, wy - r],
  ]
  return points.every(([px, py]) => isWalkable(map, px, py))
}

export function tryInteract(state) {
  if (state.screen !== 'playing' || !state.map || state.digging || state.discovery || state.shopOpen) {
    return state
  }

  const { player, map, progress } = state
  const gx = Math.floor(player.x / CELL)
  const gy = Math.floor(player.y / CELL)

  // Shop building entry
  if (nearShop(map, player)) {
    return { ...state, shopOpen: true }
  }

  // Disposal machine
  if (nearDisposal(map, player)) {
    return disposeSand(state)
  }

  // Sand piles nearby
  const pile = nearestSandPile(map, player)
  if (pile) {
    return pickupSand(state, pile.x, pile.y)
  }

  // Dig nearby undug sand
  const digTarget = nearestDiggable(map, player, state)
  if (digTarget) {
    return startDig(state, digTarget.x, digTarget.y)
  }

  return withToast(state, 'Nothing to interact with nearby.', 1.5)
}

function nearShop(map, player) {
  const gx = Math.floor(player.x / CELL)
  const gy = Math.floor(player.y / CELL)
  // Standing on the shop building opens it
  if (getTile(map, gx, gy) === TILE.SHOP_BUILDING) return true
  // Shop island center area acts as the shop entry point now that the barn is removed
  if (getTile(map, gx, gy) === TILE.SHOP_GROUND && gx >= 4 && gx <= 10 && gy >= 14 && gy <= 18) return true
  // Door / front of barn
  const doorX = 7 * CELL
  const doorY = 17.6 * CELL
  return Math.hypot(player.x - doorX, player.y - doorY) < CELL * 2.8
}

function nearDisposal(map, player) {
  const gx = Math.floor(player.x / CELL)
  const gy = Math.floor(player.y / CELL)
  if (getTile(map, gx, gy) === TILE.DISPOSAL) return true
  const sx = 6.5 * CELL
  const sy = 21.5 * CELL
  return Math.hypot(player.x - sx, player.y - sy) < CELL * 2.2
}

function nearestSandPile(map, player) {
  let best = null
  let bestD = INTERACT_RANGE
  for (const k of Object.keys(map.sandPiles)) {
    if (!map.sandPiles[k]) continue
    const [x, y] = k.split(',').map(Number)
    const cx = (x + 0.5) * CELL
    const cy = (y + 0.5) * CELL
    const d = Math.hypot(player.x - cx, player.y - cy)
    if (d < bestD) {
      bestD = d
      best = { x, y }
    }
  }
  return best
}

function nearestDiggable(map, player, state) {
  const gx = Math.floor(player.x / CELL)
  const gy = Math.floor(player.y / CELL)
  let best = null
  let bestD = INTERACT_RANGE
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const x = gx + dx
      const y = gy + dy
      if (!isDiggable(map, x, y)) continue
      const cx = (x + 0.5) * CELL
      const cy = (y + 0.5) * CELL
      const d = Math.hypot(player.x - cx, player.y - cy)
      if (d < bestD) {
        bestD = d
        best = { x, y }
      }
    }
  }

  if (state.adminMode && state.adminBlock?.active) {
    const cx = (state.adminBlock.x + 0.5) * CELL
    const cy = (state.adminBlock.y + 0.5) * CELL
    const d = Math.hypot(player.x - cx, player.y - cy)
    if (d < bestD) {
      bestD = d
      best = { x: state.adminBlock.x, y: state.adminBlock.y, admin: true }
    }
  }

  return best
}

function startDig(state, gx, gy) {
  const eq = getEquipment(state.progress.equipmentLevel)
  const adminBlock = state.adminMode && state.adminBlock?.active && state.adminBlock.x === gx && state.adminBlock.y === gy
  return {
    ...state,
    digging: { gx, gy, elapsed: 0, duration: eq.digTime, tool: eq.name, adminBlock },
  }
}

function finishDig(state) {
  const { gx, gy } = state.digging
  const k = key(gx, gy)
  const map = { ...state.map, holes: { ...state.map.holes }, sandPiles: { ...state.map.sandPiles } }
  let progress = cloneProgress(state.progress)
  let runStats = { ...state.runStats }
  let floating = [...state.floating]
  let discovery = null
  let results = null
  let timerRunning = state.timerRunning
  let screen = state.screen

  runStats = { ...runStats, digs: runStats.digs + 1 }
  progress.totalDigs = (progress.totalDigs || 0) + 1

  if (state.digging.adminBlock) {
    const adminBlock = { ...state.adminBlock, active: false, respawnAt: state.timerMs + 10000 }
    progress.money += 50
    progress.totalCoinsEarned = (progress.totalCoinsEarned || 0) + 50
    runStats.coinsFromHoles += 50
    floating.push(floatText((gx + 0.5) * CELL, (gy + 0.5) * CELL, '+50', '#f5c842'))
    saveProgress(progress)

    return {
      ...state,
      progress,
      digging: null,
      digLocations: [...state.digLocations, { x: gx, y: gy, contents: 'admin' }],
      runStats,
      floating,
      adminBlock,
      discovery,
      timerRunning,
      screen,
      results,
    }
  }

  let contents = { type: 'empty' }

  // Treasure?
  if (map.treasure.x === gx && map.treasure.y === gy) {
    contents = { type: 'treasure', treasure: map.treasure }
  } else if (map.collectibleCells[k]) {
    const id = map.collectibleCells[k]
    contents = { type: 'collectible', id }
  } else if (map.coinCells[k]) {
    contents = { type: 'coins', amount: map.coinCells[k] }
  }

  map.holes[k] = contents
  map.dugCount = (map.dugCount || 0) + 1

  const digLocations = [...state.digLocations, { x: gx, y: gy, contents: contents.type }]

  // Spawn sand piles
  spawnSandPiles(map, gx, gy)

  const cx = (gx + 0.5) * CELL
  const cy = (gy + 0.5) * CELL

  if (contents.type === 'coins') {
    progress.money += contents.amount
    progress.totalCoinsEarned = (progress.totalCoinsEarned || 0) + contents.amount
    runStats.coinsFromHoles += contents.amount
    floating.push(floatText(cx, cy, `+${contents.amount}`, '#f5c842'))
  } else if (contents.type === 'collectible') {
    const id = contents.id
    if (!progress.collectedIds.includes(id)) {
      progress.collectedIds = [...progress.collectedIds, id]
    }
    progress.money += COLLECTIBLE_COIN_REWARD
    progress.totalCoinsEarned = (progress.totalCoinsEarned || 0) + COLLECTIBLE_COIN_REWARD
    runStats.coinsFromCollectibles += COLLECTIBLE_COIN_REWARD
    runStats.collectiblesFound = [...runStats.collectiblesFound, id]
    const col = getCollectible(id)
    floating.push(floatText(cx, cy - 10, '+20', '#7ec8ff'))
    discovery = {
      type: 'collectible',
      id,
      name: col?.name || id,
      emoji: col?.emoji || '✨',
      collection: progress.collectedIds.length,
    }
  } else if (contents.type === 'treasure') {
    timerRunning = false
    discovery = {
      type: 'treasure',
      treasure: map.treasure,
      timeMs: state.timerMs,
    }
    // Build results + trophy after dismiss — handled in completeTreasure
  } else {
    floating.push(floatText(cx, cy, '…', '#c4a882'))
  }

  saveProgress(progress)

  return {
    ...state,
    map,
    progress,
    digging: null,
    digLocations,
    runStats,
    floating,
    discovery,
    timerRunning,
    screen,
    results,
  }
}

function spawnSandPiles(map, gx, gy) {
  if (Math.random() > SAND_PILE_SPAWN_CHANCE) return
  const neighbors = []
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue
      const x = gx + dx
      const y = gy + dy
      if (!inBounds(x, y)) continue
      if (getTile(map, x, y) !== TILE.SAND) continue
      if (map.holes[key(x, y)]) continue
      if (map.sandPiles[key(x, y)]) continue
      // Don't put pile on undug treasure/collectible cells — piles sit ON sand surface, OK on undug
      neighbors.push({ x, y })
    }
  }
  if (neighbors.length === 0) return
  const count = 1 + Math.floor(Math.random() * Math.min(3, neighbors.length))
  // shuffle lightly
  for (let i = neighbors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[neighbors[i], neighbors[j]] = [neighbors[j], neighbors[i]]
  }
  for (let i = 0; i < count; i++) {
    const c = neighbors[i]
    map.sandPiles[key(c.x, c.y)] = true
  }
}

function pickupSand(state, gx, gy) {
  const k = key(gx, gy)
  if (!state.map.sandPiles[k]) return state
  if (state.player.carriedSand >= state.progress.sandCapacity) {
    return withToast(state, 'Sand capacity full.', 1.8)
  }
  const map = { ...state.map, sandPiles: { ...state.map.sandPiles } }
  delete map.sandPiles[k]
  const carried = state.player.carriedSand + 1
  const runStats = {
    ...state.runStats,
    sandCollected: state.runStats.sandCollected + 1,
  }
  const cx = (gx + 0.5) * CELL
  const cy = (gy + 0.5) * CELL
  return {
    ...state,
    map,
    player: { ...state.player, carriedSand: carried },
    runStats,
    floating: [...state.floating, floatText(cx, cy, '+1 sand', '#e8c48a')],
  }
}

function disposeSand(state) {
  const amount = state.player.carriedSand
  if (amount <= 0) return withToast(state, 'No sand to dispose.', 1.5)
  const coins = amount * SAND_DISPOSAL_RATE
  const progress = cloneProgress(state.progress)
  progress.money += coins
  progress.totalCoinsEarned = (progress.totalCoinsEarned || 0) + coins
  const runStats = {
    ...state.runStats,
    sandDisposed: state.runStats.sandDisposed + amount,
    coinsFromSand: state.runStats.coinsFromSand + coins,
  }
  saveProgress(progress)
  return {
    ...state,
    progress,
    player: { ...state.player, carriedSand: 0 },
    runStats,
    floating: [
      ...state.floating,
      floatText(state.player.x, state.player.y - 20, `+${coins} coins`, '#f5c842'),
    ],
    toast: { text: `Disposed ${amount} sand → +${coins} coins`, life: 2.2 },
  }
}

function floatText(x, y, text, color) {
  return { id: Math.random().toString(36).slice(2), x, y, text, color, life: 1.4 }
}

function withToast(state, text, life = 2) {
  return { ...state, toast: { text, life } }
}

export function dismissDiscovery(state) {
  if (!state.discovery) return state
  if (state.discovery.type === 'treasure') {
    return {
      ...state,
      discovery: null,
      treasureFound: true,
    }
  }
  return { ...state, discovery: null }
}

export function endRun(state) {
  return completeTreasure(state)
}

function completeTreasure(state) {
  const progress = cloneProgress(state.progress)
  const map = state.map
  const exploration = map.diggableCount
    ? Math.round((map.dugCount / map.diggableCount) * 1000) / 10
    : 0

  const run = {
    mapNumber: map.mapNumber,
    mapId: map.mapId,
    seed: map.seed,
    treasure: { ...map.treasure },
    timeMs: state.timerMs,
    digs: state.runStats.digs,
    distance: Math.round(state.runStats.distance),
    coinsFromHoles: state.runStats.coinsFromHoles,
    coinsFromCollectibles: state.runStats.coinsFromCollectibles,
    coinsFromSand: state.runStats.coinsFromSand,
    sandCollected: state.runStats.sandCollected,
    sandDisposed: state.runStats.sandDisposed,
    moneySpent: state.runStats.moneySpent,
    moneyRemaining: progress.money,
    equipmentLevel: progress.equipmentLevel,
    equipmentName: getEquipment(progress.equipmentLevel).name,
    sandCapacity: progress.sandCapacity,
    collectiblesFound: [...state.runStats.collectiblesFound],
    collectionTotal: progress.collectedIds.length,
    exploration,
    start: { ...map.start },
    path: state.path,
    digLocations: state.digLocations,
    holes: { ...map.holes },
    collectibleCells: { ...map.collectibleCells },
    placedCollectibles: map.placedCollectibles,
    tiles: Array.from(map.tiles),
    dugCount: map.dugCount,
    diggableCount: map.diggableCount,
    completedAt: Date.now(),
  }

  progress.completedMaps = [...(progress.completedMaps || []), run]
  progress.mapsCompleted = (progress.mapsCompleted || 0) + 1
  progress.totalDistance = (progress.totalDistance || 0) + run.distance
  if (progress.bestTimeMs == null || run.timeMs < progress.bestTimeMs) {
    progress.bestTimeMs = run.timeMs
  }

  saveProgress(progress)

  return {
    ...state,
    progress,
    discovery: null,
    timerRunning: false,
    screen: 'results',
    results: run,
    adminMode: false,
    adminBlock: null,
    treasureFound: true,    hintLevel: 0,
    debugStatsOpen: false,  }
}

export function buyHint(state) {
  const costs = [25, 30, 50]
  const nextHintLevel = state.hintLevel || 0
  if (nextHintLevel >= costs.length) {
    return withToast(state, 'All hints already unlocked.', 1.8)
  }

  const cost = costs[nextHintLevel]
  if (state.progress.money < cost) {
    return withToast(state, 'Not enough coins.', 1.8)
  }

  const progress = cloneProgress(state.progress)
  progress.money -= cost
  progress.totalMoneySpent = (progress.totalMoneySpent || 0) + cost

  const runStats = {
    ...state.runStats,
    moneySpent: state.runStats.moneySpent + cost,
  }

  saveProgress(progress)

  return {
    ...state,
    progress,
    runStats,
    hintLevel: nextHintLevel + 1,
    shopOpen: false,
    toast: { text: `Hint ${nextHintLevel + 1} unlocked!`, life: 2 },
  }
}

export function buyEquipment(state) {
  const level = state.progress.equipmentLevel
  if (level >= EQUIPMENT.length) {
    return withToast(state, 'You own the best equipment!', 2)
  }
  const next = EQUIPMENT[level] // 0-index: next is at index `level`
  const progress = cloneProgress(state.progress)
  if (progress.money < next.cost) {
    return withToast(state, 'Not enough coins.', 1.8)
  }
  progress.money -= next.cost
  progress.equipmentLevel = next.id
  progress.totalMoneySpent = (progress.totalMoneySpent || 0) + next.cost
  const runStats = {
    ...state.runStats,
    moneySpent: state.runStats.moneySpent + next.cost,
  }
  saveProgress(progress)
  return {
    ...state,
    progress,
    runStats,
    toast: { text: `Bought ${next.name}!`, life: 2 },
  }
}

export function buySandCapacity(state) {
  const cost = sandCapacityCost(state.progress.sandCapacity)
  const progress = cloneProgress(state.progress)
  if (progress.money < cost) {
    return withToast(state, 'Not enough coins.', 1.8)
  }
  progress.money -= cost
  progress.sandCapacity += 1
  progress.totalMoneySpent = (progress.totalMoneySpent || 0) + cost
  const runStats = {
    ...state.runStats,
    moneySpent: state.runStats.moneySpent + cost,
  }
  saveProgress(progress)
  return {
    ...state,
    progress,
    runStats,
    toast: { text: `Sand capacity → ${progress.sandCapacity}`, life: 2 },
  }
}

export function fullReset() {
  resetProgress()
  return {
    ...createInitialState(),
    progress: defaultProgress(),
    screen: 'menu',
  }
}

export function formatTime(ms) {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export { getEquipment, sandCapacityCost, EQUIPMENT }
