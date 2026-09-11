# Roster coverage

Tracks how much of the live Wild Rift roster is in the app. The
**Roster Backfill** workflow (`.github/workflows/data-backfill.yml`) updates
this as it adds entities; the **Data Accuracy Verify** workflow
(`.github/workflows/data-verify.yml`) keeps the shipped values correct.

| Category   | Entries | Total (live) | Status                       |
| ---------- | ------- | ------------ | ---------------------------- |
| Champions  | 140     | 140+         | stats/roles/titles/abilities done; Yunara added for 7.2, Cho'Gath not yet confirmed live (see below) |
| Items      | 112     | unconfirmed  | patch 7.2 enchant→item migration + item sweep done. **Not verified complete** — the Tear line (Tear of the Goddess, Muramana, Seraph's Embrace, Fimbulwinter) was added 2026-08-06 after the earlier "roster complete" call proved wrong; see "Correction" below. No source establishes the live item total, so the target column is `unconfirmed` rather than a number copied from our own count |

## Field completeness (champions, patch 7.1g)

- **stats** — ✅ all 139. Verified accurate; a June 2026 audit re-fetched a
  7-champion sample (aatrox, akali, akshan, alistar, amumu, blitzcrank, brand)
  from the official WR wiki + wildriftfire and they matched the shipped values
  exactly.
- **resourceType** — ✅ all 139.
- **roles** — ✅ all 139 (ry2x CN-API class booleans, PR #17; WR-exclusive
  `norra` filled manually). Minor follow-ups for the verify workflow: `ashe`
  is [Marksman] (ry2x also tags Support); `shyvana` is [Fighter,Tank]
  (ry2x tags [Fighter,Mage]).
- **title** — ✅ all 139. English lore titles (identical PC↔WR, pure character
  identity) from Data Dragon `16.13.1`; Ambessa ("Matriarch of War") and the
  WR-exclusive Norra ("the Portal Mistress") cross-checked against WR sources.
- **abilities** — ✅ all 139 (695 abilities, 5 slots each: passive/Q/W/E/R).
  Extracted verbatim from the official WR wiki per-champion pages and
  cross-checked against wildriftfire (see `tools/data-fill/`). The full stat
  re-audit in the same pass produced **0 corrections** (existing stats confirmed
  accurate). Notes:
  - **PC-data contamination found & corrected** on ~14 wiki pages (5-rank
    arrays / PC scalings): bard, pantheon, ziggs, zilean (cooldown-only),
    velkoz, kogmaw, taliyah, ksante, ekko, lee-sin (E), nidalee (Q/W), jayce,
    rell — these used wildriftfire (WR-native) values. yuumi.Q is a genuine
    5-rank WR ability (both sources agree).
  - **Form/transform champs** (gnar, jayce, khazix, lee-sin, nidalee,
    heimerdinger, shyvana, riven, senna, sion, skarner, swain, ambessa,
    camille, fizz, rell, zeri, aurelion-sol) map the **primary form's** 5
    slots; secondary-form abilities are dropped (schema has 5 slots).
  - **Lossy by schema design:** `scalings` models only AP/AD/health ratios, so
    armor/MR/% bonus-health scalings live in `description` text only. Per-rank
    scaling ratios are stored as the rank-1 value. DoT/charge abilities store
    the per-tick / minimum (base) value. A few unconfirmable fields are left
    empty rather than guessed (e.g. kog'maw R Living Artillery base damage).

## Patch 7.2 (2026-07-09)

One of the largest updates yet: the boot-enchantment mechanic was removed
entirely, boots got a new Tier-3 tier, ~30 mage/support/general items were
reworked, two champions were slated for release, and ~14 existing champions
got balance changes. See `data/patches/7.2/meta.json` for full sources;
`verified: false` there because the official WR wiki hadn't finished
publishing 7.2 numbers as of this update (values are sourced from official
patch notes + community cross-checks — re-verify once the wiki catches up).

**Standing builds (added 2026-07-14):** `builds.json` now carries one sourced
`<champion>-standard` preset for 130 of 139 champions (plus Ezreal's 3
hand-authored ones), item lists taken from each champion's WildRiftFire 7.2
guide (per-preset `source` URL). Items missing from this catalog were dropped,
never substituted — see the note in `meta.json` for the drop/skip list (Void
Staff appears in 34 of their guides despite being removed from WR in 4.4).
Skipped for now (guide degraded below 4 mappable items): Akali, Aurora, Bard,
Heimerdinger, Katarina, Kennen, Lux, Veigar, Vladimir. The fetch/parse
pipeline lives in `~/.cache/wrb/builds-pipeline/` for the next patch.

- **Champions**: re-verified stats/abilities for the 14 named champions
  (Zyra, Annie, Yasuo, K'Sante, Kai'Sa, Kayn, Norra, Syndra, Orianna,
  Fiddlesticks, Varus, Zed, Darius, Lee Sin) against official patch notes;
  most changes are to fields this schema doesn't model numerically (range,
  duration, stack count) and landed as description-text updates rather than
  `baseDamage`/`scalings`/`cooldown` edits — only Zed's R cooldown and Lee
  Sin's Q/W numbers are real structured-field changes.
- **Yunara** (Marksman) added — confirmed released 2026-07-09. Her base stats
  and ability kit are sourced from wr-meta.com / wildriftfire since the
  official WR wiki page was still an unpopulated stub as of this update
  (`stats: 0+0` placeholder); flag for re-verification once the wiki fills
  in. One unresolved discrepancy: wildriftfire reported base attack speed
  0.77, wr-meta reported 0.75 (used, since it was the only source with a full
  growth table). **Re-checked one day later (still 2026-07-10 in this
  timeline): the official wiki page is still an unpopulated stub** — nothing
  new to re-verify against yet. A WebSearch aggregate leaned toward 0.77, but
  that's not an independent fetch (same underlying secondary sources), so the
  stored value (0.75) was left as-is rather than flipped on weak signal.
- **Cho'Gath** was **not** added. Several secondary outlets (techtimes,
  lootbar, nerdschalk, gamingonphone) reported him releasing alongside
  Yunara, but the official WR wiki has no page for him (404) and the official
  "Champion Release Update" article names only Yunara for 7.2, pointing to
  patch 7.3 for the next roadmap wave — wildriftfire's own Cho'Gath guide
  still shows "Coming Soon" / TBD tier placeholders. Treated as not yet live;
  re-check before adding.
- **Boot enchantments removed.** The 10 former enchant items
  (`goredrinker`, `stridebreaker`, `galeforce`, `gargoyle`→`gargoyle-stoneplate`,
  `stasis`→`zhonyas-hourglass`, `quicksilver`→`quicksilver-sash`,
  `protobelt`→`hextech-rocketbelt`) are now ordinary `slot: "item"` entries
  with real stats, competing for the normal 6 item slots like anything else.
  `dream-maker`, `glorious`, and `veil` were removed outright (confirmed by
  the official rework announcement + wildriftfire). The `"enchant"`
  `ItemSchema.slot` value is kept **only** so the frozen `data/patches/7.1/`
  snapshot stays schema-valid — no patch from 7.2 onward should use it.
- **New items**: Mercurial Scimitar, Blackfire Torch, Void Amethyst, Verdant
  Barrier, Dusk and Dawn, Locket of the Iron Solari, Shurelya's Battlesong,
  Banshee's Veil, and 7 new Tier-3 boots (final upgrades of each Tier-2 boot,
  unlockable after 10:00 in a live match — modeled as ordinary purchasable
  items since this calculator has no game-clock concept to gate them with).
- **Removed items**: Bandle Fantasy, Psychic Projector, Crown of the
  Shattered Queen, Awakened Soulstealer (confirmed by the official patch
  notes' explicit removal list; Prophet's Pendant and Sapphire Crystal were
  also named as removed but were never in this catalog to begin with).
- **Swept for stat/cost changes**: Redemption (full rework), Staff of Flowing
  Waters, Harmonic Echo, Ardent Censer, Imperial Mandate, Frozen Heart,
  Guardian Angel, Sterak's Gage/Maw of Malmortius/Mantle of the Twelfth Hour
  (Lifeline cooldown), Edge of Night, Blade of the Ruined King, Sunfire Aegis,
  Thornmail, Serylda's Grudge, Essence Reaver, Rod of Ages, Liandry's
  Torment, Cosmic Drive, Riftmaker, Archangel's Staff, Rabadon's Deathcap,
  Luden's Echo, Malignance, and the five Tier-2 boots priced up to 1200g
  (Gluttonous Greaves / Ionian Boots of Lucidity to 1000g).

### Follow-up: provenance tooltips ported to AerStrike + backfilled for 7.2

The provenance-tooltip feature (hover a stat/cost to see which patch it last
changed in, linking the patch notes) existed only in the deprecated Meta
design — it was never ported to AerStrike, the shipped default, so the app's
core differentiator (traceable, sourced data) was invisible in production.
Fixed:

- Ported `ProvenanceTooltip` to `src/designs/aerstrike/` and wired it into
  the item shop (cost + stat lines) and both stat panels (single + A/B
  compare).
- **Backfilled provenance stamps for every item touched in the 7.2 sweep
  above**, by diffing `data/patches/7.1/items.json` against `7.2` field-by-
  field rather than relying on memory of what changed — e.g. Blade of the
  Ruined King's Attack Damage (25→40) is now stamped `"7.2"` and its tooltip
  links straight to the official patch notes. None of this had been stamped
  when the sweep originally landed.
- Fixed a real accuracy bug this surfaced: `provenanceFor()` falls back to
  `CURRENT_PATCH` for any value with no explicit stamp (by design — a "still
  accurate as of this patch" default, not a change record). The tooltip
  wording didn't distinguish the two cases, so **every unstamped value**
  (e.g. Infinity Edge's cost, never touched this patch) was claiming "Last
  changed: Patch 7.2" — false. Tooltip now checks for an explicit stamp and
  says "No change on record — accurate as of Patch 7.2" for the fallback
  case instead of overclaiming a specific patch. Applies to both designs.

### Follow-up: the "missing items" from the initial 7.2 pass weren't gaps

An initial pass flagged Lost Chapter, Haunting Guise, Stormsurge, Void Staff,
Tear of the Goddess, Ring of Revelation, and Seraph's Embrace as roster gaps
(mentioned in the 7.2 patch notes but absent from this catalog). Direct
per-item wiki lookups reversed that:

- **Void Staff** was removed from Wild Rift entirely in patch V4.4 (years
  before 7.x) — it doesn't exist to add.
- **Lost Chapter**, **Haunting Guise**, **Tear of the Goddess**, **Ring of
  Revelation** are bare component items with no passive of their own (their
  old unique passives — "Insight", "Madness" — were removed in patches
  V4.4/V3.4). They're correctly excluded by the same design that already
  excludes every other pure component (Amplifying Tome, Ruby Crystal, etc.
  aren't in the catalog either) — not gaps. **wildriftfire had claimed these
  gained new "Enlighten"/"Madness" passives in 7.2; the official wiki
  contradicts that outright — a second instance in this patch's work of
  wildriftfire fabricating a specific-sounding number/mechanic the primary
  source doesn't back up** (the first was Lee Sin's R "Dragon's Rage",
  caught the same way). Treat wildriftfire deltas with extra skepticism when
  they can't be cross-checked against the official wiki.
- **Seraph's Embrace** is already represented implicitly: Archangel's
  Staff's own effect text says "Transforms into Seraph's Embrace at +700
  mana," matching how this catalog already avoids double-modeling transform
  items as separate entries.

> **⚠️ Superseded 2026-08-06 — two of the four bullets above were wrong.**
> See "Correction: the Tear line really was missing" below. In short: Tear of
> the Goddess is *not* a passive-less component (it has Mana Charge, and Riot
> balances it by name), and Seraph's Embrace carries its own stat line that
> Riot balances separately from Archangel's Staff. Both are now in the
> catalog. The Void Staff and Stormsurge bullets still stand.
- **Stormsurge**: the wiki fetch returned an implausible cost (3,988g, not a
  round WR price) and a mechanic ("Stormraider"/lightning-strike burst) that
  matches neither of the two other sources checked — looks like a
  hallucinated or wrong-page fetch. Couldn't get a reliable verified stat
  block; left unadded rather than guessed. Revisit with a cleaner source if
  this item's absence turns out to matter. **Re-investigated 2026-07-15 —
  still unconfirmable in this environment; see below.**

#### Stormsurge re-investigation (2026-07-15) — still UNCONFIRMABLE, do not re-litigate without egress

Prompted by two new datapoints: (1) WildRiftFire's live Patch 7.2 guides
recommend Stormsurge on 8 mage champions (akali, aurora, heimerdinger,
katarina, kennen, veigar, vladimir, bard); (2) the official-wiki page
`wiki.leagueoflegends.com/en-us/WR:Stormsurge` exists but smells
PC-contaminated (cost 3988, a PC-style recipe, an "added for ARAM in V5.2a"
note). Goal was to settle definitively whether Stormsurge is purchasable in
current WR Summoner's Rift.

**Blocked before it could be settled — the tie-breaker sources are all
unreachable from this cloud runner:**

- Every WR-native host is denied by this session's **egress policy** (proxy
  answers `403` to `CONNECT`): `wildrift.leagueoflegends.com` (the primary
  source), `wr-meta.com`, `wildriftfire.com`, `riftgg.app`, `wiki.leagueoflegends.com`,
  `leagueoflegends.fandom.com` — all fail `curl` with rc 56. `web.archive.org`
  is blocked too, so archived copies of the primary source are out as well.
- `riftgg.app` also needs the **Firecrawl key from 1Password**, but the `op`
  CLI isn't installed here and `FIRECRAWL_API_KEY` is unset — a cloud runner
  can't reach 1Password (this is already documented for `scripts/daily-verify.sh`).
- The only working web channel is the Anthropic **WebSearch** tool, which
  returns AI-summarized snippets, not raw page text. This repo's own audit
  discipline (see the provenance spot-check note above: "search-engine
  summaries synthesized answers that weren't always backed by the primary
  text") requires confirming every value against a **direct fetch of the
  primary source** before trusting it — which is exactly what's impossible here.

**What the search snippets did/didn't establish:**

- *Confirmed (datapoint 1 is real):* a WildRiftFire-domain-restricted search
  confirms Stormsurge appears in WildRiftFire's Patch 7.2 build guides for
  those 8 champions. But WildRiftFire is this project's twice-documented
  fabricator of plausible-sounding numbers (Lee Sin R, the component-item
  "Enlighten/Madness" passives) — build *usage* is suggestive, not a verified
  stat block, and WildRiftFire's own item numbers can't be cross-checked
  against a primary source from here.
- *Suggestive but unverifiable:* multiple WebSearch queries attribute to the
  official 7.2 notes a **new burst-mage Stormsurge** with a "Squall" passive
  (flat magic pen; deal 25% of a target's max HP within 2.5s → inflict Squall
  + 25% MS for 2.5s, 25s cd; after 2s deal 125 + 10% AP magic damage; on kill
  splash it + grant 25 gold). This fits the real 7.2 mage-item rework the
  catalog already reflects (flat-pen consolidation; Blackfire Torch, Dusk and
  Dawn, updated Luden's Echo, Void Amethyst all shipped). *But no reachable
  source gives the two numbers an item entry needs — base **Ability Power**
  and **cost** — and the searches say so outright ("base stat details ... are
  not included").*
- *Actively contradictory:* across four searches the hard numbers never
  agreed — cost came back as 3988 (wiki/PC), 2800 (explicitly tagged the PC
  Summoner's Rift version), or absent; AP as 100 or 90; magic pen as "7%+15",
  "15 flat", or "flat/unspecified"; the max-HP trigger as 25% *or* 35%; the
  cooldown 25s *or* 30s. One summary asserted the WR version is **ARAM-only**
  while the SR version is PC-exclusive. This is the same PC-contamination +
  hallucination signature that got the item excluded originally.

**Verdict:** Do **not** add Stormsurge. There is genuine signal it may be a
real 7.2 burst-mage item (real WildRiftFire build usage + a self-consistent
Squall-passive description), but no complete, primary-source-verified stat
block (cost + AP + magic pen) can be obtained from any source reachable here,
and the readable sources contradict each other on nearly every number and on
SR-vs-ARAM availability. Adding it would mean inventing a cost/AP the moat
rules forbid guessing. The dependent follow-up (re-running the standing-builds
pipeline to rescue the 7 skipped mage champions) is therefore also **not**
run — it's contingent on a verified add, and the pipeline cache
(`~/.cache/wrb/builds-pipeline/`) isn't present on this runner anyway.

**How to actually settle this (next session, with network egress):** from an
environment that can reach the WR-native hosts — or on the local machine where
`op` + Firecrawl work — directly fetch, in priority order, (a) the official
7.2 patch notes at `wildrift.leagueoflegends.com/.../wild-rift-patch-notes-7-2/`
and confirm Stormsurge is listed as a purchasable SR item with an exact cost
and AP; (b) `riftgg.app/items` (Firecrawl) and `wr-meta.com` for a WR-native
stat block to cross-check. If ≥2 primary/WR-native sources agree on a round WR
cost and stat line, add it via `/add-entity` and then run the standing-builds
pipeline; if they still conflict or show it as ARAM-only, mark this closed as
"not an SR item" and stop revisiting.

### Provenance completeness audit (bounded, patch 7.2 follow-up)

Follow-up to the item-provenance backfill above: same gap (values that changed
in some patch but were never stamped, so `provenanceFor()` silently falls back
to "accurate as of current patch") checked for champions, plus a plausibility
spot-check of stamps already on the books. Scoped as a bounded audit, not a
full re-verification — see limits at the end.

**1. Registry vs. real snapshots.** `data/patches/registry.json` lists 10
patches (7.0c, 7.0d, 7.0f, 7.1, 7.1b, 7.1d, 7.1e, 7.1f, 7.1g, 7.2), but only
`data/patches/7.1/` and `data/patches/7.2/` exist as real data directories —
confirmed with `ls data/patches/`. The other 8 are registry-only entries (date
+ official patch-notes URL), used solely so `provenanceFor()` can resolve a
link for values already stamped with those versions. **A full historical diff
chain (7.0c→7.0d→7.0f→7.1) is not reconstructable from data alone** — there's
no snapshot for any of those four, so nothing to mechanically diff. This is a
hard limitation of the two-snapshot setup, not something this audit could
close.

**2. Champion `stats` diff, 7.1 → 7.2.** Field-by-field diff (Python,
`json.load` + dict compare) of `stats` (attackDamage, attackSpeed, armor,
magicResist, maxHealth, healthRegen, mana, manaRegen, moveSpeed,
critDamageBase — both `base` and `perLevel` where applicable) across all 139
champions shared between `data/patches/7.1/champions.json` and
`data/patches/7.2/champions.json` (Yunara is 7.2-only, skipped — no 7.1
baseline). **Result: zero diffs**, confirmed both key-by-key and via
whole-object (`champ71['stats'] == champ72['stats']`) comparison. Matches
expectation — this session's 7.2 work touched abilities/descriptions for 14
named champions, not raw stat blocks. Nothing to stamp.

**3. Spot-check of 9 pre-existing stamps** (all older than 7.1g), each
checked against the official patch notes for the claimed patch
(`wildrift.leagueoflegends.com/.../wild-rift-patch-notes-<version>/`), 1–2
lookups each, ~16 total web calls:

| Champion | Stat | Stamp | Stored value | Patch notes say | Verdict |
| --- | --- | --- | --- | --- | --- |
| corki | attackDamage | 7.1 | base 54 | "Attack Damage: 50 → 54" | matches |
| jax | armor | 7.1b | perLevel 4.5 | armor growth "3.9 → 4.5" | matches |
| katarina | armor | 7.0c | base 34 | "base armor... 30 to 34" | matches |
| kayle | attackDamage, manaRegen | 7.1f | base 54 AD, base 16 MR | AD "50→54", mana regen "12→16" | matches |
| rell | armor, attackDamage | 7.0d | base 46 armor, base 62 AD | "Base Armor: 40→46", "Base Attack Damage: 58→62" | matches |
| renekton | attackDamage | 7.1b | base 66 | "Attack Damage: 70 → 66" | matches |
| ryze | attackDamage | 7.1e | base 54 | "Base Attack Damage: 58 → 54" | matches |
| shyvana | attackDamage | 7.1e | base 62 | "Base Attack Damage: 58 → 62" | matches |
| **ashe** | **maxHealth** | **7.0c** | **base 610** | **"Base Health: 600 → 630"** | **mismatch — see below** |

8 of 9 clean. **Ashe is a real find, but it's a stat-value bug, not a
provenance-stamp bug:** patch 7.0c genuinely did touch Ashe's `maxHealth` (so
the *stamp* `"7.0c"` is plausible/correct), confirmed against two independent
sources — the official 7.0c patch notes text ("Base Health: 600 → 630") and
the current `wildriftfire.com/guide/ashe` stat block ("Level 1 Ashe Stats:
Health 630"). Neither 7.0d, 7.0f, nor 7.1 patch notes mention Ashe at all, so
there's no documented patch that reverted her back down. Yet both the 7.1
and 7.2 snapshots in this repo store `maxHealth.base: 610` — 20 below what
every available source says it should be. This predates the 7.2 work (it's
already wrong in 7.1) and isn't a provenance gap; it's an existing data-value
error that happens to have been surfaced by this spot-check.
**Fixed as a follow-up**: `maxHealth.base` corrected 610 → 630 in both
`data/patches/7.1/champions.json` and `data/patches/7.2/champions.json`,
re-confirmed directly against the official 7.0c patch notes ("Base Health:
600 → 630") before writing. The existing `"7.0c"` provenance stamp was
already correct and needed no change — this was a stat-value bug, not a
provenance-stamp bug. Full gate (validate-data/typecheck/test) green after
the fix.

One correction to the search process itself: the initial (non-primary-source)
web search summary for Corki claimed attack-damage *growth* also changed
("3.6 → 4" in patch 7.1) — re-checking against the actual fetched patch-notes
page showed **no such change is mentioned**, only the base-AD change already
stamped. Search-engine summaries synthesized answers that weren't always
backed by the primary text; every finding above was confirmed against a
direct fetch of the official patch-notes page (or, for Ashe, two independent
direct fetches) before being reported as a match or a mismatch.

**What remains genuinely unverifiable given the two-snapshot limit:** any
stat/cost stamped with 7.0c, 7.0d, 7.0f, 7.1b, 7.1d, 7.1e, or 7.1f that
*wasn't* in this 9-item sample. Confirming those would require re-deriving
values from patch-notes prose one-by-one (as done here), not diffing —
there's no snapshot to diff against for those versions. Recommend treating
this as done for now (this pass covered the cheap mechanical check in full,
plus a representative spot-check) and only opening a dedicated full-history
verification session if a specific older-patch stamp is called into question
again.

## Patch 7.2a (2026-07-15) — PARTIAL roll

Rolled forward from 7.2. The official notes document 18 changes; **4 were
representable in the current schema and were applied**. The rest are recorded
here rather than silently dropped.

Sources: [Riot 7.2a notes](https://wildrift.leagueoflegends.com/en-us/news/game-updates/wild-rift-patch-notes-7-2a/)
· [changelog.gg](https://changelog.gg/games/wild-rift/updates/2026-07-15-wild-rift-patch-notes-7-2a-10a16fe61cc11d1e)

### Applied

| Entity | Change | Note |
| --- | --- | --- |
| Skarner | W `Seismic Bastion` cooldown `9/8/7/6` → `8/7/6/5` | |
| Skarner | E `Ixtal's Impact` cooldown `20/18/16/14` → `18/16/14/12` | |
| Armorcrusher Boots | `attackDamage` `25` → `20` | provenance stamped `7.2a` |
| Armorcrusher Boots | `lethality` `12` → `10` | "Armor Penetration" in the notes; stamped `7.2a` |

Description-only edits (no engine effect): Manamune `Mana Charge` +18 → +14
mana per stack; Blade of the Ruined King `Ruined Strikes` melee 10% → 8.5%.
BotRK's `mechanic.currentHealthPct` models the **ranged** 7% value, which the
patch did not change, so the mechanic is untouched.

### Not applied — schema does not model the mechanic

| Entity | Change | Why not |
| --- | --- | --- |
| Nidalee | Pounce base damage `65/100/135/170` → `55/90/125/160` | W models Bushwhack (human form) only; cougar-form values are not represented |
| Nidalee | Aspect of the Cougar bonus Armor/MR AP ratio `3%` → `2.5%` | R has no `scalings`; passive stat-conversion is not modelled |
| Warwick | Eternal Hunger bonus AD ratio `20%` → `15%` | passive has no `scalings` |
| Warwick | Jaws of the Beast `90%` → `85%` AP | Q has no AP scaling modelled |
| Skarner | Q max-health damage `10%` → `11%` | max-health damage not modelled |
| Skarner | W shield ratio `8%` → `10%` max health | shields not modelled |
| Senna | Absolution current-health damage `1.2–12%` → `1–10%` | passive not modelled |
| Senna | R shield `40% AP + 4/stack` → `50% AP + 2.5/stack` | shields not modelled |
| Yuumi | E `Zoomies` mana cost `80/90/100/110` → `65/75/85/95` | ability schema has no mana-cost field |
| Yuumi | R `Final Chapter` base healing `20/30/40` → `20/35/50` | healing not modelled |

### ~~Not applied — item absent from the dataset~~ → applied 2026-08-06

`Tear of the Goddess` (mana/stack 6 → 5), `Seraph's Embrace` (Lifeline shield
20% → 16%), and `Muramana` (Shock AD ratio 6% → 4.5%) had **no record in
`items.json`** when 7.2a was rolled. All three are now present in
`data/patches/7.2b/items.json` with these 7.2a values already folded in — see
"Correction: the Tear line really was missing". The 7.2a snapshot itself is
left frozen as it shipped.

### Discrepancy noted

changelog.gg's 7.2a summary lists only ARAM adjustments for Skarner and does
not corroborate the two cooldown changes. The official Riot notes do list
them, so the primary source was used per the source-priority rule. Worth a
re-check against the wiki once it catches up.

## Patch 7.2b (2026-07-29) — PARTIAL roll

Rolled forward from 7.2a. The official notes document 24 changes; **14 were
representable and applied**. Unlike 7.2a, **every applied value was confirmed
against both sources with no discrepancies**.

Sources: [Riot 7.2b notes](https://wildrift.leagueoflegends.com/en-us/news/game-updates/wild-rift-patch-notes-7-2b/)
· [WildRiftFire](https://www.wildriftfire.com/patch-notes)

### Applied — champions

| Champion | Change | Provenance |
| --- | --- | --- |
| Jayce | base `armor` `46` → `37` | `7.2b` |
| Nidalee | base `armor` `46` → `37` | `7.2b` |
| Nidalee | base `magicResist` `40` → `36` | `7.2b` |
| Aurora | Q `Twofold Hex` damage `35/65/95/125` → `40/70/100/130` | — |
| Aurora | Q `Twofold Hex` AP ratio `0.30` → `0.33` | — |
| Aurora | E `The Weirding` damage `75/125/175/225` → `80/130/180/230` | — |
| Sona | R `Crescendo` cooldown `80/70/60` → `80/75/70` | — |
| Kayle | Q `Radiant Blast` damage `70/120/170/220` → `60/100/140/180` | — |
| Zilean | Q `Time Bomb` damage `70/140/210/280` → `60/125/190/255` | — |
| Zilean | R `Chronoshift` cooldown `100/85/70` → `110/95/80` | — |

Provenance stamps apply to `stats`/`cost` only, per CLAUDE.md; ability values
are not stamped.

### Applied — items

| Item | Change | Provenance |
| --- | --- | --- |
| Iceborn Gauntlet | `cost` `3100` → `3000` | `7.2b` |
| Iceborn Gauntlet | `maxHealth` `250` → `300` | `7.2b` |
| Magnetic Blaster | `attackDamage` `25` → `30` | `7.2b` |
| Navori Quickblades | `cost` `2800` → `2700` | `7.2b` |

Description-only edit (no engine effect): Luden's Echo `Discordic Echo`
`110 (+10% AP)` → `140 (+15% AP)`, cooldown 10s → 9s.

### Not applied — schema does not model the mechanic

| Entity | Change | Why not |
| --- | --- | --- |
| Nidalee | Prowl brush + marked-enemy move speed `15%` → `10%` | passive move-speed effects not modelled |
| Ambessa | Public Execution damage reduction `30/40/50%` → `10/20/30%` | damage reduction not modelled |
| Ambessa | Public Execution damage from health lost `20/30/40%` → `10/17.5/25%` | %-health-lost scaling not modelled |
| Sona | Aria of Perseverance heal `45/60/75/90` → `35/50/65/80` | heals not modelled |
| Ekko | Z-Drive Resonance AP ratio `70%` → `80%` | passive has no `scalings` |
| Ekko | Parallel Convergence missing-health `2%+0.015% AP` → `3%+0.025% AP` | %-missing-health not modelled |
| Kayle | Radiant Blast mana cost `80/85/90/95` → `70/80/90/100` | ability schema has no mana-cost field |
| Kayle | Celestial Blessing mana cost + heal | same; heals not modelled |
| Hecarim | Rampage bonus move speed on hit `30%` → `18%` | passive move-speed not modelled |
| Lee Sin | Safeguard shield `80/140/200/260` → `100/160/220/280`, omnivamp `16–40%` → `20–50%` | shields and omnivamp not modelled |

### Not applied — missing entity or missing data file

- ~~**Lord Dominik's Regards** (`attackDamage` 25 → 30) has **no record in
  `items.json`**. Same class of gap as the 7.2a Tear line.~~
  **Wrong — retracted 2026-08-06.** The item was in `items.json` the whole
  time, under the singular name `Lord Dominik's Regard` (id
  `lord-dominiks-regard`). The roll searched for Riot's plural spelling,
  missed it, and recorded it as a roster gap. `attackDamage` 25 → 30 is now
  applied and stamped `7.2b`, bringing this patch to **15 of 24** changes
  applied. The `name` field now uses Riot's plural; the `id` is unchanged
  because `data/patches/7.1/builds.json` references it.
- **Botanist rune** (plant gold 30 → 10) — there is no runes data file at all.
- **Champion bounty system** (bounty gold rates) — no data file; not modelled.

## Patches 7.2c/7.2d/7.2e (2026-09-11) — registry only, data NOT rolled forward

Riot has shipped three more hotfixes since 7.2b: **7.2c** (2026-08-12, 9
champions / 10 items), **7.2d** (2026-08-26, 13 champions / 2 items), and
**7.2e** (2026-09-09, 5 champions / 4 items) — so the live game is now three
hotfixes ahead of the shipped dataset. Their dates and notes URLs are recorded
in `data/patches/registry.json`, but `champions.json`/`items.json` were **not**
rolled forward and `CURRENT_PATCH` stays `7.2b`.

Reason: every primary/secondary source domain this project's source-priority
rule requires (`wildrift.leagueoflegends.com`, `wildriftfire.com`,
`riftgg.app`, `wiki.leagueoflegends.com`) was unreachable via direct fetch in
this session's environment — the same `EGRESS_BLOCKED` condition already
recorded under "Two latent accuracy bugs found" above. Search-engine summaries
were reachable, but demonstrably unreliable at the per-patch-per-value level
this project needs: one query round attributed the same Mikael's Blessing
change to 7.2c, a second attributed it to 7.2d, in the same session. Writing
either into a schema-stamped `provenance` entry would silently corrupt the
record it's meant to protect, so per CLAUDE.md's "never guess" rule, no
champion/item values were changed. This should be finished by hand (or by
`patch-watch`) once `WebFetch`/`Bash(curl)` can reach the primary sources —
one hotfix per PR, oldest first (7.2c, then 7.2d, then 7.2e), same as every
prior roll in this document.

**Jhin is unaffected by all three hotfixes.** Cross-checked two ways:
1. Champion-change rosters for 7.2c (Cho'Gath, Jinx, Nilah, Nasus, Ryze,
   Warwick, Kog'Maw, Leona, Rumble), 7.2d (Caitlyn, Fiora, Mordekaiser,
   Renekton, Syndra, Veigar, Vladimir, Yuumi, Gwen, Pantheon, Thresh, Twisted
   Fate, Yone), and 7.2e (Vi, Swain, Janna, Nautilus, Malphite) never name Jhin,
   and none of the touched items (Sunfire Aegis, Stridebreaker, Mikael's
   Blessing, Kaenic Rookern, Berserker's Greaves, Plated Steelcaps, Mercury's
   Treads, Eclipse, Unending Despair, Verdant Barrier) are core Jhin items.
2. WildRiftFire's own Jhin guide, re-fetched live at **Patch 7.2e**, lists the
   exact same six-item build already curated in `data/patches/7.2b/builds.json`
   as `jhin-optimal` — The Collector → Galeforce → Lord Dominik's Regards →
   Magnetic Blaster → Infinity Edge, Gluttonous Greaves boots — so the shipped
   build recommendation for Jhin is current even though the dataset's patch
   stamp is not.

## Correction: the Tear line really was missing (2026-08-06)

Hand-run backfill (the `data-verify` / `patch-watch` workflows are disabled —
they need Anthropic API credits the org doesn't fund). This reverses part of
the 7.2 follow-up investigation above and both "absent item" notes.

**Added to `data/patches/7.2b/items.json`** (108 → 112 items):

| Item | Cost | Stats | Provenance |
| --- | --- | --- | --- |
| Tear of the Goddess | 500 | `abilityHaste` 5, `mana` 200 | `cost`/`mana`/`abilityHaste` = `7.2` |
| Muramana | 2700 | `attackDamage` 25, `abilityHaste` 20, `mana` 1000 | none — see below |
| Seraph's Embrace | 3000 | `abilityPower` 60, `abilityHaste` 25, `magicPenPercent` 0.07, `mana` 1200 | `cost`/`abilityPower`/`abilityHaste` = `7.2` |
| Fimbulwinter | 2600 | `maxHealth` 350, `abilityHaste` 15, `mana` 1200 | none — see below |

**Corrected:** `Lord Dominik's Regard` → `Lord Dominik's Regards`,
`attackDamage` 25 → 30, stamped `7.2b`.

### Why the earlier "not a gap" call was wrong

- **Tear of the Goddess** was dismissed as "a bare component item with no
  passive of its own." It has a passive — Mana Charge — and Riot balances it
  by name: 7.2 gave it an explicit stat line (price 900 → 500, mana 300 → 200,
  ability haste 10 → 5, "Tear of the Goddess is now a basic item") and 7.2a
  cut Mana Charge 6 → 5. A component Riot writes patch notes for is not the
  same class of thing as Amplifying Tome.
- **Seraph's Embrace** was dismissed as "already represented implicitly" by
  Archangel's Staff's transform text. But Riot balances the two separately and
  their stat lines diverge — 7.2 changed Seraph's own Awe ratio (3% → 2%) and
  Lifeline (15% → 20% max mana, CD 90s → 70s), and 7.2a cut Lifeline again to
  16%. None of that is derivable from Archangel's entry. Same reasoning
  applies to Muramana vs Manamune (7.2a cut Muramana's Shock AD ratio
  6% → 4.5%; Manamune's Mana Charge was cut separately, 18 → 14).
- **Lord Dominik's Regards** was never missing at all — a spelling mismatch
  (singular in our data, plural in Riot's notes) made two separate passes
  record a present item as absent.

### Provenance note

Tear and Seraph's are new to *this dataset* but not new to the *game*, so the
`/add-entity` "brand-new entity ⇒ no stamps" exception does not fit them: the
honest answer to "when did this value last change" is a real patch we can cite
(`7.2`), not the current-patch fallback. They are stamped accordingly.
Muramana is deliberately left **unstamped** — no reachable source establishes
when its 2700 / 25 AD / 20 AH last changed, so the `provenanceFor()` fallback
("no change on record — accurate as of 7.2b") is the truthful reading. This
matches Manamune, which is also unstamped.

### Item exclusivity — the Tear line is now modelled

Adding the transforms created a correctness hazard: Muramana and Seraph's
Embrace sat in the same flat pool as Manamune and Archangel's Staff, so a build
could hold a base item *and* its upgrade, or stack Tear alongside an item built
out of it, and report mana totals the game cannot produce. Wild Rift's own rule
covers all of it — **"Limited to 1 Tear of the Goddess item"** (LoL Wiki WR item
text, corroborated by zilliongamer) — so that is what's modelled, rather than
ad-hoc pair exclusions.

Two optional `ItemSchema` fields (`src/lib/schema/index.ts`):

- **`exclusiveGroup`** — items sharing a group are mutually exclusive. All seven
  Tear-line items carry `"tear"`. Members are peers, not a hierarchy: the
  component, everything built from it, and every transform are equally
  incompatible with one another.
- **`upgradesFrom`** — the base item a transform upgrades out of. Descriptive;
  exclusivity is enforced by `exclusiveGroup`, which is broader.

Enforced in three places, so the rule can't be bypassed:

| Layer | Where | Behavior |
| --- | --- | --- |
| State | `addItem`, `src/state/buildState.ts` | refuses a conflicting add (boots included — exclusivity is not slot-scoped) |
| Validator | `scripts/validate.ts` | **fails the gate** if a curated preset holds two group members, if `upgradesFrom` doesn't resolve, or if an upgrade isn't in its base item's group |
| UI | `src/designs/aerstrike/AerstrikeDesign.tsx` | conflicting cards are disabled, chipped `Blocked`, and captioned "Can't be held with <item>" |

`conflictingItemFor(ownedIds, candidateId)` in `src/lib/data/index.ts` is the
single shared implementation; the state hook, the UI, and the tests all call it.

**Gold efficiency is now suppressed for transform items.** Muramana was
displaying **200% gold eff** — its 1000 mana priced against Manamune's 2700g,
even though ~700 of that mana is stacked in play, not bought. `goldEfficiency()`
returns `null` for anything with `upgradesFrom`; callers already render nothing
for null. The buyable base items are unaffected.

The deprecated `/meta` design gets the state-layer guard for free (shared
`addItem`) but has no visual affordance for a blocked item. Left as-is —
reference-only design.

### Known gaps and caveats left open

- **Fimbulwinter's Awe ratio is contested.** Shown as 10% maximum mana (LoL
  Wiki WR); lolwildriftbuild.com says 8%, matching Winter's Approach's
  un-upgraded ratio. Not resolvable from available sources. Descriptive text
  only, no engine effect. The wiki was the more reliable of the two throughout
  this pass, so it won — but this is a coin-flip worth re-checking.
- **Muramana's Awe ratio (2% max mana) is single-sourced** to the official LoL
  Wiki WR namespace. Descriptive text only — no engine effect.
- **Seraph's Lifeline flat shield term is omitted, not resolved.** Pre-7.2 text
  read "100 + 15% current mana"; 7.2 restates Lifeline as a max-mana
  conversion and no reachable source confirms whether a flat term survived.
  Recorded the confirmed 16% ratio and left the flat term out rather than
  guess.
- **riftgg.app returned HTTP 403** on every attempt, so the CLAUDE.md
  priority-2 pair was covered by wildriftfire plus the official LoL Wiki WR
  namespace. Every value above still cleared the ≥2-source bar.
- **Ring of Revelation** stays excluded. Riot's 7.2 notes rewrote Archangel's
  build path from `Ring of Revelation` to `Fiendish Codex`, which is
  consistent with it no longer mattering; not re-investigated here.

## Ability schema extension (2026-08-27) — why rolls were always PARTIAL

Every roll since 7.2 was recorded as a PARTIAL roll for the same reason, and the
reason was never examined: **7.2a applied 4 of 18 documented changes, 7.2b 15 of
24 — 19 of 42 (45%)**. A re-audit of all 20 "not applied" rows against the real
schema and the real records establishes that this was a **data-model ceiling**,
but also that the ROSTER framing of it was **wrong on 5 of the 20 rows**.

### ROSTER was wrong: 3 of the 20 were DATA gaps, not schema gaps

These need **no schema work at all** — the schema could always express them and
the champion record simply left the field empty. `AbilityScalingSchema` has
always allowed `abilityPower` / `bonusAttackDamage`, `slot: "passive"` has always
been legal, and **Darius' Hemorrhage is a live in-dataset example of a passive
carrying `scalings`** (1 of 140 champions does it).

| Entity | Change | ROSTER said | Actually |
| --- | --- | --- | --- |
| Warwick | passive Eternal Hunger bonus-AD ratio `20%` → `15%` | "passive has no `scalings`" | **DATA gap** — record has `scalings: []` while its own description reads "(+ 20% bonus AD)" |
| Warwick | Q Jaws of the Beast AP ratio `90%` → `85%` | "Q has no AP scaling modelled" | **DATA gap** — `abilityPower` is used by 100+ other abilities |
| Ekko | passive Z-Drive Resonance AP ratio `70%` → `80%` | "passive has no `scalings`" | **DATA gap** — `damageType` is *already* `magic`; only `scalings` is empty |

### ROSTER had the right verdict for the wrong reason: 2 more rows

- **Skarner Q** — "max-health damage not modelled" is false; Gnar E already
  carries `{stat: "maxHealth", ratio: 0.06}`. The real blocker was that
  `maxHealth` resolves against the **attacker**, while the ability text is "% of
  the **target's** maximum health". Storable all along — and silently wrong.
- **Nidalee R** — "R has no `scalings`" is false. `scalings` is a *damage* ratio;
  putting `0.025` there would have rendered an armor/MR conversion as damage.
  The real gap was that no field linked an ability to the stats it grants.

### What was added

Six capabilities, chosen because each unblocks specific recorded changes. All
fields are `.optional()` — never `.default()` — for two reasons: the frozen
snapshots (7.1, 7.2, 7.2a) are validated by this same schema, so a required
field would break ~700 ability records at once; and a default would make "nobody
transcribed this yet" indistinguishable from "this ability genuinely has none".

| Capability | Unblocks | Recorded changes |
| --- | --- | --- |
| `heal` / `shield` (`AbilityAmountSchema`) | Skarner W, Senna R, Yuumi R, Sona W, Kayle W, Lee Sin W | **6** |
| `grants` (a `StatBlock` the ability confers) | Nidalee R, Nidalee Prowl, Hecarim Q, Lee Sin W omnivamp | **4** |
| `targetMaxHealth` / `targetCurrentHealth` / `targetMissingHealth` scalings | Skarner Q, Senna passive, Ambessa R, Ekko W | **4** |
| `cost` (resource per rank) | Yuumi E, Kayle Q, Kayle W | **3** |
| `byLevel` / `baseDamageByLevel` interpolation | Senna passive, Lee Sin W omnivamp range | **2** |
| `damageReduction` | Ambessa R | **1** |

`grants` reuses `StatBlockSchema` rather than inventing new stat vocabulary —
`moveSpeedPercent`, `omnivamp`, `armor` and `magicResist` were already keys. It
is deliberately **not** summed by `computeBuild`: a buff that applies only while
an ability is active is not part of a champion's standing totals, and writing one
into `item.stats` instead would move displayed Armor/MR **and** that item's gold
efficiency. That mistake is what the field exists to prevent.

### Still not modelled

- **Form/transform ability variants** (Nidalee cougar form). Duplicate `slot`
  values parse, but both consumers key by slot — `AerstrikeDesign` builds a
  `Map` (last wins) and the champion page uses `key={a.slot}` — so it needs a
  discriminator plus consumer changes. Latent scope is wider than the one
  recorded change: Nidalee E, Skarner Q, Ambessa Q and Lee Sin recasts are all
  half-modelled today.
- **Per-stack terms** (Senna R's `+2.5/stack`). 24 item effects carry a stack cap.
- **Runes** — no `RuneSchema` and no `runes.json`; a whole missing entity type,
  not a field. Blocks the Botanist change.
- **Champion bounty** — a global economy rule with no per-entity home.

### Two latent accuracy bugs found, deliberately NOT fixed here

Both are wrong in shipped data today. Neither is user-visible yet, because
`rawAbilityDamage` is exported but **never called** — grep finds no import site.
They will produce wrong numbers the moment Phase 3 wires it up.

- **Gnar E** carries `{stat: "maxHealth", ratio: 0.06}`, computing 6% of *Gnar's*
  max health. The description ("based on max health") does not say whose. It is
  the only `maxHealth` ability scaling in the entire dataset.
- **Warwick Q** carries `baseDamage: [6, 7, 8, 9]`, which appear to be Riot's
  %-target-max-health figures stored as flat damage — so the engine would add a
  literal 6–9 damage.

Both need a primary source to resolve, and every Wild Rift source domain
(`wildrift.leagueoflegends.com`, `wildriftfire.com`, `wiki.leagueoflegends.com`,
`riftgg.app`) is blocked from the environment this audit ran in. Changing a
shipped value on an unverified reading would be exactly the failure this
project's source-priority rule exists to prevent, so they are recorded here
instead. **Fix them in the same pass that applies the three DATA gaps above.**

### Scale of what is still inert

For context on how much room the extension leaves: **179 of 188 item effects
(95%) carry no machine-readable `mechanic`** and are dead text to the engine,
covering only 7 of 112 items. On the champion side, **26 abilities across 26
champions are typed `damageType: "none"` while their own description says they
deal physical/magic/true damage**, and **112 abilities have a damage type but
zero scalings**. A future `validate-data` rule should flag a `none`-typed ability
whose description matches `/deals? .* (physical|magic|true) damage/`, or the new
fields get populated on top of a mistyped base.
