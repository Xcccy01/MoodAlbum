export const APP_NAME = "MoodAlbum";
export const APP_TIME_ZONE = "Asia/Shanghai";

export const COLORS = {
  primary: "#6BAF7B",
  peach: "#F2A885",
  blue: "#7EB8D8",
  lavender: "#B09BD6",
  yellow: "#E8C858",
  rose: "#D88A9A",
  muted: "#8FA396",
};

export const MOODS = [
  {
    key: "bad",
    icon: "🌧️",
    label: "不太好",
    size: "large",
    accent: "var(--lavender)",
    position: { top: "0%", left: "56%" },
    rotate: "4deg",
  },
  {
    key: "happy",
    icon: "🌈",
    label: "开心",
    size: "small",
    accent: "var(--primary)",
    position: { top: "14%", left: "4%" },
    rotate: "-4deg",
  },
  {
    key: "tired",
    icon: "🛋️",
    label: "有点累",
    size: "large",
    accent: "var(--blue)",
    position: { top: "42%", left: "0%" },
    rotate: "-2deg",
  },
  {
    key: "rest",
    icon: "🌙",
    label: "想休息",
    size: "large",
    accent: "var(--rose)",
    position: { top: "32%", left: "61%" },
    rotate: "6deg",
  },
  {
    key: "okay",
    icon: "🫖",
    label: "一般",
    size: "small",
    accent: "var(--yellow)",
    position: { top: "73%", left: "33%" },
    rotate: "-3deg",
  },
];

export const CUSTOM_MOOD_ICONS = ["🙂", "😌", "🤗", "🥰", "😴", "🥹", "😎", "🤒", "😔", "🥳", "🫖", "🌤️"];
export const DEFAULT_CATEGORY_ICONS = ["🏠", "🎁", "👔", "📚", "🎮", "💇", "🐶", "🌸", "💡", "🎵", "🏋️", "✈️"];
export const CATEGORY_ICONS = DEFAULT_CATEGORY_ICONS;
export const NAV_ITEMS = [
  { key: "mood", label: "心情", icon: "💗" },
  { key: "wellness", label: "养生", icon: "🌿" },
  { key: "expense", label: "记账", icon: "📒" },
];
export const TABS = NAV_ITEMS;

export const WELLNESS_TIPS = [
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

export const PLANT_STAGE_META = {
  种子: { emoji: "🫘", message: "今天也在悄悄蓄力。" },
  发芽: { emoji: "🌱", message: "一点点坚持，已经冒出新芽。" },
  长叶: { emoji: "🌿", message: "叶片舒展开，日子也更有生气。" },
  含苞: { emoji: "🪷", message: "已经开始积攒开花的力量。" },
  开花: { emoji: "🌸", message: "状态越来越好，心情也有了颜色。" },
  繁盛: { emoji: "🌳", message: "长期坚持很了不起，已经枝叶丰盛。" },
};
