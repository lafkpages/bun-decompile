import { BUN_TRAILER } from "./constants";

export interface BundledFile {
  path: string;
  contents: ArrayBuffer;
}

const corruptionMessage = ", either the binary is corrupted or it's not an executable file generated by `bun build --compile`."

export class InvalidTrailerError extends Error {
	constructor() {
		
		super(
			"Invalid trailer" + corruptionMessage,
		);

		this.name = "InvalidTrailerError";
  }
}

export class BotalByteCountMismatchError extends Error {
	constructor() {
		
		super(
			"Total byte count mismatch" + corruptionMessage,
		);

		this.name = "TotalByteCountMismatchError";
  }
}

export function extractBundledFiles(compiledBinaryData: DataView | ArrayBuffer) {
  if (compiledBinaryData instanceof ArrayBuffer) {
    compiledBinaryData = new DataView(compiledBinaryData);
  }

  const decoder = new TextDecoder();

  // Note: reverse engineering
  // bun/src/StandaloneModuleGraph.zig/StandaloneModuleGraph/toBytes

  // Check that the executable has the right trailer
  const trailer = decoder.decode(
    compiledBinaryData.buffer.slice(
      compiledBinaryData.byteLength - 8 - BUN_TRAILER.length,
      compiledBinaryData.byteLength - 8,
    ),
  );
  if (trailer !== BUN_TRAILER) {
    throw new InvalidTrailerError();
  }

  const totalByteCount = compiledBinaryData.getUint32(compiledBinaryData.byteLength - 8, true);
  if (compiledBinaryData.byteLength !== totalByteCount) {
    throw new BotalByteCountMismatchError();
  }

  const offsetByteCount = compiledBinaryData.getUint32(compiledBinaryData.byteLength - 48, true);

  // Not sure what this is for
  const entrypointId = compiledBinaryData.getUint32(compiledBinaryData.byteLength - 44, true);

  const modulesPtrOffset = compiledBinaryData.getUint32(compiledBinaryData.byteLength - 40, true);

  const modulesPtrLength = compiledBinaryData.getUint32(compiledBinaryData.byteLength - 36, true);

  const modulesStart = compiledBinaryData.byteLength - (offsetByteCount + 48);
  const modulesEnd = modulesStart + modulesPtrOffset;
  const modulesData = compiledBinaryData.buffer.slice(modulesStart, modulesEnd);

  const modulesMetadataStart = modulesEnd;

  const bundledFiles: BundledFile[] = [];
  let currentOffset = 0;
  for (let i = 0; i < modulesPtrLength / 32; i++) {
    const modulesMetadataOffset = modulesMetadataStart + i * 32;
    const pathLength = compiledBinaryData.getUint32(modulesMetadataOffset + 4, true);
    const contentsLength = compiledBinaryData.getUint32(modulesMetadataOffset + 12, true);

    const path = decoder.decode(modulesData.slice(currentOffset, currentOffset + pathLength));
    const contents = modulesData.slice(
      currentOffset + pathLength,
      currentOffset + pathLength + contentsLength,
    );

    bundledFiles.push({ path, contents });

    currentOffset += pathLength + contentsLength;
  }

  return bundledFiles;
}
