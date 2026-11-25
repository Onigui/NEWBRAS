/**
 * Tabela de jogos (todos contra todos, pelo método do círculo) e as datas das rodadas dentro
 * do período da competição, fugindo das datas FIFA.
 */
import { periodoContem, type DataFifa, type Periodo } from "@newbras/data";
import type { Rng } from "../rng";
import { diaDaSemana, diasEntre, somarDias } from "../carreira/datas";

/** Confrontos de cada rodada (índices dos times); com número ímpar, um folga por rodada. */
export function todosContraTodos(n: number, turnos: number, rng: Rng): [number, number][][] {
  const ids = rng.shuffle(Array.from({ length: n }, (_, i) => i));
  if (n % 2 === 1) ids.push(-1);
  const m = ids.length;
  const turno: [number, number][][] = [];
  const roda = [...ids];
  for (let r = 0; r < m - 1; r++) {
    const rodada: [number, number][] = [];
    for (let i = 0; i < m / 2; i++) {
      const a = roda[i] as number;
      const b = roda[m - 1 - i] as number;
      if (a < 0 || b < 0) continue;
      // Alterna o mando: quem gira muda de mesa a cada rodada, então a paridade da mesa alterna
      // casa e fora; o fixo (mesa 0) alterna pela rodada.
      const casaPrimeiro = i === 0 ? r % 2 === 0 : i % 2 === 1;
      rodada.push(casaPrimeiro ? [a, b] : [b, a]);
    }
    turno.push(rodada);
    // Gira todos menos o primeiro.
    roda.splice(1, 0, roda.pop() as number);
  }
  const todas: [number, number][][] = [];
  for (let t = 0; t < turnos; t++)
    for (const rodada of turno) todas.push(rodada.map(([a, b]) => (t % 2 === 0 ? [a, b] : [b, a])));
  return todas;
}

/** Quantas rodadas um grupo de n times joga. */
export function rodadasDoGrupo(n: number, turnos: number): number {
  return (n % 2 === 0 ? n - 1 : n) * turnos;
}

/** Primeira data a partir de `desde` (inclusive) com o dia MM-DD. */
export function proximaData(mmdd: string, desde: string): string {
  const ano = Number(desde.slice(0, 4));
  const neste = `${ano}-${mmdd}`;
  return neste >= desde ? neste : `${ano + 1}-${mmdd}`;
}

/** Datas de início e fim da competição dentro da temporada que começa em `inicioTemporada`. */
export function datasDaCompeticao(calendario: Periodo, inicioTemporada: string) {
  const inicio = proximaData(calendario.inicio, inicioTemporada);
  const fim = proximaData(calendario.fim, inicio);
  return { inicio, fim };
}

/**
 * Datas das rodadas: domingos primeiro e, se não couberem, também quartas (e outros dias), sem
 * cair em data FIFA nem perto das datas `bloqueadas` (as de competições mais importantes do país),
 * espalhadas por igual e com pelo menos 2 dias entre uma rodada e outra.
 */
export function datasDasRodadas(
  rodadas: number,
  inicio: string,
  fim: string,
  datasFifa: readonly DataFifa[],
  semanaDeJogo: readonly number[] = [0],
  bloqueadas: ReadonlySet<string> = new Set(),
): string[] {
  if (rodadas <= 0) return [];
  const dias = Math.max(0, diasEntre(inicio, fim));
  const perto = (data: string) =>
    bloqueadas.has(data) ||
    bloqueadas.has(somarDias(data, -1)) ||
    bloqueadas.has(somarDias(data, 1));
  const livres = (permitidos: readonly number[], evitar: boolean) => {
    const lista: string[] = [];
    for (let d = 0; d <= dias; d++) {
      const data = somarDias(inicio, d);
      if (!permitidos.includes(diaDaSemana(data))) continue;
      if (datasFifa.some((f) => periodoContem(f.periodo, data))) continue;
      if (evitar && perto(data)) continue;
      lista.push(data);
    }
    return lista;
  };
  const tentativas: [readonly number[], boolean][] = [
    [semanaDeJogo, true],
    [[...semanaDeJogo, 0, 3], true],
    [[0, 3, 6], true],
    [[0, 1, 2, 3, 4, 5, 6], true],
    [[0, 3], false],
    [[0, 1, 2, 3, 4, 5, 6], false],
  ];
  for (const [permitidos, evitar] of tentativas) {
    const datas = espalhar(livres(permitidos, evitar), rodadas, inicio, fim);
    if (datas) return datas;
  }
  // Período curto demais: dias seguidos a partir do início.
  return Array.from({ length: rodadas }, (_, i) => somarDias(inicio, i));
}

/** Escolhe `n` datas espalhadas por igual, com pelo menos 2 dias entre elas (ou null). */
function espalhar(
  candidatas: readonly string[],
  n: number,
  inicio: string,
  fim: string,
): string[] | null {
  if (candidatas.length < n) return null;
  const total = Math.max(1, diasEntre(inicio, fim));
  const escolhidas: string[] = [];
  let k = 0;
  for (let i = 0; i < n; i++) {
    // Data ideal desta rodada, proporcional no período.
    const alvo = somarDias(inicio, Math.round((i * total) / Math.max(1, n - 1 || 1)));
    const ultima = escolhidas.at(-1);
    // Primeira candidata que respeita o intervalo mínimo, a mais perto do alvo.
    while (k < candidatas.length && ultima && diasEntre(ultima, candidatas[k] as string) < 2) k++;
    let melhor = k;
    for (let j = k; j < candidatas.length; j++) {
      // Sobram candidatas suficientes para as próximas rodadas?
      if (candidatas.length - j < n - i) break;
      if (
        Math.abs(diasEntre(alvo, candidatas[j] as string)) <
        Math.abs(diasEntre(alvo, candidatas[melhor] as string))
      )
        melhor = j;
      else if ((candidatas[j] as string) > alvo) break;
    }
    if (melhor >= candidatas.length || candidatas.length - melhor < n - i) return null;
    escolhidas.push(candidatas[melhor] as string);
    k = melhor + 1;
  }
  return escolhidas;
}
