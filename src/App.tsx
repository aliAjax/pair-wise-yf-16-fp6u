import { useMemo, useState } from "react";
import "./styles.css";
import type { BoardShape, StageFilter, WorkOrder } from "./types";
import { STAGE_LABELS } from "./types";
import {
  edgeAngleStats,
  filterOrders,
  isDamageRecorded,
} from "./domain/orders";
import { useWorkOrders } from "./data/useWorkOrders";
import { OrderForm } from "./components/OrderForm";
import { OrderList } from "./components/OrderList";
import { OrderDetail } from "./components/OrderDetail";
import { CustomerHistory } from "./components/CustomerHistory";

function App() {
  const store = useWorkOrders();

  // 筛选状态放在 App 层：拒绝新工单、打开/关闭详情都不会改动列表与筛选
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [shapeFilter, setShapeFilter] = useState<BoardShape | "all">("all");
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visibleOrders = useMemo(
    () =>
      filterOrders(store.orders, {
        stage: stageFilter,
        shape: shapeFilter,
        keyword,
      }),
    [store.orders, stageFilter, shapeFilter, keyword],
  );

  // 详情里的工单始终来自最新数据，刃角/标记/状态改动会实时同步
  const selected = selectedId
    ? store.orders.find((order) => order.id === selectedId) ?? null
    : null;

  const stats = useMemo(() => {
    const pending = store.orders.filter((order) => order.stage === "pending_review").length;
    const completed = store.orders.filter(
      (order) => order.stage === "completed" || order.stage === "delivered",
    ).length;
    const angles = edgeAngleStats(store.orders);
    const damageCount = store.orders.reduce(
      (acc, order) => acc + order.damageMarks.length,
      0,
    );
    return { pending, completed, angles, damageCount };
  }, [store.orders]);

  function openOrder(order: WorkOrder) {
    setSelectedId(order.id);
  }

  return (
    <main className="app">
      <section className="hero">
        <p>SKI TUNING WORKBENCH · 雪板调校工单台</p>
        <h1>雪板调校工单台</h1>
        <span>
          每张工单记录品牌、长度、板型与客户偏好。底板标记修补位置后才能登记刃角复核；
          复核通过后改动刃角或客户偏好，原复核失效并回到待复核。
          同一客户已有未交付雪板时新工单拒绝登记。数据仅保存在本浏览器，刷新后保留。
        </span>
      </section>

      <section className="metrics">
        <article>
          <small>待复核工单</small>
          <strong>{stats.pending}</strong>
        </article>
        <article>
          <small>完工工单（含已交付）</small>
          <strong>{stats.completed}</strong>
        </article>
        <article>
          <small>平均刃角（底刃/侧刃）</small>
          <strong>
            {store.orders.length === 0
              ? "—"
              : `${stats.angles.avgBase}° / ${stats.angles.avgSide}°`}
          </strong>
        </article>
        <article>
          <small>底板修补标记</small>
          <strong>{stats.damageCount}</strong>
        </article>
      </section>

      <section className="workspace">
        <aside className="side-col">
          <section className="panel rules-panel">
            <h2>状态流转规则</h2>
            <ol className="rules">
              <li>
                <span className="stage-badge pending_review">{STAGE_LABELS.pending_review}</span>
                新建工单起始状态；须先登记底板损伤
              </li>
              <li>
                <span className="stage-badge reviewed">{STAGE_LABELS.reviewed}</span>
                底板已标记 + 刃角复核通过
              </li>
              <li>
                <span className="stage-badge completed">{STAGE_LABELS.completed}</span>
                复核通过后才可完工
              </li>
              <li>
                <span className="stage-badge delivered">{STAGE_LABELS.delivered}</span>
                完工后交付，释放客户在厂雪板名额
              </li>
            </ol>
            <p className="rule-note">
              复核通过后改动刃角或客户偏好 → 复核立即失效，回到
              <span className="stage-badge pending_review">{STAGE_LABELS.pending_review}</span>
              。当前已登记底板的工单：
              {store.orders.filter(isDamageRecorded).length} / {store.orders.length}
            </p>
          </section>
          <CustomerHistory orders={store.orders} onOpen={openOrder} />
        </aside>

        <div className="main-col">
          <OrderForm orders={store.orders} onCreate={store.create} />
          <OrderList
            orders={visibleOrders}
            stage={stageFilter}
            shape={shapeFilter}
            keyword={keyword}
            onStageChange={setStageFilter}
            onShapeChange={setShapeFilter}
            onKeywordChange={setKeyword}
            onOpen={openOrder}
          />
        </div>
      </section>

      {selected && (
        <OrderDetail
          order={selected}
          onClose={() => setSelectedId(null)}
          onReview={store.review}
          onUpdate={store.update}
          onAddMark={store.markDamage}
          onRemoveMark={store.deleteDamageMark}
          onComplete={store.complete}
          onDeliver={store.deliver}
        />
      )}
    </main>
  );
}

export default App;
