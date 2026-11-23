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
