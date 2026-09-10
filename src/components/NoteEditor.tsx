"use client";

import { useFormContext, useWatch } from "react-hook-form";

/**
 * Plain state instead of useFieldArray: the notes are a string[], and
 * useFieldArray keys its rows off object identity — on an array of
 * primitives its internal ids break as soon as one is removed.
 */
export function NoteEditor({ label }: { label: string }) {
  const { control, setValue } = useFormContext();
  const note: string[] = useWatch({ control, name: "note" }) ?? [];

  const update = (next: string[]) =>
    setValue("note", next, { shouldValidate: true, shouldDirty: true });

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-slate-700">{label}</legend>

      {note.map((testo, index) => (
        <div key={index} className="flex gap-2">
          <textarea
            value={testo}
            rows={2}
            onChange={(event) =>
              update(note.map((n, i) => (i === index ? event.target.value : n)))
            }
            className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={() => update(note.filter((_, i) => i !== index))}
            className="text-slate-400 hover:text-red-600"
            aria-label="Rimuovi nota"
          >
            ✕
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => update([...note, ""])}
        className="text-sm text-teal-700 hover:underline"
      >
        + Aggiungi nota
      </button>
    </fieldset>
  );
}