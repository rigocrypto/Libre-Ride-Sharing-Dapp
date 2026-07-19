import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "client/src";
const ALLOWED_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const DIRECT_API_FETCH = /fetch\s*\(\s*(["'`])\/?api\//g;

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const fullPath = join(dir, name);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      walk(fullPath, files);
      continue;
    }

    if (name.includes(".test.") || name.includes(".spec.")) {
      continue;
    }

    const extension = name.slice(name.lastIndexOf("."));
    if (ALLOWED_EXTENSIONS.has(extension)) {
      files.push(fullPath);
    }
  }

  return files;
}

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\s)\/\/.*$/gm, "$1");
}

const offenders = [];

for (const filePath of walk(ROOT)) {
  const content = stripComments(readFileSync(filePath, "utf8"));
  let match;
  while ((match = DIRECT_API_FETCH.exec(content)) !== null) {
    offenders.push(filePath);
    break;
  }
}

if (offenders.length > 0) {
  console.error("Found direct fetch('/api/...') calls. Use apiRequest or resolveApiUrl instead:");
  for (const filePath of offenders) {
    console.error(`- ${filePath}`);
  }
  process.exit(1);
}

console.log("No direct fetch('/api/...') calls found in client/src runtime code.");
