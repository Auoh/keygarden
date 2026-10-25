const test = require("node:test");
const assert = require("node:assert/strict");

const { GameEngine, createDefaultState } = require("../src/main/engine");
const { JourneyEngine, createDefaultJourney, LEG_LENGTH_M, legAt } = require("../src/main/journey");
const { dateKey } = require("../src/shared/rhythm");

function at(year, month, day, hour = 10, minute = 0) {
  return new Date(year, month - 1, day, hour, minute).getTime();
}

test("typing advances the journey and switches the app into mode B", () => {
  const start = at(2026, 10, 25, 9);
  let now = start;
  const engine = new GameEngine({ state: createDefaultState(start), now: () => now });
  assert.equal(engine.getState().profile.mode, "garden");
  assert.equal(engine.setMode("journey"), true);
  assert.equal(engine.getState().profile.mode, "journey");

  for (let index = 0; index < 100; index += 1) {
    engine.recordKey("letter", start + index * 250);
  }
  now = start + 100 * 250;
  const snapshot = engine.journeySnapshot(now);
  assert.equal(snapshot.mode, "journey");
  assert.equal(snapshot.today.keys, 100);
  assert.ok(snapshot.totalDistanceM > 0);
  assert.ok(snapshot.todayDistanceM > 0);
  assert.equal(snapshot.leg.name, "雾之谷");
  assert.ok(snapshot.leg.progress >= 0 && snapshot.leg.progress < 1);
});

test("a journey day rolls over into a travel postcard", () => {
  const start = at(2026, 10, 25, 9);
  let now = start;
  const engine = new GameEngine({ state: createDefaultState(start), now: () => now });
  engine.setMode("journey");
  for (let index = 0; index < 40; index += 1) {
    engine.recordKey("letter", start + index * 300);
  }
  now = at(2026, 10, 26, 9);
  const snapshot = engine.journeySnapshot(now);
  const journey = engine.getState().journey;
  assert.equal(journey.history.length, 1);
  assert.equal(journey.history[0].date, "2026-10-25");
  assert.equal(snapshot.today.keys, 0);
  assert.ok(snapshot.latestPostcard);
  assert.equal(snapshot.latestPostcard.unseen, true);
  assert.ok(snapshot.latestPostcard.stats.distanceM > 0);
});

test("completing a leg unlocks a souvenir", () => {
  const start = at(2026, 10, 25, 9);
  const journey = new JourneyEngine({ state: createDefaultJourney(start), now: () => start });
  // A little over one leg.
  const keys = Math.ceil(LEG_LENGTH_M / 2.2) + 2;
  for (let index = 0; index < keys; index += 1) {
    journey.recordKey("letter", start + index * 10);
  }
  const state = journey.getState();
  assert.ok(state.totalDistanceM >= LEG_LENGTH_M);
  assert.ok(state.souvenirs.length >= 1);
  assert.equal(state.souvenirs[0], "旧车票");
  assert.equal(legAt(state.totalDistanceM).name, "松针坡");
});

test("a long pause is reported as camping, not failure", () => {
  const start = at(2026, 10, 25, 20);
  let now = start;
  const journey = new JourneyEngine({ state: createDefaultJourney(start), now: () => now });
  journey.recordKey("letter", start);
  now = start + 6 * 60 * 1000;
  const snapshot = journey.snapshot(now);
  assert.equal(snapshot.camped, true);
  assert.equal(snapshot.weather.key, "camp");
  assert.equal(snapshot.today.keys, 1);
});

test("journey state survives a restart without losing distance", () => {
  const start = at(2026, 10, 25, 9);
  const first = new JourneyEngine({ state: createDefaultJourney(start), now: () => start });
  for (let index = 0; index < 50; index += 1) first.recordKey("letter", start + index * 200);
  const saved = JSON.parse(JSON.stringify(first.getState()));
  const second = new JourneyEngine({ state: saved, now: () => start + 50 * 200 });
  assert.equal(second.snapshot(start + 50 * 200).totalDistanceM, first.snapshot(start + 50 * 200).totalDistanceM);
  assert.equal(second.getState().today.keys, 50);
});

test("mode can fall back to garden and journey only", () => {
  const start = at(2026, 10, 25, 9);
  const engine = new GameEngine({ state: createDefaultState(start), now: () => start });
  assert.equal(engine.setMode("journey"), true);
  assert.equal(engine.setMode("garden"), true);
  assert.equal(engine.setMode("town"), false);
  assert.equal(engine.getState().profile.mode, "garden");
});
