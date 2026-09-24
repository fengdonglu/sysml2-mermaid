import { diagnostic } from '../sysml/diagnostics.js';
import type { Element, ElementKind, Position, SysmlModel } from './types.js';

const EXPECTED_TYPE: Partial<Record<ElementKind, ElementKind[]>> = {
  part: ['part-def', 'other'],
  item: ['item-def', 'part-def', 'other'],
  port: ['port-def', 'other'],
  attribute: ['attribute-def', 'enum-def', 'other'],
  action: ['action-def', 'other'],
  state: ['state-def', 'other'],
  requirement: ['requirement-def', 'other'],
};

const REQUIREMENT_KINDS = new Set<ElementKind>(['requirement', 'requirement-def']);

function isPartLike(el: Element | undefined): el is Element {
  return !!el && (el.kind === 'part' || el.kind === 'part-def' || el.kind === 'item' || el.kind === 'item-def');
}

function findPart(model: SysmlModel, segments: string[]): string | undefined {
  const simple = segments[segments.length - 1]!;
  const exact = segments.join('::');
  const exactEl = model.elements.get(exact);
  if (isPartLike(exactEl)) return exact;
  const matches = [...model.elements.values()].filter((e) => isPartLike(e) && e.name === simple);
  return matches.length === 1 ? matches[0]!.id : undefined;
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

function checkTypes(model: SysmlModel): void {
  for (const el of model.elements.values()) {
    const allowed = EXPECTED_TYPE[el.kind];
    if (!allowed || !el.typeId) continue;
    const type = model.elements.get(el.typeId);
    if (!type || type.kind === 'unresolved') continue;
    if (!allowed.includes(type.kind)) {
      model.diagnostics.push(
        diagnostic('warning', 'type-kind-mismatch', `a ${el.kind} is typed by '${type.name}' (a ${type.kind})`, el.position),
      );
    }
  }
}

function checkSatisfyVerify(model: SysmlModel): void {
  for (const rel of model.relationships) {
    if (rel.kind === 'satisfy') {
      const src = rel.sourceId ? model.elements.get(rel.sourceId) : undefined;
      const tgt = rel.targetId ? model.elements.get(rel.targetId) : undefined;
      if (src && !REQUIREMENT_KINDS.has(src.kind)) {
        model.diagnostics.push(diagnostic('warning', 'satisfy-source-not-requirement', `'${src.name}' is not a requirement`, rel.position));
      }
      if (tgt && REQUIREMENT_KINDS.has(tgt.kind)) {
        model.diagnostics.push(diagnostic('warning', 'satisfy-target-is-requirement', `'${tgt.name}' is a requirement, not the satisfying element`, rel.position));
      }
    } else if (rel.kind === 'verify') {
      const tgt = rel.targetId ? model.elements.get(rel.targetId) : undefined;
      if (tgt && !REQUIREMENT_KINDS.has(tgt.kind)) {
        model.diagnostics.push(diagnostic('warning', 'verify-target-not-requirement', `'${tgt.name}' is not a requirement`, rel.position));
      }
    }
  }
}

function checkConnectors(model: SysmlModel): void {
  for (const rel of model.relationships) {
    if (rel.kind !== 'connect') continue;
    for (const ref of [rel.sourceRef, rel.targetRef]) {
      const segments = ref.split('.');
      if (segments.length < 2) continue;
      const ownerId = findPart(model, segments.slice(0, -1));
      if (!ownerId) continue;
      const owner = model.elements.get(ownerId)!;
      const portName = segments[segments.length - 1]!;
      if (!portsOf(model, owner).includes(portName)) {
        model.diagnostics.push(diagnostic('warning', 'connect-endpoint-not-port', `'${owner.name}' has no port '${portName}'`, rel.position));
      }
    }
  }
}

function checkMultiplicity(model: SysmlModel): void {
  for (const el of model.elements.values()) {
    const m = el.multiplicity;
    if (!m || m.lower === undefined || m.upper === undefined) continue;
    if (m.lower === '*' || m.upper === '*') continue;
    const lo = Number(m.lower);
    const hi = Number(m.upper);
    if (Number.isFinite(lo) && Number.isFinite(hi) && lo > hi) {
      model.diagnostics.push(diagnostic('error', 'invalid-multiplicity', `multiplicity [${m.lower}..${m.upper}] has lower > upper`, el.position));
    }
  }
}

function checkSpecializationCycles(model: SysmlModel): void {
  const adj = new Map<string, string[]>();
  for (const rel of model.relationships) {
    if (rel.kind !== 'specialization' || !rel.sourceId || !rel.targetId) continue;
    const arr = adj.get(rel.sourceId) ?? [];
    arr.push(rel.targetId);
    adj.set(rel.sourceId, arr);
  }
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map<string, number>();
  const reported = new Set<string>();
  const visit = (id: string): void => {
    color.set(id, GRAY);
    for (const next of adj.get(id) ?? []) {
      const c = color.get(next) ?? WHITE;
      if (c === GRAY) {
        const key = `${id}->${next}`;
        if (!reported.has(key)) {
          reported.add(key);
          const position: Position = model.elements.get(id)?.position ?? { line: 1, column: 1 };
          model.diagnostics.push(diagnostic('error', 'specialization-cycle', `specialization cycle through '${model.elements.get(next)?.name ?? next}'`, position));
        }
      } else if (c === WHITE) {
        visit(next);
      }
    }
    color.set(id, BLACK);
  };
  for (const id of adj.keys()) if ((color.get(id) ?? WHITE) === WHITE) visit(id);
}

export function checkSemantics(model: SysmlModel): void {
  checkTypes(model);
  checkSatisfyVerify(model);
  checkConnectors(model);
  checkMultiplicity(model);
  checkSpecializationCycles(model);
}
