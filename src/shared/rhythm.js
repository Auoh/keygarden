const CATEGORY_LABELS = {
  letter: "字母",
  digit: "数字",
  punct: "标点",
  space: "空格",
  enter: "回车",
  backspace: "退格",
};

const PLANT_TYPES = {
  fern: {
    id: "fern",
    label: "蕨",
    source: "letter",
    sourceLabel: "字母",
    color: "#7fae7c",
  },
  mushroom: {
    id: "mushroom",
    label: "菌",
    source: "digit",
    sourceLabel: "数字",
    color: "#e0a66d",
  },
  flower: {
    id: "flower",
    label: "花",
    source: "punct",
    sourceLabel: "标点",
    color: "#e9dfbf",
  },
  moss: {
    id: "moss",
    label: "苔",
    source: "space",
    sourceLabel: "留白",
    color: "#7f9d68",
  },
};

const SPECIES = {
  fern: {
    morning: "晨雾蕨",
    night: "月影蕨",
    steady: "溪畔蕨",
    burst: "风铃蕨",
    quiet: "野地蕨",
  },
  mushroom: {
    morning: "露顶菌",
    night: "灯下菌",
    steady: "石阶菌",
    burst: "雨后菌",
    quiet: "苔间菌",
  },
  flower: {
    morning: "晨光花",
    night: "夜灯花",
    steady: "溪边花",
    burst: "雨铃花",
    quiet: "风籽花",
  },
  moss: {
    morning: "晨绒苔",
    night: "月苔",
    steady: "溪苔",
    burst: "风苔",
    quiet: "野苔",
  },
};

const RHYTHMS = {
  morning: {
    key: "morning",
    label: "晨间阵雨",
    description: "雨落在上午，节奏短而亮。",
    color: "#9dbfa2",
    icon: "morning",
  },
  night: {
    key: "night",
    label: "夜间细雨",
    description: "灯亮得晚，雨声很轻。",
    color: "#8f9fca",
    icon: "night",
  },
  steady: {
    key: "steady",
    label: "绵长溪流",
    description: "不紧不慢，水一直流着。",
    color: "#8fb8ae",
    icon: "steady",
  },
  burst: {
    key: "burst",
    label: "一阵风",
    description: "工作一阵一阵地来，像风穿过草地。",
    color: "#d8b482",
    icon: "burst",
  },
  quiet: {
    key: "quiet",
    label: "零星小雨",
    description: "今天只有几滴雨，花园自己待着。",
    color: "#8d9b92",
    icon: "quiet",
  },
};

const POSTCARD_LINES = {
  morning: [
    "上午的雨来得急，走得也快。",
    "晨光落下来时，叶子刚好接住。",
    "今天的花园，是从一杯早咖啡之后开始长的。",
  ],
  night: [
    "夜里的键盘声很轻，像雨落在窗沿。",
    "灯亮着，花园也跟着醒着。",
    "晚归的雨，给每一片叶子都留了一颗露水。",
  ],
  steady: [
    "没有大风景，只有水一直流着。",
    "今天的花园，长得很安静。",
    "重复的事做久了，也会长成一条小路。",
  ],
  burst: [
    "风来过几次，草都朝一个方向弯。",
    "今天的花园，像被谁匆匆翻过一页。",
    "一阵一阵的雨，反而让土松得刚刚好。",
  ],
  quiet: [
    "今天很轻，花园只往前挪了一小步。",
    "没有关系，野生态也有自己的秩序。",
    "安静的一天，也会被苔藓记住。",
  ],
};

const CATEGORY_ORDER = ["letter", "digit", "punct", "space", "enter", "backspace"];

function pad(value) {
  return String(value).padStart(2, "0");
}

function dateKey(input = new Date()) {
  const date = input instanceof Date ? input : new Date(input);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateKey(key) {
  const [year, month, day] = String(key).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function dayDiff(fromKey, toKey) {
  const from = parseDateKey(fromKey);
  const to = parseDateKey(toKey);
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / 86400000));
}

function emptyCategories() {
  return {
    letter: 0,
    digit: 0,
    punct: 0,
    space: 0,
    enter: 0,
    backspace: 0,
  };
}

function emptyDay(date = dateKey()) {
  return {
    date,
    keys: 0,
    categories: emptyCategories(),
    bursts: 0,
    activeMs: 0,
    pauses: 0,
    longestBurst: 0,
    currentBurst: 0,
    hourly: Array.from({ length: 24 }, () => 0),
    firstKeyAt: null,
    lastKeyAt: null,
  };
}

function hashNumber(input) {
  let hash = 2166136261;
  const text = String(input);
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function dominantCategory(categories) {
  if (!categories) return null;
  let best = null;
  let bestCount = 0;
  // Content keys shape the garden. Whitespace only wins if there was no prose.
  for (const category of ["letter", "digit", "punct"]) {
    if ((categories[category] || 0) > bestCount) {
      best = category;
      bestCount = categories[category];
    }
  }
  if (best) return best;
  if ((categories.space || 0) + (categories.enter || 0) > 0) return "space";
  return null;
}

function plantTypeForCategory(category) {
  if (category === "letter") return "fern";
  if (category === "digit") return "mushroom";
  if (category === "punct") return "flower";
  return "moss";
}

function dominantPlantType(categories) {
  const category = dominantCategory(categories);
  return category ? plantTypeForCategory(category) : null;
}

function classifyRhythm(day) {
  const keys = day?.keys || 0;
  if (keys < 1) {
    return {
      ...RHYTHMS.quiet,
      label: "野生态",
      description: "今天没有下雨，花园自己在长。",
    };
  }

  const hourly = day.hourly || [];
  const activeHours = hourly.filter((count) => count > 0).length;
  const morning = hourly.slice(5, 12).reduce((sum, count) => sum + count, 0);
  const evening = hourly.slice(18, 24).concat(hourly.slice(0, 5)).reduce((sum, count) => sum + count, 0);
  const bursts = Math.max(1, day.bursts || 1);
  const averageBurst = keys / bursts;
  const morningShare = morning / keys;
  const eveningShare = evening / keys;

  if (keys < 80) return RHYTHMS.quiet;
  if (morningShare >= 0.55) return RHYTHMS.morning;
  if (eveningShare >= 0.55) return RHYTHMS.night;
  if (averageBurst >= 13 && bursts <= keys / 9) return RHYTHMS.burst;
  if (activeHours >= 6 || keys >= 900) return RHYTHMS.steady;
  return RHYTHMS.steady;
}

function speciesFor(type, rhythmKey) {
  const family = SPECIES[type] || SPECIES.fern;
  return family[rhythmKey] || family.quiet;
}

function growthGainForType(type, categories) {
  if (!categories) return 0;
  const config = PLANT_TYPES[type] || PLANT_TYPES.fern;
  let count = 0;
  if (type === "moss") {
    count = (categories.space || 0) + (categories.enter || 0);
  } else {
    count = categories[config.source] || 0;
  }
  return Math.min(0.16, (count / 120) * 0.16);
}

function postcardLine(rhythmKey, seed) {
  const lines = POSTCARD_LINES[rhythmKey] || POSTCARD_LINES.steady;
  return lines[hashNumber(seed) % lines.length];
}

function buildPostcard(day, rhythm, newPlant) {
  return {
    date: day.date,
    title: rhythm.label,
    rhythm: rhythm.key,
    description: rhythm.description,
    line: postcardLine(rhythm.key, day.date),
    dominant: dominantCategory(day.categories),
    newPlant: newPlant
      ? {
          type: newPlant.type,
          species: newPlant.species,
          label: PLANT_TYPES[newPlant.type]?.label || "芽",
        }
      : null,
    stats: {
      keys: day.keys,
      activeMs: day.activeMs,
      pauses: day.pauses,
      bursts: day.bursts,
    },
    unseen: true,
  };
}

function formatDuration(ms) {
  const minutes = Math.max(0, Math.round((ms || 0) / 60000));
  if (minutes < 60) return `${minutes} 分钟`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} 小时 ${rest} 分钟` : `${hours} 小时`;
}

function formatTime(date = new Date()) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function timeOfDay(date = new Date()) {
  const hour = date.getHours();
  if (hour < 5) return "深夜";
  if (hour < 9) return "清晨";
  if (hour < 12) return "上午";
  if (hour < 14) return "正午";
  if (hour < 18) return "下午";
  if (hour < 22) return "傍晚";
  return "夜里";
}

function weatherFor({ paused, idleMs, intensity, hour }) {
  if (paused) return { key: "paused", label: "已暂停", detail: "没有在听" };
  if (idleMs > 10 * 60 * 1000) return { key: "quiet", label: "安静", detail: "花园在休息" };
  if (intensity >= 0.62) return { key: "rain", label: "骤雨", detail: "雨点很密" };
  if (intensity >= 0.2) return { key: "rain", label: "微雨", detail: "雨声很轻" };
  if (intensity > 0.01) return { key: "breeze", label: "起风", detail: "叶子在动" };
  if (hour >= 22 || hour < 6) return { key: "night", label: "夜露", detail: "只有萤火虫" };
  return { key: "calm", label: "等风", detail: "还没有开始" };
}

module.exports = {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  PLANT_TYPES,
  RHYTHMS,
  SPECIES,
  buildPostcard,
  classifyRhythm,
  dateKey,
  dayDiff,
  dominantCategory,
  dominantPlantType,
  emptyCategories,
  emptyDay,
  formatDuration,
  formatTime,
  growthGainForType,
  hashNumber,
  parseDateKey,
  plantTypeForCategory,
  postcardLine,
  speciesFor,
  timeOfDay,
  weatherFor,
};
