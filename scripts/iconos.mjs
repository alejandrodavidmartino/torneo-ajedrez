// Genera el logo recortado y los iconos de la PWA a partir de docs/assets/logo-lucero.jpg.
// Uso: node scripts/iconos.mjs
import sharp from 'sharp';

const ORIGEN = 'docs/assets/logo-lucero.jpg';
const BLANCO = { r: 255, g: 255, b: 255, alpha: 1 };

const recorte = await sharp(ORIGEN).trim({ background: '#ffffff', threshold: 60 }).toBuffer();
const { width, height } = await sharp(recorte).metadata();
console.log(`logo recortado: ${width}×${height}`);

await sharp(recorte).extend({ top: 2, bottom: 2, left: 2, right: 2, background: BLANCO }).png().toFile('public/logo-lucero.png');

for (const lado of [192, 512]) {
  const margen = Math.round(lado * 0.1);
  await sharp(recorte)
    .resize({ width: lado - 2 * margen, height: lado - 2 * margen, fit: 'contain', background: BLANCO, kernel: 'lanczos3' })
    .extend({ top: margen, bottom: margen, left: margen, right: margen, background: BLANCO })
    .flatten({ background: BLANCO })
    .png()
    .toFile(`public/icono-${lado}.png`);
}
console.log('iconos generados');
