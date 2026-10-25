const { createDefaultState } = require("./engine");
const {
  buildPostcard,
  classifyRhythm,
  dateKey,
  emptyDay,
} = require("../shared/rhythm");

function dateAt(offsetDays, base = Date.now()) {
  const date = new Date(base);
  date.setDate(date.getDate() + offsetDays);
  date.setHours(23, 10, 0, 0);
  return date;
}

function makeHistoryEntry(offsetDays, rhythmKey, rhythmLabel, postcard = null) {
  const date = dateAt(offsetDays);
  const day = emptyDay(dateKey(date));
  day.keys = 600 + Math.abs(offsetDays) * 210;
  day.bursts = 8;
  day.activeMs = 1800000;
  day.hourly[10] = 200;
  day.hourly[15] = 180;
  day.hourly[21] = 160;
  const rhythm = classifyRhythm(day);
  return {
    date: day.date,
    keys: day.keys,
    bursts: day.bursts,
    activeMs: day.activeMs,
    pauses: 2,
    categories: { ...day.categories, letter: 400, digit: 60, punct: 100, space: 120, enter: 20, backspace: 4 },
    hourly: [...day.hourly],
    rhythm: rhythmKey || rhythm.key,
    rhythmLabel: rhythmLabel || rhythm.label,
    postcard,
    newPlant: postcard?.newPlant || null,
  };
}

function buildDemoState(now = Date.now()) {
  const state = createDefaultState(now);
  state.createdAt = dateAt(-11, now).toISOString();
  state.settings = { paused: false, overlayVisible: true, launchAtLogin: false };
  state.meta = { firstRun: false, totalKeys: 38420, activeDays: 6 };
  state.garden.archived = 2;
  state.garden.plants = [
    { id: "demo-fern", type: "fern", species: "月影蕨", growth: 0.86, slot: 0, plantedDate: dateKey(dateAt(-8, now)) },
    { id: "demo-mushroom", type: "mushroom", species: "灯下菌", growth: 0.68, slot: 1, plantedDate: dateKey(dateAt(-6, now)) },
    { id: "demo-flower", type: "flower", species: "夜灯花", growth: 0.62, slot: 2, plantedDate: dateKey(dateAt(-5, now)) },
    { id: "demo-fern-2", type: "fern", species: "溪畔蕨", growth: 0.48, slot: 3, plantedDate: dateKey(dateAt(-4, now)) },
    { id: "demo-flower-2", type: "flower", species: "晨光花", growth: 0.72, slot: 4, plantedDate: dateKey(dateAt(-3, now)) },
    { id: "demo-mushroom-2", type: "mushroom", species: "苔间菌", growth: 0.36, slot: 5, plantedDate: dateKey(dateAt(-2, now)) },
    { id: "demo-moss", type: "moss", species: "月苔", growth: 0.88, slot: 6, plantedDate: dateKey(dateAt(-1, now)) },
  ];

  const todayDate = dateAt(0, now);
  const today = emptyDay(dateKey(todayDate));
  today.keys = 2840;
  today.bursts = 14;
  today.activeMs = 3560000;
  today.pauses = 4;
  today.categories = { letter: 2080, digit: 160, punct: 320, space: 230, enter: 36, backspace: 14 };
  today.hourly[8] = 120;
  today.hourly[9] = 420;
  today.hourly[10] = 510;
  today.hourly[11] = 300;
  today.hourly[14] = 260;
  today.hourly[15] = 380;
  today.hourly[16] = 250;
  today.hourly[21] = 320;
  today.hourly[22] = 280;
  today.lastKeyAt = now - 12000;
  today.firstKeyAt = now - 8 * 3600000;
  state.today = today;

  const yesterdayDay = emptyDay(dateKey(dateAt(-1, now)));
  yesterdayDay.keys = 3180;
  yesterdayDay.bursts = 18;
  yesterdayDay.activeMs = 4300000;
  yesterdayDay.pauses = 5;
  yesterdayDay.categories = { letter: 2300, digit: 180, punct: 400, space: 240, enter: 42, backspace: 18 };
  yesterdayDay.hourly[9] = 300;
  yesterdayDay.hourly[14] = 420;
  yesterdayDay.hourly[20] = 560;
  yesterdayDay.hourly[21] = 600;
  yesterdayDay.hourly[22] = 720;
  yesterdayDay.hourly[23] = 580;
  const yesterdayRhythm = classifyRhythm(yesterdayDay);
  const newPlant = { type: "fern", species: "月影蕨" };
  const latestPostcard = buildPostcard(yesterdayDay, yesterdayRhythm, newPlant);
  latestPostcard.unseen = true;
  latestPostcard.date = dateKey(dateAt(-1, now));

  const older = [
    makeHistoryEntry(-4, "quiet", "零星小雨"),
    makeHistoryEntry(-3, "burst", "一阵风"),
    makeHistoryEntry(-2, "morning", "晨间阵雨"),
    makeHistoryEntry(-1, yesterdayRhythm.key, yesterdayRhythm.label, latestPostcard),
  ];

  state.history = older;
  state.lastPostcardDate = latestPostcard.date;
  state.today = today;

  const journeyToday = emptyDay(dateKey(todayDate));
  journeyToday.keys = 1140;
  journeyToday.distanceM = 2520;
  journeyToday.bursts = 9;
  journeyToday.activeMs = 1900000;
  journeyToday.pauses = 2;
  journeyToday.categories = { ...journeyToday.categories, letter: 860, digit: 80, punct: 130, space: 60, enter: 10 };
  journeyToday.hourly[9] = 120;
  journeyToday.hourly[10] = 260;
  journeyToday.hourly[11] = 160;
  journeyToday.hourly[15] = 180;
  journeyToday.hourly[21] = 420;
  journeyToday.lastKeyAt = now - 12000;
  journeyToday.firstKeyAt = now - 6 * 3600000;
  const journeyPostcard = {
    date: dateKey(dateAt(-1, now)),
    title: "雾之谷",
    rhythm: "night",
    rhythmLabel: "夜间细雨",
    description: "灯亮得晚，雨声很轻。",
    line: "雾从谷底升起来，远处的灯像一枚旧邮票。",
    unseen: true,
    souvenir: "旧车票",
    stats: { keys: 980, distanceM: 2160, activeMs: 1800000, pauses: 2, bursts: 7 },
  };
  state.journey = {
    version: 1,
    createdAt: dateAt(-11, now).toISOString(),
    totalKeys: 13400,
    totalDistanceM: 8520,
    todayDistanceM: journeyToday.distanceM,
    souvenirs: ["旧车票"],
    history: [{
      date: journeyPostcard.date,
      distanceM: 2160,
      keys: 980,
      activeMs: 1800000,
      rhythm: "night",
      rhythmLabel: "夜间细雨",
      postcard: journeyPostcard,
      souvenir: "旧车票",
    }],
    lastPostcardDate: journeyPostcard.date,
    today: journeyToday,
  };
  return state;
}

module.exports = { buildDemoState };
