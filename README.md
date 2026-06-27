# Tilltrend — marketing site

Published source for the **Tilltrend** marketing site, served via GitHub Pages at
**https://gooliverani.github.io/tilltrend-site/**.

Tilltrend is an honest AI analyst for Shopify: every number traces to a governed
metric definition and a replayable receipt.

## What's here

This repo contains only the **served static artifact** — HTML, CSS, and SVG logos.
It is a publish target, not the working copy.

- The site is authored in the private product repo under `site/`, which also holds
  the build tooling (`build_changelog.py`) and the acceptance checks (`check_site.py`)
  that gate every change.
- Updates are pushed here with `site/publish.ps1` from the private repo, so the live
  site always reflects a checked, green build.

Static HTML only — no build step. `.nojekyll` disables Jekyll processing.
