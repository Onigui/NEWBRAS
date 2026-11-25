/**
 * Jogos do time: os marcados e os já disputados, e o formulário para marcar amistosos.
 * Os jogos oficiais vêm das competições; os amistosos o técnico marca aqui.
 */
import { useMemo, useState } from "react";
import {
  agendaCompleta,
  dataCurta,
  nomeDoCompromisso,
  desmarcarAmistoso,
  marcarAmistoso,
  problemasDoAmistoso,
  somarDias,
  type Carreira,
} from "@newbras/engine";
import { Escudo } from "../components/Escudo";
import { procurar } from "../editor/indices";
import { Botao, Campo, estiloCampo } from "../editor/ui";
import type { MundoMontado } from "./useCarreira";

export function Jogos({
  c,
  montado,
  mudar,
}: {
  c: Carreira;
  montado: MundoMontado;
  mudar: (f: (x: Carreira) => Carreira) => void;
}) {
  const { mundo } = montado;
  const nomes = (id: string) => mundo.jogador(id)?.nome ?? id;
  const agenda = agendaCompleta(c);
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div>
        <h2 className="mb-2 font-placar text-2xl font-bold">Agenda</h2>
        {agenda.length === 0 && <p className="text-sm text-suave">Nenhum jogo marcado.</p>}
        <ul className="flex flex-col">
          {agenda.map((x) => {
            const adv = mundo.clube(x.adversario);
            const r = x.resultado;
            const nosso = mundo.clube(c.clube);
            const [casa, fora] = x.mando === "casa" ? [nosso, adv] : [adv, nosso];
            return (
              <li key={x.id} className="flex flex-col gap-1 border-b border-white/5 py-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-20 text-xs text-suave">{dataCurta(x.data)}</span>
                  <span
                    className="w-44 truncate text-xs text-suave"
                    title={nomeDoCompromisso(c, mundo, x)}
                  >
                    {nomeDoCompromisso(c, mundo, x)}
                  </span>
                  <span className="flex flex-1 items-center justify-end gap-1 text-right">
                    {casa?.nomeCurto}
                    {casa && <Escudo clube={casa} tamanho={18} />}
                  </span>
                  <span className="w-14 text-center font-bold">
                    {r ? `${r.placar[0]} x ${r.placar[1]}` : "x"}
                    {r?.penaltis ? (
                      <span className="block text-[0.65rem] font-normal text-suave">
                        pên. {r.penaltis[0]}x{r.penaltis[1]}
                      </span>
                    ) : null}
                  </span>
                  <span className="flex flex-1 items-center gap-1">
                    {fora && <Escudo clube={fora} tamanho={18} />}
                    {fora?.nomeCurto}
                  </span>
                  {!r && x.tipo === "amistoso" && x.data > c.data && (
                    <button
                      type="button"
                      className="rounded px-1 text-xs text-suave hover:bg-white/10"
                      onClick={() => mudar((y) => desmarcarAmistoso(y, x.id))}
                    >
                      desmarcar
                    </button>
                  )}
                </div>
                {r && r.gols.length > 0 && (
                  <p className="pl-20 text-xs text-suave">
                    {r.gols
                      .map((g) => `${nomes(g.jogador)} ${g.minuto}${g.contra ? " (contra)" : ""}`)
                      .join(", ")}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="rounded border border-placar-borda p-3">
        <h2 className="mb-2 font-placar text-2xl font-bold">Marcar amistoso</h2>
        <MarcarAmistoso c={c} montado={montado} mudar={mudar} dataInicial={somarDias(c.data, 7)} />
      </div>
    </div>
  );
}

export function MarcarAmistoso({
  c,
  montado,
  mudar,
  dataInicial,
}: {
  c: Carreira;
  montado: MundoMontado;
  mudar: (f: (x: Carreira) => Carreira) => void;
  dataInicial: string;
}) {
  const { mundo, banco } = montado;
  const [data, setData] = useState(dataInicial);
  const [busca, setBusca] = useState("");
  const [adversario, setAdversario] = useState<string | null>(null);
  const [mando, setMando] = useState<"casa" | "fora">("casa");
  const achados = useMemo(
    () => (busca.trim() ? procurar(banco, busca, 8).clubes.filter((x) => x.id !== c.clube) : []),
    [banco, busca, c.clube],
  );
  const adv = adversario ? mundo.clube(adversario) : undefined;
  const problemas = adversario ? problemasDoAmistoso(c, mundo, { data, adversario }) : [];

  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="grid grid-cols-2 gap-2">
        <Campo rotulo="Data">
          <input
            type="date"
            className={estiloCampo}
            value={data}
            min={somarDias(c.data, 1)}
            onChange={(e) => setData(e.target.value)}
          />
        </Campo>
        <Campo rotulo="Onde">
          <select
            className={estiloCampo}
            value={mando}
            onChange={(e) => setMando(e.target.value as "casa" | "fora")}
          >
            <option value="casa">Em casa</option>
            <option value="fora">Fora</option>
          </select>
        </Campo>
      </div>
      <Campo rotulo="Adversário">
        <input
          className={estiloCampo}
          value={busca}
          placeholder="Procure qualquer clube do mundo"
          onChange={(e) => setBusca(e.target.value)}
        />
      </Campo>
      {achados.length > 0 && (
        <ul className="flex flex-col rounded border border-placar-borda">
          {achados.map((x) => (
            <li key={x.id}>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-2 py-1 text-left hover:bg-white/5"
                onClick={() => {
                  setAdversario(x.id);
                  setBusca("");
                }}
              >
                <Escudo clube={x} tamanho={18} />
                <span className="flex-1 truncate">{x.nome}</span>
                <span className="text-xs text-suave">nível {x.nivel}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {adv && (
        <p className="flex items-center gap-2">
          <Escudo clube={adv} tamanho={20} /> {adv.nome}{" "}
          <span className="text-xs text-suave">nível {adv.nivel}</span>
        </p>
      )}
      {problemas.length > 0 && <p className="text-[#ff8a7e]">{problemas.join("; ")}.</p>}
      <Botao
        variante="primario"
        disabled={!adversario || problemas.length > 0}
        onClick={() => {
          if (!adversario) return;
          mudar((x) => marcarAmistoso(x, mundo, { data, adversario, mando }));
          setAdversario(null);
        }}
      >
        Marcar
      </Botao>
    </div>
  );
}
