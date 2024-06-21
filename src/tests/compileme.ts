import rawPasswordOne from "./password1.txt";
import rawPasswordTwo from "./password2.bin";

const password =
  rawPasswordOne.trim() + (await Bun.file(rawPasswordTwo).text()).trim();

// This comment is a test
// ^ I wanted to see if comments get included in the compiled binary

for await (const guess of console) {
  if (guess === password) {
    console.log("Access granted");
    break;
  }
  console.log("Access denied");
}
