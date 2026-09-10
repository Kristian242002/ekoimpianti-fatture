"use client";

import { useFieldArray, useFormContext } from "react-hook-form";

export function RigheEditor({ label }: { label: string }) {
  const { register, control, formState } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: "righe" });

  const errors = formState.errors.righe as
    | Array<Record<string, { message?: string }>>
    | undefined;

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-slate-700">{label}</legend>

      {fields.map((field, index) => (
        <div key={field.id} className="grid grid-cols-12 gap-2">
          <input
            {...register(`righe.${index}.voce`)}
            placeholder={`Voce ${index + 1}`}
            className="col-span-3 rounded border border-slate-300 px-2 py-1 text-sm"
          />
          <input
            {...register(`righe.${index}.descrizione`)}
            placeholder="Descrizione"
            className="col-span-6 rounded border border-slate-300 px-2 py-1 text-sm"
          />
          {/* valueAsNumber: without it the input hands Zod a string and
              z.number() rejects every row. */}
          <input
            {...register(`righe.${index}.importo`, { valueAsNumber: true })}
            type="number"
            step="0.01"
            placeholder="0,00"
            className="col-span-2 rounded border border-slate-300 px-2 py-1 text-right text-sm"
          />
          <button
            type="button"
            onClick={() => remove(index)}
            disabled={fields.length === 1}
            className="col-span-1 rounded text-slate-400 hover:text-red-600 disabled:opacity-30"
            aria-label="Rimuovi riga"
          >
            ✕
          </button>

          {errors?.[index] && (
            <p className="col-span-12 text-xs text-red-600">
              {Object.values(errors[index] ?? {})
                .map((e) => e?.message)
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={() => append({ voce: "", descrizione: "", importo: 0 })}
        className="text-sm text-teal-700 hover:underline"
      >
        + Aggiungi riga
      </button>
    </fieldset>
  );
}