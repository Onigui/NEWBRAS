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

const NOME_FORMA = {
  classico: "Clássico",
  redondo: "Redondo",
  diamante: "Diamante",
  flamula: "Flâmula",
  moderno: "Moderno",
} as const;
const NOME_PADRAO_ESCUDO = {
  liso: "Liso",
  faixa: "Faixa",
  listras: "Listras",
  metades: "Metades",
  cruz: "Cruz",
  chevron: "Divisa",
} as const;
const NOME_PADRAO_CAMISA = {
  lisa: "Lisa",
  "listras-verticais": "Listras verticais",
  "listras-horizontais": "Listras horizontais",
  "faixa-diagonal": "Faixa diagonal",
  metades: "Metades",
  "gola-contraste": "Gola e mangas",
} as const;
const NOME_CAMISA = ["Titular", "Reserva", "Terceira"] as const;

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
      <section aria-label="Escudo" className="flex flex-col items-center gap-3">
        <Escudo clube={previa} tamanho={120} />
        <Campo rotulo="Forma" className="w-44">
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
        <Campo rotulo="Desenho" className="w-44">
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
          As cores vêm dos dados do time. O jogo nunca usa logotipos oficiais.
        </p>
      </section>

      <section aria-label="Camisas">
        <div className="grid gap-4 sm:grid-cols-3">
          {camisas.map((cam, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2 rounded-sm border border-placar-borda p-3"
            >
              <span className="font-placar text-xl font-bold">{NOME_CAMISA[i]}</span>
              <Camisa camisa={cam} numero={10} tamanho={84} rotulo={`Camisa ${NOME_CAMISA[i]}`} />
              <select
                className={estiloCampo}
                aria-label={`Desenho da camisa ${NOME_CAMISA[i]}`}
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
                  Fundo
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="color"
                    value={cam.cor2}
                    onChange={(e) => mudarCamisa(i, { cor2: e.target.value.toUpperCase() })}
                    className="h-7 w-9 cursor-pointer rounded-sm border border-placar-borda bg-transparent"
                  />
                  Detalhes
                </label>
              </div>
              {camisas.length > 1 && (
                <Botao
                  variante="discreto"
                  onClick={() => setCamisas((cs) => cs.filter((_, k) => k !== i))}
                >
                  Tirar camisa
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
              Adicionar camisa
            </Botao>
          )}
          <Botao onClick={automatico}>Voltar ao automático</Botao>
          <Botao variante="primario" onClick={() => onSalvar({ ...clube, escudo, camisas })}>
            Salvar escudo e camisas
          </Botao>
        </div>
      </section>
    </div>
  );
}
