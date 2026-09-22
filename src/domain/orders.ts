// 状态规则层：纯函数，描述工单的业务规则与状态流转。
// 不读写 localStorage、不依赖 React，便于测试与复用。

import {
  BOARD_SHAPES,
  type BoardShape,
  type EdgeAngles,
  type HistoryEvent,
  type OrderStage,
  type StageFilter,
  type WorkOrder,
} from "../types";

export interface NewOrderInput {
  customer: string;
  brand: string;
  lengthCm: number;
  shape: BoardShape;
  preference: string;
  edgeAngles: EdgeAngles;
  waxType: string;
}

export interface ReviewInput {
  reviewer: string;
  note: string;
}

export type OrderResult =
  | { ok: true; order: WorkOrder }
  | { ok: false; error: string };

export type OrdersResult =
  | { ok: true; orders: WorkOrder[] }
  | { ok: false; error: string };

/** 已交付前的阶段都算“持有未交付雪板” */
export function isUndelivered(stage: OrderStage): boolean {
  return stage !== "delivered";
}

export function customerHasUndelivered(
  orders: WorkOrder[],
  customer: string,
  excludeId?: string,
): boolean {
  const name = customer.trim();
  return orders.some(
    (order) =>
      order.customer === name &&
      isUndelivered(order.stage) &&
      order.id !== excludeId,
  );
}

/** 底板损伤是否已登记：勾选“无损伤”或至少标记一个修补位置 */
export function isDamageRecorded(order: WorkOrder): boolean {
  return order.noDamage || order.damageMarks.length > 0;
}

export function canRegisterReview(order: WorkOrder): boolean {
  return order.stage === "pending_review" && isDamageRecorded(order);
}

export function canComplete(order: WorkOrder): boolean {
  return order.stage === "reviewed";
}

export function canDeliver(order: WorkOrder): boolean {
  return order.stage === "completed";
}

/** 复核通过后，改动刃角或客户偏好会让复核失效，只有这两类字段参与判断 */
export function invalidatesReview(
  order: WorkOrder,
  patch: Pick<Partial<WorkOrder>, "edgeAngles" | "preference">,
): boolean {
  if (!order.review) return false;
  if (
    patch.edgeAngles &&
    (patch.edgeAngles.base !== order.edgeAngles.base ||
      patch.edgeAngles.side !== order.edgeAngles.side)
  ) {
    return true;
  }
  if (
    patch.preference !== undefined &&
    patch.preference !== order.preference
  ) {
    return true;
  }
  return false;
}

export function validateNewOrder(
  input: NewOrderInput,
  orders: WorkOrder[],
): string | null {
  if (!input.customer.trim()) return "请填写客户姓名";
  if (!input.brand.trim()) return "请填写雪板品牌";
  if (!Number.isFinite(input.lengthCm) || input.lengthCm < 80 || input.lengthCm > 220) {
    return "雪板长度需在 80–220 cm 之间";
  }
  if (!BOARD_SHAPES.includes(input.shape)) return "请选择板型";
  if (
    !Number.isFinite(input.edgeAngles.base) ||
    input.edgeAngles.base < 0 ||
    input.edgeAngles.base > 3
  ) {
    return "底刃角度需在 0–3° 之间";
  }
  if (
    !Number.isFinite(input.edgeAngles.side) ||
    input.edgeAngles.side < 85 ||
    input.edgeAngles.side > 90
  ) {
    return "侧刃角度需在 85–90° 之间";
  }
  if (customerHasUndelivered(orders, input.customer)) {
    return `客户 ${input.customer.trim()} 已有未交付雪板，新工单拒绝登记`;
  }
  return null;
}

let counter = 1;

/** 生成形如 ORD-101 的单号；传入已有工单时从最大序号续号 */
export function nextOrderId(orders: WorkOrder[]): string {
  const max = orders.reduce((acc, order) => {
    const match = /^ORD-(\d+)$/.exec(order.id);
    return match ? Math.max(acc, Number(match[1])) : acc;
  }, 100);
  counter = Math.max(counter, max + 1);
  return `ORD-${counter++}`;
}

function event(type: HistoryEvent["type"], detail: string, now: string): HistoryEvent {
  return { at: now, type, detail };
}

/**
 * 创建工单。规则：同一客户已有未交付雪板时拒绝；
 * 新工单一律从“待复核”开始，底板损伤标记修补位置后才能登记刃角复核。
 */
export function createOrder(
  input: NewOrderInput,
  orders: WorkOrder[],
  now: string = new Date().toISOString(),
): OrderResult {
  const error = validateNewOrder(input, orders);
  if (error) return { ok: false, error };

  const order: WorkOrder = {
    id: nextOrderId(orders),
    customer: input.customer.trim(),
    brand: input.brand.trim(),
    lengthCm: Math.round(input.lengthCm),
    shape: input.shape,
    preference: input.preference.trim(),
    edgeAngles: {
      base: input.edgeAngles.base,
      side: input.edgeAngles.side,
    },
    waxType: input.waxType.trim(),
    noDamage: false,
    damageMarks: [],
    stage: "pending_review",
    review: null,
    events: [event("created", "工单创建，等待底板损伤登记与刃角复核", now)],
    createdAt: now,
    updatedAt: now,
  };
  return { ok: true, order };
}

/** 登记刃角复核：底板损伤已标记（或确认无损伤）才允许 */
export function registerReview(
  order: WorkOrder,
  input: ReviewInput,
  now: string = new Date().toISOString(),
): OrderResult {
  if (order.stage !== "pending_review") {
    return { ok: false, error: "只有待复核工单可以登记刃角复核" };
  }
  if (!isDamageRecorded(order)) {
    return {
      ok: false,
      error: "请先在底板上标记修补位置（或勾选“无底板损伤”），再登记刃角复核",
    };
  }
  const updated: WorkOrder = {
    ...order,
    stage: "reviewed",
    review: {
      at: now,
      reviewer: input.reviewer.trim() || "当班技师",
      angles: { ...order.edgeAngles },
      note: input.note.trim(),
    },
    events: [
      ...order.events,
      event(
        "reviewed",
        `刃角复核通过：底刃 ${order.edgeAngles.base}° / 侧刃 ${order.edgeAngles.side}°`,
        now,
      ),
    ],
    updatedAt: now,
  };
  return { ok: true, order: updated };
}

export interface OrderPatch {
  preference?: string;
  edgeAngles?: EdgeAngles;
  waxType?: string;
  noDamage?: boolean;
}

/**
 * 修改工单。复核通过后一旦改动刃角或客户偏好，原复核立即失效，
 * 工单回到待复核并追加失效记录；其他字段（打蜡、损伤标记）不影响复核。
 */
export function patchOrder(
  order: WorkOrder,
  patch: OrderPatch,
  now: string = new Date().toISOString(),
): OrderResult {
  if (order.stage === "completed" || order.stage === "delivered") {
    return { ok: false, error: "已完工或已交付的工单不能再修改" };
  }
  if (
    patch.edgeAngles &&
    (!Number.isFinite(patch.edgeAngles.base) ||
      patch.edgeAngles.base < 0 ||
      patch.edgeAngles.base > 3 ||
      !Number.isFinite(patch.edgeAngles.side) ||
      patch.edgeAngles.side < 85 ||
      patch.edgeAngles.side > 90)
  ) {
    return { ok: false, error: "刃角参数超出允许范围（底刃 0–3°，侧刃 85–90°）" };
  }

  let next: WorkOrder = { ...order, ...patch, updatedAt: now };
  if (patch.edgeAngles) next.edgeAngles = { ...patch.edgeAngles };

  if (invalidatesReview(order, patch) && order.stage === "reviewed") {
    const reasons: string[] = [];
    if (
      patch.edgeAngles &&
      (patch.edgeAngles.base !== order.edgeAngles.base ||
        patch.edgeAngles.side !== order.edgeAngles.side)
    ) {
      reasons.push(
        `刃角改为底刃 ${next.edgeAngles.base}° / 侧刃 ${next.edgeAngles.side}°`,
      );
    }
    if (
      patch.preference !== undefined &&
      patch.preference !== order.preference
    ) {
      reasons.push("客户偏好已调整");
    }
    next = {
      ...next,
      stage: "pending_review",
      review: null,
      events: [
        ...next.events,
        event("invalidated", `原刃角复核失效（${reasons.join("；")}），回到待复核`, now),
      ],
    };
  }
  return { ok: true, order: next };
}

/** 追加一个底板损伤修补位置标记（不影响复核状态） */
export function addDamageMark(
  order: WorkOrder,
  mark: Omit<WorkOrder["damageMarks"][number], "id" | "createdAt">,
  idFactory: () => string,
  now: string = new Date().toISOString(),
): OrderResult {
  if (order.stage === "delivered") {
    return { ok: false, error: "已交付工单不能再标记损伤" };
  }
  const updated: WorkOrder = {
    ...order,
    noDamage: false,
    damageMarks: [
      ...order.damageMarks,
      {
        id: idFactory(),
        x: clamp(mark.x, 0, 100),
        y: clamp(mark.y, 0, 100),
        note: mark.note,
        createdAt: now,
      },
    ],
    updatedAt: now,
  };
  return { ok: true, order: updated };
}

export function removeDamageMark(order: WorkOrder, markId: string): OrderResult {
  if (order.stage === "delivered") {
    return { ok: false, error: "已交付工单不能再修改损伤标记" };
  }
  return {
    ok: true,
    order: {
      ...order,
      damageMarks: order.damageMarks.filter((mark) => mark.id !== markId),
      updatedAt: new Date().toISOString(),
    },
  };
}

export function completeOrder(
  order: WorkOrder,
  now: string = new Date().toISOString(),
): OrderResult {
  if (!canComplete(order)) {
    return { ok: false, error: "只有复核通过的工单可以完工" };
  }
  return {
    ok: true,
    order: {
      ...order,
      stage: "completed",
      events: [...order.events, event("completed", "调校完工，等待交付", now)],
      updatedAt: now,
    },
  };
}

export function deliverOrder(
  order: WorkOrder,
  now: string = new Date().toISOString(),
): OrderResult {
  if (!canDeliver(order)) {
    return { ok: false, error: "只有已完工工单可以交付" };
  }
  return {
    ok: true,
    order: {
      ...order,
      stage: "delivered",
      events: [...order.events, event("delivered", "雪板已交付客户", now)],
      updatedAt: now,
    },
  };
}

export interface ListFilters {
  stage: StageFilter;
  shape: BoardShape | "all";
  keyword: string;
}

export function filterOrders(orders: WorkOrder[], filters: ListFilters): WorkOrder[] {
  const keyword = filters.keyword.trim().toLowerCase();
  return orders.filter((order) => {
    if (filters.stage !== "all" && order.stage !== filters.stage) return false;
    if (filters.shape !== "all" && order.shape !== filters.shape) return false;
    if (keyword) {
      const haystack = `${order.id} ${order.customer} ${order.brand}`.toLowerCase();
      if (!haystack.includes(keyword)) return false;
    }
    return true;
  });
}

export interface CustomerSummary {
  customer: string;
  total: number;
  undelivered: number;
  latest: WorkOrder;
}

/** 客户历史维护记录汇总 */
export function customerHistory(orders: WorkOrder[]): CustomerSummary[] {
  const map = new Map<string, WorkOrder[]>();
  for (const order of orders) {
    const list = map.get(order.customer) ?? [];
    list.push(order);
    map.set(order.customer, list);
  }
  return Array.from(map.entries())
    .map(([customer, list]) => {
      const sorted = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return {
        customer,
        total: list.length,
        undelivered: list.filter((order) => isUndelivered(order.stage)).length,
        latest: sorted[0],
      };
    })
    .sort((a, b) => b.latest.createdAt.localeCompare(a.latest.createdAt));
}

export function ordersByCustomer(orders: WorkOrder[], customer: string): WorkOrder[] {
  return orders
    .filter((order) => order.customer === customer)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function edgeAngleStats(orders: WorkOrder[]): {
  avgBase: number;
  avgSide: number;
} {
  if (orders.length === 0) return { avgBase: 0, avgSide: 0 };
  const sum = orders.reduce(
    (acc, order) => ({
      base: acc.base + order.edgeAngles.base,
      side: acc.side + order.edgeAngles.side,
    }),
    { base: 0, side: 0 },
  );
  return {
    avgBase: round1(sum.base / orders.length),
    avgSide: round1(sum.side / orders.length),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
