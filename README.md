# Full Court Chaos

An original arcade-show youth basketball league concept: real players create alter egos, upload a photo, receive a pixel portrait, and build a persistent stat profile.

## Run locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Working prototype features

- Responsive league landing page and tour presentation
- Arcade player cards and full player-select profile views
- Two-step guardian-led player registration
- In-browser photo cropping, color quantization, dithering, and pixel framing
- Scorekeeper console with live leaderboard updates
- Local browser persistence for created players and stat changes

## Production handoff

This version deliberately stores uploads and records only in the current browser. A live youth platform should add authenticated guardian accounts, an encrypted hosted database, private object storage, moderator approval before profiles become public, role-gated scorekeeping, and a written youth privacy/retention policy. The UI is already separated cleanly enough to replace local storage with those APIs.

The name, copy, pixel portraits, and generated arena art are original concept work. The experience draws on the broad language of 1990s arcade sports presentation without reusing third-party logos, game assets, or characters.
