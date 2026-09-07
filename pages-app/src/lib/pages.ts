import { catalog } from "./catalog";
import { collections } from "./collections";
const titles: Record<string, string> = {
  "/": "BreadFlows — Music. Film. Other worlds.",
  "/music": "Music",
  "/watch": "Films & videos",
  "/search": "Search",
  "/radio": "AIU.FM Radio",
  "/shop": "The shop",
  "/shop/merch": "Merch",
  "/shop/physical": "CDs & vinyl",
  "/commission": "Commission a music video",
  "/about": "About & privacy",
};
export const pages = [
  ...Object.keys(titles),
  "/axiomort",
  ...collections.map((c) => "/collection/" + c.id),
  ...catalog.map((x) => "/release/" + x.id),
];
export function pageMetadata(path: string) {
  const item = catalog.find((x) => path === "/release/" + x.id);
  const collection = collections.find(
    (x) => path === "/collection/" + x.id || (path === "/axiomort" && x.id === "axiomort"),
  );
  const name = item
    ? [item.title, item.subtitle].filter(Boolean).join(" — ")
    : collection?.title || titles[path] || "Page not found";
  return {
    title: path === "/" ? name : name + " | BreadFlows",
    description:
      item?.description ||
      collection?.description ||
      "Original music, films and collaborations by BreadFlows. Watch, listen and explore.",
    art: item?.hero || item?.art || collection?.art || "/media/art/axiomort-portal-rift.jpg",
  };
}
