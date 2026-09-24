import type { TextDocument } from 'vscode-languageserver-textdocument';
import type { TextEdit } from 'vscode-languageserver';

const INDENT = '    ';

export function computeFormatting(doc: TextDocument): TextEdit[] {
  const lines = doc.getText().split(/\r?\n/);
  const edits: TextEdit[] = [];
  let depth = 0;
  for (let i = 0; i < lines.length; i++) {
    const original = lines[i]!;
    const trimmed = original.trim();
    const leadingCloses = /^\}/.test(trimmed);
    const indentDepth = Math.max(0, depth - (leadingCloses ? 1 : 0));
    const formatted = trimmed ? INDENT.repeat(indentDepth) + trimmed : '';
    if (formatted !== original) {
      edits.push({ range: { start: { line: i, character: 0 }, end: { line: i, character: original.length } }, newText: formatted });
    }
    const opens = (trimmed.match(/\{/g) ?? []).length;
    const closes = (trimmed.match(/\}/g) ?? []).length;
    depth = Math.max(0, depth + opens - closes);
  }
  return edits;
}
