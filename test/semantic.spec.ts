import { describe, it, expect } from 'vitest';
import { parseSysml } from '../src/core/sysml/parse.js';
import { validate } from '../src/core/model/validate.js';

const codes = (src: string): string[] => {
  const m = parseSysml('sysml\n' + src);
  validate(m);
  return m.diagnostics.map((d) => d.code);
};

describe('semantic validation', () => {
  it('flags a usage typed by an incompatible definition', () => {
    expect(codes('package P { port def P1; part def C { part x : P1; } }')).toContain('type-kind-mismatch');
    expect(codes('package P { part def A; part def C { part x : A; } }')).not.toContain('type-kind-mismatch');
  });
  it('checks satisfy roles', () => {
    expect(codes('package P { part def X; requirement def R; satisfy R by X; }')).not.toContain('satisfy-source-not-requirement');
    expect(codes('package P { part def R; part def X; satisfy R by X; }')).toContain('satisfy-source-not-requirement');
    expect(codes('package P { requirement def R; requirement def R2; satisfy R by R2; }')).toContain('satisfy-target-is-requirement');
  });
  it('checks verify targets', () => {
    expect(codes('package P { part def X; requirement def R { verify X; } }')).toContain('verify-target-not-requirement');
    expect(codes('package P { requirement def X; requirement def R { verify X; } }')).not.toContain('verify-target-not-requirement');
  });
  it('checks connector endpoints against ports', () => {
    const ports = 'package P { port def T; part def A { port p : T; } part def B { port q : T; } part def C { part a : A; part b : B; ';
    expect(codes(ports + 'connect a.p to b.q; } }')).not.toContain('connect-endpoint-not-port');
    expect(codes(ports + 'connect a.z to b.q; } }')).toContain('connect-endpoint-not-port');
  });
  it('flags an inverted multiplicity', () => {
    expect(codes('package P { part def B; part def A { part x : B[4..2]; } }')).toContain('invalid-multiplicity');
  });
  it('detects a specialization cycle', () => {
    expect(codes('package P { part def A :> B; part def B :> A; }')).toContain('specialization-cycle');
  });
});
