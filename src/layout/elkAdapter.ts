import ELK from 'elkjs/lib/elk.bundled.js';
import type { ViewDescription } from '../views/types.js';
import type { Scene, SceneEdge, SceneNode } from './types.js';

const HEADER_H = 36;
const ROW_H = 20;
const MIN_W = 140;
const CHAR_W = 8;
const PORT = 8;

const portId = (node: string, port: string): string => `${node}::${port}`;

function sizeOf(n: ViewDescription['nodes'][number]): { width: number; height: number } {
  const width = Math.max(MIN_W, Math.max(n.label.length, n.stereotype.length + 2) * CHAR_W + 24);
  const height = HEADER_H + n.rows.length * ROW_H + (n.note ? ROW_H : 0) + (n.ports.length ? 8 : 0);
  return { width, height };
}

export async function elkLayout(view: ViewDescription): Promise<Scene> {
  const elk = new ELK();
  const nodeIds = new Set(view.nodes.map((n) => n.id));

  // Which side each port faces: sources east, targets west.
  const sourcePorts = new Set<string>();
  const targetPorts = new Set<string>();
  for (const e of view.edges) {
    if (e.sourcePort) sourcePorts.add(portId(e.source, e.sourcePort));
    if (e.targetPort) targetPorts.add(portId(e.target, e.targetPort));
  }

  const children = view.nodes.map((n) => {
    const { width, height } = sizeOf(n);
    return {
      id: n.id,
      width,
      height,
      layoutOptions: n.ports.length ? { 'elk.portConstraints': 'FIXED_SIDE' } : {},
      ports: n.ports.map((p) => ({
        id: portId(n.id, p),
        width: PORT,
        height: PORT,
        layoutOptions: { 'elk.port.side': targetPorts.has(portId(n.id, p)) ? 'WEST' : 'EAST' },
      })),
    };
  });

  const edges = view.edges
    .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
    .map((e) => ({
      id: e.id,
      sources: [e.sourcePort ? portId(e.source, e.sourcePort) : e.source],
      targets: [e.targetPort ? portId(e.target, e.targetPort) : e.target],
    }));

  const graph = await elk.layout({
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.spacing.nodeNode': '40',
      'elk.layered.spacing.nodeNodeBetweenLayers': '90',
    },
    children,
    edges,
  });

  const byId = new Map<string, SceneNode>();
  for (const child of graph.children ?? []) {
    const viewNode = view.nodes.find((n) => n.id === child.id);
    if (!viewNode) continue;
    const node: SceneNode = {
      ...viewNode,
      x: child.x ?? 0,
      y: child.y ?? 0,
      width: child.width ?? 0,
      height: child.height ?? 0,
    };
    if (child.ports && child.ports.length) {
      node.portAnchors = child.ports.map((p: { id: string; x?: number; y?: number; width?: number; height?: number }) => ({
        name: p.id.slice(p.id.indexOf('::') + 2),
        x: node.x + (p.x ?? 0) + (p.width ?? 0) / 2,
        y: node.y + (p.y ?? 0) + (p.height ?? 0) / 2,
      }));
    }
    byId.set(node.id, node);
  }
  const nodes = view.nodes.map((n) => byId.get(n.id)).filter((n): n is SceneNode => !!n);

  const sceneEdges: SceneEdge[] = [];
  for (const edge of graph.edges ?? []) {
    const points: { x: number; y: number }[] = [];
    for (const section of edge.sections ?? []) {
      if (section.startPoint) points.push(section.startPoint);
      for (const bend of section.bendPoints ?? []) points.push(bend);
      if (section.endPoint) points.push(section.endPoint);
    }
    const model = view.edges.find((e) => e.id === edge.id);
    sceneEdges.push({
      id: edge.id,
      kind: model?.kind ?? 'reference',
      source: model?.source ?? '',
      target: model?.target ?? '',
      points,
      label: model?.label,
      sourcePort: model?.sourcePort,
      targetPort: model?.targetPort,
    });
  }

  const width = (graph.width ?? 0) + 40;
  const height = (graph.height ?? 0) + 40;
  return { nodes, edges: sceneEdges, width, height };
}
