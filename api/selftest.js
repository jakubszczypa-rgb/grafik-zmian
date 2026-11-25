import { roleFor } from './_auth.js';
import handler from './data.js';

// Test zapisu end-to-end (tylko z pełnym kluczem): dodaje notatkę testową,
// czyta stan ponownie z magazynu, sprawdza widok Tomka i usuwa notatkę.
const run = (method, key, body) => new Promise(resolve => {
  const res = { setHeader() {}, status(c) { this.c = c; return this; }, json(j) { resolve([this.c, j]); }, end() { resolve([this.c]); } };
  handler({ method, body, headers: { 'x-key': key } }, res);
});

export default async function selftest(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const k = String(req.query.k || '');
  if (roleFor(k) !== 'full') return res.status(401).json({ error: 'key' });
  const id = 'selftest-' + Date.now();
  const out = {};
  const [c1] = await run('POST', k, { action: 'set', kind: 'notes', id, data: { date: '2026-12-01', person: 'kuba', text: 'test zapisu' } });
  out.write = c1;
  const [, s2] = await run('GET', k);
  out.readBackFull = !!s2.notes?.some(n => n.id === id);
  const [, s3] = await run('GET', process.env.GRAFIK_TOKEN_TOMEK);
  out.hiddenFromTomek = !s3.notes?.some(n => n.id === id);
  const [c4] = await run('POST', k, { action: 'delete', kind: 'notes', id });
  out.cleanup = c4;
  const [, s5] = await run('GET', k);
  out.removed = !s5.notes?.some(n => n.id === id);
  out.ok = out.write === 200 && out.readBackFull && out.hiddenFromTomek && out.cleanup === 200 && out.removed;
  res.status(200).json(out);
}
