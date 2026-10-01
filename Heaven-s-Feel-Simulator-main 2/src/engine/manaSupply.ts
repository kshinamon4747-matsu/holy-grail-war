import type { AffectionTier } from "./affection";
import type { PersonalityTag } from "../data/servantPersonality";

// ─── 결과 타입 ───

export type ManaSupplyResult = "perfect" | "good" | "normal" | "poor" | "critical_fail";

export interface ManaSupplyOutcome {
  result: ManaSupplyResult;
  statDelta: number;      // 스탯 점수 변화 (+4 ~ -2)
  affectionDelta: number; // 호감도 변화
  narration: string;      // 3인칭 묘사
}

// ─── 해금 조건 ───

export function isManaSupplyUnlocked(tier: AffectionTier): boolean {
  return tier === "trusting" || tier === "intimate" || tier === "devoted";
}

// ─── 확률표 ───

type ProbabilityTable = Record<ManaSupplyResult, number>;

const PROBABILITY_TABLES: Partial<Record<AffectionTier, ProbabilityTable>> = {
  trusting: { perfect: 0.10, good: 0.35, normal: 0.35, poor: 0.15, critical_fail: 0.05 },
  intimate: { perfect: 0.25, good: 0.40, normal: 0.25, poor: 0.08, critical_fail: 0.02 },
  devoted:  { perfect: 0.40, good: 0.35, normal: 0.20, poor: 0.05, critical_fail: 0.00 },
};

// ─── 결과별 효과 ───

const RESULT_EFFECTS: Record<ManaSupplyResult, { statDelta: number; affectionDelta: number }> = {
  perfect:       { statDelta: 4,  affectionDelta: 5 },
  good:          { statDelta: 2,  affectionDelta: 2 },
  normal:        { statDelta: 1,  affectionDelta: 0 },
  poor:          { statDelta: 0,  affectionDelta: -2 },
  critical_fail: { statDelta: -2, affectionDelta: -5 },
};

// ─── 판정 ───

export function rollManaSupply(
  personality: PersonalityTag,
  tier: AffectionTier,
  servantName: string,
  servantId: number,
): ManaSupplyOutcome {
  // 확률표가 없는 경우 (약화 상태로 해금됨 등) neutral 테이블 사용
  const FALLBACK_TABLE: ProbabilityTable = { perfect: 0.05, good: 0.20, normal: 0.45, poor: 0.20, critical_fail: 0.10 };
  const table = PROBABILITY_TABLES[tier] ?? FALLBACK_TABLE;

  // 확률 롤
  const roll = Math.random();
  let cumulative = 0;
  let result: ManaSupplyResult = "normal";
  for (const [key, prob] of Object.entries(table) as [ManaSupplyResult, number][]) {
    cumulative += prob;
    if (roll < cumulative) {
      result = key;
      break;
    }
  }

  const effects = RESULT_EFFECTS[result];
  const narration = getNarration(personality, result, servantName, servantId);

  return {
    result,
    statDelta: effects.statDelta,
    affectionDelta: effects.affectionDelta,
    narration,
  };
}

// ─── 묘사 (default 성격 기반, override는 narrativeTemplates.json에서 확장 가능) ───

type NarrationPool = Record<ManaSupplyResult, string[]>;

const DEFAULT_NARRATIONS: Record<PersonalityTag, NarrationPool> = {
  assassin: {
    perfect: [
      "{name}の気配が一瞬消え、また戻ってきた。魔力が完全に満たされた。",
      "{name}が影の中で静かにうなずいた。最高の状態だ。",
    ],
    good: [
      "{name}は何も言わずに魔力を受け入れた。悪くない結果だ。",
      "{name}が音もなくその場を離れた。満足したようだ。",
    ],
    normal: [
      "{name}が気配もなく消えた。十分だったようだ。",
    ],
    poor: [
      "{name}の視線が冷たくマスターをかすめた。「次はもっとうまくやれ。」",
    ],
    critical_fail: [
      "{name}が刃をちらりと抜きかけて、また収めた。警告だ。",
    ],
  },
  cool: {
    perfect: [
      "{name}の眼差しが、以前とは明らかに変わった。",
      "{name}が「十分だ」と一言だけ残し、微笑みを見せた。",
    ],
    good: [
      "{name}が「十分だ」と一言だけ残して部屋を出ていった。",
      "{name}は満足そうに魔力の流れを確かめた。",
    ],
    normal: [
      "無難な魔力供給だった。{name}は特に何も言わず、その場を離れた。",
    ],
    poor: [
      "{name}はマスターに少し失望したようだ。",
    ],
    critical_fail: [
      "このことはなかったことにしようという、無言の合意が成立した。",
    ],
  },
  tsundere: {
    perfect: [
      "{name}が顔をそむけたが、耳が赤くなっているのは隠せなかった。",
    ],
    good: [
      "{name}が「まあ、そこそこね」と言ったが、表情は悪くない。",
    ],
    normal: [
      "{name}がため息をついた。それでも魔力は受け入れたようだ。",
    ],
    poor: [
      "{name}がマスターをじろりと睨んだ。「……次はもう少し気を遣いなさい。」",
    ],
    critical_fail: [
      "{name}が枕を投げた。顔面に直撃した。",
    ],
  },
  cheerful: {
    perfect: [
      "{name}が親指を立てた！ 最高の魔力供給だ！",
    ],
    good: [
      "{name}が親指を立てた。単純だが、気持ちのいい反応だ。",
    ],
    normal: [
      "{name}がうなずいた。「大丈夫、次はもっとうまくいくよ！」",
    ],
    poor: [
      "{name}は満足できなかったが、マスターを励ますことにしたようだ。",
    ],
    critical_fail: [
      "{name}が笑いながら「……次はもっと頑張ろうね」と言った。慰めなのか脅しなのか……",
    ],
  },
  royal: {
    perfect: [
      "{name}が初めてマスターを「臣下」ではなく「友」と呼んだ。",
    ],
    good: [
      "{name}が「合格だ」と宣言した。王の許可を得たということだ。",
    ],
    normal: [
      "{name}があくびをした。いい兆候ではなさそうだ。",
    ],
    poor: [
      "{name}が再び「雑種」という呼び方を使い始めた。",
    ],
    critical_fail: [
      "{name}が宝具をマスターに向けようとして、止めた。慈悲のようだ。",
    ],
  },
  berserker: {
    perfect: [
      "{name}の咆哮が止まった。機嫌がいいようだ。……たぶん。",
    ],
    good: [
      "{name}が静かになった。満足の印……のようだ。",
    ],
    normal: [
      "{name}が唸った。普段と変わらない。",
    ],
    poor: [
      "{name}が不機嫌そうだ。近づかないほうがよさそうだ。",
    ],
    critical_fail: [
      "{name}が壁を壊した。魔力供給が問題なのではない。生存が問題だ。",
    ],
  },
  saint: {
    perfect: [
      "{name}がマスターの手をそっと握った。神聖な魔力が互いを包んだ。",
    ],
    good: [
      "{name}が感謝の祈りを捧げた。魔力が温かく流れ込んできた。",
    ],
    normal: [
      "{name}が微笑んだ。「ありがとうございます、マスター。」",
    ],
    poor: [
      "{name}は静かにため息をついたが、マスターを責めはしなかった。",
    ],
    critical_fail: [
      "{name}がマスターのために祈っている。……救いが必要なのはマスターのほうらしい。",
    ],
  },
  avenger: {
    perfect: [
      "{name}の憎悪が一瞬止まったようだ。マスターに見せる、最大限の好意だ。",
    ],
    good: [
      "{name}がうなずいた。憎悪の炎の合間に、小さな信頼が見える。",
    ],
    normal: [
      "{name}が無表情で魔力を受け入れた。",
    ],
    poor: [
      "{name}の眼差しが冷たくなった。「……役立たずだな。」",
    ],
    critical_fail: [
      "{name}がマスターに背を向けた。信頼が大きく損なわれたようだ。",
    ],
  },
};

/** 서번트 ID별 오버라이드 (추후 narrativeTemplates.json으로 이전 가능) */
const NARRATION_OVERRIDES: Record<number, Partial<NarrationPool>> = {
  // ギルガメッシュ
  12: {
    perfect: ["英雄王が初めてマスターを「友」と呼んだ。"],
    poor: ["{name}が再び「雑種」という呼び方を使い始めた。"],
    critical_fail: ["{name}がエアをマスターに向けようとして、止めた。"],
  },
  // クー・フーリン
  17: {
    perfect: ["{name}が満面の笑みを見せた。「最高だぜ、マスター！」"],
    good: ["{name}が親指を立てた。「悪くねえな。」"],
  },
  // ジャンヌ・ダルク
  59: {
    perfect: ["{name}がマスターの手を取った。聖女の祝福が温かく包み込んでくる。"],
    critical_fail: ["{name}がマスターのために祈っている。……救いが必要なのはマスターのほうらしい。"],
  },
  // マシュ
  1: {
    perfect: ["{name}の顔が真っ赤になった。「せ……先輩……！」"],
    good: ["{name}が微笑んだ。「マスターの魔力は、いつも温かいです。」"],
  },
};

function getNarration(personality: PersonalityTag, result: ManaSupplyResult, servantName: string, servantId: number): string {
  // 1. 오버라이드 확인
  const overrides = NARRATION_OVERRIDES[servantId];
  if (overrides?.[result]?.length) {
    const pool = overrides[result]!;
    return pool[Math.floor(Math.random() * pool.length)].replace(/\{name\}/g, servantName);
  }

  // 2. 기본 성격 풀
  const pool = DEFAULT_NARRATIONS[personality][result];
  const text = pool[Math.floor(Math.random() * pool.length)];
  return text.replace(/\{name\}/g, servantName);
}

// ─── 결과 표시용 라벨 ───

export const RESULT_LABELS_JA: Record<ManaSupplyResult, string> = {
  perfect: "大満足",
  good: "満足",
  normal: "普通",
  poor: "不満足",
  critical_fail: "致命的失敗",
};

export const RESULT_COLORS: Record<ManaSupplyResult, string> = {
  perfect: "#ffd700",
  good: "#4ade80",
  normal: "#9ca3af",
  poor: "#f97316",
  critical_fail: "#ef4444",
};
