import type { DocumentType } from "../types";
import { preventivoFields } from "./fields";
import { preventivoFilename, renderPreventivo } from "./render";
import { preventivoSchema, type Preventivo } from "./schema";

export const preventivo: DocumentType<Preventivo> = {
  id: "preventivo",
  label: "Preventivo",
  schema: preventivoSchema,
  fields: preventivoFields,
  engine: "latex",
  render: renderPreventivo,
  filename: preventivoFilename,
  cliente: (data) => ({
    nome: data.cliente,
    indirizzo: data.indirizzoIntervento,
  }),
};