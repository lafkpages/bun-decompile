#!/usr/bin/env bash
set -eo pipefail

cleanup() {
    # Remove the dummy file
    rm -f "$outfile"
}

trap cleanup EXIT

# Build the dummy script
source ./src/scripts/buildDummy.sh

# Run the dummy tests, using Bun v1.1.22
export DUMMY_VERSION="$BUN_VERSION"
"$BUN_INSTALL/bin/bun" test
