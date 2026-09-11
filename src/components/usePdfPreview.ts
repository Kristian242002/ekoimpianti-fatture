"use client";

import { useEffect, useRef, useState } from "react";

/** Cheap non-cryptographic hash (FNV-1a). Only used to tell "changed" from
 *  "unchanged", so collisions are irrelevant and speed matters. */
function hash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

export type PreviewState = {
  url: string | null;
  loading: boolean;
  errore: string | null;
};

export function usePdfPreview(
  tipo: string,
  dati: unknown,
  delayMs = 600,
): PreviewState {
  const [state, setState] = useState<PreviewState>({
    url: null,
    loading: false,
    errore: null,
  });

  // Refs, not state: changing them must never trigger a render.
  const lastHash = useRef<string | null>(null);
  const inFlight = useRef<AbortController | null>(null);
  const currentUrl = useRef<string | null>(null);

  const payload = JSON.stringify({ tipo, dati });

  useEffect(() => {
    const digest = hash(payload);
    if (digest === lastHash.current) return;

    const timer = setTimeout(async () => {
      // Cancel the previous request: without this, a slow early response can
      // land after a fast later one and overwrite the newer preview.
      inFlight.current?.abort();
      const controller = new AbortController();
      inFlight.current = controller;

      setState((previous) => ({ ...previous, loading: true }));

      try {
        const response = await fetch("/api/anteprima", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          signal: controller.signal,
        });

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          // Keep the last good preview on screen; only report the reason.
          setState((previous) => ({
            ...previous,
            loading: false,
            errore: body?.errore ?? `Errore ${response.status}`,
          }));
          return;
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        // Revoke the previous object URL or every keystroke leaks a PDF.
        if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
        currentUrl.current = url;
        lastHash.current = digest;

        setState({ url, loading: false, errore: null });
      } catch (cause) {
        if ((cause as Error).name === "AbortError") return;
        setState((previous) => ({
          ...previous,
          loading: false,
          errore: "Anteprima non disponibile",
        }));
      }
    }, delayMs);

    return () => clearTimeout(timer);
  }, [payload, delayMs]);

  // Unmount: drop the in-flight request and the last object URL.
  useEffect(
    () => () => {
      inFlight.current?.abort();
      if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
    },
    [],
  );

  return state;
}