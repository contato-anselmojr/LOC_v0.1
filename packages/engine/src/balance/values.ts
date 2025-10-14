export type ElementColor = "BLUE" | "RED" | "GREEN" | "WHITE" | "BLACK";

export interface SkillBalance {
  name: string;
  type: "DAMAGE" | "SHIELD" | "HEAL" | "STUN" | "SILENCE" | "DOT" | "HOT";
  value?: number;
  cooldown: number;
  duration?: number;
  cost: Partial<Record<ElementColor, number>>;
}

export interface CharacterBalance {
  id: "A" | "B" | "C" | "D" | "E" | "F";
  active: [SkillBalance, SkillBalance, SkillBalance, SkillBalance];
  passive?: { name: string; note?: string };
}

export const BALANCE_V1: CharacterBalance[] = [
  { id: "A", active: [
    { name: "A1 Slash", type: "DAMAGE", value: 80, cooldown: 2, cost: { RED: 2 } },
    { name: "A2 Guard", type: "SHIELD", value: 70, cooldown: 3, cost: { BLUE: 2 } },
    { name: "A3 Stun", type: "STUN", cooldown: 3, duration: 1, cost: { WHITE: 2 } },
    { name: "A4 Ignite", type: "DOT", value: 20, cooldown: 4, duration: 3, cost: { RED: 2, GREEN: 1 } },
  ], passive: { name: "A-Passiva", note: "placeholder" } },
  { id: "B", active: [
    { name: "B1 Shot", type: "DAMAGE", value: 80, cooldown: 2, cost: { RED: 1, GREEN: 1 } },
    { name: "B2 Silence", type: "SILENCE", cooldown: 3, duration: 1, cost: { WHITE: 2 } },
    { name: "B3 Barrier", type: "SHIELD", value: 70, cooldown: 3, cost: { BLUE: 2 } },
    { name: "B4 Regen", type: "HOT", value: 20, cooldown: 4, duration: 3, cost: { GREEN: 2 } },
  ], passive: { name: "B-Passiva", note: "placeholder" } },
  { id: "C", active: [
    { name: "C1 Heal", type: "HEAL", value: 60, cooldown: 2, cost: { GREEN: 2 } },
    { name: "C2 Smite", type: "DAMAGE", value: 80, cooldown: 2, cost: { WHITE: 2 } },
    { name: "C3 Cleanse", type: "HEAL", value: 40, cooldown: 3, cost: { WHITE: 1, GREEN: 1 } },
    { name: "C4 Stun", type: "STUN", cooldown: 3, duration: 1, cost: { BLUE: 1, WHITE: 1 } },
  ], passive: { name: "C-Passiva", note: "placeholder" } },
  { id: "D", active: [
    { name: "D1 Pierce", type: "DAMAGE", value: 90, cooldown: 3, cost: { RED: 2, WHITE: 1 } },
    { name: "D2 Fortify", type: "SHIELD", value: 80, cooldown: 4, cost: { BLUE: 2, WHITE: 1 } },
    { name: "D3 Burn", type: "DOT", value: 20, cooldown: 4, duration: 3, cost: { RED: 2 } },
    { name: "D4 Silence", type: "SILENCE", cooldown: 3, duration: 1, cost: { WHITE: 2 } },
  ], passive: { name: "D-Passiva", note: "placeholder" } },
  { id: "E", active: [
    { name: "E1 Bolt", type: "DAMAGE", value: 80, cooldown: 2, cost: { BLUE: 2 } },
    { name: "E2 Aegis", type: "SHIELD", value: 70, cooldown: 3, cost: { BLUE: 1, WHITE: 1 } },
    { name: "E3 Rejuvenate", type: "HOT", value: 20, cooldown: 4, duration: 3, cost: { GREEN: 2 } },
    { name: "E4 Smite", type: "DAMAGE", value: 80, cooldown: 2, cost: { WHITE: 2 } },
  ], passive: { name: "E-Passiva", note: "placeholder" } },
  { id: "F", active: [
    { name: "F1 Strike", type: "DAMAGE", value: 80, cooldown: 2, cost: { RED: 2 } },
    { name: "F2 Ward", type: "SHIELD", value: 70, cooldown: 3, cost: { BLUE: 2 } },
    { name: "F3 Heal", type: "HEAL", value: 60, cooldown: 2, cost: { GREEN: 2 } },
    { name: "F4 Suppress", type: "SILENCE", cooldown: 3, duration: 1, cost: { WHITE: 2 } },
  ], passive: { name: "F-Passiva", note: "placeholder" } },
];

export const BALANCE_BY_CHAR: Record<string, CharacterBalance> =
  Object.fromEntries(BALANCE_V1.map(c => [c.id, c]));
