# Architecture decisions

## 1. iPhone PWA first, native later

**Decision:** Ship a Safari / Home Screen web app now. Native Swift or Capacitor comes after the rehearsal loop is good.

**Why:** This environment cannot compile or run iOS apps. The user asked for something that works on their iPhone. A PWA can be used this week. The rehearsal engine (parser, playlist, modes) is platform-agnostic and can be ported.

**Consequence:** TTS quality is limited to voices Safari exposes. Background playback when the screen locks is unreliable. Document these iOS limits in `docs/IPHONE.md`.

## 2. No paid cloud TTS for the default path

**Decision:** Use `speechSynthesis` (and later `AVSpeechSynthesizer` on native).

**Why:** The user asked to stay on free credits for development and should not need an API key to rehearse. Distinct pitch + different system voices is enough to tell characters apart, which is what LineLearner’s pitch-shift is for.

## 3. Vanilla ES modules, no heavy framework

**Decision:** `app/` is static HTML/CSS/JS modules. Tests use Node’s built-in test runner.

**Why:** Future agents must resume quickly. No lockfile churn, no build step required to try the app on a phone via GitHub Pages. If the UI grows painful, migrate to a light build (Vite) in a later phase without rewriting the engine.

## 4. Local-first storage

**Decision:** Scripts live in IndexedDB on the phone. No account.

**Why:** Scripts can be unpublished; the app should work on a plane. Export/import JSON can be added later for backup.

## 5. One sequential line number space

**Decision:** Every dialogue or direction that is a rehearsal unit gets a single incrementing number across the script.

**Why:** The user asked to pick start and end by line number or scene. Scenes are filters; line numbers are the precise A–B range.

## 6. EchoScript is reference-only

**Decision:** Do not clone, fork, or modify EchoScript. If it becomes readable, take notes in `docs/ECHOSCRIPT-NOTES.md` and leave that repo unchanged.

**Why:** Explicit user instruction. First session could not access a `kmacke/EchoScript` repository.

## 7. Sample scripts in-repo

**Decision:** Ship at least one original short scene plus a public-domain excerpt.

**Why:** Import is the hardest path. The product must be demonstrable without a file. Public-domain Shakespeare is safe to include.

## 8. Quality loop

**Decision:** Every implementation session should include: automated parser/rehearsal tests, an iPhone-width UI pass, and a written quality judgment in `docs/STATUS.md`.

**Why:** The user asked to test, judge, and improve until the product is good—not to dump a prototype and stop.
