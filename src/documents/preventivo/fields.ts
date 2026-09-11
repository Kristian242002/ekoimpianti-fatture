/**
 * Presentation metadata for the form. Validation lives entirely in schema.ts:
 * this file only says how each field is shown, never what is valid.
 */
export type FieldDescriptor = {
  section: string;
  /** Half-width fields pair up on one row; the rest take the full width. */
  span?: "half" | "full";
} & (
  | { kind: "text" | "date"; name: string; label: string; placeholder?: string }
  | { kind: "textarea"; name: string; label: string; rows?: number }
  | { kind: "amount"; name: string; label: string }
  | { kind: "righe"; name: "righe"; label: string }
  | { kind: "note"; name: "note"; label: string }
);

export const preventivoFields: FieldDescriptor[] = [
  { section: "Documento", kind: "text", name: "titolo", label: "Titolo" },
  { section: "Documento", kind: "text", name: "tipologia", label: "Tipologia", placeholder: "Ristrutturazione completa", span: "half" },
  { section: "Documento", kind: "date", name: "data", label: "Data", span: "half" },

  { section: "Cliente", kind: "text", name: "cliente", label: "Nome o ragione sociale" },
  { section: "Cliente", kind: "text", name: "indirizzoIntervento", label: "Indirizzo intervento", span: "half" },
  { section: "Cliente", kind: "text", name: "localita", label: "Località", placeholder: "Montebello Vicentino (VI)", span: "half" },

  { section: "Lavoro", kind: "textarea", name: "oggetto", label: "Oggetto", rows: 2 },

  { section: "Quadro economico", kind: "righe", name: "righe", label: "Righe" },
  { section: "Quadro economico", kind: "text", name: "etichettaTotale", label: "Dicitura del totale", span: "half" },
  { section: "Quadro economico", kind: "amount", name: "totale", label: "Totale", span: "half" },

  { section: "Note e condizioni", kind: "note", name: "note", label: "Note" },
];