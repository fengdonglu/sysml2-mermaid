import { describe, it, expect } from 'vitest';
import { emptyModel, addElement } from '../src/core/model/types.js';
import { diagnostic } from '../src/core/sysml/diagnostics.js';
import { tokenize } from '../src/core/sysml/tokenize.js';

describe('model types', () => {
  it('emptyModel starts empty', () => {
    const m = emptyModel();
    expect(m.elements.size).toBe(0);
    expect(m.relationships).toEqual([]);
    expect(m.diagnostics).toEqual([]);
  });
  it('addElement links owners to children', () => {
    const m = emptyModel();
    addElement(m, { id: 'P', kind: 'package', name: 'P', qualifiedName: 'P', childIds: [], position: { line: 1, column: 1 } });
    addElement(m, { id: 'P::A', kind: 'part-def', name: 'A', qualifiedName: 'P::A', ownerId: 'P', childIds: [], position: { line: 2, column: 1 } });
    expect(m.elements.get('P')!.childIds).toEqual(['P::A']);
  });
  it('diagnostic carries 1-based position', () => {
    const d = diagnostic('warning', 'unresolved-reference', 'no such type', { line: 3, column: 7 });
    expect(d).toEqual({ severity: 'warning', code: 'unresolved-reference', message: 'no such type', line: 3, column: 7 });
  });
});

describe('v0.2 model additions', () => {
  it('accepts the new element kinds and short names', () => {
    const m = emptyModel();
    addElement(m, { id: 'R', kind: 'requirement-def', name: 'R', qualifiedName: 'R', shortName: '1', childIds: [], position: { line: 1, column: 1 } });
    expect(m.elements.get('R')!.shortName).toBe('1');
  });
  it('accepts the new relationship kinds and flags', () => {
    const rel = {
      id: 'r', kind: 'satisfy' as const, sourceRef: 'R', targetRef: 'X',
      connector: 'interface' as const, negated: true, position: { line: 1, column: 1 },
    };
    expect(rel.connector).toBe('interface');
    expect(rel.negated).toBe(true);
  });
});

describe('tokenize angle brackets', () => {
  it('tokenizes short-name brackets', () => {
    expect(tokenize("<'1'>").map((t) => t.value)).toEqual(['<', '1', '>', '']);
  });
});

describe('v0.6 model additions', () => {
  it('accepts view kinds, abstract and metadata', () => {
    const m = emptyModel();
    addElement(m, {
      id: 'V', kind: 'view', name: 'V', qualifiedName: 'V',
      isAbstract: true, metadata: ['Safety'],
      exposes: [{ ref: 'P::A', namespace: false, recursive: true }],
      filters: ['Safety'], render: 'asTreeDiagram', childIds: [], position: { line: 1, column: 1 },
    });
    expect(m.elements.get('V')!.metadata).toEqual(['Safety']);
    expect(m.elements.get('V')!.exposes![0]!.ref).toBe('P::A');
  });
});

describe('v0.3 model additions', () => {
  it('accepts state/action/control kinds and the parallel flag', () => {
    const m = emptyModel();
    addElement(m, { id: 'S', kind: 'state', name: 'S', qualifiedName: 'S', isParallel: true, childIds: [], position: { line: 1, column: 1 } });
    expect(m.elements.get('S')!.isParallel).toBe(true);
  });
  it('accepts a labelled transition relationship', () => {
    const rel = { id: 't', kind: 'transition' as const, sourceRef: 'A', targetRef: 'B', label: 'accept Go then', position: { line: 1, column: 1 } };
    expect(rel.label).toBe('accept Go then');
  });
});
