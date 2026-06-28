import { readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const roots = ["src", "scripts", "tests"];
const files = roots.flatMap((root) => collectJsFiles(root));
const forbidden = [
  ["patient", "name"].join("_"),
  ["date", "of", "birth"].join("_"),
  ["s", "s", "n"].join(""),
  ["aad", "haar"].join("")
];
let failed = false;

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8"
  });

  if (result.status !== 0) {
    failed = true;
    process.stderr.write(result.stderr || result.stdout);
  }
}

for (const file of files) {
  const source = await import("node:fs").then((fs) => fs.readFileSync(file, "utf8"));
  for (const term of forbidden) {
    if (source.toLowerCase().includes(term)) {
      failed = true;
      process.stderr.write(`${file}: contains forbidden demo-data term "${term}"\n`);
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log(`Checked ${files.length} JavaScript files.`);

function collectJsFiles(root) {
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) return collectJsFiles(path);
    return path.endsWith(".js") ? [path] : [];
  });
}
