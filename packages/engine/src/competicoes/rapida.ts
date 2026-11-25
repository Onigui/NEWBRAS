/**
 * Simulação rápida, para os jogos do mundo que o técnico não está vendo: gols por Poisson a partir
 * da força dos times e do mando, calibrada para dar os mesmos números do motor espacial (gols por
 * jogo, vitórias do mandante, empates, favorito vencendo). Leva microssegundos por jogo.
 */
import type { Jogador } from "@newbras/data";
import type { Rng } from "../rng";

/**
 * Parâmetros calibrados contra o motor espacial (200 mil jogos, metade entre iguais e metade com
 * um favorito com 10 de força a mais): cerca de 2,5 gols por jogo, 44% de vitórias do mandante,
 * 31% de empates e o favorito vencendo 67% (o motor dá 2,51, 43%, 31% e 72%). Com 20 de
 * diferença, o favorito vence 84% e o saldo médio fica perto de 2,4 gols.
 */
/** Média de gols de cada time num jogo entre iguais em campo neutro. */
export const GOLS_BASE = 1.06;
/** Quanto cada ponto de diferença de força multiplica a razão entre os gols esperados. */
export const PESO_FORCA = 0.2;
/** Diferença de força a partir da qual o efeito começa a saturar (20 de diferença ≈ 2,4 gols de saldo). */
export const SATURACAO = 8;
/** Vantagem do mandante (multiplica os gols de casa e divide os de fora). */
export const MANDO_RAPIDO = 1.24;
/** Chance de um jogo decidido por um gol virar empate (o futebol empata mais que o Poisson). */
export const EMPURRA_EMPATE = 0.2;

/** Força do time para a simulação rápida: o melhor goleiro e os 10 melhores da linha. */
export function forcaDoElenco(elenco: readonly Pick<Jogador, "posicao" | "forca">[]): number {
  if (!elenco.length) return 30;
  const goleiro = Math.max(0, ...elenco.filter((j) => j.posicao === "G").map((j) => j.forca));
  const linha = elenco
    .filter((j) => j.posicao !== "G")
    .map((j) => j.forca)
    .sort((a, b) => b - a)
    .slice(0, 10);
  const soma = linha.reduce((s, f) => s + f, 0) + (goleiro || 30);
  return soma / (linha.length + 1);
}

function poisson(rng: Rng, media: number): number {
  const limite = Math.exp(-media);
  let k = 0;
  let p = rng.next();
  while (p > limite && k < 15) {
    k++;
    p *= rng.next();
  }
  return k;
}

export interface OpcoesRapida {
  neutro?: boolean;
  /** Mata-mata: prorrogação e pênaltis, ou só pênaltis, se empatar (no agregado). */
  desempate?: "nenhum" | "penaltis" | "prorrogacao";
  agregado?: readonly [number, number];
}

export interface ResultadoRapido {
  placar: [number, number];
  penaltis?: [number, number];
  prorrogacao: boolean;
  /** Placar ao fim dos 90 minutos (diferente do final quando houve gol na prorrogação). */
  noTempoNormal: [number, number];
}

export function simularRapido(
  rng: Rng,
  forcaCasa: number,
  forcaFora: number,
  o: OpcoesRapida = {},
): ResultadoRapido {
  // A diferença de força pesa cada vez menos quando fica enorme (gigante contra time pequeno no
  // estadual): sem isso, saíam placares de 7 a 0 toda rodada.
  const diferenca = forcaCasa - forcaFora;
  const efetiva = SATURACAO * Math.tanh(diferenca / SATURACAO);
  const razao = Math.exp(PESO_FORCA * efetiva);
  const mando = o.neutro ? 1 : MANDO_RAPIDO;
  const mc = GOLS_BASE * Math.sqrt(razao) * mando;
  const mf = GOLS_BASE / Math.sqrt(razao) / mando;
  const placar: [number, number] = [poisson(rng, mc), poisson(rng, mf)];
  if (Math.abs(placar[0] - placar[1]) === 1 && rng.chance(EMPURRA_EMPATE)) {
    // O que perdia por um empata no fim (1 x 0 vira 1 x 1, não 0 x 0).
    if (placar[0] > placar[1]) placar[1]++;
    else placar[0]++;
  }
  const [ac, af] = o.agregado ?? [0, 0];
  const empatou = () => placar[0] + ac === placar[1] + af;
  let prorrogacao = false;
  const noTempoNormal: [number, number] = [placar[0], placar[1]];
  if (empatou() && o.desempate === "prorrogacao") {
    prorrogacao = true;
    placar[0] += poisson(rng, mc / 3);
    placar[1] += poisson(rng, mf / 3);
  }
  if (empatou() && o.desempate && o.desempate !== "nenhum") {
    // Pênaltis: quase cara ou coroa, com leve vantagem para o mais forte.
    const casaVence = rng.chance(
      0.5 + Math.max(-0.08, Math.min(0.08, (forcaCasa - forcaFora) / 100)),
    );
    const perdedor = rng.int(2, 4);
    const vencedor = perdedor + 1 + (rng.chance(0.25) ? rng.int(0, 1) : 0);
    return {
      placar,
      prorrogacao,
      noTempoNormal,
      penaltis: casaVence ? [Math.min(5, vencedor), perdedor] : [perdedor, Math.min(5, vencedor)],
    };
  }
  return { placar, prorrogacao, noTempoNormal };
}

export interface GolRapido {
  jogador: string;
  assistencia?: string;
}

/**
 * Quem fez os gols: atacantes mais, meias às vezes, defensores raramente, pesado pela finalização.
 * A assistência sai do passe e da armação (cerca de 70% dos gols têm assistência).
 */
export function autoresDosGols(
  rng: Rng,
  elenco: readonly Pick<Jogador, "id" | "posicao" | "forca" | "atributos">[],
  gols: number,
): GolRapido[] {
  if (!gols) return [];
  const grupo = [...elenco]
    .sort((a, b) => b.forca - a.forca)
    .slice(0, 14)
    .filter((j) => j.posicao !== "G");
  if (!grupo.length) return [];
  const PESO_GOL = { G: 0, L: 0.35, Z: 0.35, M: 1.4, A: 3.2 } as const;
  const PESO_PASSE = { G: 0.05, L: 0.9, Z: 0.35, M: 2, A: 1.4 } as const;
  const lista: GolRapido[] = [];
  for (let i = 0; i < gols; i++) {
    const autor = rng.weighted(
      grupo,
      (j) => PESO_GOL[j.posicao] * ((j.atributos.finalizacao ?? j.forca) / 60) ** 3,
    );
    let assistencia: string | undefined;
    if (rng.chance(0.7)) {
      const outros = grupo.filter((j) => j.id !== autor.id);
      if (outros.length)
        assistencia = rng.weighted(
          outros,
          (j) =>
            PESO_PASSE[j.posicao] *
            (((j.atributos.passe ?? j.forca) + (j.atributos.armacao ?? j.forca)) / 2 / 60) ** 3,
        ).id;
    }
    lista.push(assistencia ? { jogador: autor.id, assistencia } : { jogador: autor.id });
  }
  return lista;
}
