export type ColorBase = "AZUL" | "VERMELHO" | "VERDE" | "BRANCO";
export type ColorAny = ColorBase | "PRETA";
export const BASE_COLORS: Readonly<ColorBase[]> = ["AZUL","VERMELHO","VERDE","BRANCO"] as const;
export type Archetype = "MAGO_DPS"|"MAGO_CONTROLE"|"TANK_EARLY"|"TANK_LATE"|"SUPORTE_CURA"|"SUPORTE_BUFF";
export interface CharacterBase { id:string; name:string; archetype:Archetype; maxHP:number; }
export type EffectKind = "DANO"|"ESCUDO"|"STUN"|"SILENCE"|"DOT"|"HOT"|"VULNERAVEL"|"RESISTENCIA"|"MARCACAO";
export interface Effect { kind:EffectKind; value?:number; duration?:number; sourceId?:string; tags?:string[]; }
export type SkillCost = { [color in ColorAny]?: number }; // <-- FIX: type alias em vez de interface
export type TargetKind = "SELF"|"ALLY"|"ALLY_TEAM"|"ENEMY"|"ENEMY_TEAM"|"ANY";
export interface ActiveSkill { id:string; name:string; description?:string; cost:SkillCost; cooldown:number; target:TargetKind; effects:Effect[]; }
export interface PassiveSkill { id:string; name:string; description?:string; }
export interface CharacterKit { actives:[ActiveSkill,ActiveSkill,ActiveSkill,ActiveSkill]; passive:PassiveSkill; }
export interface CharacterDefinition extends CharacterBase { kit:CharacterKit; }
