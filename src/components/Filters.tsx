import { STATUS_FILTERS, type StatusFilter } from "../rules";
import { BOARD_TYPES, type BoardType } from "../types";

interface Props {
  status: StatusFilter;
  boardType: BoardType | "全部";
  onStatus: (s: StatusFilter) => void;
  onBoardType: (t: BoardType | "全部") => void;
}

export function Filters({ status, boardType, onStatus, onBoardType }: Props) {
  return (
    <aside className="panel filter-panel">
      <h2>完工状态筛选</h2>
      <div className="chips">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            className={status === f.key ? "chip active" : "chip"}
            onClick={() => onStatus(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <h2 className="filter-sub">板型筛选</h2>
      <div className="chips">
        <button
          className={boardType === "全部" ? "chip active" : "chip"}
          onClick={() => onBoardType("全部")}
        >
          全部板型
        </button>
        {BOARD_TYPES.map((t) => (
          <button
            key={t}
            className={boardType === t ? "chip active" : "chip"}
            onClick={() => onBoardType(t)}
          >
            {t}
          </button>
        ))}
      </div>
    </aside>
  );
}
