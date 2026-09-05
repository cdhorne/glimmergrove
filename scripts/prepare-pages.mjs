import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const cwd = process.cwd();
const dest = join(cwd, "dist-pages");

const candidates = [
  join(cwd, ".output/public"),
  join(cwd, "dist"),
  join(cwd, ".vercel/output/static"),
];

const src = candidates.find((dir) => existsSync(dir));
if (!src) {
  console.error("[pages] no static output found. Looked in:", candidates.join(", "));
  process.exit(1);
}

mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });

const indexCandidates = ["index.html", "_shell.html", "index/index.html"];
let indexFile = indexCandidates.map((f) => join(dest, f)).find((f) => existsSync(f));
if (!indexFile) {
  const html = readdirSync(dest).filter((f) => f.endsWith(".html"));
  indexFile = html[0] ? join(dest, html[0]) : null;
}
if (!indexFile) {
  console.error("[pages] no HTML shell in", src);
  process.exit(1);
}

if (indexFile !== join(dest, "index.html")) {
  copyFileSync(indexFile, join(dest, "index.html"));
}
copyFileSync(join(dest, "index.html"), join(dest, "404.html"));
writeFileSync(join(dest, ".nojekyll"), "");

console.log("[pages] prepared", dest, "from", src);
