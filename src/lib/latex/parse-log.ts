export type LatexError = {
  /** Human-readable message, as emitted by TeX. */
  message: string;
  /** Line number inside the generated .tex, when TeX reports one. */
  line?: number;
  /** The source fragment TeX was reading when it gave up. */
  context?: string;
};

/** `-file-line-error` format: `./document.tex:52: Undefined control sequence.` */
const FILE_LINE = /^(?:\.\/)?[^:\n]+\.tex:(\d+):\s*(.+)$/;
/** Classic format: a line starting with `!`. */
const BANG = /^!\s*(.+)$/;
/** TeX prints the offending source as `l.52 \somecommand`. */
const CONTEXT = /^l\.(\d+)\s?(.*)$/;

/**
 * Extracts the errors from a pdflatex log. Returns them in the order TeX
 * found them; with `-halt-on-error` that is normally a single entry.
 */
export function parseLatexLog(log: string): LatexError[] {
  const lines = log.split(/\r?\n/);
  const errors: LatexError[] = [];

  for (let i = 0; i < lines.length; i++) {
    const fileLine = FILE_LINE.exec(lines[i]);
    const bang = fileLine ? null : BANG.exec(lines[i]);
    if (!fileLine && !bang) continue;

    const error: LatexError = fileLine
      ? { message: fileLine[2].trim(), line: Number(fileLine[1]) }
      : { message: bang![1].trim() };

    // The `l.<n>` context line follows within a few lines.
    for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
      const context = CONTEXT.exec(lines[j]);
      if (context) {
        error.line ??= Number(context[1]);
        error.context = context[2].trim();
        break;
      }
    }
    errors.push(error);
  }
  return errors;
}

/** Turns a raw TeX message into something actionable in the UI. */
export function explainLatexError(error: LatexError): string {
  const missing = /File `([^']+)' not found/.exec(error.message);
  if (missing) {
    return `Pacchetto LaTeX mancante: ${missing[1]}. Installalo con: sudo dnf provides '*/${missing[1]}'`;
  }
  if (/Undefined control sequence/i.test(error.message)) {
    return `Comando LaTeX sconosciuto${error.context ? `: ${error.context}` : ""}. Probabile carattere speciale non gestito dall'escaping.`;
  }
  if (/Misplaced alignment tab/i.test(error.message)) {
    return "Una & non escapata ha rotto la tabella. Bug nell'escaping.";
  }
  return error.message;
}