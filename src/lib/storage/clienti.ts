import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import { DATA_DIR } from "@/lib/env";
import { atomicWrite } from "./atomic-write";
import {
  clienteInputSchema,
  clienteSchema,
  type Cliente,
  type ClienteInput,
} from "./cliente-schema";

const DIR = join(DATA_DIR, "clienti");

/** `Mario Rossi & C. s.n.c.` → `mario-rossi-c-s-n-c`. Also the filename, so
 *  it must never contain a path separator or a leading dot. */
export function slug(nome: string): string {
  return (
    nome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "cliente"
  );
}

function path(id: string): string {
  // Defence in depth: a crafted id must not escape the data directory.
  if (id !== slug(id)) throw new Error(`Identificativo cliente non valido: ${id}`);
  return join(DIR, `${id}.json`);
}

export async function listClienti(): Promise<Cliente[]> {
  let files: string[];
  try {
    files = await readdir(DIR);
  } catch {
    return []; // No directory yet: no clients yet.
  }

  const clienti = await Promise.all(
    files
      .filter((file) => file.endsWith(".json"))
      .map(async (file) => {
        try {
          const raw = await readFile(join(DIR, file), "utf8");
          const parsed = clienteSchema.safeParse(JSON.parse(raw));
          return parsed.success ? parsed.data : null;
        } catch {
          // One malformed file must not break the whole list.
          return null;
        }
      }),
  );

  return clienti
    .filter((cliente): cliente is Cliente => cliente !== null)
    .sort((a, b) => a.nome.localeCompare(b.nome, "it"));
}

export async function getCliente(id: string): Promise<Cliente | null> {
  try {
    const raw = await readFile(path(id), "utf8");
    const parsed = clienteSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Create or update by name. Two different clients with the same name get a
 * numeric suffix; the same client saved twice updates in place, which is what
 * makes the silent upsert on generation safe.
 */
export async function upsertCliente(input: ClienteInput): Promise<Cliente> {
  const dati = clienteInputSchema.parse(input);
  const now = new Date().toISOString();

  const base = slug(dati.nome);
  let id = base;

  for (let suffix = 2; ; suffix++) {
    const existing = await getCliente(id);
    if (!existing) break;
    // Same name and same address: treat as the same client, update it.
    if (existing.nome === dati.nome && existing.indirizzo === dati.indirizzo) {
      const aggiornato: Cliente = { ...existing, ...dati, aggiornatoIl: now };
      await atomicWrite(path(id), JSON.stringify(aggiornato, null, 2));
      return aggiornato;
    }
    id = `${base}-${suffix}`;
  }

  const cliente: Cliente = { ...dati, id, creatoIl: now, aggiornatoIl: now };
  await atomicWrite(path(id), JSON.stringify(cliente, null, 2));
  return cliente;
}