import { STATUS_FILTERS, sortOrders, type StatusFilter } from "../rules";
import type { BoardType, WorkOrder } from "../types";
import { fmtDateTime } from "../utils";
import { StatusBadge } from "./StatusBadge";

interface Props {
  orders: WorkOrder[];
  status: StatusFilter;
  boardType: BoardType | "全部";
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function OrderList({
  orders,
  status,
  boardType,
  selectedId,
  onSelect,
}: Props) {
  const list = sortOrders(orders);
  const statusLabel = STATUS_FILTERS.find((f) => f.key === status)?.label;

  return (
    <section className="panel list-panel">
      <div className="heading">
        <div>
          <p>维护工单列表</p>
          <h2>
            {statusLabel}
            {boardType !== "全部" ? ` · ${boardType}` : ""}
            <span className="count">{list.length}</span>
          </h2>
        </div>
      </div>
      {list.length === 0 ? (
        <p className="muted empty-block">
          当前筛选下没有工单，切换筛选或在右侧登记新单。
        </p>
      ) : (
        <div className="records">
          {list.map((o, index) => (
            <article
              key={o.id}
              className={o.id === selectedId ? "record selected" : "record"}
              onClick={() => onSelect(o.id)}
            >
              <b>{String(index + 1).padStart(2, "0")}</b>
              <div className="record-body">
                <h3>
                  {o.id}
                  <StatusBadge order={o} />
                </h3>
                <p>
                  {o.customer} · {o.brand} {o.length} · {o.boardType} · 侧刃
                  {o.edge.side}°/底刃{o.edge.base}° · {o.wax}
                </p>
                <p className="record-pref">偏好：{o.preference}</p>
                <small className="record-time">
                  登记 {fmtDateTime(o.createdAt)}
                  {o.delivered && o.deliveredAt
                    ? ` · 交付 ${fmtDateTime(o.deliveredAt)}`
                    : ""}
                </small>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
