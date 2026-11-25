// Dostęp przez klucz w linku (?k=...). Klucze trzymane w zmiennych środowiskowych Vercela.
//  GRAFIK_TOKEN_FULL  – pełny widok (Natalia, Kuba): wszystkie zmiany i notatki
//  GRAFIK_TOKEN_TOMEK – widok Tomka: zmiany wszystkich, notatki tylko ogólne i jego własne
export function roleFor(key) {
  const k = String(key || '');
  if (!k) return null;
  if (process.env.GRAFIK_TOKEN_FULL && k === process.env.GRAFIK_TOKEN_FULL) return 'full';
  if (process.env.GRAFIK_TOKEN_TOMEK && k === process.env.GRAFIK_TOKEN_TOMEK) return 'tomek';
  return null;
}

// Które notatki widzi dana rola
export function noteVisible(role, note) {
  if (role === 'full') return true;
  if (role === 'tomek') return !note.person || note.person === 'tomek';
  return false;
}
