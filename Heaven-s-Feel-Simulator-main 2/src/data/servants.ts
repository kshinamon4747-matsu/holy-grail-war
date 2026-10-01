import type { Servant } from "./types";
import data from "./servants-ja.json";

// 水着・ハロウィン・サンタなど、季節/イベント限定の派生サーヴァントのID
const EXCLUDED_IDS = new Set([
  // 夏(水着)
  128, 129, 130, 131, 132, 133, 134, 135, 175, 176, 177, 178, 179,
  180, 181, 182, 216, 217, 218, 219, 220, 221, 222, 261, 262, 263,
  264, 265, 266, 267, 285, 286, 287, 288, 289, 290, 291, 318, 319,
  320, 321, 323, 354, 355, 356, 357, 358, 386, 387, 388, 390, 391, 392,
  // サンタ
  73, 141, 197, 271, 301, 330, 401, 430,
  // 旧: 韓国語の名前パターンで除外していたもの(ハロウィン/ブレイブ/シンデレラ/サンバ・サンタ/メカエリチャン)
  61, 138, 190, 191, 233, 326,
]);

export function filterServants(allServants: Servant[]): Servant[] {
  return allServants.filter((s) => !EXCLUDED_IDS.has(s.id));
}

const allServants: Servant[] = data as Servant[];
const servants: Servant[] = filterServants(allServants);

export default servants;
