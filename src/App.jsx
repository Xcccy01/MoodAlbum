import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./App.css";

const COLORS = {
  primary: "#6BAF7B",
  peach: "#F2A885",
  blue: "#7EB8D8",
  lavender: "#B09BD6",
  yellow: "#E8C858",
  rose: "#D88A9A",
  muted: "#8FA396",
};

const MOODS = [
  { key: "bad", icon: "🌧️", label: "不太好", size: "large", accent: "var(--lavender)", decoration: "🍂", position: { top: "0%", left: "55%" }, rotate: "4deg" },
  { key: "happy", icon: "🌈", label: "开心", size: "small", accent: "var(--primary)", decoration: "✨", position: { top: "12%", left: "4%" }, rotate: "-4deg" },
  { key: "tired", icon: "🛋️", label: "有点累", size: "large", accent: "var(--blue)", decoration: "💤", position: { top: "42%", left: "0%" }, rotate: "-2deg" },
  { key: "rest", icon: "🌙", label: "想休息", size: "large", accent: "var(--rose)", decoration: "💫", position: { top: "32%", left: "60%" }, rotate: "6deg" },
  { key: "okay", icon: "🫖", label: "一般", size: "small", accent: "var(--yellow)", decoration: "🌾", position: { top: "72%", left: "32%" }, rotate: "-3deg" },
];

const NAV_ITEMS = [
  { key: "mood", label: "心情", icon: "☘️" },
  { key: "wellness", label: "养生", icon: "🌿" },
  { key: "expense", label: "记账", icon: "📒" },
];

const DEFAULT_CATEGORY_ICONS = ["🏠", "🎁", "👔", "📚", "🎮", "💇", "🐶", "🌸", "💡", "🎵", "🏋️", "✈️"];
const CUSTOM_MOOD_ICONS = ["🙂", "😌", "🤗", "🥰", "😴", "🥹", "😎", "🤒", "😔", "🥳", "🫖", "🌤️"];
const LAST_USERNAME_KEY = "family-care-last-username";
const APP_NAME = "MoodAlbum";
const APP_VERSION = "1.1.0";
const CUSTOM_MOOD_ARTS = ["heart", "breeze", "bloom", "moon", "clover", "sparkle", "tea", "drop", "leaf", "wellness", "glow", "rest"];
const CATEGORY_ARTS = ["groceries", "fruit", "dining", "home", "medical", "transport", "package", "gift", "light", "music", "flower", "wellness"];
const BURST_ARTS = ["leaf", "bloom", "clover", "breeze"];

const PLANT_STAGE_META = {
  种子: { emoji: "🫘", message: "今天也在悄悄蓄力。" },
  发芽: { emoji: "🌱", message: "一点点坚持，已经冒出新芽。" },
  长叶: { emoji: "🌿", message: "叶片舒展开，日子也更有生气。" },
  含苞: { emoji: "🪷", message: "已经开始积攒开花的力量。" },
  开花: { emoji: "🌸", message: "状态越来越好，心情也有了颜色。" },
  繁盛: { emoji: "🌳", message: "长期坚持很了不起，已经枝叶丰盛。" },
};

const PLANT_THRESHOLDS = [
  { threshold: 1, stage: "种子" },
  { threshold: 3, stage: "发芽" },
  { threshold: 7, stage: "长叶" },
  { threshold: 14, stage: "含苞" },
  { threshold: 30, stage: "开花" },
  { threshold: 60, stage: "繁盛" },
];

const WELLNESS_TIPS = [
  { season: "春", icon: "🥬", tip: "春天气息渐暖，多吃些菠菜、芦笋这类清爽蔬菜。" },
  { season: "春", icon: "🚶", tip: "饭后慢慢散步十来分钟，让身体轻轻醒一醒。" },
  { season: "春", icon: "🌤️", tip: "上午有太阳时晒晒背，整个人会更舒展。" },
  { season: "春", icon: "🍵", tip: "春天容易燥，喝温水比一直喝冰凉饮品更舒服。" },
  { season: "春", icon: "🌬️", tip: "白天多开窗通风，让空气流动起来，心情也会更轻快。" },
  { season: "夏", icon: "💧", tip: "天气热时少量多次补水，比一下喝太多更舒服。" },
  { season: "夏", icon: "🧢", tip: "出门记得遮阳，避开最晒的时段会省力很多。" },
  { season: "夏", icon: "🍜", tip: "夏天胃口淡时，清汤面和小米粥这类温和食物更合适。" },
  { season: "夏", icon: "🛏️", tip: "中午小憩二三十分钟，下午精神会更稳。" },
  { season: "夏", icon: "🍅", tip: "番茄、黄瓜这类清爽食材，夏天吃起来很顺口。" },
  { season: "秋", icon: "🍐", tip: "秋天空气偏干，炖点雪梨或银耳，喉咙会更舒服。" },
  { season: "秋", icon: "🧥", tip: "早晚温差大，外出多带一件薄外套更稳妥。" },
  { season: "秋", icon: "🌾", tip: "秋天适合把晚饭吃得清淡些，睡前更轻松。" },
  { season: "秋", icon: "🫖", tip: "下午泡一杯温热的淡茶，慢慢喝，整个人会放松许多。" },
  { season: "秋", icon: "🎃", tip: "胡萝卜、南瓜这些暖色食材，秋天吃着也更有食欲。" },
  { season: "冬", icon: "🧦", tip: "天气冷时注意脚底保暖，走动也会更舒服。" },
  { season: "冬", icon: "🛁", tip: "睡前泡泡脚，加点姜片，暖身又放松。" },
  { season: "冬", icon: "🍲", tip: "冬天吃点热乎的汤汤水水，身体会觉得更熨帖。" },
  { season: "冬", icon: "☀️", tip: "晴天晒晒太阳，补充暖意，也能带来好心情。" },
  { season: "冬", icon: "🥜", tip: "适量吃些坚果，既有香味也能补充能量。" },
  { season: "通用", icon: "💧", tip: "喝水别等口渴，放一杯温水在手边会更容易记得。" },
  { season: "通用", icon: "🧘", tip: "久坐后起身活动一下肩颈，身体会轻快很多。" },
  { season: "通用", icon: "🍎", tip: "水果分几次吃，比一次吃太多更舒服。" },
  { season: "通用", icon: "🌙", tip: "晚上把灯光调柔和一点，更容易安静下来准备休息。" },
  { season: "通用", icon: "🎵", tip: "听几首舒缓的音乐，能帮忙把节奏放慢下来。" },
];

function App() {
  const isAdmin = window.location.pathname.startsWith("/admin");
  return isAdmin ? <AdminApp /> : <UserApp />;
}

function UserApp() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(() => ({
    username: window.localStorage.getItem(LAST_USERNAME_KEY) || "",
    password: "",
  }));
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const result = await api("/api/auth/session");
      if (result.user?.username) {
        window.localStorage.setItem(LAST_USERNAME_KEY, result.user.username);
      }
      setAuthenticated(Boolean(result.authenticated));
      setUser(result.user || null);
    } catch {
      setAuthenticated(false);
      setUser(null);
    } finally {
      setCheckingSession(false);
    }
  }

  async function submitAuth(event) {
    event.preventDefault();
    setBusy(mode === "login" ? "正在登录..." : "正在创建账号...");
    setError("");

    try {
      const result = await api(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      window.localStorage.setItem(LAST_USERNAME_KEY, result.user?.username || form.username.trim());
      setAuthenticated(true);
      setUser(result.user || null);
      setForm((prev) => ({ ...prev, password: "" }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy("");
    }
  }

  async function logout() {
    setBusy("正在退出...");
    setError("");
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore logout cleanup failure
    } finally {
      setAuthenticated(false);
      setUser(null);
      setBusy("");
    }
  }

  function handleUnauthorized() {
    setAuthenticated(false);
    setUser(null);
    setBusy("");
    setForm((prev) => ({
      username: prev.username || window.localStorage.getItem(LAST_USERNAME_KEY) || "",
      password: "",
    }));
    setError("登录状态已失效，请重新登录。");
  }

  if (checkingSession) {
    return (
      <div className="login-shell">
        <div className="login-card auth-card">
          <div className="section-note">{APP_NAME}</div>
          <div className="meta-title" style={{ fontSize: 30, marginTop: 8 }}>正在准备你的数据...</div>
          <p className="meta-subtitle" style={{ marginTop: 10, lineHeight: 1.8 }}>
            我们会先检查登录状态，再把你的专属数据安全带回来。
          </p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <AuthScreen
        mode={mode}
        setMode={setMode}
        form={form}
        setForm={setForm}
        busy={busy}
        error={error}
        onSubmit={submitAuth}
      />
    );
  }

  return <FamilyCareApp user={user} onLogout={logout} onUnauthorized={handleUnauthorized} />;
}

function AuthScreen({ mode, setMode, form, setForm, busy, error, onSubmit }) {
  const rememberedUsername = window.localStorage.getItem(LAST_USERNAME_KEY) || "";

  return (
    <div className="login-shell">
      <form className="login-card auth-card" onSubmit={onSubmit}>
        <div className="auth-orb auth-orb-left" />
        <div className="auth-orb auth-orb-right" />
        <div className="section-note">{APP_NAME}</div>
        <div className="meta-title" style={{ fontSize: 32, marginTop: 10 }}>登录后开始记录今天</div>
        <p className="meta-subtitle auth-copy">
          每个账号的数据彼此独立。登录一次后，15 天内都不需要重复输入账号和密码。
        </p>

        <div className="toggle-row auth-toggle">
          <button type="button" className={`pill-button ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")}>
            登录
          </button>
          <button type="button" className={`pill-button ${mode === "register" ? "active" : ""}`} onClick={() => setMode("register")}>
            注册
          </button>
        </div>

        <div className="field">
          <label>用户名</label>
          <input
            className="text-input"
            value={form.username}
            onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
            placeholder="2 到 20 位中文、字母、数字、下划线或短横线"
            autoComplete="username"
          />
        </div>

        <div className="field">
          <label>密码</label>
          <input
            className="text-input"
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            placeholder="至少 6 位"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </div>

        <div className="auth-hint">
          <span><IllustrationIcon name="clover" className="inline-art-icon" /> 数据会按账号隔离保存</span>
          <span><IllustrationIcon name="leaf" className="inline-art-icon" /> 连续 15 天免重复登录</span>
        </div>

        {rememberedUsername ? (
          <div className="remember-row">
            <span className="section-note">上次登录账号：{rememberedUsername}</span>
            {form.username !== rememberedUsername ? (
              <button
                type="button"
                className="ghost-button remember-button"
                onClick={() => setForm((prev) => ({ ...prev, username: rememberedUsername }))}
              >
                一键填入
              </button>
            ) : null}
          </div>
        ) : null}

        {error ? <div className="error-text">{error}</div> : null}
        {busy ? <div className="section-note">{busy}</div> : null}

        <button type="submit" className="primary-button" style={{ width: "100%", marginTop: 6 }}>
          {mode === "login" ? "进入应用" : "创建账号并进入"}
        </button>
      </form>
    </div>
  );
}

function FamilyCareApp({ user, onLogout, onUnauthorized }) {
  const [activeTab, setActiveTab] = useState("mood");
  const [moodItems, setMoodItems] = useState([]);
  const [customMoods, setCustomMoods] = useState([]);
  const [latestReply, setLatestReply] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [moodSubmitting, setMoodSubmitting] = useState("");
  const [showCustomMoodPanel, setShowCustomMoodPanel] = useState(false);
  const [customMoodForm, setCustomMoodForm] = useState({ label: "", icon: CUSTOM_MOOD_ICONS[0] });
  const [toastMood, setToastMood] = useState(null);
  const [wellnessTips, setWellnessTips] = useState([]);
  const [checkinProgress, setCheckinProgress] = useState({
    checkedInToday: false,
    streakCount: 0,
    totalCount: 0,
    plantStage: "种子",
    plantEmoji: "",
    nextStageAt: 1,
    recentDates: [],
  });
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [expenseMonths, setExpenseMonths] = useState([]);
  const [expenseView, setExpenseView] = useState("detail");
  const [expenseForm, setExpenseForm] = useState({ amount: "", categoryId: "", note: "" });
  const [showCategoryPanel, setShowCategoryPanel] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", icon: DEFAULT_CATEGORY_ICONS[0] });
  const [expandedMonths, setExpandedMonths] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [busyMessage, setBusyMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [serverUpdate, setServerUpdate] = useState(null);
  const [dismissedUpdateId, setDismissedUpdateId] = useState("");
  const currentMonthKey = getMonthKey(new Date());

  useEffect(() => {
    refreshMoodData();
    refreshCustomMoods();
    refreshCheckins();
    refreshExpenses();
    refreshCategories();
    refreshAppUpdate();
    setWellnessTips(pickTipsBySeason());
  }, []);

  useEffect(() => {
    const stream = new EventSource("/api/app/update/stream");

    stream.addEventListener("update", (event) => {
      try {
        const payload = JSON.parse(event.data);
        handleIncomingUpdate(payload.update || null);
      } catch {
        // ignore malformed events
      }
    });

    return () => {
      stream.close();
    };
  }, [dismissedUpdateId]);

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
    if (activeTab !== "mood") {
      return;
    }

    const unreadReplyIds = moodItems
      .flatMap((item) => item.replies || [])
      .filter((reply) => !reply.isRead)
      .map((reply) => reply.id);

    if (!unreadReplyIds.length) {
      return;
    }

    markRepliesRead(unreadReplyIds, false);
  }, [activeTab, moodItems]);

  async function refreshMoodData() {
    try {
      const [moodsData, repliesData] = await Promise.all([api("/api/moods?limit=8"), api("/api/replies/latest")]);
      setMoodItems(moodsData.items || []);
      setLatestReply(repliesData.latestReply || null);
      setUnreadCount(repliesData.unreadCount || 0);
    } catch (requestError) {
      handleRequestError(requestError, onUnauthorized, setError);
    }
  }

  async function refreshCustomMoods() {
    try {
      const response = await api("/api/custom-moods");
      setCustomMoods(response.items || []);
    } catch (requestError) {
      handleRequestError(requestError, onUnauthorized, setError);
    }
  }

  async function refreshCheckins() {
    try {
      const response = await api("/api/checkins/progress");
      setCheckinProgress(response);
    } catch (requestError) {
      handleRequestError(requestError, onUnauthorized, setError);
    }
  }

  async function refreshCategories() {
    try {
      const response = await api("/api/categories");
      const items = response.items || [];
      setCategories(items);
      return items;
    } catch (requestError) {
      handleRequestError(requestError, onUnauthorized, setError);
      return [];
    }
  }

  async function refreshExpenses() {
    try {
      const response = await api("/api/expenses/grouped");
      setExpenseMonths(response.months || []);
    } catch (requestError) {
      handleRequestError(requestError, onUnauthorized, setError);
    }
  }

  async function refreshAppUpdate() {
    try {
      const response = await api("/api/app/update");
      handleIncomingUpdate(response.update || null);
    } catch (requestError) {
      if (requestError?.status === 404) {
        return;
      }
      handleRequestError(requestError, onUnauthorized, setError);
    }
  }

  function handleIncomingUpdate(update) {
    if (!update?.id || dismissedUpdateId === update.id) {
      return;
    }

    if (compareVersions(update.version, APP_VERSION) <= 0) {
      return;
    }

    setServerUpdate(update);
  }

  function dismissUpdateNotice() {
    if (serverUpdate?.id) {
      setDismissedUpdateId(serverUpdate.id);
    }
    setServerUpdate(null);
  }

  async function submitMood(mood) {
    setError("");
    setFeedback("");
    setMoodSubmitting(mood.key);
    try {
      await api("/api/moods", { method: "POST", body: JSON.stringify({ moodKey: mood.key }) });
      setToastMood(mood);
      setFeedback(`已记录“${mood.label}”。`);
      await refreshMoodData();
    } catch (requestError) {
      handleRequestError(requestError, onUnauthorized, setError);
    } finally {
      setMoodSubmitting("");
    }
  }

  async function submitCustomMood(mood) {
    setError("");
    setFeedback("");
    setMoodSubmitting(mood.id);
    try {
      await api("/api/moods", { method: "POST", body: JSON.stringify({ customMoodId: mood.id }) });
      setToastMood({ icon: mood.icon, label: mood.label });
      setFeedback(`已记录“${mood.label}”。`);
      await refreshMoodData();
    } catch (requestError) {
      handleRequestError(requestError, onUnauthorized, setError);
    } finally {
      setMoodSubmitting("");
    }
  }

  async function markRepliesRead(replyIds, showFeedback = true) {
    try {
      await api("/api/replies/read", { method: "POST", body: JSON.stringify({ replyIds }) });
      if (showFeedback) {
        setFeedback("已自动更新阅读状态。");
      }
      await refreshMoodData();
    } catch (requestError) {
      handleRequestError(requestError, onUnauthorized, setError);
    }
  }

  async function submitCheckin() {
    setCheckinLoading(true);
    setError("");
    setFeedback("");
    try {
      const result = await api("/api/checkins", { method: "POST" });
      const stageMeta = PLANT_STAGE_META[result.plantStage] || PLANT_STAGE_META["种子"];
      setFeedback(`今日打卡完成，植物成长到了${result.plantStage}。${stageMeta.message}`);
      await refreshCheckins();
    } catch (requestError) {
      handleRequestError(requestError, onUnauthorized, setError);
    } finally {
      setCheckinLoading(false);
    }
  }

  async function submitExpense(event) {
    event.preventDefault();
    setBusyMessage("正在记下来...");
    setError("");
    setFeedback("");
    try {
      await api("/api/expenses", { method: "POST", body: JSON.stringify(expenseForm) });
      setExpenseForm((prev) => ({ ...prev, amount: "", note: "" }));
      setFeedback("这笔支出已经记下来了。");
      await refreshExpenses();
    } catch (requestError) {
      handleRequestError(requestError, onUnauthorized, setError);
    } finally {
      setBusyMessage("");
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
      handleRequestError(requestError, onUnauthorized, setError);
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
      handleRequestError(requestError, onUnauthorized, setError);
    } finally {
      setBusyMessage("");
    }
  }

  async function createCategory() {
    setBusyMessage("正在添加分类...");
    setError("");
    setFeedback("");
    try {
      const response = await api("/api/categories", { method: "POST", body: JSON.stringify(newCategory) });
      setShowCategoryPanel(false);
      setNewCategory({ name: "", icon: DEFAULT_CATEGORY_ICONS[0] });
      setExpenseForm((prev) => ({ ...prev, categoryId: response.category.id }));
      setFeedback(`已添加分类“${response.category.name}”。`);
      await refreshCategories();
    } catch (requestError) {
      handleRequestError(requestError, onUnauthorized, setError);
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
      handleRequestError(requestError, onUnauthorized, setError);
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
      await api(`/api/expenses/${id}`, { method: "DELETE" });
      setFeedback("账目已删除。");
      await refreshExpenses();
    } catch (requestError) {
      handleRequestError(requestError, onUnauthorized, setError);
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
  const totalExpenseAmount = expenseMonths.reduce((sum, month) => sum + month.totalAmount, 0);
  const pieData = [];
  const categoryTotals = {};
  const dailyTotals = {};
  const today = new Date();
  const recentDays = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    recentDays.push({ key: toDateKey(date), label: new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }).format(date), amount: 0 });
  }

  for (const month of expenseMonths) {
    for (const category of month.categories) {
      categoryTotals[category.categoryId] = categoryTotals[category.categoryId] || { name: `${category.label}`, value: 0 };
      categoryTotals[category.categoryId].value += category.totalAmount;
      for (const item of category.items) {
        const dayKey = item.spentAt.slice(0, 10);
        dailyTotals[dayKey] = (dailyTotals[dayKey] || 0) + item.amount;
      }
    }
  }

  for (const key of Object.keys(categoryTotals)) {
    pieData.push(categoryTotals[key]);
  }
  pieData.sort((left, right) => right.value - left.value);

  const barData = recentDays.map((day) => ({ name: day.label, amount: Number((dailyTotals[day.key] || 0).toFixed(2)) }));
  const headerDate = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" }).format(new Date());
  const plantMeta = PLANT_STAGE_META[checkinProgress.plantStage] || PLANT_STAGE_META["种子"];
  const progressPercent = getPlantProgressPercent(checkinProgress.totalCount, checkinProgress.nextStageAt);

  return (
    <div className="shell">
      <div className="screen">
        <header className="header-card">
          <div className="date-row">
            <span>{headerDate}</span>
            <div className="header-actions">
              <div className="user-chip">
                <IllustrationIcon name="clover" className="inline-art-icon" />
                <span>{user?.username}</span>
              </div>
              <button type="button" className="ghost-button" onClick={onLogout}>退出登录</button>
            </div>
          </div>
          <div className="greeting-row">
            <div>
              <h1>{getGreeting()}</h1>
              <div className="section-note">
                {unreadCount > 0 ? `有 ${unreadCount} 条新回复，记得看看。` : "今天也一起把日子照顾得更从容一点。"}
              </div>
            </div>
            <div className="leaf-badge"><IllustrationIcon name="clover" /></div>
          </div>
        </header>

        {serverUpdate ? (
          <UpdateBanner
            update={serverUpdate}
            onDismiss={dismissUpdateNotice}
          />
        ) : null}

        {error ? <div className="error-text" style={{ marginBottom: 12 }}>{error}</div> : null}
        {feedback ? <div className="success-text" style={{ marginBottom: 12 }}>{feedback}</div> : null}
        {busyMessage ? <div className="section-note" style={{ marginBottom: 12 }}>{busyMessage}</div> : null}

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
          />
        ) : null}

        {activeTab === "expense" ? (
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
          />
        ) : null}
      </div>

      <nav className="tabs-bar">
        {NAV_ITEMS.map((item) => (
          <button type="button" key={item.key} className={`nav-button ${activeTab === item.key ? "active" : ""}`} onClick={() => setActiveTab(item.key)}>
            {item.key === "mood" && unreadCount > 0 ? <span className="tab-badge">{Math.min(unreadCount, 9)}</span> : null}
            <span className="icon"><IllustrationIcon name={item.key} className="nav-illustration" /></span>
            <span>{item.label}</span>
            {activeTab === item.key ? <span className="nav-dot" /> : null}
          </button>
        ))}
      </nav>

      {toastMood ? <MoodToast mood={toastMood} /> : null}
    </div>
  );
}

function MoodTab({
  moodItems,
  latestReply,
  unreadCount,
  customMoods,
  showCustomMoodPanel,
  setShowCustomMoodPanel,
  customMoodForm,
  setCustomMoodForm,
  moodSubmitting,
  onSubmitMood,
  onSubmitCustomMood,
  onCreateCustomMood,
  onDeleteCustomMood,
}) {
  return (
    <>
      {latestReply ? (
        <section className={`banner ${unreadCount > 0 ? "is-unread" : ""}`}>
          <div className="row-between">
            <div>
              <div style={{ fontWeight: 800, marginBottom: 8, display: "inline-flex", alignItems: "center", gap: 8 }}>
                <IllustrationIcon name="message" className="inline-art-icon" />
                <span>最新回复</span>
              </div>
              <div style={{ fontSize: 17, lineHeight: 1.8 }}>{latestReply.content}</div>
              <div style={{ marginTop: 10, opacity: 0.9, fontSize: 13 }}>
                <IllustrationIcon name={getMoodArtName(latestReply.moodKey, latestReply.moodLabel, latestReply.moodIcon)} className="inline-art-icon" /> {latestReply.moodLabel} · {formatDateTime(latestReply.createdAt)}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="panel">
        <div className="section-title">
          <h2>今天感觉怎么样</h2>
          <span className="section-note">点一下就能记下来</span>
        </div>
        <div className="mood-cloud">
          {MOODS.map((mood) => (
            <button
              type="button"
              key={mood.key}
              className={`mood-bubble ${mood.size}`}
              disabled={moodSubmitting === mood.key}
              style={{
                top: mood.position.top,
                left: mood.position.left,
                "--rotation": mood.rotate,
                transform: `rotate(${mood.rotate})`,
                background: `linear-gradient(145deg, ${mood.accent}, rgba(255,255,255,0.28))`,
              }}
              onClick={() => onSubmitMood(mood)}
            >
              <span className="mood-icon"><IllustrationIcon name={getMoodArtName(mood.key, mood.label, mood.icon)} className="bubble-illustration" /></span>
              <span className="mood-label">{moodSubmitting === mood.key ? "记录中..." : mood.label}</span>
              <span className="mood-decoration">
                <IllustrationIcon name={getMoodDecorationArtName(mood.key)} className="mini-illustration" />
              </span>
            </button>
          ))}
        </div>

        <div className="divider" style={{ marginTop: 18 }}>
          <span><IllustrationIcon name="sparkle" className="inline-art-icon" /> 添加自己的心情</span>
        </div>

        <div className="button-row" style={{ marginBottom: 14 }}>
          <button type="button" className="secondary-button" onClick={() => setShowCustomMoodPanel((prev) => !prev)}>
            {showCustomMoodPanel ? "收起添加面板" : "添加心情"}
          </button>
          <span className="section-note">最多 12 个，点一下也能直接记录。</span>
        </div>

        {showCustomMoodPanel ? (
          <div className="inline-panel custom-mood-editor" style={{ marginBottom: 14 }}>
            <div className="field">
              <label>心情名称</label>
              <input
                className="text-input"
                value={customMoodForm.label}
                onChange={(event) => setCustomMoodForm((prev) => ({ ...prev, label: event.target.value }))}
                placeholder="例如：踏实、想出门、有点想念"
                maxLength={12}
              />
            </div>
            <div className="field">
              <label>选择图标</label>
              <div className="icon-grid">
                {CUSTOM_MOOD_ICONS.map((icon, index) => (
                  <button
                    type="button"
                    key={icon}
                    className={`icon-chip ${customMoodForm.icon === icon ? "active" : ""}`}
                    onClick={() => setCustomMoodForm((prev) => ({ ...prev, icon }))}
                  >
                    <IllustrationIcon name={CUSTOM_MOOD_ARTS[index]} className="picker-illustration" />
                  </button>
                ))}
              </div>
            </div>
            <div className="button-row">
              <button type="button" className="primary-button" onClick={onCreateCustomMood}>确认添加</button>
              <button type="button" className="ghost-button" onClick={() => setShowCustomMoodPanel(false)}>取消</button>
            </div>
          </div>
        ) : null}

        <div className="custom-mood-list">
          {customMoods.length === 0 ? (
            <div className="empty-card">
              还没有自定义心情。可以补充更贴近自己日常表达的状态，比如“踏实”“想散步”“有点想念”。
            </div>
          ) : (
            customMoods.map((mood) => (
              <div className="custom-mood-pill" key={mood.id}>
                <button
                  type="button"
                  className="custom-mood-main"
                  disabled={moodSubmitting === mood.id}
                  onClick={() => onSubmitCustomMood(mood)}
                >
                  <span className="custom-mood-icon"><IllustrationIcon name={pickFromList(`${mood.id}:${mood.label}:${mood.icon}`, CUSTOM_MOOD_ARTS)} className="bubble-illustration" /></span>
                  <span>{moodSubmitting === mood.id ? "记录中..." : mood.label}</span>
                </button>
                <button type="button" className="custom-mood-remove" onClick={() => onDeleteCustomMood(mood.id)}>
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="divider">
        <span><IllustrationIcon name="message" className="inline-art-icon" /> 最近心情记录</span>
      </div>

      <section className="list-stack">
        {moodItems.length === 0 ? (
          <div className="empty-card">还没有记录。点一下上面的心情气泡，就会从这里开始留下今天的状态。</div>
        ) : (
          moodItems.map((item) => (
            <article className="list-card" key={item.id}>
              <div className="row-between">
                <div className="mood-meta">
                  <div className="emoji-box"><IllustrationIcon name={getMoodArtName(item.moodKey, item.label, item.icon)} className="card-illustration" /></div>
                  <div>
                    <div className="meta-title">{item.label}</div>
                    <div className="meta-subtitle">{formatDateTime(item.createdAt)}</div>
                  </div>
                </div>
                <span className={`status-pill ${getReplyBadge(item.replyStatus).tone}`}>
                  {getReplyBadge(item.replyStatus).label}
                </span>
              </div>
              {item.replies.length ? (
                <div className="reply-stack">
                  {item.replies.map((reply) => (
                    <div className="reply-item" key={reply.id}>
                      <div style={{ fontSize: 15, lineHeight: 1.75 }}>{reply.content}</div>
                      <div className="meta-subtitle" style={{ marginTop: 6 }}>{formatDateTime(reply.createdAt)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="meta-subtitle" style={{ marginTop: 12 }}>
                  还没有新的回复，先把当下感受记下来就很好。
                </div>
              )}
            </article>
          ))
        )}
      </section>
    </>
  );
}

function WellnessTab({
  tips,
  onRefreshTips,
  checkinProgress,
  checkinLoading,
  onSubmitCheckin,
  plantMeta,
  progressPercent,
}) {
  const season = getCurrentSeason();
  const recentDateSet = new Set(checkinProgress.recentDates || []);
  const recentDays = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    recentDays.push(toDateKey(date));
  }

  return (
    <>
      <section className="plant-card">
        <div className="plant-top">
          <div>
            <div className="section-note">每日打卡，植物成长</div>
            <div className="section-title" style={{ marginTop: 8 }}>
              <h2 style={{ margin: 0 }}>当前时节 · {season}季养生</h2>
            </div>
            <div style={{ fontSize: 16, lineHeight: 1.8 }}>{plantMeta.message}</div>
          </div>
          <div className="plant-avatar"><IllustrationIcon name={getPlantArtName(checkinProgress.plantStage)} className="plant-illustration" /></div>
        </div>

        <div className="plant-stats">
          <div className="stat-card">
            <div className="stat-value">{checkinProgress.totalCount}</div>
            <div className="meta-subtitle">累计天数</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{checkinProgress.streakCount}</div>
            <div className="meta-subtitle">连续天数</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ fontSize: 20 }}>{checkinProgress.plantStage}</div>
            <div className="meta-subtitle">成长阶段</div>
          </div>
        </div>

        <div className="meta-subtitle">距离下一阶段还有一点点进度</div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="meta-subtitle">
          {checkinProgress.nextStageAt
            ? `累计达到 ${checkinProgress.nextStageAt} 天，就会进入下一阶段。`
            : "已经进入最繁盛阶段，继续保持这份稳定的节奏。"}
        </div>

        <div className="day-dots">
          {recentDays.map((day) => (
            <span key={day} className={`day-dot ${recentDateSet.has(day) ? "active" : ""}`} title={day} />
          ))}
        </div>

        <div className="button-row" style={{ marginTop: 18 }}>
          <button type="button" className="primary-button" onClick={onSubmitCheckin} disabled={checkinProgress.checkedInToday || checkinLoading}>
            {checkinProgress.checkedInToday ? "今天已经打卡" : checkinLoading ? "记录中..." : "今天来打卡"}
          </button>
        </div>
      </section>

      <section className="section-title">
        <h2>养生小贴士</h2>
        <button type="button" className="secondary-button" onClick={onRefreshTips}>
          <IllustrationIcon name="sparkle" className="inline-art-icon" /> 换一批新贴士
        </button>
      </section>

      <div className="tip-list">
        {tips.map((tip, index) => (
          <article className="tip-card" key={`${tip.icon}-${tip.tip}`}>
            <span
              className="tip-stripe"
              style={{
                background:
                  index % 3 === 0
                    ? "linear-gradient(180deg, var(--primary), rgba(107, 175, 123, 0.25))"
                    : index % 3 === 1
                      ? "linear-gradient(180deg, var(--yellow), rgba(232, 200, 88, 0.2))"
                      : "linear-gradient(180deg, var(--peach), rgba(242, 168, 133, 0.25))",
              }}
            />
            <div className="tip-icon"><IllustrationIcon name={pickFromList(`${tip.tip}:${index}`, ["wellness", "leaf", "sparkle", "bloom"])} className="tip-illustration" /></div>
            <div className="tip-text">{tip.tip}</div>
          </article>
        ))}
      </div>
    </>
  );
}

function ExpenseTab({
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
          <input type="text" inputMode="decimal" placeholder="0.00" value={expenseForm.amount} onChange={(event) => setExpenseForm((prev) => ({ ...prev, amount: event.target.value }))} />
        </div>

        <div className="field">
          <label>分类</label>
          <div className="pill-row">
            {categories.map((category) => (
              <button type="button" key={category.id} className={`pill-button ${expenseForm.categoryId === category.id ? "active" : ""}`} onClick={() => setExpenseForm((prev) => ({ ...prev, categoryId: category.id }))}>
                <IllustrationIcon name={getCategoryArtName(category.id, category.name, category.icon)} className="inline-art-icon" />
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
            <button type="button" className="pill-button add" onClick={() => setShowCategoryPanel((prev) => !prev)}>
              添加
            </button>
          </div>
        </div>

        {showCategoryPanel ? (
          <div className="inline-panel" style={{ marginBottom: 14 }}>
            <div className="field">
              <label>新分类名称</label>
              <input className="text-input" value={newCategory.name} onChange={(event) => setNewCategory((prev) => ({ ...prev, name: event.target.value }))} placeholder="例如：家居、宠物、旅行" />
            </div>
            <div className="field">
              <label>选择图标</label>
              <div className="icon-grid">
                {DEFAULT_CATEGORY_ICONS.map((icon, index) => (
                  <button type="button" key={icon} className={`icon-chip ${newCategory.icon === icon ? "active" : ""}`} onClick={() => setNewCategory((prev) => ({ ...prev, icon }))}>
                    <IllustrationIcon name={CATEGORY_ARTS[index]} className="picker-illustration" />
                  </button>
                ))}
              </div>
            </div>
            <div className="button-row">
              <button type="button" className="primary-button" onClick={onCreateCategory}>确认添加</button>
              <button type="button" className="ghost-button" onClick={() => setShowCategoryPanel(false)}>取消</button>
            </div>
          </div>
        ) : null}

        <div className="field">
          <label>备注</label>
          <input className="text-input" value={expenseForm.note} onChange={(event) => setExpenseForm((prev) => ({ ...prev, note: event.target.value }))} placeholder="这笔花费用来做什么，可以不填" />
        </div>

        <button type="submit" className="primary-button" style={{ width: "100%" }}>记下来</button>
      </form>

      <div className="toggle-row" style={{ margin: "16px 0 14px" }}>
        <button type="button" className={`pill-button ${expenseView === "detail" ? "active" : ""}`} onClick={() => setExpenseView("detail")}><IllustrationIcon name="message" className="inline-art-icon" /> 明细</button>
        <button type="button" className={`pill-button ${expenseView === "summary" ? "active" : ""}`} onClick={() => setExpenseView("summary")}><IllustrationIcon name="expense" className="inline-art-icon" /> 汇总</button>
      </div>

      {expenseView === "summary" ? (
        <>
          <section className="summary-card">
            <div className="section-note">总支出</div>
            <div className="summary-amount">¥ {formatCurrency(totalExpenseAmount)}</div>
            <div className="meta-subtitle">共 {totalExpenseCount} 笔记录</div>
          </section>

          <section className="chart-card">
            <div className="section-title"><h3>分类占比</h3></div>
            {pieData.length === 0 ? (
              <div className="empty-card">还没有账目，先记下一笔，图表就会慢慢长出来。</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={[COLORS.primary, COLORS.peach, COLORS.blue, COLORS.lavender, COLORS.yellow, COLORS.rose][index % 6]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `¥ ${formatCurrency(value)}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </section>

          <section className="chart-card">
            <div className="section-title"><h3>最近 7 天</h3></div>
            {barData.every((item) => item.amount === 0) ? (
              <div className="empty-card">最近 7 天还没有支出记录，图表会在有数据后自动显示。</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} margin={{ left: -16, right: 6, top: 10, bottom: 6 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(107, 175, 123, 0.12)" />
                  <XAxis dataKey="name" tick={{ fill: COLORS.muted, fontSize: 12 }} />
                  <YAxis tick={{ fill: COLORS.muted, fontSize: 12 }} />
                  <Tooltip formatter={(value) => `¥ ${formatCurrency(value)}`} />
                  <Bar dataKey="amount" fill={COLORS.primary} radius={[10, 10, 0, 0]} />
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
                <button type="button" className="accordion-button" onClick={() => toggleMonth(month.month)}>
                  <div>
                    <div className="meta-title">{formatMonthLabel(month.month)}</div>
                    <div className="meta-subtitle">共 {month.count} 笔 · ¥ {formatCurrency(month.totalAmount)}</div>
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
                          <button type="button" className="accordion-button" onClick={() => toggleCategory(month.month, category.categoryId)}>
                            <div>
                              <div className="meta-title" style={{ fontSize: 17, display: "inline-flex", alignItems: "center", gap: 8 }}>
                                <IllustrationIcon name={getCategoryArtName(category.categoryId, category.label, category.icon)} className="inline-art-icon" />
                                <span>{category.label}</span>
                              </div>
                              <div className="meta-subtitle">{category.count} 笔 · ¥ {formatCurrency(category.totalAmount)}</div>
                            </div>
                            <span>{expanded ? "收起" : "查看"}</span>
                          </button>

                          {expanded ? (
                            <div>
                              {category.items.map((item) => (
                                <div className="expense-item" key={item.id}>
                                  <div className="expense-meta">
                                    <div className="mini-emoji"><IllustrationIcon name={getCategoryArtName(category.categoryId, category.label, category.icon)} className="card-illustration" /></div>
                                    <div>
                                      <div style={{ fontWeight: 700 }}>{item.note || "没有备注"}</div>
                                      <div className="meta-subtitle">{formatDateTime(item.spentAt)}</div>
                                    </div>
                                  </div>
                                  <div style={{ textAlign: "right" }}>
                                    <div className="amount">¥ {formatCurrency(item.amount)}</div>
                                    <button type="button" className="ghost-button" style={{ minHeight: 34, marginTop: 8, padding: "0 12px" }} onClick={() => onDeleteExpense(item.id)}>
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

function AdminApp() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [busy, setBusy] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [moods, setMoods] = useState([]);
  const [selectedMoodId, setSelectedMoodId] = useState("");
  const [selectedMood, setSelectedMood] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [notice, setNotice] = useState("");
  const [publishedUpdate, setPublishedUpdate] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    version: APP_VERSION,
    title: "MoodAlbum 新版本已发布",
    message: "",
    apkUrl: "/downloads/latest.apk",
  });

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (!authenticated) {
      return;
    }
    loadAdminMoods(filterStatus);
    loadAdminUpdate();
  }, [authenticated, filterStatus]);

  useEffect(() => {
    if (!authenticated || !selectedMoodId) {
      setSelectedMood(null);
      return;
    }
    loadMoodDetail(selectedMoodId);
  }, [authenticated, selectedMoodId]);

  useEffect(() => {
    if (!moods.length) {
      setSelectedMoodId("");
      setSelectedMood(null);
      return;
    }
    const exists = moods.some((item) => item.id === selectedMoodId);
    if (!exists) {
      setSelectedMoodId(moods[0].id);
      setReplyText("");
    }
  }, [moods, selectedMoodId]);

  async function checkSession() {
    try {
      const result = await api("/api/admin/session");
      setAuthenticated(Boolean(result.authenticated));
    } catch {
      setAuthenticated(false);
    } finally {
      setCheckingSession(false);
    }
  }

  async function loadAdminMoods(status) {
    try {
      const limit = status === "pending" ? 60 : 100;
      const result = await api(`/api/admin/moods?status=${status}&limit=${limit}`);
      setMoods(result.items || []);
    } catch (requestError) {
      setLoginError(requestError.message);
    }
  }

  async function loadMoodDetail(moodId) {
    try {
      const result = await api(`/api/admin/moods/${moodId}`);
      setSelectedMood(result.mood || null);
    } catch (requestError) {
      setLoginError(requestError.message);
    }
  }

  async function loadAdminUpdate() {
    try {
      const result = await api("/api/admin/app-update");
      setPublishedUpdate(result.update || null);
    } catch (requestError) {
      setLoginError(requestError.message);
    }
  }

  async function login(event) {
    event.preventDefault();
    setBusy("正在登录...");
    setLoginError("");
    try {
      await api("/api/admin/login", { method: "POST", body: JSON.stringify({ passcode }) });
      setAuthenticated(true);
      setPasscode("");
      setNotice("已进入开发者后台。");
      await loadAdminMoods(filterStatus);
      await loadAdminUpdate();
    } catch (requestError) {
      setLoginError(requestError.message);
    } finally {
      setBusy("");
    }
  }

  async function logout() {
    setBusy("正在退出...");
    try {
      await api("/api/admin/logout", { method: "POST" });
      setAuthenticated(false);
      setMoods([]);
      setSelectedMoodId("");
      setSelectedMood(null);
      setReplyText("");
      setNotice("");
      setPublishedUpdate(null);
    } finally {
      setBusy("");
    }
  }

  async function publishReply() {
    if (!selectedMoodId) {
      return;
    }
    setBusy("正在发布回复...");
    setLoginError("");
    try {
      const result = await api(`/api/admin/moods/${selectedMoodId}/replies`, { method: "POST", body: JSON.stringify({ content: replyText }) });
      setReplyText("");
      setNotice("回复已发布。");
      setSelectedMood(result.mood || null);
      setMoods((prev) => {
        if (filterStatus === "pending") {
          return prev.filter((item) => item.id !== selectedMoodId);
        }
        return prev.map((item) => (item.id === selectedMoodId ? { ...item, replyStatus: "replied", repliedAt: result.mood?.repliedAt || item.repliedAt } : item));
      });
      if (filterStatus === "pending") {
        const nextItems = moods.filter((item) => item.id !== selectedMoodId);
        setSelectedMoodId(nextItems[0]?.id || "");
      } else {
        await loadMoodDetail(selectedMoodId);
      }
    } catch (requestError) {
      setLoginError(requestError.message);
    } finally {
      setBusy("");
    }
  }

  async function updateMoodReplyStatus(nextStatus) {
    if (!selectedMoodId) {
      return;
    }

    setBusy(nextStatus === "ignored" ? "正在设为暂不回复..." : "正在恢复待回复...");
    setLoginError("");
    try {
      const result = await api(`/api/admin/moods/${selectedMoodId}/status`, {
        method: "POST",
        body: JSON.stringify({ replyStatus: nextStatus }),
      });
      setSelectedMood(result.mood || null);
      setNotice(nextStatus === "ignored" ? "这条心情已设为暂不回复。" : "这条心情已恢复到待回复。");
      setMoods((prev) => {
        if (filterStatus === "pending" && nextStatus !== "pending") {
          return prev.filter((item) => item.id !== selectedMoodId);
        }
        if (filterStatus === "ignored" && nextStatus !== "ignored") {
          return prev.filter((item) => item.id !== selectedMoodId);
        }
        return prev.map((item) => (item.id === selectedMoodId ? { ...item, replyStatus: nextStatus } : item));
      });
      if ((filterStatus === "pending" && nextStatus !== "pending") || (filterStatus === "ignored" && nextStatus !== "ignored")) {
        const nextItems = moods.filter((item) => item.id !== selectedMoodId);
        setSelectedMoodId(nextItems[0]?.id || "");
      }
    } catch (requestError) {
      setLoginError(requestError.message);
    } finally {
      setBusy("");
    }
  }

  async function clearMoodHistory() {
    const first = window.prompt("此操作会清空所有历史心情和回复记录。请输入 清空 确认。");
    if (first !== "清空") {
      return;
    }
    const second = window.prompt("请再输入一次 彻底清空 继续。");
    if (second !== "彻底清空") {
      return;
    }

    setBusy("正在清空历史记录...");
    setLoginError("");
    try {
      await api("/api/admin/moods/history", { method: "DELETE" });
      setMoods([]);
      setSelectedMoodId("");
      setSelectedMood(null);
      setReplyText("");
      setNotice("历史心情记录已清空。");
    } catch (requestError) {
      setLoginError(requestError.message);
    } finally {
      setBusy("");
    }
  }

  async function publishAppUpdate(event) {
    event.preventDefault();
    setBusy("正在推送更新通知...");
    setLoginError("");
    try {
      const result = await api("/api/admin/app-update", {
        method: "POST",
        body: JSON.stringify(updateForm),
      });
      setPublishedUpdate(result.update || null);
      setNotice("更新通知已推送到客户端。");
    } catch (requestError) {
      setLoginError(requestError.message);
    } finally {
      setBusy("");
    }
  }

  const selectedMoodState = getAdminReplyState(selectedMood);

  if (checkingSession) {
    return (
      <div className="login-shell">
        <div className="login-card"><div className="meta-title">正在检查后台会话...</div></div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="login-shell">
        <form className="login-card" onSubmit={login}>
          <div className="section-note">{APP_NAME}</div>
          <div className="meta-title" style={{ fontSize: 30, marginTop: 8 }}>开发者后台</div>
          <p className="meta-subtitle" style={{ marginTop: 10, lineHeight: 1.8 }}>
            输入口令后，可以查看心情记录，并手动发布回复。
          </p>
          <div className="field" style={{ marginTop: 20 }}>
            <label>开发者口令</label>
            <input className="text-input" type="password" value={passcode} onChange={(event) => setPasscode(event.target.value)} placeholder="请输入口令" />
          </div>
          {loginError ? <div className="error-text">{loginError}</div> : null}
          {busy ? <div className="section-note">{busy}</div> : null}
          <button type="submit" className="primary-button" style={{ width: "100%", marginTop: 8 }}>进入后台</button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <div className="header-card" style={{ position: "static", marginBottom: 18 }}>
        <div className="date-row">
          <span>开发者后台</span>
          <button type="button" className="ghost-button" onClick={logout}>退出</button>
        </div>
        <div className="greeting-row">
          <div>
            <h1 style={{ marginTop: 12 }}>手动回复心情诉求</h1>
            <div className="section-note">待处理会优先显示。发布后，前台会在应用内看到新的回复提醒。</div>
          </div>
          <div className="leaf-badge"><IllustrationIcon name="message" /></div>
        </div>
      </div>

      {loginError ? <div className="error-text" style={{ marginBottom: 12 }}>{loginError}</div> : null}
      {notice ? <div className="success-text" style={{ marginBottom: 12 }}>{notice}</div> : null}
      {busy ? <div className="section-note" style={{ marginBottom: 12 }}>{busy}</div> : null}

      <div className="admin-toolbar" style={{ marginBottom: 16 }}>
        <button type="button" className={`pill-button ${filterStatus === "pending" ? "active" : ""}`} onClick={() => setFilterStatus("pending")}>待处理</button>
        <button type="button" className={`pill-button ${filterStatus === "ignored" ? "active" : ""}`} onClick={() => setFilterStatus("ignored")}>暂不回复</button>
        <button type="button" className={`pill-button ${filterStatus === "all" ? "active" : ""}`} onClick={() => setFilterStatus("all")}>全部记录</button>
        <button type="button" className="ghost-button" onClick={clearMoodHistory}>清空历史心情</button>
      </div>

      <article className="admin-card" style={{ marginBottom: 16 }}>
        <div className="section-title">
          <h3>App 更新推送</h3>
          <span className="section-note">
            {publishedUpdate ? `当前版本：${publishedUpdate.version}` : "还没有发布更新通知"}
          </span>
        </div>

        {publishedUpdate ? (
          <div className="reply-item" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>{publishedUpdate.title}</div>
            <div style={{ lineHeight: 1.7 }}>{publishedUpdate.message}</div>
            <div className="meta-subtitle" style={{ marginTop: 8 }}>
              {publishedUpdate.version} 路 {formatDateTime(publishedUpdate.createdAt)}
            </div>
          </div>
        ) : null}

        <form onSubmit={publishAppUpdate}>
          <div className="field">
              <label>版本号</label>
            <input
              className="text-input"
              value={updateForm.version}
              onChange={(event) => setUpdateForm((prev) => ({ ...prev, version: event.target.value }))}
              placeholder="例如 1.1.0"
            />
          </div>

          <div className="field">
              <label>标题</label>
            <input
              className="text-input"
              value={updateForm.title}
              onChange={(event) => setUpdateForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="例如 MoodAlbum 新版本已发布"
            />
          </div>

          <div className="field">
              <label>更新说明</label>
            <textarea
              className="text-area"
              value={updateForm.message}
              onChange={(event) => setUpdateForm((prev) => ({ ...prev, message: event.target.value }))}
              placeholder="告诉客户端这次修复了什么，为什么建议升级。"
            />
          </div>

          <div className="field">
              <label>安装包地址</label>
            <input
              className="text-input"
              value={updateForm.apkUrl}
              onChange={(event) => setUpdateForm((prev) => ({ ...prev, apkUrl: event.target.value }))}
              placeholder="/downloads/latest.apk"
            />
          </div>

          <div className="button-row">
            <button type="submit" className="primary-button">推送更新通知</button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => setUpdateForm({ version: APP_VERSION, title: "MoodAlbum 新版本已发布", message: "", apkUrl: "/downloads/latest.apk" })}
            >
              重置
            </button>
          </div>
        </form>
      </article>

      <div className="admin-grid layout">
        <aside className="admin-card">
          <div className="section-title">
            <h3>心情列表</h3>
            <span className="section-note">当前加载 {moods.length} 条</span>
          </div>
          <div className="admin-list">
            {moods.length === 0 ? (
              <div className="empty-card">当前没有符合条件的记录。</div>
            ) : (
              moods.map((mood) => (
                <button type="button" key={mood.id} className={`admin-list-item ${selectedMoodId === mood.id ? "active" : ""}`} onClick={() => { setSelectedMoodId(mood.id); setReplyText(""); }}>
                  <div className="row-between">
                    <div className="admin-mood-meta">
                      <div className="mini-emoji"><IllustrationIcon name={getMoodArtName(mood.moodKey, mood.label, mood.icon)} className="card-illustration" /></div>
                      <div>
                        <div style={{ fontWeight: 800 }}>{mood.label}</div>
                        <div className="meta-subtitle">{mood.user?.username || "未命名用户"} · {formatDateTime(mood.createdAt)}</div>
                      </div>
                    </div>
                    <span className={`status-pill ${getReplyBadge(getAdminReplyState(mood)).tone}`}>
                      {getReplyBadge(getAdminReplyState(mood)).label}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="admin-grid">
          {selectedMood ? (
            <>
              <article className="admin-card">
                <div className="section-title">
                  <h3>心情详情</h3>
                  <span className={`status-pill ${getReplyBadge(selectedMoodState).tone}`}>
                    {getReplyBadge(selectedMoodState).label}
                  </span>
                </div>
                <div className="mood-meta">
                  <div className="emoji-box"><IllustrationIcon name={getMoodArtName(selectedMood.moodKey, selectedMood.label, selectedMood.icon)} className="card-illustration" /></div>
                  <div>
                    <div className="meta-title">{selectedMood.label}</div>
                    <div className="meta-subtitle">{selectedMood.user?.username || "未命名用户"} · {formatDateTime(selectedMood.createdAt)}</div>
                  </div>
                </div>
                <div className="divider" style={{ marginTop: 18 }}><span>历史回复</span></div>
                {selectedMood.replies.length ? (
                  <div className="reply-stack">
                    {selectedMood.replies.map((reply) => (
                      <div className="reply-item" key={reply.id}>
                        <div style={{ lineHeight: 1.8 }}>{reply.content}</div>
                        <div className="meta-subtitle" style={{ marginTop: 6 }}>
                          {formatDateTime(reply.createdAt)} · {reply.isRead ? "已读" : "未读"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-card">这条心情还没有回复，可以在下面写一段温和的回应。</div>
                )}
              </article>

              <article className="admin-card">
                <div className="section-title"><h3>发布回复</h3></div>
                <div className="field">
                  <label>回复内容</label>
                  <textarea className="text-area" value={replyText} onChange={(event) => setReplyText(event.target.value)} placeholder="例如：收到这份心情了，今天辛苦了。先让自己慢一点，喝口温水，休息一下也很好。" />
                </div>
                <div className="button-row">
                  <button type="button" className="primary-button" onClick={publishReply}>发布回复</button>
                  {selectedMood?.replyStatus === "ignored" ? (
                    <button type="button" className="secondary-button" onClick={() => updateMoodReplyStatus("pending")}>恢复待回复</button>
                  ) : (
                    <button type="button" className="secondary-button" onClick={() => updateMoodReplyStatus("ignored")}>暂不回复</button>
                  )}
                  <button type="button" className="ghost-button" onClick={() => setReplyText("")}>清空</button>
                </div>
              </article>
            </>
          ) : (
            <div className="empty-card">从左侧选一条心情记录，就可以开始查看详情并回复。</div>
          )}
        </section>
      </div>
    </div>
  );
}

function IllustrationIcon({ name, className = "" }) {
  const normalized = String(name || "sparkle");
  const classes = `art-icon ${className}`.trim();

  if (normalized === "clover") {
    return (
      <span className={classes} aria-hidden="true">
        <svg viewBox="0 0 64 64">
          <circle cx="22" cy="22" r="11" fill="#9EE08D" />
          <circle cx="42" cy="22" r="11" fill="#B7ED9D" />
          <circle cx="22" cy="42" r="11" fill="#7ED38B" />
          <circle cx="42" cy="42" r="11" fill="#96E0A2" />
          <path d="M31 33 C32 43, 30 51, 25 58" stroke="#4A9B63" strokeWidth="4" strokeLinecap="round" fill="none" />
        </svg>
      </span>
    );
  }

  if (normalized === "message") {
    return (
      <span className={classes} aria-hidden="true">
        <svg viewBox="0 0 64 64">
          <rect x="9" y="12" width="46" height="34" rx="16" fill="#FFF6F7" stroke="#E8A6B7" strokeWidth="3" />
          <path d="M18 22 L32 33 L46 22" stroke="#D9879C" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M24 46 L19 54 L31 49" fill="#FFF6F7" stroke="#E8A6B7" strokeWidth="3" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }

  const iconMap = {
    mood: (
      <path d="M32 18 C24 8, 10 12, 8 24 C6 34, 13 42, 32 56 C51 42, 58 34, 56 24 C54 12, 40 8, 32 18Z" fill="url(#g1)" stroke="#F6EDF6" strokeWidth="2.4" />
    ),
    heart: (
      <path d="M32 18 C24 8, 10 12, 8 24 C6 34, 13 42, 32 56 C51 42, 58 34, 56 24 C54 12, 40 8, 32 18Z" fill="url(#g2)" stroke="#F9EEF3" strokeWidth="2.4" />
    ),
    wellness: (
      <>
        <path d="M16 43 C18 27, 28 16, 44 12 C46 28, 38 43, 22 49 Z" fill="url(#g3)" stroke="#EAF8E8" strokeWidth="2.2" />
        <path d="M21 44 C28 36, 34 30, 41 18" stroke="#54996E" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      </>
    ),
    expense: (
      <>
        <rect x="16" y="10" width="32" height="44" rx="8" fill="#FFE59C" stroke="#F6D06B" strokeWidth="2.5" />
        <path d="M24 22 H40 M24 30 H40 M24 38 H35" stroke="#C78C28" strokeWidth="2.8" strokeLinecap="round" />
      </>
    ),
    storm: (
      <>
        <path d="M18 33 C18 24, 24 18, 33 18 C40 18, 46 22, 48 29 C53 29, 56 33, 56 38 C56 45, 51 49, 44 49 H22 C15 49, 10 44, 10 37 C10 33, 13 30, 18 30 Z" fill="#C7C2EC" />
        <path d="M30 37 L24 49 H32 L28 58 L40 43 H32 L36 37 Z" fill="#7F7BDA" />
      </>
    ),
    breeze: (
      <>
        <path d="M14 25 C20 19, 28 19, 34 23 C39 26, 44 26, 50 22" stroke="#7EB8D8" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M12 37 C18 33, 26 33, 34 37 C40 40, 46 40, 52 36" stroke="#9CD3E6" strokeWidth="4" strokeLinecap="round" fill="none" />
        <circle cx="45" cy="44" r="6" fill="#BCE5F4" />
      </>
    ),
    rest: (
      <>
        <path d="M41 13 C33 15, 27 23, 27 32 C27 44, 37 54, 49 54 C51 54, 53 54, 55 53 C51 58, 44 61, 36 61 C22 61, 11 50, 11 36 C11 24, 19 14, 31 11 C34 10, 37 10, 41 13Z" fill="#8B89E6" />
        <circle cx="19" cy="19" r="4" fill="#FFF3B0" />
      </>
    ),
    tea: (
      <>
        <rect x="17" y="24" width="26" height="19" rx="6" fill="#F8D988" stroke="#D7AA44" strokeWidth="2.2" />
        <path d="M43 27 C49 27, 51 31, 51 34 C51 38, 48 41, 43 41" stroke="#D7AA44" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <path d="M22 49 H48" stroke="#B99245" strokeWidth="3" strokeLinecap="round" />
      </>
    ),
    sparkle: (
      <>
        <path d="M32 10 L36 24 L50 28 L36 32 L32 46 L28 32 L14 28 L28 24 Z" fill="#F8D56F" />
        <circle cx="46" cy="16" r="3" fill="#FFF2B9" />
      </>
    ),
    bloom: (
      <>
        <circle cx="32" cy="24" r="8" fill="#FFD7E5" />
        <circle cx="21" cy="26" r="7" fill="#FFC7DA" />
        <circle cx="43" cy="26" r="7" fill="#FFC7DA" />
        <circle cx="25" cy="38" r="7" fill="#F9B8CF" />
        <circle cx="39" cy="38" r="7" fill="#F9B8CF" />
        <circle cx="32" cy="32" r="5" fill="#F3C65A" />
      </>
    ),
    leaf: (
      <>
        <path d="M17 43 C18 27, 29 16, 47 14 C48 31, 39 45, 23 50 Z" fill="#8FDAA1" />
        <path d="M22 44 C29 36, 35 30, 42 20" stroke="#4C9A66" strokeWidth="2.8" strokeLinecap="round" fill="none" />
      </>
    ),
    drop: (
      <path d="M32 13 C26 22, 20 30, 20 38 C20 46, 25 52, 32 52 C39 52, 44 46, 44 38 C44 30, 38 22, 32 13Z" fill="#8FD1EA" stroke="#5FAFD0" strokeWidth="2.4" />
    ),
    glow: (
      <>
        <circle cx="32" cy="32" r="12" fill="#FFE38F" />
        <path d="M32 10 V16 M32 48 V54 M10 32 H16 M48 32 H54 M17 17 L21 21 M43 43 L47 47 M47 17 L43 21 M17 47 L21 43" stroke="#F2C54E" strokeWidth="3" strokeLinecap="round" />
      </>
    ),
    groceries: (
      <>
        <path d="M18 22 H46 L42 48 H22 Z" fill="#BDE7A0" stroke="#6FA254" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M24 22 C24 17, 27 13, 32 13 C37 13, 40 17, 40 22" stroke="#6FA254" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </>
    ),
    fruit: (
      <>
        <circle cx="28" cy="34" r="12" fill="#FF9AA2" />
        <circle cx="38" cy="30" r="11" fill="#FFC16D" fillOpacity="0.92" />
        <path d="M34 17 C35 13, 39 11, 43 12" stroke="#6FA254" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M31 17 C27 14, 25 12, 21 13" stroke="#7BBE7A" strokeWidth="2.8" strokeLinecap="round" />
      </>
    ),
    dining: (
      <>
        <path d="M22 12 V31 M18 12 V22 M26 12 V22" stroke="#D78F50" strokeWidth="3" strokeLinecap="round" />
        <path d="M22 31 V52" stroke="#D78F50" strokeWidth="3" strokeLinecap="round" />
        <path d="M41 12 C47 18, 47 28, 41 34 V52" stroke="#D78F50" strokeWidth="3" strokeLinecap="round" fill="none" />
      </>
    ),
    home: (
      <>
        <path d="M14 31 L32 16 L50 31 V50 H14 Z" fill="#A8D4FF" stroke="#6F9FD0" strokeWidth="2.4" strokeLinejoin="round" />
        <rect x="26" y="36" width="12" height="14" rx="4" fill="#FFF4D8" />
      </>
    ),
    medical: (
      <>
        <rect x="16" y="18" width="32" height="28" rx="10" fill="#FFD8E0" stroke="#DB8BA1" strokeWidth="2.4" />
        <path d="M32 24 V40 M24 32 H40" stroke="#C95A78" strokeWidth="4" strokeLinecap="round" />
      </>
    ),
    transport: (
      <>
        <rect x="14" y="19" width="36" height="24" rx="10" fill="#9AD1F0" stroke="#5A9BC2" strokeWidth="2.4" />
        <path d="M19 43 H45" stroke="#5A9BC2" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="22" cy="46" r="4" fill="#4D738C" />
        <circle cx="42" cy="46" r="4" fill="#4D738C" />
      </>
    ),
    package: (
      <>
        <path d="M16 24 L32 15 L48 24 V42 L32 51 L16 42 Z" fill="#D8C5F5" stroke="#A689D8" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M16 24 L32 33 L48 24" stroke="#A689D8" strokeWidth="2.2" fill="none" />
        <path d="M32 33 V51" stroke="#A689D8" strokeWidth="2.2" />
      </>
    ),
    gift: (
      <>
        <rect x="16" y="24" width="32" height="24" rx="6" fill="#FFD1D9" stroke="#D78196" strokeWidth="2.4" />
        <path d="M32 24 V48 M16 33 H48" stroke="#D78196" strokeWidth="2.4" />
        <path d="M27 22 C21 21, 19 16, 23 14 C27 12, 31 16, 32 22 Z M37 22 C43 21, 45 16, 41 14 C37 12, 33 16, 32 22 Z" fill="#FFE8AE" />
      </>
    ),
    light: (
      <>
        <path d="M32 14 C22 14, 16 21, 16 30 C16 37, 20 42, 24 45 V50 H40 V45 C44 42, 48 37, 48 30 C48 21, 42 14, 32 14Z" fill="#FFE89A" stroke="#DBB24E" strokeWidth="2.4" />
        <path d="M25 55 H39" stroke="#B78B32" strokeWidth="3" strokeLinecap="round" />
      </>
    ),
    music: (
      <>
        <path d="M38 14 V38 C35 36, 29 36, 27 41 C25 46, 29 50, 34 49 C39 48, 42 44, 42 39 V22 L50 20 V15 Z" fill="#9BC8FF" stroke="#648FC8" strokeWidth="2.4" strokeLinejoin="round" />
      </>
    ),
    flower: (
      <>
        <circle cx="24" cy="27" r="6" fill="#FFC6DB" />
        <circle cx="40" cy="27" r="6" fill="#FFC6DB" />
        <circle cx="26" cy="40" r="6" fill="#FFB4CF" />
        <circle cx="38" cy="40" r="6" fill="#FFB4CF" />
        <circle cx="32" cy="33" r="5" fill="#F5C85B" />
        <path d="M32 39 V54" stroke="#6DAA61" strokeWidth="3" strokeLinecap="round" />
      </>
    ),
    seed: (
      <path d="M31 16 C23 19, 18 27, 18 35 C18 44, 24 50, 32 50 C40 50, 46 44, 46 35 C46 27, 40 19, 31 16Z" fill="#CBA87B" stroke="#9C764D" strokeWidth="2.4" />
    ),
    sprout: (
      <>
        <path d="M32 50 V28" stroke="#5FA06C" strokeWidth="3" strokeLinecap="round" />
        <path d="M31 29 C24 20, 17 20, 14 24 C19 31, 25 34, 31 29Z" fill="#9FDE8B" />
        <path d="M33 27 C40 18, 47 18, 50 22 C45 30, 39 32, 33 27Z" fill="#7ED38B" />
      </>
    ),
    plant: (
      <>
        <path d="M32 52 V24" stroke="#5A9D68" strokeWidth="3" strokeLinecap="round" />
        <path d="M31 31 C22 22, 14 23, 12 29 C19 36, 26 38, 31 31Z" fill="#A8E08F" />
        <path d="M33 25 C42 16, 50 17, 52 23 C45 30, 38 32, 33 25Z" fill="#89D992" />
        <path d="M31 41 C23 35, 16 36, 14 41 C20 46, 27 47, 31 41Z" fill="#8FD69C" />
      </>
    ),
    bud: (
      <>
        <path d="M32 54 V28" stroke="#5A9D68" strokeWidth="3" strokeLinecap="round" />
        <path d="M24 31 C24 24, 28 18, 32 14 C36 18, 40 24, 40 31 C40 36, 36 40, 32 40 C28 40, 24 36, 24 31Z" fill="#F5C2D5" />
        <path d="M20 44 C24 40, 28 39, 32 41" stroke="#78B674" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M44 44 C40 40, 36 39, 32 41" stroke="#78B674" strokeWidth="2.6" strokeLinecap="round" />
      </>
    ),
    blossom: (
      <>
        <circle cx="32" cy="25" r="7" fill="#FFD8E4" />
        <circle cx="22" cy="29" r="7" fill="#FFC8DA" />
        <circle cx="42" cy="29" r="7" fill="#FFC8DA" />
        <circle cx="26" cy="40" r="7" fill="#FFB9CE" />
        <circle cx="38" cy="40" r="7" fill="#FFB9CE" />
        <circle cx="32" cy="33" r="5" fill="#F4D164" />
        <path d="M32 40 V55" stroke="#72A765" strokeWidth="3" strokeLinecap="round" />
      </>
    ),
    flourish: (
      <>
        <circle cx="32" cy="31" r="6" fill="#F4D164" />
        <circle cx="21" cy="24" r="6" fill="#FFC6DB" />
        <circle cx="43" cy="24" r="6" fill="#FFC6DB" />
        <circle cx="20" cy="38" r="6" fill="#FFB7D0" />
        <circle cx="44" cy="38" r="6" fill="#FFB7D0" />
        <path d="M16 55 C20 46, 26 42, 32 42 C38 42, 44 46, 48 55" stroke="#74B06C" strokeWidth="3" strokeLinecap="round" fill="none" />
      </>
    ),
  };

  const content = iconMap[normalized] || iconMap.sparkle;

  return (
    <span className={classes} aria-hidden="true">
      <svg viewBox="0 0 64 64">
        <defs>
          <linearGradient id="g1" x1="10" x2="54" y1="10" y2="56">
            <stop offset="0%" stopColor="#FFC9DA" />
            <stop offset="100%" stopColor="#F1B6D0" />
          </linearGradient>
          <linearGradient id="g2" x1="12" x2="54" y1="12" y2="56">
            <stop offset="0%" stopColor="#FFD8E7" />
            <stop offset="100%" stopColor="#F6BBCF" />
          </linearGradient>
          <linearGradient id="g3" x1="16" x2="50" y1="16" y2="52">
            <stop offset="0%" stopColor="#B8E8A1" />
            <stop offset="100%" stopColor="#7ED7A1" />
          </linearGradient>
        </defs>
        {content}
      </svg>
    </span>
  );
}

function MoodToast({ mood }) {
  return (
    <div className="toast-overlay">
      <div className="toast-card">
        <span className="burst"><IllustrationIcon name={BURST_ARTS[0]} className="burst-illustration" /></span>
        <span className="burst"><IllustrationIcon name={BURST_ARTS[1]} className="burst-illustration" /></span>
        <span className="burst"><IllustrationIcon name={BURST_ARTS[2]} className="burst-illustration" /></span>
        <span className="burst"><IllustrationIcon name={BURST_ARTS[3]} className="burst-illustration" /></span>
        <div className="toast-emoji"><IllustrationIcon name={getMoodArtName(mood.key, mood.label, mood.icon)} className="toast-illustration" /></div>
        <div className="meta-title" style={{ fontSize: 24 }}>已记录 ✓</div>
        <div className="meta-subtitle" style={{ marginTop: 6 }}>{mood.label}</div>
      </div>
    </div>
  );
}

function UpdateBanner({ update, onDismiss }) {
  return (
    <section className="update-banner">
      <div className="row-between" style={{ alignItems: "flex-start" }}>
        <div>
          <div className="section-note" style={{ opacity: 0.92, marginBottom: 8 }}>
            {APP_NAME} 路 v{update.version}
          </div>
          <div className="meta-title" style={{ fontSize: 21, marginBottom: 8 }}>
            {update.title || "发现新版本"}
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.8 }}>{update.message}</div>
        </div>
        <button type="button" className="ghost-button" onClick={onDismiss}>
          稍后
        </button>
      </div>
      <div className="button-row" style={{ marginTop: 16 }}>
        <a
          className="primary-button"
          href={update.apkUrl}
          style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}
        >
          下载新安装包
        </a>
      </div>
    </section>
  );
}

function hashSeed(seed) {
  return Array.from(String(seed || "")).reduce((sum, char) => sum + char.codePointAt(0), 0);
}

function pickFromList(seed, items) {
  return items[hashSeed(seed) % items.length];
}

function getMoodArtName(moodKey, label = "", icon = "") {
  if (String(moodKey || "").includes("bad")) return "storm";
  if (String(moodKey || "").includes("happy")) return "heart";
  if (String(moodKey || "").includes("tired")) return "breeze";
  if (String(moodKey || "").includes("rest")) return "rest";
  if (String(moodKey || "").includes("okay")) return "tea";
  return pickFromList(`${moodKey}:${label}:${icon}`, CUSTOM_MOOD_ARTS);
}

function getCategoryArtName(categoryId, label = "", icon = "") {
  const key = String(categoryId || "");
  if (key === "groceries") return "groceries";
  if (key === "fruit") return "fruit";
  if (key === "dining") return "dining";
  if (key === "daily") return "home";
  if (key === "medical") return "medical";
  if (key === "transport") return "transport";
  if (key === "other") return "package";
  return pickFromList(`${categoryId}:${label}:${icon}`, CATEGORY_ARTS);
}

function getPlantArtName(stage = "") {
  if (stage.includes("种")) return "seed";
  if (stage.includes("芽")) return "sprout";
  if (stage.includes("叶")) return "plant";
  if (stage.includes("苞")) return "bud";
  if (stage.includes("花")) return "blossom";
  if (stage.includes("盛")) return "flourish";
  return "sprout";
}

function getMoodDecorationArtName(moodKey = "") {
  if (moodKey === "bad") return "breeze";
  if (moodKey === "happy") return "sparkle";
  if (moodKey === "tired") return "rest";
  if (moodKey === "rest") return "moon";
  if (moodKey === "okay") return "leaf";
  return "sparkle";
}

function getAdminReplyState(mood) {
  if (!mood) {
    return "pending";
  }

  if (mood.replyStatus === "ignored") {
    return "ignored";
  }

  if (mood.replyStatus !== "replied") {
    return "pending";
  }

  const unreadReplyCount =
    typeof mood.unreadReplyCount === "number"
      ? mood.unreadReplyCount
      : (mood.replies || []).filter((reply) => !reply.isRead).length;

  return unreadReplyCount > 0 ? "unread" : "read";
}

function getReplyBadge(state) {
  if (state === "replied" || state === "read") {
    return { tone: "replied", label: "已读" };
  }

  if (state === "unread") {
    return { tone: "unread", label: "未读" };
  }

  if (state === "ignored") {
    return { tone: "ignored", label: "暂不回复" };
  }

  return { tone: "pending", label: "待回复" };
}

function compareVersions(leftVersion = "", rightVersion = "") {
  const left = String(leftVersion).split(".").map((part) => Number(part) || 0);
  const right = String(rightVersion).split(".").map((part) => Number(part) || 0);
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    const leftValue = left[index] || 0;
    const rightValue = right[index] || 0;
    if (leftValue > rightValue) return 1;
    if (leftValue < rightValue) return -1;
  }

  return 0;
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || "请求失败，请稍后再试。");
    error.status = response.status;
    throw error;
  }
  return payload;
}

function handleRequestError(error, onUnauthorized, setError) {
  if (error?.status === 401 && onUnauthorized) {
    onUnauthorized();
    return;
  }
  setError(error?.message || "请求失败，请稍后再试。");
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "早上好呀";
  if (hour < 14) return "中午好呀";
  if (hour < 18) return "下午好呀";
  return "晚上好呀";
}

function formatDateTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-");
  return `${year}年${Number(month)}月`;
}

function formatCurrency(value) {
  return Number(value || 0).toFixed(2);
}

function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "春";
  if (month >= 6 && month <= 8) return "夏";
  if (month >= 9 && month <= 11) return "秋";
  return "冬";
}

function getSeasonKey() {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "春";
  if (month >= 6 && month <= 8) return "夏";
  if (month >= 9 && month <= 11) return "秋";
  return "冬";
}

function pickTipsBySeason() {
  const season = getSeasonKey();
  const seasonal = shuffleArray(WELLNESS_TIPS.filter((tip) => tip.season === season));
  const general = shuffleArray(WELLNESS_TIPS.filter((tip) => tip.season === "通用"));
  return shuffleArray([...seasonal.slice(0, 2), ...general.slice(0, 2)]).slice(0, 3);
}

function shuffleArray(list) {
  const next = [...list];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function getPlantProgressPercent(totalCount, nextStageAt) {
  if (!nextStageAt) return 100;
  let previousThreshold = 0;
  for (const stage of PLANT_THRESHOLDS) {
    if (stage.threshold < nextStageAt) {
      previousThreshold = stage.threshold;
    }
  }
  const range = nextStageAt - previousThreshold;
  const progressed = Math.max(0, totalCount - previousThreshold);
  return Math.max(8, Math.min(100, (progressed / range) * 100));
}

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default App;

