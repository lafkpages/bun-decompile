import { expect, test } from "bun:test";

import { extractBundledFiles, InvalidTrailerError, TotalByteCountMismatchError } from "..";

const dummy = Bun.file("src/lib/tests/dummy/dummy");
const dummyData = await dummy.arrayBuffer();

test("extractBundledFiles with dummy executable", () => {
  const bundledFiles = extractBundledFiles(dummyData);

  expect(bundledFiles).toHaveLength(3);

  // The first file should be the dummy executable itself
  expect(bundledFiles[0].path).toEndWith("/dummy");

  // After that, the rest of the files will be in an unknown order
  // so we'll sort them by path to make the test deterministic
  const restSorted = bundledFiles.slice(1).sort((a, b) => a.path.localeCompare(b.path));

  expect(restSorted[0].path).toEndWith(".png");
  expect(restSorted[1].path).toEndWith(".bin");
});

test("extractBundledFiles with a non-executable should throw InvalidTrailerError", () => {
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
