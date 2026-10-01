import type { RoundResult, BattleEvent } from "./types";
import { generateBattleNarrative } from "./narrativeGenerator";
import type { NarrativeContext } from "./narrativeGenerator";

// ─── 型 ───

export type NarrativeEffect = "normal" | "np_glow" | "critical" | "stealth_fade" | "elimination" | "draw" | "servant_dialogue";
export type NarrativeSpeed = "fast" | "normal" | "slow";

export interface NarrativeLine {
  text: string;
  effect: NarrativeEffect;
  speed: NarrativeSpeed;
  delay: number; // ms pause before this line
}

// ─── 意図マッチングの分類 ───

function classifyMatchup(battle: BattleEvent): NarrativeContext["intentMatchup"] {
  const { intentA, intentB } = battle;
  // 기습 체크 (ambush skill effect)
  if (battle.result.skillEffects.some(se => se.key === "ambushSuccess")) return "ambush";
  if (intentA === "hide" || intentB === "hide") return "detected";
  if (intentA === "hunt" && intentB === "hunt") return "hunt_hunt";
  if (intentA === "hunt" && intentB === "guard") return "hunt_guard";
  if (intentA === "guard" && intentB === "hunt") return "hunt_guard";
  return "hunt_hunt";
}

// ─── RoundResult → NarrativeLine[] 変換 ───

export function formatRoundNarrative(round: RoundResult): NarrativeLine[] {
  const lines: NarrativeLine[] = [];

  // 小康ラウンド
  if (round.isQuiet) {
    lines.push({
      text: `── ${round.day}日目の夜 ──`,
      effect: "normal",
      speed: "normal",
      delay: 300,
    });
    lines.push({
      text: "冬木市に静かな夜が訪れた。",
      effect: "stealth_fade",
      speed: "normal",
      delay: 500,
    });
    return lines;
  }

  // 夜の始まり
  lines.push({
    text: `── ${round.day}日目の夜 ──`,
    effect: "normal",
    speed: "normal",
    delay: 300,
  });

  // 各戦闘 — narrativeGenerator を使用
  for (const battle of round.battles) {
    const ctx: NarrativeContext = {
      servantA: battle.attacker,
      servantB: battle.defender,
      combatResult: battle.result,
      day: round.day,
      intentMatchup: classifyMatchup(battle),
    };
    lines.push(...generateBattleNarrative(ctx));
  }

  // 脱落者
  for (const eliminated of round.eliminated) {
    lines.push({
      text: `${eliminated.name}が消滅した。`,
      effect: "elimination",
      speed: "normal",
      delay: 800,
    });
  }

  return lines;
}
