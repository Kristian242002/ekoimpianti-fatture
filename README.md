# Generatore documenti EKO

Web app locale che genera i preventivi di EKO Impianti Elettrici compilando un
form, invece di editare a mano i file LaTeX. Il PDF prodotto è identico a quello
dei template esistenti: cambia il modo di arrivarci, non il risultato.

Il flusso precedente era: duplicare l'ultimo `.tex`, sostituire a mano i dati del
cliente, aggiornare la tabella delle voci, compilare e sperare di non aver
dimenticato niente. Questa app separa la struttura del documento — che non cambia
mai — dai dati, che cambiano ogni volta.

---

## Avvio con Docker

Il modo più rapido, su qualsiasi sistema. Non serve installare né Node né LaTeX:
sono già dentro l'immagine.

```bash
docker compose up --build
```

L'app risponde su <http://localhost:3000>. Per fermarla: `Ctrl+C`, poi
`docker compose down`.

Il primo avvio scarica e costruisce circa 1 GB fra immagine base Debian e
pacchetti TeX. I successivi partono in pochi secondi.

---

## Windows

### Con Docker Desktop (consigliato)

1. Installa [Docker Desktop](https://www.docker.com/products/docker-desktop/).
   Alla prima apertura chiede di attivare WSL 2: accetta.
2. Apri PowerShell nella cartella del progetto e lancia `docker compose up --build`.
3. Apri <http://localhost:3000>.

Se l'installazione di Docker Desktop fallisce, la causa più comune è la
virtualizzazione disattivata nel BIOS. Si verifica in Gestione attività →
Prestazioni → CPU: deve indicare «Virtualizzazione: Abilitata».

### Senza Docker

Servono Node 24 e MiKTeX.

1. [Node 24](https://nodejs.org) — durante l'installazione lascia attiva
   l'aggiunta al PATH.
2. [MiKTeX](https://miktex.org/download) — nelle impostazioni scegli di
   installare i pacchetti mancanti **automaticamente** («Always install missing
   packages on-the-fly»). Senza questa opzione la prima compilazione si blocca su
   una finestra di dialogo, e il processo lanciato dall'app resta appeso fino al
   timeout.
3. Riapri PowerShell e verifica che `pdflatex` sia raggiungibile:

   ```powershell
   pdflatex --version
   ```

4. Poi:

   ```powershell
   npm ci
   npm run dev
   ```

Windows usa `TEMP` al posto di `/tmp` per le compilazioni: `os.tmpdir()` lo
risolve da solo, nessuna configurazione è necessaria.

Se il PDF esce con un font diverso da quello atteso, manca `helvet`: apri MiKTeX
Console, scheda Packages, cerca `psnfss` e installalo.

---

## Linux

Servono Node 24 e una installazione LaTeX.

```bash
sudo dnf install texlive-scheme-basic texlive-collection-latexrecommended \
  texlive-babel-italian texlive-collection-fontsrecommended texlive-lastpage

npm ci
npm run dev
```

Su Debian e derivate i pacchetti equivalenti sono `texlive-latex-base`,
`texlive-latex-recommended`, `texlive-latex-extra`, `texlive-fonts-recommended`,
`texlive-lang-italian`.

Per trovare il pacchetto che fornisce un `.sty` mancante:

```bash
sudo dnf provides '*/nomefile.sty'
```

Su Fedora `tlmgr` non installa nulla: TeX Live è gestito da dnf.

---

## Test

```bash
npm run test:run
```

Il test end-to-end, che compila un PDF vero, si salta da solo dove `pdflatex` non
è disponibile — così la CI resta verde senza TeX Live sul runner. Il PDF prodotto
finisce in `tmp/preventivo.pdf` e si può aprire per un controllo visivo.

---

## Architettura

Un tipo di documento è la somma di tre cose: uno schema Zod che dice quali campi
esistono e come si validano, dei descrittori che dicono come mostrarli nel form,
e una funzione di rendering. Il registro in `src/documents/index.ts` è l'unico
punto da toccare per aggiungerne uno: le route API e i componenti del form non
cambiano.

```
src/
  app/
    api/genera/       POST dati → PDF in download
    api/anteprima/    come sopra, con una sola passata di pdflatex
    page.tsx          Server Component: layout della pagina
  documents/
    types.ts          DocumentType e la sua vista type-erased
    index.ts          registro dei tipi di documento
    preventivo/       schema, descrittori di campo, template .tex, rendering
  lib/
    env.ts            configurazione da variabili d'ambiente
    latex/
      escape.ts       escaping dei caratteri speciali
      compile.ts      esecuzione di pdflatex in sandbox
      parse-log.ts    estrazione degli errori dal log
  components/         form generato dai descrittori, anteprima live
```

### Flusso di generazione

```
Form (browser)
  → POST JSON
  → validazione Zod lato server
  → escaping di ogni campo
  → sostituzione dei placeholder nel .tex
  → scrittura in una temp dir isolata
  → pdflatex -no-shell-escape, con timeout
  → lettura del PDF
  → cleanup della temp dir
  → risposta Content-Type: application/pdf
```

---

## Scelte tecniche

**Escaping prima di tutto.** `escapeLatex()` è la prima funzione che è stata
scritta e la più testata. I caratteri `& % $ # _ { } ~ ^ \` rompono la
compilazione, e un indirizzo con una `&` o una descrizione con `50%` bastano a
far fallire tutto con errori illeggibili. La sostituzione avviene in un passo
solo: due `replace()` in sequenza riscapperebbero i backslash appena inseriti.

**Compilazione isolata.** LaTeX può eseguire comandi shell tramite `\write18`,
quindi compilare input utente è un vettore di esecuzione di codice arbitrario. Le
mitigazioni: `-no-shell-escape`, un timeout di 10 secondi (un `\def` ricorsivo
cicla all'infinito), un limite sulla dimensione dell'input, una directory
temporanea usa-e-getta per ogni compilazione con cleanup garantito anche in caso
di errore, e un ambiente di processo minimo. Nel container gira come utente
non-root, con filesystem in sola lettura e capabilities rimosse.

**Due passate di pdflatex.** Il footer usa `\pageref{LastPage}`: la prima passata
scrive il conteggio delle pagine nel file `.aux`, la seconda lo rilegge. Con una
sola passata il PDF stampa `1/??`. L'anteprima ne usa deliberatamente una, per
dimezzare l'attesa a ogni modifica — il conteggio sbagliato è un compromesso
accettabile su un'anteprima.

**Errori di compilazione leggibili.** Il log di pdflatex viene parsato e
l'errore arriva all'interfaccia con riga e messaggio in chiaro, tradotto dove
possibile in qualcosa di azionabile («Pacchetto LaTeX mancante: `lastpage.sty`»).
Mai un 500 anonimo: un `.tex` che non compila è quasi sempre un problema nei
dati, non nel server, e risponde 422.

**Form generato dai descrittori, non per introspezione dello schema.**
L'introspezione a runtime di Zod userebbe API interne che cambiano tra versioni
minori, e non conterrebbe comunque ciò che serve a una UI: etichette in italiano,
ordine dei campi, textarea invece di input. I descrittori in `fields.ts`
contengono solo metadati di presentazione; la validazione resta interamente nello
schema, condiviso fra form e API.

**Nessun database.** L'app non persiste dati: ogni generazione è indipendente.
Se servisse un'anagrafica clienti, file JSON su disco sarebbero sufficienti per
un utente singolo — zero setup, backup uguale a copia cartella, dati
ispezionabili. I limiti dei file (concorrenza, query complesse) non si applicano
a questo caso d'uso.

**Anteprima live.** Debounce a 600 ms dopo l'ultima modifica, `AbortController`
per annullare le richieste superate (senza, una risposta lenta può arrivare dopo
una più recente e sovrascriverla), hash dei dati per non ricompilare quando nulla
è cambiato, e revoca dei blob URL per non accumulare PDF in memoria.

---

## Configurazione

Tutto da variabili d'ambiente, nessun percorso assoluto nel codice.

| Variabile | Default | Cosa fa |
|---|---|---|
| `TEMPLATES_DIR` | `src/documents` | Dove stanno i template `.tex` e gli asset |
| `LATEX_TIMEOUT_MS` | `10000` | Timeout di una singola passata di pdflatex |
| `MAX_TEX_BYTES` | `524288` | Dimensione massima del `.tex` generato |

---

## Limiti noti

- **Un solo tipo di documento.** La dichiarazione di conformità D.M. 37/2008 con
  `pdf-lib` è prevista dall'architettura ma non implementata, quindi
  l'astrazione `DocumentType` non è ancora stata messa alla prova da un secondo
  caso.
- **L'anteprima torna a pagina uno** dopo ogni aggiornamento. Il visualizzatore
  PDF del browser è un documento cross-origin e la sua posizione di scorrimento
  non è leggibile da JavaScript. Il selettore di pagina è un ripiego; la
  soluzione vera sarebbe montare PDF.js e gestire il rendering su canvas.
- **Nessuna autenticazione.** L'app è pensata per girare in locale, e in
  `compose.yaml` la porta è legata a `127.0.0.1`. Esporla su un indirizzo
  pubblico senza aggiungere almeno una Basic Auth significherebbe lasciare
  aperto un endpoint che passa input arbitrario a un compilatore LaTeX.
- **Il totale si inserisce a mano**, per scelta: niente somma automatica, niente
  calcolo IVA.