import assert from "node:assert/strict";
import { BUN_TRAILER } from "./constants";

const compiledBinary = Bun.file("dist/compileme");
const compiledBinaryData = Buffer.from(await compiledBinary.arrayBuffer());

// Note: reverse engineering
// bun/src/StandaloneModuleGraph.zig/StandaloneModuleGraph/toBytes

const totalByteCount = compiledBinaryData.readUint32LE(
  compiledBinaryData.length - 8
);
assert.equal(
  compiledBinaryData.length,
  totalByteCount,
  "Total byte count mismatch"
);

const offsetByteCount = compiledBinaryData.readUint32LE(
  compiledBinaryData.length - 48
);
const entrypointId = compiledBinaryData.readUint32LE(
  compiledBinaryData.length - 44
);

const modulesPtrOffset = compiledBinaryData.readUint32LE(
  compiledBinaryData.length - 40
);

const modulesPtrLength = compiledBinaryData.readUint32LE(
  compiledBinaryData.length - 36
);

// Check that the executable has the right trailer
const trailer = compiledBinaryData.toString(
  "utf-8",
  compiledBinaryData.length - 8 - BUN_TRAILER.length,
  compiledBinaryData.length - 8
);
assert.equal(trailer, BUN_TRAILER, "Invalid trailer");

const modulesStart = compiledBinaryData.length - (offsetByteCount + 48);
const modulesEnd = modulesStart + modulesPtrOffset;
const modulesData = compiledBinaryData.subarray(modulesStart, modulesEnd);

const modulesMetadataStart = modulesEnd;

interface Module {
  path: string;
  contents: Buffer;
}

const modules: Module[] = [];
let currentOffset = 0;
for (let i = 0; i < modulesPtrLength / 32; i++) {
  const modulesMetadataOffset = modulesMetadataStart + i * 32;
  const pathLength = compiledBinaryData.readUint32LE(modulesMetadataOffset + 4);
  const contentsLength = compiledBinaryData.readUint32LE(
    modulesMetadataOffset + 12
  );

  const path = modulesData.toString(
    "utf-8",
    currentOffset,
    currentOffset + pathLength
  );
  const contents = modulesData.subarray(
    currentOffset + pathLength,
    currentOffset + pathLength + contentsLength
  );

  modules.push({ path, contents });

  currentOffset += pathLength + contentsLength;
}

console.log(modules);
