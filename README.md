# Naili v2.0 — The Intelligence Layer for Home Transformation

A complete refresh of Naili.ai from a "quote tool" into a calm, premium, cinematic homeowner platform — and an elite dark-themed portal for the pros who want their briefs.

## Quick start

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Routes

| Route | Audience | Theme | Purpose |
| --------------- | -------------- | ------------------------- | -------------------------------------------- |
| `/` | Homeowner | Warm off-white, cinematic | Upload → scan → reveal → mood → plan |
| `/my-projects` | Homeowner | Warm off-white | Vision Board (saved plans via localStorage) |
| `/pro` | Contractor | Dark graphite, blueprint | Lead Brief Preview, verified scope, access |

## What changed

### Design system
- **No pure white anywhere.** Base canvas `#F6F3EE`, secondary `#F1ECE5`, elevated `#FBF8F4`.
- Warm grain overlay across the whole app via `body::before`.
- **Typography:** Fraunces (display) + Geist (body) + Geist Mono (micro-labels).
- Accent palette: sand-gold `#D8B98A`, clay `#CBB69A`, slate-smart `#7C90B0`, mint `#B8D8C8`.
- Custom animations: `scan-sweep`, `pulse-soft`, `reveal-up`, `shimmer`, `float`.
- Glass surfaces (`.glass-warm`, `.glass-dark`) instead of flat cards.

### Homeowner flow — orchestrated by `UploadStage.tsx`
1. **Upload** — drop zone with corner marks, no spinner
2. **Describe** — textarea, Naili reads intent
3. **Clarify** — `ClarificationModal` with 3 scope-clarifying questions
4. **Reveal** — `VisionReveal` runs: scan → tag → before/after slider → stat cards
5. **Mood** — `StyleQuizBubbles` with 8 premium vibes (Quiet Luxury, Warm Modern, etc.)
6. **Results** — `ProjectFateCard` with DIY path (MaterialsCart affiliate links) or Pro path (matched legends)
7. **Save** — persists to Vision Board via `useProjectStorage`

### Contractor flow — `/pro`
- Hero: "Stop chasing leads. Start receiving briefs."
- `LeadBriefPreview` — a full mock of what contractors receive: source photo with pinned material tags, concept approved by homeowner, verified scope flags, sqft, timeline, location, 94% confidence bar, "delivered via Prybar Connect" footer
- `ProAccessForm` — email + city + trade signup for per-city access
- **"Prybar" is only mentioned here** — never on homeowner pages, per the brief

### Reliability engine
- `ClarificationModal` appends `verified_scope_flags` to the saved project — these show as mint-outlined chips on the results screen and as "Verified Scope Flags" on the contractor brief
- `ProjectFateCard` shows a live "Lumber in 95112 is up 2% this week" hook for daily return visits

## Key components

```
components/
 Nav.tsx — context-aware (warm on /, dark on /pro)
 Footer.tsx
 Hero.tsx — cinematic homeowner hero with floating stat cards
 TrustBand.tsx
 UploadStage.tsx — the orchestrator (6 stages)
 VisionReveal.tsx — ★ signature LIDAR scan + slider
 StyleQuizBubbles.tsx — mood picker
 ClarificationModal.tsx — accuracy interceptor
 ProjectFateCard.tsx — DIY vs Pro decision
 MaterialsCart.tsx — Home Depot affiliate shopping list
 HowItWorks.tsx
 Showcase.tsx — before/after gallery (hover to wipe)
 ProHero.tsx
 ProStats.tsx
 LeadBriefPreview.tsx — ★ the brief contractors receive
 ProAccessForm.tsx
 VisionBoardGrid.tsx — /my-projects grid

lib/
 useProjectStorage.ts — localStorage hook (SavedProject type)
 utils.ts — cn() helper
```

## Auth

Per the brief, existing auth logic has not been removed. The orchestrator
(`UploadStage`) is purely client-side and gates nothing, so auth can wrap it at
any layer without conflict. When you integrate real auth, sign the user in
before `handleSaveToVisionBoard` fires and swap `useProjectStorage` for a
server-backed implementation with the same interface.

## Production notes

- Demo uses Unsplash URLs for concept previews — swap for your real generation pipeline.
- Scan sound uses WebAudio (requires user gesture; the upload click satisfies this).
- Prybar Connect is referenced as lead infrastructure on `/pro` only.
- The stat values in `ProStats` are placeholder — update with real metrics before launch.
