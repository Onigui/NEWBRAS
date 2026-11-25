import { useEffect, useRef, type ReactNode } from "react";

/** Estilo comum dos campos de formulário do editor. */
export const estiloCampo =
  "w-full rounded-sm border border-placar-borda bg-[#15212d] px-2.5 py-1.5 text-cal placeholder:text-suave/60 focus:border-canarinho focus:outline-none";

export function Campo({
  rotulo,
  children,
  dica,
  className = "",
}: {
  rotulo: string;
  children: ReactNode;
  dica?: string;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${className}`}>
      <span className="font-bold text-suave">{rotulo}</span>
      {children}
      {dica && <span className="text-xs text-suave">{dica}</span>}
    </label>
  );
}

type Variante = "primario" | "secundario" | "perigo" | "discreto";

const VARIANTES: Record<Variante, string> = {
  primario: "bg-canarinho text-placar hover:brightness-110",
  secundario: "border border-placar-borda bg-[#24364a] text-cal hover:border-canarinho",
  perigo: "border border-[#b4473d] bg-[#5a1f1b] text-[#ffd9d4] hover:bg-[#6e2620]",
  discreto: "text-suave hover:text-canarinho",
};

export function Botao({
  children,
  variante = "secundario",
  className = "",
  ...resto
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return (
    <button
      type="button"
      {...resto}
      className={`rounded-sm px-3 py-1.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTES[variante]} ${className}`}
    >
      {children}
    </button>
  );
}

/** Janela sobre o editor. Esc cancela; Enter confirma o formulário de dentro. */
export function Dialogo({
  titulo,
  onFechar,
  children,
  largura = "max-w-xl",
}: {
  titulo: string;
  onFechar: () => void;
  children: ReactNode;
  largura?: string;
}) {
  const caixa = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    const primeiro = caixa.current?.querySelector<HTMLElement>(
      "input, select, textarea, button[data-foco]",
    );
    primeiro?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onFechar();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      anterior?.focus();
    };
  }, [onFechar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#0b141c]/70 p-4 sm:p-10"
      onMouseDown={(e) => e.target === e.currentTarget && onFechar()}
    >
      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={`w-full ${largura} rounded-md border-2 border-placar-borda bg-placar p-6 shadow-2xl`}
      >
        <div className="mb-5 flex items-baseline justify-between gap-4">
          <h2 className="font-placar text-3xl font-extrabold text-cal">{titulo}</h2>
          <button
            type="button"
            onClick={onFechar}
            className="text-sm text-suave hover:text-canarinho"
          >
            Fechar (Esc)
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ListaProblemas({ problemas }: { problemas: { onde: string; mensagem: string }[] }) {
  if (!problemas.length) return null;
  return (
    <ul
      role="alert"
      className="mt-4 rounded-sm border border-[#b4473d] bg-[#3a1714] p-3 text-sm text-[#ffd9d4]"
    >
      {problemas.slice(0, 12).map((p, i) => (
        <li key={i}>
          <b>{p.onde}:</b> {p.mensagem}
        </li>
      ))}
      {problemas.length > 12 && <li>… e mais {problemas.length - 12}.</li>}
    </ul>
  );
}
