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

export class RuleEngine {
  private rng: RNG;
  constructor(seed = 42) {
    this.rng = new RNG(seed);
  }

  private pick<T>(arr: readonly T[]): T {
    const i = Math.floor(this.rng.next() * arr.length);
    // arr[i] nunca é undefined se arr.length>0 (garantido pelos chamadores)
    return arr[i]!;
  }

  startMatch(state: BattleState) {
    state.turnNumber = 1;
    const c = this.pick(BASE_COLORS);
    state.teams[state.activeTeamId].energy[c] += 1;
  }

  startTurn(state: BattleState) {
    for (let i = 0; i < 3; i++) {
      const c = this.pick(BASE_COLORS);
      state.teams[state.activeTeamId].energy[c] += 1;
    }
    this.tickCooldownsAndEffects(state);
  }

  convertToBlack(state: BattleState, color: (typeof BASE_COLORS)[number]) {
    const team = state.teams[state.activeTeamId];
    if (team.energy[color] > 0) {
      team.energy[color] -= 1;
      team.energy.PRETA += 1;
      return true;
    }
    return false;
  }

  validateQueue(state: BattleState, queue: QueuedAction[]) {
    if (queue.length > DEFAULT_TURN.maxActionsPerTurn) {
      return { ok: false as const, reason: "Excedeu 3 ações no turno." };
    }
    const per = new Map<string, number>();
    for (const a of queue) {
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
      const need = amount ?? 0;
      if (!need) continue;
      const avail = team.energy[color as keyof typeof team.energy] ?? 0;
      const pay = Math.min(avail, need);
      const rem = need - pay;
      if (pay > 0) team.energy[color as keyof typeof team.energy] -= pay;
      if (rem > 0) {
        if (team.energy.PRETA >= rem) {
          team.energy.PRETA -= rem;
        } else {
          // rollback parcial do pay
          team.energy[color as keyof typeof team.energy] += pay;
          return false;
        }
      }
    }
    return true;
  }

  private applyEffects(state: BattleState, a: QueuedAction, s: ActiveSkill) {
    // Define times alvo/aliado conforme o target da skill
    const allyTeamId = a.actorTeam;
    const enemyTeamId = a.actorTeam === "A" ? "B" : "A";

    // Seleciona time-alvo de acordo com s.target
    let targetTeamId: "A" | "B" = enemyTeamId;
    if (s.target === "ALLY" || s.target === "ALLY_TEAM" || s.target === "SELF") targetTeamId = allyTeamId;

    const ally = state.teams[allyTeamId];
    const enemy = state.teams[enemyTeamId];
    const targetTeam = state.teams[targetTeamId];

    // Resolve alvo unitário (quando id for especificado)
    const findTargetUnit = () => {
      if (a.target?.id) {
        return targetTeam.characters.find((c) => c.id === a.target!.id);
      }
      // fallback: 1º vivo
      return targetTeam.characters.find((c) => c.hp > 0);
    };

    for (const e of s.effects) {
      switch (e.kind) {
        case "DANO": {
          const t =
            s.target === "SELF"
              ? ally.characters.find((c) => c.id === a.actorId)
              : findTargetUnit();
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
            const tgt = findTargetUnit();
            if (tgt) tgt.shield += e.value ?? 0;
          } else if (s.target === "SELF") {
            const self = ally.characters.find((c) => c.id === a.actorId);
            if (self) self.shield += e.value ?? 0;
          } else {
            // Escudo em inimigo não faz sentido, ignora
          }
          break;
        }
        // Outros efeitos podem ser modelados aqui (STUN/SILENCE/DOT/HOT...) mantendo a mesma lógica de alvo
        default:
          break;
      }
    }
  }

  private tickCooldownsAndEffects(state: BattleState) {
    for (const team of [state.teams.A, state.teams.B]) {
      for (const ch of team.characters) {
        for (const k of Object.keys(ch.cooldowns)) {
          ch.cooldowns[k] = Math.max(0, (ch.cooldowns[k] ?? 0) - 1);
        }
        ch.effects = ch.effects
          .map((e) => ({ ...e, duration: e.duration - 1 }))
          .filter((e) => e.duration > 0);
      }
    }
  }
}
