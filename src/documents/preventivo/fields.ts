/**
 * Presentation metadata for the form. Validation lives entirely in schema.ts:
 * this file only says how each field is shown, never what is valid.
 */
export type FieldDescriptor =
  | { kind: "text" | "date"; name: string; label: string; placeholder?: string }
  | { kind: "textarea"; name: string; label: string; rows?: number }
  | { kind: "amount"; name: string; label: string }
  | { kind: "righe"; name: "righe"; label: string }
  | { kind: "note"; name: "note"; label: string };

export const preventivoFields: FieldDescriptor[] = [
  { kind: "text", name: "titolo", label: "Titolo" },
  { kind: "text", name: "tipologia", label: "Tipologia", placeholder: "Ristrutturazione completa" },
  { kind: "text", name: "localita", label: "Località", placeholder: "Montebello Vicentino (VI)" },
  { kind: "text", name: "cliente", label: "Cliente" },
  { kind: "text", name: "indirizzoIntervento", label: "Indirizzo intervento" },
  { kind: "date", name: "data", label: "Data" },
  { kind: "textarea", name: "oggetto", label: "Oggetto", rows: 2 },
  { kind: "righe", name: "righe", label: "Quadro economico" },
  { kind: "text", name: "etichettaTotale", label: "Etichetta totale" },
  { kind: "amount", name: "totale", label: "Totale" },
  { kind: "note", name: "note", label: "Note e condizioni" },
];