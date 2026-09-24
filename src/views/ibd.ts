import type { Element, SysmlModel } from '../core/model/types.js';
import type { ViewDescription, ViewEdge, ViewEdgeKind, ViewNode } from './types.js';

function isPart(el: Element | undefined): el is Element {
  return !!el && (el.kind === 'part' || el.kind === 'part-def');
}

function findPart(model: SysmlModel, segments: string[]): string | undefined {
  const simple = segments[segments.length - 1]!;
  const exact = segments.join('::');
  const exactEl = model.elements.get(exact);
  if (isPart(exactEl)) return exact;
  const matches = [...model.elements.values()].filter((e) => isPart(e) && e.name === simple);
  return matches.length === 1 ? matches[0]!.id : undefined;
}

interface Endpoint { ownerId: string; port?: string }

function resolveEndpoint(model: SysmlModel, chain: string): Endpoint {
  const segments = chain.split('.');
  for (let i = segments.length - 1; i >= 1; i--) {
    const ownerId = findPart(model, segments.slice(0, i));
    if (ownerId) return { ownerId, port: segments[i] };
  }
  const whole = findPart(model, segments);
  if (whole) return { ownerId: whole };
  return { ownerId: `unresolved:${chain}`, port: segments[segments.length - 1] };
}

function portsOf(model: SysmlModel, el: Element, seen = new Set<string>()): string[] {
  if (seen.has(el.id)) return [];
  seen.add(el.id);
  const names = el.childIds
    .map((id) => model.elements.get(id))
    .filter((c): c is Element => c?.kind === 'port')
    .map((c) => c.name);
  if (el.typeId) {
    const type = model.elements.get(el.typeId);
    if (type) for (const name of portsOf(model, type, seen)) if (!names.includes(name)) names.push(name);
  }
  return names;
}

export function ibdView(model: SysmlModel): ViewDescription {
  const nodes: ViewNode[] = [];
  const nodeIds = new Set<string>();
  const addNode = (el: Element): void => {
    if (nodeIds.has(el.id)) return;
    nodeIds.add(el.id);
    nodes.push({
      id: el.id, kind: el.kind, label: el.name,
      stereotype: el.kind === 'unresolved' ? 'unresolved' : 'part',
      rows: [], ports: portsOf(model, el),
      isAbstract: el.isAbstract,
    });
  };
  const addPlaceholder = (id: string): void => {
    if (nodeIds.has(id)) return;
    nodeIds.add(id);
    nodes.push({ id, kind: 'unresolved', label: id.replace(/^unresolved:/, ''), stereotype: 'unresolved', rows: [], ports: [] });
  };

  for (const el of model.elements.values()) if (el.kind === 'part' || el.kind === 'item') addNode(el);

  const edges: ViewEdge[] = [];
  for (const rel of model.relationships) {
    if (rel.kind === 'allocate') {
      if (rel.sourceId && rel.targetId) edges.push({ id: rel.id, kind: 'allocate', source: rel.sourceId, target: rel.targetId });
      continue;
    }
    if (rel.kind !== 'connect' && rel.kind !== 'bind') continue;
    const source = resolveEndpoint(model, rel.sourceRef);
    const target = resolveEndpoint(model, rel.targetRef);
    const kind: ViewEdgeKind = rel.connector === 'interface' ? 'interface' : rel.connector === 'bind' ? 'bind' : 'connect';
    edges.push({ id: rel.id, kind, source: source.ownerId, target: target.ownerId, sourcePort: source.port, targetPort: target.port });
  }

  for (const e of edges) {
    const s = model.elements.get(e.source);
    const t = model.elements.get(e.target);
    if (s) addNode(s);
    else addPlaceholder(e.source);
    if (t) addNode(t);
    else addPlaceholder(e.target);
  }

  return { nodes, edges };
}
