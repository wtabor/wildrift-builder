import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { items, getItem, CURRENT_PATCH, provenanceFor, hasProvenanceStamp } from "@/lib/data";
import { goldEfficiency } from "@/lib/stats/engine";
import { itemStatLines } from "@/lib/statDisplay";
import { formatGold } from "@/lib/format";
import { itemIconUrl } from "@/lib/visual";
import { breadcrumbLd, itemDescription, itemPath, referenceLd } from "@/lib/seo";
import { JsonLd, PageShell } from "@/app/_components/PageShell";

export function generateStaticParams() {
  return items.map((i) => ({ slug: i.id }));
}

export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = getItem(slug);
  if (!item) return {};
  const title = `${item.name} — Wild Rift stats, cost & passives (patch ${CURRENT_PATCH})`;
  const description = itemDescription(item);
  return {
    title,
    description,
    alternates: { canonical: itemPath(item.id) },
    openGraph: { title, description, url: itemPath(item.id), type: "article" },
    twitter: { title, description },
  };
}

export default async function ItemPage({ params }: Props) {
  const { slug } = await params;
  const item = getItem(slug);
  if (!item) notFound();

  const lines = itemStatLines(item);
  const eff = goldEfficiency(item);
  const base = item.upgradesFrom ? getItem(item.upgradesFrom) : undefined;
  // Peers in the same exclusivity group — genuinely useful ("what can't I pair
  // this with?") and strong internal linking between related items.
  const exclusiveWith = item.exclusiveGroup
    ? items.filter((i) => i.id !== item.id && i.exclusiveGroup === item.exclusiveGroup)
    : [];
  const upgradesInto = items.find((i) => i.upgradesFrom === item.id);

  return (
    <PageShell
      breadcrumb={[
        { name: "Home", href: "/" },
        { name: "Items", href: "/items" },
        { name: item.name },
      ]}
    >
      <JsonLd
        data={referenceLd({
          name: item.name,
          path: itemPath(item.id),
          description: itemDescription(item),
          image: item.icon ? itemIconUrl(item.icon) : undefined,
        })}
      />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Items", path: "/items" },
          { name: item.name, path: itemPath(item.id) },
        ])}
      />

      <div className="flex flex-wrap items-center gap-4">
        {item.icon && (
          // eslint-disable-next-line @next/next/no-img-element -- see champion page
          <img
            src={itemIconUrl(item.icon)}
            alt={`${item.name} icon`}
            width={64}
            height={64}
            className="rounded border border-white/10"
          />
        )}
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">{item.name}</h1>
          <p className="font-mono text-sm text-[#ff6b1a]">
            {formatGold(item.cost)} gold
            <span className="ml-2 text-[#8b8f9a]">
              ({hasProvenanceStamp(item.provenance, "cost")
                ? "last changed"
                : "no change on record — accurate as of"}
              : patch {provenanceFor(item.provenance, "cost")})
            </span>
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {item.tags.map((t) => (
          <span key={t} className="rounded border border-white/10 px-2.5 py-1 font-mono text-[11px] tracking-wider text-[#8b8f9a]">
            {t.toUpperCase()}
          </span>
        ))}
        <span className="rounded border border-white/10 px-2.5 py-1 font-mono text-[11px] tracking-wider text-[#8b8f9a]">
          {item.slot.toUpperCase()}
        </span>
      </div>

      <p className="mt-5 max-w-3xl text-sm leading-relaxed text-[#b6bac2]">
        {item.name} costs <strong className="text-[#f5f6f8]">{formatGold(item.cost)} gold</strong> in
        League of Legends: Wild Rift on patch{" "}
        <strong className="text-[#f5f6f8]">{CURRENT_PATCH}</strong>. Wild Rift item stats and prices
        differ from PC League — every value here is a Wild Rift value.
      </p>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      {lines.length > 0 && (
        <>
          <h2 className="mt-10 text-xl font-bold">{item.name} stats</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[24rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/15 text-left font-mono text-[11px] tracking-wider text-[#8b8f9a]">
                  <th className="py-2 pr-4 font-normal">STAT</th>
                  <th className="py-2 pr-4 font-normal">VALUE</th>
                  <th className="py-2 font-normal">LAST CHANGED</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.key} className="border-b border-white/5">
                    <td className="py-2 pr-4 text-[#b6bac2]">{l.label}</td>
                    <td className="py-2 pr-4 font-mono font-semibold">+{l.display}</td>
                    {/* Only an explicit stamp records a change; the baseline
                        fallback just means "carried forward unchanged". */}
                    <td className="py-2 font-mono text-[#8b8f9a]">
                      {hasProvenanceStamp(item.provenance, l.key) ? (
                        `patch ${provenanceFor(item.provenance, l.key)}`
                      ) : (
                        <span title={`No change on record — accurate as of patch ${provenanceFor(item.provenance, l.key)}`}>
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 font-mono text-[11px] tracking-wider text-[#8b8f9a]">
            — = NO CHANGE ON RECORD; THE VALUE IS CARRIED FORWARD AND ACCURATE AS OF PATCH{" "}
            {CURRENT_PATCH}
          </p>
        </>
      )}

      {/* ── Gold efficiency ───────────────────────────────────────────── */}
      <h2 className="mt-10 text-xl font-bold">Gold efficiency</h2>
      {eff !== null ? (
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#b6bac2]">
          <strong className="text-[#f5f6f8]">{Math.round(eff * 100)}%</strong> — the raw stat value
          of {item.name} against its {formatGold(item.cost)} gold cost, before counting passives.
          Above 100% means the stat line alone is worth more than the price.
        </p>
      ) : (
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#b6bac2]">
          Not applicable. {item.name}{" "}
          {item.upgradesFrom
            ? "cannot be bought — it is a transformation, and its stat line includes mana stacked in play rather than paid for, so pricing it against a gold cost would invent a number."
            : "has no stats that map to a standard gold value."}
        </p>
      )}

      {/* ── Passives ──────────────────────────────────────────────────── */}
      {item.effects.length > 0 && (
        <>
          <h2 className="mt-10 text-xl font-bold">Passives and actives</h2>
          <div className="mt-4 space-y-3">
            {item.effects.map((e) => (
              <article key={e.name} className="rounded border border-white/10 p-4">
                <div className="flex flex-wrap items-baseline gap-3">
                  <h3 className="font-semibold">{e.name}</h3>
                  <span className="font-mono text-[10px] tracking-wider text-[#8b8f9a]">
                    {e.kind.toUpperCase()}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#b6bac2]">{e.description}</p>
              </article>
            ))}
          </div>
        </>
      )}

      {/* ── Relationships ─────────────────────────────────────────────── */}
      {(base || upgradesInto || exclusiveWith.length > 0) && (
        <>
          <h2 className="mt-10 text-xl font-bold">Build path and restrictions</h2>
          <ul className="mt-4 space-y-2 text-sm text-[#b6bac2]">
            {base && (
              <li>
                Upgrades from{" "}
                <Link href={itemPath(base.id)} className="text-[#ff6b1a] underline underline-offset-4">
                  {base.name}
                </Link>{" "}
                — it transforms automatically and cannot be purchased directly.
              </li>
            )}
            {upgradesInto && (
              <li>
                Transforms into{" "}
                <Link
                  href={itemPath(upgradesInto.id)}
                  className="text-[#ff6b1a] underline underline-offset-4"
                >
                  {upgradesInto.name}
                </Link>
                .
              </li>
            )}
            {exclusiveWith.length > 0 && (
              <li>
                Cannot be held together with{" "}
                {exclusiveWith.map((i, idx) => (
                  <span key={i.id}>
                    {idx > 0 && (idx === exclusiveWith.length - 1 ? " or " : ", ")}
                    <Link href={itemPath(i.id)} className="text-[#ff6b1a] underline underline-offset-4">
                      {i.name}
                    </Link>
                  </span>
                ))}
                . The game allows only one item from this group at a time.
              </li>
            )}
          </ul>
        </>
      )}

      <p className="mt-10 text-sm text-[#8b8f9a]">
        <Link href="/" className="text-[#ff6b1a] underline underline-offset-4">
          Add {item.name} to a build
        </Link>{" "}
        in the calculator, or{" "}
        <Link href="/items" className="text-[#ff6b1a] underline underline-offset-4">
          browse all {items.length} items
        </Link>
        .
      </p>
    </PageShell>
  );
}
