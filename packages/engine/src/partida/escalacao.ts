/**
 * Escalação: quanto cada jogador rende na vaga e a escalação automática da CPU
 * (também usada como sugestão para o humano).
 */
import type { Lado, Posicao } from "@newbras/data";
import { FORMACOES, type Formacao, type Vaga } from "./formacoes";
import type { Escalacao, JogadorPartida } from "./tipos";

/** Rendimento de um jogador de cada posição jogando em outra (fila: posição dele; coluna: vaga). */
const ENCAIXE: Readonly<Record<Posicao, Readonly<Record<Posicao, number>>>> = {
  G: { G: 1, L: 0.4, Z: 0.45, M: 0.4, A: 0.4 },
  L: { G: 0.3, L: 1, Z: 0.9, M: 0.9, A: 0.8 },
  Z: { G: 0.3, L: 0.88, Z: 1, M: 0.82, A: 0.72 },
  M: { G: 0.3, L: 0.88, Z: 0.82, M: 1, A: 0.9 },
  A: { G: 0.3, L: 0.78, Z: 0.68, M: 0.88, A: 1 },
};

/**
 * Fator de rendimento do jogador na vaga. Jogador fora de posição (nome em amarelo no Brasfoot)
 * rende menos; lateral do lado trocado também perde um pouco.
 */
export function encaixe(jogador: Pick<JogadorPartida, "posicao" | "lado">, vaga: Vaga): number {
  let fator = ENCAIXE[jogador.posicao][vaga.posicao];
  if (ladoTrocado(jogador.lado, vaga.lado) && (vaga.posicao === "L" || jogador.posicao === "L"))
    fator *= 0.95;
  return fator;
}

const ladoTrocado = (a: Lado, b: Lado) => (a === "D" && b === "E") || (a === "E" && b === "D");

/** Ordem de preenchimento: posições mais difíceis de improvisar primeiro. */
const PRIORIDADE: readonly Posicao[] = ["G", "Z", "L", "A", "M"];

export interface OpcoesEscalacao {
  /** Ids que não podem jogar (lesionados, suspensos). */
  indisponiveis?: ReadonlySet<string>;
  /** Tamanho do banco (padrão 9, com pelo menos um goleiro se houver). */
  reservas?: number;
}

/** Monta os 11 mais fortes para a formação, vaga por vaga, e o banco com os melhores que sobram. */
export function escalacaoAutomatica(
  jogadores: readonly JogadorPartida[],
  formacao: Formacao,
  opcoes: OpcoesEscalacao = {},
): Escalacao {
  const vagas = FORMACOES[formacao];
  const disponiveis = jogadores.filter((j) => !opcoes.indisponiveis?.has(j.id));
  const usados = new Set<string>();
  const titulares: string[] = new Array<string>(vagas.length).fill("");
  const valor = (j: JogadorPartida, vaga: Vaga) =>
    j.forca * encaixe(j, vaga) * (0.7 + 0.3 * ((j.condicao ?? 100) / 100));

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
  return { formacao, titulares, reservas };
}
