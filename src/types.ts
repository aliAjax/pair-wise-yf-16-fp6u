// 领域模型：雪板调校工单

export type BoardType = "全地域" | "公园板" | "竞速板" | "粉雪板";

export const BOARD_TYPES: BoardType[] = ["全地域", "公园板", "竞速板", "粉雪板"];

export const WAX_TYPES = ["低温蜡", "温蜡", "全温蜡", "石墨蜡", "暂不打蜡"] as const;
export type WaxType = (typeof WAX_TYPES)[number];

/** 刃角：侧刃倾角（如 88°）与底刃倾角（如 1°） */
export interface EdgeAngle {
  side: number;
  base: number;
}

/** 底板标记：repair = 损伤修补位置；clear = 底板无损伤免检点 */
export type DamageKind = "repair" | "clear";

export interface DamageMark {
  id: string;
  /** 在底板示意图上的横向位置（百分比 0-100） */
  x: number;
  /** 在底板示意图上的纵向位置（百分比 0-100） */
  y: number;
  note: string;
  repaired: boolean;
  kind: DamageKind;
}

/** 刃角复核记录；为 null 表示待复核。保存复核通过时的刃角与偏好快照 */
export interface ReviewRecord {
  at: string;
  edge: EdgeAngle;
  preference: string;
}

export interface WorkOrder {
  id: string;
  customer: string;
  brand: string;
  length: number;
  boardType: BoardType;
  preference: string;
  wax: WaxType;
  edge: EdgeAngle;
  marks: DamageMark[];
  review: ReviewRecord | null;
  delivered: boolean;
  createdAt: string;
  deliveredAt?: string;
}

export interface NewOrderInput {
  customer: string;
  brand: string;
  length: number;
  boardType: BoardType;
  preference: string;
  wax: WaxType;
  edge: EdgeAngle;
}
