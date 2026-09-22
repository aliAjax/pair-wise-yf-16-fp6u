import { useMemo, useState } from "react";
import { STATUS_LABEL, sortOrders, statusOf } from "../rules";
import { fmtDateTime } from "../utils";
import type { WorkOrder } from "../types";

interface Props {
  orders: WorkOrder[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function CustomerHistory({ orders, selectedId, onSelect }: Props) {
  const [customer, setCustomer] = useState("");

  const history = useMemo(() => {
    const name = customer.trim().toLowerCase();
    if (!name) return [];
    return sortOrders(
      orders.filter((o) => o.customer.trim().toLowerCase() === name)
    );
  }, [orders, customer]);

  const customerCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders) {
      map.set(o.customer, (map.get(o.customer) ?? 0) + 1);
    }
    return map;
  }, [orders]);

  return (
    <aside className="panel history-panel">
      <h2>客户历史维护记录</h2>
      <input
        list="customer-names"
        value={customer}
        onChange={(e) => setCustomer(e.target.value)}
        placeholder="输入或选择客户姓名"
      />
      <datalist id="customer-names">
        {Array.from(customerCount.keys())
          .sort((a, b) => a.localeCompare(b, "zh-CN"))
          .map((name) => (
            <option key={name} value={name}>
              {customerCount.get(name)} 张工单
            </option>
          ))}
      </datalist>

      <div className="history-list">
        {customer.trim() === "" ? (
          <p className="muted">查询客户名下全部工单，含已交付记录</p>
        ) : history.length === 0 ? (
          <p className="muted">未找到该客户的工单</p>
        ) : (
          history.map((o) => (
            <button
              key={o.id}
              className={
                o.id === selectedId ? "history-item selected" : "history-item"
              }
              onClick={() => onSelect(o.id)}
            >
              <span className="history-top">
                <b>{o.id}</b>
                <span className={`badge badge-${statusOf(o)}`}>
                  {STATUS_LABEL[statusOf(o)]}
                </span>
              </span>
              <span className="history-meta">
                {o.brand} {o.length} · {o.boardType}
              </span>
              <span className="history-time">{fmtDateTime(o.createdAt)}</span>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
