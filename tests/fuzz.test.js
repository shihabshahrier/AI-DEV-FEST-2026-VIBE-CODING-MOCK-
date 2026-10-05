import { describe, expect, it } from 'vitest'
import { comparePaths, findRoute } from '../src/lib/route.js'
import { validateBuilding } from '../src/lib/validate.js'

// Deterministic PRNG so failures are reproducible.
function rng(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

function randomBuilding(rand) {
  const n = 3 + Math.floor(rand() * 6)
  const nodes = Array.from({ length: n }, (_, i) => ({
    id: `${'ABCDEFGH'[i]}${Math.floor(rand() * 3)}`,
    label: `N${i}`,
    type: i === 0 ? 'room' : i === 1 ? 'exit' : rand() < 0.3 ? 'exit' : rand() < 0.5 ? 'room' : 'junction',
    x: Math.floor(rand() * 100),
    y: Math.floor(rand() * 100),
  }))
  const edges = []
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (rand() < 0.5) edges.push({ id: `e${i}-${j}`, from: nodes[i].id, to: nodes[j].id, cost: 1 + Math.floor(rand() * 3) })
    }
  }
  if (!edges.length) edges.push({ id: 'e0-1', from: nodes[0].id, to: nodes[1].id, cost: 1 })
  return { building: 'Fuzz', nodes, edges, initial_state: { blocked_nodes: [], blocked_edges: [], closed_exits: [] } }
}

// Literal reading of the spec: enumerate every simple path, skipping blocked
// nodes/corridors and closed exits; open exits may appear mid-path.
function bruteForce(graph, hazards, start) {
  if (hazards.blockedNodes.has(start)) return { status: 'start-blocked' }
  let best = null
  const visit = (id, path, cost) => {
    const node = graph.nodeById.get(id)
    if (node.type === 'exit') {
      const cand = { exitId: id, path: [...path], cost }
      if (
        !best ||
        cand.cost < best.cost ||
        (cand.cost === best.cost && (cand.exitId < best.exitId || (cand.exitId === best.exitId && comparePaths(cand.path, best.path) < 0)))
      )
        best = cand
    }
    for (const e of graph.edges) {
      if (hazards.blockedEdges.has(e.id)) continue
      const next = e.from === id ? e.to : e.to === id ? e.from : null
      if (!next || path.includes(next) || hazards.blockedNodes.has(next) || hazards.closedExits.has(next)) continue
      path.push(next)
      visit(next, path, cost + e.cost)
      path.pop()
    }
  }
  visit(start, [start], 0)
  return best ? { status: 'ok', ...best } : { status: 'no-route' }
}

describe('router matches brute force on random graphs', () => {
  it('1500 random graphs with random hazards', () => {
    const rand = rng(42)
    let checked = 0
    for (let k = 0; k < 1500; k++) {
      const res = validateBuilding(randomBuilding(rand))
      if (!res.ok) continue // e.g. random duplicate ids
      const { graph } = res
      const hazards = { blockedNodes: new Set(), blockedEdges: new Set(), closedExits: new Set() }
      for (const n of graph.nodes) {
        if (rand() < 0.15) (n.type === 'exit' ? hazards.closedExits : hazards.blockedNodes).add(n.id)
      }
      for (const e of graph.edges) if (rand() < 0.15) hazards.blockedEdges.add(e.id)

      for (const start of graph.nodes.filter((n) => n.type !== 'exit')) {
        const got = findRoute(graph, hazards, start.id)
        const want = bruteForce(graph, hazards, start.id)
        expect(got.status, JSON.stringify({ k, start: start.id })).toBe(want.status)
        if (want.status === 'ok') {
          expect({ exit: got.exitId, cost: got.cost, path: got.path }).toEqual({
            exit: want.exitId,
            cost: want.cost,
            path: want.path,
          })
        }
        checked++
      }
    }
    expect(checked).toBeGreaterThan(1000)
  })
})
