/**
 * Tabela de classificação com os critérios de desempate de cada competição (pontos, vitórias,
 * saldo, gols pró, confronto direto, menos derrotas, sorteio).
 */
import type { Competicao } from "@newbras/data";
import { Rng } from "../rng";

export interface LinhaTabela {
  clube: string;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golsPro: number;
  golsContra: number;
  pontos: number;
}

export interface JogoParaTabela {
  casa: string;
  fora: string;
  placar?: readonly [number, number];
}

export type Criterio = Competicao["desempate"][number];

export const saldo = (l: LinhaTabela) => l.golsPro - l.golsContra;

function linhaVazia(clube: string): LinhaTabela {
  return {
    clube,
    jogos: 0,
    vitorias: 0,
    empates: 0,
    derrotas: 0,
    golsPro: 0,
    golsContra: 0,
    pontos: 0,
  };
}

/** Linhas da tabela a partir dos jogos já disputados. */
export function calcularLinhas(
  clubes: readonly string[],
  jogos: readonly JogoParaTabela[],
  pontos: { vitoria: number; empate: number } = { vitoria: 3, empate: 1 },
): Map<string, LinhaTabela> {
  const linhas = new Map(clubes.map((c) => [c, linhaVazia(c)]));
  for (const j of jogos) {
    if (!j.placar) continue;
    const a = linhas.get(j.casa);
    const b = linhas.get(j.fora);
    if (!a || !b) continue;
    const [gc, gf] = j.placar;
    a.jogos++;
    b.jogos++;
    a.golsPro += gc;
    a.golsContra += gf;
    b.golsPro += gf;
    b.golsContra += gc;
    if (gc > gf) {
      a.vitorias++;
      b.derrotas++;
      a.pontos += pontos.vitoria;
    } else if (gc < gf) {
      b.vitorias++;
      a.derrotas++;
      b.pontos += pontos.vitoria;
    } else {
      a.empates++;
      b.empates++;
      a.pontos += pontos.empate;
      b.pontos += pontos.empate;
    }
  }
  return linhas;
}

/**
 * Ordena a tabela. Critérios em ordem; o confronto direto olha só os jogos entre os empatados.
 * O sorteio é estável (sai da semente), para a tabela não mudar a cada vez que é desenhada.
 */
export function ordenarTabela(
  clubes: readonly string[],
  jogos: readonly JogoParaTabela[],
  criterios: readonly Criterio[],
  pontos: { vitoria: number; empate: number } = { vitoria: 3, empate: 1 },
  semente = "tabela",
): LinhaTabela[] {
  const linhas = calcularLinhas(clubes, jogos, pontos);
  const sorteio = new Map(
    new Rng(`${semente}:sorteio`).shuffle([...clubes].sort()).map((c, i) => [c, i]),
  );

  const comparar = (grupo: readonly LinhaTabela[], idx: number): LinhaTabela[][] => {
    // Divide o grupo de empatados pelo critério idx, recursivamente.
    if (grupo.length <= 1 || idx >= criterios.length) {
      return [[...grupo].sort((a, b) => (sorteio.get(a.clube) ?? 0) - (sorteio.get(b.clube) ?? 0))];
    }
    const criterio = criterios[idx] as Criterio;
    let valor: (l: LinhaTabela) => number;
    if (criterio === "confronto-direto" || criterio === "saldo-confronto-direto") {
      const ids = new Set(grupo.map((l) => l.clube));
      const entre = jogos.filter((j) => ids.has(j.casa) && ids.has(j.fora));
      const mini = calcularLinhas([...ids], entre, pontos);
      valor =
        criterio === "confronto-direto"
          ? (l) => mini.get(l.clube)?.pontos ?? 0
          : (l) => saldo(mini.get(l.clube) ?? linhaVazia(l.clube));
    } else if (criterio === "sorteio") {
      valor = (l) => -(sorteio.get(l.clube) ?? 0);
    } else {
      valor = VALOR[criterio];
    }
    const porValor = new Map<number, LinhaTabela[]>();
    for (const l of grupo) {
      const v = valor(l);
      const lista = porValor.get(v);
      if (lista) lista.push(l);
      else porValor.set(v, [l]);
    }
    return [...porValor.entries()]
      .sort((a, b) => b[0] - a[0])
      .flatMap(([, lista]) => comparar(lista, idx + 1));
  };

  const todas = [...linhas.values()];
  return comparar(todas, 0).flat();
}

const VALOR: Record<
  Exclude<Criterio, "confronto-direto" | "saldo-confronto-direto" | "sorteio">,
  (l: LinhaTabela) => number
> = {
  pontos: (l) => l.pontos,
  vitorias: (l) => l.vitorias,
  saldo,
  "gols-pro": (l) => l.golsPro,
  // Gols fora e cartões ainda não são guardados por jogo: não separam ninguém.
  "gols-fora": () => 0,
  "menos-derrotas": (l) => -l.derrotas,
  cartoes: () => 0,
};
