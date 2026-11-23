import type { ReactNode } from "react";

/** Painel no estilo placar de estádio, usado nas telas de menu. */
export function Panel({ children }: { children: ReactNode }) {
  return (
    <section className="w-full max-w-md rounded-md border-2 border-placar-borda bg-placar p-7 shadow-[0_18px_40px_-12px_rgba(10,30,15,0.65)] sm:p-9">
      {children}
    </section>
  );
}
