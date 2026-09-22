import { useWorkbench } from "../store";
import type { WorkOrder } from "../types";

interface Props {
  order: WorkOrder;
}

/** 底板损伤标记区：点击底板示意图登记修补位置后，方可登记刃角复核 */
export function DamageBoard({ order }: Props) {
  const { addDamageMark, updateDamageMark, removeDamageMark } = useWorkbench();
  const readonly = order.delivered;
  const hasClear = order.marks.some((m) => m.kind === "clear");

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (readonly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    addDamageMark(order.id, { x, y }, "repair");
  };

  return (
    <div className="damage-section">
      <div className="damage-head">
        <div>
          <p className="section-kicker">底板损伤标记区</p>
          <h3>
            修补位置
            <span className="mark-count">
              {order.marks.filter((m) => m.kind === "repair").length} 处损伤
            </span>
          </h3>
        </div>
        {!readonly && (
          <button
            className="ghost"
            disabled={hasClear}
            title="底板没有任何损伤时可标记一个免检点，作为复核前置条件"
            onClick={() => addDamageMark(order.id, { x: 50, y: 50 }, "clear")}
          >
            底板无损伤·标记免检点
          </button>
        )}
      </div>

      <svg
        className={`board-svg ${readonly ? "locked" : ""}`}
        viewBox="0 0 600 220"
        role="img"
        aria-label="底板示意图，点击标记损伤位置"
        onClick={handleClick}
      >
        <defs>
          <linearGradient id="baseFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8f4fb" />
            <stop offset="50%" stopColor="#cfe8f5" />
            <stop offset="100%" stopColor="#b9dcee" />
          </linearGradient>
        </defs>
        {/* 底板外形 */}
        <path
          d="M40 110 C40 60 90 34 170 30 L430 30 C510 34 560 60 560 110 C560 160 510 186 430 190 L170 190 C90 186 40 160 40 110 Z"
          fill="url(#baseFill)"
          stroke="#0369a1"
          strokeWidth="2.5"
        />
        <line x1="300" y1="36" x2="300" y2="184" stroke="#9fc4da" strokeWidth="1.5" strokeDasharray="6 6" />
        <text x="110" y="205" textAnchor="middle" fontSize="12" fill="#64748b">板尾</text>
        <text x="490" y="205" textAnchor="middle" fontSize="12" fill="#64748b">板头</text>
        {order.marks.map((m) => (
          <g key={m.id} className="mark-dot">
            <circle
              cx={(m.x / 100) * 600}
              cy={(m.y / 100) * 220}
              r={m.kind === "clear" ? 9 : 11}
              fill={m.kind === "clear" ? "#14b8a6" : "#f97316"}
              stroke="#ffffff"
              strokeWidth="2.5"
              opacity={m.repaired ? 0.45 : 1}
            />
            {m.repaired && (
              <text
                x={(m.x / 100) * 600}
                y={((m.y / 100) * 220) + 4}
                textAnchor="middle"
                fontSize="11"
                fill="#ffffff"
              >
                ✓
              </text>
            )}
          </g>
        ))}
      </svg>
      <p className="damage-tip">
        {readonly
          ? "已交付工单不可再标记。"
          : "点击底板任意位置登记修补位置；橙色为损伤点，青色为无损伤免检点。"}
      </p>

      {order.marks.length === 0 ? (
        <p className="muted">尚未标记，底板损伤标记后才能登记刃角复核。</p>
      ) : (
        <ul className="mark-list">
          {order.marks.map((m) => (
            <li key={m.id} className={m.kind === "clear" ? "clear-mark" : ""}>
              <span className={`mark-dot-chip ${m.kind}`} />
              <input
                value={m.note}
                disabled={readonly}
                onChange={(e) =>
                  updateDamageMark(order.id, m.id, { note: e.target.value })
                }
              />
              {m.kind === "repair" && (
                <label className="repair-check">
                  <input
                    type="checkbox"
                    checked={m.repaired}
                    disabled={readonly}
                    onChange={(e) =>
                      updateDamageMark(order.id, m.id, {
                        repaired: e.target.checked,
                      })
                    }
                  />
                  已修补
                </label>
              )}
              {!readonly && (
                <button
                  className="icon-btn"
                  title="删除标记"
                  onClick={() => removeDamageMark(order.id, m.id)}
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
