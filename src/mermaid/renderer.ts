import type { ExternalDiagramDefinition } from 'mermaid';
import { renderModel } from '../api.js';
import { viewFromSource } from '../directive.js';
import { activeView } from '../views/scope.js';
import { selectView } from '../views/index.js';
import { layout } from '../layout/index.js';
import { sceneToSvg } from '../render/sceneToSvg.js';
import { defaultTheme, type Theme } from '../render/theme.js';
import type { SysmlModel } from '../core/model/types.js';

type DiagramDefinition = Awaited<ReturnType<ExternalDiagramDefinition['loader']>>['diagram'];
type DiagramObject = Parameters<DiagramDefinition['renderer']['draw']>[3];

export const sysmlRenderer = {
  draw: (text: string, id: string, _version: string, diagramObject: DiagramObject): void => {
    const db = diagramObject.db as unknown as { getModel(): SysmlModel | null; getTheme?(): Theme };
    const model = db.getModel() ?? renderModel(text);
    const theme = db.getTheme?.() ?? defaultTheme;
    const active = activeView(model);
    const view = active.kind ?? viewFromSource(text) ?? 'bdd';
    const svg = sceneToSvg(layout(selectView(model, view, { allowed: active.allowed })), theme);
    const target = document.getElementById(id);
    if (!target) return;
    const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
    target.setAttribute('viewBox', svg.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 100 100');
    target.setAttribute('width', svg.match(/width="([^"]+)"/)?.[1] ?? '100');
    target.setAttribute('height', svg.match(/height="([^"]+)"/)?.[1] ?? '100');
    target.innerHTML = inner;
  },
};
