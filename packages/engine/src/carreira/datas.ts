/**
 * Datas do jogo no formato AAAA-MM-DD. A conta é feita em dias corridos (UTC), sem relógio do
 * computador: o calendário da carreira só anda quando o técnico avança.
 */

const MS_DIA = 86_400_000;

function partes(data: string): [number, number, number] {
  const [a, m, d] = data.split("-").map(Number) as [number, number, number];
  return [a, m, d];
}

/** Dias desde 1970-01-01 (para somar e comparar). */
export function diaAbsoluto(data: string): number {
  const [a, m, d] = partes(data);
  return Math.round(Date.UTC(a, m - 1, d) / MS_DIA);
}

export function dataDoDia(dia: number): string {
  return new Date(dia * MS_DIA).toISOString().slice(0, 10);
}

export function somarDias(data: string, dias: number): string {
  return dataDoDia(diaAbsoluto(data) + dias);
}

export function diasEntre(de: string, ate: string): number {
  return diaAbsoluto(ate) - diaAbsoluto(de);
}

/** 0 = domingo ... 6 = sábado. */
export function diaDaSemana(data: string): number {
  return (((diaAbsoluto(data) + 4) % 7) + 7) % 7;
}

export const NOMES_DIA_SEMANA = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
] as const;

export const NOMES_MES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;

/** "quarta-feira, 25 de novembro de 2026". */
export function dataPorExtenso(data: string, comDiaDaSemana = true): string {
  const [a, m, d] = partes(data);
  const texto = `${d} de ${NOMES_MES[m - 1]} de ${a}`;
  return comDiaDaSemana ? `${NOMES_DIA_SEMANA[diaDaSemana(data)]}, ${texto}` : texto;
}

/** "25/11/2026". */
export function dataCurta(data: string): string {
  const [a, m, d] = partes(data);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${a}`;
}

/** Dias do mês (28 a 31). */
export function diasNoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

/** Monta AAAA-MM-DD. */
export function montarData(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}
