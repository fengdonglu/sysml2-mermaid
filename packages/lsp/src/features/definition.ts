import type { TextDocument } from 'vscode-languageserver-textdocument';
import { Location, Range } from 'vscode-languageserver';
import { parseSysml } from 'sysml2-mermaid';

export function wordAt(doc: TextDocument, line: number, character: number): { word: string; start: number; end: number } {
  const text = doc.getText().split(/\r?\n/)[line] ?? '';
  let start = character;
  let end = character;
  while (start > 0 && /[A-Za-z0-9_]/.test(text[start - 1]!)) start--;
  while (end < text.length && /[A-Za-z0-9_]/.test(text[end]!)) end++;
  return { word: text.slice(start, end), start, end };
}

function range(line1: number, col1: number, length: number): Range {
  const line = Math.max(0, line1 - 1);
  const character = Math.max(0, col1 - 1);
  return { start: { line, character }, end: { line, character: character + Math.max(1, length) } };
}

export function computeDefinition(doc: TextDocument, position: { line: number; character: number }): Location | null {
  const { word } = wordAt(doc, position.line, position.character);
  if (!word) return null;
  const model = parseSysml(doc.getText());
  const el = [...model.elements.values()].find((e) => e.name === word);
  if (!el) return null;
  return Location.create(doc.uri, range(el.position.line, el.position.column, el.name.length));
}
