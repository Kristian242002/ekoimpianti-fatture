import type { DocumentType } from "../types";
import { preventivoFilename, renderPreventivo } from "./render";
import { preventivoSchema, type Preventivo } from "./schema";

export const preventivo: DocumentType<Preventivo> = {
  id: "preventivo",
  label: "Preventivo",
  schema: preventivoSchema,
  engine: "latex",
  render: renderPreventivo,
  filename: preventivoFilename,
};