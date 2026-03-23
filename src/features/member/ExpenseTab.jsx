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
import { DEFAULT_CATEGORY_ICONS } from "../../lib/constants.js";
import { formatCurrency, formatDateTime, formatMonthLabel } from "../../lib/format.js";
import { CATEGORY_ARTS, getCategoryArtName, IllustrationIcon } from "../shared/IllustrationIcon.jsx";

export function ExpenseTab({
  categories,
  expenseForm,
  setExpenseForm,
  showCategoryPanel,
  setShowCategoryPanel,
  newCategory,
  setNewCategory,
  onCreateCategory,
  onDeleteCategory,
  onSubmitExpense,
  expenseView,
  setExpenseView,
  expenseMonths,
  expandedMonths,
  toggleMonth,
  expandedCategories,
  toggleCategory,
  onDeleteExpense,
  totalExpenseAmount,
  totalExpenseCount,
  pieData,
  barData,
  colors,
  expenseSubmitting,
  notice,
}) {
  return (
    <>
      <form className="input-card" onSubmit={onSubmitExpense}>
        <div className="section-title">
          <h2>记一笔支出</h2>
          <span className="section-note">按月份和分类慢慢整理</span>
        </div>

        <div className="currency-input">
          <span>¥</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={expenseForm.amount}
            onChange={(event) =>
              setExpenseForm((prev) => ({ ...prev, amount: event.target.value }))
            }
            data-testid="expense-amount"
          />
        </div>

        <div className="field">
          <label>分类</label>
          <div className="pill-row">
            {categories.map((category) => (
              <button
                type="button"
                key={category.id}
                className={`pill-button ${expenseForm.categoryId === category.id ? "active" : ""}`}
                onClick={() =>
                  setExpenseForm((prev) => ({ ...prev, categoryId: category.id }))
                }
              >
                <IllustrationIcon
                  name={getCategoryArtName(category.id, category.name, category.icon)}
                  className="inline-art-icon"
                />
                <span>{category.name}</span>
                {!category.isDefault ? (
                  <span
                    className="chip-close"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteCategory(category.id);
                    }}
                  >
                    ×
                  </span>
                ) : null}
              </button>
            ))}
            <button
              type="button"
              className="pill-button add"
              onClick={() => setShowCategoryPanel((prev) => !prev)}
            >
              添加
            </button>
          </div>
        </div>

        {showCategoryPanel ? (
          <div className="inline-panel" style={{ marginBottom: 14 }}>
            <div className="field">
              <label>新分类名称</label>
              <input
                className="text-input"
                value={newCategory.name}
                onChange={(event) =>
                  setNewCategory((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="例如：家居、宠物、旅行"
              />
            </div>
            <div className="field">
              <label>选择图标</label>
              <div className="icon-grid">
                {DEFAULT_CATEGORY_ICONS.map((icon, index) => (
                  <button
                    type="button"
                    key={icon}
                    className={`icon-chip ${newCategory.icon === icon ? "active" : ""}`}
                    onClick={() => setNewCategory((prev) => ({ ...prev, icon }))}
                  >
                    <IllustrationIcon
                      name={CATEGORY_ARTS[index]}
                      className="picker-illustration"
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="button-row">
              <button type="button" className="primary-button" onClick={onCreateCategory}>
                确认添加
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setShowCategoryPanel(false)}
              >
                取消
              </button>
            </div>
          </div>
        ) : null}

        <div className="field">
          <label>备注</label>
          <input
            className="text-input"
            value={expenseForm.note}
            onChange={(event) => setExpenseForm((prev) => ({ ...prev, note: event.target.value }))}
            placeholder="这笔花费用来做什么，可以不填"
          />
        </div>

        <button
          type="submit"
          className="primary-button"
          style={{ width: "100%" }}
          data-testid="expense-submit"
          disabled={expenseSubmitting}
        >
          {expenseSubmitting ? "记录中..." : "记下来"}
        </button>
        {notice?.message ? (
          <div className={notice.tone === "error" ? "error-text" : "success-text"} style={{ marginTop: 12 }}>
            {notice.message}
          </div>
        ) : null}
      </form>

      <div className="toggle-row" style={{ margin: "16px 0 14px" }}>
        <button
          type="button"
          className={`pill-button ${expenseView === "detail" ? "active" : ""}`}
          onClick={() => setExpenseView("detail")}
        >
          <IllustrationIcon name="message" className="inline-art-icon" /> 明细
        </button>
        <button
          type="button"
          className={`pill-button ${expenseView === "summary" ? "active" : ""}`}
          onClick={() => setExpenseView("summary")}
        >
          <IllustrationIcon name="expense" className="inline-art-icon" /> 汇总
        </button>
      </div>

      {expenseView === "summary" ? (
        <>
          <section className="summary-card">
            <div className="section-note">总支出</div>
            <div className="summary-amount">¥ {formatCurrency(totalExpenseAmount)}</div>
            <div className="meta-subtitle">共 {totalExpenseCount} 笔记录</div>
          </section>

          <section className="chart-card">
            <div className="section-title">
              <h3>分类占比</h3>
            </div>
            {pieData.length === 0 ? (
              <div className="empty-card">还没有账目，先记下一笔，图表就会慢慢长出来。</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={92}
                    paddingAngle={3}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`${entry.name}-${index}`}
                        fill={[
                          colors.primary,
                          colors.peach,
                          colors.blue,
                          colors.lavender,
                          colors.yellow,
                          colors.rose,
                        ][index % 6]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `¥ ${formatCurrency(value)}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </section>

          <section className="chart-card">
            <div className="section-title">
              <h3>最近 7 天</h3>
            </div>
            {barData.every((item) => item.amount === 0) ? (
              <div className="empty-card">最近 7 天还没有支出记录，图表会在有数据后自动显示。</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} margin={{ left: -16, right: 6, top: 10, bottom: 6 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(107, 175, 123, 0.12)" />
                  <XAxis dataKey="name" tick={{ fill: colors.muted, fontSize: 12 }} />
                  <YAxis tick={{ fill: colors.muted, fontSize: 12 }} />
                  <Tooltip formatter={(value) => `¥ ${formatCurrency(value)}`} />
                  <Bar dataKey="amount" fill={colors.primary} radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </section>
        </>
      ) : (
        <div className="list-stack">
          {expenseMonths.length === 0 ? (
            <div className="empty-card">账本还是空的。先记下一笔，月份和分类会自动整理好。</div>
          ) : (
            expenseMonths.map((month) => (
              <article className="month-card" key={month.month}>
                <button
                  type="button"
                  className="accordion-button"
                  onClick={() => toggleMonth(month.month)}
                >
                  <div>
                    <div className="meta-title">{formatMonthLabel(month.month)}</div>
                    <div className="meta-subtitle">
                      共 {month.count} 笔 · ¥ {formatCurrency(month.totalAmount)}
                    </div>
                  </div>
                  <span>{expandedMonths[month.month] ? "收起" : "展开"}</span>
                </button>

                {expandedMonths[month.month] ? (
                  <div>
                    {month.categories.map((category) => {
                      const key = `${month.month}__${category.categoryId}`;
                      const expanded = Boolean(expandedCategories[key]);
                      return (
                        <div className="category-card" key={key}>
                          <button
                            type="button"
                            className="accordion-button"
                            onClick={() => toggleCategory(month.month, category.categoryId)}
                          >
                            <div>
                              <div
                                className="meta-title"
                                style={{
                                  fontSize: 17,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <IllustrationIcon
                                  name={getCategoryArtName(
                                    category.categoryId,
                                    category.label,
                                    category.icon
                                  )}
                                  className="inline-art-icon"
                                />
                                <span>{category.label}</span>
                              </div>
                              <div className="meta-subtitle">
                                {category.count} 笔 · ¥ {formatCurrency(category.totalAmount)}
                              </div>
                            </div>
                            <span>{expanded ? "收起" : "查看"}</span>
                          </button>

                          {expanded ? (
                            <div>
                              {category.items.map((item) => (
                                <div className="expense-item" key={item.id}>
                                  <div className="expense-meta">
                                    <div className="mini-emoji">
                                      <IllustrationIcon
                                        name={getCategoryArtName(
                                          category.categoryId,
                                          category.label,
                                          category.icon
                                        )}
                                        className="card-illustration"
                                      />
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 700 }}>
                                        {item.note || "没有备注"}
                                      </div>
                                      <div className="meta-subtitle">
                                        {formatDateTime(item.spentAt)}
                                      </div>
                                    </div>
                                  </div>
                                  <div style={{ textAlign: "right" }}>
                                    <div className="amount">¥ {formatCurrency(item.amount)}</div>
                                    <button
                                      type="button"
                                      className="ghost-button"
                                      style={{ minHeight: 34, marginTop: 8, padding: "0 12px" }}
                                      onClick={() => onDeleteExpense(item.id)}
                                    >
                                      删除
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </article>
            ))
          )}
        </div>
      )}
    </>
  );
}
