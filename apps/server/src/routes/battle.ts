import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import {
  initBattle,
  declareAction,
  passTurn,
  type BattleState,
} from "../battle/engine";

const router = Router();
const prisma = new PrismaClient();

// memória in-memory (estável o bastante p/ dev)
const store = new Map<string, BattleState>();

// === POST /api/start ===
router.post("/start", async (_req, res) => {
  try {
    const b = initBattle();
    store.set(b.id, b);

    // grava “snapshot” opcional (não bloqueia se falhar)
    try {
      await prisma.battle.create({
        data: { player1: 1, player2: 2, state: b as any },
      });
    } catch (_e) {}

    return res.json({ battle: b });
  } catch (e: any) {
    console.error("Erro em /api/start:", e);
    return res.status(500).json({ error: "engine-start-failed", message: e?.message });
  }
});

// === POST /api/turn ===
router.post("/turn", async (req, res) => {
  try {
    const { battleId, actions = [] } = req.body as {
      battleId: string;
      actions: Array<{
        source: { playerId: string; charId: string };
        target: { playerId: string; charId: string };
        skillId: string;
      }>;
    };

    const b = store.get(battleId);
    if (!b) {
      return res.status(404).json({ error: "battle-not-found" });
    }

    const results: any[] = [];

    // aplica ações uma a uma; qualquer erro vira resultado, não 500
    for (const act of actions) {
      try {
        const r = declareAction(b, act);
        results.push(...r);
      } catch (e: any) {
        results.push({ ok: false, reason: "engine-error", message: e?.message });
      }
    }

    // alterna o turno e gera energia do PRÓXIMO jogador (1 por vivo)
    passTurn(b);

    store.set(b.id, b);

    // snapshot opcional
    try {
      await prisma.battle.create({
        data: { player1: 1, player2: 2, state: b as any },
      });
    } catch (_e) {}

    return res.json({ battle: b, results });
  } catch (e: any) {
    console.error("Erro em /api/turn:", e);
    return res.status(500).json({ error: "engine-turn-failed", message: e?.message });
  }
});

export default router;
