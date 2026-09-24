import { renderModel } from '../api.js';
import { defaultTheme, type Theme } from '../render/theme.js';
import type { SysmlModel } from '../core/model/types.js';

export class SysmlDb {
  private model: SysmlModel | null = null;
  private theme: Theme = defaultTheme;

  setSource(source: string): void {
    this.model = renderModel(source);
  }
  getModel(): SysmlModel | null {
    return this.model;
  }
  setTheme(theme: Theme): void {
    this.theme = theme;
  }
  getTheme(): Theme {
    return this.theme;
  }
  clear(): void {
    this.model = null;
    this.theme = defaultTheme;
  }
}
