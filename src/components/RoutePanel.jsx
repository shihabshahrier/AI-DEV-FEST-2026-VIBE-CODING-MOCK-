import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../lib/i18n.jsx'
import {
  CheckCircle2,
  OctagonX,
  TriangleAlert,
  MousePointerClick,
  Shuffle,
  ChevronRight,
} from 'lucide-react'

function useTweenedNumber(target, duration = 400) {
  const [current, setCurrent] = useState(target)
  const prevTargetRef = useRef(target)

  useEffect(() => {
    const startVal = prevTargetRef.current ?? target
    prevTargetRef.current = target

    if (startVal === target) {
      return
    }

    let startTime = null
    let animId = null

    const step = (timestamp) => {
      if (target == null) {
        setCurrent(null)
        return
      }

      if (
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        setCurrent(target)
        return
      }

      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3)
      const val = Math.round(startVal + (target - startVal) * ease)
      setCurrent(val)

      if (progress < 1) {
        animId = requestAnimationFrame(step)
      } else {
        setCurrent(target)
      }
    }

    animId = requestAnimationFrame(step)
    return () => {
      if (animId) cancelAnimationFrame(animId)
    }
  }, [target, duration])

  return current
}

function computeStepsWithTotals(steps) {
  let running = 0
  return steps.map((step) => {
    running += step.cost
    return { ...step, total: running }
  })
}

export default function RoutePanel({ result, graph, reroute, onHoverNode }) {
  const { t, num } = useI18n()
  const status = result?.status ?? 'idle'
  const isOk = status === 'ok'
  const displayedCost = useTweenedNumber(isOk ? result?.cost : null)

  const exitNode = isOk && result?.exitId && graph?.nodeById ? graph.nodeById.get(result.exitId) : null
  const exitLabel = exitNode?.label || ''

  // Step-by-step with running cumulative cost
  const stepsWithTotal = isOk && result?.steps ? computeStepsWithTotals(result.steps) : []

  // Has reroute diff?
  const hasReroute = Boolean(reroute && reroute.from !== reroute.to)
  const costIncreased = hasReroute && reroute.to > reroute.from
  const diffCost = hasReroute ? reroute.to - reroute.from : 0

  return (
    <div className={`card route-card route-card--${status}`}>
      {/* Top Status Banner */}
      <div className={`route-card__status-banner route-card__status-banner--${status}`}>
        {status === 'ok' && (
          <>
            <CheckCircle2 size={18} aria-hidden="true" />
            <div className="route-card__status-info">
              <span className="route-card__status-title">{t('status.ok')}</span>
            </div>
          </>
        )}

        {status === 'no-route' && (
          <>
            <OctagonX size={18} aria-hidden="true" />
            <div className="route-card__status-info">
              <span className="route-card__status-title">{t('status.noRoute')}</span>
              <p className="route-card__status-hint">{t('status.noRouteHint')}</p>
            </div>
          </>
        )}

        {status === 'start-blocked' && (
          <>
            <TriangleAlert size={18} aria-hidden="true" />
            <div className="route-card__status-info">
              <span className="route-card__status-title">{t('status.startBlocked')}</span>
              <p className="route-card__status-hint">{t('status.startBlockedHint')}</p>
            </div>
          </>
        )}

        {status === 'idle' && (
          <>
            <MousePointerClick size={18} aria-hidden="true" />
            <div className="route-card__status-info">
              <span className="route-card__status-title">{t('status.idle')}</span>
              <p className="route-card__status-hint">{t('status.idleHint')}</p>
            </div>
          </>
        )}
      </div>

      {/* Body content cross-fades on status change */}
      <div key={status} className="route-card__body-transition">
        {isOk && (
          <>
            {/* Evacuate via Exit + Big Cost */}
            <div className="route-card__evac-row">
              <div className="route-card__evac-left">
                <span className="section-title">{t('route.evacuateVia')}</span>
                <span className="route-card__exit-id">{result.exitId}</span>
                {exitLabel && <span className="route-card__exit-label">{exitLabel}</span>}
              </div>

              <div className="route-card__cost-group">
                <span className="section-title">{t('route.cost')}</span>
                <span className="route-card__cost-value">
                  {num(displayedCost ?? result.cost)}
                </span>
              </div>
            </div>

            {/* Rerouted Badge */}
            {hasReroute && (
              <div className="route-card__reroute-wrap">
                <span className={`badge ${costIncreased ? 'badge--warn' : 'badge--exit'}`}>
                  <Shuffle size={12} aria-hidden="true" />
                  <span>
                    {t('route.rerouted')}{' '}
                    {num(reroute.from)} → {num(reroute.to)} (
                    {diffCost > 0 ? '+' : ''}
                    {num(diffCost)})
                  </span>
                </span>
              </div>
            )}

            {/* Route Chips */}
            {result.path && result.path.length > 0 && (
              <div className="route-card__path-section">
                <span className="section-title">{t('route.path')}</span>
                <div className="route-card__chips" key={result.path.join('>')}>
                  {result.path.map((nodeId, idx) => {
                    const isStart = idx === 0
                    const isExit = idx === result.path.length - 1
                    const chipClass = isStart
                      ? 'route-chip route-chip--start'
                      : isExit
                        ? 'route-chip route-chip--exit'
                        : 'route-chip'

                    return (
                      <span
                        key={nodeId}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <button
                          type="button"
                          className={chipClass}
                          style={{ animationDelay: `${idx * 30}ms` }}
                          onMouseEnter={() => onHoverNode?.(nodeId)}
                          onMouseLeave={() => onHoverNode?.(null)}
                          onFocus={() => onHoverNode?.(nodeId)}
                          onBlur={() => onHoverNode?.(null)}
                        >
                          {nodeId}
                        </button>
                        {!isExit && (
                          <ChevronRight
                            size={14}
                            className="route-card__path-sep"
                            aria-hidden="true"
                          />
                        )}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Step-by-step corridor list */}
            {stepsWithTotal.length > 0 && (
              <details open className="route-card__details">
                <summary className="route-card__summary">
                  <span>{t('route.steps')}</span>
                  <span className="route-card__step-count">
                    {t('route.stepsCount', { n: stepsWithTotal.length })}
                  </span>
                </summary>
                <ol className="route-card__step-list">
                  {stepsWithTotal.map((step, idx) => (
                    <li
                      key={`${step.from}-${step.to}-${step.edgeId}-${idx}`}
                      className="route-step"
                    >
                      <span className="route-step__endpoints">
                        {step.from} → {step.to}
                      </span>
                      <span className="route-step__corridor">{step.edgeId}</span>
                      <div className="route-step__costs">
                        <span className="route-step__cost">+{num(step.cost)}</span>
                        <span className="route-step__total">{num(step.total)}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </details>
            )}

            {/* Alternatives */}
            <div className="route-card__alts-section">
              <span className="section-title">{t('route.alternatives')}</span>
              {result.alternatives && result.alternatives.length > 0 ? (
                <div className="route-card__alts-list">
                  {result.alternatives.map((alt) => (
                    <div key={alt.exitId} className="route-alt">
                      <div className="route-alt__left">
                        <span className="chip chip--exit-outline">{alt.exitId}</span>
                        <span className="route-alt__label">
                          {graph?.nodeById?.get(alt.exitId)?.label ?? alt.exitId}
                        </span>
                      </div>
                      <span className="route-alt__cost">{num(alt.cost)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="route-card__no-alts">{t('route.noAlternatives')}</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
