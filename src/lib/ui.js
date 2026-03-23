import { COLORS, PLANT_STAGE_META, WELLNESS_TIPS } from "./constants.js";

const PLANT_THRESHOLDS = [
  { threshold: 1, stage: "种子" },
  { threshold: 3, stage: "发芽" },
  { threshold: 7, stage: "长叶" },
  { threshold: 14, stage: "含苞" },
  { threshold: 30, stage: "开花" },
  { threshold: 60, stage: "繁盛" },
];

export { COLORS };

export function shuffleArray(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

export function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "春";
  if (month >= 6 && month <= 8) return "夏";
  if (month >= 9 && month <= 11) return "秋";
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
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function getMemberReplyState(mood) {
  if (!mood) {
    return "pending";
  }

  if (mood.replyStatus === "ignored") {
    return "ignored";
  }

  const replies = mood.replies || [];
  if (!replies.length) {
    return "pending";
  }

  const unreadReplyCount = replies.filter((reply) => !reply.isRead).length;
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

  const replies = mood.replies || [];
  if (!replies.length) {
    return mood.replyStatus === "replied" ? "replied" : "pending";
  }

  const unreadReplyCount = replies.filter((reply) => !reply.isRead).length;
  return unreadReplyCount > 0 ? "unread" : "read";
}
