import { describe, it, expect } from 'vitest';
import { parseSysml } from '../src/core/sysml/parse.js';
import { validate } from '../src/core/model/validate.js';
import { activeView } from '../src/views/scope.js';

const scope = (src: string, name?: string) => {
  const m = parseSysml('sysml\n' + src);
  validate(m);
  return activeView(m, name);
};

describe('activeView', () => {
  it('maps a standard base to a view kind', () => {
    const a = scope('package P { view def V :> GeneralView; view v : V { expose P::**; } }');
    expect(a.kind).toBe('bdd');
  });
  it('maps interconnection to ibd and filters by metadata', () => {
    const a = scope('package P { part def A; #Safety part def B; view def V :> InterconnectionView; view v : V { filter @Safety; } }');
    expect(a.kind).toBe('ibd');
    expect(a.allowed!.has('P::B')).toBe(true);
    expect(a.allowed!.has('P::A')).toBe(false);
  });
  it('restricts to the exposed subtree', () => {
    const a = scope('package P { package Q { part def A; } part def B; view def V :> GeneralView; view v : V { expose P::Q::**; } }');
    expect(a.allowed!.has('P::Q::A')).toBe(true);
    expect(a.allowed!.has('P::B')).toBe(false);
  });
  it('returns no kind when there is no view', () => {
    expect(scope('package P { part def A; }').kind).toBeUndefined();
  });
});
