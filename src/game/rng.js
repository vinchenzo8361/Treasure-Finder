/** Seeded PRNG (mulberry32) */
export function createRng(seed) {
  let s = seed >>> 0
  return function rng() {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function randomSeed() {
  return (Math.floor(Math.random() * 0xffffff) + 1) | 0
}

export function formatMapId(seed) {
  return `#${String(seed % 1000000).padStart(6, '0')}`
}

export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)]
}

export function shuffle(rng, arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
