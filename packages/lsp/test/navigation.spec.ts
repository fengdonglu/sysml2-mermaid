import { describe, it, expect } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { computeDefinition } from '../src/features/definition.js';
import { computeRename, prepareRename } from '../src/features/rename.js';
import { computeFormatting } from '../src/features/formatting.js';

const doc = (text: string) => TextDocument.create('file:///t.sysml', 'sysml', 1, text);
const SAMPLE = 'sysml\npackage P { part def Engine; part def Car :> Engine { part e : Engine; } }';

describe('lsp navigation', () => {
  it('goes to an element definition', () => {
    const loc = computeDefinition(doc(SAMPLE), { line: 1, character: 39 });
    expect(loc).toBeTruthy();
    expect(loc!.range.start.line).toBe(1);
  });
  it('renames every occurrence of a name', () => {
    const edit = computeRename(doc(SAMPLE), { line: 1, character: 22 }, 'Motor');
    expect(edit).toBeTruthy();
    const edits = edit!.changes!['file:///t.sysml']!;
    expect(edits.length).toBeGreaterThanOrEqual(2);
    expect(edits.every((e) => e.newText === 'Motor')).toBe(true);
  });
  it('prepares a rename range', () => {
    expect(prepareRename(doc(SAMPLE), { line: 1, character: 22 })).toEqual({
      start: { line: 1, character: 21 }, end: { line: 1, character: 27 },
    });
  });
  it('formats indentation', () => {
    const edits = computeFormatting(doc('sysml\npackage P {\npart def A;\n}\n'));
    expect(edits.length).toBeGreaterThan(0);
    expect(edits.some((e) => e.newText.startsWith('    '))).toBe(true);
  });
});
