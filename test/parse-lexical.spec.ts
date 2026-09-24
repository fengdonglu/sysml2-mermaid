import { describe, it, expect } from 'vitest';
import { tokenize } from '../src/core/sysml/tokenize.js';

const values = (src: string) => tokenize(src).map((t) => t.value);

describe('tokenize', () => {
  it('splits identifiers and punctuation', () => {
    expect(values('part def A;')).toEqual(['part', 'def', 'A', ';', '']);
  });
  it('tokenizes the overloaded colon operators longest-first', () => {
    expect(values('A :> B')).toEqual(['A', ':>', 'B', '']);
    expect(values('A :>> B')).toEqual(['A', ':>>', 'B', '']);
    expect(values('A::B')).toEqual(['A', '::', 'B', '']);
    expect(values('a : T')).toEqual(['a', ':', 'T', '']);
  });
  it('reads quoted identifiers without quotes', () => {
    expect(values("package 'My Package' { }")).toEqual(['package', 'My Package', '{', '}', '']);
  });
  it('skips line comments and keeps block comments', () => {
    expect(values('// note\nA;')).toEqual(['A', ';', '']);
    expect(values('doc /* text */')).toEqual(['doc', 'text', '']);
  });
  it('tracks line and column of tokens', () => {
    const t = tokenize('A\n  B').find((x) => x.value === 'B')!;
    expect({ line: t.line, column: t.column }).toEqual({ line: 2, column: 3 });
  });
  it('reads numbers and the range operator', () => {
    expect(values('[0..*]')).toEqual(['[', '0', '..', '*', ']', '']);
  });
});
