import { resolve } from "node:path";

/** All paths are resolved from the process working directory: no absolute
 *  path is ever hard-coded, so the same build runs locally and in Docker. */
function dir(name: string, fallback: string): string {
  return resolve(process.cwd(), process.env[name] ?? fallback);
}

function int(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = raw === undefined ? NaN : Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const DATA_DIR = dir("DATA_DIR", "dati");
export const TEMPLATES_DIR = dir("TEMPLATES_DIR", "src/documents");
export const LATEX_TIMEOUT_MS = int("LATEX_TIMEOUT_MS", 10_000);

/** Upper bound on the .tex handed to pdflatex. The Zod schema already caps
 *  every field, but this is the last line of defence against a payload that
 *  bypasses it. */
export const MAX_TEX_BYTES = int("MAX_TEX_BYTES", 512 * 1024);