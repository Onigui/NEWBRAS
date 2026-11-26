/**
 * Calendário da carreira: temporada do país, janelas de transferência e datas FIFA, dia a dia.
 * Os períodos do banco são anuais (MM-DD); aqui viram datas de verdade conforme o ano.
 */
import { emDataFifa, periodoContem, type DataFifa, type Pais, type Periodo } from "@newbras/data";
import { marcar } from "@newbras/textos";
import { diaAbsoluto, montarData, somarDias } from "./datas";

export type TipoEventoCalendario =
  | "inicio-temporada"
  | "fim-temporada"
  | "janela-abre"
  | "janela-fecha"
  | "data-fifa-inicio"
  | "data-fifa-fim";

export interface EventoCalendario {
  tipo: TipoEventoCalendario;
  data: string;
  /** Texto em português (a chave da tradução) e as partes variáveis. */
  texto: string;
  params?: Readonly<Record<string, string | number>>;
}

/** Dias de pré-temporada antes do primeiro jogo oficial. */
export const DIAS_PRE_TEMPORADA = 21;

/** O período anual que contém a data, em datas de verdade (o que vira o ano termina no seguinte). */
export function periodoEmDatas(periodo: Periodo, data: string): { inicio: string; fim: string } {
  const ano = Number(data.slice(0, 4));
  const vira = periodo.fim < periodo.inicio;
  const dia = data.slice(5);
  // No período que vira o ano, a data de janeiro pertence à temporada que começou no ano anterior.
  const anoInicio = vira && dia <= periodo.fim ? ano - 1 : ano;
  const inicio = `${anoInicio}-${periodo.inicio}`;
  const fim = `${vira ? anoInicio + 1 : anoInicio}-${periodo.fim}`;
  return { inicio, fim };
}

/** Próxima data (a partir de `data`, inclusive) em que o período começa. */
export function proximoInicio(periodo: Periodo, data: string): string {
  const ano = Number(data.slice(0, 4));
  const esteAno = `${ano}-${periodo.inicio}`;
  return esteAno >= data ? esteAno : `${ano + 1}-${periodo.inicio}`;
}

/**
 * Data em que a carreira começa: a pré-temporada da próxima temporada do país do clube, a partir
 * da data de referência do banco (os elencos são os dessa data).
 */
export function inicioDaCarreira(pais: Pick<Pais, "temporada">, referencia: string): string {
  const inicioTemporada = proximoInicio(pais.temporada, somarDias(referencia, DIAS_PRE_TEMPORADA));
  return somarDias(inicioTemporada, -DIAS_PRE_TEMPORADA);
}

/** A temporada (em datas) em que a data cai, ou a próxima, se estiver nas férias. */
export function temporadaDe(pais: Pick<Pais, "temporada">, data: string) {
  if (periodoContem(pais.temporada, data)) return periodoEmDatas(pais.temporada, data);
  return periodoEmDatas(pais.temporada, proximoInicio(pais.temporada, data));
}

/** Nome da temporada: "2026" (uma só no ano) ou "2026/27" (vira o ano). */
export function nomeTemporada(pais: Pick<Pais, "temporada">, data: string): string {
  const { inicio, fim } = temporadaDe(pais, data);
  const a = inicio.slice(0, 4);
  const b = fim.slice(0, 4);
  return a === b ? a : `${a}/${b.slice(2)}`;
}

function comeca(periodo: Periodo, data: string) {
  return data.slice(5) === periodo.inicio;
}
function termina(periodo: Periodo, data: string) {
  return data.slice(5) === periodo.fim;
}

/** O que acontece no calendário do país nesse dia (temporada, janelas, datas FIFA). */
export function eventosDoDia(
  data: string,
  pais: Pick<Pais, "nome" | "temporada" | "janelas">,
  datasFifa: readonly DataFifa[],
): EventoCalendario[] {
  const eventos: EventoCalendario[] = [];
  if (comeca(pais.temporada, data))
    eventos.push({
      tipo: "inicio-temporada",
      data,
      ...marcar("Começa a temporada {temporada} no país ({pais}).", {
        temporada: nomeTemporada(pais, data),
        pais: pais.nome,
      }),
    });
  if (termina(pais.temporada, data))
    eventos.push({
      tipo: "fim-temporada",
      data,
      ...marcar("Termina a temporada {temporada} ({pais}).", {
        temporada: nomeTemporada(pais, data),
        pais: pais.nome,
      }),
    });
  for (const j of pais.janelas) {
    if (comeca(j, data))
      eventos.push({
        tipo: "janela-abre",
        data,
        ...marcar("Abriu a janela de transferências ({pais}). Fecha em {fim}.", {
          pais: pais.nome,
          fim: formatar(periodoEmDatas(j, data).fim),
        }),
      });
    if (termina(j, data))
      eventos.push({
        tipo: "janela-fecha",
        data,
        ...marcar("Último dia da janela de transferências ({pais}).", { pais: pais.nome }),
      });
  }
  for (const f of datasFifa) {
    if (f.anos && !f.anos.includes(Number(data.slice(0, 4)))) continue;
    if (comeca(f.periodo, data))
      eventos.push({
        tipo: "data-fifa-inicio",
        data,
        ...marcar("Começa a {nome}: as ligas param e os convocados vão para as seleções.", {
          nome: f.nome,
        }),
      });
    if (termina(f.periodo, data))
      eventos.push({
        tipo: "data-fifa-fim",
        data,
        ...marcar("Termina a {nome}.", { nome: f.nome }),
      });
  }
  return eventos;
}

function formatar(data: string) {
  return `${data.slice(8, 10)}/${data.slice(5, 7)}`;
}

/** Marcas de um dia para o calendário na tela. */
export interface MarcasDoDia {
  data: string;
  temporada: boolean;
  janela: boolean;
  dataFifa: string | null;
  eventos: EventoCalendario[];
}

/** As marcas de cada dia do mês (ano e mês de 1 a 12). */
export function marcasDoMes(
  ano: number,
  mes: number,
  pais: Pick<Pais, "nome" | "temporada" | "janelas">,
  datasFifa: readonly DataFifa[],
): MarcasDoDia[] {
  const dias: MarcasDoDia[] = [];
  const primeiro = montarData(ano, mes, 1);
  for (let d = diaAbsoluto(primeiro); ; d++) {
    const data = somarDias(primeiro, d - diaAbsoluto(primeiro));
    if (Number(data.slice(5, 7)) !== mes) break;
    dias.push({
      data,
      temporada: periodoContem(pais.temporada, data),
      janela: pais.janelas.some((j) => periodoContem(j, data)),
      dataFifa: datasFifa.find((f) => emDataFifa(f, data))?.nome ?? null,
      eventos: eventosDoDia(data, pais, datasFifa),
    });
  }
  return dias;
}
