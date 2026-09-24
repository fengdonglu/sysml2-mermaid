import { bddView } from './bdd.js';
import { requirementView } from './requirement.js';
import { ibdView } from './ibd.js';
import { statemachineView } from './statemachine.js';
import { activityView } from './activity.js';
import type { SysmlModel } from '../core/model/types.js';
import type { ViewDescription, ViewName } from './types.js';

export type { ViewDescription, ViewEdge, ViewEdgeKind, ViewGroup, ViewName, ViewNode } from './types.js';

const VIEWS: Record<ViewName, (model: SysmlModel) => ViewDescription> = {
  bdd: bddView,
  requirement: requirementView,
  ibd: ibdView,
  statemachine: statemachineView,
  activity: activityView,
};

const SYNTHETIC = /^(initial|final|control|unresolved|start|done|decide|merge|fork|join):/;

export function filterViewDescription(desc: ViewDescription, allowed?: Set<string>): ViewDescription {
  if (!allowed) return desc;
  const nodes = desc.nodes.filter((n) => allowed.has(n.id) || SYNTHETIC.test(n.id));
  const ids = new Set(nodes.map((n) => n.id));
  const edges = desc.edges.filter((e) => ids.has(e.source) && ids.has(e.target));
  const groups = desc.groups
    ?.map((g) => ({ ...g, members: g.members.filter((m) => ids.has(m)) }))
    .filter((g) => g.members.length > 0);
  return { nodes, edges, ...(groups && groups.length ? { groups } : {}) };
}

export function selectView(
  model: SysmlModel,
  view: ViewName = 'bdd',
  opts: { allowed?: Set<string> } = {},
): ViewDescription {
  return filterViewDescription(VIEWS[view](model), opts.allowed);
}
