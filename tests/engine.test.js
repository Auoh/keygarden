const test = require("node:test");
const assert = require("node:assert/strict");

const { GameEngine, createDefaultState, MAX_PLANTS } = require("../src/main/engine");
const { dateKey } = require("../src/shared/rhythm");

function at(year, month, day, hour = 10, minute = 0) {
  return new Date(year, month - 1, day, hour, minute).getTime();
}

function freshEngine(start) {
  let now = start;
  const engine = new GameEngine({
    state: createDefaultState(start),
    now: () => now,
  });
  return {
    engine,
    setNow(value) {
      now = value;
    },
  };
}

test("typing feeds categories, rhythm and a visual pulse", () => {
  const start = at(2026, 10, 25, 9);
  const { engine } = freshEngine(start);

  for (let index = 0; index < 40; index += 1) {
    engine.recordKey("letter", start + index * 250);
  }
  engine.recordKey("digit", start + 40 * 250);
  engine.recordKey("punct", start + 41 * 250);

  const snapshot = engine.snapshot(start + 42 * 250);
  assert.equal(snapshot.today.keys, 42);
  assert.equal(snapshot.today.categories.letter, 40);
  assert.equal(snapshot.today.bursts, 1);
  assert.ok(snapshot.intensity > 0.5);
  assert.ok(snapshot.plants.some((plant) => plant.growth > 0.5));
  assert.ok(["rain", "breeze"].includes(snapshot.weather.key));
});

test("day rollover grows the garden and creates an unseen postcard", () => {
  const start = at(2026, 10, 25, 8);
  const { engine, setNow } = freshEngine(start);

  for (let index = 0; index < 220; index += 1) {
    engine.recordKey(index % 7 === 0 ? "digit" : "letter", start + index * 260);
  }
  const beforePlants = engine.getState().garden.plants.length;
  const beforeGrowth = engine.getState().garden.plants.find((plant) => plant.type === "fern").growth;

  setNow(at(2026, 10, 26, 9));
  const next = engine.snapshot(at(2026, 10, 26, 9));

  assert.equal(engine.getState().history.length, 1);
  assert.equal(engine.getState().history[0].date, "2026-10-25");
  assert.equal(engine.getState().today.keys, 0);
  assert.equal(engine.getState().garden.plants.length, beforePlants + 1);
  const fern = engine.getState().garden.plants.find((plant) => plant.type === "fern");
  assert.ok(fern.growth > beforeGrowth);
  assert.ok(engine.getState().garden.plants.some((plant) => plant.type === "fern" && plant.plantedDate === "2026-10-25"));
  assert.ok(next.latestPostcard);
  assert.equal(next.latestPostcard.unseen, true);
  assert.equal(next.latestPostcard.date, "2026-10-25");
  assert.equal(next.hasNewPostcard, true);
});

test("opening the journal marks the latest postcard seen", () => {
  const start = at(2026, 10, 25, 9);
  const { engine, setNow } = freshEngine(start);
  for (let index = 0; index < 30; index += 1) {
    engine.recordKey("punct", start + index * 300);
  }
  setNow(at(2026, 10, 26, 9));
  engine.snapshot(at(2026, 10, 26, 9));
  assert.equal(engine.snapshot(at(2026, 10, 26, 9)).latestPostcard.unseen, true);
  engine.markPostcardSeen();
  assert.equal(engine.snapshot(at(2026, 10, 26, 9)).latestPostcard.unseen, false);
});

test("a day without typing does not create a postcard", () => {
  const start = at(2026, 10, 25, 9);
  const { engine, setNow } = freshEngine(start);
  setNow(at(2026, 10, 26, 9));
  const snapshot = engine.snapshot(at(2026, 10, 26, 9));
  assert.equal(engine.getState().history.length, 0);
  assert.equal(snapshot.latestPostcard, null);
});

test("missing several days only advances the day counter", () => {
  const start = at(2026, 10, 20, 9);
  const { engine, setNow } = freshEngine(start);
  engine.recordKey("letter", start);
  setNow(at(2026, 10, 25, 10));
  const snapshot = engine.snapshot(at(2026, 10, 25, 10));
  assert.equal(snapshot.daysTogether, 6);
  assert.equal(engine.getState().history.length, 1);
});

test("the garden never exceeds nine visible plants", () => {
  const start = at(2026, 10, 1, 9);
  const { engine, setNow } = freshEngine(start);
  for (let day = 0; day < 14; day += 1) {
    const dayStart = at(2026, 10, 1 + day, 9);
    setNow(dayStart);
    for (let index = 0; index < 25; index += 1) {
      engine.recordKey("letter", dayStart + index * 300);
    }
  }
  setNow(at(2026, 10, 16, 9));
  engine.snapshot(at(2026, 10, 16, 9));
  assert.equal(engine.getState().garden.plants.length, MAX_PLANTS);
  assert.ok(engine.getState().garden.archived > 0);
  assert.equal(new Set(engine.getState().garden.plants.map((plant) => plant.slot)).size, MAX_PLANTS);
});

test("state can be normalized from old or partial data", () => {
  const now = at(2026, 10, 25, 9);
  const engine = new GameEngine({
    state: { today: { date: dateKey(new Date(now)), keys: 0 } },
    now: () => now,
  });
  assert.equal(engine.getState().profile.mode, "garden");
  assert.equal(engine.getState().garden.plants.length, 5);
  assert.equal(engine.getState().today.categories.letter, 0);
  assert.equal(engine.getState().settings.paused, false);
});
