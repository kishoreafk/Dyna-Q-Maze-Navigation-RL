#!/usr/bin/env python3
"""Report figure: believed maze topology + greedy rollout trajectory.

Print-friendly (white background, black text) figure for the project report,
rendered from the prepared checkpoint data (data/cavr/checkpoints.json).
"""
import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib as mpl
import numpy as np
from matplotlib.collections import LineCollection

import matplotlib.pyplot as plt

plt.rcParams["font.sans-serif"] = ["DejaVu Sans"]
plt.rcParams["axes.unicode_minus"] = False

DATA = json.loads(
    Path("/home/z/my-project/data/cavr/checkpoints.json").read_text())
OUT = Path("/home/z/my-project/data/cavr/figures_report")
OUT.mkdir(parents=True, exist_ok=True)

H = W = 9
ck = DATA["cavr_trained"]
edges = ck["edges"]
q = np.array(ck["q"])
steps = ck["replay"]["steps"]

v = q.max(axis=1)
vn = (v - v.min()) / (v.max() - v.min() or 1)


def cell(s):
    return (s % W, s // W)  # x, y


fig, ax = plt.subplots(figsize=(6.6, 7.2), dpi=200, constrained_layout=True)
ax.set_facecolor("white")

# value heat
for s in range(H * W):
    x, y = cell(s)
    ax.add_patch(
        plt.Rectangle((x - 0.5, y - 0.5), 1, 1,
                      facecolor=str(0.985 - 0.28 * vn[s]),
                      edgecolor="none", zorder=0))

# believed-open edges (dotted)
open_lines = []
for e in edges:
    if not e["passable"]:
        continue
    (x1, y1), (x2, y2) = cell(e["a"]), cell(e["b"])
    open_lines.append([(x1, y1), (x2, y2)])
ax.add_collection(LineCollection(open_lines, colors="#bbbbbb",
                                 linewidths=1.0, linestyles=":", zorder=1))

# believed-blocked edges (solid wall on shared border)
wall_lines = []
for e in edges:
    if e["passable"]:
        continue
    xa, ya = cell(e["a"])
    xb, yb = cell(e["b"])
    if ya == yb:  # horizontal neighbours -> vertical wall
        x = max(xa, xb) - 0.5
        wall_lines.append([(x, ya - 0.5), (x, ya + 0.5)])
    else:
        y = max(ya, yb) - 0.5
        wall_lines.append([(xa - 0.5, y), (xa + 0.5, y)])
ax.add_collection(LineCollection(wall_lines, colors="#111111",
                                 linewidths=2.2, zorder=2))

# outer frame
ax.add_patch(plt.Rectangle((-0.5, -0.5), W, H, fill=False,
                           edgecolor="#111111", linewidth=1.4, zorder=2))

# trajectory
tx, ty, sx, sy = [], [], [], []
for st in steps:
    x, y = cell(st["to"])
    if st["slip"]:
        sx.append(x)
        sy.append(y)
    else:
        tx.append(x)
        ty.append(y)

path_x = [cell(steps[0]["from"])[0]] + tx
path_y = [cell(steps[0]["from"])[1]] + ty
ax.plot(path_x, path_y, color="#666666", linewidth=1.3,
        linestyle="-", zorder=3, alpha=0.85)
ax.scatter(tx, ty, s=14, color="#333333", zorder=4,
           label="greedy step")
ax.scatter(sx, sy, s=34, facecolors="#ffffff", edgecolors="#111111",
           linewidths=1.2, marker="o", zorder=5, label="slip event (ρ=0.1)")

# start / goal markers
ax.scatter([0], [0], s=210, marker="s", color="#111111", zorder=6)
ax.text(0, 0, "S", color="#ffffff", ha="center", va="center",
        fontsize=10, fontweight="bold", zorder=7)
ax.scatter([8], [8], s=230, marker="s", facecolors="#ffffff",
           edgecolors="#111111", linewidths=1.6, zorder=6)
ax.text(8, 8, "G", color="#111111", ha="center", va="center",
        fontsize=10, fontweight="bold", zorder=7)

ax.set_xlim(-0.6, W - 0.4)
ax.set_ylim(-0.6, H - 0.4)
ax.set_aspect("equal")
ax.invert_yaxis()
ax.set_xticks(range(W))
ax.set_yticks(range(H))
ax.tick_params(labelsize=7, colors="#444")
for spine in ax.spines.values():
    spine.set_color("#999999")
ax.set_title(
    "Believed maze topology (MAP edge beliefs) and greedy rollout — "
    "maze seed 1003, checkpoint cavr_trained.npz",
    fontsize=10.5, pad=10)
ax.legend(loc="upper left", fontsize=8.5, framealpha=0.9,
          edgecolor="#999999")
ax.text(8.45, 8.9,
        f"{ck['topology']['passableEdges']} believed-open / "
        f"{ck['topology']['blockedEdges']} believed-blocked edges · "
        f"{len(steps)} rollout steps · {ck['replay']['nSlips']} slips",
        fontsize=8, ha="right", va="top", color="#444444",
        transform=ax.transData)

fig.savefig(OUT / "fig_maze_replay.png", facecolor="white")
print("saved", OUT / "fig_maze_replay.png")
