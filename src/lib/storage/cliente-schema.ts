import { z } from "zod";

export const clienteSchema = z.object({
  id: z.string().min(1),
  nome: z.string().trim().min(1).max(120),
  indirizzo: z.string().trim().max(200).default(""),
  comune: z.string().trim().max(120).default(""),
  cap: z.string().trim().max(10).default(""),
  provincia: z.string().trim().max(4).default(""),
  codiceFiscale: z.string().trim().max(16).default(""),
  partitaIva: z.string().trim().max(11).nullable().default(null),
  telefono: z.string().trim().max(30).default(""),
  email: z.string().trim().max(120).default(""),
  creatoIl: z.string(),
  aggiornatoIl: z.string(),
});

/** What the caller supplies: identity and timestamps are set by the store. */
export const clienteInputSchema = clienteSchema.omit({
  id: true,
  creatoIl: true,
  aggiornatoIl: true,
});

export type Cliente = z.infer<typeof clienteSchema>;
export type ClienteInput = z.input<typeof clienteInputSchema>;