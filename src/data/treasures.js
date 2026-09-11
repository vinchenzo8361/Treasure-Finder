export const TREASURES = [
  { id: 'pirate_gold_chest', name: 'Pirate Gold Chest', emoji: '🧰' },
  { id: 'golden_crown', name: 'Golden Crown', emoji: '👑' },
  { id: 'jewel_chest', name: 'Jewel Chest', emoji: '💎' },
  { id: 'golden_idol', name: 'Golden Idol', emoji: '🗿' },
  { id: 'emerald_hoard', name: 'Emerald Hoard', emoji: '💚' },
  { id: 'ancient_artifact', name: 'Ancient Artifact', emoji: '🏺' },
  { id: 'pirate_relic', name: 'Pirate Relic', emoji: '⚓' },
  { id: 'golden_skull', name: 'Golden Skull', emoji: '💀' },
  { id: 'sapphire_chest', name: 'Sapphire Chest', emoji: '💙' },
  { id: 'coin_hoard', name: 'Ancient Coin Hoard', emoji: '🪙' },
  { id: 'golden_compass', name: 'Golden Compass', emoji: '🧭' },
  { id: 'royal_jewelry', name: 'Royal Jewelry Box', emoji: '💍' },
  { id: 'ancient_statue', name: 'Ancient Statue', emoji: '🗽' },
  { id: 'pearl_chest', name: 'Pearl Chest', emoji: '🦪' },
  { id: 'golden_goblet', name: 'Golden Goblet', emoji: '🏆' },
  { id: 'explorers_treasure', name: "Explorer's Treasure", emoji: '🎒' },
  { id: 'legendary_relic', name: 'Legendary Relic', emoji: '✨' },
  { id: 'royal_treasure', name: 'Royal Treasure Chest', emoji: '🎁' },
  { id: 'ancient_treasure', name: 'Ancient Treasure', emoji: '📜' },
  { id: 'legendary_golden', name: 'Legendary Golden Chest', emoji: '🌟' },
]

export function getTreasure(id) {
  return TREASURES.find((t) => t.id === id)
}
