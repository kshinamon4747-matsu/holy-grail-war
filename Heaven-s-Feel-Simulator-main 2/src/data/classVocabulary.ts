import type { ServantClass } from "./types";

export interface ClassVocab {
  /** 武器名 — テンプレートの {무기} に入る */
  weapon: string;
  weaponAlt: string;
  /** 攻撃を表す名詞 — 「{A}の{동사}が…」の形で使う */
  verb: string;
  verbAlt: string;
  style: string;
}

export const CLASS_VOCABULARY: Partial<Record<ServantClass, ClassVocab>> = {
  Saber: { weapon: "剣", weaponAlt: "聖剣", verb: "斬撃", verbAlt: "振り下ろす", style: "剣術" },
  Archer: { weapon: "矢", weaponAlt: "飛び道具", verb: "射撃", verbAlt: "貫く", style: "射撃" },
  Lancer: { weapon: "槍", weaponAlt: "長槍", verb: "刺突", verbAlt: "すれ違う", style: "槍術" },
  Rider: { weapon: "戦車", weaponAlt: "乗騎", verb: "突進", verbAlt: "疾走する", style: "騎乗" },
  Caster: { weapon: "魔術", weaponAlt: "呪文", verb: "魔術", verbAlt: "発動する", style: "魔術" },
  Assassin: { weapon: "短剣", weaponAlt: "毒", verb: "奇襲", verbAlt: "気配なく", style: "暗殺" },
  Berserker: { weapon: "拳", weaponAlt: "武器", verb: "猛打", verbAlt: "踏み潰す", style: "狂乱" },
  Ruler: { weapon: "旗", weaponAlt: "聖遺物", verb: "宣告", verbAlt: "裁く", style: "統治" },
  Avenger: { weapon: "怨念", weaponAlt: "黒炎", verb: "呪詛", verbAlt: "呪う", style: "復讐" },
  Shielder: { weapon: "盾", weaponAlt: "城壁", verb: "盾撃", verbAlt: "守る", style: "防御" },
};

export function getVocab(servantClass: ServantClass): ClassVocab {
  return CLASS_VOCABULARY[servantClass] ?? {
    weapon: "武器", weaponAlt: "力", verb: "攻撃", verbAlt: "襲いかかる", style: "戦闘",
  };
}
