"use client";

import { getPatchInfo, hasProvenanceStamp, provenanceFor } from "@/lib/data";
import { formatPatchDate } from "@/lib/format";
import type { Provenance } from "@/lib/schema";

/**
 * Wraps a displayed value and, on hover/focus, reveals which patch that value
 * last changed in — e.g. "Last changed: Patch 7.2 · Jul 9, 2026".
 *
 * `provenanceFor` falls back to `CURRENT_PATCH` when a value carries no
 * explicit stamp (see `src/lib/data`) — that's a "still accurate as of this
 * patch" default, NOT a record of when it last changed. Conflating the two
 * would claim e.g. Infinity Edge's cost "last changed" in 7.2 just because
 * nothing touched it this patch. So this component checks for an explicit
 * stamp itself and uses honest, weaker wording ("No change on record") for
 * the fallback case instead of overclaiming a specific patch.
 *
 * Deliberately non-interactive (no <a>): these tooltips render inside the item
 * shop cards, which are themselves <button>s, and nesting a link inside a button
 * is invalid. The patch label is shown as text; the notes URL is surfaced via
 * the native `title` attribute so it stays discoverable without breaking the
 * surrounding button semantics.
 *
 * Uses a *named* group (`group/prov`) so its hover state never collides with the
 * card's own `group` hover styling.
 */
export function ProvenanceTooltip({
  provenance,
  valueKey,
  children,
}: {
  provenance: Provenance | undefined;
  valueKey: string;
  children: React.ReactNode;
}) {
  const hasStamp = hasProvenanceStamp(provenance, valueKey);
  const version = provenanceFor(provenance, valueKey);
  const info = getPatchInfo(version);

  const date = info ? formatPatchDate(info.date) : "";
  const patchLabel = `Patch ${version}${date ? ` · ${date}` : ""}`;
  const headline = hasStamp ? "Last changed" : "No change on record — accurate as of";

  return (
    <span
      className="group/prov relative inline-flex items-center"
      title={info?.url ? `${headline}: ${patchLabel} — ${info.url}` : `${headline}: ${patchLabel}`}
    >
      {/* The dotted underline sits at low opacity until pointed at — with a
          tooltip on nearly every number, full-strength underlines everywhere
          made the whole page read as fuzzy. */}
      <span className="cursor-help underline decoration-dotted decoration-[var(--ae-fg-subtle)]/20 underline-offset-2 transition group-hover/prov:decoration-[var(--ae-fg-subtle)]/80">
        {children}
      </span>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute bottom-full left-1/2 z-30 mb-1 -translate-x-1/2 whitespace-nowrap border border-[var(--ae-border-strong)] bg-[var(--ae-bg-elev)] px-2 py-1 text-[10px] font-medium text-[var(--ae-fg)] opacity-0 shadow-lg transition group-hover/prov:visible group-hover/prov:opacity-100"
      >
        {headline}: <span className="font-bold text-[var(--ae-accent-secondary)]">{patchLabel}</span>
      </span>
    </span>
  );
}
