import { useMemo, useRef, useState } from 'react'
import { layoutGraph } from '../lib/layout.js'
import { useI18n } from '../lib/i18n.jsx'

const R = 20 // base node radius in canvas units (scaled by layout.k)

const toD = (ids, pos) => ids.map((id, i) => `${i ? 'L' : 'M'}${pos.get(id).x.toFixed(1)} ${pos.get(id).y.toFixed(1)}`).join(' ')

export default function MapView({ graph, hazards, result, ghostPath, highlightId, onNodeClick, onEdgeClick }) {
  const { t, num } = useI18n()
  const stageRef = useRef(null)
  const svgRef = useRef(null)
  const [hover, setHover] = useState(null)

  const layout = useMemo(() => layoutGraph(graph.nodes), [graph])
  const { pos, width, height, k } = layout
  const r = R * k

  const routeNodes = useMemo(() => new Set(result.status === 'ok' ? result.path : []), [result])
  const routeEdges = useMemo(() => new Set(result.status === 'ok' ? result.edgeIds : []), [result])
  const routeD = result.status === 'ok' ? toD(result.path, pos) : null
  const routeKey = result.status === 'ok' ? result.path.join('>') : 'none'
  const ghostD = ghostPath && ghostPath.every((id) => pos.has(id)) ? toD(ghostPath, pos) : null

  const nodeDown = (id) => {
    const node = graph.nodeById.get(id)
    return hazards.blockedNodes.has(id) || (node.type === 'exit' && hazards.closedExits.has(id))
  }

  const showTip = (id) => {
    const p = pos.get(id)
    const svg = svgRef.current
    const stage = stageRef.current
    if (!svg || !stage) return
    const box = stage.getBoundingClientRect()
    const toStage = (y) => {
      const pt = svg.createSVGPoint()
      pt.x = p.x
      pt.y = y
      const s = pt.matrixTransform(svg.getScreenCTM())
      return { x: s.x - box.left, y: s.y - box.top }
    }
    // Keep the tooltip inside the stage: clamp sideways, flip below near the top edge.
    const above = toStage(p.y - r * 1.4)
    const below = above.y < 96
    const anchor = below ? toStage(p.y + r * 1.4) : above
    const left = Math.min(Math.max(anchor.x, 130), box.width - 130)
    setHover({ id, left, top: anchor.y, below })
  }

  const activate = (handler, id) => (e) => {
    if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    handler(id)
  }

  return (
    <div className="map" ref={stageRef}>
      <svg
        ref={svgRef}
        className="map-svg"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        role="group"
        aria-label={graph.building}
        style={{ '--k': k }}
      >
        <defs>
          <pattern id="hazard-stripes" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="8" fill="#3A0D12" />
            <rect width="4" height="8" fill="var(--hazard)" />
          </pattern>
          <filter id="route-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Corridors */}
        <g className="edges">
          {graph.edges.map((e) => {
            const a = pos.get(e.from)
            const b = pos.get(e.to)
            const blocked = hazards.blockedEdges.has(e.id)
            const unusable = !blocked && (nodeDown(e.from) || nodeDown(e.to))
            const cls = ['edge', blocked && 'is-blocked', unusable && 'is-unusable', routeEdges.has(e.id) && 'is-route']
              .filter(Boolean)
              .join(' ')
            return (
              <g key={e.id} className={cls}>
                <line className="edge__line" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
                <line
                  className="edge__hit"
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  tabIndex={0}
                  role="button"
                  aria-pressed={blocked}
                  aria-label={`${e.id} ${e.from}–${e.to}: ${t(blocked ? 'action.unblock' : 'action.block')}`}
                  onClick={activate(onEdgeClick, e.id)}
                  onKeyDown={activate(onEdgeClick, e.id)}
                />
              </g>
            )
          })}
        </g>

        {/* Previous route fading out after a reroute */}
        {ghostD && <path key={`ghost-${ghostPath.join('>')}`} className="route-ghost" d={ghostD} />}

        {/* Active route: glow, draw-in stroke, flowing dashes, one runner dot */}
        {routeD && (
          <g key={routeKey} className="route">
            <path className="route__glow" d={routeD} filter="url(#route-glow)" />
            <path className="route__line" d={routeD} pathLength="1" />
            <path className="route__flow" d={routeD} />
            <circle className="route__runner" r={6 * k} style={{ offsetPath: `path('${routeD}')` }} />
          </g>
        )}

        {/* Corridor cost labels (above the route so they stay readable) */}
        <g className="edge-labels">
          {graph.edges.map((e) => {
            const a = pos.get(e.from)
            const b = pos.get(e.to)
            const blocked = hazards.blockedEdges.has(e.id)
            const label = num(e.cost)
            const w = (label.length * 8 + 14) * Math.max(k, 0.75)
            const h = 18 * Math.max(k, 0.75)
            return (
              <g
                key={e.id}
                className={`edge-cost${blocked ? ' is-blocked' : ''}${routeEdges.has(e.id) ? ' is-route' : ''}`}
                transform={`translate(${(a.x + b.x) / 2} ${(a.y + b.y) / 2})`}
                onClick={() => onEdgeClick(e.id)}
              >
                <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} />
                <text dy="0.35em">{blocked ? `✕ ${label}` : label}</text>
              </g>
            )
          })}
        </g>

        {/* Nodes */}
        <g className="nodes">
          {graph.nodes.map((n) => {
            const p = pos.get(n.id)
            const blocked = hazards.blockedNodes.has(n.id)
            const closed = n.type === 'exit' && hazards.closedExits.has(n.id)
            const isStart = result.startId === n.id
            const state = blocked ? 'blocked' : closed ? 'closed' : 'open'
            const cls = [
              'node',
              `node--${n.type}`,
              blocked && 'is-blocked',
              closed && 'is-closed',
              isStart && 'is-start',
              routeNodes.has(n.id) && 'is-route',
              result.exitId === n.id && result.status === 'ok' && 'is-dest',
              (highlightId === n.id || hover?.id === n.id) && 'is-hover',
            ]
              .filter(Boolean)
              .join(' ')
            return (
              <g
                key={n.id}
                className={cls}
                transform={`translate(${p.x} ${p.y})`}
                tabIndex={0}
                role="button"
                aria-label={`${n.id} ${n.label}, ${t(`type.${n.type}`)}, ${t(`state.${state}`)}`}
                onClick={activate(onNodeClick, n.id)}
                onKeyDown={activate(onNodeClick, n.id)}
                onMouseEnter={() => showTip(n.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => showTip(n.id)}
                onBlur={() => setHover(null)}
              >
                {isStart && <circle key={`halo-${n.id}`} className="node__halo" r={r * 1.9} />}
                <g key={`${state}-${isStart}`} className="node__body">
                  <NodeShape type={n.type} r={r} />
                  <text className="node__id" dy="0.35em">
                    {n.id}
                  </text>
                  {blocked && <Badge r={r} kind="blocked" />}
                  {closed && <Badge r={r} kind="closed" />}
                </g>
                <text className="node__label" y={(n.type === 'exit' ? r * 0.95 : r) + 16 * Math.max(k, 0.7)}>
                  {n.label}
                </text>
                {isStart && (
                  <g transform={`translate(0 ${-(r + 22 * Math.max(k, 0.7))})`}>
                    <g className="pin">
                      <rect x={-48} y={-11} width={96} height={22} rx={11} />
                      <text dy="0.35em">{t('map.youAreHere')}</text>
                    </g>
                  </g>
                )}
              </g>
            )
          })}
        </g>
      </svg>

      {/* A newly imported file may not contain the hovered node. */}
      {hover && graph.nodeById.has(hover.id) && (
        <div
          className={`map-tip${hover.below ? ' is-below' : ''}`}
          style={{ left: hover.left, top: hover.top }}
          role="tooltip"
        >
          <NodeTip node={graph.nodeById.get(hover.id)} hazards={hazards} result={result} />
        </div>
      )}
    </div>
  )
}

function NodeShape({ type, r }) {
  if (type === 'exit') {
    const w = r * 2.6
    const h = r * 1.9
    return <rect className="node__shape" x={-w / 2} y={-h / 2} width={w} height={h} rx={r * 0.4} />
  }
  if (type === 'room') {
    return <rect className="node__shape" x={-r} y={-r} width={r * 2} height={r * 2} rx={r * 0.35} />
  }
  return <circle className="node__shape" r={r} />
}

function Badge({ r, kind }) {
  const cx = r * (kind === 'closed' ? 1.25 : 0.9)
  const cy = -r * 0.9
  const s = r * 0.42
  return (
    <g className={`node__badge node__badge--${kind}`} transform={`translate(${cx} ${cy})`}>
      <circle r={s} />
      {kind === 'blocked' ? (
        <path d={`M${-s * 0.4} ${-s * 0.4}L${s * 0.4} ${s * 0.4}M${s * 0.4} ${-s * 0.4}L${-s * 0.4} ${s * 0.4}`} />
      ) : (
        <path
          d={`M${-s * 0.42} ${-s * 0.05}h${s * 0.84}v${s * 0.6}h${-s * 0.84}z M${-s * 0.25} ${-s * 0.05}v${-s * 0.25}a${s * 0.25} ${s * 0.25} 0 0 1 ${s * 0.5} 0v${s * 0.25}`}
        />
      )}
    </g>
  )
}

function NodeTip({ node, hazards, result }) {
  const { t, num } = useI18n()
  const blocked = hazards.blockedNodes.has(node.id)
  const closed = node.type === 'exit' && hazards.closedExits.has(node.id)
  const state = blocked ? 'blocked' : closed ? 'closed' : 'open'
  const cost = result.costs?.get(node.id)
  return (
    <>
      <div className="map-tip__title">
        <span className="mono">{node.id}</span> {node.label}
      </div>
      <div className="map-tip__meta">
        {t(`type.${node.type}`)} · <span className={`map-tip__state is-${state}`}>{t(`state.${state}`)}</span>
      </div>
      {result.startId && result.status !== 'start-blocked' && (
        <div className="map-tip__meta">
          {t('map.costFromStart')}: <span className="mono">{cost === undefined ? t('map.unreachable') : num(cost)}</span>
        </div>
      )}
    </>
  )
}
