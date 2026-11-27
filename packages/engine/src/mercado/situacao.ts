/**
 * Situação do clube vendedor e a decisão de vender (etapa 13b, regra do dono em 27/11/2026).
 *
 * Ninguém é intransferível só porque é bom. O clube faz jogo duro com estrela e prodígio, mas
 * vende quando precisa de dinheiro (a venda arruma as contas e reforça o time todo) ou quando a
 * proposta é muito acima do valor. Só recusa tudo quem junta vários fatores: está brigando por
 * título, não precisa de dinheiro e o jogador é peça-chave; mesmo assim, uma proposta absurda
 * (3 vezes o valor) ainda abre a conversa.
 *
 * Até as finanças da Fase 14, "precisa de dinheiro" é uma estimativa: o aperto sorteado do clube
 * na temporada (os pequenos apertam mais) e o saldo das compras e vendas dele na temporada.
 */
import type { Jogador } from "@newbras/data";
import type { Carreira, Mundo } from "../carreira/carreira";
import { tabelaDoGrupo } from "../competicoes/competicao";
import { idadeEm } from "../evolucao";
import { Rng } from "../rng";
import { valorDeMercado } from "./valor";

export type Importancia = "craque" | "titular" | "reserva";

export interface SituacaoDoClube {
  /** De 0 (cofre cheio) a 1 (precisa vender de qualquer jeito). */
  precisaDeDinheiro: number;
  /** Está entre os 3 primeiros da liga (com 5 jogos ou mais) ou é da elite no começo. */
  brigandoPorTitulo: boolean;
}

export type RespostaDeVenda =
  | { tipo: "aceita"; pedido: number }
  | { tipo: "contraproposta"; pedido: number }
  | { tipo: "recusa"; pedido: number; motivo: "pedido" | "intransferivel" | "elenco-curto" };

/** Abaixo disso, o clube não vende (precisa de gente para jogar). */
export const ELENCO_MINIMO_PARA_VENDER = 18;
/** A oferta perto do pedido vira contraproposta. */
const PERTO_DO_PEDIDO = 0.85;
/** Proposta absurda: abre a conversa até com o intransferível. */
const PROPOSTA_ABSURDA = 3;

/** Peso do jogador no elenco: os 3 melhores são craques; até o 11º, titulares. */
export function importanciaNoElenco(elenco: readonly Jogador[], id: string): Importancia {
  const ordem = [...elenco].sort((a, b) => b.forca - a.forca).findIndex((j) => j.id === id);
  return ordem < 0 ? "reserva" : ordem < 3 ? "craque" : ordem < 11 ? "titular" : "reserva";
}

/** Jovem de até 21 anos com potencial de craque. */
export const ehProdigio = (j: Jogador, data: string) =>
  idadeEm(j.nascimento, data) <= 21 && j.potencial >= 85;

/** Temporada (ano) para o sorteio do aperto: muda em julho. */
const anoDoAperto = (data: string) => Number(data.slice(0, 4)) - (data.slice(5) < "07-01" ? 1 : 0);

/** A situação do clube na data. */
export function situacaoDoClube(
  c: Pick<Carreira, "semente" | "competicoes" | "transferencias">,
  mundo: Mundo,
  clube: string,
  data: string,
): SituacaoDoClube {
  const info = mundo.clube(clube);
  const nivel = info?.nivel ?? 50;
  // O aperto da temporada: crise, aperto ou folga, mais comum nos clubes pequenos.
  const rng = new Rng(`${c.semente}:aperto:${clube}:${anoDoAperto(data)}`);
  const crise = nivel < 60 ? 0.18 : nivel < 80 ? 0.1 : 0.05;
  const sorte = rng.next();
  let precisa =
    sorte < crise
      ? rng.float(0.75, 1)
      : sorte < crise * 3
        ? rng.float(0.4, 0.65)
        : rng.float(0, 0.25);
  // Quem já vendeu bem na temporada respira; quem gastou muito aperta.
  const elenco = mundo.elenco(clube);
  const valorDoElenco = Math.max(
    1,
    elenco.reduce((s, j) => s + valorDeMercado(j, data), 0),
  );
  const saldo =
    saldosDaTemporada(c.transferencias ?? [], `${anoDoAperto(data)}-07-01`).get(clube) ?? 0;
  precisa = Math.min(1, Math.max(0, precisa - (saldo / valorDoElenco) * 2));
  return {
    precisaDeDinheiro: Math.round(precisa * 100) / 100,
    brigandoPorTitulo: brigando(c, mundo, clube, nivel),
  };
}

/** Saldo de vendas menos compras de cada clube desde a data (calculado uma vez por lista). */
const saldos = new WeakMap<readonly object[], { desde: string; mapa: Map<string, number> }>();
function saldosDaTemporada(
  lista: NonNullable<Carreira["transferencias"]>,
  desde: string,
): Map<string, number> {
  const guardado = saldos.get(lista);
  if (guardado?.desde === desde) return guardado.mapa;
  const mapa = new Map<string, number>();
  for (const t of lista) {
    if (t.data < desde || !t.valor) continue;
    if (t.de) mapa.set(t.de, (mapa.get(t.de) ?? 0) + t.valor);
    if (t.para) mapa.set(t.para, (mapa.get(t.para) ?? 0) - t.valor);
  }
  saldos.set(lista, { desde, mapa });
  return mapa;
}

/** Posição e jogos de cada clube na 1ª divisão do país, calculados uma vez por estado do mundo. */
const posicoes = new WeakMap<object, Map<string, { posicao: number; jogos: number }>>();
function posicoesNaLiga(c: Pick<Carreira, "competicoes">, mundo: Mundo) {
  const chave = c.competicoes.competicoes;
  let mapa = posicoes.get(chave);
  if (mapa) return mapa;
  mapa = new Map();
  for (const e of Object.values(chave)) {
    const comp = mundo.competicao(e.id);
    if (!comp || comp.tipo !== "liga" || comp.divisao !== 1 || e.encerrada) continue;
    (e.fases[0]?.grupos ?? []).forEach((_, g) => {
      tabelaDoGrupo(comp, e, 0, g).forEach((l, i) =>
        mapa!.set(l.clube, { posicao: i, jogos: l.jogos }),
      );
    });
  }
  posicoes.set(chave, mapa);
  return mapa;
}

/** Entre os 3 primeiros da 1ª divisão com 5 jogos ou mais; antes disso, a elite (nível 85+). */
function brigando(
  c: Pick<Carreira, "competicoes">,
  mundo: Mundo,
  clube: string,
  nivel: number,
): boolean {
  const p = posicoesNaLiga(c, mundo).get(clube);
  if (!p || p.jogos < 5) return nivel >= 85;
  return p.posicao < 3;
}

/**
 * Quanto o clube pede e se aceita a oferta. O pedido parte do valor e sobe com o peso do jogador
 * (craque ×1,6, titular ×1,3, prodígio ×1,3 a mais, clube rico ×1,15); o clube que precisa de
 * dinheiro baixa até 35%. O intransferível só existe com os três fatores juntos.
 */
export function respostaDeVenda(
  mundo: Mundo,
  situacao: SituacaoDoClube,
  j: Jogador,
  oferta: number,
  data: string,
  /** Quem chega ao clube na troca (conta no tamanho do elenco e nos goleiros). */
  chegam: readonly Jogador[] = [],
): RespostaDeVenda {
  const clube = j.clube ? mundo.clube(j.clube) : undefined;
  const elenco = clube ? mundo.elenco(clube.id) : [];
  const importancia = importanciaNoElenco(elenco, j.id);
  const prodigio = ehProdigio(j, data);
  const valor = valorDeMercado(j, data);
  const peso = importancia === "craque" ? 1.6 : importancia === "titular" ? 1.3 : 1.05;
  const rico = (clube?.nivel ?? 0) >= 85 ? 1.15 : 1;
  const desconto = 1 - 0.35 * situacao.precisaDeDinheiro;
  const pedido =
    Math.round((valor * peso * (prodigio ? 1.3 : 1) * rico * desconto) / 100_000) * 100_000;
  // Elenco curto, ou o goleiro que deixaria o clube com menos de 2.
  const goleiros = [...elenco, ...chegam].filter((x) => x.posicao === "G").length;
  const tamanho = elenco.length + chegam.length;
  if (tamanho <= ELENCO_MINIMO_PARA_VENDER || (j.posicao === "G" && goleiros <= 2))
    return { tipo: "recusa", pedido, motivo: "elenco-curto" };
  const chave = importancia === "craque" || (prodigio && importancia !== "reserva");
  const intocavel = chave && situacao.brigandoPorTitulo && situacao.precisaDeDinheiro < 0.3;
  if (intocavel && oferta < valor * PROPOSTA_ABSURDA)
    return {
      tipo: "recusa",
      pedido: Math.max(pedido, valor * PROPOSTA_ABSURDA),
      motivo: "intransferivel",
    };
  if (oferta >= pedido) return { tipo: "aceita", pedido };
  if (oferta >= pedido * PERTO_DO_PEDIDO) return { tipo: "contraproposta", pedido };
  return { tipo: "recusa", pedido, motivo: "pedido" };
}
