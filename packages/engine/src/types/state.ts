import { ColorAny, BASE_COLORS } from "./core";
export type EnergyPool = Record<ColorAny, number>;
export interface CharacterRuntime { id:string; hp:number; shield:number; cooldowns:Record<string,number>; effects:Array<{kind:string;value?:number;duration:number;sourceId?:string;}>; }
export interface TeamRuntime { id:string; characters:CharacterRuntime[]; items:string[]; energy:EnergyPool; }
export interface TurnSettings { turnDurationSec:number; maxActionsPerTurn:number; maxPerCharacterPerTurn:number; }
export const DEFAULT_TURN: TurnSettings = { turnDurationSec:60, maxActionsPerTurn:3, maxPerCharacterPerTurn:1 };
export interface BattleState { turnNumber:number; activeTeamId:"A"|"B"; teams:Record<"A"|"B",TeamRuntime>; settings:TurnSettings; rngSeed?:number; } // <-- FIX
export function emptyEnergy(): EnergyPool { return { AZUL:0, VERMELHO:0, VERDE:0, BRANCO:0, PRETA:0 }; }
export type BaseColor = (typeof BASE_COLORS)[number];
