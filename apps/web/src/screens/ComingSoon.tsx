import { useEffect, useRef } from "react";
import { Panel } from "../components/Panel";
import { findMenuItem, type ScreenId } from "../menu";
import { t } from "@newbras/textos";

interface Props {
  id: ScreenId;
  onBack: () => void;
}

/** Tela provisória: diz o que a tela vai fazer e em que fase ela fica pronta. */
export function ComingSoon({ id, onBack }: Props) {
  const item = findMenuItem(id);
  const back = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    back.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  return (
    <Panel>
      <h1 className="font-placar text-5xl leading-none font-extrabold text-cal">{item.label}</h1>
      <p className="mt-5 text-base leading-relaxed text-cal">{item.description}</p>
      <p className="mt-4 text-base leading-relaxed text-suave">
        {t("Esta tela fica pronta na fase {fase} do cronograma.", { fase: item.fase })}
      </p>
      <button
        ref={back}
        type="button"
        onClick={onBack}
        className="mt-8 rounded-sm bg-canarinho px-5 py-2.5 font-placar text-2xl font-bold text-placar hover:brightness-110"
      >
        {t("Voltar ao menu")}
      </button>
      <p className="mt-3 text-sm text-suave">{t("Ou aperte Esc.")}</p>
    </Panel>
  );
}
