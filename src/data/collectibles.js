export const COLLECTIBLES = [
  { id: 'ancient_coin', name: 'Ancient Coin', emoji: '🪙', description: 'A weathered coin from a forgotten age.' },
  { id: 'fossil', name: 'Fossil', emoji: '🦴', description: 'A delicate imprint of prehistoric life.' },
  { id: 'old_bottle', name: 'Old Bottle', emoji: '🍾', description: 'Sealed glass with a scrap of parchment inside.' },
  { id: 'pirate_compass', name: 'Pirate Compass', emoji: '🧭', description: 'Always points toward trouble.' },
  { id: 'ruby_ring', name: 'Ruby Ring', emoji: '💍', description: 'A deep-red gem set in tarnished gold.' },
  { id: 'ancient_key', name: 'Ancient Key', emoji: '🗝️', description: 'What door did this once open?' },
  { id: 'pocket_watch', name: 'Pocket Watch', emoji: '⌚', description: 'Still ticking after centuries under sand.' },
  { id: 'emerald', name: 'Emerald', emoji: '💚', description: 'A vivid green stone that catches the light.' },
  { id: 'old_medal', name: 'Old Medal', emoji: '🏅', description: 'Awarded for bravery long ago.' },
  { id: 'small_statue', name: 'Small Statue', emoji: '🗿', description: 'A miniature guardian figure.' },
  { id: 'golden_pendant', name: 'Golden Pendant', emoji: '✨', description: 'Warm to the touch, even underground.' },
  { id: 'ancient_relic', name: 'Ancient Relic', emoji: '🏛️', description: 'A fragment of a vanished civilization.' },
  { id: 'pearl', name: 'Pearl', emoji: '🤍', description: 'Lustrous and perfectly round.' },
  { id: 'antique_coin', name: 'Antique Coin', emoji: '🔶', description: 'Stamped with an unknown crest.' },
  { id: 'explorers_badge', name: "Explorer's Badge", emoji: '🎖️', description: 'Proof of a daring journey.' },
  { id: 'old_spyglass', name: 'Old Spyglass', emoji: '🔭', description: 'Lens cracked, but history intact.' },
  { id: 'jewelry_box', name: 'Jewelry Box', emoji: '📦', description: 'Velvet lining still soft with age.' },
  { id: 'ancient_figurine', name: 'Ancient Figurine', emoji: '🧍', description: 'Carved from strange dark stone.' },
  { id: 'lost_locket', name: 'Lost Locket', emoji: '💟', description: 'A tiny portrait faded beyond recognition.' },
  { id: 'sapphire', name: 'Sapphire', emoji: '💙', description: 'Ocean-blue and cold as night.' },
  { id: 'pirate_token', name: 'Pirate Token', emoji: '☠️', description: 'Currency among thieves of the sea.' },
  { id: 'ancient_charm', name: 'Ancient Charm', emoji: '🔮', description: 'Said to bring fair winds.' },
  { id: 'golden_trinket', name: 'Golden Trinket', emoji: '🏆', description: 'Tiny, ornate, unmistakably valuable.' },
  { id: 'map_fragment', name: 'Old Map Fragment', emoji: '🗺️', description: 'Half a chart to somewhere wonderful.' },
  { id: 'mysterious_artifact', name: 'Mysterious Artifact', emoji: '🧿', description: 'Nobody knows what it does — yet.' },
]

export const COLLECTIBLE_COUNT = COLLECTIBLES.length
export const COLLECTIBLE_COIN_REWARD = 20

export function getCollectible(id) {
  return COLLECTIBLES.find((c) => c.id === id)
}
