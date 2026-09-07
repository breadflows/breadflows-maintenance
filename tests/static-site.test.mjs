import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { resolve, join } from "node:path";
import { build } from "esbuild";

const root = resolve(".pages-build");
const catalog = JSON.parse(await readFile("pages-app/src/lib/catalog.json", "utf8"));
async function walk(dir) {
  return (
    await Promise.all(
      (
        await readdir(dir, { withFileTypes: true })
      ).map((e) => (e.isDirectory() ? walk(join(dir, e.name)) : join(dir, e.name))),
    )
  ).flat();
}
const files = await walk(root);
const htmlFiles = files.filter((f) => f.endsWith(".html"));
test("all catalog entries and referenced local media are included", async () => {
  assert.equal(catalog.length, 49);
  assert.equal(new Set(catalog.map((x) => x.id)).size, 49);
  assert.equal(catalog.filter((x) => x.audio).length, 26);
  for (const item of catalog) {
    const html = await readFile(join(root, "release", item.id, "index.html"), "utf8");
    assert.ok(html.includes("https://breadflows.com/release/" + item.id + "/"));
    for (const key of ["audio", "video", "art", "hero"]) {
      if (item[key]?.startsWith("/"))
        assert.ok((await stat(join(root, item[key]))).size > 0, item[key]);
    }
  }
});
test("every rendered local navigation link and asset resolves on a plain static host", async () => {
  const urls = new Set();
  for (const file of htmlFiles) {
    const html = await readFile(file, "utf8");
    for (const m of html.matchAll(/(?:href|src)="(\/[^"\s]*)"/g)) urls.add(m[1]);
  }
  for (const url of urls) {
    const path = new URL(url.replaceAll("&amp;", "&"), "https://breadflows.com").pathname;
    const location = join(root, decodeURIComponent(path));
    const info = await stat(location).catch(() => null);
    assert.ok(info, "Missing static path: " + url);
    if (info.isDirectory()) assert.ok((await stat(join(location, "index.html"))).isFile(), url);
  }
});
test("published pages have no backend forms, login prompts or fake shared comments", async () => {
  for (const file of htmlFiles) {
    const html = await readFile(file, "utf8");
    assert.doesNotMatch(
      html,
      /signin-with-chatgpt|href="\/studio|Post comment|Your brief is in\.|\/api\//,
    );
  }
  const contact = await readFile(join(root, "commission/index.html"), "utf8");
  assert.match(contact, /Open email draft/);
  assert.match(contact, /Nothing is sent until you press/);
  const home = await readFile(join(root, "index.html"), "utf8");
  assert.match(home, /radio\.aiu\.fm\/zen/);
  assert.ok(home.indexOf("<h1>AXIOMORT</h1>") < home.indexOf("<h1>SIGNAL_404</h1>"));
  assert.equal((await readFile(join(root, "CNAME"), "utf8")).trim(), "breadflows.com");
});
test("contact drafts preserve special characters without injecting email recipients", async () => {
  const result = await build({
    entryPoints: ["pages-app/src/lib/contact.ts"],
    bundle: true,
    write: false,
    platform: "node",
    format: "esm",
  });
  const { enquiryMailto } = await import(
    "data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64")
  );
  const uri = new URL(
    enquiryMailto({
      name: "A & B",
      email: "test@example.com",
      brief: "A song?\n&bcc=bad@example.com # hello",
    }),
  );
  assert.equal(uri.pathname, "contact@breadflows.com");
  assert.equal(uri.searchParams.get("bcc"), null);
  assert.equal(uri.searchParams.get("subject"), "Music video enquiry");
  assert.match(uri.searchParams.get("body"), /A & B/);
  assert.match(uri.searchParams.get("body"), /&bcc=bad@example.com # hello/);
});
