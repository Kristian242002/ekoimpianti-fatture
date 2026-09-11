import { PreventivoEditor } from "@/components/PreventivoEditor";

/** Server Component: it only lays out the page. All interactivity is
 *  confined to the editor below. */
export default function Home() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="mb-6 text-xl font-semibold text-teal-800">
        Generatore documenti EKO
      </h1>
      <PreventivoEditor />
    </main>
  );
}