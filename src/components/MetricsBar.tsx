import { computeMetrics } from "../rules";
import type { WorkOrder } from "../types";

const LABELS = [
  { key: "pending", label: "待维护", suffix: "单" },
  { key: "delivered", label: "完工工单", suffix: "单" },
  { key: "avgSideEdge", label: "平均侧刃角", suffix: "°" },
  { key: "repairCount", label: "底板修补标记", suffix: "处" },
] as const;

export function MetricsBar({ orders }: { orders: WorkOrder[] }) {
  const metrics = computeMetrics(orders);
  return (
    <section className="metrics">
      {LABELS.map((item) => (
        <article key={item.key}>
          <small>{item.label}</small>
          <strong>
            {metrics[item.key]}
            <em>{item.suffix}</em>
          </strong>
        </article>
      ))}
    </section>
  );
}
