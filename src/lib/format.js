import { APP_TIME_ZONE } from "./constants.js";

export function formatDateTime(value) {
  if (!value) {
    return "";
  }
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: APP_TIME_ZONE,
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatDate(value) {
  if (!value) {
    return "";
  }
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date(value));
}

export function formatMonthLabel(monthKey) {
  const [year, month] = String(monthKey || "").split("-");
  if (!year || !month) {
    return monthKey;
  }
  return `${year}年${Number(month)}月`;
}

export function formatCurrency(value) {
  return Number(value || 0).toFixed(2);
}

export function getReplyBadge(state) {
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
