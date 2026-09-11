import { describe, expect, it } from "vitest";
import { slug } from "./clienti";

describe("slug", () => {
  it("strips accents and punctuation", () => {
    expect(slug("Mario Rossi & C. s.n.c.")).toBe("mario-rossi-c-s-n-c");
    expect(slug("Niccolò D'Amico")).toBe("niccolo-d-amico");
  });

  it("never produces a path separator", () => {
    expect(slug("../../etc/passwd")).toBe("etc-passwd");
  });

  it("falls back for an unusable name", () => {
    expect(slug("!!!")).toBe("cliente");
  });
});