import { NextResponse } from "next/server";

import { getDocumentType } from "@/documents";
import { LatexCompileError } from "@/lib/latex/compile";

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
    return NextResponse.json({ errore: "Tipo sconosciuto" }, { status: 400 });
  }

  const parsed = documentType.parse(dati);
  if (!parsed.success) {
    // While typing, an invalid form is the normal state, not an error worth
    // shouting about: the client keeps showing the last good preview.
    return NextResponse.json(
      { errore: "In attesa di dati validi", campi: parsed.issues },
      { status: 422 },
    );
  }

  try {
    // Single pass: \pageref{LastPage} will print "??" in the footer, which is
    // an acceptable trade for halving the wait on every keystroke.
    const pdf = await documentType.render(parsed.data, { passes: 1 });

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "no-store",
      },
    });
  } catch (cause) {
    if (cause instanceof LatexCompileError) {
      return NextResponse.json(
        { errore: cause.message, dettagli: cause.errors },
        { status: 422 },
      );
    }
    console.error("preview failed", cause);
    return NextResponse.json({ errore: "Errore interno" }, { status: 500 });
  }
}