import { Router } from "express";
import { initBattle, nextTurn, calculateSkillCost } from "../battle/engine";
import { skills } from "../battle/skills";

const router = Router();

// cache de batalhas em memória (simples)
const battleCache: Record<string, any> = {};

// === /api/start ===
router.post("/start", (req, res) => {
  try {
    const { player1Id, player2Id } = req.body;
    const battle = initBattle(player1Id, player2Id);

    // calcula custos das skills no formato novo
    battle.skills = skills.map((s) => ({
      ...s,
      cost: calculateSkillCost(s),
    }));

    // gera id e salva no cache
    const battleId = Date.now().toString();
    battle.id = battleId;
    battleCache[battleId] = battle;

    res.json(battle);
  } catch (err) {
    console.error("Erro em /api/start:", err);
    res.status(500).json({ error: "Erro ao iniciar batalha" });
  }
});

// === /api/turn ===
router.post("/turn", (req, res) => {
  try {
    const { battleId, actions = [] } = req.body;
    const battle = battleCache[battleId];
    if (!battle) return res.status(404).json({ error: "Batalha não encontrada" });

    // placeholder de ações (futuro)
    const results: any[] = actions.map(() => ({
      ok: true,
      type: "noop",
      reason: "ação simulada",
    }));

    // sempre permite passar turno
    const updated = nextTurn(battle);
    battleCache[battleId] = updated;

    res.json({ battle: updated, results });
  } catch (err) {
    console.error("Erro em /api/turn:", err);
    res.status(500).json({ error: "Erro ao processar turno" });
  }
});

export default router;
