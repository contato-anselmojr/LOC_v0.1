import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { initBattle, declareAction, passTurn, grantTurnEnergy } from "../battle/engine";
import type { BattleConfig, PlayerState, CharacterState, Skill } from "../battle/types";
import { Color } from "../battle/types";

const router = Router();
const prisma = new PrismaClient();

/**
 * Cria estado rápido de personagem para testes locais
 */
function cs(
  id: string,
  name: string,
  hp: number,
  role: "adc" | "tank" | "mago" | "suporte" | "assassino" | "evasivo" = "adc"
): CharacterState {
  return {
    id,
    name,
    role,
    hp,
    maxHp: hp,
    cooldowns: {},
    items: [],
    alive: true,
      energy: {},
  };
}

/**
 * Skill genérica usada na simulação básica
 */
const punch: Skill = {
  id: "punch",
  name: "Soco",
  kind: "attack",
  cost: { [Color.Green]: 1 },
  cooldown: 0,
  target: "enemy",
  priority: 100,
};

// =====================================================
// ROTA /test — mantém a simulação básica de batalha 3x3
// =====================================================
router.get("/test", (_req, res) => {
  const p1: PlayerState = {
    id: "P1",
    name: "Jogador 1",
    characters: [
      cs("p1c1", "Malvesz", 7000, "assassino"),
      cs("p1c2", "Lyra", 8000, "mago"),
      cs("p1c3", "Grom", 10000, "tank"),
    ],
    teamItemsRemain: 3,
    energy: {},
  };

  const p2: PlayerState = {
    id: "P2",
    name: "Jogador 2",
    characters: [
      cs("p2c1", "Alvo A", 7000, "adc"),
      cs("p2c2", "Alvo B", 7000, "adc"),
      cs("p2c3", "Alvo C", 7000, "adc"),
    ],
    teamItemsRemain: 3,
    energy: {},
  };

  const cfg: Partial<BattleConfig> = {
    baseTurnDurationSec: 60,
    firstMoverInitialEnergyTotal: 1,
  };

  const state = initBattle("battle-1", p1, p2, cfg);
  grantTurnEnergy(state);

  const declare = declareAction(
    state,
    {
      id: "a1",
      actorId: "p1c1",
      skillId: "punch",
      targets: ["p2c1"],
      declaredAt: Date.now(),
    },
    punch
  );

  const skillsById = new Map<string, Skill>([[punch.id, punch]]);
  passTurn(state, skillsById);

  const hpP2C1 = state.players[1].characters.find((c) => c.id === "p2c1")?.hp ?? null;

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

// =====================================================
// ROTA /start — cria nova batalha persistente no banco
// =====================================================
router.post("/start", async (req, res) => {
  try {
    const { player1Id = "userA", player2Id = "userB" } = req.body || {};

    const battle = await prisma.battle.create({
      data: {
        status: "active",
        turn: 1,
        currentPlayerId: player1Id,
        state: {
          players: [
            { id: player1Id, hp: 7000, energy: {}, alive: true },
            { id: player2Id, hp: 7000, energy: {}, alive: true },
          ],
          log: [],
        },
      },
    });

    res.json({ ok: true, id: battle.id, battle });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// =====================================================
// ROTA /action — registra ação e atualiza estado JSON
// =====================================================
router.post("/action", async (req, res) => {
  const { battleId, actorId, targetId, skillName = "Ataque", data = {} } = req.body;
  try {
    const battle = await prisma.battle.findUnique({ where: { id: battleId } });
    if (!battle) return res.status(404).json({ error: "Battle not found" });

    const state: any = battle.state || {};
    state.log = state.log || [];
    state.log.push({ actorId, targetId, skillName, data, ts: Date.now() });

    // Atualiza HP fictício (exemplo visual)
    const target = state.players?.find((p: any) => p.id === targetId);
    if (target) target.hp = Math.max(0, target.hp - 500);

    const updated = await prisma.battle.update({
      where: { id: battleId },
      data: {
        state,
        updatedAt: new Date(),
      },
    });

    await prisma.battleAction.create({
      data: { battleId, actorId, targetId, skillName, data },
    });

    res.json({ ok: true, battle: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// =====================================================
// ROTA /state/:id — retorna estado atual da batalha
// =====================================================
router.get("/state/:id", async (req, res) => {
  try {
    const battle = await prisma.battle.findUnique({ where: { id: req.params.id } });
    if (!battle) return res.status(404).json({ error: "Battle not found" });
    res.json({ ok: true, battle });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// =====================================================
// FUTURO — suporte a modo Battle Royale (comentado)
// =====================================================
// router.post("/royale/start", async (req, res) => {
//   const { players } = req.body;
//   const battle = await prisma.battle.create({
//     data: { status: "royale", state: { players, log: [] } },
//   });
//   res.json({ ok: true, battle });
// });

// =====================================================
// Export final do router
// =====================================================
export default router;
