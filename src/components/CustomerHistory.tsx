import { useState } from "react";
import type { WorkOrder } from "../types";
import { STAGE_LABELS } from "../types";
import { customerHistory, ordersByCustomer } from "../domain/orders";

interface CustomerHistoryProps {
  orders: WorkOrder[];
  onOpen: (order: WorkOrder) => void;
}

/** 客户历史维护记录：按客户汇总，点击展开其全部工单 */
export function CustomerHistory({ orders, onOpen }: CustomerHistoryProps) {
  const summaries = customerHistory(orders);
  const [openCustomer, setOpenCustomer] = useState<string | null>(null);

  return (
    <section className="panel history-panel">
      <div className="heading">
        <div>
          <p>客户历史维护记录</p>
          <h2>客户档案（{summaries.length}）</h2>
        </div>
      </div>
      {summaries.length === 0 ? (
        <div className="empty">还没有客户记录。</div>
      ) : (
        <ul className="customer-list">
          {summaries.map((summary) => {
            const expanded = openCustomer === summary.customer;
            const customerOrders = expanded ? ordersByCustomer(orders, summary.customer) : [];
            return (
              <li key={summary.customer}>
                <button
                  type="button"
                  className="customer-head"
                  onClick={() => setOpenCustomer(expanded ? null : summary.customer)}
                >
                  <b>{summary.customer}</b>
                  <span className="customer-stats">
                    共 {summary.total} 单
                    {summary.undelivered > 0 && (
                      <em className="undelivered">· {summary.undelivered} 块未交付</em>
                    )}
                  </span>
                  <span className="caret">{expanded ? "▾" : "▸"}</span>
                </button>
                {expanded && (
                  <ul className="customer-orders">
                    {customerOrders.map((order) => (
                      <li key={order.id} onClick={() => onOpen(order)}>
                        <span className={`stage-badge ${order.stage}`}>
                          {STAGE_LABELS[order.stage]}
                        </span>
                        <span>
                          {order.id} · {order.brand} {order.lengthCm}cm
                        </span>
                        <time>{order.createdAt.slice(0, 10)}</time>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
