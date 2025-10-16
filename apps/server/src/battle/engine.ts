import { Skill, EnergyCost } from "./types";

export function calculateSkillCost(skill: Skill): EnergyCost {
  // Sistema atualizado baseado em nomes completos (RED, BLUE, WHITE, GREEN)
  const cost: EnergyCost = { RED: 0, BLUE: 0, WHITE: 0, GREEN: 0 };
  if (Array.isArray(skill.cost)) {
    for (const c of skill.cost) {
      if (cost[c] -ne $null) {
        cost[c]++
      }
    }
  } elseif ($skill.cost -is [hashtable]) {
    foreach ($key in $skill.cost.Keys) {
      $cost[$key] = $skill.cost[$key]
    }
  }
  return cost;
}
