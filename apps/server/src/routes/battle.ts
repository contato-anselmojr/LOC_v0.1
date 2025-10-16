import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { initBattle, declareAction, passTurn, grantRandomEnergy } from "../battle/engine";
import type { BattleConfig, PlayerState, CharacterState, Skill } from "../battle/types";

const router = Router();
const prisma = new PrismaClient();

// === Helpers ===
function aliveCount(p: any): number {
  return p.characters.filter((c: any) => c.alive && c.hp > 0).length;
}

// === Rotas ===
router.post("/start", async (req, res) => {
  try {
    const battleId = Math.random().toString(36).slice(2, 10);
    const state = initBattle(battleId);

    // ⚙️ Zerar energia inicial
    state.energy = {
      P1: { B: 0, R: 0, G: 0, Y: 0 },
      P2: { B: 0, R: 0, G: 0, Y: 0 },
    };

    // 🎲 Jogador inicial ganha +1 energia aleatória
    grantRandomEnergy(state.energy[state.currentPlayerId], 1);

    await prisma.battle.create({
      data: {
        id: battleId,
        status: "active",
        turn: 1,
        currentPlayerId: state.currentPlayerId,
        state: JSON.stringify(state),
      },
    });

    res.json({ battle: state });
  } catch (err) {
    console.error("Erro em /api/start:", err);
    res.status(500).json({ error: "Erro ao iniciar batalha" });
  }
});

router.post("/turn", async (req, res) => {
  try {
    const { battleId, actions } = req.body;
    const dbBattle = await prisma.battle.findUnique({ where: { id: battleId } });
    if (!dbBattle) return res.status(404).json({ error: "Batalha não encontrada" });

    const battle = JSON.parse(dbBattle.state);
    const results: any[] = [];

    // === Executar ações ===
    if (Array.isArray(actions)) {
      for (const act of actions) {
        results.push(await declareAction(battle, act));
      }
    }

    // === Fim de turno ===
    const p1 = battle.players.find((p: any) => p.id === "P1");
    const p2 = battle.players.find((p: any) => p.id === "P2");
    const aliveP1 = aliveCount(p1);
    const aliveP2 = aliveCount(p2);

    if (aliveP1 === 0 || aliveP2 === 0) {
      battle.status = "ended";
      results.push({
        type: "end",
        message: `🏁 Jogo encerrado — ${(aliveP1 === 0 ? "P2" : "P1")} venceu!`,
      });
    } else {
      // Alterna turno
      const next = battle.currentPlayerId === "P1" ? "P2" : "P1";
      battle.turn += 1;
      battle.currentPlayerId = next;

      // 💡 Ganho de energia baseado em personagens vivos
      const player = battle.players.find((p: any) => p.id === next);
      const gain = aliveCount(player);
      grantRandomEnergy(battle.energy[next], gain);

      results.push({
        type: "energy",
        player: next,
        amount: gain,
        message: `⚡ ${next} ganhou +${gain} energias (${gain} vivos)`,
      });
    }

    await prisma.battle.update({
      where: { id: battleId },
      data: { state: JSON.stringify(battle), turn: battle.turn, currentPlayerId: battle.currentPlayerId },
    });

    res.json({ battle, results });
  } catch (err) {
    console.error("Erro em /api/turn:", err);
    res.status(500).json({ error: "Erro ao processar turno" });
  }
});

export default router;
