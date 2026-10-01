import type { SkillPrefixes } from "../engine/types";

export const SKILL_PREFIXES: Record<string, SkillPrefixes> = {
  ja: {
    presenceConcealment: "気配遮断",
    magicResistance: "対魔力",
    itemConstruction: "道具作成",
    territoryCreation: "陣地作成",
    riding: "騎乗",
    independentAction: "単独行動",
    independentManifestation: "単独顕現",
    presenceDetection: "気配感知",
    madEnhancement: "狂化",
    divinity: "神性",
  },
};

export function getSkillPrefixes(_lang?: string): SkillPrefixes {
  return SKILL_PREFIXES.ja;
}
