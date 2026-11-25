/**
 * Escalação: quanto cada jogador rende na vaga e a escalação automática da CPU
 * (também usada como sugestão para o humano).
 */
import {
  familiaridade,
  melhorPapel,
  notaNoPapel,
  papelValido,
  posicaoDaVaga,
  type PapelEmCampo,
  type Posicao,
} from "@newbras/data";
import { FORMACOES, type Formacao, type Vaga } from "./formacoes";
import { EFEITO_HUMOR, type Escalacao, type JogadorPartida } from "./tipos";

type JogadorDaVaga = Pick<
  JogadorPartida,
  "posicao" | "lado" | "forca" | "atributos" | "posicoesCampo"
>;

/**
 * Papel de quem está na vaga: o que o técnico pediu, se couber na vaga, ou a melhor função do
 * jogador na posição de campo da vaga.
 */
export function papelNaVaga(
  jogador: JogadorDaVaga,
  vaga: Vaga,
  escolhido?: PapelEmCampo | null,
): PapelEmCampo {
  const posicao = posicaoDaVaga(vaga);
  return escolhido && papelValido(posicao, escolhido) ? escolhido : melhorPapel(jogador, posicao);
}

/**
 * Fator de rendimento do jogador na vaga (o motor aplica em todos os atributos). Fora da
 * família da posição rende bem menos (nome em amarelo no Brasfoot); dentro dela, quem decide é
 * o quanto os atributos servem à função.
 */
export function encaixe(jogador: JogadorDaVaga, vaga: Vaga, escolhido?: PapelEmCampo | null) {
  return familiaridade(jogador, papelNaVaga(jogador, vaga, escolhido));
}

/** Nota do jogador na vaga (na escala da força), com o papel pedido ou o melhor dele ali. */
export function notaNaVaga(jogador: JogadorDaVaga, vaga: Vaga, escolhido?: PapelEmCampo | null) {
  return notaNoPapel(jogador, papelNaVaga(jogador, vaga, escolhido));
}

/** Ordem de preenchimento: posições mais difíceis de improvisar primeiro. */
const PRIORIDADE: readonly Posicao[] = ["G", "Z", "L", "A", "M"];

export interface OpcoesEscalacao {
  /** Ids que não podem jogar (lesionados, suspensos). */
  indisponiveis?: ReadonlySet<string>;
  /** Tamanho do banco (padrão 9, com pelo menos um goleiro se houver). */
  reservas?: number;
}

/** Vagas de uma escalação: as personalizadas, se houver, ou as da formação pronta. */
export function vagasDaEscalacao(e: Escalacao): readonly Vaga[] {
  if (e.vagas) return e.vagas;
  return FORMACOES[e.formacao === "personalizada" ? "4-4-2" : e.formacao];
}

/** Monta os 11 mais fortes para a formação, vaga por vaga, e o banco com os melhores que sobram. */
export function escalacaoAutomatica(
  jogadores: readonly JogadorPartida[],
  formacao: Formacao | readonly Vaga[],
  opcoes: OpcoesEscalacao = {},
): Escalacao {
  const personalizada = typeof formacao !== "string";
  const vagas: readonly Vaga[] = personalizada ? formacao : FORMACOES[formacao];
  const disponiveis = jogadores.filter((j) => !opcoes.indisponiveis?.has(j.id));
  const usados = new Set<string>();
  const titulares: string[] = new Array<string>(vagas.length).fill("");
  // Cansaço e humor contam: a CPU poupa quem está esgotado ou num dia ruim (é o rodízio).
  const valor = (j: JogadorPartida, vaga: Vaga) =>
    notaNaVaga(j, vaga) *
    (0.7 + 0.3 * ((j.condicao ?? 100) / 100)) *
    (1 + EFEITO_HUMOR[j.humor ?? "normal"]);

  const ordemVagas = vagas
    .map((vaga, i) => ({ vaga, i }))
    .sort((a, b) => PRIORIDADE.indexOf(a.vaga.posicao) - PRIORIDADE.indexOf(b.vaga.posicao));
  for (const { vaga, i } of ordemVagas) {
    let melhor: JogadorPartida | undefined;
    for (const j of disponiveis)
      if (!usados.has(j.id) && (!melhor || valor(j, vaga) > valor(melhor, vaga))) melhor = j;
    if (!melhor) continue;
    usados.add(melhor.id);
    titulares[i] = melhor.id;
  }

  const restantes = disponiveis
    .filter((j) => !usados.has(j.id))
    .sort((a, b) => b.forca - a.forca || a.id.localeCompare(b.id));
  const tamanho = opcoes.reservas ?? 9;
  const reservas: string[] = [];
  const goleiroReserva = restantes.find((j) => j.posicao === "G");
  if (goleiroReserva && tamanho > 0) reservas.push(goleiroReserva.id);
  for (const j of restantes)
    if (reservas.length < tamanho && !reservas.includes(j.id)) reservas.push(j.id);

  // Vaga sem ninguém fica com "" (elenco curto): o time joga com menos.
  return personalizada
    ? { formacao: "personalizada", vagas, titulares, reservas }
    : { formacao, titulares, reservas };
}
