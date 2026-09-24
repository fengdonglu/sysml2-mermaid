import type { TextDocument } from 'vscode-languageserver-textdocument';
import type { DocumentSymbol, Range } from 'vscode-languageserver';
import { SymbolKind } from 'vscode-languageserver';
import { parseSysml, type Element, type ElementKind } from 'sysml2-mermaid';

function range(line1: number, col1: number, length: number): Range {
  const line = Math.max(0, line1 - 1);
  const character = Math.max(0, col1 - 1);
  return { start: { line, character }, end: { line, character: character + Math.max(1, length) } };
}

function symbolKind(kind: ElementKind): SymbolKind {
  if (kind === 'package') return SymbolKind.Namespace;
  if (kind.endsWith('-def')) return SymbolKind.Class;
  if (kind === 'enum-literal') return SymbolKind.EnumMember;
  if (kind === 'control') return SymbolKind.Event;
  return SymbolKind.Field;
}

export function computeSymbols(doc: TextDocument): DocumentSymbol[] {
  const model = parseSysml(doc.getText());
  const childrenOf = (el: Element): Element[] =>
    el.childIds
      .map((id) => model.elements.get(id))
      .filter((e): e is Element => !!e && e.kind !== 'import' && e.kind !== 'statement');
  const build = (el: Element): DocumentSymbol => {
    const r = range(el.position.line, el.position.column, el.name.length);
    const children: DocumentSymbol[] = childrenOf(el).map(build);
    return { name: el.name, kind: symbolKind(el.kind), range: r, selectionRange: r, children };
  };
  const top = [...model.elements.values()].filter((e) => !e.ownerId && e.kind !== 'import' && e.kind !== 'unresolved');
  return top.map(build);
}
