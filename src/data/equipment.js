export const EQUIPMENT = [
  { id: 1, name: 'Hands', digTime: 6.0, cost: 0, coinBonus: 0 },
  { id: 2, name: 'Basic Tool', digTime: 5.0, cost: 40, coinBonus: 0.10 },
  { id: 3, name: 'Improved Tool', digTime: 3.0, cost: 80, coinBonus: 0.25 },
  { id: 4, name: 'Better Tool', digTime: 2.5, cost: 150, coinBonus: 0.43 },
  { id: 5, name: 'Shovel', digTime: 2.0, cost: 250, coinBonus: 0.57 },
  { id: 6, name: 'Advanced Tool', digTime: 1.5, cost: 400, coinBonus: 0.67 },
  { id: 7, name: 'Master Excavator', digTime: 1.0, cost: 650, coinBonus: 0.78 },
]

export function getEquipment(level) {
  return EQUIPMENT[Math.max(0, Math.min(level, EQUIPMENT.length) - 1)]
}

export function sandCapacityCost(currentCapacity) {
  // Progressive: first upgrade (2→3) = 25, then +15 each step
  const upgradesBought = currentCapacity - 2
  return 25 + upgradesBought * 20
}
