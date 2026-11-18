# CAVR-Dyna — Integrated Delivery Package

This package combines the original **CAVR-Dyna** RL research artifacts with a fully
integrated **web frontend**, a **presentation deck**, and a completed **technical
report**, all cross-verified against the artifacts.

## Contents

| Path | What it is |
| --- | --- |
| `cavr-dyna/` | The original RL project artifacts, unmodified (README, checkpoints `.npz`, figures, tables, logs, verification and training reports, mazes manifest) |
| `webapp/` | The integrated Next.js 16 frontend (source only, no `node_modules`) |
| `presentation-slides/` | Editable HTML source of each deck slide (1280x720) |
| `CAVR-Dyna-Presentation.pptx` | The 16-slide presentation deck (exported from the HTML sources) |
| `CAVR-Dyna-Project-Report.docx` | The completed technical report (editable Word) |
| `CAVR-Dyna-Project-Report.pdf` | PDF export of the report |

## The web application

A Next.js 16 (App Router, TypeScript, Tailwind 4) console for the research project:

1. **Nexus Gateway login** — the provided `GatewayFlow` animated component, integrated
   as a real auth gate. The iframe posts credentials to the host via `postMessage`;
   any non-empty Operative ID / Security Key is accepted (demo mode). "Maintain
   persistent uplink" controls localStorage vs sessionStorage. Guest Node / Observer
   buttons provide one-click access.
2. **Dashboard** (single `/` route, client-side tabs):
   - *Overview* — headline findings, baseline matrix, artifact map, training curriculum
   - *Results* — per-condition tables (8 conditions x 10 methods) with real numbers from
     `artifacts/tables/summary_*.csv`, plus the key figures
   - *Figures* — all seven artifact figures with accurate captions
   - *Verification* — V1-V4 held-out gates, per-maze table, training report, calibration grids
   - *Checkpoints* — inspector for the five `.npz` files (meta, phase metrics, agent config,
     state-value heatmap, believed topology)
   - *Maze Replay* — the believed maze (MAP edge posterior derived from the checkpoint),
     state-value heatmap, and an animated greedy rollout under slip rho=0.1
3. **API** — `GET /api/cavr/data` serves the artifact dataset converted by the pipeline below.

## Running the webapp

```bash
cd webapp
bun install          # or: npm install
python3 scripts/prepare_data.py   # regenerate data/cavr/*.json from the artifacts (needs numpy)
bun run dev          # or: npm run dev  ->  http://localhost:3000
```

`scripts/prepare_data.py` reads `cavr-dyna/artifacts/` (adjust the `SRC` path at the top
of the script if you move the folder) and writes `webapp/data/cavr/*.json`, plus copies
figures into `webapp/public/figures/`.

## Data pipeline provenance (no fabricated numbers)

- `data/cavr/checkpoints.json` — parsed from `artifacts/checkpoints/*.npz`
  (Q tables, edge beliefs, detector state, agent config, phase metrics, schedule).
  The believed maze and the replay trajectory are derived from the checkpoint's
  edge beliefs and Q table; two cells unreachable under MAP beliefs are reported as-is.
- `data/cavr/results.json` — parsed from `artifacts/tables/summary_*.csv`,
  `training_report.json`, `verification_report.json`, `calibration_summary.json`,
  `mazes_manifest.json`.
- Dashboard, deck, and report all read the same parsed data; every metric shown
  (e.g. 47-52% delay reduction, FAR budget, V1-V4 PASS, 640 runs) comes from the
  executed runs in the artifacts.

## End-to-end verification performed

- Lint clean (`eslint`), dev server clean (`dev.log` scanned — no runtime errors).
- Browser E2E (agent-browser): login gate renders with full animation; empty-credential
  validation error; login via form and via Observer button; all six tabs render real
  API data; replay animates (36-step rollout, live telemetry); disconnect returns to the
  gate and clears storage; mobile (390x844) layout verified.
- Report: `postcheck` 0 errors; TOC placeholders inserted (update fields in Word for
  exact page numbers); page-by-page visual inspection of the PDF export.
- Deck: exported via HTML->PPTX pipeline; layout overflow check clean (2 benign
  decorative-bounds notices on the cover).

## Items to fill in (intentional placeholders)

- Report title page: `Student Name` and `University Name` are placeholders — replace
  them with the actual author and institution before submission.
- The requirements listing in the report (`Listing 2`) pins the versions as tested in
  the delivery environment; re-pin if you target a different environment.

## License / attribution

Code and generated artifacts: MIT (see `cavr-dyna/README.md` for attribution of the
design blueprint and the inspired-by literature).
