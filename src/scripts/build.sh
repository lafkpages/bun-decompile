#!/usr/bin/env bash
set -eo pipefail

outfileDummy="./src/lib/tests/dummy/dummy"
outfileSelfcheck="./src/lib/tests/selfcheck/selfcheck"

# Build dummy, without specifying --outfile
# because it's broken on older versions of Bun
bun build ./src/lib/tests/dummy/index.ts --compile --minify --sourcemap=inline

# Then move the dummy file to the correct versioned name
if [ -f ./dummy ]; then
    mv ./dummy "$outfileDummy"
elif [ -f "$outfileDummy" ]; then
    :
else
    echo "Dummy file not found" >&2
    exit 1
fi

# Build selfcheck if testing Bun >= 1.1.25
if "$BUN_INSTALL/bin/bun" --eval 'process.exit(+(Bun.semver.order(Bun.env.BUN_VERSION,"1.1.25")===-1))'; then
    bun build ./src/lib/tests/selfcheck/index.ts \
        --compile --minify --sourcemap \
        --outfile "$outfileSelfcheck" \
        ./src/lib/tests/selfcheck/assets/*
fi
