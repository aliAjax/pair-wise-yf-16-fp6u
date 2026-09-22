import { useWorkbench } from "../store";
import { BASE_EDGE_MAX, BASE_EDGE_MIN, SIDE_EDGE_MAX, SIDE_EDGE_MIN } from "../rules";
import type { WorkOrder } from "../types";
import { parseFinite } from "../utils";

interface Props {
  order: WorkOrder;
}

/** 刃角参数表：改动刃角会使原复核失效，自动回到待复核 */
export function EdgeParams({ order }: Props) {
  const { update } = useWorkbench();
  const readonly = order.delivered;

  const setEdge = (key: "side" | "base") => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const n = parseFinite(e.target.value);
    if (n === null) return;
    update(order.id, { edge: { ...order.edge, [key]: n } });
  };

  const drift =
    order.review !== null &&
    (order.review.edge.side !== order.edge.side ||
      order.review.edge.base !== order.edge.base);

  return (
    <div className="edge-params">
      <p className="section-kicker">刃角参数表</p>
      <div className="edge-grid">
        <label>
          <span>侧刃角度（°）</span>
          <input
            type="number"
            step={0.5}
            min={SIDE_EDGE_MIN}
            max={SIDE_EDGE_MAX}
            value={order.edge.side}
            disabled={readonly}
            onChange={setEdge("side")}
          />
          <small>常用 {SIDE_EDGE_MIN}° ~ {SIDE_EDGE_MAX}°，越大越咬雪</small>
        </label>
        <label>
          <span>底刃角度（°）</span>
          <input
            type="number"
            step={0.5}
            min={BASE_EDGE_MIN}
            max={BASE_EDGE_MAX}
            value={order.edge.base}
            disabled={readonly}
            onChange={setEdge("base")}
          />
          <small>常用 {BASE_EDGE_MIN}° ~ {BASE_EDGE_MAX}°</small>
        </label>
      </div>
      {order.review && drift && (
        <p className="warn-inline">刃角已偏离复核值，复核即将失效。</p>
      )}
      {!readonly && (
        <p className="param-note">
          复核通过后修改刃角或客户偏好，原复核自动失效并回到待复核。
        </p>
      )}
    </div>
  );
}
