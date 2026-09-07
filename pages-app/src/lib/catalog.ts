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
};
export const catalog = source as Release[];
export function safeExternal(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}
