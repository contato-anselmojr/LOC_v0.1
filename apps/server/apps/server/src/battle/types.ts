cat > apps/server/src/battle/types.ts <<'EOF'
export enum Color {
  Red = "red",
  Blue = "blue",
  Green = "green",
  Yellow = "yellow",
  Purple = "purple",
}

export interface Skill {
  id: string
  name: string
  kind: "attack" | "defense" | "heal" | "buff" | "debuff"
  cost: Partial<Record<Color, number>>
  cooldown: number
  target: "enemy" | "ally" | "self" | "team"
  priority: number
}

export interface CharacterState {
  id: string
  name: string
  role: string
  hp: number
  maxHp: number
  cooldowns: Record<string, number>
  items: any[]
  alive: boolean
  energy: Record<string, number>
}

export interface PlayerState {
  id: string
  name: string
  characters: CharacterState[]
  teamItemsRemain: number
  energy: Record<string, number>
}

export interface BattleConfig {
  baseTurnDurationSec: number
  firstMoverInitialEnergyTotal: number
}

export interface BattleState {
  id: string
  players: PlayerState[]
  turn: number
  currentPlayerId: string
  finished: boolean
  winnerPlayerId?: string | null
}
EOF
