// 数据操作层：负责工单在浏览器中的持久化（localStorage）与读写封装。
// 只做存取与序列化，不做界面渲染，业务规则仍由 domain/orders.ts 决定。

import type { WorkOrder } from "../types";

const STORAGE_KEY = "ski-tuning-workbench:orders:v1";

export function loadOrders(): WorkOrder[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // 只做轻量形状校验，损坏数据直接丢弃，避免整个应用崩掉
    return parsed.filter(isWorkOrder);
  } catch {
    return [];
  }
}

export function saveOrders(orders: WorkOrder[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // 存储已满或隐私模式下静默失败，当前会话仍可用
  }
}

export function clearOrders(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function isWorkOrder(value: unknown): value is WorkOrder {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.customer === "string" &&
    typeof item.brand === "string" &&
    typeof item.lengthCm === "number" &&
    typeof item.shape === "string" &&
    typeof item.stage === "string" &&
    typeof item.edgeAngles === "object" &&
    item.edgeAngles !== null &&
    Array.isArray(item.damageMarks) &&
    Array.isArray(item.events)
  );
}
