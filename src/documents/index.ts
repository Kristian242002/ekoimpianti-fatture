import { preventivo } from "./preventivo";
import { erase, type AnyDocumentType } from "./types";

/**
 * The registry. Adding a third document means adding one entry here:
 * neither the API routes nor the form components change.
 */
const REGISTRY: Record<string, AnyDocumentType> = {
  [preventivo.id]: erase(preventivo),
};

export function getDocumentType(id: string): AnyDocumentType | undefined {
  return Object.hasOwn(REGISTRY, id) ? REGISTRY[id] : undefined;
}

/** Safe to send to the browser: no schema, no render function. */
export function listDocumentTypes(): Array<{ id: string; label: string }> {
  return Object.values(REGISTRY).map(({ id, label }) => ({ id, label }));
}