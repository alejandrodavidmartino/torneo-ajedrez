/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

const BASE = '/torneo-ajedrez/';

export default defineConfig({
  base: BASE,
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo-lucero.png', 'icono-192.png'],
      manifest: {
        name: 'Torneo de ajedrez · Lucero',
        short_name: 'Torneo Lucero',
        description: 'Gestor de torneos de ajedrez por sistema suizo de la Asociación Vecinal Lucero.',
        lang: 'es',
        theme_color: '#111111',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: BASE,
        scope: BASE,
        icons: [
          { src: 'icono-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icono-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,jpg,svg}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
