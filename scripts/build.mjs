import { build } from 'esbuild';
import { mkdir, rm } from 'node:fs/promises';

await rm('lib', { recursive: true, force: true });
await mkdir('lib', { recursive: true });

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'lib/index.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  sourcemap: true,
  packages: 'external',
});

const banner = [
  'window.__ModuleLoader__.load({ id: "dsh-files-native", factory: (require) => {',
  'var module = { exports: {} };',
  'var exports = module.exports;',
].join('\n');
const footer = '\nreturn module.exports;\n}});';

await build({
  entryPoints: ['src/client.ts'],
  outfile: 'lib/client.js',
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: ['es2022'],
  jsx: 'automatic',
  external: ['react', 'react-dom', 'react-dom/*', '@deepseek-ai/*'],
  banner: { js: banner },
  footer: { js: footer },
});

console.log('dsh-files-native: lib/index.js + lib/client.js 构建完成');
