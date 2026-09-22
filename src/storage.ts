import type { WorkOrder } from "./types";

const STORAGE_KEY = "ski-tuning-workbench:v1";

export function loadOrders(): WorkOrder[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return null;
    return data as WorkOrder[];
  } catch {
    return null;
  }
}

export function saveOrders(orders: WorkOrder[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // 存储不可用时静默降级，当前会话内仍可用
  }
}

/** 种子工单：保持与原工作台记录一致（ORD-106/112/118） */
export function seedOrders(): WorkOrder[] {
  return [
    {
      id: "ORD-118",
      customer: "周岚",
      brand: "Jones",
      length: 158,
      boardType: "粉雪板",
      preference: "弱咬雪，滑行轻松不卡刃",
      wax: "低温蜡",
      edge: { side: 89, base: 1 },
      marks: [
        {
          id: "mk_seed_1",
          x: 72,
          y: 64,
          note: "板头刃侧深层划痕，待 P-Tex 修补",
          repaired: false,
          kind: "repair",
        },
      ],
      review: null,
      delivered: false,
      createdAt: "2026-09-21T10:20:00.000Z",
    },
    {
      id: "ORD-112",
      customer: "李骁",
      brand: "Volkl",
      length: 165,
      boardType: "竞速板",
      preference: "强咬雪，卡宾稳定",
      wax: "石墨蜡",
      edge: { side: 87, base: 0.5 },
      marks: [
        {
          id: "mk_seed_2",
          x: 38,
          y: 40,
          note: "底板划痕 12cm，待补 P-Tex",
          repaired: false,
          kind: "repair",
        },
      ],
      review: null,
      delivered: false,
      createdAt: "2026-09-20T03:15:00.000Z",
    },
    {
      id: "ORD-106",
      customer: "陈野",
      brand: "Burton",
      length: 156,
      boardType: "全地域",
      preference: "公园和平花都要兼顾",
      wax: "低温蜡",
      edge: { side: 88, base: 1 },
      marks: [
        {
          id: "mk_seed_3",
          x: 50,
          y: 50,
          note: "底板无损伤·免检点",
          repaired: true,
          kind: "clear",
        },
      ],
      review: {
        at: "2026-09-19T08:00:00.000Z",
        edge: { side: 88, base: 1 },
        preference: "公园和平花都要兼顾",
      },
      delivered: true,
      createdAt: "2026-09-18T01:30:00.000Z",
      deliveredAt: "2026-09-19T09:10:00.000Z",
    },
  ];
}
