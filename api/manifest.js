import { roleFor } from './_auth.js';

// Manifest aplikacji z kluczem w start_url – dzięki temu ikona na ekranie iPhone'a
// otwiera grafik od razu z właściwym dostępem.
export default function handler(req, res) {
  const k = String(req.query.k || '');
  const ok = roleFor(k) !== null;
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(JSON.stringify({
    name: 'Grafik zmian',
    short_name: 'Grafik',
    description: 'Grafik pracy – Tomek, Natalia, Kuba',
    lang: 'pl',
    start_url: ok ? '/?k=' + encodeURIComponent(k) : '/',
    scope: '/',
    display: 'standalone',
    background_color: '#16171a',
    theme_color: '#16171a',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }));
}
