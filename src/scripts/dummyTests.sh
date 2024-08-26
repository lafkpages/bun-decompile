#!/usr/bin/env bash
set -eo pipefail

cleanup() {
    # Remove the dummy file
    rm -f "$outfileDummy" "$outfileSelfcheck"
}

trap cleanup EXIT

# Build the dummy script
source ./src/scripts/build.sh

# Run the dummy tests, using a static version of Bun
export DUMMY_VERSION="$BUN_VERSION"
"$BUN_INSTALL/bin/bun" test

# Run the selfcheck tests
if [ -f "$outfileSelfcheck" ]; then
    "$outfileSelfcheck"
fi
