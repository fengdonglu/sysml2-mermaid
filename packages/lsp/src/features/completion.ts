import type { TextDocument } from 'vscode-languageserver-textdocument';
import type { CompletionItem } from 'vscode-languageserver';
import { CompletionItemKind } from 'vscode-languageserver';
import { parseSysml } from 'sysml2-mermaid';
import type { ElementKind } from 'sysml2-mermaid';

export const KEYWORDS = [
  'package', 'import', 'private', 'public', 'part', 'attribute', 'port', 'enum',
  'def', 'ref', 'requirement', 'subject', 'require', 'assume', 'satisfy',
  'verify', 'state', 'action', 'transition', 'first', 'then', 'flow', 'perform',
  'entry', 'do', 'exit', 'accept', 'send', 'assign', 'terminate', 'connect',
  'interface', 'bind', 'dependency', 'doc', 'comment', 'parallel', 'specializes',
  'subsets', 'redefines', 'assert', 'not', 'of', 'by', 'to', 'from', 'in', 'out',
];

function kindOf(kind: ElementKind): CompletionItemKind {
  if (kind === 'package' || kind === 'import') return CompletionItemKind.Module;
  if (kind.endsWith('-def')) return CompletionItemKind.Class;
  if (kind === 'enum-literal') return CompletionItemKind.EnumMember;
  if (kind === 'control') return CompletionItemKind.Event;
  return CompletionItemKind.Field;
}

export function computeCompletion(doc: TextDocument): CompletionItem[] {
  const items: CompletionItem[] = [];
  const seen = new Set<string>();
  for (const kw of KEYWORDS) { items.push({ label: kw, kind: CompletionItemKind.Keyword }); seen.add(kw); }
  const model = parseSysml(doc.getText());
  for (const el of model.elements.values()) {
    if (el.kind === 'import' || seen.has(el.name)) continue;
    items.push({ label: el.name, kind: kindOf(el.kind) });
    seen.add(el.name);
  }
  return items;
}
