export interface Theme {
  background: string;
  lineColor: string;
  textColor: string;
  blockFill: string;
  headerFill: string;
  hollowFill: string;
  portFill: string;
  noteFill: string;
  warnColor: string;
  fontSize: number;
  fontFamily: string;
}

export const defaultTheme: Theme = {
  background: '#ffffff',
  lineColor: '#333333',
  textColor: '#1a1a1a',
  blockFill: '#ffffff',
  headerFill: '#eef2f7',
  hollowFill: '#ffffff',
  portFill: '#ffffff',
  noteFill: '#fffbe6',
  warnColor: '#c0392b',
  fontSize: 13,
  fontFamily: 'sans-serif',
};

export function themeFromMermaid(tv?: Record<string, string>): Theme {
  if (!tv) return defaultTheme;
  return {
    ...defaultTheme,
    background: tv.background ?? defaultTheme.background,
    lineColor: tv.lineColor ?? defaultTheme.lineColor,
    textColor: tv.textColor ?? tv.primaryTextColor ?? defaultTheme.textColor,
    blockFill: tv.mainBkg ?? defaultTheme.blockFill,
    headerFill: tv.primaryColor ?? defaultTheme.headerFill,
    fontSize: tv.fontSize ? Number.parseInt(tv.fontSize, 10) || defaultTheme.fontSize : defaultTheme.fontSize,
    fontFamily: tv.fontFamily ?? defaultTheme.fontFamily,
  };
}
