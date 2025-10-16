import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// === Tipos base ===
type Color = "B" | "R" | "G" | "Y";
type Cost = Partial<Record<Color, number>>;

type Skill = {
  id: string;
  name: string;
  kind: "attack" | "heal" | "buff" | "shield" | "control" | "damage";
  cost: Cost;
  power: number;
};

type CharacterState = {
  id: string;
  name: string;
  role: "adc" | "tank" | "mago" | "assassino";
  hp: number;
  maxHp: number;
  skills: Skill[];
  alive: boolean;
};

type PlayerState = {
  id: string;
  name: string;
  characters: CharacterState[];
};

type EnergyPool = Partial<Record<Color, number>>;

type BattleState = {
  id: string;
  turn: number;
  currentPlayerId: string;
  players: PlayerState[];
  energy: Record<string, EnergyPool>;
};

type DeclaredAction = {
  source: { playerId: string; charId: string };
  target: { playerId: string; charId: string };
  skillId: string;
};

// === memória temporária ===
const battleStore = new Map<string, BattleState>();
const rid = () => Math.random().toString(36).slice(2, 10);

// === skills básicas ===
const SKILLS: Skill[] = [
  { id: "strike", name: "Golpe", kind: "attack", cost: { B: 1 }, power: 25 },
  { id: "fireball", name: "Fireball", kind: "attack", cost: { R: 2 }, power: 40 },
  { id: "heal", name: "Cura", kind: "heal", cost: { G: 1 }, power: 20 },
  { id: "shield", name: "Escudo", kind: "shield", cost: { Y: 1 }, power: 0 },
];

// === utilitários ===
function cloneSkills(): Skill[] {
  return SKILLS.map((s) => ({ ...s, cost: { ...s.cost } }));
}

function hasEnergy(pool: EnergyPool, cost: Cost): boolean {
  return Object.entries(cost).every(([c, q]) => (pool[c as Color] ?? 0) >= (q ?? 0));
}
function consumeEnergy(pool: EnergyPool, cost: Cost) {
  Object.entries(cost).forEach(([c, q]) => {
    const k = c as Color;
    pool[k] = Math.max(0, (pool[k] ?? 0) - (q ?? 0));
  });
}
function grantRandomEnergy(pool: EnergyPool, n = 1) {
  const colors: Color[] = ["B", "R", "G", "Y"];
  for (let i = 0; i < n; i++) {
    const c = colors[Math.floor(Math.random() * colors.length)];
    pool[c] = (pool[c] ?? 0) + 1;
  }
}

// === rota: iniciar batalha ===
router.post("/start", async (req, res) => {
  const makeChar = (name: string, role: CharacterState["role"], idx: number): CharacterState => ({
    id: rid() + "_c" + idx,
    name,
    role,
    hp: 100,
    maxHp: 100,
    skills: cloneSkills(),
    alive: true,
  });

  const battleId = rid();
  const state: BattleState = {
    id: battleId,
    turn: 1,
    currentPlayerId: "P1",
    players: [
      {
        id: "P1",
        name: "Jogador 1",
        characters: [
          makeChar("Raven", "assassino", 1),
          makeChar("Boreal", "tank", 2),
          makeChar("Lyra", "mago", 3),
        ],
      },
      {
        id: "P2",
        name: "Jogador 2",
        characters: [
          makeChar("Kai", "adc", 1),
          makeChar("Nox", "assassino", 2),
          makeChar("Oris", "mago", 3),
        ],
      },
    ],
    energy: {
      P1: { B: 2, R: 0, G: 0, Y: 0 },
      P2: { B: 2, R: 0, G: 0, Y: 0 },
    },
  };

  battleStore.set(battleId, state);
  try {
    await prisma.battle.create({ data: { player1: 1, player2: 2, state: state as any } });
  } catch (_) {}
  res.json({ battle: state });
});

// === rota: processar turno ===
router.post("/turn", async (req, res) => {
  const { battleId, actions: rawActions } = req.body as {
    battleId: string;
    actions: DeclaredAction[];
  };

  const battle = battleStore.get(battleId);
  if (!battle) return res.status(404).json({ error: "battle not found" });

  const current = battle.currentPlayerId;
  const enemy = current === "P1" ? "P2" : "P1";
  const pool = battle.energy[current];
  const results: any[] = [];

  // === limitar 3 ações totais e 1 por personagem ===
  const perChar: Record<string, boolean> = {};
  let usedCount = 0;
  const actions: DeclaredAction[] = [];
  for (const a of rawActions ?? []) {
    if (usedCount >= 3) continue;
    if (perChar[a.source.charId]) continue;
    actions.push(a);
    perChar[a.source.charId] = true;
    usedCount++;
  }

  for (const a of actions) {
    const srcP = battle.players.find((p) => p.id === a.source.playerId);
    const tgtP = battle.players.find((p) => p.id === a.target.playerId);
    if (!srcP || !tgtP) continue;

    const srcC = srcP.characters.find((c) => c.id === a.source.charId && c.alive);
    const tgtC = tgtP.characters.find((c) => c.id === a.target.charId && c.alive);
    if (!srcC || !tgtC) continue;

    const skill = srcC.skills.find((s) => s.id === a.skillId);
    if (!skill) continue;

    // === Regra de alvo ===
    const friendly = a.source.playerId === a.target.playerId;
    const healingSkills = ["heal", "buff", "shield"];
    const offensiveSkills = ["attack", "control", "damage"];
    if (healingSkills.includes(skill.kind) && !friendly) continue;
    if (offensiveSkills.includes(skill.kind) && friendly) continue;

    if (!hasEnergy(pool, skill.cost)) {
      results.push({ ok: false, reason: "no-energy", need: skill.cost, action: a });
      continue;
    }

    consumeEnergy(pool, skill.cost);

    if (skill.kind === "attack" || skill.kind === "damage" || skill.kind === "control") {
      tgtC.hp = Math.max(0, tgtC.hp - skill.power);
      if (tgtC.hp === 0) tgtC.alive = false;
      results.push({
        ok: true,
        type: "damage",
        amount: skill.power,
        target: tgtC.id,
        skill: skill.id,
      });
    } else if (skill.kind === "heal" || skill.kind === "buff" || skill.kind === "shield") {
      srcC.hp = Math.min(srcC.maxHp, srcC.hp + skill.power);
      results.push({
        ok: true,
        type: "heal",
        amount: skill.power,
        target: srcC.id,
        skill: skill.id,
      });
    }
  }

  // === energia aleatória ao final ===
  grantRandomEnergy(battle.energy["P1"], 1);
  grantRandomEnergy(battle.energy["P2"], 1);

  battle.turn += 1;
  battle.currentPlayerId = enemy;

  try {
    await prisma.battle.create({
      data: { player1: 1, player2: 2, state: battle as any },
    });
  } catch (_) {}

  res.json({ battle, results });
});

export default router;
