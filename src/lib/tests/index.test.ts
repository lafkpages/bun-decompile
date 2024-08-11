import type { BunFile } from "bun";

import { beforeAll, beforeEach, describe, expect, test } from "bun:test";

import {
  extractBundledFiles,
  getExecutableVersion,
  InvalidExecutableError,
  InvalidTrailerError,
  TotalByteCountMismatchError,
} from "..";

let dummy: BunFile;
let dummyData: ArrayBuffer;

let notAnExecutable: ArrayBuffer;

const expectedVersion = process.env.DUMMY_VERSION;

if (!expectedVersion) {
  throw new Error("$DUMMY_VERSION is not set");
}

beforeAll(async () => {
  // Get a reference to the dummy executable file
  dummy = Bun.file("src/lib/tests/dummy/dummy");

  // Generate some binary data which is not a Bun-compiled executable
  notAnExecutable = new ArrayBuffer(8);
  const view = new DataView(notAnExecutable);
  view.setUint32(0, 0xdeadbeef, true);
  view.setUint32(4, 0xdeadbeef, true);
});

beforeEach(async () => {
  // Re-read the executable data from the file before each test
  dummyData = await dummy.arrayBuffer();
});

describe("extractBundledFiles", () => {
  test("with dummy executable", () => {
    const bundledFiles = extractBundledFiles(dummyData);

    // There should be exactly four bundled files
    expect(bundledFiles).toHaveLength(4);

    // All file paths should not have slashes
    for (const bundledFile of bundledFiles) {
      expect(bundledFile.path).not.toInclude("/");
    }

    // The first file should be the entrypoint
    expect(bundledFiles[0].path).toBe("index.js");

    // After that, the rest of the files will be in an unknown order
    // so we'll sort them by path to make the test deterministic
    const restSorted = bundledFiles.slice(1).sort((a, b) => a.path.localeCompare(b.path));
    expect(restSorted[0].path).toMatch(/^fakeversion.*\.bin$/);
    expect(restSorted[1].path).toMatch(/^favicon.*\.png$/);
    expect(restSorted[2].path).toMatch(/^password2.*\.bin$/);
  });

  test("with a non-executable", () => {
    expect(() => extractBundledFiles(notAnExecutable)).toThrowError(InvalidTrailerError);
  });

  test("with a corrupt executable", () => {
    const view = new DataView(dummyData);

    // Corrupt the total byte count (last 8 bytes)
    view.setUint32(dummyData.byteLength - 8, 0xdeadbeef, true);

    expect(() => extractBundledFiles(dummyData)).toThrowError(TotalByteCountMismatchError);
  });
});

describe("getExecutableVersion", () => {
  test("with dummy executable", () => {
    const version = getExecutableVersion(dummyData);

    // The version of Bun in the executable should be the same as the current runtime,
    // as we call Bun build earlier with this same instance of Bun (supposedly)

    // Use a RegEx to allow for canary versions (eg. 1.1.22-canary.96)
    expect(version.version).toMatch(new RegExp(`^${expectedVersion}(-.+)?$`));
  });

  test("with current runtime", async () => {
    const runtimePath = Bun.which(process.argv0);

    expect(runtimePath).toBeString();

    const runtimeExecutable = Bun.file(runtimePath!);
    const runtimeExecutableData = await runtimeExecutable.arrayBuffer();

    const version = getExecutableVersion(runtimeExecutableData);

    // The versions should be equal as we are comparing to the current runtime
    expect(version.version).toMatch(new RegExp(`^${Bun.version}(-.+)?$`));
  });

  test("with a non-executable", () => {
    expect(() => getExecutableVersion(notAnExecutable)).toThrowError(InvalidExecutableError);
  });
});
