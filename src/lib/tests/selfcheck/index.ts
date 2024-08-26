import type { BundledFile } from "../..";

import { equal, ok } from "node:assert/strict";

import { extractBundledFiles } from "../..";

console.log("\n\nSelfcheck!");

console.debug("Selfchecking", process.execPath);

const bundledFiles = extractBundledFiles(await Bun.file(process.execPath).arrayBuffer());

console.debug(bundledFiles, Bun.embeddedFiles);

ok(Bun.embeddedFiles.length === 3);

const decoder = new TextDecoder();

const bundledFilePaths = new Map<string, BundledFile>();
for (const bundledFile of bundledFiles) {
  bundledFilePaths.set(bundledFile.path, bundledFile);
}

for (const embeddedFile of Bun.embeddedFiles) {
  const bundledFile = bundledFilePaths.get(embeddedFile.name);

  // ensure all embedded files are in the bundled files
  ok(bundledFile);

  // ensure file contents match
  equal(decoder.decode(bundledFile.contents), await embeddedFile.text());
}

console.info("Selfcheck passed!");
