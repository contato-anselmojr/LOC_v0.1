import { initBattle, grantTurnEnergy, passTurn } from "./engine";
import { BattleConfig, PlayerState, CharacterState, Skill, Color, ID } from "./types";

function cs(id: ID, name: string, hp: number): CharacterState {
  return {
    id,
    name,
    role: "adc",
    hp,
    maxHp: hp,
    cooldowns: {},
    items: [],
    alive: true,
    energy: {},
  };
}

const punch: Skill = {
  id: "punch",
  name: "Soco",
  kind: "attack",
  cost: { [Color.Green]: 1 }, // precisa 1 verde
  cooldown: 0,
  target: "enemy",
  description: "Ataque simples para testar pagamento de energia.",
  priority: 100,
};

const skillsById = new Map<string, Skill>([
  [punch.id, punch],
]);

const p1: PlayerState = {
  id: "P1",
  name: "Jogador 1",
  characters: [cs("p1c1", "Malvesz", 7000), cs("p1c2", "Lyra", 8000), cs("p1c3", "Grom", 10000)],
  teamItemsRemain: 3,
  energy: {},
};

const p2: PlayerState = {
  id: "P2",
  name: "Jogador 2",
  characters: [cs("p2c1", "Alvo A", 7000), cs("p2c2", "Alvo B", 7000), cs("p2c3", "Alvo C", 7000)],
  teamItemsRemain: 3,
  energy: {},
};

const cfg: Partial<BattleConfig> = {
  baseTurnDurationSec: 60,
  firstMoverInitialEnergyTotal: 1,
};

const state = initBattle("battle-1", p1, p2, cfg);

// Energia inicial do primeiro jogador (apenas 1 no total)
grantTurnEnergy(state);
console.log("== Após grantTurnEnergy (Turno 1, P1) ==");
console.log("P1 energy:", state.players[0].energy);
console.log("P2 energy:", state.players[1].energy);

// Tenta declarar ação: P1 usa Soco (precisa 1 verde) com p1c1 contra p2c1
const action = {
  id: "a1",
  actorId: "p1c1",
  skillId: "punch",
  targets: ["p2c1"],
  declaredAt: Date.now(),
};
import { declareAction } from "./engine";
const res = declareAction(state, action, punch);
console.log("declareAction result:", res);

// Passa a vez: resolve fila, aplica dano, troca jogador e concede energia ao próximo
passTurn(state, skillsById);

console.log("== Após passTurn ==");
console.log("Turn:", state.turn);
console.log("CurrentPlayerId:", state.currentPlayerId);
console.log("P1 energy:", state.players[0].energy);
console.log("P2 energy:", state.players[1].energy);
console.log(
  "HP p2c1:",
  state.players[1].characters.find(c => c.id === "p2c1")?.hp
);
