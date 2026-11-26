/**
 * Plantão de gols (etapa 9c): durante o jogo do técnico, os outros jogos do dia no país correm no
 * mesmo relógio, com os gols aparecendo no minuto em que saem, e a tabela do grupo muda ao vivo.
 * Os placares já vêm simulados (os mesmos que o dia vai registrar); aqui só se revela até o minuto.
 */
import { useMemo, useState } from "react";
import {
  comPlacaresParciais,
  nomeCurtoDaCompeticao,
  nomeDaRodada,
  saldo,
  tabelaDoGrupo,
  type Carreira,
  type Compromisso,
  type JogoSimulado,
  type Mundo,
} from "@newbras/engine";
import { Escudo } from "../components/Escudo";
import { zonaDaPosicao } from "./Competicoes";

export interface Agora {
  minuto: number;
  placar: [number, number];
  fim: boolean;
}

interface Props {
  /** A carreira como estava no começo do jogo. */
  c: Carreira;
  mundo: Mundo;
  x: Compromisso;
  jogos: readonly JogoSimulado[];
  agora: Agora;
}

/** Placar de um jogo simulado até o minuto (o final, se o jogo do técnico acabou). */
function placarAte(j: JogoSimulado, agora: Agora): [number, number] {
  if (agora.fim) return j.placar;
  const ate = j.gols.filter((g) => g.minuto <= agora.minuto);
  return [ate.filter((g) => g.lado === "casa").length, ate.filter((g) => g.lado === "fora").length];
}

export function Plantao({ c, mundo, x, jogos, agora }: Props) {
  const [aba, setAba] = useState<"gols" | "tabela">("gols");
  const nome = (id: string) => mundo.clube(id)?.nomeCurto ?? id;

  // Jogo do técnico e o grupo dele, se a fase for de pontos corridos.
  const comp = x.competicao ? mundo.competicao(x.competicao) : undefined;
  const estado = x.competicao ? c.competicoes.competicoes[x.competicao] : undefined;
  const nosso = estado && x.indice !== undefined ? estado.jogos[x.indice] : undefined;
  const grupos =
    comp && nosso && comp.fases[nosso.fase]?.tipo !== "mata-mata" ? nosso.grupo : undefined;

  const porCompeticao = useMemo(() => {
    const m = new Map<string, JogoSimulado[]>();
    // A competição do jogo vem primeiro, mesmo sem outros jogos nela hoje.
    if (x.competicao) m.set(x.competicao, []);
    for (const j of jogos) m.set(j.competicao, [...(m.get(j.competicao) ?? []), j]);
    return [...m];
  }, [jogos, x.competicao]);

  // Últimos gols já revelados: os da competição do jogo (no amistoso, os da principal do dia).
  const doFeed = jogos[0]?.competicao;
  const ultimos = jogos
    .filter((j) => j.competicao === (x.competicao ?? doFeed))
    .flatMap((j) =>
      j.gols
        .filter((g) => agora.fim || g.minuto <= agora.minuto)
        .map((g) => ({ j, g, placar: placarAteGol(j, g) })),
    )
    .sort((a, b) => b.g.minuto - a.g.minuto)
    .slice(0, 6);

  const tabela = useMemo(() => {
    if (!comp || !estado || !nosso || grupos === undefined || x.indice === undefined) return null;
    const parciais = [
      { indice: x.indice, placar: agora.placar },
      ...jogos
        .filter((j) => j.competicao === comp.id)
        .map((j) => ({ indice: j.indice, placar: placarAte(j, agora) })),
    ];
    const anterior = tabelaDoGrupo(comp, estado, nosso.fase, grupos);
    // Na primeira rodada não há posição anterior para comparar.
    const antes = anterior.some((l) => l.jogos > 0) ? anterior.map((l) => l.clube) : [];
    const linhas = tabelaDoGrupo(comp, comPlacaresParciais(estado, parciais), nosso.fase, grupos);
    return { antes, linhas };
  }, [comp, estado, nosso, grupos, x.indice, jogos, agora]);

  if (!jogos.length && !tabela) return null;

  return (
    <section
      className="flex flex-col gap-2 rounded-md border-2 border-placar-borda bg-placar p-3"
      aria-label="Plantão"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-placar text-xl font-bold">Plantão</h2>
        {tabela && (
          <div className="flex gap-1" role="tablist" aria-label="Plantão">
            {(
              [
                ["gols", "Jogos do dia"],
                ["tabela", "Tabela ao vivo"],
              ] as const
            ).map(([id, rotulo]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={aba === id}
                onClick={() => setAba(id)}
                className={`rounded-sm px-2 py-1 text-xs font-bold ${aba === id ? "bg-canarinho text-placar" : "bg-white/10 hover:bg-white/20"}`}
              >
                {rotulo}
              </button>
            ))}
          </div>
        )}
      </div>

      {(aba === "gols" || !tabela) && (
        <div className="flex max-h-[26rem] flex-col gap-3 overflow-y-auto pr-1">
          {ultimos.length > 0 && (
            <ul className="flex flex-col gap-0.5 text-xs" aria-live="polite">
              {ultimos.map(({ j, g, placar }) => (
                <li key={`${j.competicao}-${j.indice}-${g.minuto}-${g.jogador}`}>
                  <span className="font-bold text-canarinho tabular-nums">{g.minuto}&apos;</span>{" "}
                  Gol do {nome(j[g.lado])}
                  {mundo.jogador(g.jogador) ? ` (${mundo.jogador(g.jogador)?.nome})` : ""}:{" "}
                  {nome(j.casa)} {placar[0]} x {placar[1]} {nome(j.fora)}
                </li>
              ))}
            </ul>
          )}
          {porCompeticao.map(([id, lista]) => {
            const cp = mundo.competicao(id);
            const e = c.competicoes.competicoes[id];
            const primeiro =
              id === x.competicao && nosso
                ? nosso
                : lista[0]
                  ? e?.jogos[lista[0].indice]
                  : undefined;
            return (
              <div key={id}>
                <h3 className="mb-1 text-xs font-bold text-suave">
                  {cp ? nomeCurtoDaCompeticao(cp) : id}
                  {cp && e && primeiro ? `, ${nomeDaRodada(cp, e, primeiro)}` : ""}
                </h3>
                <table className="w-full text-sm">
                  <tbody>
                    {id === x.competicao && nosso && (
                      <tr className="border-b border-white/5 font-bold text-canarinho">
                        <td className="truncate py-0.5 text-right">{nome(nosso.casa)}</td>
                        <td className="w-14 py-0.5 text-center tabular-nums">
                          {agora.placar[0]} x {agora.placar[1]}
                        </td>
                        <td className="truncate py-0.5">{nome(nosso.fora)}</td>
                        <td className="w-12 py-0.5 text-right text-xs">seu jogo</td>
                      </tr>
                    )}
                    {lista.map((j) => {
                      const p = placarAte(j, agora);
                      const recente = j.gols.some(
                        (g) =>
                          !agora.fim && g.minuto <= agora.minuto && agora.minuto - g.minuto < 3,
                      );
                      return (
                        <tr
                          key={j.indice}
                          className={`border-b border-white/5 ${recente ? "bg-canarinho/20" : ""}`}
                        >
                          <td className="truncate py-0.5 text-right">{nome(j.casa)}</td>
                          <td className="w-14 py-0.5 text-center font-bold tabular-nums">
                            {p[0]} x {p[1]}
                          </td>
                          <td className="truncate py-0.5">{nome(j.fora)}</td>
                          <td className="w-12 py-0.5 text-right text-xs text-suave">
                            {agora.fim && j.penaltis
                              ? `pên. ${j.penaltis[0]}-${j.penaltis[1]}`
                              : ""}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
          {!jogos.length && <p className="text-sm text-suave">Nenhum outro jogo hoje.</p>}
        </div>
      )}

      {aba === "tabela" && tabela && comp && estado && nosso && (
        <div className="max-h-[26rem] overflow-y-auto pr-1">
          <table className="w-full text-sm">
            <thead className="text-xs text-suave">
              <tr className="border-b border-placar-borda">
                <th className="w-6 py-1 text-right">#</th>
                <th className="w-4" aria-label="Mudança" />
                <th className="py-1 pl-1 text-left">Clube</th>
                <th className="py-1 text-right" title="Pontos">
                  P
                </th>
                <th className="py-1 text-right" title="Jogos">
                  J
                </th>
                <th className="py-1 pr-1 text-right" title="Saldo">
                  SG
                </th>
              </tr>
            </thead>
            <tbody>
              {tabela.linhas.map((l, i) => {
                const cl = mundo.clube(l.clube);
                const antes = tabela.antes.indexOf(l.clube);
                const cor = zonaDaPosicao(comp, estado, nosso.fase, i + 1);
                const meu = l.clube === c.clube;
                return (
                  <tr
                    key={l.clube}
                    className={`border-b border-white/5 ${meu ? "bg-canarinho/15 font-bold" : ""}`}
                  >
                    <td
                      className="py-0.5 text-right"
                      style={{ boxShadow: cor ? `inset 3px 0 0 ${cor}` : undefined }}
                    >
                      {i + 1}
                    </td>
                    <td className="text-center text-xs">
                      {antes > i ? (
                        <span className="text-[#7ed37a]" title="Subiu">
                          ▲
                        </span>
                      ) : antes >= 0 && antes < i ? (
                        <span className="text-[#ff6b5c]" title="Caiu">
                          ▼
                        </span>
                      ) : null}
                    </td>
                    <td className="py-0.5 pl-1">
                      <span className="flex items-center gap-1.5">
                        {cl && <Escudo clube={cl} tamanho={14} />}
                        <span className="truncate">{cl?.nomeCurto ?? l.clube}</span>
                      </span>
                    </td>
                    <td className="py-0.5 text-right font-bold">{l.pontos}</td>
                    <td className="py-0.5 text-right">{l.jogos}</td>
                    <td className="py-0.5 pr-1 text-right">{saldo(l)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-1 text-xs text-suave">
            Com os placares de agora. ▲ e ▼: posição em relação ao começo da rodada.
          </p>
        </div>
      )}
    </section>
  );
}

/** Placar do jogo logo depois daquele gol. */
function placarAteGol(j: JogoSimulado, gol: JogoSimulado["gols"][number]): [number, number] {
  const ate = j.gols.slice(0, j.gols.indexOf(gol) + 1);
  return [ate.filter((g) => g.lado === "casa").length, ate.filter((g) => g.lado === "fora").length];
}
