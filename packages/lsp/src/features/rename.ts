import type { TextDocument } from 'vscode-languageserver-textdocument';
import type { Range, TextEdit, WorkspaceEdit } from 'vscode-languageserver';
import { wordAt } from './definition.js';

export function prepareRename(doc: TextDocument, position: { line: number; character: number }): Range | null {
  const { word, start, end } = wordAt(doc, position.line, position.character);
  if (!word) return null;
  return { start: { line: position.line, character: start }, end: { line: position.line, character: end } };
}

export function computeRename(
  doc: TextDocument,
  position: { line: number; character: number },
  newName: string,
): WorkspaceEdit | null {
  const { word } = wordAt(doc, position.line, position.character);
  if (!word || !newName) return null;
  const text = doc.getText();
  const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
  const edits: TextEdit[] = [];
  for (const match of text.matchAll(re)) {
    const at = doc.positionAt(match.index ?? 0);
    edits.push({
      range: { start: at, end: { line: at.line, character: at.character + word.length } },
      newText: newName,
    });
  }
  return { changes: { [doc.uri]: edits } };
}
