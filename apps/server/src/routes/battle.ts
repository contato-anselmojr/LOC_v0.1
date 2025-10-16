import { Router } from "express";
import { initBattle, calculateSkillCost } from "../battle/engine";
import { skills } from "../battle/skills";

const router = Router();

router.post("/start", (req, res) => {
  try {
    const { player1Id, player2Id } = req.body;
    const battle = initBattle(player1Id, player2Id);

    // anexa skills e HUD inicial ao estado
    battle.skills = skills.map((s) => ({
      ...s,
      cost: calculateSkillCost(s),
    }));

    battle.hud = {
      energy: { RED: 0, BLUE: 0, WHITE: 0, GREEN: 0 },
      players: battle.players.map((p) => ({
        id: p.id,
        hp: 100,
        energy: { ...p.energy },
      })),
    };

    res.json(battle);
  } catch (err) {
    console.error("Erro em /api/start:", err);
    res.status(500).json({ error: "Erro ao iniciar batalha" });
  }
});

export default router;

import { nextTurn } from "../battle/engine";

// cache simples de batalhas em memória (enquanto não há banco)
const battleCache: Record<string, any> = {};

router.post("/turn", (req, res) => {
  try {
    const { battleId, actions = [] } = req.body;

    // tenta recuperar batalha
    let battle = battleCache[battleId];
    if (!battle) {
      return res.status(404).json({ error: "Batalha não encontrada" });
    }

    // aplica ações (ainda não implementadas)
    const results: any[] = actions.map(() => ({
      ok: true,
      type: "noop",
      reason: "ação simulada (placeholder)",
    }));

    // permite passar turno mesmo com 0 ações
    battle = nextTurn(battle);

    // salva nova versão
    battleCache[battleId] = battle;

    res.json({ battle, results });
  } catch (err) {
    console.error("Erro em /api/turn:", err);
    res.status(500).json({ error: "Erro ao processar turno" });
  }
});

// intercepta /start para salvar batalha no cache
const originalStart = router.stack.find((r: any) =>
  r.route?.path === "/start"
);
if (originalStart) {
  const oldHandler = originalStart.route.stack[0].handle;
  originalStart.route.stack[0].handle = (req: any, res: any, next: any) => {
    const json = res.json.bind(res);
    res.json = (data: any) => {
      const id = Date.now().toString();
      data.id = id;
      battleCache[id] = data;
      return json(data);
    };
    oldHandler(req, res, next);
  };
}

