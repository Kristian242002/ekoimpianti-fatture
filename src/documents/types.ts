import type { ZodType } from "zod";
import type { FieldDescriptor } from "./preventivo/fields";

/** Per-call rendering options. `passes` exists for the live preview, which
 *  trades a correct page count for half the compile time. */
export type RenderOptions = { passes?: number };

/** Client identity a document carries, for the silent upsert on generation. */
export type ClienteRef = { nome: string; indirizzo: string };

/**
 * A document type is the sum of three things: which fields exist (schema),
 * how they become a PDF (render), and how it is labelled in the UI.
 * The API routes know only this interface — never LaTeX, never pdf-lib.
 */
export type DocumentType<T = unknown> = {
  id: string;
  label: string;
  schema: ZodType<T>;
  /** Presentation metadata only: what is valid lives in the schema. */
  fields: FieldDescriptor[];
  engine: "latex" | "pdf-form";
  render: (data: T, options?: RenderOptions) => Promise<Buffer>;
  /** Filename shown to the user, without extension. */
  filename: (data: T) => string;
  /** Undefined where the document has no client attached. */
  cliente?: (data: T) => ClienteRef | null;
};

/**
 * Type-erased view of a DocumentType, for code that handles any document
 * without knowing which one. `parse` replaces direct access to `schema`:
 * it validates unknown input and hands back an opaque token that only this
 * document's own render and filename will accept.
 */
export type AnyDocumentType = {
  id: string;
  label: string;
  engine: DocumentType["engine"];
  fields: FieldDescriptor[];
  parse: (input: unknown) =>
    | { success: true; data: ParsedDocument }
    | { success: false; issues: unknown[] };
  render: (data: ParsedDocument, options?: RenderOptions) => Promise<Buffer>;
  filename: (data: ParsedDocument) => string;
  cliente?: (data: ParsedDocument) => ClienteRef | null;
};

/** Opaque: only produced by parse, only consumed by render and filename. */
export type ParsedDocument = { readonly __parsed: unique symbol };

/** Erases the generic parameter. The casts are confined here, and they are
 *  sound because parse is the only way to obtain a ParsedDocument. */
export function erase<T>(documentType: DocumentType<T>): AnyDocumentType {
  const cliente = documentType.cliente;

  return {
    id: documentType.id,
    label: documentType.label,
    engine: documentType.engine,
    fields: documentType.fields,
    parse: (input) => {
      const result = documentType.schema.safeParse(input);
      return result.success
        ? { success: true, data: result.data as unknown as ParsedDocument }
        : { success: false, issues: result.error.issues };
    },
    render: (data, options) =>
      documentType.render(data as unknown as T, options),
    filename: (data) => documentType.filename(data as unknown as T),
    cliente: cliente ? (data) => cliente(data as unknown as T) : undefined,
  };
}