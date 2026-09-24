import { describe, it, expect } from 'vitest';
import { parseSysml } from '../src/core/sysml/parse.js';
const parse = (s: string) => parseSysml('sysml\n' + s);

describe('parseSysml states', () => {
  it('parses state definitions and usages', () => {
    const m = parse('package P { state def S; state idle : S; state off { state nested; } }');
    expect(m.elements.get('P::S')!.kind).toBe('state-def');
    expect(m.elements.get('P::idle')!.kind).toBe('state');
    expect(m.elements.get('P::off')!.kind).toBe('state');
    expect(m.elements.get('P::off::nested')!.kind).toBe('state');
  });
  it('records entry/do/exit as statement children', () => {
    const m = parse('package P { state s { entry setup; do run; exit teardown; } }');
    const acts = [...m.elements.values()].filter((e) => e.kind === 'statement' && e.ownerId === 'P::s');
    expect(acts.map((a) => a.name).sort()).toEqual(['do', 'entry', 'exit']);
  });
  it('parses a named transition with trigger, guard and effect', () => {
    const m = parse('package P { state s { state a; state b; transition t first a accept Go if ready do start then b; } }');
    const rel = m.relationships.find((r) => r.kind === 'transition')!;
    expect(rel).toMatchObject({ sourceRef: 'a', targetRef: 'b' });
    expect(rel.label).toContain('accept');
  });
  it('parses anonymous and initial transitions', () => {
    const m = parse('package P { state s { state a; first start then a; } }');
    expect(m.relationships.find((r) => r.kind === 'transition')).toMatchObject({ sourceRef: 'start', targetRef: 'a' });
  });
  it('flags parallel states', () => {
    const m = parse('package P { state s parallel { state a; state b; } }');
    expect(m.elements.get('P::s')!.isParallel).toBe(true);
  });
});
