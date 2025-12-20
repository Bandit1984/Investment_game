# Investment_game

Utilities and data for the Investment Game project.

## mergeRuns.js

Simple Node.js helper to merge `runs/raw/runData-<n>.json` files.

Usage:

node mergeRuns.js 1 2 5-7

This will read the specified raw run files, merge `timer-tick` entries by tick (ascending),
and deduplicate nested object entries (e.g., `stocks` keys). Output is written to
`runs/merged/json/merged-<indices>.json`.
