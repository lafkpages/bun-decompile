import type { BunFile } from "bun";

import { rm } from "node:fs/promises";

import { $ } from "bun";
import { afterAll, beforeAll, beforeEach, expect, test } from "bun:test";

import {
  extractBundledFiles,
  InvalidTrailerError,
  removeBunfsRootFromPath,
  TotalByteCountMismatchError,
} from "..";

let dummy: BunFile;
let dummyData: ArrayBuffer;

beforeAll(async () => {
  // Run the Bun bundler to compile the dummy executable
  await $`bun build src/lib/tests/dummy/index.ts --compile --outfile src/lib/tests/dummy/dummy`;

  // Get a reference to the dummy executable file
  dummy = Bun.file("src/lib/tests/dummy/dummy");
});

beforeEach(async () => {
  // Re-read the executable data from the file before each test
  dummyData = await dummy.arrayBuffer();
});

test("extractBundledFiles with dummy executable", () => {
  const bundledFiles = extractBundledFiles(dummyData);

  expect(bundledFiles).toHaveLength(3);

  // The first file should be the dummy executable itself
  expect(bundledFiles[0].path).toEndWith("/dummy");

  // After that, the rest of the files will be in an unknown order
  // so we'll sort them by path to make the test deterministic
  const restSorted = bundledFiles.slice(1).sort((a, b) => a.path.localeCompare(b.path));
  expect(restSorted[0].path).toMatch(/favicon.*\.png$/);
  expect(restSorted[1].path).toMatch(/password2.*\.bin$/);

  // Simple tests for removeBunfsRootFromPath
  expect(removeBunfsRootFromPath(restSorted[0].path)).toMatch(/^\/favicon.*\.png$/);
  expect(removeBunfsRootFromPath(restSorted[1].path)).toMatch(/^\/password2.*\.bin$/);
});

test("extractBundledFiles with a non-executable should throw InvalidTrailerError", () => {
  // Generate some binary data which is not a Bun-compiled executable
  const nonExecutable = new ArrayBuffer(8);
  const view = new DataView(nonExecutable);
  view.setUint32(0, 0xdeadbeef, true);
  view.setUint32(4, 0xdeadbeef, true);

  expect(() => extractBundledFiles(nonExecutable)).toThrowError(InvalidTrailerError);
});

test("extractBundledFiles with a corrupt executable should throw TotalByteCountMismatchError", () => {
  const view = new DataView(dummyData);

  // Corrupt the total byte count (last 8 bytes)
  view.setUint32(dummyData.byteLength - 8, 0xdeadbeef, true);

  expect(() => extractBundledFiles(dummyData)).toThrowError(TotalByteCountMismatchError);
});

afterAll(async () => {
  await rm(dummy.name!);
});
