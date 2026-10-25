const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildPostcard,
  classifyRhythm,
  dateKey,
  dayDiff,
  dominantCategory,
  emptyDay,
  growthGainForType,
  speciesFor,
  weatherFor,
} = require("../src/shared/rhythm");

test("date helpers use local calendar days", () => {
  const date = new Date(2026, 9, 25, 23, 59);
  assert.equal(dateKey(date), "2026-10-25");
  assert.equal(dayDiff("2026-10-20", "2026-10-25"), 5);
  assert.equal(dayDiff("2026-10-25", "2026-10-20"), 0);
});

test("an empty day is classified as wild/quiet", () => {
  const rhythm = classifyRhythm(emptyDay("2026-10-25"));
  assert.equal(rhythm.key, "quiet");
  assert.equal(rhythm.label, "野生态");
});

test("morning-heavy focused work becomes morning rain", () => {
  const day = emptyDay("2026-10-25");
  day.keys = 400;
  day.bursts = 20;
  day.hourly[8] = 180;
  day.hourly[9] = 140;
  day.hourly[10] = 80;
  const rhythm = classifyRhythm(day);
  assert.equal(rhythm.key, "morning");
});

test("late-evening work becomes night rain", () => {
  const day = emptyDay("2026-10-25");
  day.keys = 500;
  day.bursts = 25;
  day.hourly[21] = 200;
  day.hourly[22] = 200;
  day.hourly[23] = 100;
  assert.equal(classifyRhythm(day).key, "night");
});

test("short dense bursts become wind", () => {
  const day = emptyDay("2026-10-25");
  day.keys = 300;
  day.bursts = 12;
  day.hourly[10] = 150;
  day.hourly[15] = 150;
  assert.equal(classifyRhythm(day).key, "burst");
});

test("content keys beat whitespace when choosing a plant", () => {
  assert.equal(dominantCategory({ letter: 20, digit: 3, punct: 1, space: 99, enter: 9 }), "letter");
  assert.equal(dominantCategory({ letter: 0, digit: 1, punct: 0, space: 99, enter: 9 }), "digit");
  assert.equal(dominantCategory({ letter: 0, digit: 0, punct: 0, space: 30, enter: 2 }), "space");
  assert.equal(dominantCategory({ letter: 0, digit: 0, punct: 0, space: 0, enter: 0 }), null);
});

test("plant growth has a daily ceiling", () => {
  const small = growthGainForType("fern", { letter: 10 });
  const large = growthGainForType("fern", { letter: 10000 });
  assert.ok(small > 0);
  assert.ok(small < large);
  assert.equal(large, 0.16);
  assert.equal(growthGainForType("moss", { letter: 10000, space: 0, enter: 0 }), 0);
});

test("species names depend on rhythm", () => {
  assert.equal(speciesFor("fern", "morning"), "晨雾蕨");
  assert.equal(speciesFor("mushroom", "night"), "灯下菌");
  assert.equal(speciesFor("flower", "burst"), "雨铃花");
});

test("postcards are stable for a given date", () => {
  const day = emptyDay("2026-10-25");
  day.keys = 120;
  day.bursts = 6;
  day.categories.letter = 100;
  const rhythm = classifyRhythm(day);
  const postcard = buildPostcard(day, rhythm, { type: "fern", species: "溪畔蕨" });
  assert.equal(postcard.date, "2026-10-25");
  assert.equal(postcard.unseen, true);
  assert.equal(postcard.newPlant.type, "fern");
  assert.ok(postcard.line.length > 0);
});

test("weather labels are introspective, not scores", () => {
  assert.equal(weatherFor({ paused: true, idleMs: 0, intensity: 1, hour: 12 }).key, "paused");
  assert.equal(weatherFor({ paused: false, idleMs: 700000, intensity: 0, hour: 12 }).key, "quiet");
  assert.equal(weatherFor({ paused: false, idleMs: 2000, intensity: 0.8, hour: 12 }).key, "rain");
});
