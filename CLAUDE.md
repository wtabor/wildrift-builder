# Wild Rift Builder — agent guide

An accurate, current, interactive **stat & build calculator for League of Legends: Wild Rift**
(Next.js App Router · TypeScript · Tailwind · Zod · Vitest, deploys on Vercel).

The entire value proposition is **accurate + current data**. Correctness is the moat — treat
data accuracy and engine math as the highest-priority invariants.

## Commands

```bash
npm run dev           # http://localhost:3000 (bound to 0.0.0.0 for the Preview pane)
npm run typecheck     # tsc --noEmit
npm test              # vitest — the pure engines (correctness = the moat)
npm run validate-data # schema-check every patch under data/patches/
npm run build         # production build
npm run smoke         # fetch routes, assert 200 (needs `npm run dev` running)
```

Before committing, the gate is: `typecheck` + `test` + `validate-data` + `build` (this is also CI,
`.github/workflows/ci.yml`).

## Data accuracy rules (non-negotiable)

- **Wild Rift values ≠ PC League values.** NEVER copy a number from PC League / Data Dragon —
  WR base stats, growth, item stats, costs, and ability values differ. Data Dragon is used *only*
  for champion portrait art (the rosters match character-for-character), never for stats.
- **Source priority** when verifying/adding data:
  1. Official Riot Wild Rift patch notes (`wildrift.leagueoflegends.com`) — primary.
  2. In-game / community references: `riftgg.app/items`, `wildriftfire.com`.
  Cross-check ≥2 sources per value when possible.
- All patch data must stay **schema-valid** (`src/lib/schema/`). A PostToolUse hook auto-runs
  `validate-data` whenever you edit a `data/patches/**/*.json` file — fix any failure before moving on.
- When you change data, update `meta.json` `sources` with the URLs you verified against, and set
  `verified: true` **only** if the whole file was verified against a primary source.
- Whenever you change or add a `stats`/`cost` value on a champion/item that already existed in a
  prior patch, also stamp `provenance[<key>] = "<patch>"` on that same object in the same edit — see
  the `/add-entity` skill (step 6) for the exact rule and example.
- **Mutually exclusive items must share an `exclusiveGroup`.** If the game forbids holding two items
  together (e.g. "Limited to 1 Tear of the Goddess item" — Tear, Manamune/Muramana,
  Archangel's/Seraph's, Winter's Approach/Fimbulwinter all share group `"tear"`), tag every member,
  or a build can stack them and report totals the game cannot produce. Transform items also set
  `upgradesFrom`, and get no gold-efficiency readout — they can't be bought, and their stat line
  includes stacked mana that was never paid for. `validate-data` fails the gate on an unresolvable
  `upgradesFrom`, an upgrade outside its base item's group, or a curated preset holding two members.

## Architecture

- `src/lib/schema/` — Zod schemas + types, the single source of truth (already models abilities &
  item effects for the Phase-3 damage engine).
- `data/patches/<patch>/` — versioned static JSON: `champions.json`, `items.json`, `meta.json`.
  Registry of patches in `data/patches/registry.json`. Current patch: `7.2`.
- `src/lib/stats/` — pure stat engine (champion + items → totals). `src/lib/damage/` — pure damage engine.
- `src/lib/data/` — typed loaders/selectors over the JSON (incl. `getBuilds` for curated presets).
- `src/designs/aerstrike/AerstrikeDesign.tsx` — the default shipped UI, served at `/` (presentation only).
- `src/designs/meta/MetaDesign.tsx` — **deprecated** original design, kept reachable at `/meta` for reference only.

**Separation rule:** *what a number is* lives in `src/lib/` and is shared; *how it looks* lives in
the design layer (`src/designs/aerstrike/`). Stat values come from `statDisplay`, gold from `formatGold` —
never re-implement formatting in a component. See `DESIGN_WORKFLOW.md` for UI iteration + the polish checklist.

## Conventions

- Adding/updating champions or items: use the `/add-entity` skill — it bundles the schema shape,
  source-priority rule, and the validate gate.
- Roster is already complete (140 champions / 112 items as of 7.2b); new work is patch updates and corrections,
  not initial fill. Roster progress tracked in `ROSTER.md`.
- Three Claude-driven GitHub Actions keep data honest and current: `data-verify.yml` (daily audit →
  corrections PR), `patch-watch.yml` (daily → rolls the dataset forward one patch per PR toward the
  newest WR patch), and `data-backfill.yml` (batched roster fill — roster is now complete, so this
  idles). `patch-watch` skips any patch that already has an open PR. Keep their behavior in mind
  before duplicating work.
- Don't commit, push, or open PRs unless asked. Branch off `main` for changes; the data workflows use
  `claude/data-verify-<run_id>`-style branches and list every change as `field: old -> new (source URL)`.

See `PLAN.md` for the full data strategy and roadmap, `README.md` for the product overview.
