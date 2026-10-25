const {
  classifyRhythm,
  dateKey,
  dayDiff,
  emptyDay,
  timeOfDay,
} = require("../shared/rhythm");

const JOURNEY_VERSION = 1;
const LEG_LENGTH_M = 6000;
const METERS_PER_KEY = 2.2;
const MAX_HISTORY = 60;

const LEGS = [
  {
    id: "mist-valley",
    name: "雾之谷",
    next: "松针坡",
    souvenir: "旧车票",
    line: "雾从谷底升起来，远处的灯像一枚旧邮票。",
  },
  {
    id: "pine-slope",
    name: "松针坡",
    next: "旧车站",
    souvenir: "松果",
    line: "松针落在肩上，路比想象中更软。",
  },
  {
    id: "old-station",
    name: "旧车站",
    next: "风蚀原",
    souvenir: "站台票",
    line: "没有列车的站台，风还在等一个迟到的下午。",
  },
  {
    id: "wind-plain",
    name: "风蚀原",
    next: "星见湖",
    souvenir: "蓝羽毛",
    line: "风把草压低，远处的云像一封没写完的信。",
  },
  {
    id: "star-lake",
    name: "星见湖",
    next: "北岸",
    souvenir: "湖边石",
    line: "夜里湖面很静，星星落在水里没有声音。",
  },
  {
    id: "north-shore",
    name: "北岸",
    next: "雾之谷",
    souvenir: "小铃铛",
    line: "北岸的铃铛响了一下，像有人在很远的地方回头。",
  },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function isoNow(now) {
  return new Date(now).toISOString();
}

function emptyJourneyDay(date = dateKey()) {
  return {
    ...emptyDay(date),
    distanceM: 0,
  };
}

function createDefaultJourney(now = Date.now()) {
  return {
    version: JOURNEY_VERSION,
    createdAt: isoNow(now),
    totalKeys: 0,
    totalDistanceM: 0,
    todayDistanceM: 0,
    souvenirs: [],
    history: [],
    lastPostcardDate: null,
    today: emptyJourneyDay(dateKey(new Date(now))),
  };
}

function normalizeJourney(input, now = Date.now()) {
  const defaults = createDefaultJourney(now);
  if (!input || typeof input !== "object") return defaults;
  const state = {
    ...defaults,
    ...input,
    today: { ...emptyJourneyDay(input.today?.date || dateKey(new Date(now))), ...(input.today || {}) },
    history: Array.isArray(input.history) ? input.history.slice(-MAX_HISTORY) : [],
    souvenirs: Array.isArray(input.souvenirs) ? input.souvenirs.slice(0, LEGS.length * 2) : [],
  };
  state.today.categories = { ...emptyDay().categories, ...(input.today?.categories || {}) };
  state.today.hourly = Array.from({ length: 24 }, (_, hour) => Number(input.today?.hourly?.[hour]) || 0);
  state.today.keys = Math.max(0, Number(input.today?.keys) || 0);
  state.today.activeMs = Math.max(0, Number(input.today?.activeMs) || 0);
  state.today.bursts = Math.max(0, Number(input.today?.bursts) || 0);
  state.today.pauses = Math.max(0, Number(input.today?.pauses) || 0);
  state.today.currentBurst = Math.max(0, Number(input.today?.currentBurst) || 0);
  state.today.longestBurst = Math.max(0, Number(input.today?.longestBurst) || 0);
  state.today.distanceM = Math.max(0, Number(input.today?.distanceM) || 0);
  state.totalKeys = Math.max(0, Number(input.totalKeys) || 0);
  state.totalDistanceM = Math.max(0, Number(input.totalDistanceM) || 0);
  state.todayDistanceM = Math.max(0, Number(input.todayDistanceM) || state.today.distanceM);
  return state;
}

function legAt(totalDistanceM) {
  const total = Math.max(0, Number(totalDistanceM) || 0);
  const index = Math.floor(total / LEG_LENGTH_M) % LEGS.length;
  const leg = LEGS[index];
  return {
    index,
    name: leg.name,
    next: leg.next,
    souvenir: leg.souvenir,
    line: leg.line,
    progress: (total % LEG_LENGTH_M) / LEG_LENGTH_M,
    remainingM: Math.max(0, LEG_LENGTH_M - (total % LEG_LENGTH_M)),
  };
}

function distanceForCategory(category) {
  if (category === "punct") return METERS_PER_KEY * 1.35;
  if (category === "digit") return METERS_PER_KEY * 0.9;
  if (category === "space" || category === "enter") return METERS_PER_KEY * 0.55;
  if (category === "backspace") return METERS_PER_KEY * 0.2;
  return METERS_PER_KEY;
}

function journeyWeatherFor({ hour, intensity, idleMs }) {
  if (idleMs > 5 * 60 * 1000) return { key: "camp", label: "营火", detail: "停下来，扎营" };
  if (intensity >= 0.62) return { key: "rain", label: "骤雨", detail: "雨点很密，路很滑" };
  if (intensity >= 0.18) return { key: "rain", label: "细雨", detail: "雨落在背包上" };
  if (intensity > 0.01) return { key: "wind", label: "起风", detail: "风从山脊吹过来" };
  if (hour >= 22 || hour < 6) return { key: "night", label: "星夜", detail: "只有风和星星" };
  if (hour < 9) return { key: "fog", label: "晨雾", detail: "看不见太远" };
  return { key: "clear", label: "晴", detail: "路很清楚" };
}

class JourneyEngine {
  constructor({ state, now = () => Date.now() } = {}) {
    this.now = now;
    this.state = normalizeJourney(state, this.now());
    this.recentKeys = [];
    this.lastInput = null;
    this.ensureToday(this.now());
  }

  getState() {
    return this.state;
  }

  ensureToday(timestamp = this.now()) {
    const dayKey = dateKey(new Date(timestamp));
    if (this.state.today.date === dayKey) return null;
    const oldDay = this.state.today;
    let postcard = null;
    if (oldDay && oldDay.keys > 0) postcard = this.finalizeDay(oldDay);
    this.state.today = emptyJourneyDay(dayKey);
    this.state.todayDistanceM = 0;
    this.recentKeys = [];
    return postcard;
  }

  rememberLegSouvenir() {
    const completedLegs = Math.min(LEGS.length, Math.floor(this.state.totalDistanceM / LEG_LENGTH_M));
    while (this.state.souvenirs.length < completedLegs) {
      const souvenir = LEGS[this.state.souvenirs.length]?.souvenir;
      if (souvenir) this.state.souvenirs.push(souvenir);
    }
  }

  finalizeDay(day) {
    const rhythm = classifyRhythm(day);
    const leg = legAt(this.state.totalDistanceM);
    const lastSouvenir = this.state.souvenirs[this.state.souvenirs.length - 1] || null;
    const postcard = {
      date: day.date,
      title: leg.name,
      rhythm: rhythm.key,
      rhythmLabel: rhythm.label,
      description: rhythm.description,
      line: leg.line,
      unseen: true,
      souvenir: lastSouvenir,
      stats: {
        keys: day.keys,
        distanceM: Math.max(0, Math.round(day.distanceM || 0)),
        activeMs: day.activeMs,
        pauses: day.pauses,
        bursts: day.bursts,
      },
    };
    this.state.history.push({
      date: day.date,
      distanceM: Math.round(day.distanceM || 0),
      keys: day.keys,
      activeMs: day.activeMs,
      rhythm: rhythm.key,
      rhythmLabel: rhythm.label,
      postcard,
      souvenir: lastSouvenir,
    });
    if (this.state.history.length > MAX_HISTORY) {
      this.state.history.splice(0, this.state.history.length - MAX_HISTORY);
    }
    this.state.lastPostcardDate = day.date;
    return postcard;
  }

  recordKey(category, timestamp = this.now()) {
    this.ensureToday(timestamp);
    const day = this.state.today;
    const moment = new Date(timestamp);
    const gap = day.lastKeyAt === null ? null : timestamp - day.lastKeyAt;
    if (gap !== null && gap < 0) return null;

    if (gap === null || gap > 2000) {
      if (gap !== null && gap >= 5 * 60 * 1000) day.pauses += 1;
      day.bursts += 1;
      day.currentBurst = 0;
    }
    if (gap !== null && gap >= 0 && gap <= 60 * 1000) {
      day.activeMs = Math.min(4 * 60 * 60 * 1000, day.activeMs + gap);
    }

    const distance = distanceForCategory(category);
    day.keys += 1;
    day.categories[category] = (day.categories[category] || 0) + 1;
    day.hourly[moment.getHours()] += 1;
    day.currentBurst += 1;
    day.longestBurst = Math.max(day.longestBurst, day.currentBurst);
    day.distanceM += distance;
    day.lastKeyAt = timestamp;
    if (day.firstKeyAt === null) day.firstKeyAt = timestamp;
    this.state.todayDistanceM = day.distanceM;
    this.state.totalDistanceM += distance;
    this.state.totalKeys += 1;
    this.rememberLegSouvenir();
    this.lastInput = { category, at: timestamp };

    this.recentKeys.push(timestamp);
    if (this.recentKeys.length > 180) this.recentKeys.splice(0, this.recentKeys.length - 180);
    return day;
  }

  latestPostcard() {
    return this.state.history.length ? this.state.history[this.state.history.length - 1]?.postcard || null : null;
  }

  markPostcardSeen() {
    const latest = this.latestPostcard();
    if (!latest) return false;
    latest.unseen = false;
    this.state.lastPostcardDate = latest.date;
    return true;
  }

  snapshot(timestamp = this.now()) {
    this.ensureToday(timestamp);
    const day = this.state.today;
    const hour = new Date(timestamp).getHours();
    const recent = this.recentKeys.filter((time) => timestamp - time <= 12000);
    const intensity = Math.max(0, Math.min(1, recent.length / 28));
    const idleMs = day.lastKeyAt === null ? 24 * 60 * 60 * 1000 : Math.max(0, timestamp - day.lastKeyAt);
    const camped = idleMs >= 5 * 60 * 1000 && (day.keys > 0 || this.state.totalDistanceM > 0);
    const weather = camped
      ? { key: "camp", label: "营火", detail: "停下来，扎营" }
      : journeyWeatherFor({ hour, intensity, idleMs: 0 });
    const leg = legAt(this.state.totalDistanceM);
    const latest = this.latestPostcard();
    const days = Math.max(1, dayDiff(dateKey(new Date(this.state.createdAt)), dateKey(new Date(timestamp))) + 1);

    return {
      mode: "journey",
      now: timestamp,
      hour,
      clock: `${String(new Date(timestamp).getHours()).padStart(2, "0")}:${String(new Date(timestamp).getMinutes()).padStart(2, "0")}`,
      period: timeOfDay(new Date(timestamp)),
      daysTogether: days,
      paused: false,
      intensity,
      idleMs,
      camped,
      weather,
      leg,
      todayDistanceM: day.distanceM,
      totalDistanceM: this.state.totalDistanceM,
      today: {
        date: day.date,
        keys: day.keys,
        distanceM: day.distanceM,
        activeMs: day.activeMs,
        pauses: day.pauses,
        bursts: day.bursts,
        categories: { ...day.categories },
      },
      souvenirs: [...this.state.souvenirs],
      hasNewPostcard: Boolean(latest?.unseen),
      latestPostcard: latest,
      lastInput: this.lastInput,
    };
  }

  dashboard(timestamp = this.now()) {
    return {
      ...this.snapshot(timestamp),
      history: this.state.history.slice(-7).reverse().map((entry) => ({
        date: entry.date,
        distanceM: entry.distanceM,
        keys: entry.keys,
        rhythm: entry.rhythm,
        rhythmLabel: entry.rhythmLabel,
        postcard: entry.postcard,
        souvenir: entry.souvenir,
      })),
      stats: {
        totalKeys: this.state.totalKeys,
        totalDistanceM: this.state.totalDistanceM,
      },
    };
  }
}

module.exports = {
  LEGS,
  LEG_LENGTH_M,
  JOURNEY_VERSION,
  JourneyEngine,
  createDefaultJourney,
  distanceForCategory,
  journeyWeatherFor,
  legAt,
  normalizeJourney,
};
