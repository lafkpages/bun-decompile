import { $ } from "bun";

await $`bun build ./src/lib/tests/dummy/index.ts --compile --minify --sourcemap --outfile ./src/lib/tests/dummy/dummy-v${Bun.version}`;
