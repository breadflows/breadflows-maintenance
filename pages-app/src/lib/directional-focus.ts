export type FocusRect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};
export function directionalTarget(from: FocusRect, candidates: FocusRect[], key: string): number {
  const horizontal = key === "ArrowLeft" || key === "ArrowRight";
  const sign = key === "ArrowRight" || key === "ArrowDown" ? 1 : -1;
  const x = (from.left + from.right) / 2;
  const y = (from.top + from.bottom) / 2;
  let best = -1,
    score = Infinity;
  candidates.forEach((to, index) => {
    const dx = (to.left + to.right) / 2 - x;
    const dy = (to.top + to.bottom) / 2 - y;
    const forward = (horizontal ? dx : dy) * sign;
    if (forward <= 1) return;
    const lateral = Math.abs(horizontal ? dy : dx);
    const rank = forward + lateral * 4;
    if (rank < score) {
      score = rank;
      best = index;
    }
  });
  return best;
}
