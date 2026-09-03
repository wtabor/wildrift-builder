import { describe, it, expect } from "vitest";
import {
  CURRENT_PATCH,
  champions,
  getPatchInfo,
  hasProvenanceStamp,
  items,
  latestProvenanceStamp,
  provenanceFor,
} from "@/lib/data";
import { formatPatchDate } from "@/lib/format";

describe("provenanceFor", () => {
  it("falls back to the baseline patch when no stamp exists", () => {
    expect(provenanceFor(undefined, "cost")).toBe(CURRENT_PATCH);
    expect(provenanceFor({}, "attackDamage")).toBe(CURRENT_PATCH);
    expect(provenanceFor({ cost: "7.1g" }, "attackDamage")).toBe(CURRENT_PATCH);
  });

  it("returns the explicit stamp when present", () => {
    expect(provenanceFor({ cost: "7.0" }, "cost")).toBe("7.0");
  });
});

describe("hasProvenanceStamp", () => {
  it("distinguishes an explicit stamp from the baseline fallback", () => {
    expect(hasProvenanceStamp({ cost: "7.0" }, "cost")).toBe(true);
    expect(hasProvenanceStamp({ cost: "7.0" }, "attackDamage")).toBe(false);
    expect(hasProvenanceStamp({}, "cost")).toBe(false);
    expect(hasProvenanceStamp(undefined, "cost")).toBe(false);
  });

  /*
   * The moat is accuracy, so an unstamped value must never be rendered as
   * "last changed in <CURRENT_PATCH>" — that converts silence into a freshness
   * claim. Stamps are sparse by design (most of the dataset carries none), so
   * this guard is what keeps a display-layer shortcut from quietly asserting
   * that the whole roster was re-verified this patch.
   */
  it("reports the baseline fallback for the sparse majority of the dataset", () => {
    const unstampedChampions = champions.filter(
      (c) => !hasProvenanceStamp(c.provenance, "maxHealth"),
    );
    expect(unstampedChampions.length).toBeGreaterThan(0);

    for (const c of unstampedChampions) {
      expect(provenanceFor(c.provenance, "maxHealth")).toBe(CURRENT_PATCH);
    }
  });

  it("agrees with the raw stamp map on every item cost", () => {
    for (const item of items) {
      expect(hasProvenanceStamp(item.provenance, "cost")).toBe(
        item.provenance?.cost !== undefined,
      );
    }
  });
});

describe("latestProvenanceStamp", () => {
  it("returns undefined when no key in the group is stamped", () => {
    expect(latestProvenanceStamp(undefined, ["armor", "maxHealth"])).toBeUndefined();
    expect(latestProvenanceStamp({}, ["armor"])).toBeUndefined();
    expect(latestProvenanceStamp({ cost: "7.2b" }, ["armor", "maxHealth"])).toBeUndefined();
  });

  /*
   * The whole point of the group form: a champion whose armor moved this patch
   * must not read as "no change on record" just because the representative key
   * we sampled (maxHealth) is unstamped.
   */
  it("finds a stamp on any key in the group", () => {
    expect(latestProvenanceStamp({ armor: "7.2b" }, ["maxHealth", "armor"])).toBe("7.2b");
  });

  it("picks the newest stamp by release date, not by string order", () => {
    // 7.1g (Jun 1) is newer than 7.1 (Apr 7) but sorts identically either way;
    // 7.2 (Jul 9) vs 7.1g is the case that separates date order from naive
    // lexical order on the leading component.
    expect(latestProvenanceStamp({ armor: "7.1g", maxHealth: "7.2" }, ["armor", "maxHealth"])).toBe(
      "7.2",
    );
    expect(latestProvenanceStamp({ armor: "7.2b", maxHealth: "7.1" }, ["armor", "maxHealth"])).toBe(
      "7.2b",
    );
  });

  it("prefers a registered version over one with no known date", () => {
    expect(latestProvenanceStamp({ armor: "9.9-unreleased", maxHealth: "7.2" }, ["armor", "maxHealth"])).toBe(
      "7.2",
    );
  });

  it("reports a real stamped champion across the base-stat group", () => {
    // Jayce's armor moved in 7.2b; his maxHealth never has.
    const jayce = champions.find((c) => c.id === "jayce");
    expect(jayce).toBeDefined();
    expect(hasProvenanceStamp(jayce!.provenance, "maxHealth")).toBe(false);
    expect(latestProvenanceStamp(jayce!.provenance, ["maxHealth", "armor", "attackDamage"])).toBe(
      "7.2b",
    );
  });
});

describe("getPatchInfo", () => {
  it("resolves a registered patch to date + url", () => {
    const info = getPatchInfo(CURRENT_PATCH);
    expect(info).toBeDefined();
    expect(info?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(info?.url).toContain("patch-notes");
  });

  it("returns undefined for unknown or missing versions", () => {
    expect(getPatchInfo(undefined)).toBeUndefined();
    expect(getPatchInfo("0.0")).toBeUndefined();
  });
});

describe("formatPatchDate", () => {
  it("formats ISO dates without timezone drift", () => {
    expect(formatPatchDate("2026-06-01")).toBe("Jun 1, 2026");
  });

  it("returns empty string for missing or invalid input", () => {
    expect(formatPatchDate(undefined)).toBe("");
    expect(formatPatchDate("not-a-date")).toBe("");
  });
});
