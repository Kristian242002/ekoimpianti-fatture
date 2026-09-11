import { NextResponse } from "next/server";

import { getDocumentType } from "@/documents";
import { LatexCompileError } from "@/lib/latex/compile";
import { upsertCliente } from "@/lib/storage/clienti";

/** pdflatex is a child process: this route can never be static or edge. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ errore: "JSON non valido" }, { status: 400 });
  }

  const { tipo, dati } = (body ?? {}) as { tipo?: string; dati?: unknown };

  const documentType = getDocumentType(tipo ?? "");
  if (!documentType) {
    return NextResponse.json(
      { errore: `Tipo di documento sconosciuto: ${tipo}` },
      { status: 400 },
    );
  }

  // Same schema the form uses: validation logic is never duplicated.
  const parsed = documentType.parse(dati);
  if (!parsed.success) {
    return NextResponse.json(
      { errore: "Dati non validi", campi: parsed.issues },
      { status: 422 },
    );
  }

  try {
    // Silent upsert: the client record is kept up to date as a side effect of
    // generating, so the user never has to remember to save an address book
    // entry. Failure here must not block the PDF.
    const anagrafica = documentType.cliente?.(parsed.data);
    if (anagrafica?.nome) {
      await upsertCliente(anagrafica).catch((cause) =>
        console.error("client upsert failed", cause),
      );
    }

    const pdf = await documentType.render(parsed.data);

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${documentType.filename(parsed.data)}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (cause) {
    // A compile failure is the user's data being wrong, not a server fault:
    // 422 with the parsed message, never an anonymous 500.
    if (cause instanceof LatexCompileError) {
      return NextResponse.json(
        { errore: cause.message, dettagli: cause.errors },
        { status: 422 },
      );
    }
    console.error("render failed", cause);
    return NextResponse.json({ errore: "Errore interno" }, { status: 500 });
  }
}