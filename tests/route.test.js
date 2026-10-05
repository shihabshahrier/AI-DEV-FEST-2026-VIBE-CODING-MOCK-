import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { findRoute } from '../src/lib/route.js'
import { initialHazards, parseBuildingText, validateBuilding } from '../src/lib/validate.js'

const sample = JSON.parse(readFileSync(new URL('../public/building.json', import.meta.url), 'utf8'))

function load(data) {
  const res = validateBuilding(data)
  if (!res.ok) throw new Error(JSON.stringify(res.errors))
  return res.graph
}

function run(data, startId, { blockNodes = [], blockEdges = [], closeExits = [] } = {}) {
  const graph = load(data)
  const h = initialHazards(graph)
  blockNodes.forEach((id) => h.blockedNodes.add(id))
  blockEdges.forEach((id) => h.blockedEdges.add(id))
  closeExits.forEach((id) => h.closedExits.add(id))
  return findRoute(graph, h, startId)
}

const node = (id, type = 'junction', x = 0, y = 0) => ({ id, label: id, type, x, y })
const edge = (id, from, to, cost) => ({ id, from, to, cost })
const building = (nodes, edges, initial_state = {}) => ({
  building: 'Test',
  nodes,
  edges,
  initial_state: { blocked_nodes: [], blocked_edges: [], closed_exits: [], ...initial_state },
})

describe('sample checks (problem statement 4.1)', () => {
  it('baseline: R1 -> E1, cost 7', () => {
    const r = run(sample, 'R1')
    expect(r.status).toBe('ok')
    expect(r.path).toEqual(['R1', 'C1', 'C2', 'E1'])
    expect(r.cost).toBe(7)
  })

  it('blocked junction C2: R1-C1-C3-C4-E2, cost 11 (tie broken by node sequence)', () => {
    const r = run(sample, 'R1', { blockNodes: ['C2'] })
    expect(r.path).toEqual(['R1', 'C1', 'C3', 'C4', 'E2'])
    expect(r.cost).toBe(11)
  })

  it('both exits closed: no route', () => {
    expect(run(sample, 'R1', { closeExits: ['E1', 'E2'] }).status).toBe('no-route')
  })

  it('different start R2: R2-C3-C4-E2, cost 7', () => {
    const r = run(sample, 'R2')
    expect(r.path).toEqual(['R2', 'C3', 'C4', 'E2'])
    expect(r.cost).toBe(7)
  })

  it('blocked start', () => {
    expect(run(sample, 'R1', { blockNodes: ['R1'] }).status).toBe('start-blocked')
  })
})

describe('routing rules', () => {
  it('uses edge costs, not corridor count', () => {
    const data = building(
      [node('S', 'room'), node('A'), node('B'), node('X', 'exit')],
      [edge('e1', 'S', 'X', 10), edge('e2', 'S', 'A', 1), edge('e3', 'A', 'B', 1), edge('e4', 'B', 'X', 1)],
    )
    expect(run(data, 'S').path).toEqual(['S', 'A', 'B', 'X'])
  })

  it('equal cost exits: lexicographically smallest exit id wins', () => {
    const data = building(
      [node('S', 'room'), node('Z', 'exit'), node('E2', 'exit'), node('E10', 'exit')],
      [edge('a', 'S', 'Z', 3), edge('b', 'S', 'E2', 3), edge('c', 'S', 'E10', 3)],
    )
    const r = run(data, 'S')
    expect(r.exitId).toBe('E10') // code-unit order: "E10" < "E2" < "Z"
    expect(r.alternatives.map((a) => a.exitId)).toEqual(['E2', 'Z'])
  })

  it('equal cost paths to same exit: smallest node sequence wins regardless of edge order', () => {
    const data = building(
      [node('S', 'room'), node('B'), node('A'), node('X', 'exit')],
      [edge('e1', 'S', 'B', 1), edge('e2', 'B', 'X', 1), edge('e3', 'S', 'A', 1), edge('e4', 'A', 'X', 1)],
    )
    expect(run(data, 'S').path).toEqual(['S', 'A', 'X'])
  })

  it('tie-break compares the whole sequence, not just the last hop', () => {
    // Two cost-4 routes to X: S-A-D-X and S-B-C-X. "A" < "B" decides it.
    const data = building(
      [node('S', 'room'), node('A'), node('B'), node('C'), node('D'), node('X', 'exit')],
      [
        edge('1', 'S', 'B', 1), edge('2', 'B', 'C', 1), edge('3', 'C', 'X', 2),
        edge('4', 'S', 'A', 2), edge('5', 'A', 'D', 1), edge('6', 'D', 'X', 1),
      ],
    )
    expect(run(data, 'S').path).toEqual(['S', 'A', 'D', 'X'])
  })

  it('ids are case-sensitive (uppercase sorts before lowercase)', () => {
    const data = building(
      [node('S', 'room'), node('a'), node('B'), node('X', 'exit')],
      [edge('1', 'S', 'a', 1), edge('2', 'a', 'X', 1), edge('3', 'S', 'B', 1), edge('4', 'B', 'X', 1)],
    )
    expect(run(data, 'S').path).toEqual(['S', 'B', 'X'])
  })

  it('blocked corridor removes only that connection', () => {
    const r = run(sample, 'R1', { blockEdges: ['L02'] })
    expect(r.status).toBe('ok')
    expect(r.cost).toBe(11)
    expect(r.path).toEqual(['R1', 'C1', 'C3', 'C4', 'E2'])
  })

  it('closed exit is not used as an intermediate node', () => {
    const data = building(
      [node('S', 'room'), node('E1', 'exit'), node('A'), node('E2', 'exit')],
      [edge('1', 'S', 'E1', 1), edge('2', 'E1', 'E2', 1), edge('3', 'S', 'A', 5), edge('4', 'A', 'E2', 5)],
    )
    const r = run(data, 'S', { closeExits: ['E1'] })
    expect(r.path).toEqual(['S', 'A', 'E2'])
    expect(r.cost).toBe(10)
  })

  it('disconnected graph: unreachable exit gives no route', () => {
    const data = building(
      [node('S', 'room'), node('A'), node('X', 'exit'), node('Y', 'room')],
      [edge('1', 'S', 'A', 1), edge('2', 'Y', 'X', 1)],
    )
    expect(run(data, 'S').status).toBe('no-route')
    expect(run(data, 'Y').path).toEqual(['Y', 'X'])
  })

  it('respects initial_state', () => {
    const data = { ...sample, initial_state: { blocked_nodes: ['C2'], blocked_edges: [], closed_exits: [] } }
    expect(run(data, 'R1').cost).toBe(11)
  })

  it('no start selected is idle', () => {
    expect(run(sample, null).status).toBe('idle')
  })

  it('steps sum to the total cost', () => {
    const r = run(sample, 'R1', { blockNodes: ['C2'] })
    expect(r.steps.reduce((s, x) => s + x.cost, 0)).toBe(r.cost)
    expect(r.edgeIds).toEqual(['L01', 'L08', 'L06', 'L07'])
  })
})

describe('validation', () => {
  const codes = (data) => {
    const r = validateBuilding(data)
    return r.ok ? [] : r.errors.map((e) => e.code)
  }

  it('accepts the sample', () => {
    expect(validateBuilding(sample).ok).toBe(true)
  })

  it('rejects invalid JSON text', () => {
    expect(parseBuildingText('{nope').errors[0].code).toBe('json')
  })

  it('rejects non-object roots and missing sections', () => {
    expect(codes([])).toEqual(['root'])
    expect(codes({})).toEqual(expect.arrayContaining(['building', 'nodesArray', 'edgesArray', 'state']))
  })

  it('rejects bad nodes', () => {
    const data = structuredClone(sample)
    data.nodes[0].type = 'stairs'
    data.nodes[1].x = '60'
    data.nodes[2].label = ''
    data.nodes.push({ ...data.nodes[3] })
    expect(codes(data)).toEqual(expect.arrayContaining(['nodeType', 'nodeCoord', 'nodeLabel', 'nodeDupId']))
  })

  it('rejects bad edges', () => {
    const data = structuredClone(sample)
    data.edges.push(edge('L10', 'R1', 'R1', 1))
    data.edges.push(edge('L11', 'C1', 'R1', 5)) // repeats R1-C1 reversed
    data.edges.push(edge('L12', 'R1', 'NOPE', 1))
    data.edges.push(edge('L13', 'R2', 'C4', 1.5))
    data.edges.push(edge('L14', 'R2', 'C2', '3'))
    data.edges.push(edge('L01', 'R2', 'E1', 1))
    expect(codes(data)).toEqual(
      expect.arrayContaining(['edgeSelf', 'edgeDupPair', 'edgeEndpoint', 'edgeCost', 'edgeDupId']),
    )
    expect(codes(data).filter((c) => c === 'edgeCost')).toHaveLength(2)
  })

  it('rejects inconsistent initial_state', () => {
    const data = structuredClone(sample)
    data.initial_state = { blocked_nodes: ['E1', 'ZZ'], blocked_edges: ['C1'], closed_exits: ['R1'] }
    expect(codes(data)).toEqual(['stateKind', 'stateUnknown', 'stateUnknown', 'stateKind'])
  })

  it('enforces size limits and required node types', () => {
    expect(codes(building([node('X', 'exit')], [edge('1', 'X', 'X', 1)]))).toEqual(
      expect.arrayContaining(['nodesCount', 'needRoom']),
    )
    expect(codes(building([node('A'), node('B')], [edge('1', 'A', 'B', 1)]))).toContain('needExit')
    expect(codes(building([node('A'), node('X', 'exit')], []))).toContain('edgesCount')
  })

  it('accepts empty initial-state arrays and disconnected graphs', () => {
    const data = building([node('A'), node('X', 'exit'), node('B')], [edge('1', 'A', 'X', 1)])
    expect(validateBuilding(data).ok).toBe(true)
  })
})
