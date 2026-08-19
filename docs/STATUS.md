# Status

**Updated:** 2026-08-19 (continue)  
**Branch:** `cursor/learn-script-app-7c90`  
**PR:** https://github.com/kmacke/learn-script/pull/1  
**Phase:** P4 player polish is largely in. Remaining later work is native iOS (needs a Mac) and nice-to-haves.

## What a new agent should do

1. Read `docs/AGENT.md`, this file, and `docs/TASKS.md`.
2. Run `node --test tests/*.test.mjs` and serve `app/` on 4173.
3. Prefer user-requested product work over new architecture. First incomplete tasks are P7 (native, needs Mac) and P8.
4. If still polishing the PWA: improve the rename sheet, parse-confidence on more PDF shapes, or sleep timer (P8.2).

## Done this session

- P4.3 Sticky marks: Mark / Unmark in the player and line editor; Next mark jumps; marks persist; red pip on the script list; Clear marks.
- P4.5 First-run three-step coach (localStorage `learnscript-coach-v1`).
- P4.6 Parse warnings on import preview and script page.
- P4.7 Service worker caches the app shell (`app/sw.js`).
- In-app sheets for rename / merge / delete (no `window.prompt`).
- iPhone-width QA: coach, scene rename sheet, mark, Next mark jump, Prompt — all passed.

## Quality judgment (P5)

**Can an actor learn eight lines with this in ten minutes?**  
Yes. Marks make the LineLearner “that bit is sticky” loop possible without shrinking the range by hand.

**Most confusing control:** Mark vs Prompt sit on different rows in the player. Fine, but Prompt used to be a big side button.

**Worst iPhone layout bug found:** none blocking. Overlay sheets sit at the bottom and are usable at 390px.

**Next highest-leverage fix:** enable GitHub Pages after merge so the phone has HTTPS; then live with the PWA before any native wrap.

## Known issues

- First-run coach only shows until dismissed; clear `localStorage.learnscript-coach-v1` to see it again.
- Service worker is cache-first for same-origin GET; bump `CACHE` in `app/sw.js` after breaking shell changes.
- Pages still needs the owner to enable GitHub Actions after merge to `main`.
- EchoScript still untouched.

## Next task

Ship/use the PWA. Native iOS (P7) needs a Mac. Optional: P8.2 sleep timer, or richer PDF scene splitting.
