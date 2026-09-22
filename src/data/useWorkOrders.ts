// 数据操作与界面之间的 React 绑定层：
// 用 useSyncExternalStore 暴露工单集合，所有变更都先经过 domain 的纯函数规则，
// 再统一持久化到 localStorage。组件不直接接触存储。

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { EdgeAngles, WorkOrder } from "../types";
import {
  addDamageMark,
  completeOrder,
  createOrder,
  deliverOrder,
  type NewOrderInput,
  patchOrder,
  registerReview,
  type ReviewInput,
  removeDamageMark,
} from "../domain/orders";
import { loadOrders, saveOrders } from "./storage";

let orders: WorkOrder[] = loadOrders();
const listeners = new Set<() => void>();

function emit(next: WorkOrder[]): void {
  orders = next;
  saveOrders(orders);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): WorkOrder[] {
  return orders;
}

export interface ActionResult {
  ok: boolean;
  error?: string;
}

function makeId(): string {
  return `dm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useWorkOrders() {
  const list = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const create = useCallback((input: NewOrderInput): ActionResult => {
    const result = createOrder(input, orders);
    if (!result.ok) return { ok: false, error: result.error };
    emit([...orders, result.order]);
    return { ok: true };
  }, []);

  const update = useCallback(
    (
      id: string,
      patch: { preference?: string; edgeAngles?: EdgeAngles; waxType?: string; noDamage?: boolean },
    ): ActionResult => {
      const target = orders.find((order) => order.id === id);
      if (!target) return { ok: false, error: "工单不存在" };
      const result = patchOrder(target, patch);
      if (!result.ok) return { ok: false, error: result.error };
      emit(orders.map((order) => (order.id === id ? result.order : order)));
      return { ok: true };
    },
    [],
  );

  const review = useCallback((id: string, input: ReviewInput): ActionResult => {
    const target = orders.find((order) => order.id === id);
    if (!target) return { ok: false, error: "工单不存在" };
    const result = registerReview(target, input);
    if (!result.ok) return { ok: false, error: result.error };
    emit(orders.map((order) => (order.id === id ? result.order : order)));
    return { ok: true };
  }, []);

  const markDamage = useCallback(
    (id: string, mark: { x: number; y: number; note: string }): ActionResult => {
      const target = orders.find((order) => order.id === id);
      if (!target) return { ok: false, error: "工单不存在" };
      const result = addDamageMark(target, mark, makeId);
      if (!result.ok) return { ok: false, error: result.error };
      emit(orders.map((order) => (order.id === id ? result.order : order)));
      return { ok: true };
    },
    [],
  );

  const deleteDamageMark = useCallback((id: string, markId: string): ActionResult => {
    const target = orders.find((order) => order.id === id);
    if (!target) return { ok: false, error: "工单不存在" };
    const result = removeDamageMark(target, markId);
    if (!result.ok) return { ok: false, error: result.error };
    emit(orders.map((order) => (order.id === id ? result.order : order)));
    return { ok: true };
  }, []);

  const complete = useCallback((id: string): ActionResult => {
    const target = orders.find((order) => order.id === id);
    if (!target) return { ok: false, error: "工单不存在" };
    const result = completeOrder(target);
    if (!result.ok) return { ok: false, error: result.error };
    emit(orders.map((order) => (order.id === id ? result.order : order)));
    return { ok: true };
  }, []);

  const deliver = useCallback((id: string): ActionResult => {
    const target = orders.find((order) => order.id === id);
    if (!target) return { ok: false, error: "工单不存在" };
    const result = deliverOrder(target);
    if (!result.ok) return { ok: false, error: result.error };
    emit(orders.map((order) => (order.id === id ? result.order : order)));
    return { ok: true };
  }, []);

  return useMemo(
    () => ({
      orders: list,
      create,
      update,
      review,
      markDamage,
      deleteDamageMark,
      complete,
      deliver,
    }),
    [list, create, update, review, markDamage, deleteDamageMark, complete, deliver],
  );
}
