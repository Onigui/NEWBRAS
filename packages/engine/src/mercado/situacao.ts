/**
 * Situação do clube vendedor e a decisão de vender (etapa 13b, regra do dono em 27/11/2026).
 *
 * Ninguém é intransferível só porque é bom. O clube faz jogo duro com estrela e prodígio, mas
 * vende quando precisa de dinheiro (a venda arruma as contas e reforça o time todo) ou quando a
 * proposta é muito acima do valor. Só recusa tudo quem junta vários fatores: está brigando por
 * título, não precisa de dinheiro e o jogador é peça-chave; mesmo assim, uma proposta absurda
 * (3 vezes o valor) ainda abre a conversa.
 *
 * "Precisa de dinheiro" vem do caixa do clube (etapa 14a): no vermelho, vende; com meses de folga,
 * faz jogo duro.
 */
import type { Jogador } from "@newbras/data";
import type { Carreira, Mundo } from "../carreira/carreira";
import { idadeEm } from "../evolucao";
import { posicoesNaLiga, precisaDeDinheiro } from "../financas/financas";
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

/** A situação do clube na data: o caixa dele (etapa 14a) e a briga pelo título. */
export function situacaoDoClube(
  c: Pick<Carreira, "semente" | "competicoes" | "caixasCpu">,
  mundo: Mundo,
  clube: string,
  _data: string,
): SituacaoDoClube {
  const nivel = mundo.clube(clube)?.nivel ?? 50;
  return {
    precisaDeDinheiro: precisaDeDinheiro(c, mundo, clube),
    brigandoPorTitulo: brigando(c, mundo, clube, nivel),
  };
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
