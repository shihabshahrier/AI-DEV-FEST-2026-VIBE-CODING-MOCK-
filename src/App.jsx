import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { I18nProvider, useI18n } from './lib/i18n.jsx'
import { initialHazards, parseBuildingText } from './lib/validate.js'
import { findRoute } from './lib/route.js'
import Header from './components/Header.jsx'
import EmptyState from './components/EmptyState.jsx'
import MapView from './components/MapView.jsx'
import ModeSwitch from './components/ModeSwitch.jsx'
import Legend from './components/Legend.jsx'
import RoutePanel from './components/RoutePanel.jsx'
import HazardPanel from './components/HazardPanel.jsx'
import ImportErrors from './components/ImportErrors.jsx'
import Toast from './components/Toast.jsx'
import './map.css'

const SAVE_KEY = 'smart-escape.session'

// Restore the last session (file text + hazards + start) from localStorage, if valid.
function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY))
    const res = parseBuildingText(saved.text)
    if (!res.ok) return null
    const { graph } = res
    const keep = (ids, has) => new Set((ids ?? []).filter(has))
    return {
      text: saved.text,
      graph,
      hazards: {
        blockedNodes: keep(saved.hazards.blockedNodes, (id) => graph.nodeById.get(id)?.type !== 'exit' && graph.nodeById.has(id)),
        blockedEdges: keep(saved.hazards.blockedEdges, (id) => graph.edgeById.has(id)),
        closedExits: keep(saved.hazards.closedExits, (id) => graph.nodeById.get(id)?.type === 'exit'),
      },
      startId: graph.nodeById.get(saved.startId)?.type !== 'exit' && graph.nodeById.has(saved.startId) ? saved.startId : null,
    }
  } catch {
    return null
  }
}

export default function App() {
  return (
    <I18nProvider>
      <Shell />
    </I18nProvider>
  )
}

function Shell() {
  const { t } = useI18n()
  const [restored] = useState(loadSaved)
  const [text, setText] = useState(restored?.text ?? null)
  const [graph, setGraph] = useState(restored?.graph ?? null)
  const [hazards, setHazards] = useState(restored?.hazards ?? null)
  const [startId, setStartId] = useState(restored?.startId ?? null)
  const [mode, setMode] = useState('start')
  const [errors, setErrors] = useState(null)
  const [toast, setToast] = useState(null)
  const [highlightId, setHighlightId] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [reroute, setReroute] = useState(null)
  const [ghostPath, setGhostPath] = useState(null)
  const fileRef = useRef(null)
  const lastRoute = useRef(null)

  // The route is a pure function of graph + hazards + start, so it is
  // recalculated immediately on every change.
  const result = useMemo(() => findRoute(graph, hazards, startId), [graph, hazards, startId])

  // Toasts keep the i18n key so they follow a language switch.
  const notify = useCallback((key, params) => setToast({ id: Date.now(), key, params }), [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(timer)
  }, [toast])

  // Detect reroutes (same start, different route) to show the old route fading
  // out and the cost change badge.
  useEffect(() => {
    const prev = lastRoute.current
    const sig = result.status === 'ok' ? result.path.join('>') : result.status
    lastRoute.current = { graph, startId: result.startId, sig, result }
    if (!prev || prev.graph !== graph || prev.startId !== result.startId) {
      setReroute(null)
      setGhostPath(null)
      return
    }
    if (prev.sig === sig) return
    setGhostPath(prev.result.status === 'ok' ? prev.result.path : null)
    setReroute(
      prev.result.status === 'ok' && result.status === 'ok' ? { from: prev.result.cost, to: result.cost } : null,
    )
  }, [graph, result])

  // Save progress locally (browser storage only).
  useEffect(() => {
    if (!text || !hazards) return
    try {
      localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({
          text,
          startId,
          hazards: {
            blockedNodes: [...hazards.blockedNodes],
            blockedEdges: [...hazards.blockedEdges],
            closedExits: [...hazards.closedExits],
          },
        }),
      )
    } catch {
      /* storage unavailable */
    }
  }, [text, hazards, startId])

  const importText = useCallback(
    (raw) => {
      const res = parseBuildingText(raw)
      if (!res.ok) {
        setErrors(res.errors)
        return
      }
      setErrors(null)
      setText(raw)
      setGraph(res.graph)
      setHazards(initialHazards(res.graph))
      setStartId(null)
      setMode('start')
      notify('msg.loaded', { name: res.graph.building })
    },
    [notify],
  )

  const onFile = useCallback(
    async (file) => {
      if (!file) return
      try {
        importText(await file.text())
      } catch {
        setErrors([{ code: 'read' }])
      }
    },
    [importText],
  )

  const loadSample = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}building.json`)
      importText(await res.text())
    } catch {
      setErrors([{ code: 'read' }])
    }
  }, [importText])

  const toggle = (key, id) =>
    setHazards((h) => {
      const next = new Set(h[key])
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { ...h, [key]: next }
    })

  const setStart = (id) => {
    const node = graph.nodeById.get(id)
    if (!node) return
    if (node.type === 'exit') return notify('msg.exitNotStart')
    if (hazards.blockedNodes.has(id)) return notify('msg.blockedNotStart')
    setStartId(id)
  }

  const onNodeClick = (id) => {
    const node = graph.nodeById.get(id)
    if (mode === 'start') return setStart(id)
    toggle(node.type === 'exit' ? 'closedExits' : 'blockedNodes', id)
  }

  const reset = useCallback(() => {
    if (!graph) return
    setHazards(initialHazards(graph))
    notify('msg.reset')
  }, [graph, notify])

  // Keyboard shortcuts: S = set-start mode, H = hazard mode, R = reset.
  useEffect(() => {
    const onKey = (e) => {
      if (!graph || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.target.closest?.('input, select, textarea')) return
      const key = e.key.toLowerCase()
      if (key === 's') setMode('start')
      else if (key === 'h') setMode('hazard')
      else if (key === 'r') reset()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [graph, reset])

  const dragProps = {
    onDragOver: (e) => {
      e.preventDefault()
      setDragging(true)
    },
    onDragLeave: (e) => {
      if (e.currentTarget === e.target) setDragging(false)
    },
    onDrop: (e) => {
      e.preventDefault()
      setDragging(false)
      onFile(e.dataTransfer.files?.[0])
    },
  }

  return (
    <div className={`app${dragging ? ' is-dragging' : ''}`} {...dragProps}>
      <Header
        building={graph?.building}
        hasGraph={Boolean(graph)}
        onImport={() => fileRef.current?.click()}
        onLoadSample={loadSample}
      />
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(e) => {
          onFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />

      {errors && <ImportErrors errors={errors} onDismiss={() => setErrors(null)} />}

      {graph ? (
        <main className="workspace">
          <section className="map-stage">
            <MapView
              graph={graph}
              hazards={hazards}
              result={result}
              ghostPath={ghostPath}
              highlightId={highlightId}
              onNodeClick={onNodeClick}
              onEdgeClick={(id) => toggle('blockedEdges', id)}
            />
            <div className="overlay overlay-tl">
              <ModeSwitch mode={mode} onChange={setMode} />
            </div>
            <div className="overlay overlay-bl">
              <Legend />
            </div>
          </section>
          <aside className="sidebar">
            <RoutePanel result={result} graph={graph} reroute={reroute} onHoverNode={setHighlightId} />
            <HazardPanel
              graph={graph}
              hazards={hazards}
              startId={startId}
              onSetStart={setStart}
              onToggleNode={(id) => toggle('blockedNodes', id)}
              onToggleEdge={(id) => toggle('blockedEdges', id)}
              onToggleExit={(id) => toggle('closedExits', id)}
              onReset={reset}
            />
          </aside>
        </main>
      ) : (
        <EmptyState onFile={onFile} onLoadSample={loadSample} dragging={dragging} />
      )}

      <footer className="footer">{t('app.disclaimer')}</footer>
      <Toast message={toast && { id: toast.id, text: t(toast.key, toast.params) }} />
    </div>
  )
}
