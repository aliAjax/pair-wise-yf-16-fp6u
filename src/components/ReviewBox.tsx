import { useWorkbench } from "../store";
import { canRegisterReview } from "../rules";
import { fmtDateTime } from "../utils";
import type { WorkOrder } from "../types";

interface Props {
  order: WorkOrder;
}

export function ReviewBox({ order }: Props) {
  const { registerReview, deliver } = useWorkbench();

  if (order.delivered) {
    return (
      <div className="review-box delivered">
        <p className="section-kicker">刃角复核</p>
        <p>
          <span className="badge badge-delivered">已交付</span>
          {order.deliveredAt ? ` 交付时间 ${fmtDateTime(order.deliveredAt)}` : ""}
        </p>
        {order.review && (
          <p className="muted">
            复核于 {fmtDateTime(order.review.at)} 通过 · 侧刃
            {order.review.edge.side}° / 底刃{order.review.edge.base}°
          </p>
        )}
      </div>
    );
  }

  if (!order.review) {
    const allowed = canRegisterReview(order);
    return (
      <div className="review-box pending">
        <p className="section-kicker">刃角复核</p>
        {!allowed ? (
          <p className="warn-inline">
            底板损伤尚未标记修补位置，请先在底板示意图上标记后再登记刃角复核。
          </p>
        ) : (
          <p className="muted">
            修补位置已标记（{order.marks.length} 处），可登记复核。
          </p>
        )}
        <button
          className="primary"
          disabled={!allowed}
          onClick={() => registerReview(order.id)}
        >
          登记刃角复核
        </button>
      </div>
    );
  }

  return (
    <div className="review-box passed">
      <p className="section-kicker">刃角复核</p>
      <p>
        <span className="badge badge-passed">复核通过</span>
        <span className="review-at">{fmtDateTime(order.review.at)}</span>
      </p>
      <p className="muted">
        复核参数：侧刃{order.review.edge.side}° / 底刃
        {order.review.edge.base}° · 偏好「{order.review.preference}」
      </p>
      <button className="primary" onClick={() => deliver(order.id)}>
        交付客户
      </button>
    </div>
  );
}
