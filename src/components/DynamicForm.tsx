"use client";

import type { FieldDescriptor } from "@/documents/preventivo/fields";
import { useFormContext } from "react-hook-form";
import { NoteEditor } from "./NoteEditor";
import { RigheEditor } from "./RigheEditor";

const INPUT =
  "w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-teal-600 focus:outline-none";

function Field({ descriptor }: { descriptor: FieldDescriptor }) {
  const { register, formState } = useFormContext();
  const error = formState.errors[descriptor.name] as
    | { message?: string }
    | undefined;

  if (descriptor.kind === "righe") return <RigheEditor label={descriptor.label} />;
  if (descriptor.kind === "note") return <NoteEditor label={descriptor.label} />;

  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-slate-700">
        {descriptor.label}
      </span>

      {descriptor.kind === "textarea" ? (
        <textarea
          {...register(descriptor.name)}
          rows={descriptor.rows ?? 3}
          className={INPUT}
        />
      ) : (
        <input
          {...register(
            descriptor.name,
            // Number inputs hand back strings; z.number() would reject them.
            descriptor.kind === "amount" ? { valueAsNumber: true } : undefined,
          )}
          type={
            descriptor.kind === "date"
              ? "date"
              : descriptor.kind === "amount"
                ? "number"
                : "text"
          }
          step={descriptor.kind === "amount" ? "0.01" : undefined}
          placeholder={"placeholder" in descriptor ? descriptor.placeholder : undefined}
          className={INPUT}
        />
      )}

      {error?.message && (
        <span className="block text-xs text-red-600">{error.message}</span>
      )}
    </label>
  );
}

export function DynamicForm({ fields }: { fields: FieldDescriptor[] }) {
  return (
    <div className="space-y-4">
      {fields.map((descriptor) => (
        <Field key={descriptor.name} descriptor={descriptor} />
      ))}
    </div>
  );
}