import { parseSysml } from './core/sysml/parse.js';
import { validate } from './core/model/validate.js';
import { selectView, type ViewName } from './views/index.js';
import { layout } from './layout/index.js';
import { sceneToSvg } from './render/sceneToSvg.js';
import { viewFromSource } from './directive.js';
import { activeView } from './views/scope.js';
import type { Theme } from './render/theme.js';
import type { SysmlModel } from './core/model/types.js';

export type LayoutEngine = 'dagre' | 'elk';

export function renderModel(source: string): SysmlModel {
  const model = parseSysml(source);
  validate(model);
  return model;
}

export function renderSvg(source: string, opts: { view?: ViewName; viewName?: string; theme?: Theme } = {}): string {
  const model = renderModel(source);
  const active = activeView(model, opts.viewName);
  const view = opts.view ?? active.kind ?? viewFromSource(source) ?? 'bdd';
  return sceneToSvg(layout(selectView(model, view, { allowed: active.allowed })), opts.theme);
}

export async function renderSvgAsync(
  source: string,
  opts: { view?: ViewName; viewName?: string; theme?: Theme; layout?: LayoutEngine } = {},
): Promise<string> {
  if (opts.layout !== 'elk') return renderSvg(source, opts);
  const { elkLayout } = await import('./layout/elkAdapter.js');
  const model = renderModel(source);
  const active = activeView(model, opts.viewName);
  const view = opts.view ?? active.kind ?? viewFromSource(source) ?? 'bdd';
  const scene = await elkLayout(selectView(model, view, { allowed: active.allowed }));
  return sceneToSvg(scene, opts.theme);
}
