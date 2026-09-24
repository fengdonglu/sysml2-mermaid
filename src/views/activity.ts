import type { Element, SysmlModel } from '../core/model/types.js';
import type { ViewDescription, ViewEdge, ViewGroup, ViewNode } from './types.js';

const ACTION_KINDS = new Set<Element['kind']>(['action-def', 'action', 'statement', 'control']);

function rowsFor(model: SysmlModel, el: Element): string[] {
  return el.childIds
    .map((id) => model.elements.get(id))
    .filter((c): c is Element => c?.kind === 'attribute')
    .map((c) => `${c.name}${c.typeRef ? ` : ${c.typeRef}` : ''}`);
}

function controlStereotype(simple: string): string {
  if (simple === 'start' || simple === 'initial') return 'initial';
  if (simple === 'decide' || simple === 'merge') return 'decision';
  if (simple === 'fork' || simple === 'join') return 'fork';
  return 'control';
}

export function activityView(model: SysmlModel): ViewDescription {
  const nodes: ViewNode[] = [];
  const ids = new Set<string>();
  const add = (n: ViewNode): void => { if (!ids.has(n.id)) { ids.add(n.id); nodes.push(n); } };
  const addElement = (el: Element): void => add({
    id: el.id, kind: el.kind, label: el.name,
    stereotype: el.kind === 'unresolved' ? 'unresolved' : el.kind === 'control' ? 'control' : 'action',
    rows: rowsFor(model, el), ports: [], isAbstract: el.isAbstract,
  });
  const addRef = (ref: string, id: string | undefined): string => {
    const simple = ref.split(/[.:]/).pop() ?? ref;
    if (id && model.elements.has(id)) { addElement(model.elements.get(id)!); return id; }
    const key = `${controlStereotype(simple)}:${ref}`;
    add({ id: key, kind: 'control', label: simple, stereotype: controlStereotype(simple), rows: [], ports: [] });
    return key;
  };

  for (const el of model.elements.values()) if (ACTION_KINDS.has(el.kind)) addElement(el);

  const edges: ViewEdge[] = [];
  for (const rel of model.relationships) {
    if (rel.kind !== 'succession' && rel.kind !== 'flow') continue;
    const source = addRef(rel.sourceRef, rel.sourceId);
    const target = addRef(rel.targetRef, rel.targetId);
    edges.push({ id: rel.id, kind: rel.kind, source, target, label: rel.label });
  }

  const performerOf = new Map<string, string>();
  for (const rel of model.relationships) {
    if (rel.kind !== 'perform' || !rel.sourceId || !rel.targetId) continue;
    if (!performerOf.has(rel.targetId)) performerOf.set(rel.targetId, rel.sourceId);
  }
  const groups: ViewGroup[] = [];
  if (performerOf.size > 0) {
    const byPerformer = new Map<string, string[]>();
    for (const [actionId, performerId] of performerOf) {
      const arr = byPerformer.get(performerId) ?? [];
      arr.push(actionId);
      byPerformer.set(performerId, arr);
    }
    for (const [performerId, members] of byPerformer) {
      const el = model.elements.get(performerId);
      groups.push({ id: `lane:${performerId}`, label: el?.name ?? performerId, members });
    }
  }

  return { nodes, edges, ...(groups.length ? { groups } : {}) };
}
