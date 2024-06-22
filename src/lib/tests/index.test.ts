import { expect, test } from "bun:test";

import { extractBundledFiles } from "..";

const dummy = Bun.file("src/lib/tests/dummy/dummy");
const dummyData = await dummy.arrayBuffer();

test("extractBundledFiles with dummy executable", () => {
  const bundledFiles = extractBundledFiles(dummyData);

  expect(bundledFiles).toHaveLength(2);

  expect(bundledFiles[0].path).toEndWith("/dummy");
  expect(bundledFiles[1].path).toEndWith(".bin");
});
