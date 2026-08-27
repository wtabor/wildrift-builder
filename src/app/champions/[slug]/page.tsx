import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { champions, getBuilds, getChampion, getItem, CURRENT_PATCH, latestProvenanceStamp } from "@/lib/data";
import { computeBuild, MAX_LEVEL } from "@/lib/stats/engine";
import { formatGold } from "@/lib/format";
import { statRows } from "@/lib/statDisplay";
import { championIconUrl } from "@/lib/visual";
import { breadcrumbLd, championDescription, championPath, referenceLd } from "@/lib/seo";
import { JsonLd, PageShell } from "@/app/_components/PageShell";
import type { Champion } from "@/lib/schema";

/** Fully static: 140 pages emitted at build, no runtime data fetching. */
export function generateStaticParams() {
  return champions.map((c) => ({ slug: c.id }));
}

/** A slug outside the roster is a real 404, not a soft redirect. */
export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = getChampion(slug);
  if (!c) return {};
  const title = `${c.name} Wild Rift stats & build — patch ${CURRENT_PATCH}`;
  const description = championDescription(c);
  return {
    title,
    description,
    alternates: { canonical: championPath(c.id) },
    openGraph: { title, description, url: championPath(c.id), type: "article" },
    twitter: { title, description },
  };
}

/** Stat rows for the growth table, in the order players read them. */
const GROWTH_ROWS: {
  key: keyof Champion["stats"];
  label: string;
  percent?: boolean;
}[] = [
  { key: "maxHealth", label: "Health" },
  { key: "healthRegen", label: "Health Regen" },
  { key: "mana", label: "Mana" },
  { key: "manaRegen", label: "Mana Regen" },
  { key: "attackDamage", label: "Attack Damage" },
  { key: "attackSpeed", label: "Attack Speed" },
  { key: "armor", label: "Armor" },
  { key: "magicResist", label: "Magic Resist" },
];

function round(n: number): string {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2).replace(/0$/, "");
}

const KIND_LABEL: Record<string, string> = {
  optimal: "Optimal build",
  damage: "Max damage build",
  fun: "For fun",
};

/**
 * Deep link that opens the calculator with this build already loaded. Mirrors
 * `encodeBuild`'s param names rather than importing it — that function takes
 * the full client `BuildState`, which a server component has no business
 * constructing.
 */
function buildHref(championId: string, items: string[], boots?: string): string {
  const p = new URLSearchParams({ c: championId, lvl: String(MAX_LEVEL) });
  if (items.length) p.set("i", items.join(","));
  if (boots) p.set("b", boots);
  return `/?${p.toString()}`;
}

export default async function ChampionPage({ params }: Props) {
  const { slug } = await params;
  const c = getChampion(slug);
  if (!c) notFound();

  // computeBuild with no items gives the champion's own totals AND resolves
  // attack speed properly. `championBaseAtLevel().attackSpeed` is the *bonus
  // ratio* (+47%), not attacks/sec — reading it as a final value understates
  // level 15 as lower than level 1.
  // Covers every stat the base-stats table renders (the growth rows plus the
  // flat move-speed row), so the "last changed" line under it speaks for the
  // whole table instead of whichever single row we happened to sample.
  const baseStatPatch = latestProvenanceStamp(c.provenance, [
    ...GROWTH_ROWS.map((r) => r.key),
    "moveSpeed",
  ]);

  const at1 = computeBuild(c, 1, []);
  const at15 = computeBuild(c, MAX_LEVEL, []);
  const lvl1 = at1.stats;
  const lvl15 = at15.stats;
  const rows15 = statRows(lvl15, at15.attackSpeed);

  // Optimal first, then damage, then the meme build — the order a reader wants.
  const kindOrder = { optimal: 0, damage: 1, fun: 2 } as const;
  const builds = [...getBuilds(c.id)].sort(
    (a, b) => kindOrder[a.kind] - kindOrder[b.kind],
  );

  return (
    <PageShell
      breadcrumb={[
        { name: "Home", href: "/" },
        { name: "Champions", href: "/champions" },
        { name: c.name },
      ]}
    >
      <JsonLd
        data={referenceLd({
          name: c.name,
          path: championPath(c.id),
          description: championDescription(c),
          image: c.icon ? championIconUrl(c.icon) : undefined,
        })}
      />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Champions", path: "/champions" },
          { name: c.name, path: championPath(c.id) },
        ])}
      />

      <div className="flex flex-wrap items-center gap-4">
        {c.icon && (
          // eslint-disable-next-line @next/next/no-img-element -- Data Dragon
          // portraits are remote and fixed-size; next/image would add a proxy
          // hop and config surface for no benefit on a static page.
          <img
            src={championIconUrl(c.icon)}
            alt={`${c.name} portrait`}
            width={72}
            height={72}
            className="rounded border border-white/10"
          />
        )}
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">{c.name}</h1>
          {c.title && <p className="text-sm text-[#8b8f9a]">{c.title}</p>}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {c.roles.map((r) => (
          <span key={r} className="rounded border border-white/10 px-2.5 py-1 font-mono text-[11px] tracking-wider text-[#8b8f9a]">
            {r.toUpperCase()}
          </span>
        ))}
        <span className="rounded border border-white/10 px-2.5 py-1 font-mono text-[11px] tracking-wider text-[#8b8f9a]">
          {c.resourceType.toUpperCase()}
        </span>
      </div>

      <p className="mt-5 max-w-3xl text-sm leading-relaxed text-[#b6bac2]">
        {c.name}
        {c.title ? `, ${c.title},` : ""} is a {c.roles.join(" / ").toLowerCase()} in League of
        Legends: Wild Rift. The stats below are Wild Rift values for patch{" "}
        <strong className="text-[#f5f6f8]">{CURRENT_PATCH}</strong> — they differ from PC League and
        are taken from Riot&apos;s Wild Rift patch notes.
      </p>

      {/* ── Base + growth ─────────────────────────────────────────────── */}
      <h2 className="mt-10 text-xl font-bold">Base stats and growth</h2>
      <p className="mt-2 text-sm text-[#8b8f9a]">
        Wild Rift champions scale linearly from level 1 to {MAX_LEVEL}.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/15 text-left font-mono text-[11px] tracking-wider text-[#8b8f9a]">
              <th className="py-2 pr-4 font-normal">STAT</th>
              <th className="py-2 pr-4 font-normal">LEVEL 1</th>
              <th className="py-2 pr-4 font-normal">PER LEVEL</th>
              <th className="py-2 font-normal">LEVEL {MAX_LEVEL}</th>
            </tr>
          </thead>
          <tbody>
            {GROWTH_ROWS.map(({ key, label }) => {
              const g = c.stats[key] as { base: number; perLevel: number } | undefined;
              if (!g) return null;
              // Attack speed is the exception: `perLevel` is a bonus *ratio*,
              // so it's shown as a percentage and the level-15 figure is the
              // engine's resolved attacks/sec, not base + growth.
              const isAS = key === "attackSpeed";
              const perLevel = g.perLevel
                ? isAS
                  ? `+${(g.perLevel * 100).toFixed(1)}%`
                  : `+${round(g.perLevel)}`
                : "—";
              const finalValue = isAS ? at15.attackSpeed : g.base + g.perLevel * (MAX_LEVEL - 1);
              return (
                <tr key={String(key)} className="border-b border-white/5">
                  <td className="py-2 pr-4 text-[#b6bac2]">
                    {label}
                    {isAS && <span className="ml-1.5 text-[#8b8f9a]">(attacks/sec)</span>}
                  </td>
                  <td className="py-2 pr-4 font-mono">{round(g.base)}</td>
                  <td className="py-2 pr-4 font-mono text-[#8b8f9a]">{perLevel}</td>
                  <td className="py-2 font-mono font-semibold">{round(finalValue)}</td>
                </tr>
              );
            })}
            <tr className="border-b border-white/5">
              <td className="py-2 pr-4 text-[#b6bac2]">Move Speed</td>
              <td className="py-2 pr-4 font-mono">{round(c.stats.moveSpeed)}</td>
              <td className="py-2 pr-4 font-mono text-[#8b8f9a]">—</td>
              <td className="py-2 font-mono font-semibold">{round(c.stats.moveSpeed)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 font-mono text-[11px] tracking-wider text-[#8b8f9a]">
        {/* Summarises the WHOLE table, so it has to consider every base-stat key
            — keying off maxHealth alone reported "no change" for a champion
            whose armor moved this patch. Unstamped values are carried forward,
            not changed, so they get the weaker wording. See provenanceFor. */}
        {baseStatPatch
          ? `BASE STATS LAST CHANGED: PATCH ${baseStatPatch}`
          : `BASE STATS: NO CHANGE ON RECORD — ACCURATE AS OF PATCH ${CURRENT_PATCH}`}
      </p>

      {/* ── Level 15 summary ──────────────────────────────────────────── */}
      <h2 className="mt-10 text-xl font-bold">
        {c.name} at level {MAX_LEVEL} (no items)
      </h2>
      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {rows15.map((r) => (
          <li key={r.key} className="rounded border border-white/10 px-3 py-2">
            <div className="font-mono text-[10px] tracking-wider text-[#8b8f9a]">
              {r.label.toUpperCase()}
            </div>
            <div className="font-mono text-lg font-semibold">{r.display}</div>
          </li>
        ))}
      </ul>

      {/* ── Builds ────────────────────────────────────────────────────── */}
      {builds.length > 0 && (
        <>
          <h2 className="mt-10 text-xl font-bold">{c.name} builds</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#b6bac2]">
            Three item sets for {c.name} on patch {CURRENT_PATCH}. Open any of them
            in the calculator to see full totals and swap items.
          </p>
          <div className="mt-4 space-y-4">
            {builds.map((b) => {
              const itemObjs = b.items.flatMap((id) => {
                const it = getItem(id);
                return it ? [it] : [];
              });
              const bootsObj = b.boots ? getItem(b.boots) : undefined;
              const gold =
                itemObjs.reduce((sum, i) => sum + i.cost, 0) + (bootsObj?.cost ?? 0);
              return (
                <article key={b.id} className="rounded border border-white/10 p-4">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="rounded bg-[#ff6b1a]/15 px-2 py-0.5 font-mono text-[11px] font-bold tracking-wider text-[#ff6b1a]">
                      {KIND_LABEL[b.kind].toUpperCase()}
                    </span>
                    <h3 className="font-semibold">{b.name}</h3>
                    <span className="font-mono text-[10px] tracking-wider text-[#8b8f9a]">
                      {formatGold(gold)} G · {b.archetype.toUpperCase()}
                    </span>
                  </div>
                  {b.description && (
                    <p className="mt-2 text-sm leading-relaxed text-[#b6bac2]">
                      {b.description}
                    </p>
                  )}
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {[...itemObjs, ...(bootsObj ? [bootsObj] : [])].map((i) => (
                      <li key={i.id}>
                        <Link
                          href={`/items/${i.id}`}
                          className="inline-block rounded border border-white/10 px-2 py-1 text-xs text-[#f5f6f8] hover:border-[#ff6b1a]/50"
                        >
                          {i.name}{" "}
                          <span className="font-mono text-[10px] text-[#8b8f9a]">
                            {formatGold(i.cost)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <Link
                      href={buildHref(c.id, b.items, b.boots)}
                      className="font-mono text-[11px] tracking-wider text-[#ff6b1a] hover:underline"
                    >
                      OPEN IN CALCULATOR →
                    </Link>
                    {/* Accuracy is this project's whole value proposition, so a
                        generated build must say so where the reader sees it —
                        not only in the JSON. */}
                    {b.generated ? (
                      <span className="font-mono text-[10px] tracking-wider text-[#8b8f9a]">
                        AUTO-GENERATED PLACEHOLDER — NOT SOURCE-VERIFIED
                      </span>
                    ) : b.source ? (
                      <a
                        href={b.source}
                        rel="nofollow noopener"
                        target="_blank"
                        className="font-mono text-[10px] tracking-wider text-[#8b8f9a] hover:underline"
                      >
                        SOURCE ↗
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      {/* ── Abilities ─────────────────────────────────────────────────── */}
      {c.abilities.length > 0 && (
        <>
          <h2 className="mt-10 text-xl font-bold">{c.name} abilities</h2>
          <div className="mt-4 space-y-3">
            {c.abilities.map((a) => (
              <article key={a.slot} className="rounded border border-white/10 p-4">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="rounded bg-[#ff6b1a]/15 px-2 py-0.5 font-mono text-[11px] font-bold tracking-wider text-[#ff6b1a]">
                    {a.slot.toUpperCase()}
                  </span>
                  <h3 className="font-semibold">{a.name}</h3>
                  {a.damageType !== "none" && (
                    <span className="font-mono text-[10px] tracking-wider text-[#8b8f9a]">
                      {a.damageType.toUpperCase()}
                    </span>
                  )}
                </div>
                {a.description && (
                  <p className="mt-2 text-sm leading-relaxed text-[#b6bac2]">{a.description}</p>
                )}
                <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] text-[#8b8f9a]">
                  {a.baseDamage.length > 0 && (
                    <div className="flex gap-2">
                      <dt>DAMAGE</dt>
                      <dd className="text-[#f5f6f8]">{a.baseDamage.join(" / ")}</dd>
                    </div>
                  )}
                  {a.cooldown.length > 0 && (
                    <div className="flex gap-2">
                      <dt>COOLDOWN</dt>
                      <dd className="text-[#f5f6f8]">{a.cooldown.join(" / ")}s</dd>
                    </div>
                  )}
                  {a.scalings.map((s) => (
                    <div key={s.stat} className="flex gap-2">
                      <dt>RATIO</dt>
                      <dd className="text-[#f5f6f8]">
                        {Math.round(s.ratio * 100)}% {s.stat}
                      </dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        </>
      )}

      <p className="mt-10 text-sm text-[#8b8f9a]">
        {/* `c` is the champion param used by encodeBuild/decodeBuild in
            src/state/buildState.ts — not `champion`. */}
        <Link
          href={`/?c=${c.id}&lvl=15`}
          className="text-[#ff6b1a] underline underline-offset-4"
        >
          Build {c.name} in the calculator
        </Link>{" "}
        to stack items and see live totals, or{" "}
        <Link href="/items" className="text-[#ff6b1a] underline underline-offset-4">
          browse all items
        </Link>
        .
      </p>

      <p className="mt-4 font-mono text-[11px] tracking-wider text-[#8b8f9a]">
        LEVEL 1 HEALTH {round(lvl1.maxHealth ?? 0)} · LEVEL {MAX_LEVEL} HEALTH{" "}
        {round(lvl15.maxHealth ?? 0)}
      </p>
    </PageShell>
  );
}
