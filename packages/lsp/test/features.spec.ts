import { describe, it, expect } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { computeDiagnostics } from '../src/features/diagnostics.js';
import { computeCompletion } from '../src/features/completion.js';
import { computeHover } from '../src/features/hover.js';
import { computeSymbols } from '../src/features/symbols.js';

const doc = (text: string) => TextDocument.create('file:///t.sysml', 'sysml', 1, text);
const SAMPLE = 'sysml\npackage P { part def Engine; part def Car :> Engine { part e : Engine; } }';

describe('lsp features', () => {
  it('reports diagnostics', () => {
    expect(computeDiagnostics(doc('sysml\npackage P { ??? }')).some((d) => d.code === 'unexpected-token')).toBe(true);
    expect(computeDiagnostics(doc(SAMPLE))).toEqual([]);
  });
  it('completes keywords and element names', () => {
    const labels = computeCompletion(doc(SAMPLE)).map((i) => i.label);
    expect(labels).toContain('part');
    expect(labels).toContain('Engine');
  });
  it('hovers an element', () => {
    const h = computeHover(doc(SAMPLE), { line: 1, character: 39 });
    expect(h).toBeTruthy();
    expect(JSON.stringify(h)).toContain('Car');
  });
  it('lists symbols', () => {
    const s = computeSymbols(doc(SAMPLE));
    expect(s[0]!.name).toBe('P');
    expect(s[0]!.children.map((c) => c.name)).toEqual(['Engine', 'Car']);
  });
});
