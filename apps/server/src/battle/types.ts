/**
 * Núcleo de tipos do sistema 3x3 — energia é do JOGADOR (carteira única).
 * Regras incluídas:
 * - Ganho: 1 energia BASE por PERSONAGEM VIVO do jogador por turno (máx 3).
 * - Cores: base = branco, verde, vermelho, azul. preto = conversão. laranja = 3 iguais -> 1 laranja.
 * - Itens: máx 3 por TIME, máx 2 por PERSONAGEM.
 * - Cada personagem: 4 skills ativas + 1 passiva.
 * Árvores/habilidades especiais: placeholders (desativado por enquanto).
 */

export type ID = string;

export enum Color {
  White = "white",
  Green = "green",
  Red = "red",
  Blue = "blue",
  Black = "black",     // só via conversão
  Orange = "orange",   // lendária: só via 3 iguais -> 1 laranja
}

export const BASE_COLORS: Color[] = [
  Color.White,
  Color.Green,
  Color.Red,
  Color.Blue,
];

// pool de energia por cor (carteira do JOGADOR)
export type EnergyPool = Partial<Record<Color, number>>;

// custo por cor
export type Cost = Partial<Record<Color, number>>;

// limites de itens
export const ITEM_LIMITS = {
  perTeam: 3,
  perCharacter: 2,
} as const;

// tipos de alvo/efeito básicos (MVP)
export type TargetType = "self" | "ally" | "enemy" | "allyTeam" | "enemyTeam" | "any";
export type SkillKind =
  | "attack"
  | "buff"
  | "shield"
  | "trap"
  | "cleanse"
  | "utility";

// Passiva: executa sozinha (gatilhos definidos no motor depois)
export interface Passive {
  id: string;
  name: string;
  description?: string;
  // Futuro: vieses de ganho de energia por cor (desativado)
  // energyBias?: Partial<Record<Color, number>>;
  disabled?: boolean;
}

// Skill ativa: exige custo e entra na fila
export interface Skill {
  id: string;
  name: string;
  kind: SkillKind;
  cost: Cost;                // ex: { blue:1, black:1 }
  cooldown: number;          // em turnos
  target: TargetType;
  description?: string;
  // prioridade de resolução dentro do turno (armadilhas > proteções > ataques, etc.)
  priority?: number;
  // flags utilitárias
  isTrap?: boolean;
  isArea?: boolean;
  // Futuro: tags de dano (fisico/magico/poke/dot/burst)
  // tags?: string[];
}

// Template “estático” do personagem (o design/base do campeão)
export interface CharacterTemplate {
  role: "tank" | "mago" | "adc" | "suporte" | "assassino" | "evasivo";
  baseHp: number;       // ex: 7000 (ADC), 10000 (Tank), etc.
  baseDamage: number;   // ex: 1500–2500
  passive?: Passive;
  skills: [Skill, Skill, Skill, Skill]; // exatamente 4
  itemSlotsMax?: 2;     // fixado em 2; pode deixar explícito
}

// Estado dinâmico em BATALHA (por cópia do personagem do usuário)
export interface CharacterState {
  id: ID;               // id único na batalha
  templateId?: ID;      // opcional: referência ao template/base
  name: string;
  role: CharacterTemplate["role"];
  hp: number;
  maxHp: number;
  cooldowns: Record<string, number>; // skillId -> turnos restantes
  items: ID[];          // itens equipados neste match
  alive: boolean;
}

// Jogador controla até 3 personagens e possui a CARTEIRA DE ENERGIA
export interface PlayerState {
  id: ID;
  name: string;
  characters: [CharacterState, CharacterState, CharacterState];
  teamItemsRemain: number; // começa em 3; vai diminuindo ao usar
  energy: EnergyPool;      // <<< carteira única do jogador
  // Futuro: viés de sorte global de energia do time
  // teamEnergyBias?: Partial<Record<Color, number>>;
}

// Ação declarada entra na fila e só vale ao “Passar Turno” (ou timeout)
export interface Action {
  id: ID;
  actorId: ID;       // CharacterState.id
  skillId: ID;       // Skill.id
  targets: ID[];     // CharacterState.id dos alvos
  declaredAt: number;// timestamp
}

// Configurações da batalha
export interface BattleConfig {
  baseTurnDurationSec: number;      // ex: 60
  firstMoverInitialEnergyTotal: 1;  // rodada 1: quem joga primeiro recebe só 1 no total
  // regra de ganho por turno:
  // “1 energia BASE por personagem VIVO por turno” (máx 3)
  energyPerLivingCharacterPerTurn: 1;
  allowBlackFromRandom?: false;     // preto NÃO vem do aleatório
  allowOrangeFromRandom?: false;    // laranja NÃO vem do aleatório
}

// Fila de ações
export interface ActionQueueEntry {
  action: Action;
  priority: number; // resolvido do menor para o maior (armadilhas podem ter prioridade menor)
}

// Estado global da batalha
export interface BattleState {
  id: ID;
  turn: number;               // começa em 1
  currentPlayerId: ID;        // quem atua agora
  players: [PlayerState, PlayerState];
  queue: ActionQueueEntry[];  // fila do turno corrente
  startedAt: number;
  lastTickAt: number;
  rngSeed?: string;
  config: BattleConfig;
  finished?: boolean;
  winnerPlayerId?: ID;
}

/**
 * Notas:
 * - Ganho de energia é CREDITADO na carteira do JOGADOR (não no personagem).
 * - Pagamento de custo de skills sempre debita da carteira do JOGADOR atual.
 * - Conversões:
 *   - Preto: só via conversão 1:1 de cor base.
 *   - Laranja: 3 iguais -> 1 laranja.
 * - Execução:
 *   - Ação só é válida quando “passar a vez” (ou timeout).
 */
