import { describe, it, expect } from 'vitest';
import { parseSysml } from '../src/core/sysml/parse.js';
const parse = (s: string) => parseSysml('sysml\n' + s);

describe('parseSysml activities', () => {
  it('parses action definitions and usages', () => {
    const m = parse('package P { action def A; action a : A; action b { action c; } }');
    expect(m.elements.get('P::A')!.kind).toBe('action-def');
    expect(m.elements.get('P::a')!.kind).toBe('action');
    expect(m.elements.get('P::b::c')!.kind).toBe('action');
  });
  it('parses parameters as attribute rows', () => {
    const m = parse('package P { action def A { in fuel : Fuel; out torque : Torque; } }');
    const rows = [...m.elements.values()].filter((e) => e.ownerId === 'P::A' && e.kind === 'attribute').map((e) => e.name);
    expect(rows).toContain('in fuel');
    expect(rows).toContain('out torque');
  });
  it('parses successions', () => {
    const m = parse('package P { action a; action b; first a then b; }');
    expect(m.relationships.find((r) => r.kind === 'succession')).toMatchObject({ sourceRef: 'a', targetRef: 'b' });
  });
  it('parses a flow with a payload', () => {
    const m = parse('package P { action a; action b; flow of Torque from a to b; }');
    expect(m.relationships.find((r) => r.kind === 'flow')).toMatchObject({ sourceRef: 'a', targetRef: 'b', label: 'Torque' });
  });
  it('parses the then target shorthand', () => {
    const m = parse('package P { action a; action b; action c; first a; then b; then c; }');
    const succ = m.relationships.filter((r) => r.kind === 'succession').map((r) => [r.sourceRef, r.targetRef]);
    expect(succ).toEqual([['start', 'a'], ['a', 'b'], ['b', 'c']]);
  });
  it('parses perform', () => {
    const m = parse('package P { part def W; action a; part p : W { perform a; } }');
    expect(m.relationships.find((r) => r.kind === 'perform')).toMatchObject({ sourceRef: 'P::p', targetRef: 'a' });
  });
});
