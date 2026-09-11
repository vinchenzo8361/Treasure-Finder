import { STORAGE_KEY, STARTING_EQUIPMENT, STARTING_MONEY, STARTING_SAND_CAPACITY } from './constants.js'

export function defaultProgress() {
  return {
    money: STARTING_MONEY,
    equipmentLevel: STARTING_EQUIPMENT,
    sandCapacity: STARTING_SAND_CAPACITY,
    collectedIds: [],
    completedMaps: [],
    mapsCompleted: 0,
    totalDigs: 0,
    totalDistance: 0,
    totalCoinsEarned: 0,
    totalMoneySpent: 0,
    bestTimeMs: null,
  }
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultProgress()
    const data = JSON.parse(raw)
    return { ...defaultProgress(), ...data }
  } catch {
    return defaultProgress()
  }
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // ignore quota errors
  }
}

export function resetProgress() {
  localStorage.removeItem(STORAGE_KEY)
  return defaultProgress()
}
