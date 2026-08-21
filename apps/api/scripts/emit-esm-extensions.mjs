import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const distDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
const specifierPattern = /(?<=(?:from\s+|import\s*\(\s*|import\s+))(['"])(\.\.?\/[^'"]+)\1/g;
const hasRuntimeExtension = /\.(?:js|mjs|cjs|json|node)$/;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath);
      continue;
    }
    if (!entry.name.endsWith(".js")) {
      continue;
    }
    const source = await readFile(fullPath, "utf8");
    const next = source.replace(specifierPattern, (match, quote, specifier) => {
      if (hasRuntimeExtension.test(specifier)) {
        return match;
      }
      return `${quote}${specifier}.js${quote}`;
    });
    if (next !== source) {
      await writeFile(fullPath, next);
    }
  }
}

await walk(distDir);
