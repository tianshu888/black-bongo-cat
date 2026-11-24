// Frames describe time, vertical offset, roll, vertical stretch, and localized motion.
const rest = [0, 0, 0, 0];

function loop(period, area, frames) {
  return { period, area, frames: [[0, ...rest], ...frames, [1, ...rest]] };
}

function once(area, frames) {
  return { area, frames: [[0, ...rest], ...frames, [1, ...rest]] };
}

const longNap = loop(183, [0.51, 0.51, 0.30, 0.32], [[0.43, 0, 0, 0.021, -0.012], [0.68, 0, 0, 0.007, -0.004]]);
const feeding = loop(29, [0.82, 0.69, 0.17, 0.21], [[0.24, 0.2, 0.012, 0, 0.020], [0.52, 0, -0.010, 0, -0.017], [0.72, 0.2, 0.008, 0, 0.012]]);

const clips = {
  napLeft: longNap,
  napRight: longNap,
  napFlat: loop(165, [0.50, 0.34, 0.32, 0.28], [[0.44, 0, 0, 0.018, -0.014]]),
  loaf: loop(142, [0.54, 0.35, 0.26, 0.25], [[0.41, 0, 0.005, 0.015, -0.013], [0.70, 0, -0.004, 0.007, 0.006]]),
  groom: loop(75, [0.35, 0.38, 0.17, 0.20], [[0.20, 0, -0.017, 0, 0.039], [0.55, 0, 0.018, 0, -0.040], [0.81, 0, -0.013, 0, 0.032]]),
  stretch: once([0.25, 0.74, 0.24, 0.24], [[0.20, 0.5, -0.010, -0.025, 0.017], [0.50, 0.4, -0.016, 0.029, 0.044], [0.75, 0.2, -0.017, 0.017, 0.032]]),
  feedKibble: feeding,
  feedCan: feeding,
  feedChuru: loop(22, [0.56, 0.39, 0.18, 0.21], [[0.31, 0, 0.009, 0, -0.020], [0.60, 0.3, -0.007, 0, 0.019]]),
  playWand: loop(46, [0.19, 0.26, 0.18, 0.20], [[0.24, -1.6, -0.025, 0.011, -0.048], [0.55, 0.8, 0.026, -0.013, 0.039]]),
  playYarn: loop(48, [0.15, 0.69, 0.19, 0.17], [[0.30, 0.1, -0.017, -0.010, 0.035], [0.67, -0.8, 0.013, 0.013, -0.027]]),
  tailChase: loop(55, [0.72, 0.57, 0.21, 0.19], [[0.26, 0.5, 0.034, -0.013, 0.034], [0.58, -0.65, -0.024, 0.008, -0.025]]),
  zoomies: loop(22, [0.21, 0.69, 0.27, 0.27], [[0.26, -5, -0.041, -0.025, -0.042], [0.58, 2, 0.055, 0.025, 0.037], [0.80, -2, -0.025, -0.015, -0.024]]),
  bugHunt: loop(36, [0.73, 0.53, 0.25, 0.25], [[0.25, 0, 0.024, 0.005, -0.033], [0.70, 0, -0.021, -0.012, 0.024]]),
  boxPeek: once([0.51, 0.35, 0.24, 0.28], [[0.08, 0, 0, 0, 0.094], [0.18, 0, 0, 0, -0.034], [0.49, 0, 0, 0, 0.013], [0.80, 0, 0, 0, -0.015], [0.97, 0, 0, 0, 0.090]]),
  somersault: once([0.47, 0.52, 0.25, 0.30], [[0.31, 1, 0, -0.018, 0.016], [0.60, -0.9, 0, 0.022, -0.015]])
};

export function sampleSmokeCatClip(pose, timer, duration) {
  const clip = clips[pose];
  if (!clip) return null;
  const progress = clip.period ? (timer % clip.period) / clip.period : Math.min(1, timer / Math.max(1, duration));
  const index = clip.frames.findIndex(([at]) => at >= progress);
  const from = clip.frames[Math.max(0, index - 1)];
  const to = clip.frames[index];
  const t = from === to ? 0 : (progress - from[0]) / (to[0] - from[0]);
  const smooth = t * t * (3 - 2 * t);
  const [y, roll, stretch, flex] = from.slice(1).map((value, i) => value + (to[i + 1] - value) * smooth);
  return { y, roll, stretch, flex, area: clip.area };
}
