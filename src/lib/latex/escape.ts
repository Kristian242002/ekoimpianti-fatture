/**
 * Characters that must be escaped before injecting user data into a .tex file.
 * The replacement runs in a SINGLE pass: a two-pass approach would re-escape
 * the backslashes it just inserted.
 */
const REPLACEMENTS: Record<string, string> = {
  "\\": "\\textbackslash{}",
  "&": "\\&",
  "%": "\\%",
  "$": "\\$",
  "#": "\\#",
  "_": "\\_",
  "{": "\\{",
  "}": "\\}",
  "~": "\\textasciitilde{}",
  "^": "\\textasciicircum{}",
  // Typographic characters pasted in from Word or the web.
  "\u2018": "`",
  "\u2019": "'",
  "\u201C": "``",
  "\u201D": "''",
  "\u2013": "--",
  "\u2014": "---",
  "\u2026": "\\dots{}",
  "\u00A0": "~",
};

const PATTERN = new RegExp(
  `[${Object.keys(REPLACEMENTS)
    .map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("")}]`,
  "g",
);

export type EscapeOptions = {
  /** Convert newlines to LaTeX line breaks. Off by default: `\\` inside a
   *  tabular cell breaks the row. Enable only for free-text blocks. */
  multiline?: boolean;
};

export function escapeLatex(
  input: string | number | null | undefined,
  options: EscapeOptions = {},
): string {
  if (input === null || input === undefined) return "";

  const escaped = String(input).replace(PATTERN, (c) => REPLACEMENTS[c]);

  return options.multiline
    ? escaped.replace(/\r\n|\r|\n/g, " \\\\ ")
    : escaped.replace(/\s*[\r\n]+\s*/g, " ");
}