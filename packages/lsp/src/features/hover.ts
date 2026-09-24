import type { TextDocument } from 'vscode-languageserver-textdocument';
import type { Hover } from 'vscode-languageserver';
import { parseSysml } from 'sysml2-mermaid';

function wordAt(doc: TextDocument, line: number, character: number): string {
  const text = doc.getText().split(/\r?\n/)[line] ?? '';
  let start = character;
  let end = character;
  while (start > 0 && /[^\s.:;{}]/.test(text[start - 1]!)) start--;
  while (end < text.length && /[^\s.:;{}]/.test(text[end]!)) end++;
  return text.slice(start, end).trim();
}

export function computeHover(doc: TextDocument, position: { line: number; character: number }): Hover | null {
  const word = wordAt(doc, position.line, position.character);
  if (!word) return null;
  const model = parseSysml(doc.getText());
  const el = [...model.elements.values()].find((e) => e.name === word);
  if (!el) return null;
  const lines = [`**${el.name}**`, `kind: ${el.kind}`, `qualified: ${el.qualifiedName}`];
  if (el.shortName) lines.push(`id: ${el.shortName}`);
  if (el.typeRef) lines.push(`type: ${el.typeRef}`);
  if (el.doc) lines.push(el.doc);
  return { contents: { kind: 'markdown', value: lines.join('\n\n') } };
}
