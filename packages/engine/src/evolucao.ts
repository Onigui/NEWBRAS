import type { Posicao } from "@newbras/data";

/**
 * Curva de evolução por idade (decisão do projeto, docs/DECISOES.md):
 * cresce rápido até ~23, devagar até o auge (~27), estável até ~31 e cai a partir de 32,
 * cada vez mais rápido. Goleiros amadurecem e declinam cerca de 2 anos depois.
 *
 * Esta função dá a fração do potencial que um jogador "típico" tem em cada idade.
 * O gerador usa para criar elencos coerentes; a Fase 12 usa como alvo da evolução.
 */
export function fracaoDoPotencial(idade: number, posicao: Posicao): number {
  const atraso = posicao === "G" ? 2 : 0;
  const i = idade - atraso;
  if (i <= 16) return 0.55;
  if (i <= 23) return 0.55 + (i - 16) * (0.33 / 7); // 0,55 → 0,88
  if (i <= 27) return 0.88 + (i - 23) * (0.12 / 4); // 0,88 → 1,00
  if (i <= 31) return 1;
  // Declínio acelerado: -1,5% aos 32, -4,5% aos 33, -9% aos 34, -15% aos 35...
  const anos = i - 31;
  return Math.max(0.35, 1 - 0.005 * anos * (anos + 1) * 1.5);
}

/** Força que se espera de um jogador com esse potencial e idade. */
export function forcaEsperada(potencial: number, idade: number, posicao: Posicao): number {
  return Math.max(1, Math.round(potencial * fracaoDoPotencial(idade, posicao)));
}

/** Idade completa numa data de referência (as duas no formato AAAA-MM-DD). */
export function idadeEm(nascimento: string, referencia: string): number {
  const [an, mn, dn] = nascimento.split("-").map(Number) as [number, number, number];
  const [ar, mr, dr] = referencia.split("-").map(Number) as [number, number, number];
  let idade = ar - an;
  if (mr < mn || (mr === mn && dr < dn)) idade--;
  return idade;
}
