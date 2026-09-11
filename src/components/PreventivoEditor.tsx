"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { PdfPreview } from "./PdfPreview";
import { usePdfPreview } from "./usePdfPreview";
import { preventivoFields } from "@/documents/preventivo/fields";
import {
  preventivoSchema,
  type Preventivo,
  type PreventivoInput,
} from "@/documents/preventivo/schema";
import { DynamicForm } from "./DynamicForm";
import { NOTE_DI_DEFAULT } from "@/documents/preventivo/schema";

/** Parsing an empty-ish object applies every `.default()` in the schema, so the
 *  form starts with the standard notes and total label already filled in. */
function initialValues(): Preventivo {
  const today = new Date().toISOString().slice(0, 10);
  return preventivoSchema.parse({
    titolo: "Preventivo impianto elettrico",
    tipologia: "",
    localita: "",
    cliente: "",
    indirizzoIntervento: "",
    data: today,
    oggetto: "",
    righe: [{ voce: "", descrizione: "", importo: 0 }],
    totale: 0,
  });
}

export function PreventivoEditor() {
  const [errore, setErrore] = useState<string | null>(null);
  const [inCorso, setInCorso] = useState(false);

  // Three generics because the schema has defaults: the form holds the input
  // shape (optional fields), the submit handler receives the parsed output.
  const form = useForm<PreventivoInput, unknown, Preventivo>({
    resolver: zodResolver(preventivoSchema),
    defaultValues: initialValues(),
    mode: "onBlur",
  });
  // useWatch instead of form.watch(): it subscribes without re-rendering the
  // whole form tree on every keystroke.
  const dati = useWatch({ control: form.control });
  const anteprima = usePdfPreview("preventivo", dati);

  async function scarica(dati: Preventivo) {
    setErrore(null);
    setInCorso(true);
    try {
      const response = await fetch("/api/genera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "preventivo", dati }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setErrore(body?.errore ?? `Errore ${response.status}`);
        return;
      }

      // The filename comes from the server, which owns the naming rule.
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const nome =
        /filename="([^"]+)"/.exec(disposition)?.[1] ?? "preventivo.pdf";

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = nome;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setErrore("Impossibile contattare il server");
    } finally {
      setInCorso(false);
    }
  }
function initialValues(): PreventivoInput {
  return {
    titolo: "Preventivo impianto elettrico",
    tipologia: "",
    localita: "",
    cliente: "",
    indirizzoIntervento: "",
    data: new Date().toISOString().slice(0, 10),
    oggetto: "",
    righe: [{ voce: "", descrizione: "", importo: 0 }],
    etichettaTotale: "Totale complessivo (IVA inclusa)",
    totale: 0,
    note: NOTE_DI_DEFAULT,
  };
}
   return (
    <FormProvider {...form}>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <DynamicForm fields={preventivoFields} />

          {errore && (
            <p className="whitespace-pre-line rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
              {errore}
            </p>
          )}

          <button
            type="button"
            onClick={form.handleSubmit(scarica)}
            disabled={inCorso}
            className="rounded bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
          >
            {inCorso ? "Generazione in corso…" : "Genera PDF"}
          </button>
        </div>

        <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
          <PdfPreview {...anteprima} />
        </div>
      </div>
    </FormProvider>
  );
}