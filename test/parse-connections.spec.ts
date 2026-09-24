import { describe, it, expect } from 'vitest';
import { parseSysml } from '../src/core/sysml/parse.js';

const parse = (src: string) => parseSysml('sysml\n' + src);

describe('parseSysml connectors', () => {
  it('parses a binary connect with nested feature chains', () => {
    const m = parse('package P { part def A; part def B; part def C { part a : A; part b : B; connect a.p to b.q; } }');
    expect(m.relationships.find((r) => r.kind === 'connect')).toMatchObject({
      sourceRef: 'a.p', targetRef: 'b.q', connector: 'connect',
    });
  });
  it('parses an interface connector with a type', () => {
    const m = parse('package P { part def A; part def B; part def C { part a : A; part b : B; interface : I connect a.p to b.q; } }');
    expect(m.relationships.find((r) => r.connector === 'interface')).toMatchObject({ sourceRef: 'a.p', targetRef: 'b.q' });
  });
  it('parses a direct interface without the connect keyword', () => {
    const m = parse('package P { part def A; part def B; part def C { part a : A; part b : B; interface a.p to b.q; } }');
    expect(m.relationships.find((r) => r.connector === 'interface')).toMatchObject({ sourceRef: 'a.p', targetRef: 'b.q' });
  });
  it('parses bind', () => {
    const m = parse('package P { part def A; part def C { part a : A; bind a.p = a.q; } }');
    expect(m.relationships.find((r) => r.kind === 'bind')).toMatchObject({ sourceRef: 'a.p', targetRef: 'a.q', connector: 'bind' });
  });
});
