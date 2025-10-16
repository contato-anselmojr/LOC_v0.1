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
