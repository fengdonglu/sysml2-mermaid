import type { ElementKind } from '../core/model/types.js';
import type { ViewEdgeKind } from '../views/types.js';

export interface SceneNode {
  id: string;
  kind: ElementKind;
  label: string;
  stereotype: string;
  rows: string[];
  ports: string[];
  note?: string;
  isAbstract?: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  portAnchors?: { name: string; x: number; y: number }[];
}

export interface SceneEdge {
  id: string;
  kind: ViewEdgeKind;
  source: string;
  target: string;
  points: { x: number; y: number }[];
  label?: string;
  sourcePort?: string;
  targetPort?: string;
}

export interface SceneGroup {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Scene {
  nodes: SceneNode[];
  edges: SceneEdge[];
  groups?: SceneGroup[];
  width: number;
  height: number;
}
