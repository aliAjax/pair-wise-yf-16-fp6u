import { useState } from "react";
import { useWorkbench } from "../store";
import { BOARD_TYPES, WAX_TYPES, type BoardType, type WaxType } from "../types";
import { BASE_EDGE_MAX, BASE_EDGE_MIN, SIDE_EDGE_MAX, SIDE_EDGE_MIN } from "../rules";

interface Props {
  onCreated: (id: string) => void;
}

const EMPTY = {
  customer: "",
  brand: "",
  length: "",
  preference: "",
  side: "88",
  base: "1",
};

export function OrderForm({ onCreated }: Props) {
  const { create } = useWorkbench();
  const [boardType, setBoardType] = useState<BoardType>("全地域");
  const [wax, setWax] = useState<WaxType>("低温蜡");
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof EMPTY) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = () => {
    const length = Number(form.length);
    const result = create({
      customer: form.customer,
      brand: form.brand,
      length,
      boardType,
      preference: form.preference,
      wax,
      edge: { side: Number(form.side), base: Number(form.base) },
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setForm(EMPTY);
    setBoardType("全地域");
    setWax("低温蜡");
    onCreated(result.id);
  };

  return (
    <section className="panel form-panel">
      <div className="heading">
        <div>
          <p>登记新单</p>
          <h2>新增调校工单</h2>
        </div>
      </div>
      <div className="field-grid">
        <label>
          <span>客户 *</span>
          <input
            value={form.customer}
            onChange={set("customer")}
            placeholder="客户姓名"
          />
        </label>
        <label>
          <span>雪板品牌 *</span>
          <input
            value={form.brand}
            onChange={set("brand")}
            placeholder="如 Burton / Volkl"
          />
        </label>
        <label>
          <span>长度（cm）*</span>
          <input
            type="number"
            min={80}
            max={220}
            value={form.length}
            onChange={set("length")}
            placeholder="如 156"
          />
        </label>
        <label>
          <span>板型 *</span>
          <select
            value={boardType}
            onChange={(e) => setBoardType(e.target.value as BoardType)}
          >
            {BOARD_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>侧刃角度（{SIDE_EDGE_MIN}°~{SIDE_EDGE_MAX}°）*</span>
          <input
            type="number"
            step={0.5}
            min={SIDE_EDGE_MIN}
            max={SIDE_EDGE_MAX}
            value={form.side}
            onChange={set("side")}
          />
        </label>
        <label>
          <span>底刃角度（{BASE_EDGE_MIN}°~{BASE_EDGE_MAX}°）*</span>
          <input
            type="number"
            step={0.5}
            min={BASE_EDGE_MIN}
            max={BASE_EDGE_MAX}
            value={form.base}
            onChange={set("base")}
          />
        </label>
        <label>
          <span>打蜡类型</span>
          <select value={wax} onChange={(e) => setWax(e.target.value as WaxType)}>
            {WAX_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>客户偏好 *</span>
          <input
            value={form.preference}
            onChange={set("preference")}
            placeholder="如 弱咬雪、卡宾稳定"
          />
        </label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions">
        <button className="primary" onClick={handleSubmit}>
          登记工单
        </button>
        <span className="form-hint">
          同一客户存在未交付雪板时，新工单将被拒绝
        </span>
      </div>
    </section>
  );
}
