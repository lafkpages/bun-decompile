import { equal, ok } from "node:assert/strict";

import { extractBundledFiles } from "../..";

// TODO: compare bundledFiles with Bun.embeddedFiles

console.debug(process.execPath);

const bundledFiles = extractBundledFiles(await Bun.file(process.execPath).arrayBuffer());

console.debug(bundledFiles, Bun.embeddedFiles);

ok(Bun.embeddedFiles.length === 3);

equal(await Bun.embeddedFiles[0].text(), "hi\n");
equal(await Bun.embeddedFiles[1].text(), "again\n");
equal(await Bun.embeddedFiles[2].text(), "third asset\n");

console.info("Selfcheck passed!");
