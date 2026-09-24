import type { Element, SysmlModel } from '../core/model/types.js';
import type { ViewDescription, ViewEdge, ViewNode } from './types.js';

const STATE_KINDS = new Set<Element['kind']>(['state-def', 'state']);
const INITIAL = new Set(['initial', 'start']);
const FINAL = new Set(['done', 'terminate']);

function rowsFor(model: SysmlModel, el: Element): string[] {
  const rows: string[] = [];
  for (const id of el.childIds) {
    const c = model.elements.get(id);
    if (c?.kind === 'statement') rows.push(`${c.name}: ${c.typeRef ?? ''}`.trim());
  }
  return rows;
}

function pseudoNode(stereotype: 'initial' | 'final', ref: string): ViewNode {
  const simple = ref.split(/[.:]/).pop() ?? ref;
  return { id: `${stereotype}:${ref}`, kind: 'control', label: simple, stereotype, rows: [], ports: [] };
}

export function statemachineView(model: SysmlModel): ViewDescription {
  const nodes: ViewNode[] = [];
  const ids = new Set<string>();
  const add = (n: ViewNode): void => { if (!ids.has(n.id)) { ids.add(n.id); nodes.push(n); } };
  const addElement = (el: Element): void => add({
    id: el.id, kind: el.kind, label: el.name,
    stereotype: el.kind === 'unresolved' ? 'unresolved' : 'state',
    rows: rowsFor(model, el), ports: [], isAbstract: el.isAbstract,
  });

  for (const el of model.elements.values()) if (STATE_KINDS.has(el.kind)) addElement(el);

  const edges: ViewEdge[] = [];
  let n = 0;

  for (const el of model.elements.values()) {
    if (!STATE_KINDS.has(el.kind) || !el.ownerId) continue;
    const parent = model.elements.get(el.ownerId);
    if (parent && STATE_KINDS.has(parent.kind)) edges.push({ id: `contain:${n++}`, kind: 'contain', source: parent.id, target: el.id });
  }

  for (const rel of model.relationships) {
    if (rel.kind !== 'transition') continue;
    const srcSimple = rel.sourceRef.split(/[.:]/).pop() ?? rel.sourceRef;
    const tgtSimple = rel.targetRef.split(/[.:]/).pop() ?? rel.targetRef;
    let source: string;
    let target: string;
    const srcEl = rel.sourceId ? model.elements.get(rel.sourceId) : undefined;
    const tgtEl = rel.targetId ? model.elements.get(rel.targetId) : undefined;
    if (srcEl) { addElement(srcEl); source = srcEl.id; }
    else if (INITIAL.has(srcSimple)) { const node = pseudoNode('initial', rel.sourceRef); add(node); source = node.id; }
    else { const node = pseudoNode('initial', rel.sourceRef); add(node); source = node.id; }
    if (tgtEl) { addElement(tgtEl); target = tgtEl.id; }
    else if (FINAL.has(tgtSimple)) { const node = pseudoNode('final', rel.targetRef); add(node); target = node.id; }
    else { const node = pseudoNode('final', rel.targetRef); add(node); target = node.id; }
    edges.push({ id: rel.id, kind: 'transition', source, target, label: rel.label });
  }

  return { nodes, edges };
}
