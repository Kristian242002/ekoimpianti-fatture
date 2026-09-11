import { NextResponse } from "next/server";

import { clienteInputSchema } from "@/lib/storage/cliente-schema";
import { listClienti, upsertCliente } from "@/lib/storage/clienti";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await listClienti());
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ errore: "JSON non valido" }, { status: 400 });
  }

  const parsed = clienteInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errore: "Dati cliente non validi", campi: parsed.error.issues },
      { status: 422 },
    );
  }

  return NextResponse.json(await upsertCliente(parsed.data));
}