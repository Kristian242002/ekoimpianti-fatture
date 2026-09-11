import { PreventivoEditor } from "@/components/PreventivoEditor";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-8">
      <header className="mb-8 flex items-baseline justify-between border-b-2 border-teal pb-3">
        <h1 className="text-lg font-semibold text-teal">
          EKO Impianti Elettrici
        </h1>
        <p className="text-sm text-muted">Preventivo</p>
      </header>

      <PreventivoEditor />
    </main>
  );
}