import { APP_TIME_ZONE, COLORS, PLANT_STAGE_META, WELLNESS_TIPS } from "./constants.js";

const PLANT_THRESHOLDS = [
  { threshold: 1, stage: "种子" },
  { threshold: 3, stage: "发芽" },
  { threshold: 7, stage: "长叶" },
  { threshold: 14, stage: "含苞" },
  { threshold: 30, stage: "开花" },
  { threshold: 60, stage: "繁盛" },
];

export { COLORS };

function getTimeZoneParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const values = {};
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return values;
}

export function shuffleArray(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

export function getCurrentSeasonKey(date = new Date()) {
  const month = Number(getTimeZoneParts(date).month);
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

export function getCurrentSeason() {
  const seasonKey = getCurrentSeasonKey();
  if (seasonKey === "spring") return "春";
  if (seasonKey === "summer") return "夏";
  if (seasonKey === "autumn") return "秋";
  return "冬";
}

function getSeasonKey() {
  return getCurrentSeason();
}

export function pickTipsBySeason() {
  const season = getSeasonKey();
  const seasonal = shuffleArray(WELLNESS_TIPS.filter((tip) => tip.season === season));
  const general = shuffleArray(WELLNESS_TIPS.filter((tip) => tip.season === "通用"));
  return shuffleArray([...seasonal.slice(0, 2), ...general.slice(0, 2)]).slice(0, 3);
}

export function getPlantProgressPercent(totalCount, nextStageAt) {
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

export function getPlantMeta(stage) {
  return PLANT_STAGE_META[stage] || PLANT_STAGE_META["种子"];
}

export function formatCurrency(value) {
  return Number(value || 0).toFixed(2);
}

export function getMonthKey(date) {
  const parts = getTimeZoneParts(date);
  return `${parts.year}-${parts.month}`;
}

export function toDateKey(date) {
  const parts = getTimeZoneParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function toChinaDateKey(date = new Date()) {
  return toDateKey(date);
}

export function getMemberReplyState(mood) {
  if (!mood) {
    return "pending";
  }

  if (mood.replyStatus === "ignored") {
    return "ignored";
  }

  if (!hasReplies(mood)) {
    return "pending";
  }

  const unreadReplyCount = getUnreadReplyCount(mood);
  return unreadReplyCount > 0 ? "unread" : "read";
}

export function getAdminReplyState(mood) {
  if (!mood) {
    return "pending";
  }

  if (mood.replyStatus === "ignored") {
    return "ignored";
  }

  if (mood.replyStatus === "pending") {
    return "pending";
  }

  if (!hasReplies(mood)) {
    return mood.replyStatus === "replied" ? "replied" : "pending";
  }

  const unreadReplyCount = getUnreadReplyCount(mood);
  return unreadReplyCount > 0 ? "unread" : "read";
}

function hasReplies(mood) {
  if (!mood) {
    return false;
  }

  if (Array.isArray(mood.replies)) {
    return mood.replies.length > 0;
  }

  const replyCount = Number(mood.replyCount || 0);
  return Number.isFinite(replyCount) && replyCount > 0;
}

function getUnreadReplyCount(mood) {
  if (!mood) {
    return 0;
  }

  if (Array.isArray(mood.replies)) {
    return mood.replies.filter((reply) => !reply.isRead).length;
  }

  const unreadReplyCount = Number(mood.unreadReplyCount || 0);
  return Number.isFinite(unreadReplyCount) ? unreadReplyCount : 0;
}
