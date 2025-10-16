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
