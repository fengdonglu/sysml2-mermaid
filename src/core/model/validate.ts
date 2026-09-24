import { diagnostic } from '../sysml/diagnostics.js';
import { installBuiltins } from './builtins.js';
import { checkSemantics } from './semantic.js';
import type { Element, Position, SysmlModel } from './types.js';

const DEFINITION_KINDS = new Set(['part-def', 'attribute-def', 'port-def', 'enum-def']);

function ownerDefinition(model: SysmlModel, id: string): Element | undefined {
  let el = model.elements.get(id);
  while (el && !DEFINITION_KINDS.has(el.kind) && el.ownerId) el = model.elements.get(el.ownerId);
  return el && DEFINITION_KINDS.has(el.kind) ? el : undefined;
}

function featureInHierarchy(
  model: SysmlModel,
  supertypes: Map<string, string[]>,
  sourceId: string,
  simple: string,
): string | undefined {
  const owner = ownerDefinition(model, sourceId);
  if (!owner) return undefined;
  const seen = new Set<string>();
  const queue = [...(supertypes.get(owner.id) ?? [])];
  while (queue.length > 0) {
    const defId = queue.shift()!;
    if (seen.has(defId)) continue;
    seen.add(defId);
    const def = model.elements.get(defId);
    if (!def) continue;
    for (const childId of def.childIds) {
      const child = model.elements.get(childId);
      if (child && child.name === simple && !DEFINITION_KINDS.has(child.kind) && child.id !== sourceId) return child.id;
    }
    for (const s of supertypes.get(defId) ?? []) queue.push(s);
  }
  return undefined;
}

export function validate(model: SysmlModel): void {
  installBuiltins(model);

  const byQName = new Map<string, string>();
  const bySimple = new Map<string, string[]>();

  for (const el of model.elements.values()) {
    if (el.kind === 'import') continue;
    if (byQName.has(el.qualifiedName)) {
      model.diagnostics.push(diagnostic('error', 'duplicate-definition', `duplicate definition '${el.qualifiedName}'`, el.position));
    } else {
      byQName.set(el.qualifiedName, el.id);
    }
    const arr = bySimple.get(el.name) ?? [];
    arr.push(el.id);
    bySimple.set(el.name, arr);
  }

  const aliases = new Map<string, string>();
  for (const el of model.elements.values()) {
    if (el.kind === 'alias' && el.typeRef) aliases.set(el.name, el.typeRef);
  }

  const placeholder = (ref: string, position: Position, context: string): string => {
    const id = `unresolved:${ref}`;
    if (!model.elements.has(id)) {
      const name = ref.split('::').pop() || ref;
      const el: Element = { id, kind: 'unresolved', name, qualifiedName: ref, childIds: [], position, typeRef: ref };
      model.elements.set(id, el);
    }
    model.diagnostics.push(diagnostic('warning', 'unresolved-reference', `unresolved reference '${ref}' (${context})`, position));
    return id;
  };

  const resolve = (fullRef: string, position: Position, context: string): string => {
    if (!fullRef) return '';
    const aliasTarget = aliases.get(fullRef.split(/[.:]/).pop() ?? fullRef);
    const ref = aliasTarget ?? fullRef;
    const exact = byQName.get(ref);
    // Prefer a definition over a same-named package: `X` inside package `X`
    // resolves to the member `X::X`, not to the namespace.
    const nested = byQName.get(`${ref}::${ref}`);
    if (nested) return nested;
    if (exact && model.elements.get(exact)?.kind !== 'package') return exact;
    if (exact) return exact;
    const simple = bySimple.get(ref.split('::').pop() || ref);
    if (simple && simple.length === 1) return simple[0]!;
    return placeholder(ref, position, context);
  };

  for (const el of [...model.elements.values()]) {
    if (!el.typeRef || el.kind === 'import') continue;
    // Inline constraint expressions (`{ ... }`) are not references.
    if (el.kind === 'constraint' && el.typeRef.startsWith('{')) continue;
    // Raw statements (entry/do/exit, accept/send/assign/…) are not references.
    if (el.kind === 'statement') continue;
    el.typeId = resolve(el.typeRef, el.position, `type of ${el.name}`);
  }

  const PSEUDO = new Set(['initial', 'start', 'done', 'terminate', 'decide', 'merge', 'fork', 'join']);
  const resolveMaybe = (ref: string, position: Position, context: string): string | undefined => {
    const simple = ref.split(/[.:]/).pop() ?? ref;
    if (PSEUDO.has(simple)) return undefined;
    return resolve(aliases.get(simple) ?? ref, position, context);
  };

  const supertypes = new Map<string, string[]>();
  for (const rel of model.relationships) {
    if (rel.kind === 'subset' || rel.kind === 'redefine') continue;
    if (rel.kind === 'connect' || rel.kind === 'bind') continue;
    if (rel.kind === 'transition' || rel.kind === 'succession' || rel.kind === 'flow') {
      rel.sourceId = resolveMaybe(rel.sourceRef, rel.position, 'relation source');
      rel.targetId = resolveMaybe(rel.targetRef, rel.position, 'relation target');
      continue;
    }
    rel.sourceId = resolve(rel.sourceRef, rel.position, 'relation source');
    rel.targetId = resolve(rel.targetRef, rel.position, 'relation target');
    if (rel.kind === 'specialization' && rel.targetId) {
      const arr = supertypes.get(rel.sourceId) ?? [];
      arr.push(rel.targetId);
      supertypes.set(rel.sourceId, arr);
    }
  }

  for (const rel of model.relationships) {
    if (rel.kind !== 'subset' && rel.kind !== 'redefine') continue;
    rel.sourceId = resolve(rel.sourceRef, rel.position, 'relation source');
    const simple = rel.targetRef.split('::').pop() ?? rel.targetRef;
    rel.targetId = featureInHierarchy(model, supertypes, rel.sourceId, simple)
      ?? resolve(rel.targetRef, rel.position, 'relation target');
  }

  checkSemantics(model);
}
