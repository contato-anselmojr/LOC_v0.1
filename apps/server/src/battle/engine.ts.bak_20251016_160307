/** Battle Engine — estável
 * - Sintaxe válida (corrige chaves quebradas)
 * - 1 ação por personagem/turno (controle via _usedChars)
 * - passTurn: alterna jogador e concede energia = vivos do próximo jogador
 */

export type Color = "B" | "R" | "G" | "Y";
export type Cost = Partial<Record<Color, number>>;

export type SkillKind = "attack" | "heal" | "buff" | "shield" | "control" | "damage";

export interface Skill {
  id: string;
  name: string;
  kind: SkillKind;
  cost: Cost;
  power: number;
}

export interface CharacterState {
  id: string;
  name: string;
  role: "adc" | "tank" | "mago" | "assassino";
  hp: number;
  maxHp: number;
  skills: Skill[];
  alive: boolean;
}

export interface PlayerState {
  id: string;
  name: string;
  characters: CharacterState[];
}

export type EnergyPool = Partial<Record<Color, number>>;

export interface BattleState {
  id: string;
  turn: number;
  currentPlayerId: string;
  players: PlayerState[];
  energy: Record<string, EnergyPool>;
  // campo interno para controle do turno atual (não persista se não quiser)
  _usedChars?: Set<string>;
}

export function findChar(battle: BattleState, playerId: string, charId: string): CharacterState | null {
  const p = battle.players.find(p => p.id === playerId);
  if (!p) return null;
  const c = p.characters.find(c => c.id === charId);
  return c ?? null;
}

export function canPay(pool: EnergyPool, cost: Cost): boolean {
  return Object.entries(cost ?? {}).every(([c, q]) => (pool[c as Color] ?? 0) >= (q ?? 0));
}

export function consumeEnergy(pool: EnergyPool, cost: Cost) {
  Object.entries(cost ?? {}).forEach(([c, q]) => {
    const k = c as Color;
    pool[k] = Math.max(0, (pool[k] ?? 0) - (q ?? 0));
  });
}

export function grantRandomEnergy(pool: EnergyPool, n = 1) {
  const colors: Color[] = ["B", "R", "G", "Y"];
  for (let i = 0; i < n; i++) {
    const c = colors[Math.floor(Math.random() * colors.length)];
    pool[c] = (pool[c] ?? 0) + 1;
  }
}

/** Aplica uma ação. Garante 1 ação por personagem por turno. */
export function declareAction(battle: BattleState, act: {
  source: { playerId: string; charId: string };
  target: { playerId: string; charId: string };
  skillId: string;
}) {
  const results: any[] = [];

  // trava: 1 ação por personagem por turno
  battle._usedChars = battle._usedChars || new Set<string>();
  const srcKey = `${act.source.playerId}:${act.source.charId}`;
  if (battle._usedChars.has(srcKey)) {
    results.push({ ok: false, reason: "Esse personagem já agiu neste turno!" });
    return results;
  }
  battle._usedChars.add(srcKey);

  // validações
  const src = findChar(battle, act.source.playerId, act.source.charId);
  const tgt = findChar(battle, act.target.playerId, act.target.charId);
  if (!src || !tgt || !src.alive || !tgt.alive) {
    results.push({ ok: false, reason: "Personagem inválido ou morto" });
    return results;
  }

  const skill = src.skills.find(s => s.id === act.skillId);
  if (!skill) {
    results.push({ ok: false, reason: "Skill inválida" });
    return results;
  }

  // regra de alvo (aliado vs inimigo)
  const friendly = act.source.playerId === act.target.playerId;
  const healingKinds: SkillKind[] = ["heal", "buff", "shield"];
  const offensiveKinds: SkillKind[] = ["attack", "control", "damage"];

  if (healingKinds.includes(skill.kind) && !friendly) {
    results.push({ ok: false, reason: "Skill de cura/buff só em aliados" });
    return results;
  }
  if (offensiveKinds.includes(skill.kind) && friendly) {
    results.push({ ok: false, reason: "Skill ofensiva só em inimigos" });
    return results;
  }

  // custo
  const pool = battle.energy[act.source.playerId] || {};
  if (!canPay(pool, skill.cost)) {
    results.push({ ok: false, reason: "Energia insuficiente" });
    return results;
  }
  consumeEnergy(pool, skill.cost);

  // efeito
  if (offensiveKinds.includes(skill.kind)) {
    tgt.hp = Math.max(0, tgt.hp - skill.power);
    if (tgt.hp === 0) tgt.alive = false;
    results.push({ ok: true, type: "damage", skill: skill.id, amount: skill.power, target: tgt.id });
  } else if (healingKinds.includes(skill.kind)) {
    // cura/buff/shield simples (cura no alvo)
    tgt.hp = Math.min(tgt.maxHp, tgt.hp + skill.power);
    results.push({ ok: true, type: "heal", skill: skill.id, amount: skill.power, target: tgt.id });
  } else {
    results.push({ ok: true, type: "none" });
  }

  return results.length ? results : [{ ok: true, type: "none" }];
}

/** Alterna jogador, incrementa turno e concede energia = nº de vivos do próximo jogador */
export function passTurn(battle: BattleState) {
  const current = battle.currentPlayerId;
  const next = battle.players.find(p => p.id !== current)?.id || current;

  // avança turno e alterna
  battle.turn += 1;
  battle.currentPlayerId = next;

  // reseta controle de ações por personagem
  battle._usedChars = new Set<string>();

  // concede energia ao próximo jogador (1 por personagem vivo)
  const nextPlayer = battle.players.find(p => p.id === next);
  const aliveCount = (nextPlayer?.characters || []).filter(c => c.alive).length;
  const pool = battle.energy[next] || (battle.energy[next] = {});
  for (let i = 0; i < aliveCount; i++) {
    grantRandomEnergy(pool, 1);
  }

  return battle;
}
