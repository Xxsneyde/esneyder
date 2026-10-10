// Bundles index.html + assets into a single self-contained file: dist/mybt.html
// (CSS and JS are inlined, images under assets/img become data: URIs).
// Usage: node scripts/build.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(root, p), 'utf8');
const MIME = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml' };
const dataUri = name => `data:${MIME[extname(name)]};base64,${readFileSync(join(root, 'assets/img', name)).toString('base64')}`;

const html = read('index.html')
  .replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, href) => `<style>\n${read(href)}</style>`)
  .replace(/<script src="([^"]+)"><\/script>/g, (_, src) => `<script>\n${read(src)}</script>`)
  // index.html uses assets/img/…, the stylesheets ../img/…
  .replace(/(?:assets|\.\.)\/img\/([\w.-]+\.(?:webp|png|jpe?g|svg))/g, (_, name) => dataUri(name));

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/mybt.html'), html);
console.log(`dist/mybt.html · ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`);
