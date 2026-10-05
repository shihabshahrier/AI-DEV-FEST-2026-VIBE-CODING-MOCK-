// Maps dataset coordinates onto a fixed-size canvas so node sizes and fonts look
// the same whether a dataset uses 0–10 or 0–5000. Aspect ratio is preserved and
// the y-axis points down (screen coordinates), as in the sample.

const LONG_SIDE = 1000
const MIN_SIDE = 240
const PAD = 90

export function layoutGraph(nodes) {
  const xs = nodes.map((n) => n.x)
  const ys = nodes.map((n) => n.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const spanX = Math.max(...xs) - minX
  const spanY = Math.max(...ys) - minY
  const scale = LONG_SIDE / (Math.max(spanX, spanY) || 1)

  const innerW = Math.max(spanX * scale, MIN_SIDE)
  const innerH = Math.max(spanY * scale, MIN_SIDE)
  // Center a degenerate axis (all nodes on one line) inside the minimum side.
  const offsetX = PAD + (innerW - spanX * scale) / 2
  const offsetY = PAD + (innerH - spanY * scale) / 2

  const pos = new Map(nodes.map((n) => [n.id, { x: offsetX + (n.x - minX) * scale, y: offsetY + (n.y - minY) * scale }]))

  // Shrink markers on crowded maps so neighbouring nodes don't overlap.
  let minDist = Infinity
  const pts = [...pos.values()]
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      minDist = Math.min(minDist, Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y))
    }
  }
  const k = Math.max(0.5, Math.min(1, minDist / 110))

  return { pos, width: innerW + PAD * 2, height: innerH + PAD * 2, k }
}
