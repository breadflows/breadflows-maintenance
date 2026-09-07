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
test("radio selects compact, stacked and wide embeds at the device breakpoints", async () => {
  const result = await build({
    entryPoints: ["pages-app/src/lib/radio-embed.ts"],
    bundle: true,
    write: false,
    platform: "node",
    format: "esm",
  });
  const { radioVariant, radioEmbedUrl } = await import(
    "data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64")
  );
  for (const width of [320, 390, 650]) assert.equal(radioVariant(width), "compact");
  for (const width of [651, 768, 1024]) assert.equal(radioVariant(width), "standard");
  for (const width of [1025, 1440, 1920]) assert.equal(radioVariant(width), "wide");
  const phone = new URL(radioEmbedUrl("compact"));
  assert.equal(phone.searchParams.get("info"), "true");
  assert.equal(phone.searchParams.get("vol"), "false");
  assert.equal(
    radioEmbedUrl("wide"),
    "https://radio.aiu.fm/zen?v=wide&art=true&vol=true&info=true&disc=true",
  );
  const home = await readFile(join(root, "index.html"), "utf8");
  assert.equal((home.match(/title="AIU.FM radio player"/g) || []).length, 1);
  assert.match(home, /data-radio-variant="compact"/);
});
test("all catalog entries and referenced local media are included", async () => {
  assert.equal(new Set(catalog.map((x) => x.id)).size, catalog.length);
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
test("verified releases appear in music and the soundtrack keeps its complete track list", async () => {
  const audit = JSON.parse(await readFile("tests/release-audit.json", "utf8"));
  const music = await readFile(join(root, "music/index.html"), "utf8");
  const home = await readFile(join(root, "index.html"), "utf8");
  const watch = await readFile(join(root, "watch/index.html"), "utf8");
  for (const id of audit.releaseIds) {
    assert.ok(
      catalog.some((x) => x.id === id),
      id,
    );
    assert.ok(music.includes('href="/release/' + id + '"'), id + " missing from Music");
    assert.ok(
      home.includes('href="/release/' + id + '"'),
      id + " missing from homepage music shelf",
    );
    assert.ok(!watch.includes('href="/release/' + id + '"'), id + " incorrectly listed as a video");
  }
  const album = await readFile(join(root, "release/axiomort-soundtrack/index.html"), "utf8");
  assert.match(album, /18 tracks/);
  assert.deepEqual(
    catalog.filter((x) => x.albumId === "axiomort-soundtrack").map((x) => x.id),
    audit.albumTrackIds,
  );
  for (const id of audit.albumTrackIds) assert.ok(album.includes('href="/release/' + id + '"'), id);
  for (const item of catalog.filter(
    (x) => (x.kind === "album" || x.kind === "track") && !x.audio,
  )) {
    assert.match(item.spotifyUrl, /^https:\/\/open\.spotify\.com\/(album|track)\/[A-Za-z0-9]{22}$/);
    const page = await readFile(join(root, "release", item.id, "index.html"), "utf8");
    assert.match(page, /Open Spotify player/);
    assert.doesNotMatch(page, />Play track</);
  }
});
test("SIGNAL_404 keeps teasers and intros outside its numbered episode sequence", async () => {
  const extras = ["project-the-rift-teaser", "breadflows-studio-signal-intro-53-sync-anomaly"];
  const episodes = catalog
    .filter((x) => x.collection === "SIGNAL_404" && x.episode)
    .sort((a, b) => a.episode - b.episode);
  assert.deepEqual(
    episodes.map((x) => x.episode),
    Array.from({ length: 14 }, (_, i) => i + 1),
  );
  assert.equal(episodes[0].id, "ink-of-infinity-zavion-sylvara-s-celestial-verse");
  const page = await readFile(join(root, "collection/signal404/index.html"), "utf8");
  const episodeSection = page.split('id="episodes"')[1].split("</section>")[0];
  const extraSection = page.split('id="extras"')[1].split("</section>")[0];
  assert.match(page, /14<!-- --> <!-- -->episodes/);
  assert.ok(page.includes('href="/release/' + episodes[0].id + '?play=1"'));
  for (const id of extras) {
    const item = catalog.find((x) => x.id === id);
    assert.ok(item.extraType);
    assert.equal(item.episode, undefined);
    assert.ok(!episodeSection.includes('href="/release/' + id + '"'));
    assert.ok(extraSection.includes('href="/release/' + id + '"'));
    const detail = await readFile(join(root, "release", id, "index.html"), "utf8");
    assert.doesNotMatch(detail, /EPISODE|Episode <!--|Next <!-- -->episode/);
  }
  assert.doesNotMatch(extraSection, /EPISODE/);
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
test("published pages have no removed account controls or fake shared comments", async () => {
  for (const file of htmlFiles) {
    const html = await readFile(file, "utf8");
    assert.doesNotMatch(
      html,
      /signin-with-chatgpt|href="\/studio|Post comment|Your brief is in\.|\/api\//,
    );
  }
  const contact = await readFile(join(root, "commission/index.html"), "utf8");
  assert.match(contact, /Send enquiry/);
  assert.doesNotMatch(contact, /Open email draft|Nothing is sent until you press/);
  const home = await readFile(join(root, "index.html"), "utf8");
  assert.match(home, /radio\.aiu\.fm\/zen/);
  assert.ok(home.indexOf("<h1>AXIOMORT</h1>") < home.indexOf("<h1>SIGNAL_404</h1>"));
  assert.equal((await readFile(join(root, "CNAME"), "utf8")).trim(), "breadflows.com");
});
test("enquiries send all fields to a fixed destination and never accept failed delivery as success", async () => {
  const result = await build({
    entryPoints: ["pages-app/src/lib/contact.ts"],
    bundle: true,
    write: false,
    platform: "node",
    format: "esm",
  });
  const { enquiryPayload, sendEnquiry, enquiryEndpoint } = await import(
    "data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64")
  );
  const data = {
    name: "A & B",
    email: "visitor@example.com",
    track: "https://example.com/track?a=1&b=2",
    brief: "A song?\n&bcc=bad@example.com",
    budget: "To discuss",
    deadline: "October",
    references: "https://example.com/reference",
    _cc: "bad@example.com",
    _subject: "override",
  };
  const payload = enquiryPayload(data);
  assert.equal(enquiryEndpoint, "https://formsubmit.co/ajax/contact@breadflows.com");
  assert.equal(payload.name, data.name);
  assert.equal(payload.email, data.email);
  assert.equal(payload["Track link"], data.track);
  assert.equal(payload["What do you have in mind?"], data.brief);
  assert.equal(payload.Budget, data.budget);
  assert.equal(payload.Timeline, data.deadline);
  assert.equal(payload.References, data.references);
  assert.equal(payload._cc, undefined);
  assert.notEqual(payload._subject, "override");
  await sendEnquiry(data, async (url, options) => {
    assert.equal(url, enquiryEndpoint);
    assert.equal(options.method, "POST");
    assert.deepEqual(JSON.parse(options.body), payload);
    return new Response(
      JSON.stringify({ success: "true", message: "The form was submitted successfully." }),
      { status: 200 },
    );
  });
  for (const [status, body, expected] of [
    [
      200,
      { success: "false", message: "Please activate your email." },
      /awaiting email activation/,
    ],
    [
      200,
      { success: "true", message: "Check your email for confirmation" },
      /awaiting email activation/,
    ],
    [200, { success: "false" }, /could not be submitted/],
    [500, { success: "true" }, /could not be submitted/],
  ])
    await assert.rejects(
      () => sendEnquiry(data, async () => new Response(JSON.stringify(body), { status })),
      expected,
    );
  await assert.rejects(
    () =>
      sendEnquiry(data, async () => {
        throw new TypeError("Network failure");
      }),
    /couldn't confirm/,
  );
  await assert.rejects(
    () => sendEnquiry(data, async () => new Response("<html>Unavailable</html>")),
    /couldn't confirm/,
  );
  await assert.rejects(
    () =>
      sendEnquiry({ ...data, website: "spam" }, async () => {
        assert.fail("Honeypot must not be submitted");
      }),
    /fill in/,
  );
});
