/**
 * Plantel: o elenco com idade, força, potencial, condição física, humor, números da carreira e
 * contrato. Clicar num jogador abre a ficha, com os atributos e a nota dele em cada posição.
 */
import { useMemo, useState } from "react";
import {
  atributosDaPosicao,
  melhorPapel,
  NOME_CARACTERISTICA,
  NOME_POSICAO,
  NOME_POSICAO_CAMPO,
  notaNoPapel,
  POSICOES_CAMPO,
  posicoesNaturais,
  type Jogador,
} from "@newbras/data";
import {
  avisoPoupar,
  dataCurta,
  estadoDe,
  idadeEm,
  type Carreira,
  type EstadoJogador,
} from "@newbras/engine";
import { Folego } from "../components/EditorEscalacao";
import { corDaNotaNaVaga } from "../components/EditorFormacao";
import { HUMOR, IconeHumor } from "../partida/Resumo";
import type { MundoMontado } from "./useCarreira";

type Coluna =
  | "numero"
  | "nome"
  | "posicao"
  | "idade"
  | "forca"
  | "potencial"
  | "condicao"
  | "jogos"
  | "gols"
  | "assistencias"
  | "media"
  | "contrato";
const ORDEM_POSICAO = { G: 0, L: 1, Z: 2, M: 3, A: 4 } as const;

interface Linha {
  j: Jogador;
  e: EstadoJogador;
  idade: number;
  media: number | null;
}

export function Plantel({ c, montado }: { c: Carreira; montado: MundoMontado }) {
  const { mundo } = montado;
  const [ordem, setOrdem] = useState<{ col: Coluna; desc: boolean }>({
    col: "posicao",
    desc: false,
  });
  const [aberto, setAberto] = useState<string | null>(null);

  const linhas: Linha[] = useMemo(
    () =>
      mundo.elenco(c.clube).map((j) => {
        const e = estadoDe(c, j.id);
        return {
          j,
          e,
          idade: idadeEm(j.nascimento, c.data),
          media: e.jogos ? e.somaNotas / e.jogos : null,
        };
      }),
    [c, mundo],
  );
  const valor = (l: Linha): number | string => {
    switch (ordem.col) {
      case "numero":
        return l.j.numero ?? 99;
      case "nome":
        return l.j.nome;
      case "posicao":
        return ORDEM_POSICAO[l.j.posicao] * 1000 - l.j.forca;
      case "idade":
        return l.idade;
      case "forca":
        return l.j.forca;
      case "potencial":
        return l.j.potencial;
      case "condicao":
        return l.e.condicao;
      case "jogos":
        return l.e.jogos;
      case "gols":
        return l.e.gols;
      case "assistencias":
        return l.e.assistencias;
      case "media":
        return l.media ?? -1;
      case "contrato":
        return l.j.contrato?.fim ?? "9999";
    }
  };
  const ordenadas = [...linhas].sort((a, b) => {
    const va = valor(a);
    const vb = valor(b);
    const d = typeof va === "string" ? va.localeCompare(String(vb), "pt-BR") : va - (vb as number);
    return ordem.desc ? -d : d;
  });
  const cab = (col: Coluna, nome: string, titulo?: string, direita = true) => (
    <th
      className={`py-1 pr-2 ${direita ? "text-right" : ""}`}
      aria-sort={ordem.col === col ? (ordem.desc ? "descending" : "ascending") : undefined}
    >
      <button
        type="button"
        title={titulo}
        className="font-bold hover:text-cal"
        onClick={() =>
          setOrdem((o) => ({
            col,
            desc:
              o.col === col
                ? !o.desc
                : col !== "nome" && col !== "posicao" && col !== "numero" && col !== "contrato",
          }))
        }
      >
        {nome}
        {ordem.col === col ? (ordem.desc ? " ▼" : " ▲") : ""}
      </button>
    </th>
  );
  const ficha = aberto ? linhas.find((l) => l.j.id === aberto) : undefined;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] text-sm">
          <thead className="text-left text-xs text-suave">
            <tr className="border-b border-placar-borda">
              {cab("numero", "Nº", "Número da camisa")}
              {cab("nome", "Jogador", undefined, false)}
              {cab("posicao", "Posição", undefined, false)}
              {cab("idade", "Idade")}
              {cab("forca", "Força")}
              {cab("potencial", "Pot.", "Potencial: a maior força que ele pode atingir")}
              {cab("condicao", "Condição")}
              {cab("jogos", "J", "Jogos na carreira")}
              {cab("gols", "G", "Gols")}
              {cab("assistencias", "A", "Assistências")}
              {cab("media", "Média", "Média das notas")}
              {cab("contrato", "Contrato", "Fim do contrato")}
            </tr>
          </thead>
          <tbody>
            {ordenadas.map((l) => {
              const aviso = avisoPoupar(l.e);
              return (
                <tr
                  key={l.j.id}
                  className={`cursor-pointer border-b border-white/5 hover:bg-white/5 ${aberto === l.j.id ? "bg-canarinho/10" : ""}`}
                  onClick={() => setAberto(aberto === l.j.id ? null : l.j.id)}
                >
                  <td className="py-1 pr-2 text-right text-suave">{l.j.numero ?? ""}</td>
                  <td className="py-1 pr-2">
                    <IconeHumor humor={l.e.humor} />
                    {l.j.nome}
                    {l.j.estrela && (
                      <span className="ml-1 text-canarinho" title="Estrela">
                        ★
                      </span>
                    )}
                    {aviso && <span className="ml-1 text-xs text-[#ffc38a]">poupar</span>}
                  </td>
                  <td className="py-1 pr-2 text-suave">
                    {l.j.posicoesCampo?.slice(0, 2).join(", ") ?? NOME_POSICAO[l.j.posicao]}
                  </td>
                  <td className="py-1 pr-2 text-right">{l.idade}</td>
                  <td className="py-1 pr-2 text-right font-bold">{l.j.forca}</td>
                  <td className="py-1 pr-2 text-right text-suave">{l.j.potencial}</td>
                  <td className="w-28 py-1 pr-2">
                    <Folego valor={l.e.condicao} />
                  </td>
                  <td className="py-1 pr-2 text-right">{l.e.jogos}</td>
                  <td className="py-1 pr-2 text-right">{l.e.gols}</td>
                  <td className="py-1 pr-2 text-right">{l.e.assistencias}</td>
                  <td className="py-1 pr-2 text-right">
                    {l.media !== null ? l.media.toFixed(1) : ""}
                  </td>
                  <td className="py-1 pr-2 text-right text-suave">
                    {l.j.contrato ? dataCurta(l.j.contrato.fim) : "sem contrato"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-suave">
          {linhas.length} jogadores profissionais. Clique num jogador para ver a ficha. A condição
          se recupera a cada dia; o humor muda aos poucos, puxado pela moral, pelo cansaço e pelos
          jogos.
        </p>
      </div>
      {ficha ? (
        <Ficha l={ficha} />
      ) : (
        <p className="hidden text-sm text-suave xl:block">Clique num jogador para ver a ficha.</p>
      )}
    </div>
  );
}

function Ficha({ l }: { l: Linha }) {
  const { j, e } = l;
  const naturais = posicoesNaturais(j);
  return (
    <aside className="flex flex-col gap-3 rounded border border-placar-borda p-3">
      <div>
        <p className="font-placar text-3xl font-bold">{j.nome}</p>
        <p className="text-sm text-suave">
          {NOME_POSICAO[j.posicao]}, {l.idade} anos, força {j.forca} (potencial {j.potencial})
          {j.estrela ? ", estrela" : ""}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-xs text-suave">Condição física</p>
          <Folego valor={e.condicao} />
        </div>
        <div>
          <p className="text-xs text-suave">Humor</p>
          <p>
            <IconeHumor humor={e.humor} />
            {HUMOR[e.humor].nome}
          </p>
        </div>
      </div>
      <div>
        <p className="mb-1 text-xs font-bold text-suave">Atributos</p>
        <ul className="grid grid-cols-2 gap-x-4 text-sm">
          {atributosDaPosicao(j.posicao).map((a) => (
            <li key={a} className="flex justify-between border-b border-white/5 py-0.5">
              <span className={j.caracteristicas.includes(a) ? "font-bold text-canarinho" : ""}>
                {NOME_CARACTERISTICA[a]}
              </span>
              <span className="font-bold">{j.atributos[a] ?? "?"}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-1 text-xs font-bold text-suave">
          Nota em cada posição{" "}
          {naturais.length ? `(onde rende: ${naturais.map((p) => p).join(", ")})` : ""}
        </p>
        <ul className="grid grid-cols-3 gap-1 text-sm sm:grid-cols-4">
          {POSICOES_CAMPO.map((p) => {
            const nota = notaNoPapel(j, melhorPapel(j, p));
            return (
              <li
                key={p}
                className="flex justify-between rounded bg-white/5 px-2 py-0.5"
                title={NOME_POSICAO_CAMPO[p]}
              >
                <span className="text-suave">{p}</span>
                <span className="font-bold" style={{ color: corDaNotaNaVaga(nota, j.forca) }}>
                  {nota}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="text-sm">
        <p className="mb-1 text-xs font-bold text-suave">Na carreira</p>
        <p>
          {e.jogos} jogos, {e.minutos} minutos, {e.gols} gols, {e.assistencias} assistências
          {e.jogos ? `, média ${(e.somaNotas / e.jogos).toFixed(1)}` : ""}
          {e.amarelos ? `, ${e.amarelos} amarelos` : ""}
          {e.vermelhos ? `, ${e.vermelhos} vermelhos` : ""}.
        </p>
        {j.contrato && (
          <p className="text-suave">
            Contrato até {dataCurta(j.contrato.fim)}, salário de{" "}
            {j.contrato.salario.toLocaleString("pt-BR")} por mês.
          </p>
        )}
      </div>
    </aside>
  );
}
