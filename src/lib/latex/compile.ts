import { execFile } from "node:child_process";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { promisify } from "node:util";

import { LATEX_TIMEOUT_MS, MAX_TEX_BYTES } from "@/lib/env";
import { explainLatexError, parseLatexLog, type LatexError } from "./parse-log";

const run = promisify(execFile);

const JOB = "document";

/**
 * `-no-shell-escape` is the one that matters: without it a crafted .tex can
 * run arbitrary shell commands through \write18. The others make failures
 * loud and parseable instead of hanging on an interactive prompt.
 */
const ARGS = [
  "-no-shell-escape",
  "-interaction=nonstopmode",
  "-halt-on-error",
  "-file-line-error",
  `${JOB}.tex`,
];

export class LatexCompileError extends Error {
  constructor(
    readonly errors: LatexError[],
    readonly log: string,
  ) {
    super(errors.map(explainLatexError).join("\n") || "Compilazione LaTeX fallita");
    this.name = "LatexCompileError";
  }
}

export type CompileOptions = {
  /** Absolute paths of files to copy next to the .tex (logo, fonts, ...). */
  assets?: string[];
  timeoutMs?: number;
  /** Two passes are required by \pageref{LastPage}: the first writes the .aux
   *  with the page count, the second reads it back. One pass prints "1/??". */
  passes?: number;
};

export async function compileLatex(
  tex: string,
  options: CompileOptions = {},
): Promise<Buffer> {
  const { assets = [], timeoutMs = LATEX_TIMEOUT_MS, passes = 2 } = options;

  const size = Buffer.byteLength(tex, "utf8");
  if (size > MAX_TEX_BYTES) {
    throw new Error(`Documento troppo grande: ${size} byte (max ${MAX_TEX_BYTES})`);
  }

  // One throwaway directory per compilation: concurrent runs cannot collide
  // on .aux/.log files, and cleanup is a single rm.
  const dir = await mkdtemp(join(tmpdir(), "eko-latex-"));

  try {
    await writeFile(join(dir, `${JOB}.tex`), tex, "utf8");
    await Promise.all(
      assets.map((asset) => copyFile(asset, join(dir, basename(asset)))),
    );

    for (let pass = 0; pass < passes; pass++) {
      try {
        await run("pdflatex", ARGS, {
          cwd: dir,
          // A runaway \def loops forever and pins a core.
          timeout: timeoutMs,
          killSignal: "SIGKILL",
          maxBuffer: 16 * 1024 * 1024,
          // Minimal environment: TeX cannot reach into the user's home.
                    env: {
            PATH: process.env.PATH ?? "",
            HOME: dir,
            TEXMFVAR: dir,
            NODE_ENV: process.env.NODE_ENV ?? "development",
          },
        });
      } catch (cause) {
        const log = await readFile(join(dir, `${JOB}.log`), "utf8").catch(() => "");
        const errors = parseLatexLog(log);

        if (errors.length === 0) {
          const killed = (cause as { killed?: boolean }).killed;
          throw new LatexCompileError(
            [{ message: killed
                ? `Compilazione interrotta dopo ${timeoutMs} ms`
                : "pdflatex non disponibile o terminato in modo anomalo" }],
            log,
          );
        }
        throw new LatexCompileError(errors, log);
      }
    }

    return await readFile(join(dir, `${JOB}.pdf`));
  } finally {
    // Runs on success, on error and on timeout: the temp dir never leaks.
    await rm(dir, { recursive: true, force: true });
  }
}