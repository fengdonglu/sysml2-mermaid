import dagre from '@dagrejs/dagre';
import type { ViewDescription } from '../views/types.js';
import type { Scene, SceneEdge, SceneGroup, SceneNode } from './types.js';

const HEADER_H = 36;
const ROW_H = 20;
const PAD = 20;
const MIN_W = 140;
const CHAR_W = 8;

export function dagreLayout(view: ViewDescription): Scene {
  const g = new dagre.graphlib.Graph({ multigraph: true, compound: true });
  g.setGraph({ rankdir: 'TB', nodesep: 40, ranksep: 70, marginx: PAD, marginy: PAD });
  g.setDefaultEdgeLabel(() => ({}));

  const nodes: SceneNode[] = [];
  for (const n of view.nodes) {
    const width = Math.max(MIN_W, Math.max(n.label.length, n.stereotype.length + 2) * CHAR_W + 24);
    const height = HEADER_H + n.rows.length * ROW_H + (n.note ? ROW_H : 0) + (n.ports.length ? 8 : 0);
    nodes.push({ ...n, x: 0, y: 0, width, height });
    g.setNode(n.id, { width, height });
  }

  for (const grp of view.groups ?? []) {
    g.setNode(grp.id, {});
    for (const member of grp.members) if (g.hasNode(member)) g.setParent(member, grp.id);
  }

  const edges: SceneEdge[] = [];
  for (const e of view.edges) {
    if (!g.hasNode(e.source) || !g.hasNode(e.target)) continue;
    edges.push({ id: e.id, kind: e.kind, source: e.source, target: e.target, points: [], label: e.label });
    g.setEdge(e.source, e.target, { id: e.id }, e.id);
  }

  dagre.layout(g);

  const byId = new Map(nodes.map((n) => [n.id, n]));
  for (const id of g.nodes()) {
    const n = byId.get(id);
    const gn = g.node(id);
    if (!n || !gn) continue;
    n.x = gn.x - gn.width / 2;
    n.y = gn.y - gn.height / 2;
    n.width = gn.width;
    n.height = gn.height;
  }

  const byEdge = new Map(edges.map((e) => [e.id, e]));
  for (const ge of g.edges()) {
    const e = byEdge.get(g.edge(ge).id);
    if (e) e.points = g.edge(ge).points ?? [];
  }

  const groups: SceneGroup[] = [];
  for (const grp of view.groups ?? []) {
    const gn = g.node(grp.id);
    if (!gn || !Number.isFinite(gn.x) || !Number.isFinite(gn.y)) continue;
    groups.push({ id: grp.id, label: grp.label, x: gn.x - gn.width / 2, y: gn.y - gn.height / 2, width: gn.width, height: gn.height });
  }

  const graph = g.graph();
  const width = (Number.isFinite(graph.width) ? (graph.width as number) : 0) + PAD * 2;
  const height = (Number.isFinite(graph.height) ? (graph.height as number) : 0) + PAD * 2;
  return { nodes, edges, width, height, ...(groups.length ? { groups } : {}) };
}
