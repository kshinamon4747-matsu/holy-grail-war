/**
 * 서번트 대사 시스템
 * Atlas Academy에서 크롤링한 대사 데이터를 로드하고 조회한다.
 * - 소환(summon), 배틀 개시(battleStart), 보구 영창(npChant),
 *   전투 불능(defeat), 승리(victory)
 */

// ─── 타입 ───

export interface ServantDialogueData {
  summon: string[];
  battleStart: string[];
  npChant: string[];
  defeat: string[];
  victory: string[];
}

export type DialogueType = keyof ServantDialogueData;

// ─── データ読み込み ───

import dialoguesJa from "./dialogues-ja.json";

const dialogues = dialoguesJa as unknown as Record<string, ServantDialogueData>;

// ─── 取得API ───

/** サーヴァントIDからセリフデータを取得 */
export function getDialogue(servantId: number): ServantDialogueData | null {
  return dialogues[String(servantId)] ?? null;
}

/** [image ...] 태그 제거 (버서커 언어 등 Atlas Academy 메타데이터) */
function cleanDialogueText(text: string): string {
  return text.replace(/\[image [^\]]+\]/g, "").trim();
}

/** 특정 타입의 대사 중 랜덤 하나 선택 */
export function pickDialogue(servantId: number, type: DialogueType): string | null {
  const d = getDialogue(servantId);
  if (!d) return null;
  const pool = d[type];
  if (!pool || pool.length === 0) return null;
  const raw = pool[Math.floor(Math.random() * pool.length)];
  const cleaned = cleanDialogueText(raw);
  return cleaned.length > 0 ? cleaned : null;
}
