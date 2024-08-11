#!/usr/bin/env bash

set -eo pipefail

outfile="./src/lib/tests/dummy/dummy"

cleanup() {
    # Remove the dummy file
    rm "$outfile"
}

trap cleanup EXIT

# Build dummy, without specifying --outfile
# because it's broken on older versions of Bun
bun build ./src/lib/tests/dummy/index.ts --compile --minify --sourcemap=inline

# Then move the dummy file to the correct versioned name
if [ -f ./dummy ]; then
    mv ./dummy "$outfile"
elif [ -f "$outfile" ]; then
    :
else
    echo "Dummy file not found" >&2
    exit 1
fi

# Run the dummy tests, using Bun v1.1.22
export DUMMY_VERSION="$BUN_VERSION"
"$BUN_INSTALL/bin/bun" test
