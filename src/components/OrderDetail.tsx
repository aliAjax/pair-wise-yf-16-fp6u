import { useWorkbench } from "../store";
import { BOARD_TYPES, WAX_TYPES, type BoardType, type WaxType } from "../types";
import { parseFinite } from "../utils";
import { StatusBadge } from "./StatusBadge";
import { EdgeParams } from "./EdgeParams";
import { DamageBoard } from "./DamageBoard";
import { ReviewBox } from "./ReviewBox";

interface Props {
  orderId: string;
}

export function OrderDetail({ orderId }: Props) {
  const { orders, update } = useWorkbench();
  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return (
      <section className="panel detail-panel">
        <p className="muted empty-block">工单不存在或已被移除。</p>
      </section>
    );
  }

  const readonly = order.delivered;

  return (
    <section className="panel detail-panel">
      <div className="heading">
        <div>
          <p>工单详情</p>
          <h2>
            {order.id}
            <StatusBadge order={order} />
          </h2>
        </div>
      </div>

      <div className="detail-grid">
        <label>
          <span>客户</span>
          <input value={order.customer} disabled />
        </label>
        <label>
          <span>雪板品牌</span>
          <input
            value={order.brand}
            disabled={readonly}
            onChange={(e) => update(order.id, { brand: e.target.value })}
          />
        </label>
        <label>
          <span>长度（cm）</span>
          <input
            type="number"
            value={order.length}
            disabled={readonly}
            onChange={(e) => {
              const n = parseFinite(e.target.value);
              if (n !== null && n > 0) update(order.id, { length: n });
            }}
          />
        </label>
        <label>
          <span>板型</span>
          <select
            value={order.boardType}
            disabled={readonly}
            onChange={(e) =>
              update(order.id, { boardType: e.target.value as BoardType })
            }
          >
            {BOARD_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>打蜡类型</span>
          <select
            value={order.wax}
            disabled={readonly}
            onChange={(e) => update(order.id, { wax: e.target.value as WaxType })}
          >
            {WAX_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="pref-field">
          <span>客户偏好</span>
          <input
            value={order.preference}
            disabled={readonly}
            onChange={(e) =>
              update(order.id, { preference: e.target.value })
            }
          />
        </label>
      </div>

      <EdgeParams order={order} />

      <DamageBoard order={order} />

      <ReviewBox order={order} />

      {readonly && (
        <p className="muted detail-locked">
          工单已交付，内容只读；客户历史中仍可查看完整记录。
        </p>
      )}
    </section>
  );
}
