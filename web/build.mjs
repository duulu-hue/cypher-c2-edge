#!/usr/bin/env node
// Builds the single-page app.
//   node web/build.mjs --out site            -> site/index.html for GitHub Pages (reads site/data/)
//   node web/build.mjs --artifact out.html   -> a body-only page for a claude.ai artifact
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const args = process.argv.slice(2), arg = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };

const engine = read('../engine/engine.js'), worker = read('../engine/worker.js'), app = read('src/app.js');
for (const [n, s] of [['engine', engine], ['worker', worker], ['app', app]]) if (s.includes('</script')) throw new Error(n + ' contains </script');
const content = read('src/head.html') + read('src/body.html') +
  '<script src="https://unpkg.com/lightweight-charts@4.1.3/dist/lightweight-charts.standalone.production.js"></script>\n' +
  '<script id="engine-src">\n' + engine + '\n</script>\n' +
  '<script id="worker-src" type="text/plain">\n' + worker + '\n</script>\n' +
  '<script>\n' + app + '\n</script>\n';

const artifact = arg('--artifact');
if (artifact) { fs.writeFileSync(artifact, content); console.log('Wrote', artifact); }
const out = arg('--out');
if (out) {
  fs.mkdirSync(out, { recursive: true });
  const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
    '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style></head><body>' +
    content + '</body></html>';
  fs.writeFileSync(path.join(out, 'index.html'), html);
  fs.writeFileSync(path.join(out, '.nojekyll'), '');
  console.log('Wrote', path.join(out, 'index.html'));
}
if (!artifact && !out) console.log('Usage: node web/build.mjs --out site | --artifact file.html');
