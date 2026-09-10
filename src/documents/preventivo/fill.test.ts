import { describe, expect, it } from "vitest";
import { buildValues, fillTemplate } from "./fill";
import type { Preventivo } from "./schema";

const base: Preventivo = {
  titolo: "Preventivo impianto elettrico",
  tipologia: "Ristrutturazione",
  localita: "Montebello Vicentino (VI)",
  cliente: "Mario Rossi & figli",
  indirizzoIntervento: "Via Roma 12",
  data: "2026-09-10",
  oggetto: "Rifacimento impianto",
  righe: [
    { voce: "Punti luce", descrizione: "Deviato 50% carico", importo: 450 },
    { voce: "", descrizione: "Quadro elettrico", importo: 1200.5 },
  ],
  etichettaTotale: "Totale complessivo (IVA inclusa)",
  totale: 3200,
  note: ["Validità 30 giorni"],
};

describe("buildValues", () => {
  it("escapes user data", () => {
    expect(buildValues(base).CLIENTE).toBe("Mario Rossi \\& figli");
  });

  it("formats the date as it-IT", () => {
    expect(buildValues(base).DATA).toBe("10/09/2026");
  });

  it("formats amounts with an italian thousands separator", () => {
    expect(buildValues(base).TOTALE).toBe("\\texteuro{}~3.200,00");
  });

  it("always shows two decimals", () => {
    expect(buildValues(base).RIGHE).toContain("\\texteuro{}~450,00");
    expect(buildValues(base).RIGHE).toContain("\\texteuro{}~1.200,50");
  });

  it("numbers rows with an empty voce", () => {
    expect(buildValues(base).RIGHE).toContain("Voce 2 & Quadro elettrico");
  });

  it("escapes inside rows without breaking the row separator", () => {
    const righe = buildValues(base).RIGHE;
    expect(righe).toContain("Deviato 50\\% carico");
    expect(righe.split("\n")).toHaveLength(2);
  });

  it("wraps each note in an item", () => {
    expect(buildValues(base).NOTE).toContain("\\item Validità 30 giorni");
  });

  it("emits the section wrapper when notes exist", () => {
    const out = buildValues(base).NOTE;
    expect(out).toContain("\\begin{itemize}");
    expect(out).toContain("\\end{itemize}");
  });

  it("omits the whole section when there are no notes", () => {
    expect(buildValues({ ...base, note: [] }).NOTE).toBe("");
  });

  it("provides every placeholder the template needs", () => {
    const keys = Object.keys(buildValues(base));
    expect(keys).toEqual(
      expect.arrayContaining([
        "TITOLO",
        "TIPOLOGIA",
        "LOCALITA",
        "CLIENTE",
        "INDIRIZZO_INTERVENTO",
        "DATA",
        "OGGETTO",
        "RIGHE",
        "ETICHETTA_TOTALE",
        "TOTALE",
        "NOTE",
      ]),
    );
  });
});

describe("fillTemplate", () => {
  it("leaves no placeholder behind", () => {
    const template = "A <<<TITOLO>>> B <<<CLIENTE>>>";
    const out = fillTemplate(template, buildValues(base));
    expect(out).not.toMatch(/<<<|>>>/);
  });

  it("substitutes the same placeholder more than once", () => {
    const out = fillTemplate("<<<TITOLO>>> / <<<TITOLO>>>", { TITOLO: "X" });
    expect(out).toBe("X / X");
  });

  it("throws on an unmapped placeholder", () => {
    expect(() => fillTemplate("<<<SCONOSCIUTO>>>", {})).toThrow(
      /unmapped placeholders: SCONOSCIUTO/i,
    );
  });

  it("does not treat dollar signs in the data as replacement patterns", () => {
    const out = fillTemplate("<<<TITOLO>>>", { TITOLO: "\\$ 100 $& x" });
    expect(out).toBe("\\$ 100 $& x");
  });

  it("does not re-scan substituted content", () => {
    const out = fillTemplate("<<<TITOLO>>>", { TITOLO: "<<<CLIENTE>>>" });
    expect(out).toBe("<<<CLIENTE>>>");
  });
});