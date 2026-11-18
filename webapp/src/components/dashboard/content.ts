export const FIGURES: Array<{
  src: string;
  caption: string;
  panel?: string;
}> = [
  {
    src: "/figures/fig_canonical.png",
    caption:
      "Canonical Sutton-style 6×9 blocking/shortcut task (ρ=0): completed episodes vs real environment steps for Q-learning (n=0) and Dyna with n=5/20/50 planning backups. The path is blocked at t≈1000 and a shortcut opens at t≈2000 (dashed markers).",
    panel: "sanity",
  },
  {
    src: "/figures/fig_learning_curves.png",
    caption:
      "Blocking scenario, ρ=0.3: rolling success over a window of 8 episodes for all ten methods. The dotted vertical marker denotes the topology change.",
    panel: "results",
  },
  {
    src: "/figures/fig_learning_curves_shortcut_rho0.png",
    caption:
      "Shortcut scenario, ρ=0.0: rolling success (window 8 episodes) across methods; the shortcut opens mid-run.",
    panel: "results",
  },
  {
    src: "/figures/fig_adaptation_bar.png",
    caption:
      "Median post-change adaptation delay (steps) with 95% bootstrap confidence intervals, per method. Left: blocking scenario; right: shortcut scenario. CAVR is highlighted.",
    panel: "results",
  },
  {
    src: "/figures/fig_pareto.png",
    caption:
      "Compute vs adaptation (blocking, ρ=0.3): median post-change adaptation delay against mean planning wall-clock per run (log scale). CAVR sits on the compute-adaptation frontier among the CAVR variants.",
    panel: "results",
  },
  {
    src: "/figures/fig_detector.png",
    caption:
      "Detector behaviour. Left: false alarms per 1000 stationary steps vs true slip ρ (dashed line: G1 budget of 5/1000). Right: mean detection delay on changed runs — CAVR detects a block at ρ=0.3 in ~70 steps vs ~114 for local forgetting at ρ=0.1.",
    panel: "results",
  },
  {
    src: "/figures/fig_belief_heatmap.png",
    caption:
      "Maze seed 1000: learned topology beliefs. Left: true open edges (evaluator view — this panel renders blank in the shipped artifact, a known plotting defect). Right: learned edge-open beliefs b_e from the trained weights.",
    panel: "figures",
  },
];

export const HEADLINE_FINDINGS = [
  {
    title: "47–52% faster adaptation",
    body: "CAVR cuts median post-change adaptation delay by ~47–52% vs the strongest Dyna baseline (local_forgetting) at ρ=0.3, with a paired bootstrap CI excluding zero (research gate G2 verdict: PARTIAL — a credible steady-state success cost remains).",
  },
  {
    title: "False-alarm budget met",
    body: "The calibrated per-(s,a) CUSUM (h=4.0, κ=0.0003) keeps false alarms ≤ 2.7 per 1000 stationary steps at ρ=0.3, within the G1 budget of 5/1000.",
  },
  {
    title: "D* Lite reported honestly",
    body: "D* Lite is stronger still in several regimes (e.g. success 0.73–1.0 across conditions). Per the pre-registered spec it is reported even where it wins; CAVR's advantage is model-based adaptation without a replanning oracle.",
  },
];

export const ARTIFACT_MAP = [
  { label: "Model weights", detail: "artifacts/checkpoints/cavr_trained*.npz (Q, Dirichlet counts, edge beliefs, detector state)" },
  { label: "Metrics / episodes", detail: "artifacts/pilot/metrics.csv, episodes.csv (640 runs)" },
  { label: "Per-step logs", detail: "artifacts/pilot/logs/*.jsonl.gz, artifacts/logs/train_*.jsonl.gz" },
  { label: "Figures", detail: "artifacts/figures/*.png (canonical, curves, adaptation, Pareto, detector, beliefs)" },
  { label: "Tables", detail: "artifacts/tables/summary_*.csv per condition" },
  { label: "Verification", detail: "artifacts/verification/verification_report.{json,md} (V1–V4)" },
  { label: "Training report", detail: "artifacts/training_report.json" },
  { label: "Calibration", detail: "artifacts/pilot/calibration_*.json" },
];
