import { dagreLayout } from './dagreAdapter.js';
import { ibdLayout } from './ibdAdapter.js';
import type { ViewDescription } from '../views/types.js';
import type { Scene } from './types.js';

export type { Scene, SceneEdge, SceneNode } from './types.js';

export function layout(view: ViewDescription): Scene {
  const hasConnectors = view.edges.some((e) => e.kind === 'connect' || e.kind === 'interface' || e.kind === 'bind');
  const hasPorts = view.nodes.some((n) => n.ports.length > 0);
  return hasConnectors || hasPorts ? ibdLayout(view) : dagreLayout(view);
}
