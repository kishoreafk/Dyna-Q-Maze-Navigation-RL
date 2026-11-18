#!/usr/bin/env python3
"""Prepare CAVR-Dyna artifact data for the web frontend.

Reads the extracted cavr-dyna project artifacts (checkpoints, tables, reports)
and produces compact JSON files under /home/z/my-project/data/cavr/ plus copies
figures into /home/z/my-project/public/figures/.
"""
import csv
import json
import shutil
from pathlib import Path

import numpy as np

SRC = Path("/home/z/my-project/cavr-dyna-extracted/cavr-dyna")
OUT = Path("/home/z/my-project/data/cavr")
PUBFIG = Path("/home/z/my-project/public/figures")
OUT.mkdir(parents=True, exist_ok=True)
PUBFIG.mkdir(parents=True, exist_ok=True)

H = W = 9
N = H * W
GOAL = 80  # (8,8)
START = 0  # (0,0)
DIRS = [(-1, 0), (0, 1), (1, 0), (0, -1)]  # N E S W reference order


def rc(s):
    return (s // W, s % W)


def load_meta(d):
    return json.loads(bytes(d["__meta__"]).decode("utf-8"))


def derive_edges(d):
    """edge_keys are adjacent cell pairs; edge_logits are belief logits."""
    ek = d["edge_keys"].astype(int)
    el = d["edge_logits"].astype(float)
    edges = []
    for i in range(len(el)):
        a, b = ek[i].tolist()
        logit = float(el[i])
        p = 1.0 / (1.0 + np.exp(-logit))
        edges.append({
            "a": int(a), "b": int(b),
            "logit": round(logit, 3),
            "p": round(float(p), 3),
            "passable": bool(logit > 0),
        })
    return edges


def adjacency(edges, passable_only=True):
    adj = {s: [] for s in range(N)}
    for e in edges:
        if passable_only and not e["passable"]:
            continue
        adj[e["a"]].append(e["b"])
        adj[e["b"]].append(e["a"])
    return adj


def infer_action_convention(q, edges):
    """Try all 24 permutations of direction->action to find the one used in
    training. Greedy rollout (no slip) from START to GOAL with bounce."""
    adj = adjacency(edges)
    import itertools
    best = None
    for perm in itertools.permutations(range(4)):
        amap = [DIRS[perm[a]] for a in range(4)]
        s = START
        steps = 0
        ok = False
        while steps < 600:
            if s == GOAL:
                ok = True
                break
            a = int(np.argmax(q[s]))
            dr, dc = amap[a]
            r, c = rc(s)
            nr, nc = r + dr, c + dc
            if 0 <= nr < H and 0 <= nc < W:
                ns = nr * W + nc
                if ns in adj[s]:
                    s = ns
            steps += 1
        if ok:
            if best is None or steps < best[1]:
                best = (perm, steps)
    return best  # (perm tuple, steps) or None


def simulate_replay(q, edges, rho=0.1, seed=7, max_steps=400, perm=None):
    """Greedy rollout on believed map with action slip.
    If perm is None: V-based greedy (move to passable neighbor with max V)."""
    rng = np.random.default_rng(seed)
    adj = adjacency(edges)
    v = q.max(axis=1)
    traj = []
    s = START
    reached = False
    for t in range(max_steps):
        if s == GOAL:
            reached = True
            break
        nbrs = adj[s]
        if not nbrs:
            break
        slipped = bool(rng.random() < rho)
        if perm is not None:
            amap = [DIRS[perm[a]] for a in range(4)]
            a = int(np.argmax(q[s]))
            dr, dc = amap[a]
            r, c = rc(s)
            nr, nc = r + dr, c + dc
            intended = nr * W + nc if (0 <= nr < H and 0 <= nc < W) else s
            if intended not in nbrs:
                nxt = s  # bounce: blocked or border
                slipped = False
            elif slipped:
                alt = [n for n in nbrs if n != intended]
                nxt = int(rng.choice(alt)) if alt else intended
            else:
                nxt = intended
            traj.append({
                "t": t, "from": int(s), "to": int(nxt),
                "intended": int(intended), "slip": slipped,
            })
        else:
            best_n = max(nbrs, key=lambda n2: v[n2])
            if slipped:
                alt = [n2 for n2 in nbrs if n2 != best_n]
                nxt = int(rng.choice(alt)) if alt else int(best_n)
            else:
                nxt = int(best_n)
            traj.append({
                "t": t, "from": int(s), "to": int(nxt),
                "intended": int(best_n), "slip": slipped,
            })
        s = nxt
    if s == GOAL:
        reached = True
    return traj, reached


def main():
    # ---------- 1. checkpoints ----------
    ckpts = {}
    for name in ["cavr_trained", "cavr_trained_m1000", "cavr_trained_m1001",
                 "cavr_trained_m1002", "cavr_trained_m1003"]:
        d = np.load(SRC / f"artifacts/checkpoints/{name}.npz", allow_pickle=True)
        meta = load_meta(d)
        q = d["q"].astype(float)
        ckpt = {
            "name": name,
            "mazeSeed": int(meta.get("maze_seed", -1)),
            "method": meta.get("method"),
            "scenario": meta.get("scenario"),
            "rhoTrue": meta.get("rho_true"),
            "rhoEst": float(d["rho_est"]),
            "h": float(d["h"]),
            "kappa": meta.get("agent_cfg", {}).get("kappa"),
            "tFinal": int(meta.get("t_final", 0)),
            "goal": meta.get("goal"),
            "epiEma": meta.get("epi_ema"),
            "G": float(d["G"]),
            "nAlarms": int(d["n_alarms"]),
            "lastAlarmT": float(d["last_alarm_t"]),
            "agentCfg": meta.get("agent_cfg"),
            "schedule": meta.get("schedule"),
            "phaseMetrics": meta.get("phase_metrics"),
            "qStats": {
                "min": float(q.min()), "max": float(q.max()),
                "mean": float(q.mean()),
            },
        }
        if name == "cavr_trained":
            edges = derive_edges(d)
            ckpt["edges"] = edges
            ckpt["q"] = np.round(q, 3).tolist()
            best = infer_action_convention(q, edges)
            ckpt["actionConvention"] = None
            traj, reached = None, False
            mode = "v_greedy"
            if best is not None:
                perm, nsteps = best
                ckpt["actionConvention"] = {
                    "perm": list(perm), "greedySteps": int(nsteps),
                }
                traj, reached = simulate_replay(q, edges, rho=0.1, perm=perm)
                if reached:
                    mode = "policy_greedy"
            if not reached:
                traj, reached = simulate_replay(q, edges, rho=0.1, perm=None)
                mode = "v_greedy"
            ckpt["replayMode"] = mode
            ckpt["replay"] = {
                "start": START, "goal": GOAL, "rho": 0.1,
                "steps": traj, "reachedGoal": reached,
                "nSteps": len(traj),
                "nSlips": sum(1 for s in traj if s["slip"]),
            }
            npass = sum(1 for e in edges if e["passable"])
            adj = adjacency(edges)
            seen = set()
            stack = [START]
            while stack:
                n = stack.pop()
                if n in seen:
                    continue
                seen.add(n)
                stack.extend(m for m in adj[n] if m not in seen)
            ckpt["topology"] = {
                "passableEdges": npass,
                "blockedEdges": len(edges) - npass,
                "reachableFromStart": len(seen),
            }
            mem = meta.get("memory_records", {})
            ckpt["memorySample"] = {k: mem[k] for k in list(mem.keys())[:8]}
        ckpts[name] = ckpt

    (OUT / "checkpoints.json").write_text(json.dumps(ckpts, indent=1))

    # ---------- 2. results tables ----------
    tables = {}
    tdir = SRC / "artifacts/tables"
    for f in sorted(tdir.glob("summary_*.csv")):
        key = f.stem.replace("summary_", "")
        rows = []
        with open(f) as fh:
            for row in csv.DictReader(fh):
                parsed = {}
                for k, v in row.items():
                    if v in ("nan", ""):
                        parsed[k] = None
                    else:
                        try:
                            parsed[k] = float(v)
                        except (ValueError, TypeError):
                            parsed[k] = v
                rows.append(parsed)
        tables[key] = rows
    training_report = json.loads(
        (SRC / "artifacts/training_report.json").read_text())
    verification = json.loads(
        (SRC / "artifacts/verification/verification_report.json").read_text())
    calibration = json.loads(
        (SRC / "artifacts/pilot/calibration_summary.json").read_text())
    manifest = json.loads(
        (SRC / "artifacts/data/manifests/mazes_manifest.json").read_text())
    results = {
        "tables": tables,
        "trainingReport": training_report,
        "verification": verification,
        "calibration": calibration,
        "mazes": manifest.get("mazes", []),
        "manifestGenerator": manifest.get("generator"),
    }
    (OUT / "results.json").write_text(json.dumps(results, indent=1))

    # ---------- 3. copy figures ----------
    for fig in (SRC / "artifacts/figures").glob("*.png"):
        shutil.copy(fig, PUBFIG / fig.name)
    print("figures copied:", len(list(PUBFIG.glob("*.png"))))

    tr = ckpts["cavr_trained"]
    print("maze seed:", tr["mazeSeed"], "| convention:", tr["actionConvention"],
          "| replay mode:", tr.get("replayMode"))
    print("replay steps:", tr["replay"]["nSteps"],
          "slips:", tr["replay"]["nSlips"],
          "reached:", tr["replay"]["reachedGoal"])
    print("topology:", tr["topology"])
    print("tables:", list(tables.keys()))
    print("sizes:", {f.name: f.stat().st_size
                     for f in OUT.glob("*.json")})


if __name__ == "__main__":
    main()
