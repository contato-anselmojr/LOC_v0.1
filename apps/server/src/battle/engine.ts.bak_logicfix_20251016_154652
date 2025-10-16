import type { BattleState, PlayerState, CharacterState } from "./types";

// === Criação de Batalha ===
export function initBattle(id: string): BattleState {
  const makeChar = (id: string, name: string, role: string): CharacterState => ({
    id,
    name,
    role,
    hp: 100,
    maxHp: 100,
    alive: true,
    cooldowns: {},
    skills: [
      { id: "strike", name: "Golpe", kind: "attack", cost: { B: 1 }, power: 25 },
      { id: "fireball", name: "Fireball", kind: "attack", cost: { R: 2 }, power: 40 },
      { id: "heal", name: "Cura", kind: "heal", cost: { G: 1 }, power: 20 },
      { id: "shield", name: "Escudo", kind: "shield", cost: { Y: 1 }, power: 0 },
    ],
  });

  const state: BattleState = {
    id,
    status: "active",
    turn: 1,
    currentPlayerId: "P1",
    players: [
      { id: "P1", name: "Jogador 1", characters: [
        makeChar("p1c1", "Raven", "assassino"),
        makeChar("p1c2", "Boreal", "tank"),
        makeChar("p1c3", "Lyra", "mago"),
      ]},
      { id: "P2", name: "Jogador 2", characters: [
        makeChar("p2c1", "Kai", "adc"),
        makeChar("p2c2", "Nox", "assassino"),
        makeChar("p2c3", "Oris", "mago"),
      ]},
    ],
    energy: {
      P1: { B: 0, R: 0, G: 0, Y: 0 },
      P2: { B: 0, R: 0, G: 0, Y: 0 },
    },
  };

  return state;
}

// === Ganha energia aleatória ===
export function grantRandomEnergy(pool: Record<string, number>, amount: number) {
  const colors = ["B", "R", "G", "Y"];
  for (let i = 0; i < amount; i++) {
    const c = colors[Math.floor(Math.random() * colors.length)];
    pool[c] = (pool[c] ?? 0) + 1;
  }
}

// (placeholders para manter compatibilidade)
export async function declareAction(battle: any, act: any) {
  return { ok: true, type: "none" };
}
export async function passTurn(battle: any) {
  return battle;
}
