// Bundles index.html + assets into a single self-contained file: dist/mybt.html
// Usage: node scripts/build.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(root, p), 'utf8');

const html = read('index.html')
  .replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, href) => `<style>\n${read(href)}</style>`)
  .replace(/<script src="([^"]+)"><\/script>/g, (_, src) => `<script>\n${read(src)}</script>`);

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/mybt.html'), html);
console.log(`dist/mybt.html · ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`);
