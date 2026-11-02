import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

// Next already supplies sharp. Keep one vector source for every icon format.
const require = createRequire(import.meta.resolve('next/package.json'));
const sharp = require('sharp');
const root = new URL('../', import.meta.url);
const vector = await readFile(new URL('public/logo.svg', root));
const render = size => sharp(vector, { density: 768 }).resize(size, size).flatten({ background: '#0e0e0e' }).ensureAlpha().png().toBuffer();

for (const [name, size] of [['favicon-16x16.png', 16], ['favicon-32x32.png', 32], ['apple-touch-icon.png', 180]]) {
  await writeFile(new URL(`public/${name}`, root), await render(size));
}

// ICO directory entries contain PNG images, including a sharper high-DPI set.
const sizes = [16, 32, 48, 64, 128, 256];
const images = await Promise.all(sizes.map(render));
const directory = Buffer.alloc(6 + images.length * 16);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(images.length, 4);
let offset = directory.length;
for (const [index, image] of images.entries()) {
  const entry = 6 + index * 16;
  directory[entry] = directory[entry + 1] = sizes[index] === 256 ? 0 : sizes[index];
  directory.writeUInt16LE(1, entry + 4);
  directory.writeUInt16LE(32, entry + 6);
  directory.writeUInt32LE(image.length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  offset += image.length;
}
await writeFile(new URL('src/app/favicon.ico', root), Buffer.concat([directory, ...images]));
console.log('Updated brand icons: PNG 16/32/180 px and ICO 16–256 px, from public/logo.svg.');
