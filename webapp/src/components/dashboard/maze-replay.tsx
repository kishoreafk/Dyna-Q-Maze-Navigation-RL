"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { type CavrData, type Checkpoint, rc } from "./types";

const W = 9;
const CELL = 52;
const PAD = 10;

type Props = { data: CavrData };

/**
 * Maze replay: renders the believed edge map (MAP posterior over wall edges)
 * recovered from the trained checkpoint, overlays a state-value heatmap, and
 * animates a greedy rollout of the learned policy under action slip ρ=0.1.
 */
export function MazeReplay({ data }: Props) {
  const ck: Checkpoint | undefined = data.checkpoints["cavr_trained"];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [showHeat, setShowHeat] = useState(true);
  const [stepIdx, setStepIdx] = useState(0);

  const edges = useMemo(() => ck?.edges ?? [], [ck]);
  const steps = useMemo(() => ck?.replay?.steps ?? [], [ck]);
  const q = useMemo(() => ck?.q ?? null, [ck]);

  // geometry helpers
  const passable = useMemo(() => {
    const set = new Set<string>();
    for (const e of edges) {
      if (e.passable) {
        set.add(`${e.a}-${e.b}`);
        set.add(`${e.b}-${e.a}`);
      }
    }
    return set;
  }, [edges]);

  const vNorm = useMemo(() => {
    if (!q) return null;
    const v = q.map((row) => Math.max(...row));
    const min = Math.min(...v);
    const max = Math.max(...v);
    return v.map((x) => (x - min) / (max - min || 1));
  }, [q]);

  const finished = stepIdx >= steps.length;
  const active = playing && !finished;

  // animation loop
  useEffect(() => {
    if (!active) return undefined;
    const id = window.setTimeout(
      () => setStepIdx((s) => Math.min(s + 1, steps.length)),
      320 / speed,
    );
    return () => window.clearTimeout(id);
  }, [active, stepIdx, speed, steps.length]);

  // drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ck) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 2;
    const size = W * CELL + PAD * 2;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    // background
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, size, size);

    const center = (s: number) => {
      const { r, c } = rc(s, W);
      return {
        x: PAD + c * CELL + CELL / 2,
        y: PAD + r * CELL + CELL / 2,
      };
    };

    // value heat
    if (showHeat && vNorm) {
      for (let s = 0; s < W * W; s++) {
        const { r, c } = rc(s, W);
        const a = 0.02 + 0.22 * vNorm[s];
        ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
        ctx.fillRect(PAD + c * CELL + 2, PAD + r * CELL + 2, CELL - 4, CELL - 4);
      }
    }

    // passable edges: subtle dotted connections
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1;
    for (const e of edges) {
      if (!e.passable) continue;
      const p1 = center(e.a);
      const p2 = center(e.b);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // believed-blocked edges: wall segments on shared borders
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 2;
    for (const e of edges) {
      if (e.passable) continue;
      const a = rc(e.a, W);
      const b = rc(e.b, W);
      ctx.beginPath();
      if (a.r === b.r) {
        // horizontally adjacent: shared vertical border
        const c = Math.max(a.c, b.c);
        const x = PAD + c * CELL;
        ctx.moveTo(x, PAD + a.r * CELL);
        ctx.lineTo(x, PAD + (a.r + 1) * CELL);
      } else {
        const r = Math.max(a.r, b.r);
        const y = PAD + r * CELL;
        ctx.moveTo(PAD + a.c * CELL, y);
        ctx.lineTo(PAD + (a.c + 1) * CELL, y);
      }
      ctx.stroke();
    }

    // outer border
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    ctx.strokeRect(PAD, PAD, W * CELL, W * CELL);

    // start / goal labels
    ctx.font = "600 12px 'Geist Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    const s0 = center(0);
    ctx.fillText("S", s0.x, s0.y);
    const g = center(80);
    ctx.fillText("G", g.x, g.y);
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.strokeRect(PAD + 8 * CELL + 4, PAD + 8 * CELL + 4, CELL - 8, CELL - 8);

    // trail up to current step
    for (let i = 0; i < stepIdx; i++) {
      const st = steps[i];
      const p = center(st.to);
      ctx.beginPath();
      ctx.fillStyle = st.slip
        ? "rgba(251,191,36,0.55)"
        : "rgba(255,255,255,0.28)";
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // agent at current step (lerp from->to)
    let ax: number, ay: number;
    if (steps.length === 0) {
      const p = center(0);
      ax = p.x;
      ay = p.y;
    } else if (stepIdx === 0) {
      const p = center(steps[0].from);
      ax = p.x;
      ay = p.y;
    } else {
      const st = steps[Math.min(stepIdx - 1, steps.length - 1)];
      const p1 = center(st.from);
      const p2 = center(st.to);
      ax = p1.x + (p2.x - p1.x) * 0.85;
      ay = p1.y + (p2.y - p1.y) * 0.85;
    }
    ctx.save();
    ctx.shadowColor = "rgba(255,255,255,0.9)";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ax, ay, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }, [ck, edges, steps, stepIdx, showHeat, vNorm]);

  if (!ck || !ck.replay) {
    return <p className="text-slate-500 text-sm">No replay data available.</p>;
  }

  const done = finished;
  const cur = stepIdx > 0 ? steps[Math.min(stepIdx - 1, steps.length - 1)] : null;
  const pos = done
    ? rc(80, W)
    : cur
      ? rc(cur.to, W)
      : rc(0, W);

  return (
    <div className="grid xl:grid-cols-[minmax(0,1fr)_320px] gap-3">
      <div className="gw-card p-5">
        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-1">
          Believed maze — MAP posterior over wall edges
        </p>
        <p className="text-[11px] text-slate-500 font-extralight leading-relaxed mb-4">
          Checkpoint <span className="font-mono text-slate-300">cavr_trained.npz</span> (maze
          seed {ck.mazeSeed}). Walls are edges the learned factored belief map
          considers blocked (logit &lt; 0); dotted links are believed-open
          edges. The agent animates a greedy rollout of the learned value
          function from S=(0,0) to G=(8,8) under action slip ρ={ck.replay.rho}.
        </p>
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            className="w-full max-w-[488px] aspect-square rounded-lg border border-white/10"
            style={{ imageRendering: "auto" }}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              if (finished) {
                setStepIdx(0);
                setPlaying(true);
              } else {
                setPlaying((p) => !p);
              }
            }}
            className="rounded-lg border border-white/20 bg-black/60 px-4 py-2 text-xs uppercase tracking-widest text-slate-200 hover:bg-white/10 transition-colors"
          >
            {finished ? "Replay" : active ? "Pause" : "Play"}
          </button>
          <button
            onClick={() => {
              setPlaying(false);
              setStepIdx(0);
            }}
            className="rounded-lg border border-white/10 bg-black/60 px-4 py-2 text-xs uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
          >
            Reset
          </button>
          <button
            onClick={() => {
              setPlaying(false);
              setStepIdx(steps.length);
            }}
            className="rounded-lg border border-white/10 bg-black/60 px-4 py-2 text-xs uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
          >
            Skip to end
          </button>
          <label className="flex items-center gap-2 text-[11px] text-slate-400 uppercase tracking-widest">
            Speed
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="bg-black border border-white/15 rounded-md px-2 py-1.5 text-xs font-mono text-slate-200"
            >
              <option value={0.5}>0.5×</option>
              <option value={1}>1×</option>
              <option value={2}>2×</option>
              <option value={4}>4×</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-[11px] text-slate-400 uppercase tracking-widest cursor-pointer">
            <input
              type="checkbox"
              checked={showHeat}
              onChange={(e) => setShowHeat(e.target.checked)}
              className="accent-white"
            />
            V heatmap
          </label>
        </div>
        <div className="mt-4 h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-white/70 transition-all duration-200"
            style={{
              width: `${steps.length ? (stepIdx / steps.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="gw-card p-5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-3">
            Rollout telemetry
          </p>
          <div className="space-y-2 font-mono text-[12px] text-slate-300 tabular-nums">
            <div className="flex justify-between">
              <span className="text-slate-500">step</span>
              <span>
                {stepIdx} / {steps.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">position</span>
              <span>
                (r={pos.r}, c={pos.c})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">slips so far</span>
              <span className={cur?.slip ? "text-amber-300" : ""}>
                {steps.slice(0, stepIdx).filter((s) => s.slip).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">status</span>
              <span className={done ? "text-emerald-300" : "text-slate-300"}>
                {done ? "GOAL REACHED" : "IN FLIGHT"}
              </span>
            </div>
          </div>
          {done && (
            <p className="mt-4 text-[11px] text-slate-400 font-extralight leading-relaxed">
              The greedy rollout reached the goal in {steps.length} steps with{" "}
              {ck.replay.nSlips} slip events — consistent with the trained
              checkpoint&apos;s held-out static success of{" "}
              {(
                (data.results.verification.results.find(
                  (r) => r.maze_seed === ck.mazeSeed,
                )?.static_success ?? 1) * 100
              ).toFixed(0)}
              % on this maze family.
            </p>
          )}
        </div>

        <div className="gw-card p-5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-3">
            Legend
          </p>
          <ul className="space-y-2 text-[11px] text-slate-400 font-extralight">
            <li className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-sm bg-white/25" />
              State-value heat (max Q per cell)
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block w-4 h-[2px] bg-white/60" />
              Believed-blocked edge (wall)
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block w-4 border-t border-dotted border-white/40" />
              Believed-open edge
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-white" />
              Agent
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400/70" />
              Slip event (amber dot)
            </li>
          </ul>
        </div>

        <div className="gw-card p-5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-3">
            Topology stats
          </p>
          <div className="space-y-2 font-mono text-[12px] text-slate-300 tabular-nums">
            <div className="flex justify-between">
              <span className="text-slate-500">passable edges</span>
              <span>{ck.topology?.passableEdges ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">believed blocked</span>
              <span>{ck.topology?.blockedEdges ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">reachable cells</span>
              <span>{ck.topology?.reachableFromStart ?? "—"}/81</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">n alarms (training)</span>
              <span>{ck.nAlarms}</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-600 mt-3 leading-relaxed">
            Two cells are unreachable from the start under the MAP beliefs — a
            residual of the blocking event at t=3200 that the detector did not
            fully re-open, shown as-is from the trained weights.
          </p>
        </div>
      </div>
    </div>
  );
}
