import { z } from "zod";

/**
 * Preventivo schema.
 * One source of truth: drives the generated form (React Hook Form + zodResolver)
 * and validates the payload server-side before it reaches the LaTeX renderer.
 *
 * Domain field names stay Italian (they mirror the JSON files in dati/ and the
 * wording on the printed document); everything else is English.
 */

const NOTE_DI_DEFAULT = [
  "La presente costituisce una \\textbf{stima preliminare non vincolante}, redatta sulla base delle informazioni disponibili al momento.",
];

/** Free text that ends up inside the .tex — length-capped as a compile-safety measure. */
const testo = (max: number) => z.string().trim().min(1).max(max);

export const rigaSchema = z.object({
  /** Left column. Empty means "Voce N", numbered by the renderer. */
  voce: z.string().trim().max(60).default(""),
  descrizione: testo(600),
  /** Euro. Formatted it-IT by the renderer, never by the form. */
  importo: z.number().nonnegative().max(1_000_000),
});

export const preventivoSchema = z.object({
  titolo: testo(120),
  tipologia: testo(200),
  localita: testo(120),
  cliente: testo(120),
  indirizzoIntervento: testo(200),
  /** ISO date. Explicit, never \today: the output must be reproducible. */
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  oggetto: testo(800),

  righe: z.array(rigaSchema).min(1).max(40),

  etichettaTotale: testo(80).default("Totale complessivo (IVA inclusa)"),
  /** Typed by hand, on purpose: no automatic sum, no VAT computation. */
  totale: z.number().nonnegative().max(1_000_000),

  note: z.array(testo(500)).max(20).default(NOTE_DI_DEFAULT),
});

export type Riga = z.infer<typeof rigaSchema>;
export type Preventivo = z.infer<typeof preventivoSchema>;