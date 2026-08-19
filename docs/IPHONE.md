# Using LearnScript on iPhone

## Install (PWA)

1. Open the app URL in **Safari** (not Chrome in-app browsers if you can help it).
2. Tap Share → **Add to Home Screen**.
3. Open LearnScript from the icon. It should run full-screen.

Until GitHub Pages (or another HTTPS host) is enabled:

- Repo owner: GitHub → Settings → Pages → Deploy from branch `main`, folder `/` (root `index.html` redirects into `app/`).
- Or run `python3 -m http.server 4173 --directory app` on a computer on the same Wi-Fi and visit `http://<computer-lan-ip>:4173` in Safari.
- iOS requires a user tap before speech will start. The Play button is that tap.

## iOS speech limits we design around

- `speechSynthesis.speak()` must start from a user gesture. Play unlocks the engine.
- Voices exposed to Safari are a subset of Settings → Accessibility → Spoken Content voices. Downloaded “premium” voices may not appear.
- Pitch and rate work, but the range is narrower than desktop Chrome.
- If the phone sleeps or you leave Safari, speech often stops. Keep the screen awake while looping a scene.
- Long gaps can stall the engine. The TTS controller speaks items sequentially and uses a silent keep-alive audio context started on Play.
- Pause/resume on iOS is unreliable. Play/Pause should cancel and respeak from the current index rather than `speechSynthesis.pause()`.

## Layout rules

- Minimum 44×44 pt controls.
- `viewport-fit=cover` and `env(safe-area-inset-*)` on the tab bar and player.
- Inputs use at least 16px font to avoid focus-zoom.
- No hover-only actions.

## Later native app

A Home Screen web app is not the App Store. When we have a Mac CI or local Xcode, wrap or rebuild with:

- Capacitor (fastest: same UI)
- or SwiftUI + AVSpeechSynthesizer (best voices and background audio)

Do not start that work until Phase 4 quality notes in `docs/STATUS.md` say the rehearsal loop is actually good.
