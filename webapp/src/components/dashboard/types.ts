export type Edge = {
  a: number;
  b: number;
  logit: number;
  p: number;
  passable: boolean;
};

export type ReplayStep = {
  t: number;
  from: number;
  to: number;
  intended: number;
  slip: boolean;
};

export type PhaseMetric = { n_episodes: number; success_rate: number };

export type Checkpoint = {
  name: string;
  mazeSeed: number;
  method: string;
  scenario: string;
  rhoTrue?: number;
  rhoEst: number;
  h: number;
  kappa?: number;
  tFinal: number;
  goal?: number[];
  epiEma?: number;
  G: number;
  nAlarms: number;
  lastAlarmT: number;
  agentCfg?: Record<string, number | string>;
  schedule?: Array<{ t: number; kind: string }>;
  phaseMetrics?: Record<string, PhaseMetric>;
  qStats: { min: number; max: number; mean: number };
  edges?: Edge[];
  q?: number[][];
  actionConvention?: { perm: number[]; greedySteps: number } | null;
  replayMode?: string;
  replay?: {
    start: number;
    goal: number;
    rho: number;
    steps: ReplayStep[];
    reachedGoal: boolean;
    nSteps: number;
    nSlips: number;
  };
  topology?: {
    passableEdges: number;
    blockedEdges: number;
    reachableFromStart: number;
  };
  memorySample?: Record<string, number[]>;
};

export type MethodRow = {
  method: string;
  success: number | null;
  succ_post: number | null;
  delay_med: number | null;
  "delay_censored%": number | null;
  "far/1000": number | null;
  detect_delay: number | null;
  AULC: number | null;
  regret: number | null;
  "backups/step": number | null;
  plan_ms: number | null;
};

export type VerificationResult = {
  checkpoint: string;
  maze_seed: number;
  rho_verify: number;
  schedule: Array<{ t: number; kind: string }>;
  static_success: number;
  adaptation_delay: number;
  adaptation_censored: boolean;
  n_alarms: number;
  changes_total: number;
  predict_max_dev: number;
  symmetry_ok: boolean;
  rolling_curve: Array<{ end: number; rolling: number }>;
  n_episodes?: number;
  robustness_rho03?: unknown;
  gate_v1: boolean;
  gate_v2: boolean;
  gate_v3: boolean;
};

export type CavrData = {
  checkpoints: Record<string, Checkpoint>;
  results: {
    tables: Record<string, MethodRow[]>;
    trainingReport: {
      train_mazes: Array<{
        maze_seed: number;
        checkpoint: string;
        phases: Record<string, PhaseMetric>;
      }>;
      config: Record<string, number>;
      primary_checkpoint: string;
    };
    verification: {
      results: VerificationResult[];
      gate_v4_determinism: boolean;
      all_pass: boolean;
      config: { verify?: { steps?: number; rho?: number }; seed_base?: number };
    };
    calibration: {
      cusum_rows: Array<{ h: number; false_per_1000: number }>;
      chosen_h: number;
      kappa: {
        kappa_grid: Array<{ kappa: number; mean_delay: number }>;
        chosen_kappa: number;
      };
      val_seeds: number[];
    };
    mazes: Array<{
      seed: number;
      split: string;
      H: number;
      W: number;
      braid: number;
      sha256: string;
    }>;
    manifestGenerator: string;
  };
};

export const METHOD_ORDER = [
  "cavr",
  "cavr_fixedB",
  "cavr_nodetector",
  "dstar_lite",
  "dirichlet_dyna",
  "local_forgetting",
  "dyna_q",
  "dyna_q_plus",
  "prioritized_sweeping",
  "q_learning",
];

export const METHODS_TABLE: Array<{
  method: string;
  model: string;
  change: string;
  planning: string;
}> = [
  { method: "q_learning", model: "none", change: "none", planning: "none" },
  { method: "dyna_q", model: "last-outcome", change: "none", planning: "n=20 uniform" },
  { method: "dyna_q_plus", model: "last-outcome + age", change: "age bonus", planning: "n=20 uniform + synthetic" },
  { method: "prioritized_sweeping", model: "last-outcome", change: "none", planning: "heap n=20 + predecessors" },
  { method: "dirichlet_dyna", model: "Dirichlet categorical", change: "none", planning: "n=20 expected backups" },
  { method: "local_forgetting", model: "Dirichlet categorical", change: "CUSUM + local reset", planning: "n=32 uniform" },
  { method: "dstar_lite", model: "edge beliefs (MAP)", change: "Bayes flip + streak rule", planning: "incremental search" },
  { method: "cavr", model: "Dirichlet + edge beliefs", change: "pair-CUSUM + local forgetting", planning: "adaptive budget, counterfactual heap, probes" },
  { method: "cavr_nodetector", model: "as cavr", change: "detector removed", planning: "as cavr" },
  { method: "cavr_fixedB", model: "as cavr", change: "as cavr", planning: "fixed B=32" },
];

export const SCENARIO_LABELS: Record<string, string> = {
  blocking: "Blocking",
  shortcut: "Shortcut",
  static: "Static",
};

export function fmt(
  v: number | null | undefined,
  digits = 3,
): string {
  if (v === null || v === undefined) return "—";
  if (typeof v !== "number" || Number.isNaN(v)) return "—";
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(digits);
}

export function fmtSci(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  if (v === 0) return "0";
  return v.toExponential(2);
}

export function rc(s: number, w = 9): { r: number; c: number } {
  return { r: Math.floor(s / w), c: s % w };
}
