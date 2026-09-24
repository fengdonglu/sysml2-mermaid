import type { ElementKind } from '../core/model/types.js';

export const VIEW_NAMES = ['bdd', 'requirement', 'ibd', 'statemachine', 'activity'] as const;
export type ViewName = (typeof VIEW_NAMES)[number];

export type ViewEdgeKind =
  | 'specialization' | 'composition' | 'reference' | 'subset' | 'redefine'
  | 'dependency' | 'contain' | 'satisfy' | 'verify'
  | 'connect' | 'interface' | 'bind'
  | 'transition' | 'succession' | 'flow' | 'perform'
  | 'allocate';

export interface ViewNode {
  id: string;
  kind: ElementKind;
  label: string;
  stereotype: string;
  rows: string[];
  ports: string[];
  note?: string;
  isAbstract?: boolean;
}

export interface ViewEdge {
  id: string;
  kind: ViewEdgeKind;
  source: string;
  target: string;
  label?: string;
  sourcePort?: string;
  targetPort?: string;
}

export interface ViewGroup {
  id: string;
  label: string;
  members: string[];
}

export interface ViewDescription {
  nodes: ViewNode[];
  edges: ViewEdge[];
  groups?: ViewGroup[];
}
