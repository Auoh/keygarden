(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }
  root.GardenView = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const STAGE_COUNT = 5;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * A single 0..1 number for the photo sequence. The garden should feel mature
   * when a few plants are mature, without a new seedling visually resetting the
   * whole scene. Blend the average with the top three plants.
   */
  function gardenGrowth(plants) {
    const values = (Array.isArray(plants) ? plants : [])
      .map((plant) => clamp(Number(plant?.growth) || 0, 0, 1))
      .sort((a, b) => b - a);
    if (!values.length) return 0;
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    const top = values.slice(0, Math.min(3, values.length));
    const topAverage = top.reduce((sum, value) => sum + value, 0) / top.length;
    return clamp(average * 0.55 + topAverage * 0.45, 0, 1);
  }

  function stageBlend(growth, count = STAGE_COUNT) {
    const stages = Math.max(1, Math.floor(count));
    const value = clamp(Number(growth) || 0, 0, 1);
    if (stages === 1) return { index: 0, next: 0, mix: 0, progress: value };
    const scaled = value * (stages - 1);
    const index = Math.min(stages - 1, Math.floor(scaled));
    const next = Math.min(stages - 1, index + 1);
    return {
      index,
      next,
      mix: next === index ? 0 : scaled - index,
      progress: scaled,
    };
  }

  return { STAGE_COUNT, clamp, gardenGrowth, stageBlend };
});
