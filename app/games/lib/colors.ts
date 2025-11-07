export type RGB = { r: number; g: number; b: number }

export function hexToRgb(hex: string): RGB | null {
  const s = hex.replace("#", "").trim()
  const m =
    s.length === 3
      ? s
          .split("")
          .map((c) => c + c)
          .join("")
      : s
  if (!/^([0-9a-fA-F]{6})$/.test(m)) return null
  const n = Number.parseInt(m, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function rgbToHex({ r, g, b }: RGB): string {
  const clamp = (x: number) => Math.max(0, Math.min(255, Math.round(x)))
  return `#${[clamp(r), clamp(g), clamp(b)].map((n) => n.toString(16).padStart(2, "0")).join("")}`
}

export function parseRgb(input: string): RGB | null {
  const m = input.match(/rgb\s*$$\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*$$/i)
  if (!m) return null
  const r = +m[1],
    g = +m[2],
    b = +m[3]
  if ([r, g, b].some((v) => v < 0 || v > 255)) return null
  return { r, g, b }
}

export const randomColor = () =>
  `#${Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, "0")}`
