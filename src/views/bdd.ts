import type { Element, Multiplicity, SysmlModel } from '../core/model/types.js';
import type { ViewDescription, ViewEdge, ViewEdgeKind, ViewNode } from './types.js';

const STEREOTYPE: Partial<Record<Element['kind'], string>> = {
  'part-def': 'block',
  'part': 'block',
  'enum-def': 'enumeration',
  'attribute-def': 'valueType',
  'port-def': 'port def',
  'item-def': 'item',
  'item': 'item',
  'connection-def': 'connection',
  'interface-def': 'interface',
  'unresolved': 'unresolved',
};

function multiplicityLabel(m?: Multiplicity): string {
  if (!m || m.lower === undefined) return '';
  if (m.lower === m.upper) return m.lower === '*' ? '[*]' : `[${m.lower}]`;
  return `[${m.lower}..${m.upper}]`;
}

function isDefinition(el: Element | undefined): boolean {
  return !!el && el.kind.endsWith('-def');
}

function rowsFor(model: SysmlModel, el: Element): string[] {
  const rows: string[] = [];
  for (const childId of el.childIds) {
    const child = model.elements.get(childId);
    if (!child) continue;
    if (child.kind === 'attribute' || child.kind === 'part' || child.kind === 'item' || child.kind === 'end') {
      rows.push(`${child.name} : ${child.typeRef ?? '?'}${multiplicityLabel(child.multiplicity)}`);
    } else if (child.kind === 'enum-literal') {
      rows.push(child.name);
    }
  }
  return rows;
}

function portsFor(model: SysmlModel, el: Element): string[] {
  return el.childIds
    .map((id) => model.elements.get(id))
    .filter((c): c is Element => c?.kind === 'port')
    .map((c) => c.name);
}

function ownerBlockId(model: SysmlModel, id: string): string {
  let el = model.elements.get(id);
  while (el && !isDefinition(el) && el.ownerId) el = model.elements.get(el.ownerId);
  return el && isDefinition(el) ? el.id : id;
}

export function bddView(model: SysmlModel): ViewDescription {
  const nodes: ViewNode[] = [];
  const nodeIds = new Set<string>();
  const addNode = (el: Element): void => {
    if (nodeIds.has(el.id)) return;
    nodeIds.add(el.id);
    nodes.push({
      id: el.id,
      kind: el.kind,
      label: el.name,
      stereotype: STEREOTYPE[el.kind] ?? el.keyword ?? el.kind,
      rows: rowsFor(model, el),
      ports: portsFor(model, el),
      note: el.doc ?? el.comment,
      isAbstract: el.isAbstract,
    });
  };

  for (const el of model.elements.values()) {
    if (el.kind.endsWith('-def')) addNode(el);
    else if (el.kind === 'part' || el.kind === 'item') {
      const owner = el.ownerId ? model.elements.get(el.ownerId) : undefined;
      if (!isDefinition(owner)) addNode(el);
    }
  }

  const edges: ViewEdge[] = [];
  let counter = 0;

  for (const el of model.elements.values()) {
    if ((el.kind !== 'part' && el.kind !== 'item') || !el.typeId) continue;
    const owner = el.ownerId ? model.elements.get(el.ownerId) : undefined;
    const kind: ViewEdgeKind = isDefinition(owner) && !el.isReference ? 'composition' : 'reference';
    const source = isDefinition(owner) ? owner!.id : el.id;
    edges.push({ id: `edge:${counter++}`, kind, source, target: el.typeId, label: multiplicityLabel(el.multiplicity) });
  }

  const BDD_RELATIONS = new Set(['specialization', 'subset', 'redefine', 'dependency', 'allocate']);
  for (const rel of model.relationships) {
    if (!BDD_RELATIONS.has(rel.kind) || !rel.sourceId || !rel.targetId) continue;
    const kind = rel.kind as ViewEdgeKind;
    let source = rel.sourceId;
    let target = rel.targetId;
    let label: string | undefined;
    if (kind === 'subset' || kind === 'redefine') {
      source = ownerBlockId(model, source);
      target = ownerBlockId(model, target);
      const feature = model.elements.get(rel.targetId)?.name ?? rel.targetRef;
      label = `${kind === 'subset' ? 'subsets' : 'redefines'} ${feature}`;
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
