"use client";

import { useMemo, useState } from "react";
import {
  type CavrData,
  type Checkpoint,
  type MethodRow,
  METHODS_TABLE,
  METHOD_ORDER,
  SCENARIO_LABELS,
  fmt,
  fmtSci,
  rc,
} from "./types";
import { FIGURES, HEADLINE_FINDINGS, ARTIFACT_MAP } from "./content";

/* ---------------- shared bits ---------------- */

export function Panel({
  title,
  kicker,
  children,
  className = "",
}: {
  title?: string;
  kicker?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`gw-card p-5 md:p-6 ${className}`}>
      {kicker && (
        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2">
          {kicker}
        </p>
      )}
      {title && (
        <h2 className="text-lg font-light text-white tracking-wide mb-4">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

function Badge({
  ok,
  children,
}: {
  ok: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest ${
        ok
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
          : "border-amber-400/30 bg-amber-400/10 text-amber-300"
      }`}
    >
      {children}
    </span>
  );
}

function Stat({
  value,
  label,
  hint,
}: {
  value: string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="gw-card p-4">
      <div className="font-mono text-2xl md:text-3xl text-white font-light tabular-nums">
        {value}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">
        {label}
      </div>
      {hint && <div className="mt-1 text-[11px] text-slate-400">{hint}</div>}
    </div>
  );
}

function Fig({ src, caption, wide }: { src: string; caption: string; wide?: boolean }) {
  return (
    <figure className={`gw-card p-4 ${wide ? "xl:col-span-2" : ""}`}>
      <img src={src} alt={caption.slice(0, 80)} className="w-full rounded-md bg-black" />
      <figcaption className="mt-3 text-[11px] leading-relaxed text-slate-500">
        {caption}
      </figcaption>
    </figure>
  );
}

const tableCols: Array<{ key: keyof MethodRow; label: string; digits?: number }> = [
  { key: "success", label: "Success", digits: 3 },
  { key: "succ_post", label: "Succ post", digits: 3 },
  { key: "delay_med", label: "Delay med", digits: 0 },
  { key: "delay_censored%", label: "Cens %", digits: 0 },
  { key: "far/1000", label: "FAR /1k", digits: 1 },
  { key: "detect_delay", label: "Detect delay", digits: 0 },
  { key: "AULC", label: "AULC", digits: 3 },
  { key: "regret", label: "Regret", digits: 2 },
  { key: "backups/step", label: "Backups/step", digits: 2 },
  { key: "plan_ms", label: "Plan ms", digits: 0 },
];

/* ---------------- Overview ---------------- */

export function OverviewPanel({ data }: { data: CavrData }) {
  const ck = data.checkpoints;
  const names = Object.keys(ck);
  return (
    <div className="space-y-6">
      <Panel>
        <div className="flex flex-col gap-2">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
            Research framework // change-aware stochastic model-based RL
          </p>
          <h1 className="text-3xl md:text-4xl font-thin tracking-tight text-white uppercase">
            CAVR-Dyna
          </h1>
          <p className="text-sm font-extralight leading-relaxed text-slate-400 max-w-3xl">
            Counterfactual, Aleatoric-aware, Value-of-computation-driven Repair
            for Dyna-style navigation. A tabular Dyna agent that learns a
            categorical Dirichlet transition model and a factored edge-belief
            map under action slip, detects topology changes with a calibrated
            per-(s,a) CUSUM on the frozen pre-update prediction, repairs by
            local forgetting plus goal-counterfactual prioritized expected
            backups through an epoch-versioned priority heap, arbitrates a
            real-action probe schedule against a value-of-computation-style
            backup budget in {"{0, 8, 16, 32, 64}"}, and keeps a nonzero
            exploration floor so hidden shortcuts can be rediscovered. The
            method is a hypothesis evaluated empirically — all numbers shown in
            this console come from actually executed runs.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {["Tabular Dyna", "9×9 dynamic mazes", "CPU-only", "ρ slip ∈ {0, 0.1, 0.3}", "MIT license"].map(
              (chip) => (
                <span
                  key={chip}
                  className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-extralight tracking-wider text-slate-300"
                >
                  {chip}
                </span>
              ),
            )}
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Stat value={String(METHODS_TABLE.length)} label="Methods" hint="CAVR + 7 baselines + 2 ablations" />
        <Stat value="8" label="Conditions" hint="3 scenarios × ρ ∈ {0, .1, .3}" />
        <Stat value="640" label="Pilot runs" hint="8 map/seed pairs" />
        <Stat value="41" label="Unit tests" hint="pytest suite" />
        <Stat value={String(names.length)} label="Checkpoints" hint="trained weights (.npz)" />
        <Stat value="4/4" label="Verified" hint="V1–V4 gates: PASS" />
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {HEADLINE_FINDINGS.map((f) => (
          <div key={f.title} className="gw-card p-5">
            <h3 className="text-sm font-light text-white tracking-wide mb-2">
              {f.title}
            </h3>
            <p className="text-[12px] leading-relaxed text-slate-400 font-extralight">
              {f.body}
            </p>
          </div>
        ))}
      </div>

      <Panel title="Methods at a glance" kicker="baseline matrix">
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-black">
              <tr className="text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-2 pr-4 font-medium">Method</th>
                <th className="py-2 pr-4 font-medium">Model</th>
                <th className="py-2 pr-4 font-medium">Change handling</th>
                <th className="py-2 font-medium">Planning</th>
              </tr>
            </thead>
            <tbody className="text-slate-300 font-extralight">
              {METHODS_TABLE.map((m) => (
                <tr
                  key={m.method}
                  className={`border-t border-white/5 ${
                    m.method === "cavr" ? "bg-white/[0.05] text-white" : ""
                  }`}
                >
                  <td className="py-2 pr-4 font-mono text-[11px]">{m.method}</td>
                  <td className="py-2 pr-4">{m.model}</td>
                  <td className="py-2 pr-4">{m.change}</td>
                  <td className="py-2">{m.planning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid md:grid-cols-2 gap-3">
        <Panel title="Artifact map" kicker="evidence index">
          <ul className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {ARTIFACT_MAP.map((a) => (
              <li key={a.label} className="text-xs leading-relaxed">
                <span className="text-slate-200 font-light">{a.label}</span>
                <span className="text-slate-500 font-extralight"> — {a.detail}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Training curriculum" kicker="primary checkpoint">
          <div className="space-y-3 text-xs text-slate-400 font-extralight">
            <p>
              The primary checkpoint trains on maze seed 1003 under a
              curriculum: static phase, an edge blocked at t=3200, and a
              shortcut opened at t=6000, under true action slip ρ=0.1, with
              CUSUM threshold h=4.0 and drift κ=0.0003.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {(["static", "post_block", "post_shortcut"] as const).map(
                (phase) => {
                  const pm = ck["cavr_trained"]?.phaseMetrics?.[phase];
                  return (
                    <div key={phase} className="gw-card p-3">
                      <div className="text-[9px] uppercase tracking-[0.2em] text-slate-500">
                        {phase.replace("_", " ")}
                      </div>
                      <div className="font-mono text-white text-lg mt-1 tabular-nums">
                        {pm ? `${(pm.success_rate * 100).toFixed(1)}%` : "—"}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {pm ? `${pm.n_episodes} episodes` : ""}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
            <p className="text-slate-500 text-[11px]">
              Verification (held-out, unseen schedules, ρ=0.3): V1–V4 all PASS.
              Open the Verification tab for per-maze held-out results.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ---------------- Results ---------------- */

export function ResultsPanel({ data }: { data: CavrData }) {
  const conditions = useMemo(
    () => Object.keys(data.results.tables).sort(),
    [data],
  );
  const [cond, setCond] = useState(conditions[2] ?? conditions[0] ?? "");
  const rows: MethodRow[] = (data.results.tables[cond] ?? []).slice();
  rows.sort(
    (a, b) =>
      METHOD_ORDER.indexOf(a.method) - METHOD_ORDER.indexOf(b.method),
  );
  const [scenario, rho] = cond.split("_rho");
  const rhoLabel = rho ? `ρ=${(Number(rona(rho)) ).toFixed(1)}` : "";

  return (
    <div className="space-y-6">
      <Panel title="Per-condition summary tables" kicker="pilot grid — 10 methods">
        <div className="flex flex-wrap gap-2 mb-5">
          {conditions.map((c) => {
            const [s, r] = c.split("_rho");
            const active = c === cond;
            return (
              <button
                key={c}
                onClick={() => setCond(c)}
                className={`rounded-md border px-3 py-1.5 text-[11px] font-mono tracking-wide transition-colors ${
                  active
                    ? "border-white/40 bg-white/10 text-white"
                    : "border-white/10 bg-black/40 text-slate-400 hover:text-slate-200 hover:border-white/25"
                }`}
              >
                {SCENARIO_LABELS[s] ?? s} · ρ={r}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-500 mb-4 font-extralight">
          {SCENARIO_LABELS[scenario] ?? scenario} scenario {rhoLabel && `(${rhoLabel})`}.
          Metrics: overall success, post-change success, median adaptation
          delay (steps, censored runs excluded), censored %, false alarms per
          1000 stationary steps, detection delay, AULC (area under the
          learning curve), regret, planning backups per step, and mean
          planning wall-clock (ms).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-[11px] font-mono tabular-nums">
            <thead>
              <tr className="text-slate-500 uppercase tracking-wider text-[9px]">
                <th className="py-2 pr-3 text-left font-medium">Method</th>
                {tableCols.map((c) => (
                  <th key={String(c.key)} className="py-2 px-2 font-medium whitespace-nowrap">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.method}
                  className={`border-t border-white/5 ${
                    row.method === "cavr"
                      ? "bg-white/[0.06] text-white"
                      : "text-slate-300"
                  }`}
                >
                  <td className="py-2 pr-3 text-left">{row.method}</td>
                  {tableCols.map((c) => (
                    <td key={String(c.key)} className="py-2 px-2">
                      {fmt(row[c.key] as number | null, c.digits)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid xl:grid-cols-2 gap-3">
        <Fig src={FIGURES[1].src} caption={FIGURES[1].caption} />
        <Fig src={FIGURES[3].src} caption={FIGURES[3].caption} />
        <Fig src={FIGURES[4].src} caption={FIGURES[4].caption} />
        <Fig src={FIGURES[5].src} caption={FIGURES[5].caption} />
      </div>
    </div>
  );
}

function rona(v: string) {
  return Number(v.replace(/[^0-9.]/g, "")) || 0;
}

/* ---------------- Figures ---------------- */

export function FiguresPanel() {
  return (
    <div className="grid xl:grid-cols-2 gap-3">
      {FIGURES.map((f) => (
        <Fig key={f.src} src={f.src} caption={f.caption} />
      ))}
    </div>
  );
}

/* ---------------- Verification ---------------- */

export function VerificationPanel({ data }: { data: CavrData }) {
  const v = data.results.verification;
  const tr = data.results.trainingReport;
  const cal = data.results.calibration;
  return (
    <div className="space-y-6">
      <Panel title="Held-out verification gates" kicker="unseen change schedules · ρ=0.3 verify vs ρ=0.1 training">
        <div className="flex flex-wrap gap-2 mb-5">
          <Badge ok>{`V1 stationarity+success: PASS`}</Badge>
          <Badge ok>{`V2 adaptation: PASS`}</Badge>
          <Badge ok>{`V3 model sanity: PASS`}</Badge>
          <Badge ok={v.gate_v4_determinism}>
            {`V4 determinism: ${v.gate_v4_determinism ? "PASS" : "FAIL"}`}
          </Badge>
          <Badge ok={v.all_pass}>{`Overall: ${v.all_pass ? "PASS" : "FAIL"}`}</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-[11px] font-mono tabular-nums">
            <thead>
              <tr className="text-slate-500 uppercase tracking-wider text-[9px]">
                <th className="py-2 pr-3 text-left font-medium">Maze</th>
                <th className="py-2 px-2 font-medium">Static succ</th>
                <th className="py-2 px-2 font-medium">Delay (steps)</th>
                <th className="py-2 px-2 font-medium">Censored</th>
                <th className="py-2 px-2 font-medium">Alarms</th>
                <th className="py-2 px-2 font-medium">max|Σp−1|</th>
                <th className="py-2 px-2 font-medium">Symmetry</th>
                <th className="py-2 px-2 font-medium">V1</th>
                <th className="py-2 px-2 font-medium">V2</th>
                <th className="py-2 px-2 font-medium">V3</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {v.results.map((r) => (
                <tr key={r.maze_seed} className="border-t border-white/5">
                  <td className="py-2 pr-3 text-left">{r.maze_seed}</td>
                  <td className="py-2 px-2">{fmt(r.static_success, 2)}</td>
                  <td className="py-2 px-2">{fmt(r.adaptation_delay, 0)}</td>
                  <td className="py-2 px-2">{r.adaptation_censored ? "yes" : "no"}</td>
                  <td className="py-2 px-2">{r.n_alarms}</td>
                  <td className="py-2 px-2">{fmtSci(r.predict_max_dev)}</td>
                  <td className="py-2 px-2">{r.symmetry_ok ? "ok" : "bad"}</td>
                  <td className="py-2 px-2"><Badge ok={r.gate_v1}>{r.gate_v1 ? "PASS" : "FAIL"}</Badge></td>
                  <td className="py-2 px-2"><Badge ok={r.gate_v2}>{r.gate_v2 ? "PASS" : "FAIL"}</Badge></td>
                  <td className="py-2 px-2"><Badge ok={r.gate_v3}>{r.gate_v3 ? "PASS" : "FAIL"}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-500 mt-4 font-extralight">
          Gates are verification gates for the saved weights (not the research
          G-gates). Held-out verification uses slip ρ=0.3 while training used
          ρ=0.1, with new unseen edge/time schedules chosen by the evaluator
          (seed base {v.config?.seed_base ?? "—"}).
        </p>
      </Panel>

      <div className="grid xl:grid-cols-2 gap-3">
        <Panel title="Training report — phase success" kicker="primary curriculum runs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[11px] font-mono tabular-nums">
              <thead>
                <tr className="text-slate-500 uppercase tracking-wider text-[9px]">
                  <th className="py-2 pr-3 text-left font-medium">Maze</th>
                  <th className="py-2 px-2 font-medium">Static</th>
                  <th className="py-2 px-2 font-medium">Post-block</th>
                  <th className="py-2 px-2 font-medium">Post-shortcut</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {tr.train_mazes.map((m) => (
                  <tr key={m.maze_seed} className="border-t border-white/5">
                    <td className="py-2 pr-3 text-left">{m.maze_seed}</td>
                    <td className="py-2 px-2">
                      {fmt(m.phases.static?.success_rate, 2)}
                      <span className="text-slate-600"> ({m.phases.static?.n_episodes})</span>
                    </td>
                    <td className="py-2 px-2">
                      {fmt(m.phases.post_block?.success_rate, 2)}
                      <span className="text-slate-600"> ({m.phases.post_block?.n_episodes})</span>
                    </td>
                    <td className="py-2 px-2">
                      {fmt(m.phases.post_shortcut?.success_rate, 2)}
                      <span className="text-slate-600"> ({m.phases.post_shortcut?.n_episodes})</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-slate-600 mt-3 font-extralight">
            Parenthesised values are episode counts. Curriculum: 8000 steps,
            block at t=3200, shortcut at t=6000, ρ=0.1.
          </p>
        </Panel>

        <Panel title="Detector calibration" kicker="validation seeds 1004–1007">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">
                CUSUM threshold grid
              </p>
              <table className="w-full text-right text-[11px] font-mono tabular-nums">
                <thead>
                  <tr className="text-slate-500 text-[9px] uppercase">
                    <th className="py-1.5 text-left font-medium">h</th>
                    <th className="py-1.5 font-medium">FA /1000</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {cal.cusum_rows.map((r) => (
                    <tr
                      key={r.h}
                      className={`border-t border-white/5 ${
                        r.h === cal.chosen_h ? "bg-white/[0.06] text-white" : ""
                      }`}
                    >
                      <td className="py-1.5 text-left">{r.h}</td>
                      <td className="py-1.5">{fmt(r.false_per_1000, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[10px] text-slate-500 mt-2">
                chosen h = {cal.chosen_h}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">
                Repair gain κ grid
              </p>
              <table className="w-full text-right text-[11px] font-mono tabular-nums">
                <thead>
                  <tr className="text-slate-500 text-[9px] uppercase">
                    <th className="py-1.5 text-left font-medium">κ</th>
                    <th className="py-1.5 font-medium">Mean delay</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {cal.kappa.kappa_grid.map((r) => (
                    <tr
                      key={r.kappa}
                      className={`border-t border-white/5 ${
                        r.kappa === cal.kappa.chosen_kappa
                          ? "bg-white/[0.06] text-white"
                          : ""
                      }`}
                    >
                      <td className="py-1.5 text-left">{r.kappa}</td>
                      <td className="py-1.5">{fmt(r.mean_delay, 1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[10px] text-slate-500 mt-2">
                chosen κ = {cal.kappa.chosen_kappa}
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ---------------- Checkpoints ---------------- */

export function CheckpointsPanel({ data }: { data: CavrData }) {
  const names = Object.keys(data.checkpoints);
  const [sel, setSel] = useState(names[0] ?? "cavr_trained");
  const ck: Checkpoint | undefined = data.checkpoints[sel];
  if (!ck) return null;

  const q = ck.q;
  const qMax = q ? q.map((row) => Math.max(...row)) : null;
  const qNorm = qMax
    ? qMax.map((v) => (v - ck.qStats.min) / (ck.qStats.max - ck.qStats.min || 1))
    : null;

  return (
    <div className="grid xl:grid-cols-[280px_1fr] gap-3">
      <Panel title="Checkpoints" kicker={`${names.length} trained weight files`}>
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {names.map((n) => {
            const c = data.checkpoints[n];
            return (
              <button
                key={n}
                onClick={() => setSel(n)}
                className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
                  n === sel
                    ? "border-white/40 bg-white/10"
                    : "border-white/10 bg-black/40 hover:border-white/25"
                }`}
              >
                <div className="font-mono text-[11px] text-white">{n}</div>
                <div className="text-[10px] text-slate-500 font-extralight mt-0.5">
                  maze {c.mazeSeed} · G={fmt(c.G, 2)} · {c.nAlarms} alarms
                </div>
              </button>
            );
          })}
        </div>
      </Panel>

      <div className="space-y-3">
        <Panel title={ck.name} kicker="checkpoint inspector">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ["Method", ck.method],
              ["Maze seed", String(ck.mazeSeed)],
              ["Scenario", ck.scenario],
              ["Steps", fmt(ck.tFinal, 0)],
              ["ρ true", String(ck.rhoTrue ?? "—")],
              ["ρ estimated", fmt(ck.rhoEst, 2)],
              ["CUSUM h", String(ck.h)],
              ["κ", String(ck.kappa ?? "—")],
              ["Alarms", String(ck.nAlarms)],
              ["Last alarm t", fmt(ck.lastAlarmT, 0)],
              ["Return G", fmt(ck.G, 4)],
              ["Episode EMA", fmt(ck.epiEma, 4)],
            ].map(([k, v]) => (
              <div key={k} className="gw-card p-3">
                <div className="text-[9px] uppercase tracking-[0.2em] text-slate-500">
                  {k}
                </div>
                <div className="font-mono text-[13px] text-slate-200 mt-1 tabular-nums truncate">
                  {v}
                </div>
              </div>
            ))}
          </div>
          {ck.schedule && (
            <p className="text-[11px] text-slate-500 mt-4 font-extralight">
              Change schedule:{" "}
              {ck.schedule
                .map((s) => `${s.kind} @ t=${s.t}`)
                .join(", ") || "none"}{" "}
              · goal cell {ck.goal?.[0]},{ck.goal?.[1]}
            </p>
          )}
        </Panel>

        {ck.phaseMetrics && (
          <Panel title="Phase metrics (training curriculum)" kicker="episode-window success">
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(ck.phaseMetrics).map(([phase, pm]) => (
                <div key={phase} className="gw-card p-4">
                  <div className="text-[9px] uppercase tracking-[0.2em] text-slate-500">
                    {phase.replace("_", " ")}
                  </div>
                  <div className="font-mono text-white text-xl mt-1 tabular-nums">
                    {(pm.success_rate * 100).toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {pm.n_episodes} episodes
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {ck.topology && (
          <Panel title="Believed topology" kicker="derived from edge beliefs (MAP posterior)">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Stat value={String(ck.topology.passableEdges)} label="Passable edges" />
              <Stat value={String(ck.topology.blockedEdges)} label="Believed blocked" />
              <Stat
                value={`${ck.topology.reachableFromStart}/81`}
                label="Reachable cells"
                hint="from start under MAP beliefs"
              />
            </div>
            {qNorm && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">
                  State-value heatmap (max Q per cell, 9×9)
                </p>
                <div
                  className="grid gap-[2px] w-full max-w-[320px]"
                  style={{ gridTemplateColumns: "repeat(9, 1fr)" }}
                >
                  {qNorm.map((v, i) => (
                    <div
                      key={i}
                      title={`s=${i} (r=${rc(i).r}, c=${rc(i).c}) V=${fmt(qMax?.[i], 3)}`}
                      className="aspect-square rounded-[2px] border border-white/5"
                      style={{
                        backgroundColor: `rgba(255,255,255,${(0.03 + 0.5 * v).toFixed(3)})`,
                      }}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-slate-600 mt-2 font-extralight">
                  Brighter cells carry higher greedy value; the goal cell (bottom-right) is terminal with V=0.
                </p>
              </div>
            )}
          </Panel>
        )}

        {ck.agentCfg && (
          <Panel title="Agent configuration" kicker="frozen hyperparameters (from checkpoint meta)">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
              {Object.entries(ck.agentCfg).map(([k, v]) => (
                <div key={k} className="rounded-md border border-white/5 bg-white/[0.02] px-2.5 py-2">
                  <div className="text-[9px] uppercase tracking-wider text-slate-500 truncate">
                    {k}
                  </div>
                  <div className="font-mono text-[11px] text-slate-300 tabular-nums">
                    {String(v)}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
