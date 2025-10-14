import { BASE_COLORS, ActiveSkill } from "../types/core";
import { BattleState, DEFAULT_TURN } from "../types/state";
import { RNG } from "../utils/rng";
import { clamp } from "../utils/math";

export type QueuedAction = {
  actorTeam: "A" | "B";
  actorId: string;
  skillId: string;
  target?: { team: "A" | "B"; id?: string };
};

type Eff = { kind:string; value?:number; duration:number; sourceId?:string; }

function hasEffect(effects: Eff[], kind: string) {
  return effects.some(e => e.kind === kind && e.duration > 0);
}
function isSilenced(effects: Eff[]) {
  return hasEffect(effects, "SILENCE");
}
function isStunned(effects: Eff[]) {
  return hasEffect(effects, "STUN");
}
function onlySimple(skill: ActiveSkill) {
  // “Simples” = só DANO ou ESCUDO (permite auto-defesa durante SILENCE)
  return skill.effects.every(e => e.kind === "DANO" || e.kind === "ESCUDO");
}

export class RuleEngine {
  private rng: RNG;
  constructor(seed = 42) { this.rng = new RNG(seed); }

  private pick<T>(arr: readonly T[]): T {
    const i = Math.floor(this.rng.next() * arr.length);
    return arr[i]!;
  }

  startMatch(state: BattleState) {
    state.turnNumber = 1;
    const c = this.pick(BASE_COLORS);
    state.teams[state.activeTeamId].energy[c] += 1;
  }

  startTurn(state: BattleState) {
    // +3 energias
    for (let i = 0; i < 3; i++) {
      const c = this.pick(BASE_COLORS);
      state.teams[state.activeTeamId].energy[c] += 1;
    }
    // Ticks de efeitos (DOT/HOT) e decaimento das durações
    this.tickCooldownsAndEffects(state);
  }

  convertToBlack(state: BattleState, color: (typeof BASE_COLORS)[number]) {
    const team = state.teams[state.activeTeamId];
    if (team.energy[color] > 0) { team.energy[color] -= 1; team.energy.PRETA += 1; return true; }
    return false;
  }

  validateQueue(state: BattleState, queue: QueuedAction[]) {
    if (queue.length > DEFAULT_TURN.maxActionsPerTurn) {
      return { ok: false as const, reason: "Excedeu 3 ações no turno." };
    }
    const per = new Map<string, number>();
    for (const a of queue) {
      const team = state.teams[a.actorTeam];
      const actor = team.characters.find(c => c.id === a.actorId);
      if (!actor) return { ok:false as const, reason:`Ator inválido ${a.actorId}` };

      // Bloqueios por status
      if (isStunned(actor.effects)) {
        return { ok:false as const, reason:`${a.actorId} está ATORDOADO (STUN)` };
      }
      const skill = (id:string)=>undefined; // consulta só na resolução
      // Contagem por personagem
      per.set(a.actorId, (per.get(a.actorId) ?? 0) + 1);
      if ((per.get(a.actorId) ?? 0) > DEFAULT_TURN.maxPerCharacterPerTurn) {
        return { ok: false as const, reason: "Mais de 1 ação para o mesmo personagem." };
      }
    }
    return { ok: true as const };
  }

  resolveQueue(state: BattleState, queue: QueuedAction[], lookup: (id: string) => ActiveSkill | undefined) {
    for (const a of queue) {
      const s = lookup(a.skillId);
      if (!s) continue;
      const team = state.teams[a.actorTeam];
      const actor = team.characters.find((c) => c.id === a.actorId);
      if (!actor) continue;

      // Revalida bloqueios on-the-fly (caso status tenha mudado dentro do turno)
      if (isStunned(actor.effects)) continue;
      if (isSilenced(actor.effects) && !onlySimple(s)) continue;

      const cd = actor.cooldowns[s.id] ?? 0;
      if (cd > 0) continue;

      if (!this.consumeCost(team, s)) continue;

      this.applyEffects(state, a, s);
      actor.cooldowns[s.id] = s.cooldown;
    }
  }

  endTurn(state: BattleState) {
    state.activeTeamId = state.activeTeamId === "A" ? "B" : "A";
    state.turnNumber += 1;
  }

  private consumeCost(team: BattleState["teams"]["A"], s: ActiveSkill) {
    for (const [color, amount] of Object.entries(s.cost)) {
      const need = amount ?? 0; if (!need) continue;
      const avail = team.energy[color as keyof typeof team.energy] ?? 0;
      const pay = Math.min(avail, need);
      const rem = need - pay;
      if (pay > 0) team.energy[color as keyof typeof team.energy] -= pay;
      if (rem > 0) {
        if (team.energy.PRETA >= rem) { team.energy.PRETA -= rem; }
        else { team.energy[color as keyof typeof team.energy] += pay; return false; }
      }
    }
    return true;
  }

  private applyEffects(state: BattleState, a: QueuedAction, s: ActiveSkill) {
    const allyTeamId = a.actorTeam;
    const enemyTeamId = a.actorTeam === "A" ? "B" : "A";

    let targetTeamId: "A" | "B" = enemyTeamId;
    if (s.target === "ALLY" || s.target === "ALLY_TEAM" || s.target === "SELF") targetTeamId = allyTeamId;

    const ally = state.teams[allyTeamId];
    const enemy = state.teams[enemyTeamId];
    const targetTeam = state.teams[targetTeamId];

    const findTargetUnit = () => {
      if (a.target?.id) return targetTeam.characters.find(c => c.id === a.target!.id);
      return targetTeam.characters.find(c => c.hp > 0);
    };

    const pushEffect = (t: typeof ally.characters[number], kind:string, duration:number, value?:number) => {
      t.effects.push({ kind, duration, value, sourceId: a.actorId });
    };

    for (const e of s.effects) {
      switch (e.kind) {
        case "DANO": {
          const t = s.target === "SELF" ? ally.characters.find(c=>c.id===a.actorId) : findTargetUnit();
          if (!t) break;
          const dmg = e.value ?? 0;
          const absorb = Math.min(t.shield, dmg);
          t.shield -= absorb;
          const rem = dmg - absorb;
          t.hp = clamp(t.hp - rem, 0, t.hp);
          break;
        }
        case "ESCUDO": {
          if (s.target === "ALLY_TEAM") {
            for (const c of ally.characters) c.shield += e.value ?? 0;
          } else if (s.target === "ALLY") {
            const tgt = findTargetUnit(); if (tgt) tgt.shield += e.value ?? 0;
          } else if (s.target === "SELF") {
            const self = ally.characters.find(c=>c.id===a.actorId); if (self) self.shield += e.value ?? 0;
          }
          break;
        }
        case "STUN": {
          const t = findTargetUnit(); if (!t) break;
          pushEffect(t, "STUN", e.duration ?? 1);
          break;
        }
        case "SILENCE": {
          const t = findTargetUnit(); if (!t) break;
          pushEffect(t, "SILENCE", e.duration ?? 1);
          break;
        }
        case "DOT": {
          const t = findTargetUnit(); if (!t) break;
          pushEffect(t, "DOT", e.duration ?? 2, e.value ?? 80);
          break;
        }
        case "HOT": {
          const t = s.target === "SELF" ? ally.characters.find(c=>c.id===a.actorId) : findTargetUnit();
          if (!t) break;
          pushEffect(t, "HOT", e.duration ?? 2, e.value ?? 80);
          break;
        }
        // Outros buffs/debuffs podem ser adicionados depois.
        default: break;
      }
    }
  }

  private tickCooldownsAndEffects(state: BattleState) {
    for (const team of [state.teams.A, state.teams.B]) {
      for (const ch of team.characters) {
        // ticks DOT/HOT antes de reduzir duração (aplicação por “turno iniciado”)
        for (const ef of ch.effects) {
          if (ef.duration > 0 && ef.value && ef.kind === "DOT") {
            const dmg = ef.value;
            const absorb = Math.min(ch.shield, dmg);
            ch.shield -= absorb;
            const rem = dmg - absorb;
            ch.hp = clamp(ch.hp - rem, 0, ch.hp);
          }
          if (ef.duration > 0 && ef.value && ef.kind === "HOT") {
            const heal = ef.value;
            ch.hp = ch.hp + heal; // sem maxHP no runtime — simples para MVP
          }
        }
        // cooldowns
        for (const k of Object.keys(ch.cooldowns)) {
          ch.cooldowns[k] = Math.max(0, (ch.cooldowns[k] ?? 0) - 1);
        }
        // decai durações e limpa expirados
        ch.effects = ch.effects
          .map(e => ({ ...e, duration: e.duration - 1 }))
          .filter(e => e.duration > 0);
      }
    }
  }
}
