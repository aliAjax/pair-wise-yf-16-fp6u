import { useRef, useState } from "react";
import type { DamageMark } from "../types";

interface BaseBoardProps {
  marks: DamageMark[];
  disabled?: boolean;
  onAdd: (mark: { x: number; y: number; note: string }) => void;
  onRemove: (id: string) => void;
}

const WIDTH = 420;
const HEIGHT = 150;

/**
 * 底板损伤标记区：用 SVG 画出雪板底板轮廓，
 * 点击底板即在对应百分比坐标登记一个修补位置标记。
 */
export function BaseBoard({ marks, disabled = false, onAdd, onRemove }: BaseBoardProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  function handleClick(event: React.MouseEvent<SVGSVGElement>) {
    if (disabled || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    onAdd({
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      note: note.trim() || `底板损伤 ${marks.length + 1}`,
    });
    setNote("");
  }

  return (
    <div className="baseboard">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className={disabled ? "board disabled" : "board"}
        onClick={handleClick}
        role="img"
        aria-label="底板损伤标记图，点击底板添加修补位置"
      >
        <defs>
          <linearGradient id="boardGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f4c75" />
            <stop offset="50%" stopColor="#0369a1" />
            <stop offset="100%" stopColor="#0b3b63" />
          </linearGradient>
        </defs>
        {/* 底板轮廓：圆头板形 */}
        <rect
          x={WIDTH * 0.03}
          y={HEIGHT * 0.16}
          width={WIDTH * 0.94}
          height={HEIGHT * 0.68}
          rx={HEIGHT * 0.34}
          fill="url(#boardGrad)"
          stroke="#0b2c44"
          strokeWidth={2}
        />
        {/* 钢边示意线 */}
        <rect
          x={WIDTH * 0.045}
          y={HEIGHT * 0.2}
          width={WIDTH * 0.91}
          height={HEIGHT * 0.6}
          rx={HEIGHT * 0.3}
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth={1.5}
          strokeDasharray="6 6"
        />
        {!disabled && (
          <text x={WIDTH / 2} y={HEIGHT / 2 + 5} textAnchor="middle" className="board-hint">
            点击底板标记修补位置
          </text>
        )}
        {marks.map((mark, index) => (
          <g
            key={mark.id}
            className={`mark ${selected === mark.id ? "selected" : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              setSelected(mark.id === selected ? null : mark.id);
            }}
          >
            <circle
              cx={(mark.x / 100) * WIDTH}
              cy={(mark.y / 100) * HEIGHT}
              r={11}
              fill="#f97316"
              stroke="#ffffff"
              strokeWidth={2}
            />
            <text
              x={(mark.x / 100) * WIDTH}
              y={(mark.y / 100) * HEIGHT + 4}
              textAnchor="middle"
              className="mark-no"
            >
              {index + 1}
            </text>
          </g>
        ))}
      </svg>

      <div className="mark-tools">
        <input
          value={note}
          disabled={disabled}
          placeholder="下一个标记的备注，如：板底划痕 12cm"
          onChange={(event) => setNote(event.target.value)}
        />
      </div>

      {marks.length > 0 && (
        <ul className="mark-list">
          {marks.map((mark, index) => (
            <li key={mark.id} className={selected === mark.id ? "active" : ""}>
              <button
                type="button"
                className="mark-pick"
                onClick={() => setSelected(mark.id === selected ? null : mark.id)}
              >
                <b>{index + 1}</b>
                <span>{mark.note}</span>
                <small>
                  ({mark.x}%, {mark.y}%)
                </small>
              </button>
              {!disabled && (
                <button
                  type="button"
                  className="link-danger"
                  onClick={() => {
                    onRemove(mark.id);
                    if (selected === mark.id) setSelected(null);
                  }}
                >
                  删除
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
