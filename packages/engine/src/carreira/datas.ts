/**
 * Datas do jogo no formato AAAA-MM-DD. A conta é feita em dias corridos (UTC), sem relógio do
 * computador: o calendário da carreira só anda quando o técnico avança.
 */
import { locale } from "@newbras/textos";

const MS_DIA = 86_400_000;

function partes(data: string): [number, number, number] {
  const [a, m, d] = data.split("-").map(Number) as [number, number, number];
  return [a, m, d];
}

// As mesmas datas se repetem o tempo todo (o mundo inteiro joga nelas): a conta fica guardada.
const dias = new Map<string, number>();
const datas = new Map<number, string>();
const LIMITE_CACHE = 100_000;

/** Dias desde 1970-01-01 (para somar e comparar). */
export function diaAbsoluto(data: string): number {
  let dia = dias.get(data);
  if (dia === undefined) {
    const [a, m, d] = partes(data);
    dia = Math.round(Date.UTC(a, m - 1, d) / MS_DIA);
    if (dias.size > LIMITE_CACHE) dias.clear();
    dias.set(data, dia);
  }
  return dia;
}

export function dataDoDia(dia: number): string {
  let data = datas.get(dia);
  if (data === undefined) {
    data = new Date(dia * MS_DIA).toISOString().slice(0, 10);
    if (datas.size > LIMITE_CACHE) datas.clear();
    datas.set(dia, data);
  }
  return data;
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

/** Formatação de datas nos outros idiomas (o português segue as regras abaixo, fixas). */
function formatarIntl(data: string, opcoes: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale(), { ...opcoes, timeZone: "UTC" }).format(
    new Date(`${data}T12:00:00Z`),
  );
}

const emPortugues = () => locale() === "pt-BR";

/** "quarta-feira, 25 de novembro de 2026". */
export function dataPorExtenso(data: string, comDiaDaSemana = true): string {
  if (!emPortugues())
    return formatarIntl(data, {
      ...(comDiaDaSemana ? { weekday: "long" } : {}),
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  const [a, m, d] = partes(data);
  const texto = `${d} de ${NOMES_MES[m - 1]} de ${a}`;
  return comDiaDaSemana ? `${NOMES_DIA_SEMANA[diaDaSemana(data)]}, ${texto}` : texto;
}

/** "25/11/2026". */
export function dataCurta(data: string): string {
  if (!emPortugues())
    return formatarIntl(data, { day: "2-digit", month: "2-digit", year: "numeric" });
  const [a, m, d] = partes(data);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${a}`;
}

/** "Novembro de 2026" (título do calendário). */
export function mesEAno(ano: number, mes: number): string {
  const data = montarData(ano, mes, 1);
  const texto = emPortugues()
    ? `${NOMES_MES[mes - 1]} de ${ano}`
    : formatarIntl(data, { month: "long", year: "numeric" });
  return texto.replace(/^./, (l) => l.toUpperCase());
}

/** Abreviações dos dias da semana, de domingo a sábado. */
export function diasDaSemanaCurtos(): string[] {
  if (emPortugues()) return ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  // 2026-11-01 foi um domingo.
  return Array.from({ length: 7 }, (_, i) =>
    formatarIntl(`2026-11-0${i + 1}`, { weekday: "short" }),
  );
}

/** Dias do mês (28 a 31). */
export function diasNoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

/** Monta AAAA-MM-DD. */
export function montarData(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}
