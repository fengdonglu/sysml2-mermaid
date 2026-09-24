export const VERSION = '0.1.0';

export { renderModel, renderSvg, renderSvgAsync } from './api.js';
export type { LayoutEngine } from './api.js';
export { parseSysml } from './core/sysml/parse.js';
export { validate } from './core/model/validate.js';
export { selectView, filterViewDescription } from './views/index.js';
export { activeView } from './views/scope.js';
export { layout } from './layout/index.js';
export { sceneToSvg } from './render/sceneToSvg.js';
export { defaultTheme, themeFromMermaid } from './render/theme.js';
export { sysml, registerSysml } from './mermaid/index.js';

export type { Diagnostic, Severity } from './core/sysml/diagnostics.js';
export type { SysmlModel, Element, ElementKind, Relationship, RelationshipKind, Position, Multiplicity } from './core/model/types.js';
export type { ViewDescription, ViewNode, ViewEdge, ViewName } from './views/types.js';
export type { Scene, SceneNode, SceneEdge } from './layout/types.js';
export type { Theme } from './render/theme.js';
