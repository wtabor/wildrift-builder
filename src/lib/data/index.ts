import {
  ChampionsFileSchema,
  ItemsFileSchema,
  PatchMetaSchema,
  BuildsFileSchema,
  type Champion,
  type Item,
  type BuildPreset,
  type PatchMeta,
  type Provenance,
} from "@/lib/schema";

import championsRaw from "@data/patches/7.2b/champions.json";
import itemsRaw from "@data/patches/7.2b/items.json";
import metaRaw from "@data/patches/7.2b/meta.json";
import buildsRaw from "@data/patches/7.2b/builds.json";
import registryRaw from "@data/patches/registry.json";

/**
 * The currently shipped patch. When a new patch is hand-verified, add its
 * folder under data/patches/<patch>/ and bump these imports (or, later, make
 * this dynamic with a patch selector).
 */
export const CURRENT_PATCH = "7.2b";

// Parse once at module load so any malformed data fails loudly and early.
export const patchMeta: PatchMeta = PatchMetaSchema.parse(metaRaw);
export const champions: Champion[] = ChampionsFileSchema.parse(championsRaw);
export const items: Item[] = ItemsFileSchema.parse(itemsRaw);
export const builds: BuildPreset[] = BuildsFileSchema.parse(buildsRaw);

const championById = new Map(champions.map((c) => [c.id, c]));
const itemById = new Map(items.map((i) => [i.id, i]));
const buildsByChampion = new Map<string, BuildPreset[]>();
for (const b of builds) {
  const list = buildsByChampion.get(b.championId);
  if (list) list.push(b);
  else buildsByChampion.set(b.championId, [b]);
}

export function getChampion(id: string): Champion | undefined {
  return championById.get(id);
}

export function getItem(id: string): Item | undefined {
  return itemById.get(id);
}

export function getItems(ids: string[]): Item[] {
  return ids.map((id) => itemById.get(id)).filter((i): i is Item => Boolean(i));
}

/** Curated "standing builds" for a champion, in authored order. */
export function getBuilds(championId: string): BuildPreset[] {
  return buildsByChampion.get(championId) ?? [];
}

/* -------------------------------------------------------------------------- */
/*  Item exclusivity — "Limited to 1 Tear of the Goddess item"                 */
/* -------------------------------------------------------------------------- */

/**
 * The item already in `ownedIds` that blocks `candidateId`, or undefined if the
 * candidate is addable. Two items conflict when they share an `exclusiveGroup`.
 *
 * Holding the same id twice is handled separately by the caller's dedup rule;
 * this answers the narrower question "does some *different* item I own rule
 * this one out?", so re-adding an owned item reports no conflict here.
 */
export function conflictingItemFor(
  ownedIds: readonly string[],
  candidateId: string,
): Item | undefined {
  const candidate = itemById.get(candidateId);
  if (!candidate?.exclusiveGroup) return undefined;
  for (const id of ownedIds) {
    if (id === candidateId) continue;
    const owned = itemById.get(id);
    if (owned?.exclusiveGroup === candidate.exclusiveGroup) return owned;
  }
  return undefined;
}

/* -------------------------------------------------------------------------- */
/*  Provenance — "which patch did this value last change in?"                  */
/* -------------------------------------------------------------------------- */

export interface PatchInfo {
  /** ISO date the patch released. */
  date: string;
  /** Link to the patch notes, if known. */
  url?: string;
}

const patchRegistry = registryRaw as Record<string, PatchInfo>;

/** Look up release date + notes URL for a patch version, if registered. */
export function getPatchInfo(version: string | undefined): PatchInfo | undefined {
  return version ? patchRegistry[version] : undefined;
}

/**
 * Resolve the patch to cite for a single displayed value. Returns the explicit
 * stamp when the entity carries one, else falls back to the dataset baseline
 * (CURRENT_PATCH).
 *
 * IMPORTANT: the fallback means "carried forward unchanged, accurate as of this
 * patch" — it is NOT a record that the value changed in that patch. Most of the
 * dataset is unstamped (stamps are sparse by design), so a caller that renders
 * this as "last changed" turns silence into a freshness claim the data does not
 * support. Always branch on `hasProvenanceStamp` before choosing that wording.
 */
export function provenanceFor(
  provenance: Provenance | undefined,
  key: string,
): string {
  return provenance?.[key] ?? CURRENT_PATCH;
}

/**
 * Whether a value carries an EXPLICIT provenance stamp, as opposed to falling
 * back to the dataset baseline. The single source of truth for the "did this
 * actually change?" question — every surface that words a patch citation
 * ("last changed" vs "no change on record") must gate on this, so the honest
 * wording can never drift apart between the calculator and the reference pages.
 */
export function hasProvenanceStamp(
  provenance: Provenance | undefined,
  key: string,
): boolean {
  return provenance?.[key] !== undefined;
}

/**
 * The newest explicit stamp across `keys`, or undefined when none of them carry
 * one. Use this for a summary line that stands for a GROUP of values (a whole
 * stat table) rather than a single number: picking one representative key
 * reports "no change on record" whenever some *other* value in the group is the
 * one that actually moved this patch.
 *
 * Ordered by the registry's release dates, not by comparing version strings —
 * "7.2b" happens to sort after "7.2", but "7.10" would sort before "7.2".
 * Unregistered versions sort oldest so a known date always wins.
 */
export function latestProvenanceStamp(
  provenance: Provenance | undefined,
  keys: readonly string[],
): string | undefined {
  let newest: string | undefined;
  let newestDate = "";

  for (const key of keys) {
    const version = provenance?.[key];
    if (version === undefined) continue;
    const date = patchRegistry[version]?.date ?? "";
    if (newest === undefined || date > newestDate) {
      newest = version;
      newestDate = date;
    }
  }

  return newest;
}
