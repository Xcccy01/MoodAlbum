export const USER_COOKIE = "mood_album_session";
export const USER_SESSION_SECONDS = 15 * 24 * 60 * 60;
export const HOUSEHOLD_ROLES = ["owner", "caregiver", "member"];
export const INVITE_ROLES = ["caregiver", "member"];
export const INVITE_EXPIRY_DAYS = 7;
export const PLATFORM_UPDATE_PATH = "/downloads/latest.apk";
export const CHINA_TIME_ZONE = "Asia/Shanghai";

export const DEFAULT_MOODS = {
  bad: { key: "bad", label: "不太好", icon: "🌧️" },
  happy: { key: "happy", label: "开心", icon: "🌈" },
  tired: { key: "tired", label: "有点累", icon: "🛋️" },
  rest: { key: "rest", label: "想休息", icon: "🌙" },
  okay: { key: "okay", label: "一般", icon: "🫖" },
};

export const DEFAULT_CATEGORIES = [
  { id: "groceries", name: "买菜", icon: "🥬", isDefault: true },
  { id: "fruit", name: "水果", icon: "🍎", isDefault: true },
  { id: "dining", name: "外出吃饭", icon: "🍜", isDefault: true },
  { id: "daily", name: "日用品", icon: "🧴", isDefault: true },
  { id: "medical", name: "医疗", icon: "💊", isDefault: true },
  { id: "transport", name: "交通", icon: "🚌", isDefault: true },
  { id: "other", name: "其他", icon: "📦", isDefault: true },
];

export const PLANT_STAGES = [
  { threshold: 1, stage: "种子", emoji: "🌰" },
  { threshold: 3, stage: "发芽", emoji: "🌱" },
  { threshold: 7, stage: "长叶", emoji: "🌿" },
  { threshold: 14, stage: "含苞", emoji: "🌷" },
  { threshold: 30, stage: "开花", emoji: "🌸" },
  { threshold: 60, stage: "繁盛", emoji: "🌳" },
];
