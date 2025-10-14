import { BASE_COLORS, ActiveSkill } from "../types/core";
import { BattleState, DEFAULT_TURN } from "../types/state";
import { clamp } from "../utils/math";

export type QueuedAction = { actorTeam:"A"|"B"; actorId:string; skillId:string; target?:{team:"A"|"B"; id?:string}; };

export class RuleEngine {
  constructor(private seed = 42) {}
  private next() { this.seed = (this.seed ^ (this.seed << 13)) ^ (this.seed >>> 17) ^ (this.seed << 5); return ((this.seed >>> 0) % 1000000) / 1000000; }
  private pick<T>(arr: readonly T[]): T { const i = Math.floor(this.next() * arr.length); return arr[i]; }

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
  convertToBlack(state: BattleState, color: typeof BASE_COLORS[number]) {
    const team = state.teams[state.activeTeamId];
    if (team.energy[color] > 0) { team.energy[color] -= 1; team.energy.PRETA += 1; return true; }
    return false;
  }
  validateQueue(state: BattleState, queue: QueuedAction[]) {
    if (queue.length > DEFAULT_TURN.maxActionsPerTurn) return { ok:false as const, reason:"Excedeu 3 ações no turno." };
    const per = new Map<string, number>();
    for (const a of queue) {
      per.set(a.actorId, (per.get(a.actorId) ?? 0) + 1);
      if ((per.get(a.actorId) ?? 0) > DEFAULT_TURN.maxPerCharacterPerTurn) return { ok:false as const, reason:"Mais de 1 ação para o mesmo personagem." };
    }
    return { ok:true as const };
  }
  resolveQueue(state: BattleState, queue: QueuedAction[], lookup:(id:string)=>ActiveSkill|undefined){
    for (const a of queue) {
      const s = lookup(a.skillId); if (!s) continue;
      const team = state.teams[a.actorTeam];
      const actor = team.characters.find(c=>c.id===a.actorId); if (!actor) continue;
      const cd = actor.cooldowns[s.id] ?? 0; if (cd>0) continue;
      if (!this.consumeCost(team, s)) continue;
      this.applyEffects(state, a, s);
      actor.cooldowns[s.id] = s.cooldown;
    }
  }
  endTurn(state: BattleState){ state.activeTeamId = state.activeTeamId==="A"?"B":"A"; state.turnNumber += 1; }

  private consumeCost(team: BattleState["teams"]["A"], s: ActiveSkill){
    for (const [color, amount] of Object.entries(s.cost)) {
      const need = amount ?? 0; if (!need) continue;
      const avail = (team.energy as any)[color] ?? 0;
      const pay = Math.min(avail, need); const rem = need - pay;
      if (pay>0) (team.energy as any)[color] -= pay;
      if (rem>0) {
        if (team.energy.PRETA >= rem) { team.energy.PRETA -= rem; }
        else { (team.energy as any)[color] += pay; return false; }
      }
    }
    return true;
  }
  private applyEffects(state: BattleState, a: QueuedAction, s: ActiveSkill){
    const targetTeam = a.target?.team ?? (a.actorTeam==="A"?"B":"A");
    const enemy = state.teams[targetTeam]; const ally = state.teams[a.actorTeam];
    for (const e of s.effects) {
      switch (e.kind) {
        case "DANO": {
          const t = enemy.characters.find(c=>c.id===a.target?.id) ?? enemy.characters.find(c=>c.hp>0);
          if (!t) break; const dmg = e.value ?? 0;
          const absorb = Math.min(t.shield, dmg); t.shield -= absorb;
          const rem = dmg - absorb; t.hp = clamp(t.hp - rem, 0, t.hp);
          break;
        }
        case "ESCUDO": {
          if (s.target === "ALLY_TEAM") { for (const c of ally.characters) c.shield += e.value ?? 0; }
          else { const self = ally.characters.find(c=>c.id===a.actorId); if (self) self.shield += e.value ?? 0; }
          break;
        }
        default: break;
      }
    }
  }
  private tickCooldownsAndEffects(state: BattleState){
    for (const team of [state.teams.A, state.teams.B]) {
      for (const ch of team.characters) {
        for (const k of Object.keys(ch.cooldowns)) { ch.cooldowns[k] = Math.max(0, (ch.cooldowns[k] ?? 0) - 1); }
        ch.effects = ch.effects.map(e=>({ ...e, duration: e.duration - 1 })).filter(e=>e.duration>0);
      }
    }
  }
}
