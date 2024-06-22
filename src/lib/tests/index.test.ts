import { expect, test } from "bun:test";

import { extractBundledFiles, InvalidTrailerError, TotalByteCountMismatchError } from "..";

const dummy = Bun.file("src/lib/tests/dummy/dummy");
const dummyData = await dummy.arrayBuffer();

test("extractBundledFiles with dummy executable", () => {
  const bundledFiles = extractBundledFiles(dummyData);

  expect(bundledFiles).toHaveLength(2);

  expect(bundledFiles[0].path).toEndWith("/dummy");
  expect(bundledFiles[1].path).toEndWith(".bin");
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
