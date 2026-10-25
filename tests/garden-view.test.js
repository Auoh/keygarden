const test = require("node:test");
const assert = require("node:assert/strict");

const { gardenGrowth, stageBlend, STAGE_COUNT } = require("../src/shared/garden-view");

test("gardenGrowth stays stable when a new seedling joins", () => {
  const before = gardenGrowth([
    { growth: 0.8 },
    { growth: 0.6 },
    { growth: 0.4 },
  ]);
  const after = gardenGrowth([
    { growth: 0.8 },
    { growth: 0.6 },
    { growth: 0.4 },
    { growth: 0.14 },
  ]);
  assert.ok(after < before);
  assert.ok(before - after < 0.08);
  assert.ok(after > 0.5);
});

test("gardenGrowth handles empty and malformed plant lists", () => {
  assert.equal(gardenGrowth([]), 0);
  assert.equal(gardenGrowth(null), 0);
  assert.equal(gardenGrowth([{ growth: "nope" }, { growth: 2 }]), 0.5);
});

test("stageBlend returns a valid crossfade across the whole range", () => {
  for (let step = 0; step <= 100; step += 1) {
    const blend = stageBlend(step / 100, STAGE_COUNT);
    assert.ok(blend.index >= 0 && blend.index < STAGE_COUNT);
    assert.ok(blend.next >= 0 && blend.next < STAGE_COUNT);
    assert.ok(blend.mix >= 0 && blend.mix < 1.0000001);
  }

  assert.deepEqual(stageBlend(0, 5), { index: 0, next: 1, mix: 0, progress: 0 });
  assert.deepEqual(stageBlend(1, 5), { index: 4, next: 4, mix: 0, progress: 4 });
  assert.equal(stageBlend(0.5, 5).index, 2);
  assert.equal(stageBlend(0.5, 5).next, 3);
});

test("stageBlend handles negative and out-of-range growth", () => {
  assert.equal(stageBlend(-2, 5).index, 0);
  assert.equal(stageBlend(9, 5).index, 4);
  assert.equal(stageBlend(0.2, 1).index, 0);
});
