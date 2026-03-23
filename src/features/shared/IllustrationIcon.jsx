export const CUSTOM_MOOD_ARTS = [
  "heart",
  "breeze",
  "bloom",
  "rest",
  "clover",
  "sparkle",
  "tea",
  "drop",
  "leaf",
  "wellness",
  "glow",
  "flower",
];
export const CATEGORY_ARTS = ["groceries", "fruit", "dining", "home", "medical", "transport", "package", "gift", "light", "music", "flower", "wellness"];
export const BURST_ARTS = ["leaf", "bloom", "clover", "breeze"];

export function hashSeed(seed) {
  return Array.from(String(seed || "")).reduce((sum, char) => sum + char.codePointAt(0), 0);
}

export function pickFromList(seed, items) {
  return items[hashSeed(seed) % items.length];
}

export function getMoodArtName(moodKey, label = "", icon = "") {
  if (String(moodKey || "").includes("bad")) return "storm";
  if (String(moodKey || "").includes("happy")) return "heart";
  if (String(moodKey || "").includes("tired")) return "breeze";
  if (String(moodKey || "").includes("rest")) return "rest";
  if (String(moodKey || "").includes("okay")) return "tea";
  return pickFromList(`${moodKey}:${label}:${icon}`, CUSTOM_MOOD_ARTS);
}

export function getCategoryArtName(categoryId, label = "", icon = "") {
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

export function getPlantArtName(stage = "") {
  if (stage.includes("种")) return "seed";
  if (stage.includes("芽")) return "sprout";
  if (stage.includes("叶")) return "plant";
  if (stage.includes("苞")) return "bud";
  if (stage.includes("花")) return "blossom";
  if (stage.includes("盛")) return "flourish";
  return "sprout";
}

export function getMoodDecorationArtName(moodKey = "") {
  if (moodKey === "bad") return "breeze";
  if (moodKey === "happy") return "sparkle";
  if (moodKey === "tired") return "rest";
  if (moodKey === "rest") return "rest";
  if (moodKey === "okay") return "leaf";
  return "sparkle";
}

export function IllustrationIcon({ name, className = "" }) {
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
    mood: <path d="M32 18 C24 8, 10 12, 8 24 C6 34, 13 42, 32 56 C51 42, 58 34, 56 24 C54 12, 40 8, 32 18Z" fill="url(#g1)" stroke="#F6EDF6" strokeWidth="2.4" />,
    heart: <path d="M32 18 C24 8, 10 12, 8 24 C6 34, 13 42, 32 56 C51 42, 58 34, 56 24 C54 12, 40 8, 32 18Z" fill="url(#g2)" stroke="#F9EEF3" strokeWidth="2.4" />,
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
      <path
        d="M32 13 C26 22, 20 30, 20 38 C20 46, 25 52, 32 52 C39 52, 44 46, 44 38 C44 30, 38 22, 32 13Z"
        fill="#8FD1EA"
        stroke="#5FAFD0"
        strokeWidth="2.4"
      />
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
      <path d="M38 14 V38 C35 36, 29 36, 27 41 C25 46, 29 50, 34 49 C39 48, 42 44, 42 39 V22 L50 20 V15 Z" fill="#9BC8FF" stroke="#648FC8" strokeWidth="2.4" strokeLinejoin="round" />
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
    seed: <path d="M31 16 C23 19, 18 27, 18 35 C18 44, 24 50, 32 50 C40 50, 46 44, 46 35 C46 27, 40 19, 31 16Z" fill="#CBA87B" stroke="#9C764D" strokeWidth="2.4" />,
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
