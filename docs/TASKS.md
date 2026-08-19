# Tasks

Status: `[ ]` todo · `[~]` this session / in progress · `[x]` done · `[!]` blocked

Update this file whenever work starts or finishes. Details and quality notes go in `docs/STATUS.md`.

## P0 — Documentation and resume system

- [x] P0.1 Product north star, phases, and constraints (`docs/PLAN.md`)
- [x] P0.2 LineLearner research and parity map (`docs/LINELEARNER.md`)
- [x] P0.3 Architecture decisions (`docs/DECISIONS.md`)
- [x] P0.4 Agent resume protocol (`docs/AGENT.md`)
- [x] P0.5 iPhone install / limits notes (`docs/IPHONE.md`)
- [x] P0.6 Test plan (`docs/TESTING.md`)

## P1 — Engine (must be testable without a phone)

- [x] P1.1 Script data model
- [x] P1.2 Play/sides/musical-ish text parser
- [x] P1.3 Parser unit tests (plain, numbered, scenes, directions)
- [x] P1.4 Rehearsal playlist builder (range, modes, loop, gaps)
- [x] P1.5 Rehearsal unit tests
- [x] P1.6 TTS controller with iOS unlock + sequential speak + gap wait
- [x] P1.7 Sample scripts (original + public domain excerpt)

## P2 — iPhone PWA shell

- [x] P2.1 App chrome: library / script / cast / rehearse, iPhone layout
- [x] P2.2 Local script storage (IndexedDB)
- [x] P2.3 Sample scripts installable from library
- [x] P2.4 Character picker (“this is me”)
- [x] P2.5 Auto voice/pitch assignment + preview
- [x] P2.6 Range picker (scene or line numbers)
- [x] P2.7 Player: play/pause, prompt, current line, loop, modes
- [x] P2.8 PWA manifest + apple-mobile-web-app meta

## P3 — Import

- [ ] P3.1 Paste and `.txt` import with parse preview
- [ ] P3.2 PDF text extraction + same preview
- [ ] P3.3 Edit character of a line; merge duplicate characters
- [ ] P3.4 Edit/split/delete lines after import
- [ ] P3.5 Named scene list from messy PDF text (heuristic + manual rename)

## P4 — Player parity and polish

- [ ] P4.1 Extra gap slider, speed control, stage-direction toggle
- [ ] P4.2 Pause after my gap
- [ ] P4.3 Mark problem lines and jump back to them
- [ ] P4.4 Recap-my-lines-only mode
- [ ] P4.5 First-run coaching overlay
- [ ] P4.6 Empty/error states and parse-confidence warnings
- [ ] P4.7 Offline service worker for app shell
- [ ] P4.8 Visual iPhone-width QA pass and CSS fixes

## P5 — Quality loop (repeat every session)

- [ ] P5.1 Automated tests green
- [ ] P5.2 Manual rehearsal of sample scene in all play modes
- [ ] P5.3 Judge: would this actually help memorize lines? Write notes in STATUS
- [ ] P5.4 Fix the top issues from that judgment
- [ ] P5.5 Update STATUS, TASKS, commit, push, PR

## P6 — Distribution

- [ ] P6.1 GitHub Pages (or other HTTPS URL) documented for the phone
- [ ] P6.2 Add-to-Home-Screen instructions in-app
- [ ] P6.3 Backup export/import of a script as JSON

## P7 — Native iOS (after PWA is genuinely good; needs Mac)

- [ ] P7.1 Choose Capacitor vs SwiftUI rewrite of UI
- [ ] P7.2 Port rehearsal engine
- [ ] P7.3 AVSpeechSynthesizer voices
- [ ] P7.4 Optional per-line recording
- [ ] P7.5 TestFlight

## P8 — Explicitly later

- [ ] P8.1 Cast sharing
- [ ] P8.2 Sleep timer
- [ ] P8.3 Neural/cloud voices (optional, behind a key)
- [ ] P8.4 Musical backing tracks
