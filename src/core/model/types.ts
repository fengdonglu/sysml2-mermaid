import type { Diagnostic } from '../sysml/diagnostics.js';

export type ElementKind =
  | 'package'
  | 'import'
  | 'part-def' | 'part'
  | 'attribute-def' | 'attribute'
  | 'port-def' | 'port'
  | 'enum-def' | 'enum-literal'
  | 'requirement-def' | 'requirement'
  | 'subject' | 'constraint'
  | 'state-def' | 'state'
  | 'action-def' | 'action'
  | 'statement' | 'control'
  | 'viewpoint-def' | 'view-def' | 'view' | 'viewpoint'
  | 'item-def' | 'item'
  | 'alias'
  | 'connection-def' | 'interface-def' | 'end'
  | 'other' | 'stakeholder' | 'actor'
  | 'unresolved';

export interface ExposeSpec { ref: string; namespace: boolean; recursive: boolean }

export interface Position { line: number; column: number }
export interface Multiplicity { lower?: string; upper?: string }

export interface Element {
  id: string;
  kind: ElementKind;
  name: string;
  qualifiedName: string;
  ownerId?: string;
  childIds: string[];
  position: Position;
  isReference?: boolean;
  multiplicity?: Multiplicity;
  typeRef?: string;
  typeId?: string;
  doc?: string;
  comment?: string;
  shortName?: string;
  isParallel?: boolean;
  isAbstract?: boolean;
  metadata?: string[];
  exposes?: ExposeSpec[];
  filters?: string[];
  render?: string;
  direction?: 'in' | 'out' | 'inout';
  modifiers?: string[];
  defaultValue?: string;
  isConjugate?: boolean;
  keyword?: string;
  frames?: string[];
}

export type RelationshipKind =
  | 'specialization' | 'subset' | 'redefine' | 'dependency'
  | 'satisfy' | 'verify'
  | 'connect' | 'bind'
  | 'transition' | 'succession' | 'flow' | 'perform'
  | 'allocate' | 'exhibit';

export interface Relationship {
  id: string;
  kind: RelationshipKind;
  sourceRef: string;
  targetRef: string;
  sourceId?: string;
  targetId?: string;
  position: Position;
  connector?: 'connect' | 'interface' | 'bind';
  negated?: boolean;
  label?: string;
}

export interface SysmlModel {
  elements: Map<string, Element>;
  relationships: Relationship[];
  diagnostics: Diagnostic[];
}

export function emptyModel(): SysmlModel {
  return { elements: new Map(), relationships: [], diagnostics: [] };
}

export function addElement(model: SysmlModel, el: Element): Element {
  model.elements.set(el.id, el);
  if (el.ownerId) model.elements.get(el.ownerId)?.childIds.push(el.id);
  return el;
}
