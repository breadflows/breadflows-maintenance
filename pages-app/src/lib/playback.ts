const positions = new Map<string, number>();
export function safePlaybackTime(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(86400, Math.max(0, n)) : 0;
}
export function rememberPlayback(id: string, seconds: number) {
  positions.set(id, safePlaybackTime(seconds));
}
export const playbackPosition = (id: string) => positions.get(id) || 0;
export const playbackHref = (id: string) =>
  "/release/" + encodeURIComponent(id) + "?play=1&start=" + Math.floor(playbackPosition(id));
