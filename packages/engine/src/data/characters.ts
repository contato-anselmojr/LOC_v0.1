import type { ActiveSkill } from "../types/core";

/** Definições globais de personagens e seus kits (única fonte de verdade). */
export type CharacterDef = {
  name: string;
  maxHp: number;
  tags: string[];
  kit: ActiveSkill[];
};

/** Conjunto A–F para o MVP, com cooldowns e custos explícitos. */
export const CHARACTERS: Record<string, CharacterDef> = {
  A: {
    name: "Aria",
    maxHp: 1000,
    tags: ["Mago", "Raio"],
    kit: [
      { id: "aria_1", name: "Raio",     cooldown: 2, target: "ENEMY", effects: [{ kind: "DANO", value: 80 }],                cost: { AZUL: 1 } },
      { id: "aria_2", name: "Barreira", cooldown: 3, target: "SELF",  effects: [{ kind: "ESCUDO", value: 70 }],              cost: { VERDE: 1 } },
      { id: "aria_3", name: "Atordoar", cooldown: 3, target: "ENEMY", effects: [{ kind: "STUN", duration: 1 }],              cost: { BRANCO: 1 } },
      { id: "aria_4", name: "Marca",    cooldown: 2, target: "ENEMY", effects: [{ kind: "MARCACAO", duration: 2 }],          cost: { PRETA: 1 } },
    ],
  },
  B: {
    name: "Brom",
    maxHp: 1200,
    tags: ["Guardião", "Físico"],
    kit: [
      { id: "brom_1", name: "Golpe",  cooldown: 2, target: "ENEMY", effects: [{ kind: "DANO", value: 80 }],                   cost: { VERMELHO: 1 } },
      { id: "brom_2", name: "Guarda", cooldown: 3, target: "SELF",  effects: [{ kind: "ESCUDO", value: 70 }],                cost: { VERDE: 1 } },
      { id: "brom_3", name: "Silêncio", cooldown: 3, target: "ENEMY", effects: [{ kind: "SILENCE", duration: 1 }],           cost: { BRANCO: 1 } },
      { id: "brom_4", name: "Bênção", cooldown: 4, target: "ALLY",  effects: [{ kind: "HOT", value: 20, duration: 3 }],      cost: { VERDE: 1 } },
    ],
  },
  C: {
    name: "Cyra",
    maxHp: 1100,
    tags: ["Arqueira", "Cura"],
    kit: [
      { id: "cyra_1", name: "Flecha", cooldown: 2, target: "ENEMY", effects: [{ kind: "DANO", value: 80 }],                   cost: { VERMELHO: 1 } },
      { id: "cyra_2", name: "Cura",   cooldown: 4, target: "ALLY",  effects: [{ kind: "HOT", value: 20, duration: 3 }],      cost: { VERDE: 1 } },
      { id: "cyra_3", name: "Atordoar", cooldown: 3, target: "ENEMY", effects: [{ kind: "STUN", duration: 1 }],              cost: { BRANCO: 1 } },
      { id: "cyra_4", name: "Dreno",  cooldown: 2, target: "ENEMY", effects: [{ kind: "DANO", value: 80 }],                   cost: { PRETA: 1 } },
    ],
  },
  D: {
    name: "Dax",
    maxHp: 1100,
    tags: ["Berserker", "Fogo"],
    kit: [
      { id: "dax_1", name: "Impacto",   cooldown: 2, target: "ENEMY", effects: [{ kind: "DANO", value: 80 }],                 cost: { VERMELHO: 1 } },
      { id: "dax_2", name: "Proteção",  cooldown: 3, target: "SELF",  effects: [{ kind: "ESCUDO", value: 70 }],              cost: { AZUL: 1 } },
      { id: "dax_3", name: "Calar Voz", cooldown: 3, target: "ENEMY", effects: [{ kind: "SILENCE", duration: 1 }],           cost: { BRANCO: 1 } },
      { id: "dax_4", name: "Chama",     cooldown: 4, target: "ENEMY", effects: [{ kind: "DOT", value: 20, duration: 3 }],    cost: { VERMELHO: 1 } },
    ],
  },
  E: {
    name: "Edda",
    maxHp: 1050,
    tags: ["Bardo", "Suporte"],
    kit: [
      { id: "edda_1", name: "Lâmina",   cooldown: 2, target: "ENEMY", effects: [{ kind: "DANO", value: 80 }],                 cost: { VERMELHO: 1 } },
      { id: "edda_2", name: "Bênção",   cooldown: 4, target: "ALLY",  effects: [{ kind: "HOT", value: 20, duration: 3 }],    cost: { VERDE: 1 } },
      { id: "edda_3", name: "Atordoar", cooldown: 3, target: "ENEMY", effects: [{ kind: "STUN", duration: 1 }],              cost: { BRANCO: 1 } },
      { id: "edda_4", name: "Barreira", cooldown: 3, target: "ALLY",  effects: [{ kind: "ESCUDO", value: 70 }],              cost: { AZUL: 1 } },
    ],
  },
  F: {
    name: "Faye",
    maxHp: 1000,
    tags: ["Versátil"],
    kit: [
      { id: "faye_1", name: "Raio",     cooldown: 2, target: "ENEMY", effects: [{ kind: "DANO", value: 80 }],                 cost: { AZUL: 1 } },
      { id: "faye_2", name: "Cura",     cooldown: 4, target: "ALLY",  effects: [{ kind: "HOT", value: 20, duration: 3 }],    cost: { VERDE: 1 } },
      { id: "faye_3", name: "Silêncio", cooldown: 3, target: "ENEMY", effects: [{ kind: "SILENCE", duration: 1 }],           cost: { BRANCO: 1 } },
      { id: "faye_4", name: "Marca",    cooldown: 2, target: "ENEMY", effects: [{ kind: "MARCACAO", duration: 2 }],          cost: { PRETA: 1 } },
    ],
  },
};
