import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../../lib/api.js";
import { TABS } from "../../lib/constants.js";
import { MoodTab } from "./MoodTab.jsx";
import { WellnessTab } from "./WellnessTab.jsx";

const ExpenseTab = lazy(() =>
  import("./ExpenseTab.jsx").then((module) => ({ default: module.ExpenseTab }))
);

function TabLoadingCard() {
  return (
    <div className="surface-card nested-card">
      <div className="eyebrow">正在载入</div>
      <p className="muted-text">这一部分内容正在按需加载。</p>
    </div>
  );
}

function Header({ session, onNavigate, onLogout }) {
  return (
    <header className="page-header">
      <div>
        <div className="eyebrow">{session.household.name}</div>
        <h1>早上好呀，{session.user.username}</h1>
        <p className="muted-text">今天也一起把日子照顾得更从容一点。</p>
      </div>
      <div className="header-actions">
        {session.capabilities.canAccessCare ? (
          <button type="button" className="secondary-button" onClick={() => onNavigate("/care")} data-testid="go-care">
            进入家人回复端
          </button>
        ) : null}
        <button type="button" className="ghost-button" onClick={onLogout}>
          退出登录
        </button>
      </div>
    </header>
  );
}

export function MemberApp({ session, onNavigate, onLogout, onRequestError }) {
  const [activeTab, setActiveTab] = useState("mood");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [moodItems, setMoodItems] = useState([]);
  const [customMoods, setCustomMoods] = useState([]);
  const [latestReply, setLatestReply] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [checkinProgress, setCheckinProgress] = useState({
    checkedInToday: false,
    streakCount: 0,
    totalCount: 0,
    plantStage: "种子",
    nextStageAt: 1,
    recentDates: [],
  });
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [expenseMonths, setExpenseMonths] = useState([]);

  useEffect(() => {
    loadMemberData();
  }, []);

  const unreadReplyIds = useMemo(
    () =>
      moodItems
        .flatMap((item) => item.replies || [])
        .filter((reply) => !reply.isRead)
        .map((reply) => reply.id),
    [moodItems]
  );

  async function runRequest(label, task, successMessage) {
    setBusy(label);
    setError("");
    setNotice("");
    try {
      const result = await task();
      if (successMessage) {
        setNotice(successMessage);
      }
      return result;
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        onRequestError(requestError);
        return null;
      }
      setError(requestError.message);
      return null;
    } finally {
      setBusy("");
    }
  }

  async function loadMemberData(options = {}) {
    const task = async () => {
      const [moodsData, customMoodData, checkinData, categoriesData, expenseData] = await Promise.all([
        api("/api/moods?limit=12"),
        api("/api/custom-moods"),
        api("/api/checkins/progress"),
        api("/api/categories"),
        api("/api/expenses/grouped"),
      ]);

      setMoodItems(moodsData.items || []);
      setLatestReply(moodsData.latestReply || null);
      setUnreadCount(moodsData.unreadCount || 0);
      setCustomMoods(customMoodData.items || []);
      setCheckinProgress(checkinData);
      setCategories(categoriesData.items || []);
      setExpenseMonths(expenseData.months || []);
    };

    if (options.silent) {
      try {
        await task();
        return true;
      } catch (requestError) {
        if (requestError instanceof ApiError && requestError.status === 401) {
          onRequestError(requestError);
          return false;
        }
        setError(requestError.message);
        return false;
      }
    }

    const result = await runRequest("正在同步数据...", task);

    return result;
  }

  async function logMood(payload) {
    const result = await runRequest(
      "正在记录心情...",
      async () => api("/api/moods", { method: "POST", body: JSON.stringify(payload) }),
      "心情已记录。"
    );
    if (result) {
      await loadMemberData({ silent: true });
      return true;
    }
    return false;
  }

  async function addCustomMood(payload) {
    const result = await runRequest(
      "正在添加心情...",
      async () => api("/api/custom-moods", { method: "POST", body: JSON.stringify(payload) }),
      "自定义心情已添加。"
    );
    if (result) {
      await loadMemberData({ silent: true });
      return true;
    }
    return false;
  }

  async function deleteCustomMood(id) {
    const result = await runRequest(
      "正在删除心情...",
      async () => api(`/api/custom-moods/${id}`, { method: "DELETE" }),
      "自定义心情已删除。"
    );
    if (result) {
      await loadMemberData({ silent: true });
    }
  }

  async function markRepliesRead(replyIds = unreadReplyIds) {
    if (!replyIds.length) {
      return;
    }
    const result = await runRequest(
      "正在标记已读...",
      async () => api("/api/replies/read", { method: "POST", body: JSON.stringify({ replyIds }) }),
      "回复状态已更新。"
    );
    if (result) {
      await loadMemberData({ silent: true });
    }
  }

  async function submitCheckin() {
    setCheckinLoading(true);
    const result = await runRequest(
      "正在记录打卡...",
      async () => api("/api/checkins", { method: "POST" }),
      "今天已经打卡。"
    );
    if (result) {
      setCheckinProgress(result);
    }
    setCheckinLoading(false);
  }

  async function createCategory(payload) {
    const result = await runRequest(
      "正在添加分类...",
      async () => api("/api/categories", { method: "POST", body: JSON.stringify(payload) }),
      "分类已添加。"
    );
    if (result) {
      await loadMemberData({ silent: true });
      return true;
    }
    return false;
  }

  async function deleteCategory(id) {
    const result = await runRequest(
      "正在删除分类...",
      async () => api(`/api/categories/${id}`, { method: "DELETE" }),
      "分类已删除。"
    );
    if (result) {
      await loadMemberData({ silent: true });
    }
  }

  async function addExpense(payload) {
    const result = await runRequest(
      "正在记账...",
      async () => api("/api/expenses", { method: "POST", body: JSON.stringify(payload) }),
      "账目已记录。"
    );
    if (result) {
      setExpenseMonths(result.months || []);
      return true;
    }
    return false;
  }

  async function deleteExpense(id) {
    const result = await runRequest(
      "正在删除账目...",
      async () => api(`/api/expenses/${id}`, { method: "DELETE" }),
      "账目已删除。"
    );
    if (result) {
      await loadMemberData({ silent: true });
    }
  }

  return (
    <main className="page-shell">
      <Header session={session} onNavigate={onNavigate} onLogout={onLogout} />

      {error ? <div className="message-banner error">{error}</div> : null}
      {notice ? <div className="message-banner success">{notice}</div> : null}
      {busy ? <div className="message-banner info">{busy}</div> : null}

      <nav className="tab-bar">
        {TABS.map((tab) => (
          <button
            type="button"
            key={tab.key}
            className={`tab-button ${activeTab === tab.key ? "is-active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.key === "mood" && unreadCount > 0 ? <span className="tab-badge">{unreadCount}</span> : null}
          </button>
        ))}
      </nav>

      {activeTab === "mood" ? (
        <MoodTab
          moodItems={moodItems}
          customMoods={customMoods}
          latestReply={latestReply}
          unreadCount={unreadCount}
          onLogMood={logMood}
          onAddCustomMood={addCustomMood}
          onDeleteCustomMood={deleteCustomMood}
          onMarkRepliesRead={markRepliesRead}
        />
      ) : null}

      {activeTab === "wellness" ? (
        <WellnessTab progress={checkinProgress} onCheckin={submitCheckin} loading={checkinLoading} />
      ) : null}

      {activeTab === "expense" ? (
        <Suspense fallback={<TabLoadingCard />}>
          <ExpenseTab
            categories={categories}
            months={expenseMonths}
            onCreateCategory={createCategory}
            onDeleteCategory={deleteCategory}
            onAddExpense={addExpense}
            onDeleteExpense={deleteExpense}
          />
        </Suspense>
      ) : null}
    </main>
  );
}
