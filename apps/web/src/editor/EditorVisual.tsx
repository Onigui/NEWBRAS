import { useState } from "react";
import {
  camisasDoClube,
  escudoDoClube,
  FORMAS_ESCUDO,
  PADROES_CAMISA,
  PADROES_ESCUDO,
  type Camisa as CamisaT,
  type Clube,
} from "@newbras/data";
import { Camisa } from "../components/Camisa";
import { Escudo } from "../components/Escudo";
import { Botao, Campo, estiloCampo } from "./ui";
import { t } from "@newbras/textos";

const NOME_FORMA = {
  classico: t("Clássico"),
  redondo: t("Redondo"),
  diamante: t("Diamante"),
  flamula: t("Flâmula"),
  moderno: t("Moderno"),
} as const;
const NOME_PADRAO_ESCUDO = {
  liso: t("Liso"),
  faixa: t("Faixa"),
  listras: t("Listras"),
  metades: t("Metades"),
  cruz: t("Cruz"),
  chevron: t("Divisa"),
} as const;
const NOME_PADRAO_CAMISA = {
  lisa: t("Lisa"),
  "listras-verticais": t("Listras verticais"),
  "listras-horizontais": t("Listras horizontais"),
  "faixa-diagonal": t("Faixa diagonal"),
  metades: t("Metades"),
  "gola-contraste": t("Gola e mangas"),
} as const;
const NOME_CAMISA = [t("Titular"), t("Reserva"), t("Terceira")] as const;

/** Escudo e até 3 camisas, desenhados pelo jogo nas cores escolhidas. */
export function EditorVisual({ clube, onSalvar }: { clube: Clube; onSalvar: (c: Clube) => void }) {
  const [escudo, setEscudo] = useState(escudoDoClube(clube));
  const [camisas, setCamisas] = useState<CamisaT[]>(camisasDoClube(clube));
  const previa = { ...clube, escudo };

  const mudarCamisa = (i: number, parcial: Partial<CamisaT>) =>
    setCamisas((cs) => cs.map((c, k) => (k === i ? { ...c, ...parcial } : c)));

  const automatico = () => {
    const { escudo: _e, camisas: _c, ...resto } = clube;
    setEscudo(escudoDoClube(resto));
    setCamisas(camisasDoClube(resto));
    onSalvar(resto);
  };

  return (
    <div className="grid gap-8 md:grid-cols-[auto_1fr]">
      <section aria-label={t("Escudo")} className="flex flex-col items-center gap-3">
        <Escudo clube={previa} tamanho={120} />
        <Campo rotulo={t("Forma")} className="w-44">
          <select
            className={estiloCampo}
            value={escudo.forma}
            onChange={(e) => setEscudo({ ...escudo, forma: e.target.value as typeof escudo.forma })}
          >
            {FORMAS_ESCUDO.map((f) => (
              <option key={f} value={f}>
                {NOME_FORMA[f]}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo={t("Desenho")} className="w-44">
          <select
            className={estiloCampo}
            value={escudo.padrao}
            onChange={(e) =>
              setEscudo({ ...escudo, padrao: e.target.value as typeof escudo.padrao })
            }
          >
            {PADROES_ESCUDO.map((p) => (
              <option key={p} value={p}>
                {NOME_PADRAO_ESCUDO[p]}
              </option>
            ))}
          </select>
        </Campo>
        <p className="max-w-[16rem] text-center text-xs text-suave">
          {t("As cores vêm dos dados do time. O jogo nunca usa logotipos oficiais.")}
        </p>
      </section>

      <section aria-label={t("Camisas")}>
        <div className="grid gap-4 sm:grid-cols-3">
          {camisas.map((cam, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2 rounded-sm border border-placar-borda p-3"
            >
              <span className="font-placar text-xl font-bold">{NOME_CAMISA[i]}</span>
              <Camisa
                camisa={cam}
                numero={10}
                tamanho={84}
                rotulo={t("Camisa {nomeCamisa}", { nomeCamisa: NOME_CAMISA[i] })}
              />
              <select
                className={estiloCampo}
                aria-label={t("Desenho da camisa {nomeCamisa}", { nomeCamisa: NOME_CAMISA[i] })}
                value={cam.padrao}
                onChange={(e) => mudarCamisa(i, { padrao: e.target.value as CamisaT["padrao"] })}
              >
                {PADROES_CAMISA.map((p) => (
                  <option key={p} value={p}>
                    {NOME_PADRAO_CAMISA[p]}
                  </option>
                ))}
              </select>
              <div className="flex gap-3 text-xs">
                <label className="flex items-center gap-1">
                  <input
                    type="color"
                    value={cam.cor1}
                    onChange={(e) => mudarCamisa(i, { cor1: e.target.value.toUpperCase() })}
                    className="h-7 w-9 cursor-pointer rounded-sm border border-placar-borda bg-transparent"
                  />
                  {t("Fundo")}
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="color"
                    value={cam.cor2}
                    onChange={(e) => mudarCamisa(i, { cor2: e.target.value.toUpperCase() })}
                    className="h-7 w-9 cursor-pointer rounded-sm border border-placar-borda bg-transparent"
                  />
                  {t("Detalhes")}
                </label>
              </div>
              {camisas.length > 1 && (
                <Botao
                  variante="discreto"
                  onClick={() => setCamisas((cs) => cs.filter((_, k) => k !== i))}
                >
                  {t("Tirar camisa")}
                </Botao>
              )}
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {camisas.length < 3 && (
            <Botao
              onClick={() =>
                setCamisas((cs) => [
                  ...cs,
                  {
                    padrao: "lisa",
                    cor1: clube.cores.terciaria ?? "#1D2B3A",
                    cor2: clube.cores.primaria,
                  },
                ])
              }
            >
              {t("Adicionar camisa")}
            </Botao>
          )}
          <Botao onClick={automatico}>{t("Voltar ao automático")}</Botao>
          <Botao variante="primario" onClick={() => onSalvar({ ...clube, escudo, camisas })}>
            {t("Salvar escudo e camisas")}
          </Botao>
        </div>
      </section>
    </div>
  );
}
