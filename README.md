# Grafik zmian

Edytowalny grafik pracy online dla Tomka, Natalii i Kuby.

- `public/index.html` – dashboard: kalendarz miesiąca, dodawanie/edycja/usuwanie zmian, notatki dzienne, druk A4 jednym przyciskiem.
- `api/data.js` – API (Vercel Function) zapisujące stan w Vercel Blob (`grafik/state-*.json`, trzymane 30 ostatnich wersji).
- `api/_seed.js` – dane startowe z Excela (grudzień 2026), używane tylko gdy w Blob nie ma jeszcze żadnego zapisu.

## Konfiguracja
- Vercel Blob podłączony do projektu (zmienna `BLOB_READ_WRITE_TOKEN`).
- `GRAFIK_TOKEN_FULL` – klucz pełnego widoku (link `/?k=...` dla Natalii i Kuby).
- `GRAFIK_TOKEN_TOMEK` – klucz widoku Tomka: widzi wszystkie zmiany, ale tylko notatki ogólne i swoje. Filtrowanie odbywa się na serwerze.
- Bez ważnego klucza API zwraca 401.
- `/api/selftest?k=<pełny klucz>` – test zapisu do magazynu i ukrywania notatek.
