import type { Element, SysmlModel } from '../core/model/types.js';
import type { ViewName } from './types.js';

export interface ActiveView { kind?: ViewName; allowed?: Set<string> }

const KIND_BY_NAME: Record<string, ViewName> = {
  generalview: 'bdd',
  interconnectionview: 'ibd',
  actionflowview: 'activity',
  statetransitionview: 'statemachine',
  requirementview: 'requirement',
  bdd: 'bdd',
  ibd: 'ibd',
  activity: 'activity',
  statemachine: 'statemachine',
  requirement: 'requirement',
};

function resolveByName(model: SysmlModel, ref: string): string | undefined {
  if (model.elements.has(ref)) return ref;
  const simple = ref.split('::').pop();
  const matches = [...model.elements.values()].filter((e) => e.name === simple);
  return matches.length === 1 ? matches[0]!.id : undefined;
}

function kindOfDef(model: SysmlModel, defId: string | undefined, seen = new Set<string>()): ViewName | undefined {
  if (!defId || seen.has(defId)) return undefined;
  seen.add(defId);
  const el = model.elements.get(defId);
  if (!el) return undefined;
  const direct = KIND_BY_NAME[el.name.toLowerCase()];
  if (direct) return direct;
  for (const rel of model.relationships) {
    if (rel.kind === 'specialization' && rel.sourceId === defId && rel.targetId) {
      const kind = kindOfDef(model, rel.targetId, seen);
      if (kind) return kind;
    }
  }
  return undefined;
}

function descendants(model: SysmlModel, root: string, recursive: boolean, out: string[] = []): string[] {
  out.push(root);
  const children = model.elements.get(root)?.childIds ?? [];
  for (const child of children) {
    if (recursive) descendants(model, child, true, out);
    else out.push(child);
  }
  return out;
}

export function activeView(model: SysmlModel, viewName?: string): ActiveView {
  const views = [...model.elements.values()].filter((e) => e.kind === 'view');
  let view: Element | undefined;
  if (viewName) view = views.find((v) => v.name === viewName || v.qualifiedName === viewName || v.id === viewName);
  else if (views.length === 1) view = views[0];
  if (!view) return {};

  const defId = view.typeId ?? (view.typeRef ? resolveByName(model, view.typeRef) : undefined);
  const defEl = defId ? model.elements.get(defId) : undefined;
  const kind = kindOfDef(model, defId);

  const exposes = [...(defEl?.exposes ?? []), ...(view.exposes ?? [])];
  const filters = [...(defEl?.filters ?? []), ...(view.filters ?? [])];

  let allowed: Set<string> | undefined;
  if (exposes.length > 0) {
    allowed = new Set<string>();
    for (const spec of exposes) {
      const root = resolveByName(model, spec.ref);
      if (!root) continue;
      for (const id of descendants(model, root, spec.recursive || !spec.namespace)) allowed.add(id);
    }
  }
  if (filters.length > 0) {
    const filtered = new Set<string>();
    for (const el of model.elements.values()) {
      if (filters.every((f) => el.metadata?.includes(f))) filtered.add(el.id);
    }
    allowed = allowed ? new Set([...allowed].filter((id) => filtered.has(id))) : filtered;
  }

  return { ...(kind ? { kind } : {}), ...(allowed ? { allowed } : {}) };
}
