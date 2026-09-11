import { NextResponse } from "next/server";

import { getCliente } from "@/lib/storage/clienti";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Since Next 15 the dynamic params arrive as a Promise. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cliente = await getCliente(id);

  return cliente
    ? NextResponse.json(cliente)
    : NextResponse.json({ errore: "Cliente non trovato" }, { status: 404 });
}