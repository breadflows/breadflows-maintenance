export type RadioVariant = "compact" | "standard" | "wide";

export function radioVariant(width: number): RadioVariant {
  if (width <= 650) return "compact";
  if (width <= 1024) return "standard";
  return "wide";
}

export function radioEmbedUrl(variant: RadioVariant) {
  const compact = variant === "compact";
  // Phones use device volume; omit the extra outbound control to leave room for track info.
  return `https://radio.aiu.fm/zen?v=${variant}&art=true&vol=${!compact}&info=true&disc=${!compact}`;
}
