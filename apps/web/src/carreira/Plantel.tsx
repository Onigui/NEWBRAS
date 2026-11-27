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
  type Contrato,
  type Jogador,
} from "@newbras/data";
import {
  avisoPoupar,
  contratoDe,
  convocadosDoClube,
  custoDaDispensa,
  dispensarJogador,
  porAVenda,
  valorDeMercado,
  diasEntre,
  faixaDaMoral,
  fatorDeRecaida,
  fragilidade,
  somarDias,
  moralDe,
  propostaDeRenovacao,
  renovarContrato,
  dataCurta,
  foraPelaSelecao,
  forcasDaTemporadaAnterior,
  estadoDe,
  idadeEm,
  type Carreira,
  type EstadoJogador,
} from "@newbras/engine";
import { Folego } from "../components/EditorEscalacao";
import { corDaNotaNaVaga } from "../components/EditorFormacao";
import { HUMOR, IconeHumor } from "../partida/Resumo";
import type { MundoMontado } from "./useCarreira";
import { t, locale } from "@newbras/textos";

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
  | "moral"
  | "contrato";
const ORDEM_POSICAO = { G: 0, L: 1, Z: 2, M: 3, A: 4 } as const;

interface Linha {
  j: Jogador;
  e: EstadoJogador;
  contrato?: Contrato;
  idade: number;
  media: number | null;
  /** Força na temporada anterior (para mostrar quanto evoluiu). */
  antes?: number;
  /** Seleção que o convocou (nome) e se está com ela agora. */
  selecao?: string;
  comASelecao?: boolean;
}

const COR_DA_MORAL = {
  insatisfeito: "text-[#ff8a7a]",
  abatido: "text-[#ffc38a]",
  normal: "text-suave",
  motivado: "text-[#7ed37a]",
} as const;
const NOME_DA_MORAL = {
  insatisfeito: t("insatisfeito"),
  abatido: t("abatido"),
  normal: t("normal"),
  motivado: t("motivado"),
} as const;

export function Plantel({
  c,
  montado,
  mudar,
}: {
  c: Carreira;
  montado: MundoMontado;
  mudar?: (f: (c: Carreira) => Carreira) => void;
}) {
  const { mundo } = montado;
  const [ordem, setOrdem] = useState<{ col: Coluna; desc: boolean }>({
    col: "posicao",
    desc: false,
  });
  const [aberto, setAberto] = useState<string | null>(null);

  const linhas: Linha[] = useMemo(() => {
    const convocados = convocadosDoClube(mundo, c.clube);
    const fora = foraPelaSelecao(c, mundo, c.data);
    const anterior = forcasDaTemporadaAnterior(mundo, c, c.clube);
    return mundo.elenco(c.clube).map((j) => {
      const e = estadoDe(c, j.id);
      const pais = convocados.get(j.id);
      const contrato = contratoDe(c, mundo, j.id);
      return {
        j,
        e,
        ...(contrato ? { contrato } : {}),
        idade: idadeEm(j.nascimento, c.data),
        media: e.jogos ? e.somaNotas / e.jogos : null,
        ...(anterior.has(j.id) ? { antes: anterior.get(j.id) as number } : {}),
        ...(pais ? { selecao: mundo.pais(pais)?.nome ?? pais, comASelecao: fora.has(j.id) } : {}),
      };
    });
  }, [c, mundo]);
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
      case "moral":
        return moralDe(l.e);
      case "contrato":
        return l.contrato?.fim ?? "9999";
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
              {cab("numero", "Nº", t("Número da camisa"))}
              {cab("nome", t("Jogador"), undefined, false)}
              {cab("posicao", t("Posição"), undefined, false)}
              {cab("idade", t("Idade"))}
              {cab("forca", t("Força"))}
              {cab("potencial", t("Pot."), t("Potencial: a maior força que ele pode atingir"))}
              {cab("condicao", t("Condição"))}
              {cab("jogos", "J", t("Jogos na carreira"))}
              {cab("gols", "G", t("Gols"))}
              {cab("assistencias", "A", t("Assistências"))}
              {cab("media", t("Média"), t("Média das notas"))}
              {cab("moral", t("Moral"), t("Moral do jogador"))}
              {cab("contrato", t("Contrato"), t("Fim do contrato"))}
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
                      <span className="ml-1 text-canarinho" title={t("Estrela")}>
                        ★
                      </span>
                    )}
                    {l.e.lesao && l.e.lesao.ate > c.data && (
                      <span
                        className="ml-1 rounded-sm bg-[#ff6b5c]/25 px-1 text-xs text-[#ffb3a8]"
                        title={t("{lesao}, até {data}", {
                          lesao: t(l.e.lesao.nome),
                          data: dataCurta(l.e.lesao.ate),
                        })}
                      >
                        {t("lesionado")}
                      </span>
                    )}
                    {l.selecao && (
                      <span
                        className={`ml-1 rounded-sm px-1 text-xs ${l.comASelecao ? "bg-[#7cc4f5]/25 text-[#bfe3fb]" : "bg-white/10 text-suave"}`}
                        title={
                          l.comASelecao
                            ? t("Com a seleção ({selecao}) agora", { selecao: l.selecao })
                            : t("Convocado para a seleção ({selecao})", { selecao: l.selecao })
                        }
                      >
                        {l.comASelecao ? t("na seleção") : t("seleção")}
                      </span>
                    )}
                    {aviso && <span className="ml-1 text-xs text-[#ffc38a]">{t("poupar")}</span>}
                  </td>
                  <td className="py-1 pr-2 text-suave">
                    {l.j.posicoesCampo?.slice(0, 2).join(", ") ?? NOME_POSICAO[l.j.posicao]}
                  </td>
                  <td className="py-1 pr-2 text-right">{l.idade}</td>
                  <td className="py-1 pr-2 text-right font-bold">
                    {l.j.forca}
                    <Evolucao antes={l.antes} agora={l.j.forca} />
                  </td>
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
                  <td className={`py-1 pr-2 text-xs ${COR_DA_MORAL[faixaDaMoral(moralDe(l.e))]}`}>
                    {NOME_DA_MORAL[faixaDaMoral(moralDe(l.e))]}
                  </td>
                  <td
                    className={`py-1 pr-2 text-right ${l.contrato && diasEntre(c.data, l.contrato.fim) <= 180 ? "text-[#ffc38a]" : "text-suave"}`}
                  >
                    {l.contrato ? dataCurta(l.contrato.fim) : t("sem contrato")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-suave">
          {t(
            "{linhas} jogadores profissionais. Clique num jogador para ver a ficha. A condição se recupera a cada dia; o humor muda aos poucos, puxado pela moral, pelo cansaço e pelos jogos.",
            { linhas: linhas.length },
          )}
        </p>
      </div>
      {ficha ? (
        <Ficha l={ficha} c={c} montado={montado} {...(mudar ? { mudar } : {})} />
      ) : (
        <p className="hidden text-sm text-suave xl:block">
          {t("Clique num jogador para ver a ficha.")}
        </p>
      )}
    </div>
  );
}

function Ficha({
  l,
  c,
  montado,
  mudar,
}: {
  l: Linha;
  c: Carreira;
  montado: MundoMontado;
  mudar?: (f: (c: Carreira) => Carreira) => void;
}) {
  const { j, e } = l;
  const naturais = posicoesNaturais(j);
  return (
    <aside className="flex flex-col gap-3 rounded border border-placar-borda p-3">
      <div>
        <p className="font-placar text-3xl font-bold">{j.nome}</p>
        <p className="text-sm text-suave">
          {t("{nomePosicao}, {idade} anos, força {forca} (potencial {potencial}){estrela}", {
            nomePosicao: NOME_POSICAO[j.posicao],
            idade: l.idade,
            forca: j.forca,
            potencial: j.potencial,
            estrela: j.estrela ? t(", estrela") : "",
          })}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-xs text-suave">{t("Condição física")}</p>
          <Folego valor={e.condicao} />
        </div>
        <div>
          <p className="text-xs text-suave">{t("Humor")}</p>
          <p>
            <IconeHumor humor={e.humor} />
            {HUMOR[e.humor].nome}
          </p>
        </div>
      </div>
      <div>
        <p className="mb-1 text-xs font-bold text-suave">{t("Atributos")}</p>
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
          {t("Nota em cada posição {naturais}", {
            naturais: naturais.length
              ? t("(onde rende: {map})", { map: naturais.map((p) => p).join(", ") })
              : "",
          })}
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
        <p className="mb-1 text-xs font-bold text-suave">{t("Na carreira")}</p>
        <p>
          {t(
            "{jogos} jogos, {minutos} minutos, {gols} gols, {assistencias} assistências{jogos2}{amarelos}{vermelhos}.",
            {
              jogos: e.jogos,
              minutos: e.minutos,
              gols: e.gols,
              assistencias: e.assistencias,
              jogos2: e.jogos
                ? t(", média {somaNotas}", { somaNotas: (e.somaNotas / e.jogos).toFixed(1) })
                : "",
              amarelos: e.amarelos ? t(", {amarelos} amarelos", { amarelos: e.amarelos }) : "",
              vermelhos: e.vermelhos
                ? t(", {vermelhos} vermelhos", { vermelhos: e.vermelhos })
                : "",
            },
          )}
        </p>
        {(l.selecao || e.selecao) && (
          <p>
            {t("Pela seleção{selecao}: {jogos} jogos e {gols} gols na carreira.", {
              selecao: l.selecao ? ` (${l.selecao})` : "",
              jogos: e.selecao?.jogos ?? 0,
              gols: e.selecao?.gols ?? 0,
            })}
          </p>
        )}
        <p className={COR_DA_MORAL[faixaDaMoral(moralDe(e))]}>
          {t("Moral: {faixa} ({moral}).", {
            faixa: NOME_DA_MORAL[faixaDaMoral(moralDe(e))],
            moral: Math.round(moralDe(e)),
          })}
        </p>
        {fragilidade(c.semente, j.id) >= 1.5 && (
          <p className="text-[#ffc38a]">{t("Propenso a lesões.")}</p>
        )}
        {fragilidade(c.semente, j.id) <= 0.7 && (
          <p className="text-suave">{t("Raramente se machuca.")}</p>
        )}
        {fatorDeRecaida(e.lesao, c.data) > 1 && (
          <p className="text-[#ffc38a]">
            {t("Voltou de lesão há pouco: risco maior de recaída até {data}.", {
              data: dataCurta(somarDias(e.lesao!.ate, 28)),
            })}
          </p>
        )}
        {e.lesao && e.lesao.ate > c.data && (
          <p className="text-[#ffb3a8]">
            {t("Lesionado: {lesao}, volta em {data}.", {
              lesao: t(e.lesao.nome),
              data: dataCurta(e.lesao.ate),
            })}
          </p>
        )}
      </div>
      {l.contrato && <Renovacao l={l} c={c} montado={montado} {...(mudar ? { mudar } : {})} />}
      {mudar && <AcoesDeMercado l={l} c={c} montado={montado} mudar={mudar} />}
    </aside>
  );
}

/** Quanto a força mudou desde a temporada anterior. */
function Evolucao({ antes, agora }: { antes: number | undefined; agora: number }) {
  if (antes === undefined || antes === agora) return null;
  const sobe = agora > antes;
  return (
    <span
      className={`ml-1 text-xs font-normal ${sobe ? "text-[#7ed37a]" : "text-[#ff8a7a]"}`}
      title={t("Na temporada anterior: {antes}", { antes })}
    >
      {sobe ? "▲" : "▼"}
      {Math.abs(agora - antes)}
    </span>
  );
}

/** Contrato e renovação: o jogador pede um salário e aceita algumas durações. */
function Renovacao({
  l,
  c,
  montado,
  mudar,
}: {
  l: Linha;
  c: Carreira;
  montado: MundoMontado;
  mudar?: (f: (c: Carreira) => Carreira) => void;
}) {
  const contrato = l.contrato;
  if (!contrato) return null;
  const p = propostaDeRenovacao(c, montado.mundo, l.j.id);
  const faltam = diasEntre(c.data, contrato.fim);
  const duracao = (m: number) =>
    m < 12 ? t("{n} meses", { n: m }) : m === 12 ? t("1 ano") : t("{n} anos", { n: m / 12 });
  return (
    <div className="text-sm">
      <p className="mb-1 text-xs font-bold text-suave">{t("Contrato")}</p>
      <p>
        {t("Até {fim} ({dias} dias), salário de {salario} por mês.", {
          fim: dataCurta(contrato.fim),
          dias: faltam,
          salario: contrato.salario.toLocaleString(locale()),
        })}
      </p>
      {p.recusa ? (
        <p className={p.recusa === "contrato-longo" ? "text-suave" : "text-[#ffc38a]"}>
          {p.recusa === "insatisfeito"
            ? t("Insatisfeito, ele não quer conversar sobre renovação agora.")
            : p.recusa === "contrato-longo"
              ? t("A renovação abre quando faltarem 2 anos de contrato.")
              : t("Ele pensa em parar e não quer renovar.")}
        </p>
      ) : (
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <span className="text-xs text-suave">
            {t("Renovar pedindo {salario} por mês:", {
              salario: p.salario.toLocaleString(locale()),
            })}
          </span>
          {p.meses.map((m) => (
            <button
              key={m}
              type="button"
              disabled={!mudar}
              className="rounded border border-placar-borda px-2 py-0.5 text-xs hover:border-canarinho hover:text-canarinho disabled:opacity-50"
              onClick={() => mudar?.((x) => renovarContrato(x, montado.mundo, l.j.id, m))}
            >
              {duracao(m)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Valor de mercado, pôr à venda e dispensar (com o custo da rescisão). */
function AcoesDeMercado({
  l,
  c,
  montado,
  mudar,
}: {
  l: Linha;
  c: Carreira;
  montado: MundoMontado;
  mudar: (f: (c: Carreira) => Carreira) => void;
}) {
  const aVenda = (c.aVenda ?? []).includes(l.j.id);
  const custo = custoDaDispensa(c, montado.mundo, l.j.id);
  return (
    <div className="text-sm">
      <p className="mb-1 text-xs font-bold text-suave">{t("Mercado")}</p>
      <p>
        {t("Valor de mercado: {valor}.", {
          valor: valorDeMercado(l.j, c.data, l.contrato).toLocaleString(locale()),
        })}
      </p>
      <div className="mt-1 flex flex-wrap gap-1">
        <button
          type="button"
          className="rounded border border-placar-borda px-2 py-0.5 text-xs hover:border-canarinho hover:text-canarinho"
          onClick={() => mudar((x) => porAVenda(x, l.j.id, !aVenda))}
        >
          {aVenda ? t("Tirar da venda") : t("Pôr à venda")}
        </button>
        <button
          type="button"
          className="rounded border border-placar-borda px-2 py-0.5 text-xs hover:border-[#ff8a7a] hover:text-[#ff8a7a]"
          title={t("Rescisão: metade dos salários que faltam do contrato")}
          onClick={() => {
            if (
              window.confirm(
                t("Dispensar {jogador}? A rescisão custa {valor}.", {
                  jogador: l.j.nome,
                  valor: custo.toLocaleString(locale()),
                }),
              )
            )
              mudar((x) => dispensarJogador(x, montado.mundo, l.j.id));
          }}
        >
          {t("Dispensar ({valor})", { valor: custo.toLocaleString(locale()) })}
        </button>
      </div>
    </div>
  );
}
