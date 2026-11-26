import type { Periodo } from "./schemas/comum";
import type { Pais } from "./schemas/mundo";

/** Verdadeiro se a data (AAAA-MM-DD) cai dentro do período anual, inclusive nas pontas. */
export function periodoContem(periodo: Periodo, data: string): boolean {
  const dia = data.slice(5);
  const { inicio, fim } = periodo;
  // Período que vira o ano (ex.: temporada europeia de agosto a maio).
  if (fim < inicio) return dia >= inicio || dia <= fim;
  return dia >= inicio && dia <= fim;
}

/** Janela de transferências do país aberta nessa data? Fora dela, só jogadores livres. */
export function janelaAberta(pais: Pick<Pais, "janelas">, data: string): boolean {
  return pais.janelas.some((j) => periodoContem(j, data));
}

/** A data cai numa data FIFA? Respeita as que valem só em alguns anos (Copa do Mundo). */
export function emDataFifa(
  f: { periodo: Periodo; anos?: readonly number[] | undefined },
  data: string,
): boolean {
  if (!periodoContem(f.periodo, data)) return false;
  if (!f.anos) return true;
  // Período que vira o ano: a parte de janeiro pertence ao ano anterior.
  const ano = Number(data.slice(0, 4));
  const doInicio =
    f.periodo.fim < f.periodo.inicio && data.slice(5) <= f.periodo.fim ? ano - 1 : ano;
  return f.anos.includes(doInicio);
}
