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
    <div className="flex h-full flex-col">
      <div className="mb-2 flex h-5 items-center justify-between text-xs text-muted">
        <span>Anteprima</span>
        <span className="flex items-center gap-3">
          {loading && <span className="text-teal">Aggiornamento</span>}
          {errore && <span className="text-amber-700">{errore}</span>}
          <label className="flex items-center gap-1.5">
            Pagina
            <input
              type="number"
              min={1}
              defaultValue={1}
              onChange={(event) => {
                scroll.current = Number(event.target.value) || 1;
              }}
              className="tabular w-11 rounded-sm border border-line bg-surface px-1 py-0.5 text-right outline-none focus:border-gold"
            />
          </label>
        </span>
      </div>

      {/* The document is the only lifted object on the page. */}
      <div className="min-h-0 flex-1 bg-surface shadow-[0_1px_2px_rgba(20,38,42,0.08),0_8px_24px_-8px_rgba(20,38,42,0.18)]">
        {url ? (
          <iframe
            ref={frame}
            src={`${url}#toolbar=1&navpanes=0`}
            title="Anteprima documento"
            className="h-full w-full"
          />
        ) : (
          <p className="flex h-full items-center justify-center px-8 text-center text-sm text-muted">
            Compila il form e l&apos;anteprima comparirà qui.
          </p>
        )}
      </div>
    </div>
  );
}