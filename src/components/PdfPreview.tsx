"use client";

import { useEffect, useRef } from "react";
import type { PreviewState } from "./usePdfPreview";

export function PdfPreview({ url, loading, errore }: PreviewState) {
  const frame = useRef<HTMLIFrameElement>(null);
  const scroll = useRef(0);

  /**
   * Restoring the scroll position is what separates a usable preview from a
   * demo: without it every keystroke throws the reader back to page one.
   *
   * Chromium's built-in PDF viewer lives in a cross-origin child document, so
   * its scroll offset cannot be read. The workaround is the URL fragment:
   * #page=N is honoured on load, and the current page is tracked from the
   * previous render rather than measured — hence the page counter below.
   */
  useEffect(() => {
    const element = frame.current;
    if (!element || !url) return;

    const restore = () => {
      // The viewer needs a beat after load before the fragment takes effect.
      if (scroll.current > 1) {
        element.contentWindow?.location.replace(`${url}#page=${scroll.current}`);
      }
    };
    element.addEventListener("load", restore, { once: true });
    return () => element.removeEventListener("load", restore);
  }, [url]);

  return (
    <div className="relative h-full min-h-[600px] rounded border border-slate-300 bg-slate-100">
      {url ? (
        <iframe
          ref={frame}
          src={`${url}#toolbar=1&navpanes=0`}
          title="Anteprima documento"
          className="h-full w-full rounded"
        />
      ) : (
        <p className="flex h-full items-center justify-center text-sm text-slate-500">
          Compila il form per vedere l&apos;anteprima
        </p>
      )}

      {loading && (
        <span className="absolute right-3 top-3 rounded bg-slate-900/75 px-2 py-1 text-xs text-white">
          Aggiornamento…
        </span>
      )}

      {errore && (
        <span className="absolute bottom-3 left-3 right-3 rounded bg-amber-100 px-2 py-1 text-xs text-amber-900">
          {errore}
        </span>
      )}

      <label className="absolute bottom-3 right-3 flex items-center gap-1 rounded bg-white/90 px-2 py-1 text-xs text-slate-600">
        Pagina
        <input
          type="number"
          min={1}
          defaultValue={1}
          onChange={(event) => {
            scroll.current = Number(event.target.value) || 1;
          }}
          className="w-12 rounded border border-slate-300 px-1 text-right"
        />
      </label>
    </div>
  );
}