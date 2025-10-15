import { Router } from "express";
import { initBattle, grantTurnEnergy, passTurn, declareAction } from "../battle/engine";
import { BattleConfig, PlayerState, CharacterState, Skill, Color } from "../battle/types";

const router = Router();

function cs(id: string, name: string, hp: number): CharacterState {
  return { id, name, role: "adc", hp, maxHp: hp, cooldowns: {}, items: [], alive: true };
}

const punch: Skill = {
  id: "punch", name: "Soco", kind: "attack",
  cost: { [Color.Green]: 1 }, cooldown: 0, target: "enemy", priority: 100,
};

router.get("/test", (_req, res) => {
  const p1: PlayerState = {
    id: "P1", name: "Jogador 1",
    characters: [cs("p1c1","Malvesz",7000), cs("p1c2","Lyra",8000), cs("p1c3","Grom",10000)],
    teamItemsRemain: 3, energy: {},
  };
  const p2: PlayerState = {
    id: "P2", name: "Jogador 2",
    characters: [cs("p2c1","Alvo A",7000), cs("p2c2","Alvo B",7000), cs("p2c3","Alvo C",7000)],
    teamItemsRemain: 3, energy: {},
  };
  const cfg: Partial<BattleConfig> = { baseTurnDurationSec: 60, firstMoverInitialEnergyTotal: 1 };

  const state = initBattle("battle-1", p1, p2, cfg);
  grantTurnEnergy(state); // concede energia do turno 1 para P1

  const declare = declareAction(state, {
    id: "a1", actorId: "p1c1", skillId: "punch", targets: ["p2c1"], declaredAt: Date.now(),
  }, punch);

  const skillsById = new Map<string, Skill>([[punch.id, punch]]);
  passTurn(state, skillsById);

  const hpP2C1 = state.players[1].characters.find(c => c.id === "p2c1")?.hp ?? null;
  return res.json({
    turn: state.turn,
    currentPlayerId: state.currentPlayerId,
    p1Energy: state.players[0].energy,
    p2Energy: state.players[1].energy,
    declare,
    hpP2C1,
    finished: state.finished,
    winner: state.winnerPlayerId ?? null,
  });
});

export default router;
