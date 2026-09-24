import * as vscode from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node.js';
import { renderSvg } from 'sysml2-mermaid';
import type { ViewName } from 'sysml2-mermaid';

let client: LanguageClient | undefined;
let panel: vscode.WebviewPanel | undefined;
let previewedUri: string | undefined;

function currentSource(): string | undefined {
  const editor = vscode.window.activeTextEditor;
  if (editor && editor.document.languageId === 'sysml') return editor.document.getText();
  return undefined;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function previewHtml(source: string): string {
  const view = vscode.workspace.getConfiguration('sysml').get<string>('preview.view');
  let body: string;
  try { body = renderSvg(source, view ? { view: view as ViewName } : {}); } catch (e) { body = `<pre>${escapeHtml(String((e as Error).message))}</pre>`; }
  return `<!doctype html><html><body style="margin:0;padding:12px">${body}</body></html>`;
}

export function activate(context: vscode.ExtensionContext): void {
  const serverModule = context.asAbsolutePath('dist/server.js');
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.stdio },
    debug: { module: serverModule, transport: TransportKind.stdio },
  };
  client = new LanguageClient('sysml2-mermaid', 'SysML v2 Language Server', serverOptions, {
    documentSelector: [{ language: 'sysml' }],
  } as LanguageClientOptions);
  void client.start().catch((e) => vscode.window.showErrorMessage('SysML language server failed: ' + String(e)));

  context.subscriptions.push(vscode.workspace.onDidChangeTextDocument((e) => {
    if (!panel || e.document.languageId !== 'sysml') return;
    const changed = e.document.uri.toString();
    if (previewedUri !== undefined) {
      if (changed !== previewedUri) return;
    } else {
      const active = vscode.window.activeTextEditor;
      if (!active || active.document.uri.toString() !== changed) return;
    }
    panel.webview.html = previewHtml(e.document.getText());
  }));

  context.subscriptions.push(vscode.commands.registerCommand('sysml.preview', () => {
    const source = currentSource();
    if (source === undefined) { vscode.window.showInformationMessage('Open a .sysml file first.'); return; }
    previewedUri = vscode.window.activeTextEditor?.document.uri.toString();
    if (!panel) {
      panel = vscode.window.createWebviewPanel('sysmlPreview', 'SysML Preview', vscode.ViewColumn.Beside, {});
      context.subscriptions.push(panel.onDidDispose(() => { panel = undefined; previewedUri = undefined; }));
    }
    panel.webview.html = previewHtml(source);
  }));

  context.subscriptions.push(vscode.commands.registerCommand('sysml.exportSvg', async () => {
    const source = currentSource();
    if (source === undefined) { vscode.window.showInformationMessage('Open a .sysml file first.'); return; }
    const target = await vscode.window.showSaveDialog({ filters: { SVG: ['svg'] } });
    if (!target) return;
    await vscode.workspace.fs.writeFile(target, Buffer.from(renderSvg(source), 'utf8'));
    vscode.window.showInformationMessage(`Exported ${target.fsPath}`);
  }));
}

export async function deactivate(): Promise<void> {
  panel?.dispose();
  if (client) await client.stop();
}
