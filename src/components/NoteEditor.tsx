"use client";

import { useFormContext, useWatch } from "react-hook-form";

/**
 * Plain state instead of useFieldArray: the notes are a string[], and
 * useFieldArray keys its rows off object identity — on an array of
 * primitives its internal ids break as soon as one is removed.
 */
export function NoteEditor() {
  const { control, setValue } = useFormContext();
  const note: string[] = useWatch({ control, name: "note" }) ?? [];

  const update = (next: string[]) =>
    setValue("note", next, { shouldValidate: true, shouldDirty: true });

  return (
    <div className="space-y-2">
      {note.length === 0 && (
        <p className="text-sm text-muted">
          Nessuna nota. Il documento uscirà senza la sezione condizioni.
        </p>
      )}

      {note.map((testo, index) => (
        <div key={index} className="grid grid-cols-[1fr_1.75rem] gap-2">
          <textarea
            value={testo}
            rows={2}
            onChange={(event) =>
              update(note.map((n, i) => (i === index ? event.target.value : n)))
            }
            className="resize-y rounded-sm border border-line bg-surface px-2.5 py-1.5 text-sm leading-relaxed text-ink outline-none transition-colors focus:border-gold focus:ring-2 focus:ring-gold/25"
          />
          <button
            type="button"
            onClick={() => update(note.filter((_, i) => i !== index))}
            className="self-start pt-2 text-muted/60 transition-colors hover:text-red-700"
            aria-label={`Rimuovi nota ${index + 1}`}
          >
            ✕
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => update([...note, ""])}
        className="text-sm font-medium text-teal transition-colors hover:text-teal-deep"
      >
        Aggiungi nota
      </button>
    </div>
  );
}