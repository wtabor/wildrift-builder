import { describe, it, expect } from "vitest";
import { z } from "zod";
import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  rawAbilityDamage,
  abilityAmount,
  mitigatedAbilityDamage,
  type DamageContext,
  type TargetContext,
} from "../src/lib/damage/engine";
import { AbilitySchema, ChampionsFileSchema } from "../src/lib/schema";
import type { Ability } from "../src/lib/schema";

/*
 * These pin the ability-schema extension that ended the "PARTIAL roll" problem.
 *
 * Riot balances through levers the schema could not express — shields, heals,
 * ability costs, target-relative damage, level-scaled passives — so 7.2a landed
 * 4 of 18 documented changes and 7.2b 15 of 24. The rest were dropped. Each
 * describe() block below corresponds to one capability that was blocking real,
 * recorded changes, and asserts both that the value round-trips through the
 * schema and that the engine reads it with the right meaning.
 */

const CTX: DamageContext = { attacker: { attackDamage: 200, abilityPower: 300, maxHealth: 2000 }, level: 15, abilityRank: 4 };
const TARGET: TargetContext = { armor: 0, magicResist: 0, maxHealth: 3000, currentHealth: 1200 };

/*
 * Typed against the schema's INPUT, not its output: post-parse, `byRank` and
 * `scalings` are required (they have defaults), so an output-typed helper would
 * force every fixture to spell out fields the schema is meant to fill in.
 */
function ability(partial: z.input<typeof AbilitySchema>): Ability {
  return AbilitySchema.parse(partial);
}

describe("frozen snapshots stay valid", () => {
  /*
   * The load-bearing back-compat guarantee. Every patch directory — including
   * the frozen 7.1/7.2/7.2a snapshots that nobody will ever re-transcribe — is
   * parsed by the SAME schema. Every new field is `.optional()` for this reason;
   * a single required field would break ~700 ability records at once.
   */
  it("parses every champions.json under data/patches with the extended schema", () => {
    const patchesDir = join(__dirname, "..", "data", "patches");
    const dirs = readdirSync(patchesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    expect(dirs.length).toBeGreaterThan(1); // there are frozen snapshots to protect

    for (const dir of dirs) {
      const file = join(patchesDir, dir, "champions.json");
      if (!existsSync(file)) continue;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const raw = require(file);
      expect(() => ChampionsFileSchema.parse(raw), `patch ${dir}`).not.toThrow();
    }
  });

  it("treats an absent optional field as unknown, never as zero", () => {
    // The distinction that makes `.optional()` right and `.default()` wrong:
    // "nobody transcribed this yet" must not read as "this ability is free".
    const a = ability({ slot: "Q", name: "Untranscribed" });
    expect(a.cost).toBeUndefined();
    expect(a.heal).toBeUndefined();
    expect(a.shield).toBeUndefined();
    expect(a.grants).toBeUndefined();
    expect(a.damageReduction).toBeUndefined();
  });
});

describe("ability resource cost", () => {
  // Blocked: Yuumi E 80/90/100/110 -> 65/75/85/95 (7.2a); Kayle Q (7.2b).
  it("round-trips a per-rank cost array", () => {
    const a = ability({ slot: "E", name: "Zoomies", cost: [65, 75, 85, 95] });
    expect(a.cost).toEqual([65, 75, 85, 95]);
  });

  it("does not contribute to damage", () => {
    const withCost = ability({ slot: "Q", name: "Q", baseDamage: [100], cost: [50] });
    const without = ability({ slot: "Q", name: "Q", baseDamage: [100] });
    expect(rawAbilityDamage(withCost, CTX)).toBe(rawAbilityDamage(without, CTX));
  });
});

describe("heals and shields", () => {
  // The single biggest unlock: 6 recorded changes across Skarner W, Senna R,
  // Yuumi R, Sona W, Kayle W, Lee Sin W.
  it("resolves a per-rank shield with an AP ratio", () => {
    const a = ability({
      slot: "W",
      name: "Safeguard",
      shield: { byRank: [100, 160, 220, 280], scalings: [{ stat: "abilityPower", ratio: 0.5 }] },
    });
    // rank 4 => 280 + 300 AP * 0.5 = 430
    expect(abilityAmount(a.shield!, CTX)).toBeCloseTo(430);
  });

  it("resolves a heal that scales on champion level rather than rank", () => {
    const a = ability({ slot: "R", name: "Final Chapter", heal: { byLevel: [20, 50] } });
    expect(abilityAmount(a.heal!, { ...CTX, level: 1 })).toBeCloseTo(20);
    expect(abilityAmount(a.heal!, { ...CTX, level: 15 })).toBeCloseTo(50);
    expect(abilityAmount(a.heal!, { ...CTX, level: 8 })).toBeCloseTo(35);
  });

  it("keeps a heal out of the damage path", () => {
    // A heal expressed as damage would be added to outgoing damage — the exact
    // mis-encoding this field exists to prevent.
    const a = ability({ slot: "W", name: "Aria", heal: { byRank: [35, 50, 65, 80] } });
    expect(rawAbilityDamage(a, CTX)).toBe(0);
  });
});

describe("target-relative scaling", () => {
  /*
   * "6% of the target's maximum health" and "6% of my own maximum health" are
   * wildly different numbers. Before this, the only way to store the former was
   * against an attacker stat, where it silently computed the caster's health.
   */
  it("scales off the target's maximum health, not the attacker's", () => {
    const a = ability({
      slot: "E",
      name: "Crunch",
      scalings: [{ stat: "targetMaxHealth", ratio: 0.06 }],
    });
    expect(rawAbilityDamage(a, CTX, TARGET)).toBeCloseTo(3000 * 0.06); // 180, not 2000 * 0.06 = 120
  });

  it("distinguishes current from missing health", () => {
    const current = ability({ slot: "passive", name: "Absolution", scalings: [{ stat: "targetCurrentHealth", ratio: 0.1 }] });
    const missing = ability({ slot: "W", name: "Convergence", scalings: [{ stat: "targetMissingHealth", ratio: 0.1 }] });
    expect(rawAbilityDamage(current, CTX, TARGET)).toBeCloseTo(120); // 1200 * 0.1
    expect(rawAbilityDamage(missing, CTX, TARGET)).toBeCloseTo(180); // (3000-1200) * 0.1
  });

  it("defaults current health to full when the target does not specify it", () => {
    const a = ability({ slot: "Q", name: "Q", scalings: [{ stat: "targetCurrentHealth", ratio: 0.1 }] });
    expect(rawAbilityDamage(a, CTX, { armor: 0, magicResist: 0, maxHealth: 3000 })).toBeCloseTo(300);
  });

  it("contributes nothing when no target is supplied rather than guessing one", () => {
    const a = ability({ slot: "Q", name: "Q", baseDamage: [100], scalings: [{ stat: "targetMaxHealth", ratio: 0.5 }] });
    expect(rawAbilityDamage(a, CTX)).toBe(100);
  });

  it("passes the target through mitigation", () => {
    const a = ability({ slot: "E", name: "Crunch", damageType: "physical", scalings: [{ stat: "targetMaxHealth", ratio: 0.06 }] });
    // Zero armor on TARGET, so mitigation is identity and the target-relative
    // term must survive the call rather than being dropped en route.
    expect(mitigatedAbilityDamage(a, CTX, TARGET)).toBeCloseTo(180);
  });
});

describe("level-interpolated base damage", () => {
  // 133 of 140 passives are level-scaled and had no home: passives have no
  // ranks, so a per-rank array cannot express them.
  it("interpolates from level 1 to 15 and ignores rank", () => {
    const a = ability({ slot: "passive", name: "Hemorrhage", baseDamageByLevel: [10, 150] });
    expect(rawAbilityDamage(a, { ...CTX, level: 1 })).toBeCloseTo(10);
    expect(rawAbilityDamage(a, { ...CTX, level: 15 })).toBeCloseTo(150);
    expect(rawAbilityDamage(a, { ...CTX, level: 8, abilityRank: 1 })).toBeCloseTo(80);
  });
});

describe("ability-granted stats and damage reduction", () => {
  it("round-trips granted stats using the existing stat vocabulary", () => {
    const a = ability({ slot: "R", name: "Aspect of the Cougar", grants: { armor: 30, magicResist: 30, moveSpeedPercent: 0.1 } });
    expect(a.grants).toEqual({ armor: 30, magicResist: 30, moveSpeedPercent: 0.1 });
  });

  it("round-trips per-rank damage reduction", () => {
    const a = ability({ slot: "R", name: "Public Execution", damageReduction: [0.1, 0.2, 0.3] });
    expect(a.damageReduction).toEqual([0.1, 0.2, 0.3]);
  });

  it("does not fold granted stats into damage", () => {
    // `grants` is situational — active only while the ability is. It must never
    // reach computeBuild's standing totals, and it must not inflate damage.
    const withGrants = ability({ slot: "Q", name: "Q", baseDamage: [100], grants: { attackDamage: 500 } });
    const without = ability({ slot: "Q", name: "Q", baseDamage: [100] });
    expect(rawAbilityDamage(withGrants, CTX)).toBe(rawAbilityDamage(without, CTX));
  });
});
