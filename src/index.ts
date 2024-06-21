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
const modulesData = compiledBinaryData.toString(
  "utf-8",
  modulesStart,
  modulesEnd
);

const modulesMetadataStart = modulesEnd;

interface Module {
  path: string;
  contents: string;
}

const modules: Module[] = [];
let currentOffset = 0;
for (let i = 0; i < modulesPtrLength / 32; i++) {
  const pathLength = compiledBinaryData.readUint32LE(
    modulesMetadataStart + i * 32 + 4
  );
  const contentsLength = compiledBinaryData.readUint32LE(
    modulesMetadataStart + i * 32 + 12
  );

  const path = modulesData.slice(currentOffset, currentOffset + pathLength);
  const contents = modulesData.slice(
    currentOffset + pathLength,
    currentOffset + pathLength + contentsLength
  );

  modules.push({ path, contents });

  currentOffset += pathLength + contentsLength;
}

console.log(modules);
