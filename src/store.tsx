import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  addMark,
  createOrder,
  deliverOrder,
  findOpenOrderFor,
  nextSeq,
  patchMark,
  patchOrder,
  registerReview,
  removeMark,
  validateOrderInput,
} from "./rules";
import { loadOrders, saveOrders, seedOrders } from "./storage";
import type {
  DamageKind,
  NewOrderInput,
  WorkOrder,
} from "./types";

interface WorkbenchContextValue {
  orders: WorkOrder[];
  /** 新建工单；成功返回新单 ID，客户有未交付雪板或字段不合法时返回错误信息 */
  create: (input: NewOrderInput) => { ok: true; id: string } | { ok: false; error: string };
  update: (
    id: string,
    patch: Parameters<typeof patchOrder>[1]
  ) => void;
  registerReview: (id: string) => void;
  deliver: (id: string) => void;
  addDamageMark: (
    id: string,
    point: { x: number; y: number },
    kind: DamageKind
  ) => void;
  updateDamageMark: (
    id: string,
    markId: string,
    patch: { note?: string; repaired?: boolean }
  ) => void;
  removeDamageMark: (id: string, markId: string) => void;
  customerNames: string[];
}

const WorkbenchContext = createContext<WorkbenchContextValue | null>(null);

export function WorkbenchProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<WorkOrder[]>(
    () => loadOrders() ?? seedOrders()
  );
  const ordersRef = useRef(orders);
  ordersRef.current = orders;

  // 数据只存浏览器：每次变更后同步到 localStorage，刷新后保留
  useEffect(() => {
    saveOrders(orders);
  }, [orders]);

  const updateOne = useCallback(
    (id: string, fn: (o: WorkOrder) => WorkOrder) => {
      setOrders((prev) => prev.map((o) => (o.id === id ? fn(o) : o)));
    },
    []
  );

  const create = useCallback((input: NewOrderInput) => {
    const error = validateOrderInput(input);
    if (error) return { ok: false as const, error };
    const conflict = findOpenOrderFor(ordersRef.current, input.customer);
    if (conflict) {
      return {
        ok: false as const,
        error: `客户「${conflict.customer}」已有未交付雪板：${conflict.id}（${conflict.brand} ${conflict.length}），需先交付后再登记新工单`,
      };
    }
    const order = createOrder(input, nextSeq(ordersRef.current));
    setOrders((prev) => [order, ...prev]);
    return { ok: true as const, id: order.id };
  }, []);

  const update = useCallback<WorkbenchContextValue["update"]>(
    (id, patch) => updateOne(id, (o) => patchOrder(o, patch)),
    [updateOne]
  );

  const review = useCallback(
    (id: string) => updateOne(id, registerReview),
    [updateOne]
  );

  const deliver = useCallback(
    (id: string) => updateOne(id, deliverOrder),
    [updateOne]
  );

  const addDamageMark = useCallback(
    (id: string, point: { x: number; y: number }, kind: DamageKind) =>
      updateOne(id, (o) => addMark(o, point, kind)),
    [updateOne]
  );

  const updateDamageMark = useCallback(
    (id: string, markId: string, patch: { note?: string; repaired?: boolean }) =>
      updateOne(id, (o) => patchMark(o, markId, patch)),
    [updateOne]
  );

  const removeDamageMark = useCallback(
    (id: string, markId: string) =>
      updateOne(id, (o) => removeMark(o, markId)),
    [updateOne]
  );

  const customerNames = useMemo(
    () =>
      Array.from(new Set(orders.map((o) => o.customer))).sort((a, b) =>
        a.localeCompare(b, "zh-CN")
      ),
    [orders]
  );

  const value: WorkbenchContextValue = {
    orders,
    create,
    update,
    registerReview: review,
    deliver,
    addDamageMark,
    updateDamageMark,
    removeDamageMark,
    customerNames,
  };

  return (
    <WorkbenchContext.Provider value={value}>
      {children}
    </WorkbenchContext.Provider>
  );
}

export function useWorkbench(): WorkbenchContextValue {
  const ctx = useContext(WorkbenchContext);
  if (!ctx) throw new Error("useWorkbench 必须在 WorkbenchProvider 内使用");
  return ctx;
}
