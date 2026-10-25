const {
  CATEGORY_ORDER,
  PLANT_TYPES,
  buildPostcard,
  classifyRhythm,
  dateKey,
  dayDiff,
  dominantCategory,
  dominantPlantType,
  emptyDay,
  growthGainForType,
  speciesFor,
  timeOfDay,
  weatherFor,
} = require("../shared/rhythm");
const { MODES } = require("../shared/modes");

const STATE_VERSION = 2;
const MAX_PLANTS = 9;
const MAX_HISTORY = 90;

function isoNow(now) {
  return new Date(now).toISOString();
}

function starterPlants(createdAt) {
  const planted = dateKey(new Date(createdAt));
  return [
    { id: `starter-fern`, type: "fern", species: "初生蕨", growth: 0.5, slot: 0, plantedDate: planted },
    { id: `starter-mushroom`, type: "mushroom", species: "初生菌", growth: 0.38, slot: 2, plantedDate: planted },
    { id: `starter-flower`, type: "flower", species: "初生花", growth: 0.3, slot: 4, plantedDate: planted },
    { id: `starter-moss`, type: "moss", species: "初生苔", growth: 0.42, slot: 6, plantedDate: planted },
    { id: `starter-fern-2`, type: "fern", species: "初生蕨", growth: 0.22, slot: 7, plantedDate: planted },
  ];
}

function createDefaultState(now = Date.now()) {
  const createdAt = isoNow(now);
  return {
    version: STATE_VERSION,
    createdAt,
    settings: {
      paused: false,
      overlayVisible: true,
      launchAtLogin: false,
    },
    profile: { mode: "garden" },
    meta: {
      firstRun: true,
      totalKeys: 0,
      activeDays: 0,
    },
    garden: {
      plants: starterPlants(createdAt),
      archived: 0,
    },
    today: emptyDay(dateKey(new Date(now))),
    history: [],
    lastPostcardDate: null,
  };
}

function normalizeState(input, now = Date.now()) {
  const defaults = createDefaultState(now);
  if (!input || typeof input !== "object") return defaults;

  const state = {
    ...defaults,
    ...input,
    settings: { ...defaults.settings, ...(input.settings || {}) },
    profile: { ...defaults.profile, ...(input.profile || {}) },
    meta: { ...defaults.meta, ...(input.meta || {}) },
    garden: { ...defaults.garden, ...(input.garden || {}) },
    today: { ...defaults.today, ...(input.today || {}) },
    history: Array.isArray(input.history) ? input.history.slice(-MAX_HISTORY) : [],
    version: STATE_VERSION,
  };

  state.garden.plants = Array.isArray(state.garden.plants) && state.garden.plants.length
    ? state.garden.plants
    : starterPlants(state.createdAt);
  state.garden.plants = state.garden.plants.map((plant, index) => ({
    id: plant.id || `plant-${index}-${plant.type || "fern"}`,
    type: PLANT_TYPES[plant.type] ? plant.type : "fern",
    species: plant.species || "野地蕨",
    growth: Math.max(0, Math.min(1, Number(plant.growth) || 0.12)),
    slot: Number.isInteger(plant.slot) ? plant.slot : index % MAX_PLANTS,
    plantedDate: plant.plantedDate || dateKey(new Date(state.createdAt)),
  }));

  state.today.categories = { ...defaults.today.categories, ...(state.today.categories || {}) };
  state.today.hourly = Array.from({ length: 24 }, (_, hour) => Number(state.today.hourly?.[hour]) || 0);
  state.today.keys = Math.max(0, Number(state.today.keys) || 0);
  state.today.activeMs = Math.max(0, Number(state.today.activeMs) || 0);
  state.today.bursts = Math.max(0, Number(state.today.bursts) || 0);
  state.today.pauses = Math.max(0, Number(state.today.pauses) || 0);
  state.today.currentBurst = Math.max(0, Number(state.today.currentBurst) || 0);
  state.today.longestBurst = Math.max(0, Number(state.today.longestBurst) || 0);
  state.meta.totalKeys = Math.max(0, Number(state.meta.totalKeys) || 0);
  state.meta.activeDays = Math.max(0, Number(state.meta.activeDays) || 0);
  state.profile.mode = "garden";

  return state;
}

class GameEngine {
  constructor({ state, now = () => Date.now() } = {}) {
    this.now = now;
    this.state = normalizeState(state, this.now());
    this.recentKeys = [];
    this.lastInput = null;
    this.ensureToday(this.now());
  }

  getState() {
    return this.state;
  }

  setPaused(paused) {
    this.state.settings.paused = Boolean(paused);
  }

  setOverlayVisible(visible) {
    this.state.settings.overlayVisible = Boolean(visible);
  }

  setLaunchAtLogin(enabled) {
    this.state.settings.launchAtLogin = Boolean(enabled);
  }

  completeFirstRun() {
    this.state.meta.firstRun = false;
  }

  markPostcardSeen() {
    const latest = this.latestHistory();
    if (latest?.postcard) {
      latest.postcard.unseen = false;
      this.state.lastPostcardDate = latest.date;
      return true;
    }
    return false;
  }

  latestHistory() {
    return this.state.history.length ? this.state.history[this.state.history.length - 1] : null;
  }

  latestPostcard() {
    return this.latestHistory()?.postcard || null;
  }

  ensureToday(timestamp = this.now()) {
    const dayKey = dateKey(new Date(timestamp));
    if (this.state.today.date === dayKey) return null;

    const oldDay = this.state.today;
    let finalizedPostcard = null;

    if (oldDay && oldDay.keys > 0) {
      finalizedPostcard = this.finalizeDay(oldDay);
    }

    this.state.today = emptyDay(dayKey);
    this.recentKeys = [];
    return finalizedPostcard;
  }

  finalizeDay(day) {
    const rhythm = classifyRhythm(day);
    const plantType = dominantPlantType(day.categories) || "moss";
    let newPlant = null;

    // Today's input grows every plant of the matching family, then a new
    // seedling joins the garden if there was a real working day.
    for (const plant of this.state.garden.plants) {
      const gain = growthGainForType(plant.type, day.categories);
      plant.growth = Math.min(1, plant.growth + gain);
    }

    if (day.keys >= 20) {
      newPlant = this.addPlant(plantType, rhythm, day.date);
    }

    const postcard = buildPostcard(day, rhythm, newPlant);
    const entry = {
      date: day.date,
      keys: day.keys,
      bursts: day.bursts,
      activeMs: day.activeMs,
      pauses: day.pauses,
      categories: { ...day.categories },
      hourly: [...day.hourly],
      rhythm: rhythm.key,
      rhythmLabel: rhythm.label,
      postcard,
      newPlant: newPlant
        ? {
            type: newPlant.type,
            species: newPlant.species,
          }
        : null,
    };

    this.state.history.push(entry);
    if (this.state.history.length > MAX_HISTORY) {
      this.state.history.splice(0, this.state.history.length - MAX_HISTORY);
    }
    this.state.lastPostcardDate = postcard.date;
    this.state.meta.activeDays += 1;
    return postcard;
  }

  addPlant(type, rhythm, plantedDate) {
    let slot = null;
    const usedSlots = new Set(this.state.garden.plants.map((plant) => plant.slot));
    for (let index = 0; index < MAX_PLANTS; index += 1) {
      if (!usedSlots.has(index)) {
        slot = index;
        break;
      }
    }

    if (slot === null) {
      const oldest = this.state.garden.plants.reduce((candidate, plant) => {
        if (!candidate) return plant;
        return plant.plantedDate < candidate.plantedDate ? plant : candidate;
      }, null);
      if (oldest) {
        slot = oldest.slot;
        this.state.garden.plants = this.state.garden.plants.filter((plant) => plant.id !== oldest.id);
        this.state.garden.archived += 1;
      } else {
        slot = 0;
      }
    }

    const plant = {
      id: `plant-${plantedDate}-${type}-${slot}`,
      type,
      species: speciesFor(type, rhythm.key),
      growth: 0.14,
      slot,
      plantedDate,
    };
    this.state.garden.plants.push(plant);
    return plant;
  }

  recordKey(category, timestamp = this.now()) {
    if (!CATEGORY_ORDER.includes(category)) return null;
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

    day.keys += 1;
    day.categories[category] += 1;
    day.hourly[moment.getHours()] += 1;
    day.currentBurst += 1;
    day.longestBurst = Math.max(day.longestBurst, day.currentBurst);
    if (day.firstKeyAt === null) day.firstKeyAt = timestamp;
    day.lastKeyAt = timestamp;
    this.state.meta.totalKeys += 1;
    this.lastInput = { category, at: timestamp };

    this.recentKeys.push(timestamp);
    if (this.recentKeys.length > 180) this.recentKeys.splice(0, this.recentKeys.length - 180);
    return day;
  }

  recordBatch(events) {
    for (const event of events) {
      this.recordKey(event.category, event.t);
    }
  }

  /**
   * Development-only visual priming. It does not change any counters; it only
   * gives the renderer a few recent timestamps so screenshots can show weather.
   */
  primeRecentKeys(count = 12, spacingMs = 500) {
    const now = this.now();
    this.recentKeys = Array.from({ length: count }, (_, index) => now - (count - index) * spacingMs);
    this.state.today.lastKeyAt = now - 12000;
  }

  snapshot(timestamp = this.now()) {
    this.ensureToday(timestamp);
    const day = this.state.today;
    const hour = new Date(timestamp).getHours();
    const recent = this.recentKeys.filter((time) => timestamp - time <= 12000);
    const intensity = Math.max(0, Math.min(1, recent.length / 28));
    const idleMs = day.lastKeyAt === null ? 24 * 60 * 60 * 1000 : Math.max(0, timestamp - day.lastKeyAt);
    const weather = weatherFor({
      paused: this.state.settings.paused,
      idleMs,
      intensity,
      hour,
    });
    const plants = this.state.garden.plants
      .slice()
      .sort((a, b) => a.slot - b.slot)
      .map((plant) => ({
        ...plant,
        growth: Math.min(1, plant.growth + growthGainForType(plant.type, day.categories)),
      }));
    const latest = this.latestPostcard();
    const daysTogether = Math.max(1, dayDiff(dateKey(new Date(this.state.createdAt)), dateKey(new Date(timestamp))) + 1);
    const rhythm = classifyRhythm(day);

    return {
      now: timestamp,
      clock: `${String(new Date(timestamp).getHours()).padStart(2, "0")}:${String(new Date(timestamp).getMinutes()).padStart(2, "0")}`,
      period: timeOfDay(new Date(timestamp)),
      hour,
      daysTogether,
      firstRun: Boolean(this.state.meta.firstRun),
      paused: Boolean(this.state.settings.paused),
      overlayVisible: Boolean(this.state.settings.overlayVisible),
      plants,
      intensity,
      idleMs,
      lastInput: this.lastInput,
      weather,
      rhythmPreview: rhythm,
      today: {
        date: day.date,
        keys: day.keys,
        activeMs: day.activeMs,
        pauses: day.pauses,
        bursts: day.bursts,
        categories: { ...day.categories },
        dominant: dominantCategory(day.categories),
        hourly: [...day.hourly],
      },
      garden: {
        archived: this.state.garden.archived,
        plantCount: this.state.garden.plants.length,
      },
      hasNewPostcard: Boolean(latest?.unseen),
      latestPostcard: latest,
    };
  }

  dashboard(timestamp = this.now()) {
    const snapshot = this.snapshot(timestamp);
    const history = this.state.history.slice(-7).reverse().map((entry) => ({
      date: entry.date,
      rhythm: entry.rhythm,
      rhythmLabel: entry.rhythmLabel,
      keys: entry.keys,
      activeMs: entry.activeMs,
      pauses: entry.pauses,
      newPlant: entry.newPlant,
      postcard: entry.postcard,
    }));

    return {
      ...snapshot,
      history,
      modes: MODES,
      settings: { ...this.state.settings },
      privacy: {
        captures: "按键节奏与键类计数",
        neverStores: ["字符内容", "窗口标题", "剪贴板", "网络上传"],
      },
      stats: {
        totalKeys: this.state.meta.totalKeys,
        activeDays: this.state.meta.activeDays,
      },
    };
  }
}

module.exports = {
  GameEngine,
  STATE_VERSION,
  MAX_PLANTS,
  MAX_HISTORY,
  createDefaultState,
  normalizeState,
  starterPlants,
};
