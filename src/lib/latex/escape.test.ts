import { describe, expect, it } from "vitest";
import { escapeLatex } from "./escape";

describe("escapeLatex", () => {
  it("escapes every special character", () => {
    expect(escapeLatex("& % $ # _ { }")).toBe("\\& \\% \\$ \\# \\_ \\{ \\}");
  });

  it("does not double-escape inserted backslashes", () => {
    expect(escapeLatex("\\")).toBe("\\textbackslash{}");
    expect(escapeLatex("a\\b&c")).toBe("a\\textbackslash{}b\\&c");
  });

  it("handles realistic field values", () => {
    expect(escapeLatex("Sconto 50% su B&B")).toBe("Sconto 50\\% su B\\&B");
    expect(escapeLatex("Via Roma 12 #3")).toBe("Via Roma 12 \\#3");
  });

  it("collapses newlines by default", () => {
    expect(escapeLatex("riga1\nriga2")).toBe("riga1 riga2");
  });

  it("converts newlines when multiline is enabled", () => {
    expect(escapeLatex("riga1\nriga2", { multiline: true })).toBe(
      "riga1 \\\\ riga2",
    );
  });

  it("returns an empty string for null and undefined", () => {
    expect(escapeLatex(null)).toBe("");
    expect(escapeLatex(undefined)).toBe("");
  });

  it("accepts numbers", () => {
    expect(escapeLatex(3200)).toBe("3200");
  });

  it("never emits an unescaped special character", () => {
    const chars = "\\&%$#_{}~^";
    const noise = Array.from(
      { length: 200 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join("");
    const result = escapeLatex(noise);
    expect(result).not.toMatch(/(?<!\\)&/);
    expect(result).not.toMatch(/(?<!\\)%/);
    expect(result).not.toMatch(/(?<!\\)\$/);
  });
});