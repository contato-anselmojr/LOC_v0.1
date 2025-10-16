export interface EnergyCost {
  RED: number;
  BLUE: number;
  WHITE: number;
  GREEN: number;
}

export type EnergyKey = "RED" | "BLUE" | "WHITE" | "GREEN";

export interface Skill {
  name: string;
  cost: EnergyKey[] | EnergyCost;
  power: number;
}
