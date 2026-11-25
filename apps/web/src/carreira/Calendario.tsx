/**
 * Calendário do mês: temporada do país, janelas de transferência, datas FIFA e os jogos do time.
 * Clicar num dia livre a partir de amanhã marca um amistoso nele.
 */
import { useState } from "react";
import { marcasDoMes, NOMES_MES, type Carreira } from "@newbras/engine";
import { Escudo } from "../components/Escudo";
import { Botao } from "../editor/ui";
import { MarcarAmistoso } from "./Jogos";
import type { MundoMontado } from "./useCarreira";

const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export function Calendario({
  c,
  montado,
  mudar,
}: {
  c: Carreira;
  montado: MundoMontado;
  mudar: (f: (x: Carreira) => Carreira) => void;
}) {
  const { mundo } = montado;
  const [mes, setMes] = useState(() => ({
    ano: Number(c.data.slice(0, 4)),
    mes: Number(c.data.slice(5, 7)),
  }));
  const [dia, setDia] = useState<string | null>(null);
  const clube = mundo.clube(c.clube);
  const pais = clube ? mundo.pais(clube.pais) : undefined;
  if (!pais) return null;
  const dias = marcasDoMes(mes.ano, mes.mes, pais, mundo.datasFifa);
  const vazios = new Date(Date.UTC(mes.ano, mes.mes - 1, 1)).getUTCDay();
  const jogoNoDia = new Map(c.agenda.map((x) => [x.data, x]));
  const andar = (d: number) =>
    setMes((m) => {
      const t = m.ano * 12 + (m.mes - 1) + d;
      return { ano: Math.floor(t / 12), mes: (t % 12) + 1 };
    });
  const selecionado = dia ? dias.find((d) => d.data === dia) : undefined;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Botao onClick={() => andar(-1)} aria-label="Mês anterior">
          ◀
        </Botao>
        <h2 className="w-56 text-center font-placar text-3xl font-bold">
          {(NOMES_MES[mes.mes - 1] ?? "").replace(/^./, (l) => l.toUpperCase())} de {mes.ano}
        </h2>
        <Botao onClick={() => andar(1)} aria-label="Próximo mês">
          ▶
        </Botao>
        <Botao
          onClick={() =>
            setMes({ ano: Number(c.data.slice(0, 4)), mes: Number(c.data.slice(5, 7)) })
          }
        >
          Hoje
        </Botao>
      </div>
      <div className="grid grid-cols-7 gap-1 text-sm">
        {DIAS.map((d) => (
          <div key={d} className="text-center text-xs font-bold text-suave">
            {d}
          </div>
        ))}
        {Array.from({ length: vazios }, (_, i) => (
          <div key={`v${i}`} />
        ))}
        {dias.map((d) => {
          const jogo = jogoNoDia.get(d.data);
          const adv = jogo ? mundo.clube(jogo.adversario) : undefined;
          const hoje = d.data === c.data;
          const livre = !jogo && d.data > c.data;
          return (
            <button
              key={d.data}
              type="button"
              onClick={() => setDia(d.data === dia ? null : d.data)}
              aria-label={`${Number(d.data.slice(8))}${jogo ? `, jogo contra ${adv?.nomeCurto}` : ""}${d.dataFifa ? `, ${d.dataFifa}` : ""}${d.janela ? ", janela aberta" : ""}`}
              className={`relative flex min-h-20 flex-col items-start gap-0.5 rounded border p-1 text-left ${
                d.temporada ? "bg-white/[0.04]" : "bg-black/20"
              } ${hoje ? "border-canarinho" : dia === d.data ? "border-cal/60" : "border-white/5"} ${livre ? "hover:border-white/30" : ""}`}
            >
              <span className={`text-xs ${hoje ? "font-bold text-canarinho" : "text-suave"}`}>
                {Number(d.data.slice(8))}
              </span>
              {d.dataFifa && (
                <span className="rounded-sm bg-[#9b8cff]/25 px-1 text-[0.65rem] font-bold text-[#cfc6ff]">
                  FIFA
                </span>
              )}
              {jogo && adv && (
                <span className="flex items-center gap-1 text-xs font-bold">
                  <Escudo clube={adv} tamanho={14} />
                  {adv.abreviacao}
                  {jogo.resultado ? (
                    <span className="font-normal text-suave">
                      {jogo.resultado.placar[0]}x{jogo.resultado.placar[1]}
                    </span>
                  ) : null}
                </span>
              )}
              {d.janela && (
                <span className="absolute inset-x-1 bottom-1 h-1 rounded-full bg-[#7cc4f5]/60" />
              )}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-suave">
        Fundo claro: temporada em andamento; escuro: férias. Faixa azul: janela de transferências
        aberta. FIFA: data FIFA (as ligas param). Clique num dia livre a partir de amanhã para
        marcar um amistoso.
      </p>
      {selecionado && (
        <div className="rounded border border-placar-borda p-3 text-sm">
          {selecionado.eventos.map((ev) => (
            <p key={ev.tipo}>{ev.texto}</p>
          ))}
          {jogoNoDia.get(selecionado.data) ? (
            <p>
              Jogo marcado contra o{" "}
              {mundo.clube(jogoNoDia.get(selecionado.data)!.adversario)?.nomeCurto}.
            </p>
          ) : selecionado.data > c.data ? (
            <MarcarAmistoso c={c} montado={montado} mudar={mudar} dataInicial={selecionado.data} />
          ) : (
            selecionado.eventos.length === 0 && (
              <p className="text-suave">Nada marcado nesse dia.</p>
            )
          )}
        </div>
      )}
    </div>
  );
}
