import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

/**
 * Serves the CAVR-Dyna artifact dataset (converted from the original
 * .npz checkpoints / CSV tables / JSON reports by scripts/prepare_data.py).
 */
export async function GET() {
  try {
    const dir = path.join(process.cwd(), "data", "cavr");
    const [checkpointsRaw, resultsRaw] = await Promise.all([
      readFile(path.join(dir, "checkpoints.json"), "utf8"),
      readFile(path.join(dir, "results.json"), "utf8"),
    ]);
    return NextResponse.json({
      ok: true,
      generatedBy: "scripts/prepare_data.py",
      checkpoints: JSON.parse(checkpointsRaw),
      results: JSON.parse(resultsRaw),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 },
    );
  }
}
