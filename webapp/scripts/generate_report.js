/* CAVR-Dyna project report — main assembly (uses report_lib.js builders). */
const L = require("./report_lib");
const {
  Document, Packer, Paragraph, TextRun, PageBreak, Footer, PageNumber,
  NumberFormat, AlignmentType, TableOfContents, SectionType,
  OoxmlMath, MathRun, MathFraction, MathSubScript, MathSuperScript,
  MathSubSuperScript, MathSum, MathRadical,
  TNR, BLACK, BODY, PAGE, LINE, R, ROOT, OUT,
  body, bodyRuns, h1, h2, h3, figure, tabCaption, dataTable, eqRow,
  codeBlock, refPara, spacer, fmtN,
} = L;
const fs = require("fs");
const path = require("path");

const FIG = (n) => path.join(ROOT, "public/figures", n);
const REP = (n) => path.join(ROOT, "data/cavr/figures_report", n);
const SHOT = (n) => path.join(ROOT, "data/cavr/screenshots", n);

/* ================= FRONT MATTER ================= */
const front = [];

// Title block (article style, template-following — no cover recipe)
front.push(new Paragraph({ alignment: AlignmentType.CENTER,
  spacing: { before: 600, after: 120, line: 480, lineRule: "atLeast" },
  children: [new TextRun({ text: "CAVR-Dyna: Change-Aware Stochastic Model-Based Reinforcement Learning for Dynamic Mazes", bold: true, size: 36, font: TNR, color: BLACK })] }));
front.push(new Paragraph({ alignment: AlignmentType.CENTER,
  spacing: { after: 360, line: LINE },
  children: [new TextRun({ text: "Deliverables, Software Components, and Analytical Metrics of a Final-Year Reinforcement Learning Project", size: 24, font: TNR, color: BLACK })] }));
front.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60, line: LINE },
  children: [new TextRun({ text: "Student Name", size: BODY, font: TNR, color: BLACK })] }));
front.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60, line: LINE },
  children: [new TextRun({ text: "Department of Computer Science", size: BODY, font: TNR, color: BLACK })] }));
front.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60, line: LINE },
  children: [new TextRun({ text: "University Name", size: BODY, font: TNR, color: BLACK })] }));
front.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 480, line: LINE },
  children: [new TextRun({ text: "November 2026", size: BODY, font: TNR, color: BLACK })] }));

// Abstract
front.push(new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true,
  spacing: { before: 240, after: 240, line: LINE },
  children: [new TextRun({ text: "Abstract", bold: true, size: 32, font: TNR, color: BLACK })] }));
const abstractText = "This report documents CAVR-Dyna (Counterfactual, Aleatoric-aware, Value-of-computation-driven Repair), a change-aware stochastic model-based reinforcement learning method for navigation in dynamic grid mazes, together with the complete set of deliverables, software components, and analytical metrics of the project. The agent extends the classical Dyna architecture with five mechanisms: a categorical Dirichlet transition model and a factored edge-belief map that remain calibrated under action slip; a two-level CUSUM change detector computed on the frozen pre-update prediction; a repair operator that combines local forgetting with goal-counterfactual prioritized expected backups through an epoch-versioned priority heap; a value-of-computation-style arbiter that selects the planning backup budget from the set {0, 8, 16, 32, 64}; and a nonzero exploration floor that keeps hidden shortcuts discoverable. The implementation covers CAVR-Dyna, two CAVR ablations, and eight baselines, evaluated on procedural 9x9 mazes across blocking, shortcut, and static scenarios at slip levels of 0, 0.1, and 0.3, for a total of 640 pilot runs. At the harshest slip level, CAVR-Dyna reduces median post-change adaptation delay by 47-52% relative to the strongest Dyna baseline while keeping false alarms within the calibrated budget of 5 per 1000 stationary steps; D* Lite remains stronger in several regimes and is reported as measured. Trained checkpoints were re-verified end to end on held-out change schedules with all four verification gates passing (V1-V4). The report also describes the reproducibility package, the 41-case test suite, and the integrated demonstration console.";
front.push(body(abstractText, { noIndent: true, after: 240 }));

// Contents
front.push(new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true,
  spacing: { before: 480, after: 360, line: LINE },
  children: [new TextRun({ text: "Contents", bold: true, size: 32, font: TNR, color: BLACK })] }));
front.push(new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }));
front.push(new Paragraph({ spacing: { before: 200 },
  children: [new TextRun({
    text: "Note: This Table of Contents is generated via field codes. To ensure page number accuracy after editing, please right-click the TOC and select \"Update Field.\"",
    size: 18, color: "888888", font: TNR })] }));

/* ================= BODY ================= */
const c = [];

/* ---- 1 Project Overview ---- */
c.push(h1("1  Project Overview"));
c.push(h2("1.1  Problem Statement"));
c.push(body("The project addresses sequential decision-making in a non-stationary grid world, formulated as a Markov Decision Process (MDP) M = \u27E8S, A, P, R, \u03B3\u27E9, where S is the state space (the 81 cells of a 9x9 maze), A is a four-action action space, P(s\u2032 | s, a) are the transition dynamics, R(s, a, s\u2032) is the reward function, and \u03B3 \u2208 [0, 1) is the discount factor. Unlike a textbook MDP, two complications are enforced by the evaluation environment. First, actions slip: with probability 1 \u2212 \u03C1 the intended move is executed, and with probability \u03C1 the agent is displaced to a uniformly random passable neighbour, so the transition kernel is stochastic even in a stationary world. Second, the maze topology changes during operation: edges are blocked, or hidden shortcuts are opened, at times chosen by the evaluator and invisible to the agent (a leak guard guarantees that the change schedule and the true walls are never exposed; the agent observes only (s, a, r, s\u2032) tuples)."));
c.push(body("Classical Dyna-style agents [1], [2] interleave model learning with planned backups and are highly sample-efficient in stationary mazes, but they implicitly assume that the learned model remains valid. When the world changes, stale synthetic experience is precisely wrong in the region that changed, and adaptation delay explodes; empirically, methods without change handling require hundreds of extra steps to recover after a blocking event. The problem this project studies is therefore: how should a model-based agent detect that its model is wrong, repair only what is needed, and spend its planning compute where it matters, while remaining robust to action slip and keeping exploration alive for hidden shortcuts?"));
c.push(h2("1.2  Objectives"));
c.push(body("The project pursued five objectives. O1: implement CAVR-Dyna together with a family of comparison methods covering the relevant design space, namely Q-learning, Dyna-Q, Dyna-Q+, prioritized sweeping [3], stochastic Dirichlet Dyna, local-forgetting Dyna, and D* Lite [4], plus two CAVR ablations (detector removed, budget fixed). O2: provide a reproducible training and evaluation pipeline in which every maze, seed, configuration, and change schedule is fixed by manifest and content hash. O3: quantify performance with standardized, censoring-aware metrics, including adaptation delay, false-alarm rate, area under the learning curve, and regret, and attach paired bootstrap confidence intervals to headline claims [6]. O4: deliver a documented, tested, and version-controlled codebase, including a 41-case pytest suite covering environment contracts, model mathematics, detector behaviour, budget caps, and checkpoint round trips. O5: verify trained checkpoints end to end on held-out data with pre-registered gates (V1-V4) rather than curated examples."));
c.push(body("The method is a hypothesis evaluated empirically: the pre-registered analysis plan requires publishing baselines even where they win, and reporting steady-state costs alongside adaptation gains. This framing is carried through every table and figure in this report."));

/* ---- 2 Tangible Deliverables ---- */
c.push(h1("2  Tangible Deliverables"));
c.push(body("Table 1 summarizes the tangible deliverables of the project together with the concrete artifact in the repository that satisfies each one. All artifacts are produced by scripts in the repository; none were manually curated."));
c.push(tabCaption("Table 1: Summary of project deliverables and their concrete artifacts"));
c.push(dataTable({
  widths: [8, 26, 66],
  numAlignFrom: 99,
  header: ["ID", "Deliverable", "Description and artifact"],
  rows: [
    ["D1", "Source code repository", "src/cavr package (envs, models, agents, planning, evaluation, utils) plus scripts for manifest, pilot, training, verification, plotting, and reporting"],
    ["D2", "Trained model checkpoints", "artifacts/checkpoints/cavr_trained*.npz (five curriculum checkpoints; Q table, Dirichlet counts, edge beliefs, detector state) and per-run pilot checkpoints"],
    ["D3", "Evaluation report", "artifacts/pilot/metrics.csv and episodes.csv (640 runs), eight figures, and per-condition summary tables for all eight scenario-slip conditions"],
    ["D4", "Technical report", "This document (editable Word source and PDF export) and the presentation deck"],
    ["D5", "Reproducibility package", "configs/pilot.yaml and configs/final.yaml, data/manifests/mazes_manifest.json with SHA256 per maze, fixed seeds {0, 1, 2, 3}"],
    ["D6", "Demonstration", "Integrated web console: gateway login, artifact dashboard, and animated maze replay driven by the trained checkpoint"],
    ["D7", "Unit and integration tests", "41 pytest cases: environment contract, model math, CUSUM false-alarm stress, budget caps, stale-heap versions, leakage guards, determinism, checkpoint round trip"],
  ],
}));
c.push(body("The checkpoint format deserves a note because it carries the entire agent state: each .npz file stores the Q table (81 x 4), Dirichlet outcome counts and reward statistics (81 x 4 x 5), the epoch counter, the factored edge-belief map over the 144 grid edges, per-pair CUSUM accumulators, and the full agent configuration, which is what allows the held-out verification of Section 5 to reload weights and reproduce behaviour bit for bit.", { noIndent: false }));

/* ---- 3 Software Components ---- */
c.push(h1("3  Software Components"));
c.push(h2("3.1  System Architecture"));
c.push(body("The codebase is organized as a layered research pipeline, illustrated in Figure 1. The environment layer generates procedural mazes (randomized depth-first spanning trees with braiding factor 0.15) and applies change scenarios on hidden schedules. The model layer maintains the agent's world model: a categorical Dirichlet transition model over per-(s, a) outcomes, a factored edge-belief map over grid edges, and a two-level CUSUM detector [5] that watches the frozen pre-update prediction for distributional drift. The agent layer implements the CAVR repair policy; the planning layer realizes the value-of-computation idea with an epoch-versioned priority heap and a backup-budget arbiter; and the evaluation layer runs the experiment grid, computes censoring-aware metrics, and enforces the held-out verification gates."));
c.push(...figure(REP("fig_architecture.png"), "Figure 1: High-level software architecture of the CAVR-Dyna pipeline", 580));
c.push(h2("3.2  Module Inventory"));
c.push(body("Table 2 lists the software modules and their responsibilities. Every module has a dedicated test module; the tests directory mirrors the source layout."));
c.push(tabCaption("Table 2: Software modules and responsibilities"));
c.push(dataTable({
  widths: [22, 26, 52],
  numAlignFrom: 99,
  header: ["Module", "Location", "Responsibility"],
  rows: [
    ["Environments", "envs/", "Private-map grid environment with slip dynamics and leak guard; procedural maze generation; change scenarios (blocking, shortcut, static)"],
    ["Models", "models/", "Categorical Dirichlet transition model; factored edge-belief map; episodic map; two-level CUSUM change detector"],
    ["Agents", "agents/", "Q-learning, Dyna-Q, Dyna-Q+, prioritized sweeping, stochastic Dirichlet Dyna, local-forgetting Dyna, D* Lite, CAVR-Dyna and ablations"],
    ["Planning", "planning/", "Epoch-versioned predecessor heap; goal-counterfactual backup values; probe schedule; backup-budget arbiter; D* Lite search"],
    ["Evaluation", "evaluation/", "Runner, censoring-aware metrics, paired bootstrap statistics, oracles, detector calibration"],
    ["Utils", "utils/", "Seeding, JSONL.gz logging, checkpoint serialization"],
    ["Tests", "tests/", "41 unit and integration tests mirroring the source layout"],
  ],
}));
c.push(h2("3.3  Core Algorithm Skeleton"));
c.push(body("Listing 1 shows the training loop that is shared by all model-based methods, with the CAVR-specific steps annotated. The four numbered actions inside the observation step are the essence of the method: the detector always sees the prediction computed before the model update (rule: never let the update hide its own drift), repair touches only the affected region, and the budget arbiter decides how much planning the current uncertainty level deserves."));
c.push(tabCaption("Listing 1: Training loop of CAVR-Dyna (CAVR-specific steps annotated)"));
c.push(codeBlock([
  "for episode in range(num_episodes):",
  "    state = env.reset(seed=seed)               # private map; schedule hidden",
  "    done = False",
  "    while not done:",
  "        action = agent.select_action(state)    # epsilon-floor policy",
  "        next_state, reward, terminated, truncated, _ = env.step(action)",
  "        done = terminated or truncated",
  "",
  "        agent.observe(state, action, reward, next_state, done)",
  "        # 1) CUSUM test on the FROZEN pre-update prediction",
  "        # 2) on alarm: local forgetting (epoch bump) + counterfactual heap pushes",
  "        # 3) VoC arbiter chooses backup budget B in {0, 8, 16, 32, 64}",
  "        # 4) run expected backups through the epoch-versioned heap;",
  "        #    fire real-action probe if uncertainty exceeds theta_probe",
  "",
  "        state = next_state",
  "",
  "    metrics = evaluator.evaluate(agent, n_episodes=eval_episodes)",
  "    logger.log_episode(episode, metrics)",
  "    if episode % checkpoint_freq == 0:",
  "        agent.save(f\"checkpoints/{agent.name}_{episode}.npz\")",
]));
c.push(spacer(120));
c.push(h2("3.4  Dependencies and Reproducibility"));
c.push(body("All experiments are CPU-only and tabular; no GPU or deep-learning framework is required. Listing 2 shows the environment specification as tested in the delivery environment. Reproducibility is anchored in three mechanisms: procedural mazes are generated from fixed seeds and pinned by SHA256 content hashes in the manifest (train seeds 1000-1003, validation seeds 1004-1007); every run configuration (slip level, scenario, detector thresholds, budget policy) is fixed by a YAML config; and all stochastic streams are seeded deterministically, which the V4 gate re-checks by re-running reloaded weights."));
c.push(tabCaption("Listing 2: Environment specification (requirements, as tested)"));
c.push(codeBlock([
  "# requirements.txt (excerpt, as tested in the delivery environment)",
  "numpy==2.1.3",
  "matplotlib==3.9.2",
  "pyyaml==6.0.3",
  "pytest==9.0.2",
]));
c.push(spacer(120));

/* ---- 4 Analytical Metrics ---- */
c.push(h1("4  Analytical Metrics"));
c.push(h2("4.1  Primary Performance Metrics"));
c.push(body("Table 3 defines the metrics used across all experiments. Two properties are deliberate: adaptation delay is censoring-aware (an episode that never recovers is recorded as censored rather than silently averaged away), and planning cost is reported in both learning units (backups per step) and wall-clock milliseconds so that adaptation gains can be read against their compute price [6]."));
c.push(tabCaption("Table 3: Evaluation metrics and definitions"));
c.push(dataTable({
  widths: [24, 56, 20],
  numAlignFrom: 99,
  header: ["Metric", "Definition", "Symbol"],
  rows: [
    ["Success rate", "Fraction of evaluation episodes that reach the goal", "SR"],
    ["Post-change success", "Success rate restricted to episodes after the change event", "SR-post"],
    ["Adaptation delay", "Steps from the change event until rolling success recovers (median across runs; censored runs excluded and reported separately)", "D-med"],
    ["Censored delay share", "Percentage of runs that never recover within the episode budget", "Cens %"],
    ["False-alarm rate", "Detector alarms per 1000 stationary steps in unchanged runs", "FAR"],
    ["Detection delay", "Steps between a true change and the first matching alarm", "T-detect"],
    ["AULC", "Normalized area under the rolling-success learning curve", "AULC"],
    ["Regret", "Cumulative reward shortfall relative to a reference policy (negative values indicate the reference is outperformed)", "Reg"],
    ["Backups per step", "Planning backups executed per environment step (learning cost)", "B"],
    ["Planning wall-clock", "Mean planning time per run in milliseconds (compute cost)", "t-plan"],
  ],
}));
c.push(h2("4.2  Formal Definitions"));
c.push(body("The action-slip kernel of the environment assigns to the intended successor s + \u0394(a) probability 1 \u2212 \u03C1 and spreads the remaining mass uniformly over the passable neighbour set N(s):"));
c.push(eqRow([
  new MathRun("P(s\u2032 | s, a) = (1 \u2212 \u03C1) \u00B7 "),
  new MathSubScript({ children: [new MathRun("1")], subScript: [new MathRun("s\u2032=s+\u0394(a)")] }),
  new MathRun(" + "),
  new MathFraction({ numerator: [new MathRun("\u03C1")], denominator: [new MathRun("|N(s)|")] }),
  new MathSubScript({ children: [new MathRun("1")], subScript: [new MathRun("s\u2032\u2208N(s)")] }),
], 1));
c.push(body("The undiscounted return of an episode i is the sum of its discounted rewards, and the average return over N evaluation episodes is", { noIndent: true }));
c.push(eqRow([
  new MathRun("\u0112 = "),
  new MathFraction({ numerator: [new MathRun("1")], denominator: [new MathRun("N")] }),
  new MathSubSuperScript({ children: [new MathSum({ children: [new MathRun("\u2211")] })], subScript: [new MathRun("i=1")], superScript: [new MathRun("N")] }),
  new MathSubSuperScript({ children: [new MathSum({ children: [new MathRun("\u2211")] })], subScript: [new MathRun("t=0")], superScript: [new MathSubScript({ children: [new MathRun("T")], subScript: [new MathRun("i")] })] }),
  new MathSuperScript({ children: [new MathRun("\u03B3")], superScript: [new MathRun("t")] }),
  new MathSubScript({ children: [new MathRun("r")], subScript: [new MathRun("i,t")] }),
], 2));
c.push(body("The adaptation delay after a change at step t-c is the first time the rolling success estimate s-t (a windowed mean over the eight most recent episodes) reaches a recovery threshold \u03B8; episodes that never reach it are censored:", { noIndent: true }));
c.push(eqRow([
  new MathRun("D = inf { t \u2265 "),
  new MathSubScript({ children: [new MathRun("t")], subScript: [new MathRun("c")] }),
  new MathRun(" : "),
  new MathSubScript({ children: [new MathRun("s\u0302")], subScript: [new MathRun("t")] }),
  new MathRun(" \u2265 \u03B8 } \u2212 "),
  new MathSubScript({ children: [new MathRun("t")], subScript: [new MathRun("c")] }),
], 3));
c.push(body("The false-alarm rate on stationary runs and the normalized area under the learning curve are", { noIndent: true }));
c.push(eqRow([
  new MathRun("FAR = 1000 \u00B7 "),
  new MathFraction({ numerator: [new MathSubScript({ children: [new MathRun("N")], subScript: [new MathRun("fa")] })], denominator: [new MathSubScript({ children: [new MathRun("T")], subScript: [new MathRun("stat")] })] }),
  new MathRun(" ,      AULC = "),
  new MathFraction({ numerator: [new MathRun("1")], denominator: [new MathRun("T \u2212 T\u2032 + 1")] }),
  new MathSubSuperScript({ children: [new MathSum({ children: [new MathRun("\u2211")] })], subScript: [new MathRun("t=T\u2032")], superScript: [new MathRun("T")] }),
  new MathSubScript({ children: [new MathRun("s\u0302")], subScript: [new MathRun("t")] }),
], 4));
c.push(body("Finally, headline comparisons attach 95% confidence intervals computed over the M = 8 map/seed pairs with the paired bootstrap; with s the sample standard deviation of the paired differences,", { noIndent: true }));
c.push(eqRow([
  new MathRun("\u0112 \u00B1 "),
  new MathSubScript({ children: [new MathRun("t")], subScript: [new MathRun("0.975, M\u22121")] }),
  new MathRun(" \u00B7 "),
  new MathFraction({ numerator: [new MathRun("s")], denominator: [new MathRadical({ children: [new MathRun("M")] })] }),
], 5));
c.push(h2("4.3  Results"));
c.push(body("The evaluation grid covers eight conditions (blocking, shortcut, and static scenarios at slip \u03C1 \u2208 {0, 0.1, 0.3}) with ten methods and eight map/seed pairs, for 640 runs in total. Before comparing methods on changed mazes, Figure 2 reproduces the canonical sanity task from the Dyna literature: a 6x9 corridor in which the path is blocked mid-run and a shortcut opens later. The replication shows the expected ordering (Q-learning barely adapts, Dyna with more planning adapts sooner), which certifies that the harness behaves like the classical setup before any novel machinery is added."));
c.push(...figure(FIG("fig_canonical.png"), "Figure 2: Canonical 6x9 blocking/shortcut task (\u03C1 = 0): completed episodes versus real environment steps for Q-learning and Dyna with n = 5, 20, 50", 440));
c.push(body("Figure 3 shows rolling success through a blocking event at the harshest slip level for all ten methods, and Figure 4 summarizes post-change adaptation delay with 95% bootstrap confidence intervals in the two dynamic scenarios. At \u03C1 = 0.3, CAVR-Dyna reaches a median post-change adaptation delay of 82 steps in the blocking condition and 73 steps in the shortcut condition, against 152 and 152 steps for local-forgetting Dyna, the strongest Dyna-family baseline: a 47-52% reduction whose paired bootstrap interval excludes zero. D* Lite is faster still in several conditions and is reported as measured; it operates on a given edge-belief map refreshed by an oracle rule, so it does not pay the sample cost of learning the model from slips."));
c.push(...figure(FIG("fig_learning_curves.png"), "Figure 3: Blocking scenario, \u03C1 = 0.3: rolling success over a window of 8 episodes for all ten methods (dotted marker: the topology change)", 470));
c.push(...figure(FIG("fig_adaptation_bar.png"), "Figure 4: Median post-change adaptation delay with 95% bootstrap confidence intervals, per method, in the blocking (left) and shortcut (right) scenarios", 580));
c.push(body("Table 4 reports the full blocking, \u03C1 = 0.3 condition. CAVR-Dyna attains a post-change success of 0.616 versus 0.590 for local forgetting while spending 16.2 backups per step instead of 32; its detector fires 1.5 false alarms per 1000 stationary steps, within the budget of 5, and localizes true breaks in about 70 steps. The steady-state cost is visible in the overall success column and is discussed in Section 4.4."));
c.push(tabCaption("Table 4: Experimental results in the blocking condition at \u03C1 = 0.3 (640-run grid; best Dyna-family baseline in bold row order)"));
{
  const rows = R.tables["blocking_rho0.3"].map(r => [
    r.method, fmtN(r.success, 3), fmtN(r.succ_post, 3), fmtN(r.delay_med, 1),
    fmtN(r["delay_censored%"], 0), fmtN(r["far/1000"], 1),
    r.detect_delay === null ? "-" : fmtN(r.detect_delay, 0),
    fmtN(r.AULC, 3), fmtN(r.plan_ms, 0),
  ]);
  c.push(dataTable({
    widths: [17, 10, 11, 11, 9, 10, 11, 9, 12],
    numAlignFrom: 1,
    header: ["Method", "Success", "Succ. post", "Delay med", "Cens %", "FAR /1k", "T-detect", "AULC", "Plan ms"],
    rows,
  }));
}
c.push(body("A concrete illustration of what the trained model supports is shown in Figure 5: the believed maze topology recovered from the primary checkpoint (the MAP posterior over the 144 grid edges) and a greedy rollout of the learned value function from the start cell to the goal under slip \u03C1 = 0.1. The rollout reaches the goal in 36 steps with 5 slip events; under the MAP beliefs 79 of the 81 cells remain reachable from the start, a residual pocket effect of the blocking event discussed in Section 4.4.", { noIndent: true }));
c.push(...figure(REP("fig_maze_replay.png"), "Figure 5: Believed maze topology (MAP edge beliefs) and greedy rollout of the learned value function, maze seed 1003, checkpoint cavr_trained.npz", 400));
c.push(h2("4.4  Ablation and Sensitivity Analysis"));
c.push(body("Two ablations isolate the contribution of CAVR's two novel mechanisms. Removing the detector (cavr_nodetector) leaves the Dirichlet model, counterfactual heap, and probe schedule intact but never forgets: in the blocking condition the median adaptation delay rises from 82 to 130 steps and post-change success falls from 0.616 to 0.550. Fixing the budget (cavr_fixedB, B = 32) keeps the detector but removes adaptive compute allocation: the delay explodes to 399 steps. Figure 6 places the variants on the compute-adaptation plane: at comparable planning wall-clock, the adaptive arbiter buys a four-fold delay reduction over the fixed-budget variant, so the arbiter, not raw planning depth, is what produces fast recovery. D* Lite dominates on wall-clock (161 ms) because its replanning operates on oracle-refreshed beliefs."));
c.push(...figure(FIG("fig_pareto.png"), "Figure 6: Compute versus adaptation (blocking, \u03C1 = 0.3): median post-change adaptation delay against mean planning wall-clock per run, log scale", 430));
c.push(body("Detector sensitivity was measured before any comparison run, on the validation mazes (seeds 1004-1007): Table 5 sweeps the CUSUM threshold h against the false-alarm budget, and Table 6 sweeps the repair gain \u03BA against mean repair delay. The chosen operating point h = 4.0, \u03BA = 0.0003 keeps false alarms at 2.5 per 1000 stationary steps (budget: 5) while achieving the fastest repair; the sweep confirms the detector is not brittle, with every h \u2265 5 eliminating false alarms entirely at the cost of slower repair."));
c.push(tabCaption("Table 5: CUSUM threshold sensitivity (validation mazes; chosen row: h = 4.0)"));
{
  const rows = R.calibration.cusum_rows.map(r => [
    String(r.h), fmtN(r.false_per_1000, 2),
    r.h === R.calibration.chosen_h ? "chosen" : "-",
  ]);
  c.push(dataTable({ widths: [34, 33, 33], numAlignFrom: 1,
    header: ["Threshold h", "False alarms / 1000 steps", "Selected"],
    rows, boldRows: rows.map((r, i) => r[2] === "chosen" ? i : -1).filter(i => i >= 0) }));
}
c.push(tabCaption("Table 6: Repair-gain \u03BA sensitivity (validation mazes; chosen row: \u03BA = 0.0003)"));
{
  const rows = R.calibration.kappa.kappa_grid.map(r => [
    String(r.kappa), fmtN(r.mean_delay, 1),
    r.kappa === R.calibration.kappa.chosen_kappa ? "chosen" : "-",
  ]);
  c.push(dataTable({ widths: [34, 33, 33], numAlignFrom: 1,
    header: ["Gain \u03BA", "Mean repair delay (steps)", "Selected"],
    rows, boldRows: rows.map((r, i) => r[2] === "chosen" ? i : -1).filter(i => i >= 0) }));
}
c.push(body("Detector behaviour at the operating point is summarized in Figure 7: false alarms stay within budget at every slip level (0.8 per 1000 at \u03C1 = 0.1, 1.5 at \u03C1 = 0.3, against the G1 budget of 5), and mean detection delay on changed runs is about 70 steps at \u03C1 = 0.3, versus 114 steps for the local-forgetting baseline at \u03C1 = 0.1. Figure 8 documents a known artifact honestly: in the shipped belief-heatmap figure the evaluator-view panel renders blank (a plotting defect in the original artifact); the learned-belief panel is unaffected.", { noIndent: true }));
c.push(...figure(FIG("fig_detector.png"), "Figure 7: Detector behaviour. Left: false alarms per 1000 stationary steps versus slip (dashed: G1 budget 5/1000). Right: mean detection delay on changed runs", 580));
c.push(...figure(FIG("fig_belief_heatmap.png"), "Figure 8: Maze seed 1000, learned topology beliefs. The left evaluator-view panel renders blank in the shipped artifact (known plotting defect); right: learned edge-open beliefs from the trained weights", 560));

/* ---- 5 Evaluation Protocol ---- */
c.push(h1("5  Evaluation Protocol"));
c.push(body("Algorithm 1 states the standardized protocol applied to every trained checkpoint. Its distinguishing feature is that verification data is adversarial to the training data by construction: the held-out run uses a harsher slip level (0.3 versus 0.1 in training), new change schedules chosen by the evaluator, and checkpoints are reloaded from disk rather than evaluated in-memory, so no run-time state can leak into the result."));
c.push(tabCaption("Algorithm 1: Held-out verification protocol (V1-V4 gates)"));
c.push(codeBlock([
  "Require: trained agent pi, held-out mazes M_h, seeds S, eval episodes N",
  "1: for maze m in M_h do",
  "2:   load checkpoint theta_m from disk (Q, model counts, edge beliefs,",
  "      detector state)",
  "3:   for seed s in S do",
  "4:     env <- maze(m) with NEW unseen change schedule, slip rho = 0.3",
  "5:     for episode i = 1 to N do",
  "6:       G_i <- rollout of pi (greedy actions; exploration floor only)",
  "7:     end for",
  "8:     record rolling-success curve; adaptation delay (censoring-aware)",
  "9:   end for",
  "10:  V1: stationarity and post-change success above gate",
  "11:  V2: adaptation delay above gate and not censored",
  "12:  V3: model sanity: max | sum_s' p(s'|s,a) - 1 | below 1e-10;",
  "      edge-belief symmetry holds",
  "13:  V4: determinism: reload + identical seed reproduces metrics exactly",
  "14: end for",
  "15: report mean, median, and 95% bootstrap CI across map/seed pairs",
]));
c.push(spacer(120));
c.push(body("All four gates pass for all four held-out mazes, as shown in Table 7. Static success is 1.00 on three mazes and 0.97 on the fourth; adaptation delays range from 6 to 503 steps and are never censored; model probabilities sum to machine precision (max deviation 2.22e-16); and reloaded weights replay bit-identically. Figure 9 shows the demonstration console built on these artifacts: the gateway login flows into a dashboard over the real result tables, figures, checkpoint inspector, and an animated replay of the rollout of Figure 5."));
c.push(tabCaption("Table 7: Held-out verification results (verify slip \u03C1 = 0.3; unseen schedules)"));
{
  const rows = R.verification.results.map(r => [
    String(r.maze_seed), fmtN(r.static_success, 2), fmtN(r.adaptation_delay, 0),
    r.adaptation_censored ? "yes" : "no", String(r.n_alarms),
    r.predict_max_dev.toExponential(2),
    `${r.gate_v1 ? "PASS" : "FAIL"}/${r.gate_v2 ? "PASS" : "FAIL"}/${r.gate_v3 ? "PASS" : "FAIL"}`,
  ]);
  c.push(dataTable({ widths: [8, 14, 16, 12, 12, 16, 22], numAlignFrom: 1,
    header: ["Maze", "Static succ.", "Delay (steps)", "Censored", "Alarms", "max |Sum p - 1|", "Gates V1/V2/V3"],
    rows }));
}
c.push(...figure(SHOT("02-dashboard.png"), "Figure 9: Demonstration console (deliverable D6): gateway login, overview of headline findings and the 640-run artifact base", 560));
c.push(body("Reporting guidelines follow [6]: headline numbers are medians with 95% paired bootstrap intervals across map/seed pairs rather than single-seed anecdotes; identical evaluation seeds are used across methods; training and evaluation seeds are disjoint; and learning curves are reported alongside final scores so that adaptation speed remains visible.", { noIndent: true }));

/* ---- 6 Timeline and Milestones ---- */
c.push(h1("6  Timeline and Milestones"));
c.push(body("Table 8 maps the project milestones to their deliverables over a twelve-week plan, mirroring the actual pipeline stages: the manifest and the harness come first, calibration precedes any comparison, and verification gates close the loop before reporting."));
c.push(tabCaption("Table 8: Project milestones and deliverables"));
c.push(dataTable({
  widths: [12, 56, 32],
  numAlignFrom: 99,
  header: ["Week", "Milestone", "Deliverable"],
  rows: [
    ["1-2", "Literature review; MDP and slip-dynamics formulation; maze generator with content-hashed manifest", "D1 (partial), D5"],
    ["3-4", "Environment contract, leak guard, and change scenarios; Q-learning and Dyna-Q baselines", "D1 (partial), D7"],
    ["5-6", "Prioritized sweeping, Dyna-Q+, Dirichlet Dyna, local-forgetting Dyna, D* Lite", "D1 (partial)"],
    ["7-8", "CAVR-Dyna agent: CUSUM detector, local forgetting, counterfactual heap, probe schedule, VoC budget; both ablations", "D1, D2 (partial)"],
    ["9", "Detector calibration on validation mazes (h, kappa grids); canonical sanity replication", "D3 (partial)"],
    ["10", "Full 640-run pilot grid across 8 conditions; figures and summary tables", "D2, D3"],
    ["11", "Curriculum training runs; held-out verification V1-V4; test suite completion", "D2, D5, D7"],
    ["12", "Technical report, presentation deck, and integrated demonstration console", "D4, D6"],
  ],
}));

/* ---- 7 Conclusion ---- */
c.push(h1("7  Conclusion"));
c.push(body("This project specified, implemented, and empirically evaluated CAVR-Dyna, a change-aware stochastic model-based reinforcement learning agent for dynamic mazes, and delivered the full artifact chain promised at the outset: a layered codebase (D1), five trained checkpoints (D2), a 640-run evaluation with eight figures and eight condition tables (D3), this report (D4), a content-hashed reproducibility package (D5), an integrated demonstration console (D6), and a 41-case test suite (D7)."));
c.push(body("The evidence supports three conclusions. First, repair quality, not planning quantity, drives adaptation: with the detector calibrated and the counterfactual heap active, CAVR-Dyna cuts median post-change adaptation delay by 47-52% against the strongest Dyna baseline at the harshest slip level while spending fewer backups per step than it, and the fixed-budget ablation that spends the same compute with the same detector is nearly five times slower to adapt. Second, the safety mechanisms hold under stress: false alarms remain within the calibrated budget at every slip level, and the held-out verification passes all four gates on unseen schedules with a harsher slip than training. Third, the comparison is honest about limits: D* Lite, operating on oracle-refreshed beliefs, is stronger in several regimes, and CAVR-Dyna pays a credible steady-state success cost once the world is static again; both facts are published as measured, consistent with the pre-registered analysis plan. The project therefore meets its objectives O1-O5 and establishes, within its feasibility scale, that calibrated change detection paired with targeted, budget-honest repair is a practical route to model-based agents that keep working when the world moves."));

/* ---- References ---- */
c.push(h1("References"));
c.push(refPara("[1] R. S. Sutton and A. G. Barto, Reinforcement Learning: An Introduction, 2nd ed. Cambridge, MA: MIT Press, 2018."));
c.push(refPara("[2] R. S. Sutton, \"Integrated architectures for learning, planning, and reacting based on approximating dynamic programming,\" in Proc. 7th Int. Conf. Machine Learning (ICML), Austin, TX, 1990, pp. 216-224."));
c.push(refPara("[3] A. W. Moore and C. G. Atkeson, \"Prioritized sweeping: Reinforcement learning with less data and less time,\" Machine Learning, vol. 13, no. 1, pp. 103-130, 1993."));
c.push(refPara("[4] S. Koenig and M. Likhachev, \"D* Lite,\" in Proc. 18th Natl. Conf. Artificial Intelligence (AAAI), Edmonton, AB, Canada, 2002, pp. 476-483."));
c.push(refPara("[5] E. S. Page, \"Continuous inspection schemes,\" Biometrika, vol. 41, no. 1-2, pp. 100-115, 1954."));
c.push(refPara("[6] R. Agarwal, M. Schwarzer, J. J. Castro, A. Courville, and M. G. Bellemare, \"Deep reinforcement learning at the edge of the statistical precipice,\" in Advances in Neural Information Processing Systems (NeurIPS), 2021."));

/* ================= DOCUMENT ================= */
const pageFooter = new Footer({ children: [new Paragraph({
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ children: [PageNumber.CURRENT], size: 21, font: TNR, color: BLACK })],
}) ] });

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: TNR, size: BODY, color: BLACK },
        paragraph: { spacing: { line: LINE } },
      },
      heading1: {
        run: { font: TNR, size: 32, bold: true, color: BLACK },
        paragraph: { spacing: { before: 480, after: 240, line: LINE }, outlineLevel: 0 },
      },
      heading2: {
        run: { font: TNR, size: 28, bold: true, color: BLACK },
        paragraph: { spacing: { before: 360, after: 180, line: LINE }, outlineLevel: 1 },
      },
      heading3: {
        run: { font: TNR, size: 24, bold: true, color: BLACK },
        paragraph: { spacing: { before: 240, after: 120, line: LINE }, outlineLevel: 2 },
      },
    },
  },
  sections: [
    { // Section 1: front matter (title, abstract, contents) — no page number
      properties: { page: PAGE },
      children: front,
    },
    { // Section 2: body — Arabic page numbers from 1
      properties: {
        type: SectionType.NEXT_PAGE,
        page: { ...PAGE, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } },
      },
      footers: { default: pageFooter },
      children: c,
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log("report written:", OUT, buf.length, "bytes");
});
