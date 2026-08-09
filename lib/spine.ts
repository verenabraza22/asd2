import type { ThemeName } from './types'

/** Harmonic spine palettes per theme (from the PRD). */
const SPINE_PALETTES: Record<ThemeName, string[]> = {
  cream: ['#8a5a3c', '#b5651d', '#c99a3b', '#4a5d3a', '#6f4e37', '#a67b5b', '#9c5a3c'],
  mocha: ['#7b3b4a', '#3a4a6b', '#b08d57', '#6b4a6b', '#8a5a3c', '#4a6b5a', '#a04a5a'],
  pastel: ['#eba0a8', '#a3b18a', '#c89ad6', '#e8ce7a', '#9ac4d6', '#f0b8c8', '#b8d4a0'],
}

/** Deterministic color for a spine based on its id/title and the active theme. */
export function spineColor(seed: string, theme: ThemeName): string {
  const palette = SPINE_PALETTES[theme]
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return palette[hash % palette.length]
}

/** Readable text color for a given spine background. */
export function spineTextColor(bg: string): string {
  const hex = bg.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#3a2a1e' : '#faf3ea'
}
