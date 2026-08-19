# Status

**Updated:** 2026-08-19  
**Branch:** `cursor/learn-script-app-7c90`  
**PR:** https://github.com/kmacke/learn-script/pull/1  
**Phase:** P1–P2 MVP is usable. Next: P3 line editor + P4 player polish.

## What a new agent should do

1. Read `docs/AGENT.md`, this file, and `docs/TASKS.md`.
2. Run `node --test tests/*.test.mjs` and `python3 -m http.server 4173 --directory app`.
3. Start the first incomplete task: **P3.3** (edit character of a line / merge duplicates) unless the user asks otherwise.
4. Keep iPhone-width rehearsal working; do not rewrite the app.

## Done this session

- Plan, LineLearner parity notes, resume protocol.
- Parser + rehearsal engine with 15 automated tests.
- iPhone-first PWA: library, samples, paste/txt/PDF import, cast & voices, scene/line range, looping player, Prompt, silent-rehearsal fallback.
- UI QA: player was stuck on a fake “The Green Room” scene (title parsed as dialogue when `options.title` was set). Fixed. After re-tapping the sample, Cues mode auto-advances and Skip works.

## Quality judgment (P5)

**Can an actor learn eight lines with this in ten minutes?**  
Yes, on a phone in Safari, once they open a sample or paste sides, star their role, and run Cues or Line→gap on a short range. Voices depend on Safari’s system TTS; in browsers without speech, timed silent rehearsal still works.

**Most confusing control:** Cast star vs Rehearse. After import we now land on Cast so they pick a role first.

**Worst iPhone layout bug found:** none remaining that blocked rehearsal; earlier Skip “no-op” was a one-line fake scene, not a tap-target issue.

**Next highest-leverage fix:** after a messy PDF, let the user fix a wrong character on a line and merge duplicate names (P3.3–P3.4). Then GitHub Pages so the phone has an HTTPS URL (P6.1).

## Known issues

- Cloud Chrome often has no working `speechSynthesis`; Safari on iPhone is the real target.
- PDF extract is heuristic; no line editor yet.
- IndexedDB samples from *before* the header-skip fix were wrong until the sample card is tapped again (now overwrites).
- EchoScript was not accessible; left untouched.

## Next task

**P3.3** Edit character of a line; merge duplicate characters. Then P3.4 split/delete lines. Then P6.1 Pages URL for the iPhone.
