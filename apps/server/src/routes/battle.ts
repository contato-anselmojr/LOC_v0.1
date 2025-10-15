import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { initBattle, declareAction, passTurn, grantTurnEnergy } from "../battle/engine";
import type { BattleConfig, PlayerState, CharacterState, Skill } from "../battle/types";
import { Color } from "../battle/types";

const router = Router();
const prisma = new PrismaClient();

function cs(id: string, name: string, hp: number, role: string = "adc"): CharacterState {
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

router.post("/start", async (req, res) => {
  try {
    const { player1Id = "P1", player2Id = "P2" } = req.body || {};

    const battle = await prisma.battle.create({
      data: {
        status: "active",
        turn: 1,
        currentPlayerId: player1Id,
        state: {
          players: [
            {
              id: player1Id,
              name: "Jogador 1",
              characters: [
                cs("p1c1", "Malvesz", 7000, "assassino"),
                cs("p1c2", "Lyra", 8000, "mago"),
                cs("p1c3", "Grom", 10000, "tank"),
              ],
              teamItemsRemain: 3,
            },
            {
              id: player2Id,
              name: "Jogador 2",
              characters: [
                cs("p2c1", "Alvo A", 7000, "adc"),
                cs("p2c2", "Alvo B", 7000, "adc"),
                cs("p2c3", "Alvo C", 7000, "adc"),
              ],
              teamItemsRemain: 3,
              energy: {},
            },
          ],
          log: [],
        },
      },
    });

    res.json({ ok: true, battle });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

export default router;
