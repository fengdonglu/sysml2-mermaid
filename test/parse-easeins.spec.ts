import { describe, it, expect } from 'vitest';
import { emptyModel, addElement } from '../src/core/model/types.js';
import { parseSysml } from '../src/core/sysml/parse.js';
const parse = (s: string) => parseSysml('sysml\n' + s);

describe('v0.9 model additions', () => {
  it('accepts other/stakeholder/actor kinds and new fields', () => {
    const m = emptyModel();
    addElement(m, {
      id: 'O', kind: 'other', name: 'O', qualifiedName: 'O', keyword: 'class',
      modifiers: ['variation'], defaultValue: '20', isConjugate: true, frames: ['c'],
      childIds: [], position: { line: 1, column: 1 },
    });
    const el = m.elements.get('O')!;
    expect(el.keyword).toBe('class');
    expect(el.modifiers).toEqual(['variation']);
    expect(el.isConjugate).toBe(true);
  });
});

describe('parseSysml ease-ins', () => {
  it('records modifier prefixes', () => {
    const m = parse('package P { variation part def A; individual part b : A; }');
    expect(m.elements.get('P::A')!.modifiers).toEqual(['variation']);
    expect(m.elements.get('P::b')!.modifiers).toEqual(['individual']);
  });
  it('parses default values', () => {
    const m = parse('package P { attribute n = 20; attribute m default = 10; }');
    expect(m.elements.get('P::n')!.defaultValue).toBe('20');
    expect(m.elements.get('P::m')!.defaultValue).toBe('10');
  });
  it('parses named binding', () => {
    const m = parse('package P { part def A; binding ab : AB bind a = b; }');
    expect(m.relationships.find((r) => r.kind === 'bind')).toMatchObject({ sourceRef: 'a', targetRef: 'b' });
  });
  it('parses port conjugation', () => {
    const m = parse('package P { port def FuelPort; port p : ~FuelPort; }');
    const p = m.elements.get('P::p')!;
    expect(p.isConjugate).toBe(true);
    expect(p.typeRef).toBe('FuelPort');
  });
  it('parses generic KerML and metadata declarations', () => {
    const m = parse('package P { class def C { attribute x : Real; } metadata def M; calc def F; }');
    expect(m.elements.get('P::C')!.kind).toBe('other');
    expect(m.elements.get('P::C')!.keyword).toBe('class');
    expect(m.elements.get('P::C::x')!.kind).toBe('attribute');
    expect(m.elements.get('P::M')!.keyword).toBe('metadata');
  });
  it('parses roles and invariant', () => {
    const m = parse('package P { requirement def R { stakeholder s : S; actor a : A; invariant x; } }');
    expect([...m.elements.values()].some((e) => e.kind === 'stakeholder' && e.ownerId === 'P::R')).toBe(true);
    expect([...m.elements.values()].some((e) => e.kind === 'actor')).toBe(true);
    expect([...m.elements.values()].some((e) => e.kind === 'constraint' && e.name === 'invariant')).toBe(true);
  });
  it('parses exhibit', () => {
    const m = parse('package P { state def S; part def W { exhibit state s : S; } }');
    expect(m.elements.get('P::W::s')!.kind).toBe('state');
    expect(m.elements.get('P::W::s')!.typeRef).toBe('S');
  });
  it('parses frame and satisfy-viewpoint in a view', () => {
    const m = parse('package P { viewpoint def VP; view v { frame VP; satisfy VP; } }');
    expect(m.elements.get('P::v')!.frames).toEqual(['VP']);
    expect(m.relationships.find((r) => r.kind === 'satisfy')!.sourceRef).toBe('P::v');
  });
});
