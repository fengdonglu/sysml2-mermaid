import type { Element, SysmlModel } from '../core/model/types.js';
import type { ViewDescription, ViewEdge, ViewEdgeKind, ViewNode } from './types.js';

const REQUIREMENT_KINDS = new Set<Element['kind']>(['requirement-def', 'requirement']);

function rowsFor(model: SysmlModel, el: Element): string[] {
  const rows: string[] = [];
  if (el.shortName) rows.push(`Id: ${el.shortName}`);
  for (const childId of el.childIds) {
    const child = model.elements.get(childId);
    if (!child) continue;
    if (child.kind === 'subject') rows.push(`subject: ${child.name}${child.typeRef ? ` : ${child.typeRef}` : ''}`);
    else if (child.kind === 'stakeholder' || child.kind === 'actor') rows.push(`${child.kind}: ${child.name}${child.typeRef ? ` : ${child.typeRef}` : ''}`);
    else if (child.kind === 'constraint') rows.push(`${child.name} ${child.typeRef}`.trim());
  }
  return rows;
}

function stereotypeOf(el: Element): string {
  if (REQUIREMENT_KINDS.has(el.kind)) return 'requirement';
  if (el.kind === 'unresolved') return 'unresolved';
  return 'block';
}

export function requirementView(model: SysmlModel): ViewDescription {
  const nodes: ViewNode[] = [];
  const nodeIds = new Set<string>();
  const addNode = (el: Element): void => {
    if (nodeIds.has(el.id)) return;
    nodeIds.add(el.id);
    nodes.push({
      id: el.id, kind: el.kind, label: el.name, stereotype: stereotypeOf(el),
      rows: rowsFor(model, el), ports: [], note: el.doc ?? el.comment,
      isAbstract: el.isAbstract,
    });
  };

  for (const el of model.elements.values()) if (REQUIREMENT_KINDS.has(el.kind)) addNode(el);

  const edges: ViewEdge[] = [];
  let counter = 0;

  for (const el of model.elements.values()) {
    if (!REQUIREMENT_KINDS.has(el.kind) || !el.ownerId) continue;
    const parent = model.elements.get(el.ownerId);
    if (parent && REQUIREMENT_KINDS.has(parent.kind)) {
      edges.push({ id: `contain:${counter++}`, kind: 'contain', source: parent.id, target: el.id });
    }
  }

  for (const rel of model.relationships) {
    if (rel.kind !== 'satisfy' && rel.kind !== 'verify' && rel.kind !== 'dependency') continue;
    if (!rel.sourceId || !rel.targetId) continue;
    let source = rel.sourceId;
    let target = rel.targetId;
    let kind: ViewEdgeKind = rel.kind;
    let label: string | undefined;
    if (rel.kind === 'satisfy') {
      // `satisfy R by X`: arrow points at the requirement R.
      source = rel.targetId;
      target = rel.sourceId;
      if (rel.negated) label = 'not';
    } else if (rel.kind === 'dependency') {
      kind = 'dependency';
    }
    edges.push({ id: rel.id, kind, source, target, label });
  }

  for (const e of edges) {
    const s = model.elements.get(e.source);
    const t = model.elements.get(e.target);
    if (s) addNode(s);
    if (t) addNode(t);
  }
  return { nodes, edges };
}
