import { escapeLatex } from "@/lib/latex/escape";
import type { Preventivo, Riga } from "./schema";

const AMOUNT = new Intl.NumberFormat("it-IT", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping:"always",
});

/** Produces LaTeX, so it must never be passed through escapeLatex afterwards. */
function formatImporto(value: number): string {
  return `\\texteuro{}~${AMOUNT.format(value)}`;
}

/** Manual split instead of `new Date(iso)`: parsing an ISO date yields UTC
 *  midnight, which shifts to the previous day in some timezones. */
function formatData(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function buildRighe(righe: Riga[]): string {
  return righe
    .map((riga, index) => {
      // The first column is already \bfseries via the column type.
      const voce = escapeLatex(riga.voce || `Voce ${index + 1}`);
      const descrizione = escapeLatex(riga.descrizione);
      return `${voce} & ${descrizione} & ${formatImporto(riga.importo)} \\\\`;
    })
    .join("\n");
}

/** Emits the whole section, or nothing: an empty `itemize` is a fatal
 *  LaTeX error, and the user is allowed to remove every note. */
function buildNote(note: string[]): string {
  if (note.length === 0) return "";

  const items = note.map((n) => `\\item ${escapeLatex(n)}`).join("\n");
  return [
    "\\vspace{5mm}",
    "\\textbf{Note e condizioni}",
    "\\begin{itemize}",
    items,
    "\\end{itemize}",
  ].join("\n");
}

export function buildValues(data: Preventivo): Record<string, string> {
  return {
    TITOLO: escapeLatex(data.titolo),
    TIPOLOGIA: escapeLatex(data.tipologia),
    LOCALITA: escapeLatex(data.localita),
    CLIENTE: escapeLatex(data.cliente),
    INDIRIZZO_INTERVENTO: escapeLatex(data.indirizzoIntervento),
    DATA: formatData(data.data),
    OGGETTO: escapeLatex(data.oggetto, { multiline: true }),
    RIGHE: buildRighe(data.righe),
    ETICHETTA_TOTALE: escapeLatex(data.etichettaTotale),
    TOTALE: formatImporto(data.totale),
    NOTE: buildNote(data.note),
  };
}

const PLACEHOLDER = /<<<([A-Z_]+)>>>/g;

/**
 * Single-pass substitution. Two reasons for the function replacer:
 *  - escaped data contains `\$`, and `$&` / `$'` are special in a string
 *    replacement — a function argument is taken literally;
 *  - substituted content is never re-scanned, so data can never inject
 *    another placeholder.
 * Throws on any placeholder the caller did not provide: a silent empty
 * field would ship a PDF with a hole in it.
 */
export function fillTemplate(
  template: string,
  values: Record<string, string>,
): string {
  const unknown = new Set<string>();

  const output = template.replace(PLACEHOLDER, (_match, key: string) => {
    if (!(key in values)) {
      unknown.add(key);
      return "";
    }
    return values[key];
  });

  if (unknown.size > 0) {
    throw new Error(
      `Template contains unmapped placeholders: ${[...unknown].join(", ")}`,
    );
  }
  return output;
}

export function renderPreventivoTex(
  template: string,
  data: Preventivo,
): string {
  return fillTemplate(template, buildValues(data));
}