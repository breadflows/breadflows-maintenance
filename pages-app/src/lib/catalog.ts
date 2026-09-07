import source from "./catalog.json";
export type Release = {
  id: string;
  title: string;
  subtitle?: string;
  kind: string;
  creator: string;
  collection: string;
  art: string;
  hero?: string;
  audio?: string;
  video?: string;
  youtubeId?: string;
  previewStart?: number;
  description: string;
  year?: string;
  status?: string;
  trackId?: string | null;
  partnerId?: string;
  featured?: boolean;
  spotifyUrl?: string;
  genres?: string[];
  director?: string;
  collaborators?: string[];
  episode?: number;
  extraType?: "Teaser" | "Studio intro";
  releaseDate?: string;
  albumId?: string;
  trackNumber?: number;
  durationMs?: number;
  importedFrom?: "youtube" | "spotify";
  spotifyAlbumId?: string;
};
export const catalog = source as Release[];
export const isMusic = (item: Release) => item.kind === "track" || item.kind === "album";
export const musicReleases = (items: Release[]) =>
  items.filter((item) => isMusic(item) && !item.albumId);
export const newestFirst = (a: Release, b: Release) =>
  (b.releaseDate || b.year || "").localeCompare(a.releaseDate || a.year || "");
export function spotifyEmbedUrl(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (
      url.origin !== "https://open.spotify.com" ||
      !/^\/(album|track)\/[A-Za-z0-9]{22}$/.test(url.pathname)
    )
      return null;
    return "https://open.spotify.com/embed" + url.pathname + "?theme=0";
  } catch {
    return null;
  }
}
export function safeExternal(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}
