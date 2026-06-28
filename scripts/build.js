import { mkdirSync, copyFileSync, rmSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";

const dist = "dist";
const files = [
  "index.html",
  "src/app.js",
  "src/agentRequests.js",
  "src/seedData.js",
  "src/styles.css"
];

rmSync(dist, { recursive: true, force: true });

for (const file of files) {
  const target = join(dist, file);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(file, target);
}

const count = countFiles(dist);
console.log(`Built static admin app in ${dist}/ with ${count} files.`);

function countFiles(root) {
  return readdirSync(root).reduce((total, entry) => {
    const path = join(root, entry);
    const stat = statSync(path);
    return total + (stat.isDirectory() ? countFiles(path) : 1);
  }, 0);
}
