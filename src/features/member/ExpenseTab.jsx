import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CATEGORY_ICONS } from "../../lib/constants.js";
import { formatDateTime, formatMonthLabel } from "../../lib/format.js";

const CHART_COLORS = ["#6baf7b", "#f2a885", "#7eb8d8", "#b09bd6", "#e8c858", "#d88a9a"];

export function ExpenseTab({
  categories,
  months,
  onCreateCategory,
  onDeleteCategory,
  onAddExpense,
  onDeleteExpense,
}) {
  const [form, setForm] = useState({ amount: "", categoryId: categories[0]?.id || "", note: "" });
  const [customCategory, setCustomCategory] = useState({ name: "", icon: CATEGORY_ICONS[0] });
  const [view, setView] = useState("detail");

  const currentMonth = months[0] || null;
  const summaryData = useMemo(
    () =>
      (currentMonth?.categories || []).map((item) => ({
        name: item.label,
        value: item.totalAmount,
      })),
    [currentMonth]
  );

  async function submitExpense(event) {
    event.preventDefault();
    const done = await onAddExpense(form);
    if (done) {
      setForm((prev) => ({ ...prev, amount: "", note: "" }));
    }
  }

  async function submitCategory(event) {
    event.preventDefault();
    const done = await onCreateCategory(customCategory);
    if (done) {
      setCustomCategory({ name: "", icon: CATEGORY_ICONS[0] });
    }
  }

  return (
    <section className="stack-block">
      <form className="surface-card hero-card" onSubmit={submitExpense}>
        <div className="header-row">
          <div>
            <div className="eyebrow">记一笔支出</div>
            <h2>按月份和分类慢慢整理</h2>
          </div>
          <div className="money-preview">¥ {form.amount || "0.00"}</div>
        </div>

        <div className="field-row">
          <input
            className="text-input"
            inputMode="decimal"
            placeholder="0.00"
            value={form.amount}
            onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
            data-testid="expense-amount"
          />
          <input
            className="text-input"
            placeholder="这笔花费用来做什么，可以不填"
            value={form.note}
            onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
          />
        </div>

        <div className="pill-grid">
          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              className={`pill-button ${form.categoryId === category.id ? "active" : ""}`}
              onClick={() => setForm((prev) => ({ ...prev, categoryId: category.id }))}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>

        <button type="submit" className="primary-button" data-testid="expense-submit">
          记下来
        </button>
      </form>

      <form className="surface-card nested-card" onSubmit={submitCategory}>
        <div className="header-row">
          <div>
            <div className="eyebrow">自定义分类</div>
            <h3>把常用花费整理成自己的标签</h3>
          </div>
        </div>

        <div className="field-row">
          <input
            className="text-input"
            placeholder="例如：家居、宠物、旅行"
            value={customCategory.name}
            onChange={(event) => setCustomCategory((prev) => ({ ...prev, name: event.target.value }))}
          />
          <button type="submit" className="secondary-button">
            添加分类
          </button>
        </div>

        <div className="emoji-grid">
          {CATEGORY_ICONS.map((icon) => (
            <button
              type="button"
              key={icon}
              className={`emoji-pill ${customCategory.icon === icon ? "is-active" : ""}`}
              onClick={() => setCustomCategory((prev) => ({ ...prev, icon }))}
            >
              {icon}
            </button>
          ))}
        </div>

        <div className="stack-list tight">
          {categories
            .filter((category) => !category.isDefault)
            .map((category) => (
              <div className="compact-row" key={category.id}>
                <span>{category.icon} {category.name}</span>
                <button type="button" className="ghost-button danger-text" onClick={() => onDeleteCategory(category.id)}>
                  删除
                </button>
              </div>
            ))}
        </div>
      </form>

      <div className="surface-card nested-card">
        <div className="header-row">
          <div className="segmented-control">
            <button type="button" className={view === "detail" ? "is-active" : ""} onClick={() => setView("detail")}>
              明细
            </button>
            <button type="button" className={view === "summary" ? "is-active" : ""} onClick={() => setView("summary")}>
              汇总
            </button>
          </div>
        </div>

        {view === "summary" ? (
          currentMonth ? (
            <div className="chart-grid">
              <div className="chart-card">
                <div className="eyebrow">{formatMonthLabel(currentMonth.month)}</div>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={summaryData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={88}>
                      {summaryData.map((item, index) => (
                        <Cell key={item.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-card">
                <div className="eyebrow">最近月份总额</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={months.slice(0, 6).reverse()}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickFormatter={(value) => value.slice(5)} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="totalAmount" fill="#6baf7b" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="empty-card">先记一笔支出，之后这里会自动整理汇总。</div>
          )
        ) : months.length ? (
          <div className="stack-list">
            {months.map((month) => (
              <article className="list-card" key={month.month}>
                <div className="header-row">
                  <div>
                    <strong>{formatMonthLabel(month.month)}</strong>
                    <div className="muted-text">共 {month.count} 笔 · ¥ {month.totalAmount.toFixed(2)}</div>
                  </div>
                </div>

                <div className="stack-list tight">
                  {month.categories.map((category) => (
                    <div className="stack-list tight" key={category.categoryId}>
                      <div className="compact-row">
                        <strong>{category.icon} {category.label}</strong>
                        <span>¥ {category.totalAmount.toFixed(2)}</span>
                      </div>
                      {category.items.map((item) => (
                        <div className="reply-card" key={item.id}>
                          <div className="compact-row">
                            <strong>{item.note || item.label}</strong>
                            <span>¥ {item.amount.toFixed(2)}</span>
                          </div>
                          <div className="compact-row">
                            <span className="muted-text">{formatDateTime(item.spentAt)}</span>
                            <button type="button" className="ghost-button danger-text" onClick={() => onDeleteExpense(item.id)}>
                              删除
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-card">你还没有记账记录。先记一笔常见支出，汇总图表就会出现。</div>
        )}
      </div>
    </section>
  );
}
