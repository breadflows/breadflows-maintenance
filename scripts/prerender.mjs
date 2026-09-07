import { build } from "esbuild";
import { readFile, writeFile, mkdir, cp } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
await mkdir(".pages-tools", { recursive: true });
await build({
  entryPoints: ["pages-app/src/entry-server.tsx"],
  outfile: ".pages-tools/render.mjs",
  bundle: true,
  packages: "external",
  platform: "node",
  format: "esm",
  jsx: "automatic",
  alias: { "@": resolve("pages-app/src") },
});
const { render, pages, pageMetadata } = await import(
  pathToFileURL(resolve(".pages-tools/render.mjs"))
);
const template = await readFile(".pages-build/index.html", "utf8");
const escape = (s) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
function html(path) {
  const m = pageMetadata(path),
    canonical = "https://breadflows.com" + (path === "/" ? "/" : path + "/");
  return template
    .replace(/<title>.*?<\/title>/s, "<title>" + escape(m.title) + "</title>")
    .replace(
      "</head>",
      `<meta name="description" content="${escape(m.description)}"><link rel="canonical" href="${canonical}"><meta property="og:title" content="${escape(m.title)}"><meta property="og:description" content="${escape(m.description)}"><meta property="og:image" content="${escape(new URL(m.art, canonical).href)}"><meta property="og:url" content="${canonical}"></head>`,
    )
    .replace("<!--app-html-->", render(path));
}
for (const path of pages) {
  const dir = ".pages-build" + (path === "/" ? "" : path);
  await mkdir(dir, { recursive: true });
  await writeFile(dir + "/index.html", html(path));
}
await writeFile(
  ".pages-build/404.html",
  html("/not-found").replace("</head>", '<meta name="robots" content="noindex"></head>'),
);
const redirects = {
  "/partners": "/collection/collaborations/",
  "/collection/hollow-idolz": "/collection/collaborations/",
  "/collection/roy-thigpen": "/collection/collaborations/",
  "/collection/monarch-ai-illuminations": "/collection/collaborations/",
};
for (const [from, to] of Object.entries(redirects)) {
  await mkdir(".pages-build" + from, { recursive: true });
  await writeFile(
    ".pages-build" + from + "/index.html",
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${to}"><link rel="canonical" href="https://breadflows.com${to}"><title>Collaborations | BreadFlows</title></head><body><a href="${to}">Explore Collaborations</a></body></html>`,
  );
}
await writeFile(
  ".pages-build/sitemap.xml",
  '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    pages
      .filter((p) => p !== "/search")
      .map((p) => "<url><loc>https://breadflows.com" + (p === "/" ? "/" : p + "/") + "</loc></url>")
      .join("") +
    "</urlset>",
);
await writeFile(
  ".pages-build/robots.txt",
  "User-agent: *\nAllow: /\nDisallow: /pages-app/\nDisallow: /scripts/\nDisallow: /tests/\nDisallow: /archive/\nSitemap: https://breadflows.com/sitemap.xml\n",
);
for (const asset of ["media", "favicon.svg", "CNAME", ".nojekyll"])
  await cp(asset, ".pages-build/" + asset, { recursive: true });
console.log(
  `Built ${pages.length} real HTML pages, legacy redirects, sitemap and complete media assets.`,
);
