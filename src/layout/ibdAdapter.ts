import dagre from '@dagrejs/dagre';
import type { ViewDescription } from '../views/types.js';
import type { Scene, SceneEdge, SceneNode } from './types.js';

const HEADER_H = 30;
const PAD = 20;
const MIN_W = 120;
const CHAR_W = 8;

export function ibdLayout(view: ViewDescription): Scene {
  const g = new dagre.graphlib.Graph({ multigraph: true });
  g.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 100, marginx: PAD, marginy: PAD });
  g.setDefaultEdgeLabel(() => ({}));

  const nodes: SceneNode[] = [];
  for (const n of view.nodes) {
    const width = Math.max(MIN_W, Math.max(n.label.length, n.stereotype.length) * CHAR_W + 24);
    const height = Math.max(50, HEADER_H + 20);
    nodes.push({ ...n, x: 0, y: 0, width, height });
    g.setNode(n.id, { width, height });
  }

  const edges: SceneEdge[] = [];
  for (const e of view.edges) {
    if (!g.hasNode(e.source) || !g.hasNode(e.target)) continue;
    edges.push({
      id: e.id, kind: e.kind, source: e.source, target: e.target,
      points: [], label: e.label, sourcePort: e.sourcePort, targetPort: e.targetPort,
    });
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

  const leftPorts = new Map<string, string[]>();
  const rightPorts = new Map<string, string[]>();
  const push = (map: Map<string, string[]>, key: string, value: string): void => {
    const arr = map.get(key) ?? [];
    if (!arr.includes(value)) arr.push(value);
    map.set(key, arr);
  };
  for (const e of edges) {
    if (e.targetPort) push(leftPorts, e.target, e.targetPort);
    if (e.sourcePort) push(rightPorts, e.source, e.sourcePort);
  }

  const anchorOf = new Map<string, { x: number; y: number }>();
  for (const n of nodes) {
    const left = leftPorts.get(n.id) ?? [];
    const right = [...new Set([...(rightPorts.get(n.id) ?? []), ...n.ports.filter((p) => !left.includes(p))])];
    const anchors: { name: string; x: number; y: number }[] = [];
    right.forEach((name, i) => anchors.push({ name, x: n.x + n.width, y: n.y + ((i + 1) * n.height) / (right.length + 1) }));
    left.forEach((name, i) => anchors.push({ name, x: n.x, y: n.y + ((i + 1) * n.height) / (left.length + 1) }));
    n.portAnchors = anchors;
    for (const a of anchors) anchorOf.set(`${n.id}::${a.name}`, { x: a.x, y: a.y });
  }

  const byEdge = new Map(edges.map((e) => [e.id, e]));
  for (const ge of g.edges()) {
    const e = byEdge.get(g.edge(ge).id);
    if (!e) continue;
    const src = e.sourcePort ? anchorOf.get(`${e.source}::${e.sourcePort}`) : undefined;
    const tgt = e.targetPort ? anchorOf.get(`${e.target}::${e.targetPort}`) : undefined;
    e.points = src && tgt ? [src, tgt] : g.edge(ge).points ?? [];
  }

  const graph = g.graph();
  const width = (Number.isFinite(graph.width) ? (graph.width as number) : 0) + PAD * 2;
  const height = (Number.isFinite(graph.height) ? (graph.height as number) : 0) + PAD * 2;
  return { nodes, edges, width, height };
}
