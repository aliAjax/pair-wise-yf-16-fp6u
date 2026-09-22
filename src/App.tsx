import { useMemo, useState } from "react";
import { WorkbenchProvider, useWorkbench } from "./store";
import { matchesStatus, type StatusFilter } from "./rules";
import type { BoardType } from "./types";
import { MetricsBar } from "./components/MetricsBar";
import { Filters } from "./components/Filters";
import { OrderForm } from "./components/OrderForm";
import { OrderList } from "./components/OrderList";
import { OrderDetail } from "./components/OrderDetail";
import { CustomerHistory } from "./components/CustomerHistory";
import "./styles.css";

function Workbench() {
  const { orders } = useWorkbench();
  const [status, setStatus] = useState<StatusFilter>("active");
  const [boardType, setBoardType] = useState<BoardType | "全部">("全部");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visibleOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          matchesStatus(o, status) &&
          (boardType === "全部" || o.boardType === boardType)
      ),
    [orders, status, boardType]
  );

  // 列表和筛选保持原样：筛选变化不重置选中；当前选中不在筛选内时仅隐藏详情
  const selectedVisible =
    selectedId !== null && visibleOrders.some((o) => o.id === selectedId);

  const handleCreated = (id: string) => {
    setStatus("active");
    setBoardType("全部");
    setSelectedId(id);
  };

  return (
    <main className="app">
      <section className="hero">
        <p>hxyfront-62004 · 滑雪装备调校 · Port 62004</p>
        <h1>雪板调校工单台</h1>
        <span>
          每张工单记录品牌、长度、板型与客户偏好；底板损伤标记修补位置后才能登记刃角复核，
          复核通过后改动刃角或客户偏好将自动失效回到待复核。同一客户未交付雪板期间拒绝新单。
          数据只保存在本浏览器，刷新后保留。
        </span>
      </section>

      <MetricsBar orders={orders} />

      <section className="workspace">
        <Filters
          status={status}
          boardType={boardType}
          onStatus={setStatus}
          onBoardType={setBoardType}
        />
        <OrderForm onCreated={handleCreated} />
      </section>

      <section className="board-grid">
        <OrderList
          orders={visibleOrders}
          status={status}
          boardType={boardType}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        <div className="side-stack">
          {selectedVisible && selectedId ? (
            <OrderDetail orderId={selectedId} />
          ) : (
            <section className="panel detail-panel detail-placeholder">
              <p className="section-kicker">工单详情</p>
              <p className="muted">从左侧列表选择一张工单，维护刃角参数、底板损伤标记与复核。</p>
            </section>
          )}
          <CustomerHistory
            orders={orders}
            selectedId={selectedId}
            onSelect={(id) => {
              const o = orders.find((x) => x.id === id);
              if (!o) return;
              setSelectedId(id);
              setStatus(o.delivered ? "delivered" : o.review ? "passed" : "pending");
            }}
          />
        </div>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <WorkbenchProvider>
      <Workbench />
    </WorkbenchProvider>
  );
}
