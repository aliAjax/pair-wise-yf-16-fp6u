import {
  STAGE_FILTERS,
  STAGE_LABELS,
  type StageFilter,
  type WorkOrder,
  type BoardShape,
} from "../types";
import { isDamageRecorded } from "../domain/orders";

interface OrderListProps {
  orders: WorkOrder[];
  stage: StageFilter;
  shape: BoardShape | "all";
  keyword: string;
  onStageChange: (stage: StageFilter) => void;
  onShapeChange: (shape: BoardShape | "all") => void;
  onKeywordChange: (keyword: string) => void;
  onOpen: (order: WorkOrder) => void;
}

const SHAPE_FILTERS: (BoardShape | "all")[] = ["all", "全地域", "公园板", "竞速板", "粉雪板"];

/** 工单列表与筛选条：筛选条件受 App 控制，切换/刷新后由父层保持原样 */
export function OrderList({
  orders,
  stage,
  shape,
  keyword,
  onStageChange,
  onShapeChange,
  onKeywordChange,
  onOpen,
}: OrderListProps) {
  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>维护工单列表</p>
          <h2>
            工作台（{orders.length}
            {stage === "completed" ? " 张已完工" : " 张"}）
          </h2>
        </div>
        <input
          className="search-box"
          value={keyword}
          placeholder="搜索单号 / 客户 / 品牌"
          onChange={(e) => onKeywordChange(e.target.value)}
        />
      </div>

      <div className="filter-bar">
        <div className="chips">
          {STAGE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              className={stage === filter.value ? "chip active" : "chip"}
              onClick={() => onStageChange(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="chips">
          {SHAPE_FILTERS.map((value) => (
            <button
              key={value}
              className={shape === value ? "chip active ghost" : "chip ghost"}
              onClick={() => onShapeChange(value)}
            >
              {value === "all" ? "全部板型" : value}
            </button>
          ))}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="empty">当前筛选条件下没有工单。</div>
      ) : (
        <div className="order-table">
          <div className="order-row head">
            <span>单号</span>
            <span>客户 / 雪板</span>
            <span>刃角（底/侧）</span>
            <span>底板</span>
            <span>状态</span>
            <span></span>
          </div>
          {orders.map((order) => (
            <div key={order.id} className="order-row" onClick={() => onOpen(order)}>
              <span className="cell-id">{order.id}</span>
              <span>
                <b>{order.customer}</b>
                <small>
                  {order.brand} · {order.lengthCm}cm · {order.shape}
                  {order.preference ? ` · ${order.preference}` : ""}
                </small>
              </span>
              <span className="cell-angles">
                {order.edgeAngles.base}° / {order.edgeAngles.side}°
                {order.review && <em title="刃角已复核">✓</em>}
              </span>
              <span className={isDamageRecorded(order) ? "damage ok" : "damage pending"}>
                {order.noDamage
                  ? "无损伤"
                  : order.damageMarks.length > 0
                    ? `标记 ${order.damageMarks.length} 处`
                    : "未检查"}
              </span>
              <span className={`stage-badge ${order.stage}`}>{STAGE_LABELS[order.stage]}</span>
              <span className="open-link">打开 →</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
