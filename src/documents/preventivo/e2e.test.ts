import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { compileLatex } from "@/lib/latex/compile";
import { renderPreventivoTex } from "./fill";
import { preventivoSchema } from "./schema";

const TEMPLATE_DIR = join(process.cwd(), "src/documents/preventivo");

function hasPdflatex(): boolean {
  try {
    execFileSync("pdflatex", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

// Skipped rather than failed where TeX Live is absent, so CI stays green
// until the Docker image provides it.
describe.skipIf(!hasPdflatex())("preventivo end to end", () => {
  it("produces a real pdf", async () => {
    const data = preventivoSchema.parse({
      titolo: "Preventivo impianto elettrico",
      tipologia: "Ristrutturazione completa",
      localita: "Montebello Vicentino (VI)",
      cliente: "Mario Rossi & C. s.n.c.",
      indirizzoIntervento: "Via Roma 12",
      data: "2026-09-10",
      oggetto: "Rifacimento impianto elettrico appartamento 90 mq",
      righe: [
        { voce: "Punti luce", descrizione: "12 punti luce deviati, 50% su parete", importo: 1450 },
        { voce: "", descrizione: "Quadro elettrico con differenziale", importo: 1200.5 },
      ],
      totale: 3200,
    });

    const tex = renderPreventivoTex(
      await readFile(join(TEMPLATE_DIR, "template.tex"), "utf8"),
      data,
    );

    const pdf = await compileLatex(tex, {
      assets: [join(TEMPLATE_DIR, "logo.png")],
    });

    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.byteLength).toBeGreaterThan(10_000);

    // Written out so it can actually be looked at.
    await mkdir("tmp", { recursive: true });
    await writeFile(join("tmp", "preventivo.pdf"), pdf);
  }, 30_000);
});