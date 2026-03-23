export function formatDateTime(value) {
  if (!value) {
    return "";
  }
  return new Intl.DateTimeFormat("zh-CN", {
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

export function getReplyBadge(replyStatus) {
  if (replyStatus === "replied") {
    return { tone: "success", label: "已回复" };
  }
  if (replyStatus === "ignored") {
    return { tone: "muted", label: "暂不回复" };
  }
  return { tone: "warning", label: "待回复" };
}
