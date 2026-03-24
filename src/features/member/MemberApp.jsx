import { Suspense, lazy, useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api.js";
import {
  APP_TIME_ZONE,
  APP_NAME,
  CUSTOM_MOOD_ICONS,
  DEFAULT_CATEGORY_ICONS,
  NAV_ITEMS,
} from "../../lib/constants.js";
import { IllustrationIcon } from "../shared/IllustrationIcon.jsx";
import { MoodToast } from "../shared/MoodToast.jsx";
import { MoodTab } from "./MoodTab.jsx";
import { WellnessTab } from "./WellnessTab.jsx";
import {
  COLORS,
  getMonthKey,
  getPlantMeta,
  getPlantProgressPercent,
  pickTipsBySeason,
  toDateKey,
} from "../../lib/ui.js";

const ExpenseTab = lazy(() =>
  import("./ExpenseTab.jsx").then((module) => ({ default: module.ExpenseTab }))
);

function getGreeting() {
  return "早上好呀";
}

function Header({ session, onLogout, unreadCount, canAccessCare, onOpenCareApp }) {
  const headerDate = new Intl.DateTimeFormat("zh-CN", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());

  return (
    <header className="header-card">
      <div className="date-row">
        <span>{headerDate}</span>
        <div className="header-actions">
          <div className="user-chip">
            <IllustrationIcon name="clover" className="inline-art-icon" />
            <span>{session.user.username}</span>
          </div>
          {canAccessCare ? (
            <button
              type="button"
              className="ghost-button"
              onClick={onOpenCareApp}
              data-testid="open-care-app"
            >
              去回复端
            </button>
          ) : null}
          <button type="button" className="ghost-button" onClick={onLogout}>
            退出登录
          </button>
        </div>
      </div>
      <div className="greeting-row">
        <div>
          <h1>{getGreeting()}</h1>
          <div className="section-note">
            {unreadCount > 0 ? `有 ${unreadCount} 条新回复，记得看看。` : "今天也一起把日子照顾得更从容一点。"}
          </div>
        </div>
        <div className="leaf-badge">
          <IllustrationIcon name="clover" />
        </div>
      </div>
    </header>
  );
}

function TabLoadingCard() {
  return (
    <div className="panel">
      <div className="section-note">{APP_NAME}</div>
      <div className="meta-title" style={{ marginTop: 8 }}>
        正在载入
      </div>
      <p className="meta-subtitle" style={{ marginTop: 10, lineHeight: 1.8 }}>
        这一部分内容正在按需准备。
      </p>
    </div>
  );
}

function handleRequestError(requestError, onRequestError, setError) {
  if (requestError instanceof ApiError && requestError.status === 401) {
    onRequestError(requestError);
    return;
  }

  setError(requestError.message);
}

export function MemberApp({ session, onLogout, onOpenCareApp, onRequestError }) {
  const [activeTab, setActiveTab] = useState("mood");
  const [moodItems, setMoodItems] = useState([]);
  const [customMoods, setCustomMoods] = useState([]);
  const [latestReply, setLatestReply] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [moodSubmitting, setMoodSubmitting] = useState("");
  const [showCustomMoodPanel, setShowCustomMoodPanel] = useState(false);
  const [customMoodForm, setCustomMoodForm] = useState({
    label: "",
    icon: CUSTOM_MOOD_ICONS[0],
  });
  const [toastMood, setToastMood] = useState(null);
  const [wellnessTips, setWellnessTips] = useState([]);
  const [checkinProgress, setCheckinProgress] = useState({
    checkedInToday: false,
    streakCount: 0,
    totalCount: 0,
    plantStage: "种子",
    nextStageAt: 1,
    recentDates: [],
  });
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [expenseMonths, setExpenseMonths] = useState([]);
  const [expenseView, setExpenseView] = useState("detail");
  const [expenseForm, setExpenseForm] = useState({ amount: "", categoryId: "", note: "" });
  const [showCategoryPanel, setShowCategoryPanel] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    icon: DEFAULT_CATEGORY_ICONS[0],
  });
  const [expandedMonths, setExpandedMonths] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [busyMessage, setBusyMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [checkinNotice, setCheckinNotice] = useState({ tone: "", message: "" });
  const [expenseNotice, setExpenseNotice] = useState({ tone: "", message: "" });
  const currentMonthKey = getMonthKey(new Date());

  useEffect(() => {
    void Promise.all([
      refreshMoodData(),
      refreshCustomMoods(),
      refreshCheckins(),
      refreshExpenses(),
      refreshCategories(),
    ]);
    setWellnessTips(pickTipsBySeason());
  }, []);

  useEffect(() => {
    if (expenseMonths.length === 0) {
      return;
    }

    setExpandedMonths((prev) => {
      if (Object.keys(prev).length > 0) {
        return prev;
      }

      const next = {};
      for (const month of expenseMonths) {
        next[month.month] = month.month === currentMonthKey;
      }
      return next;
    });
  }, [expenseMonths, currentMonthKey]);

  useEffect(() => {
    if (categories.length && !expenseForm.categoryId) {
      setExpenseForm((prev) => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [categories, expenseForm.categoryId]);

  useEffect(() => {
    if (!toastMood) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToastMood(null), 1000);
    return () => window.clearTimeout(timer);
  }, [toastMood]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "mood" || unreadCount === 0) {
      return;
    }

    void markAllRepliesRead(false);
  }, [activeTab, unreadCount]);

  async function refreshMoodData() {
    try {
      const moodsData = await api("/api/moods?limit=8");
      setMoodItems(moodsData.items || []);
      setLatestReply(moodsData.latestReply || null);
      setUnreadCount(moodsData.unreadCount || 0);
    } catch (requestError) {
      handleRequestError(requestError, onRequestError, setError);
    }
  }

  async function refreshCustomMoods() {
    try {
      const response = await api("/api/custom-moods");
      setCustomMoods(response.items || []);
    } catch (requestError) {
      handleRequestError(requestError, onRequestError, setError);
    }
  }

  async function refreshCheckins() {
    try {
      const response = await api("/api/checkins/progress");
      setCheckinProgress(response);
    } catch (requestError) {
      handleRequestError(requestError, onRequestError, setError);
    }
  }

  async function refreshCategories() {
    try {
      const response = await api("/api/categories");
      const items = response.items || [];
      setCategories(items);
      return items;
    } catch (requestError) {
      handleRequestError(requestError, onRequestError, setError);
      return [];
    }
  }

  async function refreshExpenses() {
    try {
      const response = await api("/api/expenses/grouped");
      setExpenseMonths(response.months || []);
    } catch (requestError) {
      handleRequestError(requestError, onRequestError, setError);
    }
  }

  async function submitMood(mood) {
    setError("");
    setFeedback("");
    setMoodSubmitting(mood.key);
    try {
      await api("/api/moods", { method: "POST", body: JSON.stringify({ moodKey: mood.key }) });
      setToastMood(mood);
      setFeedback("心情已记录。");
      await refreshMoodData();
    } catch (requestError) {
      handleRequestError(requestError, onRequestError, setError);
    } finally {
      setMoodSubmitting("");
    }
  }

  async function submitCustomMood(mood) {
    setError("");
    setFeedback("");
    setMoodSubmitting(mood.id);
    try {
      await api("/api/moods", {
        method: "POST",
        body: JSON.stringify({ customMoodId: mood.id }),
      });
      setToastMood({ icon: mood.icon, label: mood.label });
      setFeedback("心情已记录。");
      await refreshMoodData();
    } catch (requestError) {
      handleRequestError(requestError, onRequestError, setError);
    } finally {
      setMoodSubmitting("");
    }
  }

  async function markAllRepliesRead(showFeedback = true) {
    try {
      await api("/api/replies/read-all", {
        method: "POST",
      });
      if (showFeedback) {
        setFeedback("已自动更新阅读状态。");
      }
      await refreshMoodData();
    } catch (requestError) {
      handleRequestError(requestError, onRequestError, setError);
    }
  }

  async function submitCheckin() {
    if (checkinProgress.checkedInToday) {
      setCheckinNotice({ tone: "success", message: "今天已经打卡。" });
      setError("");
      return;
    }

    setCheckinLoading(true);
    setError("");
    setFeedback("");
    setCheckinNotice({ tone: "", message: "" });
    try {
      const result = await api("/api/checkins", { method: "POST" });
      setCheckinNotice({ tone: "success", message: "今天已经打卡。" });
      setCheckinProgress(result);
    } catch (requestError) {
      setCheckinNotice({ tone: "error", message: requestError.message });
      handleRequestError(requestError, onRequestError, setError);
    } finally {
      setCheckinLoading(false);
    }
  }

  async function submitExpense(event) {
    event.preventDefault();
    setBusyMessage("正在记下来...");
    setExpenseSubmitting(true);
    setError("");
    setFeedback("");
    setExpenseNotice({ tone: "", message: "" });
    try {
      const result = await api("/api/expenses", {
        method: "POST",
        body: JSON.stringify(expenseForm),
      });
      setExpenseForm((prev) => ({ ...prev, amount: "", note: "" }));
      setExpenseNotice({ tone: "success", message: "账目已记录。" });
      setExpenseMonths(result.months || []);
    } catch (requestError) {
      setExpenseNotice({ tone: "error", message: requestError.message });
      handleRequestError(requestError, onRequestError, setError);
    } finally {
      setBusyMessage("");
      setExpenseSubmitting(false);
    }
  }

  async function createCustomMood() {
    setBusyMessage("正在添加心情...");
    setError("");
    setFeedback("");
    try {
      const response = await api("/api/custom-moods", {
        method: "POST",
        body: JSON.stringify(customMoodForm),
      });
      setCustomMoodForm({ label: "", icon: CUSTOM_MOOD_ICONS[0] });
      setShowCustomMoodPanel(false);
      setFeedback(`已添加心情“${response.item.label}”。`);
      await refreshCustomMoods();
    } catch (requestError) {
      handleRequestError(requestError, onRequestError, setError);
    } finally {
      setBusyMessage("");
    }
  }

  async function deleteCustomMood(id) {
    if (!window.confirm("删除这个自定义心情后，历史记录仍会保留。继续吗？")) {
      return;
    }

    setBusyMessage("正在删除心情...");
    setError("");
    setFeedback("");
    try {
      await api(`/api/custom-moods/${id}`, { method: "DELETE" });
      setFeedback("自定义心情已删除。");
      await refreshCustomMoods();
      await refreshMoodData();
    } catch (requestError) {
      handleRequestError(requestError, onRequestError, setError);
    } finally {
      setBusyMessage("");
    }
  }

  async function createCategory() {
    setBusyMessage("正在添加分类...");
    setError("");
    setFeedback("");
    try {
      const response = await api("/api/categories", {
        method: "POST",
        body: JSON.stringify(newCategory),
      });
      const category = response.item || response.category;
      if (!category?.id) {
        throw new Error("新增分类返回不完整。");
      }
      setShowCategoryPanel(false);
      setNewCategory({ name: "", icon: DEFAULT_CATEGORY_ICONS[0] });
      setExpenseForm((prev) => ({ ...prev, categoryId: category.id }));
      setFeedback(`已添加分类“${category.name}”。`);
      await refreshCategories();
    } catch (requestError) {
      handleRequestError(requestError, onRequestError, setError);
    } finally {
      setBusyMessage("");
    }
  }

  async function deleteCategory(id) {
    if (!window.confirm("删除这个自定义分类后，历史账目仍会保留。继续吗？")) {
      return;
    }

    setBusyMessage("正在删除分类...");
    setError("");
    setFeedback("");
    try {
      await api(`/api/categories/${id}`, { method: "DELETE" });
      const items = await refreshCategories();
      if (expenseForm.categoryId === id && items.length) {
        setExpenseForm((prev) => ({ ...prev, categoryId: items[0].id }));
      }
      setFeedback("自定义分类已删除。");
      await refreshExpenses();
    } catch (requestError) {
      handleRequestError(requestError, onRequestError, setError);
    } finally {
      setBusyMessage("");
    }
  }

  async function deleteExpense(id) {
    if (!window.confirm("要删除这条账目吗？")) {
      return;
    }

    setBusyMessage("正在删除账目...");
    setError("");
    setFeedback("");
    try {
      const result = await api(`/api/expenses/${id}`, { method: "DELETE" });
      setFeedback("账目已删除。");
      if (Array.isArray(result.months)) {
        setExpenseMonths(result.months);
      } else {
        await refreshExpenses();
      }
    } catch (requestError) {
      handleRequestError(requestError, onRequestError, setError);
    } finally {
      setBusyMessage("");
    }
  }

  function toggleMonth(month) {
    setExpandedMonths((prev) => ({ ...prev, [month]: !prev[month] }));
  }

  function toggleCategory(month, categoryId) {
    const key = `${month}__${categoryId}`;
    setExpandedCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const totalExpenseCount = expenseMonths.reduce((sum, month) => sum + month.count, 0);
  const totalExpenseAmount = expenseMonths.reduce(
    (sum, month) => sum + month.totalAmount,
    0
  );
  const pieData = [];
  const categoryTotals = {};
  const dailyTotals = {};
  const today = new Date();
  const recentDays = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    recentDays.push({
      key: toDateKey(date),
      label: new Intl.DateTimeFormat("zh-CN", {
        timeZone: APP_TIME_ZONE,
        month: "numeric",
        day: "numeric",
      }).format(date),
      amount: 0,
    });
  }

  for (const month of expenseMonths) {
    for (const category of month.categories || []) {
      if (!categoryTotals[category.categoryId]) {
        categoryTotals[category.categoryId] = { name: category.label, value: 0 };
      }
      categoryTotals[category.categoryId].value += category.totalAmount;

      for (const item of category.items || []) {
        const dayKey = toDateKey(new Date(item.spentAt));
        dailyTotals[dayKey] = (dailyTotals[dayKey] || 0) + item.amount;
      }
    }
  }

  for (const key of Object.keys(categoryTotals)) {
    pieData.push(categoryTotals[key]);
  }
  pieData.sort((left, right) => right.value - left.value);

  const barData = recentDays.map((day) => ({
    name: day.label,
    amount: Number((dailyTotals[day.key] || 0).toFixed(2)),
  }));
  const plantMeta = getPlantMeta(checkinProgress.plantStage);
  const progressPercent = getPlantProgressPercent(
    checkinProgress.totalCount,
    checkinProgress.nextStageAt
  );

  return (
    <div className="shell">
      <div className="screen">
        <Header
          session={session}
          onLogout={onLogout}
          unreadCount={unreadCount}
          canAccessCare={session.capabilities.canAccessCare}
          onOpenCareApp={onOpenCareApp}
        />

        {error ? <div className="error-text" style={{ marginBottom: 12 }}>{error}</div> : null}
        {feedback ? (
          <div className="success-text" style={{ marginBottom: 12 }}>
            {feedback}
          </div>
        ) : null}
        {busyMessage ? (
          <div className="section-note" style={{ marginBottom: 12 }}>
            {busyMessage}
          </div>
        ) : null}

        {activeTab === "mood" ? (
          <MoodTab
            moodItems={moodItems}
            latestReply={latestReply}
            unreadCount={unreadCount}
            customMoods={customMoods}
            showCustomMoodPanel={showCustomMoodPanel}
            setShowCustomMoodPanel={setShowCustomMoodPanel}
            customMoodForm={customMoodForm}
            setCustomMoodForm={setCustomMoodForm}
            moodSubmitting={moodSubmitting}
            onSubmitMood={submitMood}
            onSubmitCustomMood={submitCustomMood}
            onCreateCustomMood={createCustomMood}
            onDeleteCustomMood={deleteCustomMood}
          />
        ) : null}

        {activeTab === "wellness" ? (
          <WellnessTab
            tips={wellnessTips}
            onRefreshTips={() => setWellnessTips(pickTipsBySeason())}
            checkinProgress={checkinProgress}
            checkinLoading={checkinLoading}
            onSubmitCheckin={submitCheckin}
            plantMeta={plantMeta}
            progressPercent={progressPercent}
            notice={checkinNotice}
          />
        ) : null}

        {activeTab === "expense" ? (
          <Suspense fallback={<TabLoadingCard />}>
            <ExpenseTab
              categories={categories}
              expenseForm={expenseForm}
              setExpenseForm={setExpenseForm}
              showCategoryPanel={showCategoryPanel}
              setShowCategoryPanel={setShowCategoryPanel}
              newCategory={newCategory}
              setNewCategory={setNewCategory}
              onCreateCategory={createCategory}
              onDeleteCategory={deleteCategory}
              onSubmitExpense={submitExpense}
              expenseView={expenseView}
              setExpenseView={setExpenseView}
              expenseMonths={expenseMonths}
              expandedMonths={expandedMonths}
              toggleMonth={toggleMonth}
              expandedCategories={expandedCategories}
              toggleCategory={toggleCategory}
              onDeleteExpense={deleteExpense}
              totalExpenseAmount={totalExpenseAmount}
              totalExpenseCount={totalExpenseCount}
              pieData={pieData}
              barData={barData}
              colors={COLORS}
              expenseSubmitting={expenseSubmitting}
              notice={expenseNotice}
            />
          </Suspense>
        ) : null}
      </div>

      <nav className="tabs-bar">
        {NAV_ITEMS.map((item) => (
          <button
            type="button"
            key={item.key}
            className={`nav-button ${activeTab === item.key ? "active" : ""}`}
            onClick={() => setActiveTab(item.key)}
          >
            {item.key === "mood" && unreadCount > 0 ? (
              <span className="tab-badge">{Math.min(unreadCount, 9)}</span>
            ) : null}
            <span className="icon">
              <IllustrationIcon name={item.key} className="nav-illustration" />
            </span>
            <span>{item.label}</span>
            {activeTab === item.key ? <span className="nav-dot" /> : null}
          </button>
        ))}
      </nav>

      {toastMood ? <MoodToast mood={toastMood} /> : null}
    </div>
  );
}
