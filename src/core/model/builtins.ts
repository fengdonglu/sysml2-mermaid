import type { Element, SysmlModel } from './types.js';

const SCALARS = ['Anything', 'Real', 'Rational', 'Integer', 'Natural', 'Boolean', 'String', 'Number', 'Complex'];
const VIEWS = [
  'GeneralView', 'InterconnectionView', 'ActionFlowView', 'StateTransitionView', 'RequirementView',
  'Rendering', 'asTreeDiagram', 'asElementTable', 'asTextualNotation', 'asInterconnectionDiagram',
];

/**
 * Install a tiny built-in standard-library subset (ScalarValues value types and
 * standard view definitions) so common references resolve without an
 * `unresolved-reference` warning. These are canonical SysML v2 library names; the
 * full library is out of scope.
 */
export function installBuiltins(model: SysmlModel): void {
  const add = (qualified: string, name: string): void => {
    if (model.elements.has(qualified)) return;
    const el: Element = {
      id: qualified, kind: 'other', name, qualifiedName: qualified, childIds: [],
      position: { line: 1, column: 1 },
    };
    model.elements.set(qualified, el);
  };
  for (const name of SCALARS) add(`ScalarValues::${name}`, name);
  for (const name of VIEWS) add(`Views::${name}`, name);
}
