/**
 * A temporada de cada país precisa conter todas as competições dele: se uma liga começa antes ou
 * termina depois da temporada da região (ex.: Índia de setembro a abril, J1 de agosto a junho), a
 * temporada do país se ajusta a ela. Sem isso a virada da temporada encerra a liga no meio.
 */
import type { CompeticaoEntrada, Pais } from "@newbras/data";
import { diasEntre, proximaData, somarDias } from "@newbras/engine";

/** Uma competição pode começar até 60 dias antes da temporada da região (pré-temporada). */
const ANTECEDENCIA = 60;
/** Temporada mais longa que deixa uma folga entre uma e outra. */
const MAIOR_TEMPORADA = 350;

function paisDe(c: CompeticaoEntrada): string | undefined {
  return c.escopo.tipo === "pais" || c.escopo.tipo === "estado" ? c.escopo.pais : undefined;
}

export function temporadaQueCabe(
  temporada: Pais["temporada"],
  competicoes: readonly CompeticaoEntrada[],
): Pais["temporada"] {
  if (!competicoes.length) return temporada;
  // Ano de referência sem 29 de fevereiro nas contas.
  const inicio = `2025-${temporada.inicio}`;
  const fim = proximaData(temporada.fim, inicio);
  const base = somarDias(inicio, -ANTECEDENCIA);
  let primeiro = "9999";
  let ultimo = "0000";
  for (const c of competicoes) {
    const s = proximaData(c.calendario.inicio, base);
    const e = proximaData(c.calendario.fim, s);
    if (s < primeiro) primeiro = s;
    if (e > ultimo) ultimo = e;
  }
  if (primeiro >= inicio && ultimo <= fim) return temporada;
  // Primeiro tenta só esticar; se ficar longa demais, a temporada passa a ser a das competições.
  let a = primeiro < inicio ? primeiro : inicio;
  let b = ultimo > fim ? ultimo : fim;
  if (diasEntre(a, b) > MAIOR_TEMPORADA) {
    a = primeiro;
    b = ultimo;
  }
  return { inicio: a.slice(5), fim: b.slice(5) };
}

/** Países com a temporada ajustada às competições cadastradas. */
export function paisesComTemporadaAjustada(
  paises: readonly Pais[],
  competicoes: readonly CompeticaoEntrada[],
): Pais[] {
  const porPais = new Map<string, CompeticaoEntrada[]>();
  for (const c of competicoes) {
    const p = paisDe(c);
    if (p) porPais.set(p, [...(porPais.get(p) ?? []), c]);
  }
  return paises.map((p) => ({
    ...p,
    temporada: temporadaQueCabe(p.temporada, porPais.get(p.codigo) ?? []),
  }));
}
