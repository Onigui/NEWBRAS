/**
 * Competições: tabela (com zonas de classificação, acesso e rebaixamento), mata-mata, jogos de
 * cada rodada, artilharia, assistências e campeões das temporadas anteriores.
 */
import { useMemo, useState } from "react";
import type { Competicao } from "@newbras/data";
import {
  dataCurta,
  nomeCurtoDaCompeticao,
  nomeDaRodada,
  paisDaCompeticao,
  saldo,
  tabelaDoGrupo,
  type Carreira,
  type EstadoCompeticao,
} from "@newbras/engine";
import { Escudo } from "../components/Escudo";
import { Campo, estiloCampo } from "../editor/ui";
import type { MundoMontado } from "./useCarreira";

export function Competicoes({ c, montado }: { c: Carreira; montado: MundoMontado }) {
  const { mundo, banco } = montado;
  const clube = mundo.clube(c.clube);
  const estados = c.competicoes.competicoes;
  const minhas = useMemo(
    () =>
      Object.values(estados)
        .filter((e) => e.participantes.includes(c.clube))
        .map((e) => e.id),
    [estados, c.clube],
  );
  const [pais, setPais] = useState(clube?.pais ?? "BRA");
  const [id, setId] = useState<string>(minhas[0] ?? Object.keys(estados)[0] ?? "");
  const doPais = useMemo(
    () =>
      Object.values(estados)
        .map((e) => mundo.competicao(e.id))
        .filter((x): x is Competicao => !!x && paisDaCompeticao(x) === pais)
        .sort(
          (a, b) =>
            (a.tipo === "estadual" ? 1 : 0) - (b.tipo === "estadual" ? 1 : 0) ||
            (a.divisao ?? 9) - (b.divisao ?? 9) ||
            a.nome.localeCompare(b.nome, "pt-BR"),
        ),
    [estados, mundo, pais],
  );
  const paises = useMemo(
    () =>
      [
        ...new Set(
          Object.values(estados).map((e) => paisDaCompeticao(mundo.competicao(e.id)!) ?? ""),
        ),
      ]
        .filter(Boolean)
        .map((p) => ({ codigo: p, nome: banco.paises.find((x) => x.codigo === p)?.nome ?? p }))
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [estados, mundo, banco],
  );
  const comp = mundo.competicao(id);
  const e = estados[id];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-2">
        {minhas.length > 0 && (
          <div className="flex flex-wrap gap-1" role="group" aria-label="Suas competições">
            {minhas.map((m) => {
              const x = mundo.competicao(m);
              return (
                <button
                  key={m}
                  type="button"
                  aria-pressed={id === m}
                  onClick={() => setId(m)}
                  className={`rounded-sm px-3 py-1.5 text-sm font-bold ${id === m ? "bg-canarinho text-placar" : "bg-white/10 hover:bg-white/20"}`}
                >
                  {x ? nomeCurtoDaCompeticao(x) : m}
                </button>
              );
            })}
          </div>
        )}
        <Campo rotulo="País" className="ml-auto w-44">
          <select className={estiloCampo} value={pais} onChange={(ev) => setPais(ev.target.value)}>
            {paises.map((p) => (
              <option key={p.codigo} value={p.codigo}>
                {p.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Competição" className="w-64">
          <select
            className={estiloCampo}
            value={doPais.some((x) => x.id === id) ? id : ""}
            onChange={(ev) => setId(ev.target.value)}
          >
            <option value="" disabled>
              Escolha
            </option>
            {doPais.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nome}
              </option>
            ))}
          </select>
        </Campo>
      </div>
      {comp && e ? (
        <Painel c={c} comp={comp} e={e} montado={montado} />
      ) : (
        <p className="text-suave">Escolha uma competição.</p>
      )}
    </div>
  );
}

function Painel({
  c,
  comp,
  e,
  montado,
}: {
  c: Carreira;
  comp: Competicao;
  e: EstadoCompeticao;
  montado: MundoMontado;
}) {
  const { mundo } = montado;
  const nome = (clube: string) => mundo.clube(clube)?.nomeCurto ?? clube;
  const faseAtual = Math.max(
    0,
    e.fases.findIndex((f) => f && !f.encerrada),
  );
  const historico = c.competicoes.historico
    .filter((h) => h.competicao === comp.id)
    .slice(-8)
    .reverse();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-placar text-3xl font-bold">
          {comp.nome} {e.temporada}
        </h2>
        <p className="text-sm text-suave">
          {dataCurta(e.inicio)} a {dataCurta(e.fim)}.{" "}
          {e.encerrada
            ? `Encerrada. Campeão: ${e.campeao ? nome(e.campeao) : "?"}${e.vencedorPlayoff ? `; playoff de acesso: ${nome(e.vencedorPlayoff)}` : ""}.`
            : `Em andamento: ${comp.fases[faseAtual]?.nome ?? ""}.`}
        </p>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          {comp.fases.map((f, fi) => {
            const ef = e.fases[fi];
            if (!ef) return null;
            if (f.tipo === "mata-mata")
              return (
                <MataMata
                  key={f.id}
                  titulo={f.nome}
                  c={c}
                  comp={comp}
                  e={e}
                  fase={fi}
                  nome={nome}
                />
              );
            return (ef.grupos ?? []).map((_, g) => (
              <Tabela
                key={`${f.id}-${g}`}
                c={c}
                comp={comp}
                e={e}
                fase={fi}
                grupo={g}
                montado={montado}
              />
            ));
          })}
        </div>
        <div className="flex flex-col gap-4">
          <Rodadas c={c} comp={comp} e={e} nome={nome} />
          <Lideres titulo="Artilharia" e={e} indice={0} montado={montado} />
          <Lideres titulo="Assistências" e={e} indice={1} montado={montado} />
          {historico.length > 0 && (
            <div>
              <h3 className="mb-1 text-sm font-bold">Campeões anteriores</h3>
              <ul className="text-sm">
                {historico.map((h) => (
                  <li
                    key={h.temporada}
                    className="flex justify-between border-b border-white/5 py-0.5"
                  >
                    <span className="text-suave">{h.temporada}</span>
                    <span>{h.campeao ? nome(h.campeao) : "?"}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Tabela({
  c,
  comp,
  e,
  fase,
  grupo,
  montado,
}: {
  c: Carreira;
  comp: Competicao;
  e: EstadoCompeticao;
  fase: number;
  grupo: number;
  montado: MundoMontado;
}) {
  const f = comp.fases[fase];
  const linhas = tabelaDoGrupo(comp, e, fase, grupo);
  const n = linhas.length;
  const grupos = e.fases[fase]?.grupos?.length ?? 1;
  // Zonas: classificação para a próxima fase; na fase única, acesso, playoff e rebaixamento.
  const zona = (pos: number): string | null => {
    if (f?.tipo === "grupos") {
      if (f.faixaClassificada && pos >= f.faixaClassificada.de && pos <= f.faixaClassificada.ate)
        return "#7cc4f5";
      if (f.classificamPorGrupo && pos <= f.classificamPorGrupo) return "#7ed37a";
    }
    if (fase === 0 && grupos === 1)
      for (const m of comp.movimentos) {
        if (!m.posicoes.includes(pos)) continue;
        if (m.tipo === "acesso") return "#7ed37a";
        if (m.tipo === "rebaixamento") return "#ff6b5c";
        if (m.tipo === "playoff-acesso" && !(f?.tipo === "grupos" && f.faixaClassificada))
          return "#7cc4f5";
      }
    return null;
  };
  return (
    <div className="overflow-x-auto">
      <h3 className="mb-1 text-sm font-bold">
        {f?.nome}
        {grupos > 1 ? `, grupo ${String.fromCharCode(65 + grupo)}` : ""}
      </h3>
      <table className="w-full min-w-[30rem] text-sm">
        <thead className="text-xs text-suave">
          <tr className="border-b border-placar-borda">
            <th className="w-8 py-1 text-right">#</th>
            <th className="py-1 pl-2 text-left">Clube</th>
            <th className="py-1 text-right" title="Pontos">
              P
            </th>
            <th className="py-1 text-right" title="Jogos">
              J
            </th>
            <th className="py-1 text-right" title="Vitórias">
              V
            </th>
            <th className="py-1 text-right" title="Empates">
              E
            </th>
            <th className="py-1 text-right" title="Derrotas">
              D
            </th>
            <th className="py-1 text-right" title="Gols pró">
              GP
            </th>
            <th className="py-1 text-right" title="Gols contra">
              GC
            </th>
            <th className="py-1 pr-1 text-right" title="Saldo">
              SG
            </th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => {
            const cl = montado.mundo.clube(l.clube);
            const cor = zona(i + 1);
            const meu = l.clube === c.clube;
            return (
              <tr
                key={l.clube}
                className={`border-b border-white/5 ${meu ? "bg-canarinho/15 font-bold" : ""}`}
              >
                <td
                  className="py-1 text-right"
                  style={{ boxShadow: cor ? `inset 3px 0 0 ${cor}` : undefined }}
                >
                  {i + 1}
                </td>
                <td className="py-1 pl-2">
                  <span className="flex items-center gap-1.5">
                    {cl && <Escudo clube={cl} tamanho={16} />}
                    {cl?.nomeCurto ?? l.clube}
                  </span>
                </td>
                <td className="py-1 text-right font-bold">{l.pontos}</td>
                <td className="py-1 text-right">{l.jogos}</td>
                <td className="py-1 text-right">{l.vitorias}</td>
                <td className="py-1 text-right">{l.empates}</td>
                <td className="py-1 text-right">{l.derrotas}</td>
                <td className="py-1 text-right">{l.golsPro}</td>
                <td className="py-1 text-right">{l.golsContra}</td>
                <td className="py-1 pr-1 text-right">{saldo(l)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {n > 0 && fase === 0 && grupos === 1 && comp.movimentos.length > 0 && (
        <p className="mt-1 text-xs text-suave">
          Verde: acesso ou classificação. Azul: playoff. Vermelho: rebaixamento.
        </p>
      )}
    </div>
  );
}

function MataMata({
  titulo,
  c,
  comp,
  e,
  fase,
  nome,
}: {
  titulo: string;
  c: Carreira;
  comp: Competicao;
  e: EstadoCompeticao;
  fase: number;
  nome: (id: string) => string;
}) {
  const chaves = e.fases[fase]?.chaves ?? [];
  return (
    <div>
      <h3 className="mb-1 text-sm font-bold">{titulo}</h3>
      <div className="flex flex-col gap-3">
        {chaves.map((rodada, x) => {
          const primeiro = e.jogos.find((j) => j.fase === fase && j.chave === x);
          return (
            <div key={x}>
              <p className="text-xs text-suave">
                {primeiro ? nomeDaRodada(comp, e, primeiro).replace(/ \((ida|volta)\)$/, "") : ""}
              </p>
              <ul className="text-sm">
                {rodada.map((p, ci) => {
                  if (!p.b)
                    return (
                      <li key={ci} className="py-0.5 text-suave">
                        {nome(p.a)} passa direto
                      </li>
                    );
                  const jogos = e.jogos.filter(
                    (j) => j.fase === fase && j.chave === x && j.confronto === ci,
                  );
                  const placares = jogos
                    .map((j) =>
                      j.placar
                        ? `${j.placar[0]}x${j.placar[1]}${j.penaltis ? ` (${j.penaltis[0]}x${j.penaltis[1]} pên.)` : ""}`
                        : "a jogar",
                    )
                    .join(", ");
                  const meu = p.a === c.clube || p.b === c.clube;
                  return (
                    <li
                      key={ci}
                      className={`flex flex-wrap justify-between gap-2 border-b border-white/5 py-0.5 ${meu ? "font-bold" : ""}`}
                    >
                      <span>
                        <span className={p.vencedor === p.a ? "text-canarinho" : ""}>
                          {nome(p.a)}
                        </span>{" "}
                        x{" "}
                        <span className={p.vencedor === p.b ? "text-canarinho" : ""}>
                          {nome(p.b)}
                        </span>
                      </span>
                      <span className="text-xs text-suave">{placares}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Rodadas({
  c,
  comp,
  e,
  nome,
}: {
  c: Carreira;
  comp: Competicao;
  e: EstadoCompeticao;
  nome: (id: string) => string;
}) {
  const rodadas = [...new Set(e.jogos.map((j) => j.rodada))].sort((a, b) => a - b);
  const padrao =
    rodadas.find(
      (r) => e.jogos.some((j) => j.rodada === r && !j.placar) && (e.datas[r] ?? "") >= c.data,
    ) ??
    rodadas.at(-1) ??
    0;
  const [escolhida, setEscolhida] = useState<number | null>(null);
  const r = escolhida ?? padrao;
  const jogos = e.jogos.filter((j) => j.rodada === r);
  const i = rodadas.indexOf(r);
  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <button
          type="button"
          className="rounded px-2 hover:bg-white/10 disabled:opacity-30"
          disabled={i <= 0}
          onClick={() => setEscolhida(rodadas[i - 1] ?? r)}
          aria-label="Rodada anterior"
        >
          ◀
        </button>
        <h3 className="flex-1 text-center text-sm font-bold">
          {jogos[0] ? nomeDaRodada(comp, e, jogos[0]) : "Rodada"}{" "}
          <span className="font-normal text-suave">{e.datas[r] ? dataCurta(e.datas[r]) : ""}</span>
        </h3>
        <button
          type="button"
          className="rounded px-2 hover:bg-white/10 disabled:opacity-30"
          disabled={i >= rodadas.length - 1}
          onClick={() => setEscolhida(rodadas[i + 1] ?? r)}
          aria-label="Próxima rodada"
        >
          ▶
        </button>
      </div>
      <ul className="text-sm">
        {jogos.map((j, k) => {
          const meu = j.casa === c.clube || j.fora === c.clube;
          return (
            <li
              key={k}
              className={`grid grid-cols-[1fr_auto_1fr] gap-2 border-b border-white/5 py-0.5 ${meu ? "font-bold" : ""}`}
            >
              <span className="truncate text-right">{nome(j.casa)}</span>
              <span className="w-12 text-center">
                {j.placar ? `${j.placar[0]} x ${j.placar[1]}` : "x"}
              </span>
              <span className="truncate">{nome(j.fora)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Lideres({
  titulo,
  e,
  indice,
  montado,
}: {
  titulo: string;
  e: EstadoCompeticao;
  indice: 0 | 1;
  montado: MundoMontado;
}) {
  const lista = Object.entries(e.artilharia)
    .filter(([, v]) => v[indice] > 0)
    .sort((a, b) => b[1][indice] - a[1][indice] || b[1][1 - indice]! - a[1][1 - indice]!)
    .slice(0, 10);
  if (!lista.length) return null;
  return (
    <div>
      <h3 className="mb-1 text-sm font-bold">{titulo}</h3>
      <ol className="text-sm">
        {lista.map(([id, v], i) => {
          const j = montado.mundo.jogador(id);
          const cl = j?.clube ? montado.mundo.clube(j.clube) : undefined;
          return (
            <li key={id} className="flex items-center gap-2 border-b border-white/5 py-0.5">
              <span className="w-5 text-right text-xs text-suave">{i + 1}</span>
              {cl && <Escudo clube={cl} tamanho={14} />}
              <span className="flex-1 truncate">{j?.nome ?? id}</span>
              <span className="font-bold">{v[indice]}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
