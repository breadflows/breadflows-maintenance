import { readdir, cp } from "node:fs/promises";
// Copy only validated build output into the existing main/root Pages publishing source.
// Historical site files remain in Git so the previous release is recoverable.
for (const name of await readdir(".pages-build")) {
  if (["media", "CNAME", ".nojekyll", "favicon.svg"].includes(name)) continue;
  await cp(".pages-build/" + name, name, { recursive: true });
}
console.log("Pages files prepared in repository root. No remote changes made.");
