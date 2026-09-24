import { build } from 'esbuild';

await build({
  entryPoints: { 'sysml2-mermaid': 'src/index.ts' },
  outdir: 'dist',
  outExtension: { '.js': '.mjs' },
  bundle: true,
  splitting: true,
  format: 'esm',
  platform: 'browser',
  external: ['mermaid'],
  target: 'es2022',
  logLevel: 'info',
});
