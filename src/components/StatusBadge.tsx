import { STATUS_LABEL, statusOf } from "../rules";
import type { WorkOrder } from "../types";

export function StatusBadge({ order }: { order: WorkOrder }) {
  const status = statusOf(order);
  return <span className={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>;
}
