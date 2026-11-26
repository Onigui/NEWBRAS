/**
 * Sorteio da fase de liga da UEFA: os times divididos em potes pela força, cada um enfrenta o mesmo
 * número de adversários de cada pote (Champions: 2 de cada um dos 4 potes; Conference: 1 de cada um
 * dos 6), sem adversário do mesmo país e com no máximo 2 do mesmo país. Metade dos jogos em casa e
 * cada rodada com todos jogando uma vez.
 */
import type { Rng } from "../rng";

export interface JogoDaFaseDeLiga {
  casa: string;
  fora: string;
  /** Rodada dentro da fase (0 a jogosPorTime - 1). */
  rodada: number;
}

type Aresta = [number, number];

/** Liga dois potes (ou um pote consigo mesmo) com m adversários para cada time. */
function ligarPotes(
  a: readonly number[],
  b: readonly number[] | null,
  m: number,
  rng: Rng,
  pode: (u: number, v: number) => boolean,
  aceitar: (u: number, v: number) => void,
): boolean {
  if (!b) {
    // Mesmo pote: m = 1 é um emparelhamento; m = 2, um ciclo passando por todos.
    for (let tentativa = 0; tentativa < 200; tentativa++) {
      const ordem = rng.shuffle(a);
      const pares: Aresta[] = [];
      if (m === 1) {
        if (ordem.length % 2) return false;
        for (let i = 0; i < ordem.length; i += 2) pares.push([ordem[i]!, ordem[i + 1]!]);
      } else if (m === 2) {
        for (let i = 0; i < ordem.length; i++)
          pares.push([ordem[i]!, ordem[(i + 1) % ordem.length]!]);
      } else return false;
      if (pares.every(([u, v]) => pode(u, v))) {
        for (const [u, v] of pares) aceitar(u, v);
        return true;
      }
    }
    return false;
  }
  // Potes diferentes: m emparelhamentos perfeitos entre eles.
  for (let k = 0; k < m; k++) {
    let feito = false;
    for (let tentativa = 0; tentativa < 300 && !feito; tentativa++) {
      const ordem = rng.shuffle(b);
      if (a.every((u, i) => pode(u, ordem[i]!))) {
        a.forEach((u, i) => aceitar(u, ordem[i]!));
        feito = true;
      }
    }
    if (!feito) return false;
  }
  return true;
}

/** Orienta as arestas para cada time ter tantos jogos em casa quanto fora (caminho euleriano). */
function orientar(n: number, arestas: readonly Aresta[]): Aresta[] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  arestas.forEach(([u, v], i) => {
    adj[u]!.push(i);
    adj[v]!.push(i);
  });
  const usada = new Array<boolean>(arestas.length).fill(false);
  const ponteiro = new Array<number>(n).fill(0);
  const orientadas: Aresta[] = [];
  for (let inicio = 0; inicio < n; inicio++) {
    let atual = inicio;
    for (;;) {
      const lista = adj[atual]!;
      while (ponteiro[atual]! < lista.length && usada[lista[ponteiro[atual]!]!]) ponteiro[atual]!++;
      if (ponteiro[atual]! >= lista.length) break;
      const i = lista[ponteiro[atual]!]!;
      usada[i] = true;
      const [u, v] = arestas[i]!;
      const outro = u === atual ? v : u;
      orientadas.push([atual, outro]);
      atual = outro;
    }
  }
  return orientadas;
}

/** Pinta as arestas com k cores (rodadas), cada time com uma aresta de cada cor (cadeias de Kempe). */
function rodadas(n: number, arestas: readonly Aresta[], k: number, rng: Rng): number[] | null {
  const cor = new Array<number>(arestas.length).fill(-1);
  const em: Map<number, number>[] = Array.from({ length: n }, () => new Map());
  const livre = (x: number) => {
    const l: number[] = [];
    for (let c = 0; c < k; c++) if (!em[x]!.has(c)) l.push(c);
    return l;
  };
  const pintar = (i: number, c: number) => {
    const [u, v] = arestas[i]!;
    cor[i] = c;
    em[u]!.set(c, i);
    em[v]!.set(c, i);
  };
  const apagar = (i: number) => {
    const [u, v] = arestas[i]!;
    em[u]!.delete(cor[i]!);
    em[v]!.delete(cor[i]!);
    cor[i] = -1;
  };
  for (const i of rng.shuffle(arestas.map((_, x) => x))) {
    const [u, v] = arestas[i]!;
    const comum = livre(u).find((c) => !em[v]!.has(c));
    if (comum !== undefined) {
      pintar(i, comum);
      continue;
    }
    let resolvido = false;
    for (const alfa of livre(u)) {
      for (const beta of livre(v)) {
        // Cadeia alfa/beta saindo de v: trocar as cores libera alfa em v.
        const cadeia: number[] = [];
        let x = v;
        let c = alfa;
        for (;;) {
          const e = em[x]!.get(c);
          if (e === undefined) break;
          cadeia.push(e);
          const [p, q] = arestas[e]!;
          x = p === x ? q : p;
          c = c === alfa ? beta : alfa;
        }
        if (x === u) continue;
        const antigas = cadeia.map((e) => cor[e]!);
        cadeia.forEach(apagar);
        cadeia.forEach((e, j) => pintar(e, antigas[j] === alfa ? beta : alfa));
        if (!em[u]!.has(alfa) && !em[v]!.has(alfa)) {
          pintar(i, alfa);
          resolvido = true;
          break;
        }
      }
      if (resolvido) break;
    }
    if (!resolvido) return null;
  }
  return cor;
}

/**
 * Sorteia a fase de liga. `times` em ordem de força (os potes saem dela). Devolve null se o formato
 * não fecha (número de times ou de jogos que não dividem pelos potes).
 */
export function sortearFaseDeLiga(
  times: readonly string[],
  potes: number,
  jogosPorTime: number,
  rng: Rng,
  paises?: Record<string, string>,
): JogoDaFaseDeLiga[] | null {
  const n = times.length;
  if (potes < 2 || n % potes || jogosPorTime % potes || jogosPorTime % 2) return null;
  const s = n / potes;
  const m = jogosPorTime / potes;
  const pais = (i: number) => paises?.[times[i]!] ?? "";
  const listaDePotes = Array.from({ length: potes }, (_, p) =>
    Array.from({ length: s }, (_, i) => p * s + i),
  );
  for (let tentativa = 0; tentativa < 60; tentativa++) {
    const arestas: Aresta[] = [];
    const vizinhos = Array.from({ length: n }, () => new Set<number>());
    const doPais = Array.from({ length: n }, () => new Map<string, number>());
    const pode = (u: number, v: number) => {
      if (u === v || vizinhos[u]!.has(v)) return false;
      const pu = pais(u);
      const pv = pais(v);
      if (pu && pu === pv) return false;
      return (doPais[u]!.get(pv) ?? 0) < 2 && (doPais[v]!.get(pu) ?? 0) < 2;
    };
    const aceitar = (u: number, v: number) => {
      arestas.push([u, v]);
      vizinhos[u]!.add(v);
      vizinhos[v]!.add(u);
      if (pais(v)) doPais[u]!.set(pais(v), (doPais[u]!.get(pais(v)) ?? 0) + 1);
      if (pais(u)) doPais[v]!.set(pais(u), (doPais[v]!.get(pais(u)) ?? 0) + 1);
    };
    let ok = true;
    for (let a = 0; a < potes && ok; a++)
      for (let b = a; b < potes && ok; b++)
        ok = ligarPotes(listaDePotes[a]!, a === b ? null : listaDePotes[b]!, m, rng, pode, aceitar);
    if (!ok) continue;
    const orientadas = orientar(n, arestas);
    const cores = rodadas(n, orientadas, jogosPorTime, rng);
    if (!cores) continue;
    const ordemDasRodadas = rng.shuffle(Array.from({ length: jogosPorTime }, (_, i) => i));
    return orientadas.map(([u, v], i) => ({
      casa: times[u]!,
      fora: times[v]!,
      rodada: ordemDasRodadas[cores[i]!]!,
    }));
  }
  return null;
}
