import { useEffect, useState } from "react";
import type { WorkOrder } from "../types";
import { STAGE_LABELS } from "../types";
import { isDamageRecorded } from "../domain/orders";
import { BaseBoard } from "./BaseBoard";

interface OrderDetailProps {
  order: WorkOrder;
  onClose: () => void;
  onReview: (id: string, input: { reviewer: string; note: string }) => { ok: boolean; error?: string };
  onUpdate: (
    id: string,
    patch: { preference?: string; edgeAngles?: { base: number; side: number }; waxType?: string; noDamage?: boolean },
  ) => { ok: boolean; error?: string };
  onAddMark: (id: string, mark: { x: number; y: number; note: string }) => { ok: boolean; error?: string };
  onRemoveMark: (id: string, markId: string) => { ok: boolean; error?: string };
  onComplete: (id: string) => { ok: boolean; error?: string };
  onDeliver: (id: string) => { ok: boolean; error?: string };
}

const EVENT_LABELS: Record<string, string> = {
  created: "创建",
  reviewed: "复核",
  invalidated: "失效",
  completed: "完工",
  delivered: "交付",
};

export function OrderDetail({
  order,
  onClose,
  onReview,
  onUpdate,
  onAddMark,
  onRemoveMark,
  onComplete,
  onDeliver,
}: OrderDetailProps) {
  const [preference, setPreference] = useState(order.preference);
  const [waxType, setWaxType] = useState(order.waxType);
  const [baseAngle, setBaseAngle] = useState(String(order.edgeAngles.base));
  const [sideAngle, setSideAngle] = useState(String(order.edgeAngles.side));
  const [reviewer, setReviewer] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [message, setMessage] = useState<{ kind: "error" | "ok"; text: string } | null>(null);

  // 切换工单时重置本地编辑态
  useEffect(() => {
    setPreference(order.preference);
    setWaxType(order.waxType);
    setBaseAngle(String(order.edgeAngles.base));
    setSideAngle(String(order.edgeAngles.side));
    setReviewer("");
    setReviewNote("");
    setMessage(null);
  }, [order.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const locked = order.stage === "completed" || order.stage === "delivered";
  const damageRecorded = isDamageRecorded(order);

  function report(result: { ok: boolean; error?: string }, okText: string) {
    setMessage(result.ok ? { kind: "ok", text: okText } : { kind: "error", text: result.error ?? "操作失败" });
  }

  function saveAngles(event: React.FormEvent) {
    event.preventDefault();
    report(
      onUpdate(order.id, {
        edgeAngles: { base: Number(baseAngle), side: Number(sideAngle) },
      }),
      "刃角参数已保存",
    );
  }

  function savePreference(event: React.FormEvent) {
    event.preventDefault();
    report(onUpdate(order.id, { preference }), "客户偏好已保存");
  }

  function saveWax(event: React.FormEvent) {
    event.preventDefault();
    report(onUpdate(order.id, { waxType }), "打蜡类型已保存");
  }

  function submitReview(event: React.FormEvent) {
    event.preventDefault();
    report(onReview(order.id, { reviewer, note: reviewNote }), "刃角复核已登记，工单进入复核通过");
  }

  return (
    <div className="drawer-mask" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <header className="drawer-head">
          <div>
            <p className="drawer-id">{order.id}</p>
            <h2>
              {order.brand} · {order.lengthCm}cm · {order.shape}
            </h2>
            <div className="meta-line">
              <span className={`stage-badge ${order.stage}`}>{STAGE_LABELS[order.stage]}</span>
              <span>客户：{order.customer}</span>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="关闭详情">
            ×
          </button>
        </header>

        {message && (
          <div className={`alert ${message.kind === "error" ? "error" : "ok"}`}>{message.text}</div>
        )}

        {order.stage === "reviewed" && order.review && (
          <div className="alert ok review-snapshot">
            当前刃角已于 {formatTime(order.review.at)} 由 {order.review.reviewer} 复核通过
            （底刃 {order.review.angles.base}° / 侧刃 {order.review.angles.side}°）。
            改动刃角或客户偏好会让复核失效。
          </div>
        )}

        <section className="detail-section">
          <h3>① 底板损伤标记</h3>
          <BaseBoard
            marks={order.damageMarks}
            disabled={locked}
            onAdd={(mark) => report(onAddMark(order.id, mark), "修补位置已标记")}
            onRemove={(markId) => report(onRemoveMark(order.id, markId), "标记已删除")}
          />
          {!locked && (
            <label className="checkbox-line">
              <input
                type="checkbox"
                checked={order.noDamage}
                disabled={order.damageMarks.length > 0}
                onChange={(e) =>
                  report(onUpdate(order.id, { noDamage: e.target.checked }), "底板状态已更新")
                }
              />
              <span>经检查无底板损伤（勾选后视为底板状态已登记）</span>
            </label>
          )}
          {!damageRecorded && order.stage === "pending_review" && (
            <p className="hint-warn">尚未标记修补位置或确认无损伤，刃角复核暂不可登记。</p>
          )}
        </section>

        <section className="detail-section">
          <h3>② 刃角参数{order.review ? "" : "（待复核）"}</h3>
          <form className="inline-form" onSubmit={saveAngles}>
            <label>
              <span>底刃角度</span>
              <input
                type="number"
                step={0.1}
                min={0}
                max={3}
                value={baseAngle}
                disabled={locked}
                onChange={(e) => setBaseAngle(e.target.value)}
              />
            </label>
            <label>
              <span>侧刃角度</span>
              <input
                type="number"
                step={0.1}
                min={85}
                max={90}
                value={sideAngle}
                disabled={locked}
                onChange={(e) => setSideAngle(e.target.value)}
              />
            </label>
            {!locked && <button type="submit">保存刃角</button>}
          </form>

          {order.stage === "pending_review" && (
            <form className="review-box" onSubmit={submitReview}>
              <label>
                <span>复核技师</span>
                <input
                  value={reviewer}
                  placeholder="留空记为当班技师"
                  onChange={(e) => setReviewer(e.target.value)}
                />
              </label>
              <label className="grow">
                <span>复核备注</span>
                <input
                  value={reviewNote}
                  placeholder="如：边刃均匀、无毛刺"
                  onChange={(e) => setReviewNote(e.target.value)}
                />
              </label>
              <button
                type="submit"
                className="primary"
                disabled={!damageRecorded}
                title={damageRecorded ? "" : "请先完成底板损伤登记"}
              >
                登记刃角复核
              </button>
            </form>
          )}
          {order.review && (
            <dl className="review-meta">
              <div>
                <dt>复核技师</dt>
                <dd>{order.review.reviewer}</dd>
              </div>
              <div>
                <dt>复核时间</dt>
                <dd>{formatTime(order.review.at)}</dd>
              </div>
              {order.review.note && (
                <div className="full">
                  <dt>复核备注</dt>
                  <dd>{order.review.note}</dd>
                </div>
              )}
            </dl>
          )}
        </section>

        <section className="detail-section">
          <h3>③ 调校偏好与打蜡</h3>
          <form className="inline-form" onSubmit={savePreference}>
            <label className="grow">
              <span>客户偏好</span>
              <input
                value={preference}
                disabled={locked}
                placeholder="如：弱咬雪"
                onChange={(e) => setPreference(e.target.value)}
              />
            </label>
            {!locked && <button type="submit">保存偏好</button>}
          </form>
          <form className="inline-form" onSubmit={saveWax}>
            <label className="grow">
              <span>打蜡类型</span>
              <input
                value={waxType}
                disabled={locked}
                placeholder="如：低温蜡"
                onChange={(e) => setWaxType(e.target.value)}
              />
            </label>
            {!locked && <button type="submit">保存打蜡</button>}
          </form>
        </section>

        <section className="detail-section">
          <h3>④ 完工与交付</h3>
          <div className="action-row">
            <button
              className="primary"
              disabled={order.stage !== "reviewed"}
              onClick={() => report(onComplete(order.id), "工单已完工")}
            >
              标记完工
            </button>
            <button
              disabled={order.stage !== "completed"}
              onClick={() => report(onDeliver(order.id), "雪板已交付")}
            >
              确认交付
            </button>
            {locked && <span className="hint">该工单已{order.stage === "delivered" ? "交付，参数锁定" : "完工，参数锁定"}</span>}
          </div>
        </section>

        <section className="detail-section timeline-section">
          <h3>工单操作记录</h3>
          <ul className="timeline">
            {order.events.map((event, index) => (
              <li key={`${event.at}-${index}`}>
                <span className={`dot ${event.type}`} />
                <div>
                  <p>
                    <b>{EVENT_LABELS[event.type] ?? event.type}</b>
                    <time>{formatTime(event.at)}</time>
                  </p>
                  <span>{event.detail}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}
