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

/** Peso de quem joga fora do setor dele (zagueiro no meio, meia na lateral) na escolha. */
const FORA_DO_SETOR = 0.9;
/** Peso de quem joga fora das posições em que atua de verdade, dentro do setor. */
const FORA_DA_POSICAO = 0.92;

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

/**
 * Atribuição de máximo valor (método húngaro): linhas são as vagas, colunas os jogadores, com
 * linhas ≤ colunas. Devolve, para cada linha, o índice da coluna escolhida.
 */
export function atribuicaoOtima(valores: readonly (readonly number[])[]): number[] {
  const n = valores.length;
  const m = valores[0]?.length ?? 0;
  if (!n || !m) return [];
  const INF = Number.POSITIVE_INFINITY;
  const custo = (i: number, j: number) => -(valores[i - 1]?.[j - 1] ?? 0);
  const u = new Array<number>(n + 1).fill(0);
  const v = new Array<number>(m + 1).fill(0);
  const p = new Array<number>(m + 1).fill(0);
  const caminho = new Array<number>(m + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minimo = new Array<number>(m + 1).fill(INF);
    const usado = new Array<boolean>(m + 1).fill(false);
    do {
      usado[j0] = true;
      const i0 = p[j0] as number;
      let delta = INF;
      let j1 = 0;
      for (let j = 1; j <= m; j++) {
        if (usado[j]) continue;
        const atual = custo(i0, j) - (u[i0] as number) - (v[j] as number);
        if (atual < (minimo[j] as number)) {
          minimo[j] = atual;
          caminho[j] = j0;
        }
        if ((minimo[j] as number) < delta) {
          delta = minimo[j] as number;
          j1 = j;
        }
      }
      for (let j = 0; j <= m; j++)
        if (usado[j]) {
          u[p[j] as number] = (u[p[j] as number] as number) + delta;
          v[j] = (v[j] as number) - delta;
        } else minimo[j] = (minimo[j] as number) - delta;
      j0 = j1;
    } while (p[j0] !== 0);
    do {
      const j1 = caminho[j0] as number;
      p[j0] = p[j1] as number;
      j0 = j1;
    } while (j0);
  }
  const resposta = new Array<number>(n).fill(-1);
  for (let j = 1; j <= m; j++) if (p[j]) resposta[(p[j] as number) - 1] = j - 1;
  return resposta;
}

/**
 * Quanto vale pôr o jogador na vaga, para escolher quem joga onde: a nota dele ali, com 10% a menos
 * fora do setor dele e mais 8% a menos fora das posições em que atua de verdade.
 */
export function valorNaVaga(j: JogadorDaVaga, vaga: Vaga): number {
  const setor = j.posicao === vaga.posicao ? 1 : FORA_DO_SETOR;
  const posicao =
    j.posicoesCampo?.length && !j.posicoesCampo.includes(posicaoDaVaga(vaga)) ? FORA_DA_POSICAO : 1;
  return notaNaVaga(j, vaga) * setor * posicao;
}

/**
 * Monta os 11 para a formação e o banco com os melhores que sobram. A escolha é a do conjunto:
 * o time que soma mais, com cada um de preferência no setor e na posição dele (o craque do meio
 * não vira lateral só porque rende um pouco mais ali que o lateral reserva).
 */
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
    valorNaVaga(j, vaga) *
    (0.7 + 0.3 * ((j.condicao ?? 100) / 100)) *
    (1 + EFEITO_HUMOR[j.humor ?? "normal"]);
  // Colunas: os disponíveis e, se faltar gente, vagas vazias (valor 0).
  const colunas = Math.max(disponiveis.length, vagas.length);
  const tabela = vagas.map((vaga) =>
    Array.from({ length: colunas }, (_, k) => {
      const j = disponiveis[k];
      return j ? valor(j, vaga) : 0;
    }),
  );
  atribuicaoOtima(tabela).forEach((k, i) => {
    const j = disponiveis[k];
    if (!j) return;
    usados.add(j.id);
    titulares[i] = j.id;
  });

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
