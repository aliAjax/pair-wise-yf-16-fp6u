import type {
  DamageKind,
  DamageMark,
  EdgeAngle,
  NewOrderInput,
  WorkOrder,
} from "./types";
import { clamp, uid } from "./utils";

/** 刃角合理范围 */
export const SIDE_EDGE_MIN = 85;
export const SIDE_EDGE_MAX = 90;
export const BASE_EDGE_MIN = 0;
export const BASE_EDGE_MAX = 3;

export function edgeChanged(a: EdgeAngle, b: EdgeAngle): boolean {
  return a.side !== b.side || a.base !== b.base;
}

/** 底板损伤已标记修补位置（含"底板无损伤免检点"）才可登记刃角复核 */
export function canRegisterReview(order: WorkOrder): boolean {
  return order.marks.length > 0;
}

/**
 * 改动刃角或客户偏好后，原复核失效，回到待复核。
 * 修补标记/打蜡/品牌等其它信息变更不影响复核。
 */
export function recomputeReview(order: WorkOrder): WorkOrder {
  if (!order.review) return order;
  const invalidated =
    edgeChanged(order.review.edge, order.edge) ||
    order.review.preference !== order.preference;
  return invalidated ? { ...order, review: null } : order;
}

export function validateOrderInput(input: NewOrderInput): string | null {
  if (!input.customer.trim()) return "请填写客户姓名";
  if (!input.brand.trim()) return "请填写雪板品牌";
  if (!Number.isFinite(input.length) || input.length <= 0)
    return "请填写有效的雪板长度（cm）";
  if (!input.preference.trim()) return "请填写客户偏好";
  if (
    !Number.isFinite(input.edge.side) ||
    input.edge.side < SIDE_EDGE_MIN ||
    input.edge.side > SIDE_EDGE_MAX
  )
    return `侧刃角度需在 ${SIDE_EDGE_MIN}° ~ ${SIDE_EDGE_MAX}° 之间`;
  if (
    !Number.isFinite(input.edge.base) ||
    input.edge.base < BASE_EDGE_MIN ||
    input.edge.base > BASE_EDGE_MAX
  )
    return `底刃角度需在 ${BASE_EDGE_MIN}° ~ ${BASE_EDGE_MAX}° 之间`;
  return null;
}

/** 同一客户已有未交付雪板时，拒绝新工单（未交付 = 含待复核与复核通过） */
export function findOpenOrderFor(
  orders: WorkOrder[],
  customer: string
): WorkOrder | null {
  const name = customer.trim().toLowerCase();
  return (
    orders.find(
      (o) => !o.delivered && o.customer.trim().toLowerCase() === name
    ) ?? null
  );
}

export function createOrder(input: NewOrderInput, seq: number): WorkOrder {
  return {
    id: `ORD-${String(seq).padStart(3, "0")}`,
    customer: input.customer.trim(),
    brand: input.brand.trim(),
    length: Math.round(input.length),
    boardType: input.boardType,
    preference: input.preference.trim(),
    wax: input.wax,
    edge: {
      side: clamp(
        Math.round(input.edge.side * 10) / 10,
        SIDE_EDGE_MIN,
        SIDE_EDGE_MAX
      ),
      base: clamp(
        Math.round(input.edge.base * 10) / 10,
        BASE_EDGE_MIN,
        BASE_EDGE_MAX
      ),
    },
    marks: [],
    review: null,
    delivered: false,
    createdAt: new Date().toISOString(),
  };
}

/** 编辑未交付工单的基础字段；刃角/偏好改动会使复核失效 */
export function patchOrder(
  order: WorkOrder,
  patch: Partial<
    Pick<
      WorkOrder,
      "brand" | "length" | "boardType" | "preference" | "wax" | "edge"
    >
  >
): WorkOrder {
  if (order.delivered) return order;
  const next: WorkOrder = { ...order, ...patch };
  if (typeof next.brand === "string") next.brand = next.brand.trim();
  if (typeof next.preference === "string")
    next.preference = next.preference.trim();
  if (typeof next.length === "number") next.length = Math.round(next.length);
  return recomputeReview(next);
}

/** 登记刃角复核通过：必须先标记底板修补位置，并保存当前刃角/偏好快照 */
export function registerReview(order: WorkOrder): WorkOrder {
  if (order.delivered || order.review || !canRegisterReview(order)) {
    return order;
  }
  return {
    ...order,
    review: {
      at: new Date().toISOString(),
      edge: { ...order.edge },
      preference: order.preference,
    },
  };
}

/** 已复核通过的工单才能交付 */
export function deliverOrder(order: WorkOrder): WorkOrder {
  if (order.delivered || !order.review) return order;
  return { ...order, delivered: true, deliveredAt: new Date().toISOString() };
}

export function zoneName(x: number, y: number): string {
  const section = x < 33 ? "板尾" : x > 67 ? "板头" : "中部";
  const side = y < 38 ? "刃侧" : y > 62 ? "刃侧" : "中央";
  return `${section}${side}`;
}

/** 在底板示意图上添加损伤标记；免检点每块底板至多一个 */
export function addMark(
  order: WorkOrder,
  point: { x: number; y: number },
  kind: DamageKind
): WorkOrder {
  if (order.delivered) return order;
  if (kind === "clear" && order.marks.some((m) => m.kind === "clear")) {
    return order;
  }
  const mark: DamageMark = {
    id: uid("mk"),
    x: clamp(point.x, 2, 98),
    y: clamp(point.y, 10, 90),
    note:
      kind === "clear"
        ? "底板无损伤·免检点"
        : `${zoneName(point.x, point.y)}待修补`,
    repaired: false,
    kind,
  };
  return { ...order, marks: [...order.marks, mark] };
}

export function patchMark(
  order: WorkOrder,
  markId: string,
  patch: Partial<Pick<DamageMark, "note" | "repaired">>
): WorkOrder {
  if (order.delivered) return order;
  return {
    ...order,
    marks: order.marks.map((m) =>
      m.id === markId ? { ...m, ...patch } : m
    ),
  };
}

export function removeMark(order: WorkOrder, markId: string): WorkOrder {
  if (order.delivered) return order;
  return { ...order, marks: order.marks.filter((m) => m.id !== markId) };
}

export type StatusFilter = "active" | "pending" | "passed" | "delivered";

export const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "active", label: "全部进行中" },
  { key: "pending", label: "待复核" },
  { key: "passed", label: "复核通过" },
  { key: "delivered", label: "完工交付" },
];

export function matchesStatus(o: WorkOrder, filter: StatusFilter): boolean {
  switch (filter) {
    case "active":
      return !o.delivered;
    case "pending":
      return !o.delivered && !o.review;
    case "passed":
      return !o.delivered && o.review !== null;
    case "delivered":
      return o.delivered;
  }
}

export function statusOf(o: WorkOrder): "pending" | "passed" | "delivered" {
  if (o.delivered) return "delivered";
  return o.review ? "passed" : "pending";
}

export const STATUS_LABEL: Record<
  ReturnType<typeof statusOf>,
  string
> = {
  pending: "待复核",
  passed: "复核通过",
  delivered: "已交付",
};

export function sortOrders(orders: WorkOrder[]): WorkOrder[] {
  return [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export interface Metrics {
  pending: number;
  delivered: number;
  avgSideEdge: number;
  repairCount: number;
}

export function computeMetrics(orders: WorkOrder[]): Metrics {
  const active = orders.filter((o) => !o.delivered);
  const repairCount = orders
    .flatMap((o) => o.marks)
    .filter((m) => m.kind === "repair").length;
  const avgSideEdge = active.length
    ? active.reduce((sum, o) => sum + o.edge.side, 0) / active.length
    : 0;
  return {
    pending: active.filter((o) => !o.review).length,
    delivered: orders.filter((o) => o.delivered).length,
    avgSideEdge: Math.round(avgSideEdge * 10) / 10,
    repairCount,
  };
}

export function nextSeq(orders: WorkOrder[]): number {
  return orders.reduce((max, o) => {
    const n = Number(o.id.replace(/\D/g, ""));
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, 100) + 1;
}
