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
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-8">
          <DynamicForm fields={preventivoFields} />

          {errore && (
            <p className="whitespace-pre-line border-l-2 border-red-700 bg-red-50 px-3 py-2 text-sm text-red-900">
              {errore}
            </p>
          )}

          <button
            type="button"
            onClick={form.handleSubmit(scarica)}
            disabled={inCorso}
            className="rounded-sm bg-teal px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-deep focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 disabled:opacity-40"
          >
            {inCorso ? "Generazione in corso" : "Genera PDF"}
          </button>
        </div>

        <div className="lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)]">
          <PdfPreview {...anteprima} />
        </div>
      </div>
    </FormProvider>
  );
}