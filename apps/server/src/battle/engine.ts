	import { Skill, EnergyCost } from "./types";

export function calculateSkillCost(skill: Skill): EnergyCost {
  // Sistema atualizado baseado em nomes completos (RED, BLUE, WHITE, GREEN)
  const cost: EnergyCost = { RED: 0, BLUE: 0, WHITE: 0, GREEN: 0 };

  if (Array.isArray(skill.cost)) {
    for (const c of skill.cost) {
      if (cost[c as keyof EnergyCost] !== undefined) {
        cost[c as keyof EnergyCost]++;
      }
    }
  } else if (typeof skill.cost === "object" && skill.cost !== null) {
    Object.assign(cost, skill.cost);
  }

  return cost;
}

// Função principal de inicialização da batalha
export function initBattle(player1Id: string, player2Id: string) {
  const defaultCharacters = (ownerId: string) => [
    {
      id: `${ownerId}-char1`,
      name: "Arcanus",
      role: "mago",
      hp: 100,
      maxHp: 100,
      skills: [
        { id: "s1", name: "Fire Punch", cost: ["RED"], power: 25 },
        { id: "s2", name: "Water Shield", cost: ["BLUE"], power: 20 },
        { id: "s3", name: "Holy Heal", cost: ["WHITE"], power: 15 },
        { id: "s4", name: "Nature Surge", cost: ["GREEN"], power: 30 },
      ],
    },
    {
      id: `${ownerId}-char2`,
      name: "Valkyra",
      role: "tank",
      hp: 120,
      maxHp: 120,
      skills: [
        { id: "s1", name: "Shield Slam", cost: ["RED"], power: 20 },
        { id: "s2", name: "Guardian Wave", cost: ["BLUE"], power: 25 },
        { id: "s3", name: "Heal Aura", cost: ["WHITE"], power: 10 },
        { id: "s4", name: "Nature Guard", cost: ["GREEN"], power: 15 },
      ],
    },
    {
      id: `${ownerId}-char3`,
      name: "Sylva",
      role: "adc",
      hp: 90,
      maxHp: 90,
      skills: [
        { id: "s1", name: "Leaf Shot", cost: ["GREEN"], power: 25 },
        { id: "s2", name: "Magic Arrow", cost: ["BLUE"], power: 20 },
        { id: "s3", name: "Sacred Light", cost: ["WHITE"], power: 15 },
        { id: "s4", name: "Wild Strike", cost: ["RED"], power: 30 },
      ],
    },
  ];

    const battle = {
    players: [
      {
        id: player1Id,
        name: "Jogador 1",
        characters: defaultCharacters(player1Id).map((c) => ({
          ...c,
          skills: c.skills.map((s) => ({
            ...s,
            cost: calculateSkillCost(s), // ✅ converte nomes em custo real
          })),
        })),
        energy: { RED: 1, BLUE: 1, WHITE: 1, GREEN: 1 }, // saldo inicial
      },
      {
        id: player2Id,
        name: "Jogador 2",
        characters: defaultCharacters(player2Id).map((c) => ({
          ...c,
          skills: c.skills.map((s) => ({
            ...s,
            cost: calculateSkillCost(s),
          })),
        })),
        energy: { RED: 1, BLUE: 1, WHITE: 1, GREEN: 1 },
      },
    ],
    currentPlayerId: player1Id,
    turn: 1,
    log: ["Batalha iniciada."],
  };

  return battle;
}

// Função utilitária para gerar energia aleatória
function randomEnergy(): keyof EnergyCost {
  const colors: (keyof EnergyCost)[] = ["RED", "BLUE", "WHITE", "GREEN"];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function nextTurn(battle: any) {
  const current = battle.currentPlayerId;
  const nextPlayer =
    battle.players.find((p: any) => p.id !== current)?.id ?? current;

  // Incrementa o contador de turno
  battle.turn += 1;
  battle.currentPlayerId = nextPlayer;

  // Controle de energia gerada para log
  const turnReport: string[] = [];

  // Geração de energia conforme turno
  battle.players.forEach((p: any, idx: number) => {
    const vivos = p.characters?.filter((c: any) => c.hp > 0) ?? [];
    const ganhos: Record<string, number> = { RED: 0, BLUE: 0, WHITE: 0, GREEN: 0 };

    // Primeiro turno → apenas o jogador inicial ganha
    if (battle.turn === 2 && idx === 0) {
      vivos.forEach(() => {
        const e = randomEnergy();
        p.energy[e]++;
        ganhos[e]++;
      });
    }

    // Turnos seguintes → todos ganham
    if (battle.turn > 2) {
      vivos.forEach(() => {
        const e = randomEnergy();
        p.energy[e]++;
        ganhos[e]++;
      });
    }

    // adiciona ao relatório de log
    const ganhosTxt = Object.entries(ganhos)
      .filter(([_, v]) => v > 0)
      .map(([k, v]) => `${k}+${v}`)
      .join(", ");

    if (ganhosTxt)
      turnReport.push(`🟢 ${p.name} ganhou ${ganhosTxt}`);
  });

  // Atualiza energia global (HUD)
  battle.energy = {};
  battle.players.forEach((p: any) => {
    battle.energy[p.id] = { ...p.energy };
  });

  // Log do turno
  battle.log.push(`🔁 Início do turno ${battle.turn}`);
  if (turnReport.length > 0) {
    battle.log.push(...turnReport);
  } else {
    battle.log.push("⚠️ Nenhum ganho de energia neste turno");
  }

  return battle;
}
