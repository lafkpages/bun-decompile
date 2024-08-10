/// <reference path="../imports.d.ts" />

import favicon from "../../../../static/favicon.png";
import rawPasswordOne from "./password1.txt";
import rawPasswordTwo from "./password2.bin";

// rawPasswordOne is configured in bunfig.toml to
// be loaded as text, so it should be bundled into
// the binary as a string.

// rawPasswordTwo is configured to be loaded as a file,
// so it should be included as a separate file in
// the binary bundle.

const password = rawPasswordOne.trim() + (await Bun.file(rawPasswordTwo).text()).trim();

// This comment is a test
// ^ I wanted to see if comments get included in the compiled binary

for await (const guess of console) {
  if (guess === password) {
    console.log("Access granted");
    break;
  }
  console.log("Access denied");
}

// Print something about the favicon so that it's included in the bundle
const faviconFile = Bun.file(favicon);
console.log("Favicon is", faviconFile.size, "bytes");

// This below is an attempt to fool getExecutableVersion. If it returns fakeversion,
// then we have successfully fooled it, which means getExecutableVersion should be
// updated.
const fakeVersion = `----- bun meta -----
Bun vfakeversion1 (abcdefgh):`;
fakeVersion.trim(); // prevent dead code elimination
await import("./fakeversion.bin");
