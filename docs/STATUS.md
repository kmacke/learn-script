# Status

**Updated:** 2026-08-19 (continue / auto)  
**Branch:** `cursor/learn-script-app-7c90`  
**PR:** https://github.com/kmacke/learn-script/pull/1  
**Phase:** P3 import cleanup is in. Next: remaining P4 polish (problem-line marks, first-run overlay, offline SW) or enable GitHub Pages on `main`.

## What a new agent should do

1. Read `docs/AGENT.md`, this file, and `docs/TASKS.md`.
2. Run `node --test tests/*.test.mjs` and serve `app/` on port 4173.
3. Start the first incomplete task: **P4.3** (mark problem lines) unless the user asks otherwise.
4. Do not rewrite the app. Line editing lives in `app/js/edit.js`.

## Done this session

- P3.3–P3.5: tap a line to change speaker / edit / split / delete; merge “Give lines to…” on Cast; rename scene; add character.
- P4.2 Pause after my gap.
- P6.2 in-app Add to Home Screen hint; P6.3 JSON backup/export and .json import.
- GitHub Pages workflow on `main` (owner must enable Pages → GitHub Actions).
- iPhone-width QA: all line-editor and merge steps passed.

## Quality judgment (P5)

**Can an actor learn eight lines with this in ten minutes?**  
Yes, and they can now fix a bad PDF parse without leaving the phone.

**Most confusing control:** `prompt()` dialogs for rename (scene/character) are ugly on iOS but work. A real rename sheet would be nicer.

**Worst iPhone layout bug found:** none that blocked the editor. Computer-use saw phantom characters while typing in the textarea; saved text was correct.

**Next highest-leverage fix:** mark sticky lines in the player (P4.3), then a public HTTPS URL so Safari can Add to Home Screen without a LAN server (enable Pages after merge).

## Known issues

- `prompt()` / `confirm()` for rename, merge, delete — native and a bit crude.
- Pages workflow does not run until this branch is on `main` and Pages is set to GitHub Actions.
- EchoScript still untouched / not accessible.

## Next task

**P4.3** Mark problem lines and jump back to them. Then P4.5 first-run coaching, P4.7 service worker.
