import { useState } from "react";
import { BOARD_SHAPES, type BoardShape, type WorkOrder } from "../types";
import { customerHasUndelivered, type NewOrderInput } from "../domain/orders";

interface OrderFormProps {
  orders: WorkOrder[];
  onCreate: (input: NewOrderInput) => { ok: boolean; error?: string };
}

const EMPTY = {
  customer: "",
  brand: "",
  length: "",
  shape: "全地域" as BoardShape,
  preference: "",
  baseAngle: "1",
  sideAngle: "89",
  waxType: "",
};

/** 新建工单表单：品牌、长度、板型、刃角、打蜡类型与客户偏好 */
export function OrderForm({ orders, onCreate }: OrderFormProps) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const blocked =
    form.customer.trim() !== "" && customerHasUndelivered(orders, form.customer);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const result = onCreate({
      customer: form.customer,
      brand: form.brand,
      lengthCm: Number(form.length),
      shape: form.shape,
      preference: form.preference,
      edgeAngles: { base: Number(form.baseAngle), side: Number(form.sideAngle) },
      waxType: form.waxType,
    });
    if (!result.ok) {
      setError(result.error ?? "登记失败");
      return;
    }
    setForm(EMPTY);
  }

  return (
    <form className="panel form-panel" onSubmit={submit}>
      <div className="heading">
        <div>
          <p>新工单登记</p>
          <h2>雪板调校工单</h2>
        </div>
        <button className="primary" type="submit">
          登记工单
        </button>
      </div>

      {blocked && (
        <div className="alert warn">
          客户「{form.customer.trim()}」已有未交付雪板，此工单提交时将被拒绝。
        </div>
      )}
      {error && <div className="alert error">{error}</div>}

      <div className="field-grid">
        <label>
          <span>客户姓名 *</span>
          <input
            value={form.customer}
            placeholder="如：张磊"
            onChange={(e) => setForm({ ...form, customer: e.target.value })}
          />
        </label>
        <label>
          <span>雪板品牌 *</span>
          <input
            value={form.brand}
            placeholder="如：Burton Custom"
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
          />
        </label>
        <label>
          <span>长度（cm）*</span>
          <input
            type="number"
            min={80}
            max={220}
            value={form.length}
            placeholder="如：156"
            onChange={(e) => setForm({ ...form, length: e.target.value })}
          />
        </label>
        <label>
          <span>板型 *</span>
          <select
            value={form.shape}
            onChange={(e) => setForm({ ...form, shape: e.target.value as BoardShape })}
          >
            {BOARD_SHAPES.map((shape) => (
              <option key={shape} value={shape}>
                {shape}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>底刃角度（0–3°）</span>
          <input
            type="number"
            step={0.1}
            min={0}
            max={3}
            value={form.baseAngle}
            onChange={(e) => setForm({ ...form, baseAngle: e.target.value })}
          />
        </label>
        <label>
          <span>侧刃角度（85–90°）</span>
          <input
            type="number"
            step={0.1}
            min={85}
            max={90}
            value={form.sideAngle}
            onChange={(e) => setForm({ ...form, sideAngle: e.target.value })}
          />
        </label>
        <label>
          <span>打蜡类型</span>
          <input
            value={form.waxType}
            placeholder="如：低温蜡 / 全温蜡"
            onChange={(e) => setForm({ ...form, waxType: e.target.value })}
          />
        </label>
        <label>
          <span>客户偏好</span>
          <input
            value={form.preference}
            placeholder="如：弱咬雪、卡宾稳定"
            onChange={(e) => setForm({ ...form, preference: e.target.value })}
          />
        </label>
      </div>
      <p className="form-tip">
        工单创建后进入「待复核」：需先在底板标记修补位置（或确认无损伤），才能登记刃角复核。
      </p>
    </form>
  );
}
