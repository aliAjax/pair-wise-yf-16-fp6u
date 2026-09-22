// 领域类型定义：只描述雪板调校工单的数据形态，不包含任何存储与界面逻辑。

export const BOARD_SHAPES = ["全地域", "公园板", "竞速板", "粉雪板"] as const;
export type BoardShape = (typeof BOARD_SHAPES)[number];

/**
 * 工单阶段：
 * - pending_review 待复核（刚创建，或复核通过后关键参数被改动）
 * - reviewed       复核通过（刃角已复核，等待完工）
 * - completed      已完工（已交付前的完工状态）
 * - delivered      已交付
 */
export const ORDER_STAGES = [
  "pending_review",
  "reviewed",
  "completed",
  "delivered",
] as const;
export type OrderStage = (typeof ORDER_STAGES)[number];

export const STAGE_LABELS: Record<OrderStage, string> = {
  pending_review: "待复核",
  reviewed: "复核通过",
  completed: "已完工",
  delivered: "已交付",
};

/** 底板上的损伤修补位置标记，坐标为相对底板的百分比 0~100 */
export interface DamageMark {
  id: string;
  x: number;
  y: number;
  note: string;
  createdAt: string;
}

/** 刃角参数：底刃角度与侧刃角度（度） */
export interface EdgeAngles {
  base: number;
  side: number;
}

/** 刃角复核记录，复核通过时生成；关键参数改动后随阶段一起清空 */
export interface ReviewRecord {
  at: string;
  reviewer: string;
  /** 复核时刻的刃角快照 */
  angles: EdgeAngles;
  note: string;
}

export interface HistoryEvent {
  at: string;
  type: "created" | "reviewed" | "invalidated" | "completed" | "delivered";
  detail: string;
}

export interface WorkOrder {
  id: string;
  customer: string;
  brand: string;
  lengthCm: number;
  shape: BoardShape;
  preference: string;
  edgeAngles: EdgeAngles;
  waxType: string;
  /** true 表示已勾选“无底板损伤”，与损伤标记二选一满足复核前置条件 */
  noDamage: boolean;
  damageMarks: DamageMark[];
  stage: OrderStage;
  review: ReviewRecord | null;
  events: HistoryEvent[];
  createdAt: string;
  updatedAt: string;
}

export type StageFilter = OrderStage | "all";

export const STAGE_FILTERS: { value: StageFilter; label: string }[] = [
  { value: "all", label: "全部工单" },
  { value: "pending_review", label: "待复核" },
  { value: "reviewed", label: "复核通过" },
  { value: "completed", label: "已完工" },
  { value: "delivered", label: "已交付" },
];
