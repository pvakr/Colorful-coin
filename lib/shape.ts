// lib/shape.ts
export type Region = { name: string; path: Path2D; color?: string }

export function fitMatrix(W: number, H: number, vbW = 200, vbH = 200) {
  const s = Math.min(W / vbW, H / vbH)
  const ox = (W - vbW * s) / 2
  const oy = (H - vbH * s) / 2
  return new DOMMatrix().translate(ox, oy).scale(s, s)
}

export function fromSvgPath(d: string, M: DOMMatrix) {
  const src = new Path2D(d)
  const dst = new Path2D()
  dst.addPath(src, M)
  return dst
}

export function rect(x: number, y: number, w: number, h: number, M: DOMMatrix) {
  const p = new Path2D()
  p.rect(0, 0, w, h)
  const dst = new Path2D()
  const T = new DOMMatrix([1,0,0,1,x,y,0,0,0,0,1,0,0,0,0,1]).multiply(M)
  dst.addPath(p, T)
  return dst
}

export function circle(cx: number, cy: number, r: number, M: DOMMatrix) {
  const p = new Path2D()
  p.arc(cx, cy, r, 0, Math.PI * 2)
  const dst = new Path2D()
  dst.addPath(p, M)
  return dst
}

/** Make a colorable “ribbon” from a polyline (for mane strands), with round caps */
export function ribbon(points: [number, number][], thickness: number, M: DOMMatrix) {
  const p = new Path2D()
  if (points.length < 2) return p
  // build left side
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i], [x2, y2] = points[i + 1]
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1
    const nx = -dy / L, ny = dx / L
    const ox = (thickness / 2) * nx, oy = (thickness / 2) * ny
    if (i === 0) p.moveTo(x1 + ox, y1 + oy)
    p.lineTo(x2 + ox, y2 + oy)
  }
  // round cap
  const [xe, ye] = points[points.length - 1]
  p.arc(xe, ye, thickness / 2, 0, Math.PI * 2)

  // right side back
  for (let i = points.length - 1; i > 0; i--) {
    const [x1, y1] = points[i], [x2, y2] = points[i - 1]
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1
    const nx = -dy / L, ny = dx / L
    const ox = (thickness / 2) * nx, oy = (thickness / 2) * ny
    p.lineTo(x2 - ox, y2 - oy)
  }
  // round cap
  const [xs, ys] = points[0]
  p.arc(xs, ys, thickness / 2, 0, Math.PI * 2)
  p.closePath()

  const dst = new Path2D()
  dst.addPath(p, M)
  return dst
}
