# Status

**Updated:** 2026-08-18  
**Branch:** `cursor/learn-script-app-7c90`  
**Phase:** P1–P2 MVP in progress (docs complete; app being built in the same first session)

## What a new agent should do

If the PWA is not yet committed, continue Phase 1–2 in `app/` as described in `docs/PLAN.md`. If it is committed, run `node --test tests/*.test.mjs`, open `app/index.html` via a static server, and start **P3 import** or the first incomplete P4 polish item.

## Done

- Plan, product spec, LineLearner research, decisions, resume protocol, iPhone notes, test plan.

## In progress

- Parser, rehearsal engine, TTS, sample scripts, iPhone PWA.

## EchoScript

`kmacke/EchoScript` was not visible to this environment (public repos were `learn-script` and `hello-world`). Do not spend time hunting it unless the user provides access. Do not modify it if found.

## Quality judgment

Not yet run against a live UI.

## Known issues / iOS risks

- Safari TTS voice set is limited; we compensate with pitch.
- Must unlock speech on the Play tap.
- PDF import is Phase 3.

## Next task

Finish P1–P2 so an actor can rehearse **The Green Room** on an iPhone-width browser, then run tests and a quality pass (P5).
