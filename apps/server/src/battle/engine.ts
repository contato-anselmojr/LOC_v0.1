import {
  Action,
  ActionQueueEntry,
  BattleConfig,
  BattleState,
  BASE_COLORS,
  CharacterState,
  Color,
  EnergyPool,
  ID,
  PlayerState,
  Skill,
} from "./types";

// --- Utils de RNG (determinismo opcional por seed futura)
function randInt(max: number) {
  return Math.floor(Math.random() * max);
}
function randBaseColor(): Color {
  return BASE_COLORS[randInt(BASE_COLORS.length)];
}

// --- Energy helpers
function addEnergy(pool: EnergyPool, color: Color, n = 1) {
  pool[color] = (pool[color] ?? 0) + n;
}
function canPay(pool: EnergyPool, cost: Partial<Record<Color, number>>): boolean {
  for (const [k, v] of Object.entries(cost)) {
    const c = k as Color;
    if ((pool[c] ?? 0) < (v ?? 0)) return false;
  }
  return true;
}
function pay(pool: EnergyPool, cost: Partial<Record<Color, number>>): void {
  for (const [k, v] of Object.entries(cost)) {
    const c = k as Color;
    if (!v) continue;
    pool[c] = (pool[c] ?? 0) - v;
  }
}
export function convertToBlack(pool: EnergyPool, from: Color, amount = 1): boolean {
  if (from === Color.Black || from === Color.Orange) return false;
  const have = pool[from] ?? 0;
  if (have < amount) return false;
  pool[from] = have - amount;
  addEnergy(pool, Color.Black, amount);
  return true;
}
export function convertThreeToOrange(pool: EnergyPool, from: Color): boolean {
  if (from === Color.Black || from === Color.Orange) return false;
  const have = pool[from] ?? 0;
  if (have < 3) return false;
  pool[from] = have - 3;
  addEnergy(pool, Color.Orange, 1);
  return true;
}

// --- Estado/queries
function isAlive(c: CharacterState) {
  return c.alive && c.hp > 0;
}
function livingCount(p: PlayerState) {
  return p.characters.filter(isAlive).length;
}
function findChar(state: BattleState, id: ID): CharacterState | undefined {
  for (const p of state.players) {
    const f = p.characters.find((c) => c.id === id);
    if (f) return f;
  }
  return undefined;
}
function currentPlayer(state: BattleState): PlayerState {
  return state.players[state.players[0].id === state.currentPlayerId ? 0 : 1];
}
function opponentPlayer(state: BattleState): PlayerState {
  return state.players[state.players[0].id === state.currentPlayerId ? 1 : 0];
}

// --- Config padrão
export const DEFAULT_CONFIG: BattleConfig = {
  baseTurnDurationSec: 60,
  firstMoverInitialEnergyTotal: 1,
  energyPerLivingCharacterPerTurn: 1,
  allowBlackFromRandom: false,
  allowOrangeFromRandom: false,
};

// --- Inicialização
export function initBattle(
  id: ID,
  p1: PlayerState,
  p2: PlayerState,
  cfg: Partial<BattleConfig> = {}
): BattleState {
  const config = { ...DEFAULT_CONFIG, ...cfg };
  const now = Date.now();
  // zera energias/cds status runtime
  for (const p of [p1, p2]) {
    p.teamItemsRemain = 3;
    for (const c of p.characters) {
      c.energy = {};
      c.cooldowns = {};
      c.alive = c.hp > 0;
      c.items = c.items ?? [];
    }
  }
  return {
    id,
    turn: 1,
    currentPlayerId: p1.id,
    players: [p1, p2],
    queue: [],
    startedAt: now,
    lastTickAt: now,
    config,
    finished: false,
  };
}

// --- Início do turno: dar energia (1 por personagem VIVO)
export function grantTurnEnergy(state: BattleState) {
  const p = currentPlayer(state);
  const alive = livingCount(p);

  // Regra especial: primeiro a jogar no turno 1 recebe total = 1
  if (state.turn === 1) {
    const isFirstMover = state.currentPlayerId === state.players[0].id;
    if (isFirstMover) {
      let granted = 0;
      while (granted < state.config.firstMoverInitialEnergyTotal) {
        const color = randBaseColor();
        addEnergyPoolToTeam(p, color, 1);
        granted++;
      }
      return;
    }
  }

  // Turnos > 1 ou segundo jogador do turno 1:
  const total = alive * state.config.energyPerLivingCharacterPerTurn;
  for (let i = 0; i < total; i++) {
    const color = randBaseColor();
    addEnergyPoolToTeam(p, color, 1);
  }
}

// Distribui energia ao "time" como um todo? (MVP: energia fica em cada personagem)
// Implemento como energia INDIVIDUAL: sorteia receptores vivos.
function addEnergyPoolToTeam(p: PlayerState, color: Color, amount: number) {
  // distribui 1 por vez entre vivos
  for (let i = 0; i < amount; i++) {
    const vivos = p.characters.filter(isAlive);
    if (vivos.length === 0) return;
    const receiver = vivos[randInt(vivos.length)];
    addEnergy(receiver.energy, color, 1);
  }
}

// --- Fila de ações
export function declareAction(
  state: BattleState,
  action: Action,
  skill: Skill
): { ok: true } | { ok: false; reason: string } {
  // Validação básica: ator é do jogador atual e está vivo
  const p = currentPlayer(state);
  const actor = p.characters.find((c) => c.id === action.actorId);
  if (!actor) return { ok: false, reason: "actor_not_found_or_not_yours" };
  if (!isAlive(actor)) return { ok: false, reason: "actor_dead" };

  // Checa cooldown
  if ((actor.cooldowns[skill.id] ?? 0) > 0) {
    return { ok: false, reason: "skill_on_cooldown" };
  }

  // Checa custo (não consome ainda; consumo ocorre na execução)
  if (!canPay(actor.energy, skill.cost)) {
    return { ok: false, reason: "not_enough_energy" };
  }

  const entry: ActionQueueEntry = {
    action: { ...action, declaredAt: Date.now() },
    priority: skill.priority ?? 100,
  };
  state.queue.push(entry);
  return { ok: true };
}

// --- Passar a vez: resolve fila e troca jogador
export function passTurn(state: BattleState, skillsById: Map<ID, Skill>) {
  // Ordena por prioridade, depois por timestamp
  state.queue.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.action.declaredAt - b.action.declaredAt;
  });

  // Executa ações
  for (const entry of state.queue) {
    const { action } = entry;
    const actor = findChar(state, action.actorId);
    if (!actor || !isAlive(actor)) continue;

    const skill = skillsById.get(action.skillId);
    if (!skill) continue;

    // Paga custo (se não puder pagar na hora, falha silenciosa)
    if (!canPay(actor.energy, skill.cost)) continue;
    pay(actor.energy, skill.cost);

    // Cooldown
    if (skill.cooldown > 0) {
      actor.cooldowns[skill.id] = skill.cooldown;
    }

    // MVP de efeitos:
    // - trap/buff/shield: apenas marca (placeholder)
    // - attack: aplica dano fixo simples (1000) no primeiro alvo válido
    if (skill.kind === "attack" && action.targets.length > 0) {
      const target = findChar(state, action.targets[0]);
      if (target && isAlive(target)) {
        const dmg = 1000; // TODO: substituir por cálculo real (baseDamage, tags, mitigação etc.)
        target.hp = Math.max(0, target.hp - dmg);
        if (target.hp <= 0) target.alive = false;
      }
    }
    // outros tipos ficam como no-op por enquanto (serão implementados)
  }

  // Avança cooldowns de TODOS os personagens
  for (const p of state.players) {
    for (const c of p.characters) {
      for (const k of Object.keys(c.cooldowns)) {
        c.cooldowns[k] = Math.max(0, (c.cooldowns[k] ?? 0) - 1);
      }
    }
  }

  // Limpa fila
  state.queue = [];

  // Checa vitória
  const p1Dead = state.players[0].characters.every((c) => !isAlive(c));
  const p2Dead = state.players[1].characters.every((c) => !isAlive(c));
  if (p1Dead || p2Dead) {
    state.finished = true;
    state.winnerPlayerId = p1Dead && !p2Dead ? state.players[1].id
                        : p2Dead && !p1Dead ? state.players[0].id
                        : undefined; // empate raro
    return;
  }

  // Troca jogador e avança turno
  state.currentPlayerId =
    state.currentPlayerId === state.players[0].id
      ? state.players[1].id
      : state.players[0].id;

  state.turn += 1;
  state.lastTickAt = Date.now();

  // Concede energia do novo turno ao novo jogador atual
  grantTurnEnergy(state);
}
