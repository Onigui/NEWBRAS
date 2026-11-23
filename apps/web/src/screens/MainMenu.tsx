import { useEffect, useRef } from "react";
import { Panel } from "../components/Panel";
import { MENU, type ScreenId } from "../menu";
import { APP_VERSION, FASE_ATUAL, TOTAL_FASES } from "../version";

interface Props {
  onOpen: (id: ScreenId) => void;
  initialFocus: ScreenId | null;
}

export function MainMenu({ onOpen, initialFocus }: Props) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const index = Math.max(
      0,
      MENU.findIndex((m) => m.id === initialFocus),
    );
    buttons.current[index]?.focus();
  }, [initialFocus]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const current = buttons.current.findIndex((b) => b === document.activeElement);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const step = e.key === "ArrowDown" ? 1 : -1;
        const next = (Math.max(current, 0) + step + MENU.length) % MENU.length;
        buttons.current[next]?.focus();
        return;
      }
      const item = MENU.find((m) => m.key === e.key.toLowerCase());
      if (item) {
        e.preventDefault();
        onOpen(item.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpen]);

  return (
    <Panel>
      <h1 className="font-placar text-[5.5rem] leading-[0.85] font-black tracking-tight text-cal">
        NewBras
      </h1>
      <p className="mt-4 max-w-[34ch] text-base leading-relaxed text-suave">
        Monte seu time, escale os titulares e veja a partida acontecer no campo.
      </p>

      <nav aria-label="Menu principal" className="mt-8">
        <ul className="flex flex-col gap-1">
          {MENU.map((item, i) => (
            <li key={item.id}>
              <button
                ref={(el) => {
                  buttons.current[i] = el;
                }}
                type="button"
                onClick={() => onOpen(item.id)}
                className="group flex w-full items-baseline justify-between rounded-sm border-l-4 border-transparent px-3 py-2 text-left font-placar text-3xl font-semibold text-cal transition-colors hover:border-canarinho hover:text-canarinho focus-visible:border-canarinho focus-visible:text-canarinho focus-visible:outline-none"
              >
                <span>{item.label}</span>
                <kbd className="font-texto text-sm font-bold text-suave group-hover:text-canarinho group-focus-visible:text-canarinho">
                  {item.key.toUpperCase()}
                </kbd>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <p className="mt-8 text-sm text-suave">
        Versão {APP_VERSION}, em construção (fase {FASE_ATUAL} de {TOTAL_FASES}).
      </p>
    </Panel>
  );
}
