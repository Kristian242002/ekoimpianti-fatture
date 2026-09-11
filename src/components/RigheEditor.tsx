"use client";

import { useFieldArray, useFormContext } from "react-hook-form";

const CELL =
  "rounded-sm border border-line bg-surface px-2.5 py-1.5 text-sm text-ink " +
  "placeholder:text-muted/50 outline-none transition-colors " +
  "focus:border-gold focus:ring-2 focus:ring-gold/25";

export function RigheEditor() {
  const { register, control, formState } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: "righe" });

  const errors = formState.errors.righe as
    | Array<Record<string, { message?: string }>>
    | undefined;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_2fr_7rem_1.75rem] gap-2 text-xs text-muted">
        <span>Voce</span>
        <span>Descrizione</span>
        <span className="text-right">Importo</span>
        <span />
      </div>

      {fields.map((field, index) => (
        <div key={field.id} className="space-y-1">
          <div className="grid grid-cols-[1fr_2fr_7rem_1.75rem] gap-2">
            <input
              {...register(`righe.${index}.voce`)}
              placeholder={`Voce ${index + 1}`}
              className={CELL}
            />
            <input
              {...register(`righe.${index}.descrizione`)}
              className={CELL}
            />
            {/* valueAsNumber: without it the input hands Zod a string and
                z.number() rejects every row. */}
            <input
              {...register(`righe.${index}.importo`, { valueAsNumber: true })}
              type="number"
              step="0.01"
              className={`${CELL} tabular text-right`}
            />
            <button
              type="button"
              onClick={() => remove(index)}
              disabled={fields.length === 1}
              className="rounded-sm text-muted/60 transition-colors hover:text-red-700 disabled:opacity-25"
              aria-label={`Rimuovi riga ${index + 1}`}
            >
              ✕
            </button>
          </div>

          {errors?.[index] && (
            <p className="text-xs text-red-700">
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
        className="text-sm font-medium text-teal transition-colors hover:text-teal-deep"
      >
        Aggiungi riga
      </button>
    </div>
  );
}