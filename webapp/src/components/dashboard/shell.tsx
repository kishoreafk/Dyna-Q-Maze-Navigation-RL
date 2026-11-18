"use client";

import { useState } from "react";
import { type CavrData } from "./types";
import {
  OverviewPanel,
  ResultsPanel,
  FiguresPanel,
  VerificationPanel,
  CheckpointsPanel,
} from "./panels";
import { MazeReplay } from "./maze-replay";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "results", label: "Results" },
  { id: "figures", label: "Figures" },
  { id: "verification", label: "Verification" },
  { id: "checkpoints", label: "Checkpoints" },
  { id: "replay", label: "Maze Replay" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function DashboardShell({
  operator,
  data,
  dataError,
  onDisconnect,
}: {
  operator: string;
  data: CavrData | null;
  dataError: string | null;
  onDisconnect: () => void;
}) {
  const [tab, setTab] = useState<TabId>("overview");

  return (
    <div className="min-h-screen flex flex-col bg-black text-slate-300">
      {/* dither overlay */}
      <div
        className="fixed inset-0 z-50 pointer-events-none opacity-[0.12]"
        style={{
          backgroundImage:
            "url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%202%202%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffffff%22%2F%3E%3Crect%20x%3D%221%22%20y%3D%221%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23ffffff%22%2F%3E%3C%2Fsvg%3E')",
          backgroundSize: "2px 2px",
        }}
      />
      <div className="pointer-events-none fixed inset-0 z-0 opacity-40 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04),transparent_60%)]" />

      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-black/85 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 md:px-6 h-14 flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-black/60">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-200">
                <rect x="5" y="5" width="14" height="14" rx="2" />
                <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
              </svg>
            </span>
            <div className="leading-tight">
              <div className="text-[13px] font-light tracking-[0.18em] text-white uppercase">
                CAVR-Dyna Console
              </div>
              <div className="text-[9px] uppercase tracking-[0.25em] text-slate-500">
                research artifacts · verified build
              </div>
            </div>
          </div>
          <nav className="ml-auto hidden lg:flex items-center gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-md px-3 py-1.5 text-[11px] uppercase tracking-widest transition-colors ${
                  tab === t.id
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <div className="ml-auto lg:ml-2 flex items-center gap-3">
            <span className="hidden sm:inline font-mono text-[10px] text-slate-500 truncate max-w-[160px]">
              ▲ {operator}
            </span>
            <button
              onClick={onDisconnect}
              className="rounded-md border border-white/15 px-3 py-1.5 text-[10px] uppercase tracking-widest text-slate-300 hover:text-white hover:border-white/40 transition-colors"
            >
              Terminate uplink
            </button>
          </div>
        </div>
        {/* mobile nav */}
        <nav className="lg:hidden flex items-center gap-1 overflow-x-auto px-4 pb-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-[10px] uppercase tracking-widest transition-colors ${
                tab === t.id
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="relative z-10 flex-1 mx-auto w-full max-w-7xl px-4 md:px-6 py-6">
        {dataError && (
          <div className="gw-card p-5 border border-amber-400/20">
            <p className="text-sm text-amber-300">
              Artifact API error — {dataError}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Run <span className="font-mono">python scripts/prepare_data.py</span> to
              regenerate data/cavr/*.json, then reload.
            </p>
          </div>
        )}
        {!data && !dataError && (
          <div className="grid place-items-center py-32">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border border-white/15 border-t-white/80" />
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">
                Loading research artifacts…
              </p>
            </div>
          </div>
        )}
        {data && (
          <div className="animate-in fade-in duration-500">
            {tab === "overview" && <OverviewPanel data={data} />}
            {tab === "results" && <ResultsPanel data={data} />}
            {tab === "figures" && <FiguresPanel />}
            {tab === "verification" && <VerificationPanel data={data} />}
            {tab === "checkpoints" && <CheckpointsPanel data={data} />}
            {tab === "replay" && <MazeReplay data={data} />}
          </div>
        )}
      </main>

      <footer className="relative z-10 mt-auto border-t border-white/[0.06] bg-black/80">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-[0.25em] text-slate-600">
            CAVR-Dyna · change-aware stochastic model-based RL · hypothesis evaluated empirically
          </p>
          <p className="text-[10px] text-slate-600 font-extralight">
            Data: artifacts/ (checkpoints, tables, verification) → scripts/prepare_data.py → /api/cavr/data
          </p>
        </div>
      </footer>
    </div>
  );
}
