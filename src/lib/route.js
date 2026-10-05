// Lowest-cost evacuation routing (Dijkstra) with the contest's exact tie-breaking:
//   1. minimum total cost (sum of corridor costs)
//   2. on equal cost, the lexicographically smallest exit id
//   3. if paths to that exit still tie, the lexicographically smallest node-id sequence
// Blocked nodes (and their corridors), blocked corridors and closed exits are excluded entirely.

// Plain code-unit comparison: ids are case-sensitive, so no localeCompare.
const cmpId = (a, b) => (a < b ? -1 : a > b ? 1 : 0)

export function comparePaths(a, b) {
  const n = Math.min(a.length, b.length)
  for (let i = 0; i < n; i++) {
    const c = cmpId(a[i], b[i])
    if (c !== 0) return c
  }
  return a.length - b.length
}

// Adjacency list of usable corridors under the current hazards.
function buildAdjacency(graph, hazards) {
  const usableNode = (id) => {
    const node = graph.nodeById.get(id)
    if (hazards.blockedNodes.has(id)) return false
    if (node.type === 'exit' && hazards.closedExits.has(id)) return false
    return true
  }
  const adj = new Map(graph.nodes.map((n) => [n.id, []]))
  for (const e of graph.edges) {
    if (hazards.blockedEdges.has(e.id)) continue
    if (!usableNode(e.from) || !usableNode(e.to)) continue
    adj.get(e.from).push({ to: e.to, cost: e.cost, edgeId: e.id })
    adj.get(e.to).push({ to: e.from, cost: e.cost, edgeId: e.id })
  }
  return adj
}

// Single-source Dijkstra. For each reached node keeps the cheapest cost and,
// among equal-cost paths, the lexicographically smallest node sequence.
// Exits are terminal: with positive costs, a path through another open exit
// always reaches that exit more cheaply, so it can never be the chosen route.
function shortestPaths(graph, adj, startId) {
  const best = new Map([[startId, { cost: 0, path: [startId], edgeIds: [] }]])
  const done = new Set()

  for (;;) {
    // n ≤ 60, so a linear scan for the next node is simpler than a heap.
    let current = null
    for (const [id, entry] of best) {
      if (done.has(id)) continue
      if (!current || entry.cost < current.entry.cost) current = { id, entry }
    }
    if (!current) break
    done.add(current.id)
    if (graph.nodeById.get(current.id).type === 'exit') continue

    for (const { to, cost, edgeId } of adj.get(current.id)) {
      if (done.has(to)) continue
      const candidate = {
        cost: current.entry.cost + cost,
        path: [...current.entry.path, to],
        edgeIds: [...current.entry.edgeIds, edgeId],
      }
      const known = best.get(to)
      if (
        !known ||
        candidate.cost < known.cost ||
        (candidate.cost === known.cost && comparePaths(candidate.path, known.path) < 0)
      ) {
        best.set(to, candidate)
      }
    }
  }
  return best
}

export function findRoute(graph, hazards, startId) {
  if (!graph || !startId || !graph.nodeById.has(startId)) return { status: 'idle', startId: null }
  if (hazards.blockedNodes.has(startId)) return { status: 'start-blocked', startId }

  const adj = buildAdjacency(graph, hazards)
  const best = shortestPaths(graph, adj, startId)

  const reachableExits = graph.nodes
    .filter((n) => n.type === 'exit' && !hazards.closedExits.has(n.id) && best.has(n.id))
    .map((n) => ({ exitId: n.id, ...best.get(n.id) }))
    .sort((a, b) => a.cost - b.cost || cmpId(a.exitId, b.exitId))

  const costs = new Map([...best].map(([id, entry]) => [id, entry.cost]))
  if (reachableExits.length === 0) return { status: 'no-route', startId, costs }

  const [chosen, ...others] = reachableExits
  const steps = chosen.edgeIds.map((edgeId, i) => ({
    from: chosen.path[i],
    to: chosen.path[i + 1],
    edgeId,
    cost: graph.edgeById.get(edgeId).cost,
  }))

  return {
    status: 'ok',
    startId,
    path: chosen.path,
    edgeIds: chosen.edgeIds,
    exitId: chosen.exitId,
    cost: chosen.cost,
    steps,
    alternatives: others.map(({ exitId, cost, path }) => ({ exitId, cost, path })),
    costs,
  }
}
