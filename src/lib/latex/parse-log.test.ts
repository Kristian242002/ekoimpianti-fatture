import { describe, expect, it } from "vitest";
import { explainLatexError, parseLatexLog } from "./parse-log";

describe("parseLatexLog", () => {
  it("reads the file-line-error format", () => {
    const log = [
      "This is pdfTeX",
      "./document.tex:52: Undefined control sequence.",
      "l.52 \\textbf",
      "            {x}",
    ].join("\n");

    expect(parseLatexLog(log)).toEqual([
      { message: "Undefined control sequence.", line: 52, context: "\\textbf" },
    ]);
  });

  it("reads the classic bang format", () => {
    const log = ["! Misplaced alignment tab character &.", "l.88 a &", "     b"].join("\n");
    const [error] = parseLatexLog(log);
    expect(error.message).toBe("Misplaced alignment tab character &.");
    expect(error.line).toBe(88);
  });

  it("ignores ordinary log noise", () => {
    expect(parseLatexLog("Output written on document.pdf (1 page).")).toEqual([]);
  });

  it("returns an empty array for a clean log", () => {
    expect(parseLatexLog("")).toEqual([]);
  });
});

describe("explainLatexError", () => {
  it("suggests how to install a missing package", () => {
    const out = explainLatexError({
      message: "LaTeX Error: File `tabularx.sty' not found.",
    });
    expect(out).toContain("tabularx.sty");
    expect(out).toContain("dnf provides");
  });

  it("falls back to the raw message", () => {
    expect(explainLatexError({ message: "Something odd" })).toBe("Something odd");
  });
});