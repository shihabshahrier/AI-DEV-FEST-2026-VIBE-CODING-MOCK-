import { useI18n } from '../lib/i18n.jsx'
import { MapPin, RotateCcw } from 'lucide-react'

export default function HazardPanel({
  graph,
  hazards,
  startId,
  onSetStart,
  onToggleNode,
  onToggleEdge,
  onToggleExit,
  onReset,
}) {
  const { t, num } = useI18n()

  const nodes = graph?.nodes || []
  const edges = graph?.edges || []

  const roomAndJunctionNodes = nodes.filter(
    (n) => n.type === 'room' || n.type === 'junction'
  )
  const exitNodes = nodes.filter((n) => n.type === 'exit')

  const blockedNodes = hazards?.blockedNodes || new Set()
  const blockedEdges = hazards?.blockedEdges || new Set()
  const closedExits = hazards?.closedExits || new Set()

  const activeNodesCount = roomAndJunctionNodes.filter((n) => blockedNodes.has(n.id)).length
  const activeEdgesCount = edges.filter((e) => blockedEdges.has(e.id)).length
  const activeExitsCount = exitNodes.filter((n) => closedExits.has(n.id)).length
  const totalHazards = blockedNodes.size + blockedEdges.size + closedExits.size

  return (
    <div className="card hazard-panel">
      {/* Starting Location Picker */}
      <div className="hazard-panel__select-wrap">
        <label htmlFor="hazard-panel-start-select" className="section-title">
          {t('panel.start')}
        </label>
        <select
          id="hazard-panel-start-select"
          className="hazard-panel__select"
          value={startId ?? ''}
          onChange={(e) => onSetStart?.(e.target.value)}
        >
          <option value="" disabled>
            {t('panel.startPlaceholder')}
          </option>
          {roomAndJunctionNodes.map((n) => {
            const isBlocked = blockedNodes.has(n.id)
            return (
              <option key={n.id} value={n.id} disabled={isBlocked}>
                {`${n.id} — ${n.label}${isBlocked ? ` · ${t('state.blocked')}` : ''}`}
              </option>
            )
          })}
        </select>
      </div>

      {/* Hazards Section Header */}
      <div className="hazard-panel__header">
        <div className="hazard-panel__header-left">
          <span className="section-title">{t('panel.hazards')}</span>
          <span className={`badge ${totalHazards > 0 ? 'badge--hazard' : ''}`}>
            {t('panel.activeHazards', { n: totalHazards })}
          </span>
        </div>
        <button type="button" className="btn btn-ghost" onClick={onReset}>
          <RotateCcw size={14} aria-hidden="true" />
          <span>{t('panel.reset')}</span>
        </button>
      </div>

      {/* 1. Rooms & Junctions */}
      <details open className="hazard-group">
        <summary className="hazard-group__summary">
          <span>{t('panel.nodes')}</span>
          <span className={`badge ${activeNodesCount > 0 ? 'badge--hazard' : ''}`}>
            {num(activeNodesCount)}
          </span>
        </summary>
        <div className="hazard-group__body">
          {roomAndJunctionNodes.map((n) => {
            const isBlocked = blockedNodes.has(n.id)
            const isStart = n.id === startId

            return (
              <div
                key={n.id}
                className={`hazard-row ${isBlocked ? 'hazard-row--active-hazard' : ''}`}
              >
                <div className="hazard-row__left">
                  {isStart && (
                    <MapPin
                      size={14}
                      className="hazard-row__start-icon"
                      aria-label={t('route.start')}
                    />
                  )}
                  <span className="hazard-row__id">{n.id}</span>
                  <span className="hazard-row__label">{n.label}</span>
                </div>

                <div className="hazard-row__right">
                  <span
                    className={`hazard-row__state ${
                      isBlocked ? 'hazard-row__state--blocked' : 'hazard-row__state--open'
                    }`}
                  >
                    {t(isBlocked ? 'state.blocked' : 'state.open')}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isBlocked}
                    aria-label={t(isBlocked ? 'action.unblock' : 'action.block')}
                    className={`toggle-switch ${isBlocked ? 'toggle-switch--hazard' : ''}`}
                    onClick={() => onToggleNode?.(n.id)}
                  >
                    <span className="toggle-switch__knob" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </details>

      {/* 2. Corridors (scrollable for up to 150) */}
      <details open className="hazard-group">
        <summary className="hazard-group__summary">
          <span>{t('panel.corridors')}</span>
          <span className={`badge ${activeEdgesCount > 0 ? 'badge--hazard' : ''}`}>
            {num(activeEdgesCount)}
          </span>
        </summary>
        <div className="hazard-group__body hazard-group__body--scrollable">
          {edges.map((edge) => {
            const isBlocked = blockedEdges.has(edge.id)

            return (
              <div
                key={edge.id}
                className={`hazard-row ${isBlocked ? 'hazard-row--active-hazard' : ''}`}
              >
                <div className="hazard-row__left">
                  <span className="hazard-row__id">{edge.id}</span>
                  <span className="hazard-row__label">
                    {edge.from} ↔ {edge.to}
                  </span>
                  <span className="chip">{num(edge.cost)}</span>
                </div>

                <div className="hazard-row__right">
                  <span
                    className={`hazard-row__state ${
                      isBlocked ? 'hazard-row__state--blocked' : 'hazard-row__state--open'
                    }`}
                  >
                    {t(isBlocked ? 'state.blocked' : 'state.open')}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isBlocked}
                    aria-label={t(isBlocked ? 'action.unblock' : 'action.block')}
                    className={`toggle-switch ${isBlocked ? 'toggle-switch--hazard' : ''}`}
                    onClick={() => onToggleEdge?.(edge.id)}
                  >
                    <span className="toggle-switch__knob" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </details>

      {/* 3. Exits */}
      <details open className="hazard-group">
        <summary className="hazard-group__summary">
          <span>{t('panel.exits')}</span>
          <span className={`badge ${activeExitsCount > 0 ? 'badge--warn' : ''}`}>
            {num(activeExitsCount)}
          </span>
        </summary>
        <div className="hazard-group__body">
          {exitNodes.map((n) => {
            const isClosed = closedExits.has(n.id)

            return (
              <div
                key={n.id}
                className={`hazard-row ${isClosed ? 'hazard-row--active-warn' : ''}`}
              >
                <div className="hazard-row__left">
                  <span className="hazard-row__id">{n.id}</span>
                  <span className="hazard-row__label">{n.label}</span>
                </div>

                <div className="hazard-row__right">
                  <span
                    className={`hazard-row__state ${
                      isClosed ? 'hazard-row__state--closed' : 'hazard-row__state--open'
                    }`}
                  >
                    {t(isClosed ? 'state.closed' : 'state.open')}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isClosed}
                    aria-label={t(isClosed ? 'action.reopen' : 'action.close')}
                    className={`toggle-switch ${isClosed ? 'toggle-switch--warn' : ''}`}
                    onClick={() => onToggleExit?.(n.id)}
                  >
                    <span className="toggle-switch__knob" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </details>
    </div>
  )
}
