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
