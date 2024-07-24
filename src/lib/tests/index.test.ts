import type { BunFile } from "bun";

import { rm } from "node:fs/promises";

import { $ } from "bun";
import { afterAll, beforeAll, beforeEach, expect, test } from "bun:test";

import {
  extractBundledFiles,
  InvalidExecutableError,
  InvalidTrailerError,
  removeBunfsRootFromPath,
  TotalByteCountMismatchError,
} from "..";
import { BUNFS_ROOT } from "../constants";

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
  const bundledFiles = extractBundledFiles(dummyData, {
    removeBunfsRoot: false,
    removeLeadingSlash: false,
  });

  // There should be exactly three bundled files
  expect(bundledFiles).toHaveLength(3);

  // All files should have a leading slash
  for (const bundledFile of bundledFiles) {
    expect(bundledFile.path).toStartWith("/");
  }

  // All files should start with Bun-fs root
  for (const bundledFile of bundledFiles) {
    expect(bundledFile.path).toStartWith(BUNFS_ROOT);
  }

  // The first file should be the dummy executable itself
  expect(bundledFiles[0].path).toEndWith("/dummy");

  // After that, the rest of the files will be in an unknown order
  // so we'll sort them by path to make the test deterministic
  const restSorted = bundledFiles.slice(1).sort((a, b) => a.path.localeCompare(b.path));
  expect(restSorted[0].path).toMatch(/\/favicon.*\.png$/);
  expect(restSorted[1].path).toMatch(/\/password2.*\.bin$/);
});

test("extractBundledFiles with dummy executable removing leading slash", () => {
  const bundledFiles = extractBundledFiles(dummyData, {
    removeBunfsRoot: false,
    removeLeadingSlash: true,
  });

  // There should be exactly three bundled files
  expect(bundledFiles).toHaveLength(3);

  // No files should have a leading slash
  for (const bundledFile of bundledFiles) {
    expect(bundledFile.path).not.toStartWith("/");
  }

  // All files should start with Bun-fs root
  for (const bundledFile of bundledFiles) {
    expect("/" + bundledFile.path).toStartWith(BUNFS_ROOT);
  }

  // The first file should be the dummy executable itself
  expect(bundledFiles[0].path).toEndWith("/dummy");

  // After that, the rest of the files will be in an unknown order
  // so we'll sort them by path to make the test deterministic
  const restSorted = bundledFiles.slice(1).sort((a, b) => a.path.localeCompare(b.path));
  expect(restSorted[0].path).toMatch(/\/favicon.*\.png$/);
  expect(restSorted[1].path).toMatch(/\/password2.*\.bin$/);
});

test("extractBundledFiles with dummy executable removing Bun-fs root and leading slash", () => {
  const bundledFiles = extractBundledFiles(dummyData, {
    removeBunfsRoot: true,
    removeLeadingSlash: true,
  });

  // There should be exactly three bundled files
  expect(bundledFiles).toHaveLength(3);

  // No files should have a leading slash
  for (const bundledFile of bundledFiles) {
    expect(bundledFile.path).not.toStartWith("/");
  }

  // No files should have Bun-fs root
  for (const bundledFile of bundledFiles) {
    expect(bundledFile.path).not.toContain(BUNFS_ROOT);
  }

  // The first file should be the dummy executable itself
  expect(bundledFiles[0].path).toBe("dummy");

  // After that, the rest of the files will be in an unknown order
  // so we'll sort them by path to make the test deterministic
  const restSorted = bundledFiles.slice(1).sort((a, b) => a.path.localeCompare(b.path));
  expect(restSorted[0].path).toMatch(/^favicon.*\.png$/);
  expect(restSorted[1].path).toMatch(/^password2.*\.bin$/);

  // Trying to remove Bun-fs root from a path should throw, since
  // it has already been removed in extractBundledFiles
  for (const bundledFile of bundledFiles) {
    expect(() => removeBunfsRootFromPath(bundledFile.path)).toThrowError();
  }
});

test("extractBundledFiles with a non-executable", () => {
  // Generate some binary data which is not a Bun-compiled executable
  const nonExecutable = new ArrayBuffer(8);
  const view = new DataView(nonExecutable);
  view.setUint32(0, 0xdeadbeef, true);
  view.setUint32(4, 0xdeadbeef, true);

  expect(() => extractBundledFiles(nonExecutable)).toThrowError(InvalidTrailerError);
});

test("extractBundledFiles with a corrupt executable", () => {
  const view = new DataView(dummyData);

  // Corrupt the total byte count (last 8 bytes)
  view.setUint32(dummyData.byteLength - 8, 0xdeadbeef, true);

  expect(() => extractBundledFiles(dummyData)).toThrowError(TotalByteCountMismatchError);
});

afterAll(async () => {
  await rm(dummy.name!);
});
