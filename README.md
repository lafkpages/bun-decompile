# bun-decompile

[![Build web app, run unit tests and deploy](https://github.com/lafkpages/bun-decompile/actions/workflows/deploy.yml/badge.svg)](https://github.com/lafkpages/bun-decompile/actions/workflows/deploy.yml)
[![Wakatime](https://wakatime.com/badge/github/lafkpages/bun-decompile.svg)](https://wakatime.com/badge/github/lafkpages/bun-decompile)

Extracts the original transpiled sources from an executable file generated via `bun build --compile`.

![screenshot](https://scrapbook-into-the-redwoods.s3.amazonaws.com/f5977575-ecf9-43f3-9837-8c0bf63fc641-image.png)

This can be used both as a library, importing from `src/lib`, or as a web app by running `bun run -b dev`.
The web app is also hosted at https://bun-decompile.surge.sh.
