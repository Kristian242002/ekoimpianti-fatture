"use client";

import type { FieldDescriptor } from "@/documents/preventivo/fields";
import { useFormContext } from "react-hook-form";
import { NoteEditor } from "./NoteEditor";
import { RigheEditor } from "./RigheEditor";

const INPUT =
  "w-full rounded-sm border border-line bg-surface px-2.5 py-1.5 text-sm text-ink " +
  "placeholder:text-muted/50 outline-none transition-colors " +
  "focus:border-gold focus:ring-2 focus:ring-gold/25";

function Field({ descriptor }: { descriptor: FieldDescriptor }) {
  const { register, formState } = useFormContext();
  const error = formState.errors[descriptor.name] as { message?: string } | undefined;

  if (descriptor.kind === "righe") return <RigheEditor />;
  if (descriptor.kind === "note") return <NoteEditor />;

  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium tracking-wide text-muted">
        {descriptor.label}
      </span>

      {descriptor.kind === "textarea" ? (
        <textarea
          {...register(descriptor.name)}
          rows={descriptor.rows ?? 3}
          className={`${INPUT} resize-y`}
        />
      ) : (
        <input
          {...register(
            descriptor.name,
            // Number inputs hand back strings; z.number() would reject them.
            descriptor.kind === "amount" ? { valueAsNumber: true } : undefined,
          )}
          type={
            descriptor.kind === "date" ? "date"
            : descriptor.kind === "amount" ? "number"
            : "text"
          }
          step={descriptor.kind === "amount" ? "0.01" : undefined}
          placeholder={"placeholder" in descriptor ? descriptor.placeholder : undefined}
          className={`${INPUT} ${descriptor.kind === "amount" ? "tabular text-right" : ""}`}
        />
      )}

      {error?.message && (
        <span className="block text-xs text-red-700">{error.message}</span>
      )}
    </label>
  );
}

export function DynamicForm({ fields }: { fields: FieldDescriptor[] }) {
  // Preserve declaration order while grouping: the descriptor list is the
  // single source of truth for both what is shown and in what order.
  const sections = fields.reduce<Array<{ name: string; fields: FieldDescriptor[] }>>(
    (accumulator, descriptor) => {
      const last = accumulator.at(-1);
      if (last?.name === descriptor.section) last.fields.push(descriptor);
      else accumulator.push({ name: descriptor.section, fields: [descriptor] });
      return accumulator;
    },
    [],
  );

  return (
    <div className="space-y-9">
      {sections.map((section) => (
        <section key={section.name} className="space-y-4">
          <h2 className="border-b border-teal/25 pb-1.5 text-sm font-semibold text-teal">
            {section.name}
          </h2>

          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            {section.fields.map((descriptor) => (
              <div
                key={descriptor.name}
                className={descriptor.span === "half" ? "col-span-1" : "col-span-2"}
              >
                <Field descriptor={descriptor} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}