const contactDelay = 72;
const recoveryDuration = 110;
const rest = { dx: 0, dy: 0, rot: 0, squash: 0 };

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const mix = (from, to, amount) => from + (to - from) * amount;

function interpolatePaw(from, to, amount) {
  const progress = clamp(amount, 0, 1);
  const eased = progress * progress * (3 - 2 * progress);
  return {
    dx: mix(from.dx, to.dx, eased), dy: mix(from.dy, to.dy, eased),
    rot: mix(from.rot, to.rot, eased), squash: mix(from.squash, to.squash, eased)
  };
}

function getPawPose(tap, now) {
  if (!tap) return rest;
  if (now < tap.liftAt) {
    return interpolatePaw(tap.start, tap.lift, (now - tap.startAt) / (tap.liftAt - tap.startAt));
  }
  if (now < tap.contactAt) {
    return interpolatePaw(tap.lift, tap.contact, (now - tap.liftAt) / (tap.contactAt - tap.liftAt));
  }
  return interpolatePaw(tap.contact, rest, (now - tap.contactAt) / recoveryDuration);
}

export function createSmokeCatTyping() {
  const taps = [null, null];
  const pendingContacts = [];
  const eye = { x: 0, y: 0 };
  const head = { x: 0, y: 0, roll: 0 };
  let previousTime = null;
  let focus = null;

  function registerContact(tap) {
    tap.hit = true;
    pendingContacts.push(tap);
  }

  function press({ now, keyboardX, row, viewerLeft, repeat, space, key, reach }) {
    const index = viewerLeft ? 0 : 1;
    const previous = taps[index];
    if (previous && !previous.hit && now >= previous.contactAt) registerContact(previous);
    const across = (clamp(keyboardX, -1, 1) + 1) / 2;
    const depth = 1 - clamp(row / 4, 0, 1);
    const start = getPawPose(previous, now);
    const sign = viewerLeft ? -1 : 1;
    const dx = clamp(reach?.x ?? (across - (viewerLeft ? 0.34 : 0.65)) * 0.29, -0.15, 0.15);
    const dy = clamp(reach?.y ?? depth * 0.048, -0.066, 0.094);
    const contactAt = previous && !previous.hit
      ? Math.max(now + 1, previous.contactAt)
      : now + contactDelay;

    taps[index] = {
      key, repeat, space, startAt: now, liftAt: now + (contactAt - now) * 0.46, contactAt,
      start, hit: false,
      lift: { dx: dx * 0.72, dy: clamp(start.dy - 0.022, -0.115, -0.076), rot: sign * 0.105, squash: -0.08 },
      contact: { dx, dy, rot: sign * -0.025, squash: 0.38 }
    };
    // Preserve the head's lead delay during a run of consecutive keystrokes.
    const headAt = focus && now - focus.at < 335 ? focus.headAt : now + 22;
    focus = { across, depth, at: now, headAt };
  }

  function sample(now, enabled) {
    const dt = Math.min(65, Math.max(0, now - (previousTime ?? now - 16)));
    previousTime = now;
    if (!enabled) {
      taps.fill(null);
      pendingContacts.length = 0;
      focus = null;
    }

    for (let i = 0; i < taps.length; i++) {
      const tap = taps[i];
      if (!tap) continue;
      if (!tap.hit && now >= tap.contactAt) registerContact(tap);
      if (now - tap.contactAt >= recoveryDuration) taps[i] = null;
    }

    const active = Boolean(focus && now - focus.at < 335);
    const gaze = active ? focus : null;
    const eyeWeight = 1 - Math.exp(-dt / (active ? 21 : 115));
    const headWeight = 1 - Math.exp(-dt / (active ? 85 : 155));
    eye.x = mix(eye.x, gaze ? clamp((gaze.across - 0.50) * 2.0, -1, 1) : 0, eyeWeight);
    eye.y = mix(eye.y, gaze ? 0.47 + gaze.depth * 0.38 : 0, eyeWeight);
    if (!active || now >= focus.headAt) {
      head.x = mix(head.x, gaze ? (gaze.across - 0.50) * 0.050 : 0, headWeight);
      head.y = mix(head.y, gaze ? 0.011 + gaze.depth * 0.009 : 0, headWeight);
      head.roll = mix(head.roll, gaze ? (gaze.across - 0.50) * 0.093 : 0, headWeight);
    }

    return {
      current: active || taps.some(Boolean),
      left: getPawPose(taps[0], now), right: getPawPose(taps[1], now), eye, head, contacts: pendingContacts.splice(0)
    };
  }

  return { press, sample };
}
