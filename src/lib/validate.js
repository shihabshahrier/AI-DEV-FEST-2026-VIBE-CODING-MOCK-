// Validates a parsed building.json object against the Smart Escape schema.
// Returns { ok: true, graph } or { ok: false, errors: [{ code, params }] }.
// Error codes map to i18n keys `err.<code>` so messages can be shown in both languages.

const NODE_TYPES = new Set(['room', 'junction', 'exit'])
const STATE_FIELDS = ['blocked_nodes', 'blocked_edges', 'closed_exits']

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const isNonEmptyString = (v) => typeof v === 'string' && v.trim() !== ''

export function parseBuildingText(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, errors: [{ code: 'json' }] }
  }
  return validateBuilding(data)
}

export function validateBuilding(data) {
  const errors = []
  const err = (code, params) => errors.push({ code, params })

  if (!isObject(data)) return { ok: false, errors: [{ code: 'root' }] }

  if (!isNonEmptyString(data.building)) err('building')

  // --- nodes ---
  const nodes = []
  const nodeById = new Map()
  if (!Array.isArray(data.nodes)) {
    err('nodesArray')
  } else {
    if (data.nodes.length < 2 || data.nodes.length > 60) err('nodesCount', { n: data.nodes.length })
    data.nodes.forEach((n, i) => {
      if (!isObject(n)) return err('nodeObj', { i })
      if (!isNonEmptyString(n.id)) return err('nodeId', { i })
      if (nodeById.has(n.id)) return err('nodeDupId', { id: n.id })
      const before = errors.length
      if (!isNonEmptyString(n.label)) err('nodeLabel', { id: n.id })
      if (!NODE_TYPES.has(n.type)) err('nodeType', { id: n.id, type: String(n.type) })
      if (!Number.isFinite(n.x) || !Number.isFinite(n.y)) err('nodeCoord', { id: n.id })
      const node = { id: n.id, label: n.label, type: n.type, x: n.x, y: n.y }
      nodeById.set(n.id, node) // registered even if invalid, so edges don't report it as unknown
      if (errors.length === before) nodes.push(node)
    })
    if (!data.nodes.some((n) => n?.type === 'room' || n?.type === 'junction')) err('needRoom')
    if (!data.nodes.some((n) => n?.type === 'exit')) err('needExit')
  }

  // --- edges ---
  const edges = []
  const edgeById = new Map()
  if (!Array.isArray(data.edges)) {
    err('edgesArray')
  } else {
    if (data.edges.length < 1 || data.edges.length > 150) err('edgesCount', { n: data.edges.length })
    const pairs = new Set()
    data.edges.forEach((e, i) => {
      if (!isObject(e)) return err('edgeObj', { i })
      if (!isNonEmptyString(e.id)) return err('edgeId', { i })
      if (edgeById.has(e.id)) return err('edgeDupId', { id: e.id })
      edgeById.set(e.id, null) // reserve the id; replaced by the edge once it validates
      const before = errors.length
      for (const end of [e.from, e.to]) {
        if (typeof end !== 'string' || !nodeById.has(end)) err('edgeEndpoint', { id: e.id, node: String(end) })
      }
      if (errors.length === before && e.from === e.to) err('edgeSelf', { id: e.id })
      if (!Number.isInteger(e.cost) || e.cost <= 0) err('edgeCost', { id: e.id })
      if (errors.length !== before) return

      // Undirected: A-B and B-A are the same corridor.
      const key = e.from < e.to ? `${e.from}\u0000${e.to}` : `${e.to}\u0000${e.from}`
      if (pairs.has(key)) return err('edgeDupPair', { id: e.id, a: e.from, b: e.to })
      pairs.add(key)

      const edge = { id: e.id, from: e.from, to: e.to, cost: e.cost }
      edgeById.set(e.id, edge)
      edges.push(edge)
    })
  }

  // --- initial_state ---
  const initial = { blockedNodes: [], blockedEdges: [], closedExits: [] }
  if (!isObject(data.initial_state)) {
    err('state')
  } else {
    for (const field of STATE_FIELDS) {
      const list = data.initial_state[field]
      if (!Array.isArray(list)) {
        err('stateArray', { field })
        continue
      }
      const seen = new Set()
      for (const id of list) {
        if (seen.has(id)) continue // duplicates are harmless; keep the first
        seen.add(id)
        if (field === 'blocked_edges') {
          if (typeof id !== 'string' || !edgeById.has(id)) err('stateUnknown', { field, id: String(id) })
          else initial.blockedEdges.push(id)
          continue
        }
        const node = typeof id === 'string' ? nodeById.get(id) : undefined
        if (!node) {
          err('stateUnknown', { field, id: String(id) })
        } else if (field === 'blocked_nodes' && node.type === 'exit') {
          err('stateKind', { field, id, type: node.type })
        } else if (field === 'closed_exits' && node.type !== 'exit') {
          err('stateKind', { field, id, type: node.type })
        } else {
          const target = field === 'blocked_nodes' ? initial.blockedNodes : initial.closedExits
          target.push(id)
        }
      }
    }
  }

  if (errors.length) return { ok: false, errors }

  return {
    ok: true,
    graph: {
      building: data.building.trim(),
      nodes,
      edges,
      nodeById,
      edgeById,
      initial,
    },
  }
}

export function initialHazards(graph) {
  return {
    blockedNodes: new Set(graph.initial.blockedNodes),
    blockedEdges: new Set(graph.initial.blockedEdges),
    closedExits: new Set(graph.initial.closedExits),
  }
}
