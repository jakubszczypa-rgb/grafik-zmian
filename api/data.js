import { put, list, del } from '@vercel/blob';
import { SEED } from './_seed.js';
import { roleFor, noteVisible } from './_auth.js';

// Stan grafiku trzymany jako kolejne pliki JSON w Vercel Blob.
// Każdy zapis tworzy nowy plik (unikalny URL = brak problemów z cache CDN),
// starsze wersje są sprzątane – zostaje KEEP ostatnich (prosta historia).
const PREFIX = 'grafik/state-';
const KEEP = 30;
const PEOPLE = ['tomek', 'natalia', 'kuba'];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[A-Za-z0-9_-]{1,64}$/;

async function versions() {
  const all = [];
  let cursor;
  do {
    const r = await list({ prefix: PREFIX, cursor, limit: 1000 });
    all.push(...r.blobs);
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  return all.sort((a, b) => (a.pathname < b.pathname ? 1 : -1)); // najnowsze pierwsze
}

async function load() {
  const v = await versions();
  if (!v.length) return { state: structuredClone(SEED), v };
  const r = await fetch(v[0].url, { cache: 'no-store' });
  if (!r.ok) throw new Error('blob read ' + r.status);
  return { state: await r.json(), v };
}

async function save(state, old) {
  const name = PREFIX + String(Date.now()).padStart(15, '0') + '.json';
  await put(name, JSON.stringify(state), {
    access: 'public',
    addRandomSuffix: true,
    contentType: 'application/json',
    cacheControlMaxAge: 60,
  });
  const stale = old.slice(KEEP - 1).map(b => b.url);
  if (stale.length) await del(stale).catch(() => {});
}

function clean(kind, d) {
  if (!d || typeof d !== 'object' || !DATE.test(d.date)) return null;
  if (kind === 'shifts') {
    if (!PEOPLE.includes(d.person) || !TIME.test(d.start) || !TIME.test(d.end)) return null;
    return { date: d.date, person: d.person, start: d.start, end: d.end, extra: !!d.extra };
  }
  const text = String(d.text || '').trim().slice(0, 300);
  if (!text || (d.person && !PEOPLE.includes(d.person))) return null;
  return { date: d.date, person: d.person || '', text, created: Number(d.created) || Date.now() };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const role = roleFor(req.headers['x-key']);
  if (!role) return res.status(401).json({ error: 'key' });
  const view = st => ({ shifts: st.shifts || [], notes: (st.notes || []).filter(n => noteVisible(role, n)), role, updated: st.updated || 0 });
  try {
    if (req.method === 'GET') {
      const { state } = await load();
      return res.status(200).json(view(state));
    }
    if (req.method === 'POST') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const { action, kind, id } = b;
      if (!['shifts', 'notes'].includes(kind) || !ID.test(id || '')) return res.status(400).json({ error: 'bad request' });
      const { state, v } = await load();
      const listK = state[kind] || (state[kind] = []);
      const i = listK.findIndex(x => x.id === id);
      // Widok ograniczony nie może ruszać notatek, których nie widzi
      if (kind === 'notes' && i >= 0 && !noteVisible(role, listK[i])) return res.status(403).json({ error: 'forbidden' });
      if (action === 'delete') {
        if (i >= 0) listK.splice(i, 1);
      } else if (action === 'set') {
        const d = clean(kind, b.data);
        if (!d) return res.status(400).json({ error: 'invalid data' });
        if (kind === 'notes' && !noteVisible(role, d)) return res.status(403).json({ error: 'forbidden' });
        if (i >= 0) listK[i] = { id, ...d }; else listK.push({ id, ...d });
      } else return res.status(400).json({ error: 'bad action' });
      state.updated = Date.now();
      await save(state, v);
      return res.status(200).json(view(state));
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server' });
  }
}
