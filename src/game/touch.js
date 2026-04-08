export function createTouchPressState(evt, {
  delayMs = 300,
  schedule = setTimeout,
  onLongPress,
} = {}) {
  const state = { evt, timerId: null };
  state.timerId = schedule(() => {
    state.timerId = null;
    onLongPress?.(evt);
  }, delayMs);
  return state;
}

export function finishTouchPress(state, {
  clear = clearTimeout,
  onTap,
} = {}) {
  if (!state) return false;
  if (state.timerId !== null) clear(state.timerId);
  onTap?.(state.evt);
  return true;
}
