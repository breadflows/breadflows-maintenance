import type { Release } from "./catalog";
export type Collection = {
  id: string;
  title: string;
  label: string;
  description: string;
  trailerId?: string;
  art: string;
  genres: string[];
  credit: string;
  match: (x: Release) => boolean;
};
export const collections: Collection[] = [
  {
    id: "signal404",
    title: "SIGNAL_404",
    label: "DIMENSIONAL EXTRACTS",
    description:
      "A collection of transmissions from other worlds. Enter The Rift, follow the signal, and explore each story as an episode.",
    trailerId: "project-the-rift-teaser",
    art: "https://i.ytimg.com/vi/dU2hEtOd5bg/hqdefault.jpg",
    genres: ["Sci-fi", "Music videos", "Anthology"],
    credit: "Created by BreadFlows",
    match: (x) => x.collection === "SIGNAL_404" && x.kind !== "track",
  },
  {
    id: "axiomort",
    title: "AXIOMORT",
    label: "A BREADFLOWS ORIGINAL",
    description:
      "A Dublin attic. A portal. Worlds inside a black lion. A first look at the universe of AXIOMORT.",
    trailerId: "axiomort-teaser-one",
    art: "/media/art/axiomort-portal-rift.jpg",
    genres: ["Sci-fi", "Fantasy", "Teaser"],
    credit: "Created by BreadFlows",
    match: (x) => x.collection === "AXIOMORT" && (x.kind === "film" || x.kind === "video"),
  },
  {
    id: "collaborations",
    title: "Collaborations",
    label: "A BREADFLOWS SERIES",
    description:
      "Music videos and stories made together. Featuring Hollow Idolz, Roy Thigpen and Monarch’s AI Illuminations.",
    art: "https://i.ytimg.com/vi/gOlBsgPE7s8/hqdefault.jpg",
    genres: ["Music videos", "Collaborations"],
    credit: "BreadFlows & collaborators",
    match: (x) =>
      (x.kind === "film" || x.kind === "video") &&
      (!!x.collaborators?.length || x.collection === "Collaborations"),
  },
];
export const collectionHref = (id: string) =>
  id === "axiomort" ? "/axiomort" : "/collection/" + id;
export function collectionItems(c: Collection, items: Release[]) {
  return items
    .filter((x) => c.match(x) && !x.extraType)
    .sort((a, b) => (a.episode || 999) - (b.episode || 999));
}
export function collectionExtras(c: Collection, items: Release[]) {
  return items.filter((x) => c.match(x) && !!x.extraType);
}
export function releaseCollection(item: Release) {
  return collections.find((c) => c.match(item));
}
