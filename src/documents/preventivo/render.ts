import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { TEMPLATES_DIR } from "@/lib/env";
import { compileLatex } from "@/lib/latex/compile";
import { renderPreventivoTex } from "./fill";
import type { Preventivo } from "./schema";

const DIR = join(TEMPLATES_DIR, "preventivo");

export async function renderPreventivo(data: Preventivo): Promise<Buffer> {
  const template = await readFile(join(DIR, "template.tex"), "utf8");

  return compileLatex(renderPreventivoTex(template, data), {
    assets: [join(DIR, "logo.png")],
  });
}

/** `2026-09-10-mario-rossi-preventivo` — sortable, no spaces, no accents. */
export function preventivoFilename(data: Preventivo): string {
  const slug = data.cliente
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${data.data}-${slug || "cliente"}-preventivo`;
}