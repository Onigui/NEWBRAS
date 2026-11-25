/**
 * Calibração (Fase 6): roda muitos jogos entre times de força parecida e diferente e compara os
 * números com as metas do futebol real. O teste roda um lote menor; o script `calibrar` roda os
 * 10.000 jogos e grava o relatório em docs/CALIBRACAO.md.
 */
import { Rng } from "../rng";
import { simularPartida } from "./motor";
import { timeDeTeste } from "./teste-utils";
import type { ResultadoPartida } from "./tipos";

export interface Meta {
  nome: string;
  min: number;
  max: number;
  /** Como ler o número (para o relatório). */
  unidade: string;
}

/**
 * Metas, por jogo, tiradas de médias de ligas de primeira divisão (Brasileirão e grandes ligas
 * europeias): o motor deve cair dentro da faixa em 10.000 jogos.
 */
export const METAS = {
  gols: { nome: "Gols por jogo", min: 2.4, max: 2.85, unidade: "gols" },
  vitoriaMandante: { nome: "Vitórias do mandante", min: 0.41, max: 0.5, unidade: "%" },
  empates: { nome: "Empates", min: 0.23, max: 0.31, unidade: "%" },
  vitoriaVisitante: { nome: "Vitórias do visitante", min: 0.23, max: 0.33, unidade: "%" },
  zeroAZero: { nome: "Jogos 0 x 0", min: 0.05, max: 0.11, unidade: "%" },
  chutes: { nome: "Chutes por time", min: 10, max: 16, unidade: "chutes" },
  chutesNoGol: { nome: "Chutes no gol por time", min: 3.8, max: 5.8, unidade: "chutes" },
  escanteios: { nome: "Escanteios por jogo", min: 7.5, max: 11.5, unidade: "escanteios" },
  faltas: { nome: "Faltas por jogo", min: 19, max: 29, unidade: "faltas" },
  amarelos: { nome: "Amarelos por jogo", min: 2.8, max: 5.5, unidade: "cartões" },
  vermelhos: { nome: "Vermelhos por jogo", min: 0.08, max: 0.3, unidade: "cartões" },
  penaltis: { nome: "Pênaltis por jogo", min: 0.18, max: 0.4, unidade: "pênaltis" },
  impedimentos: { nome: "Impedimentos por jogo", min: 2.8, max: 5.5, unidade: "impedimentos" },
  golsAtacantes: { nome: "Gols de atacantes", min: 0.5, max: 0.78, unidade: "%" },
  hatTricks: { nome: "Jogos com hat-trick", min: 0, max: 0.035, unidade: "%" },
  favoritoVence: { nome: "Favorito (+10 de força) vence", min: 0.55, max: 0.72, unidade: "%" },
} as const satisfies Record<string, Meta>;

export type Medicao = Record<keyof typeof METAS, number>;

/**
 * Mede `n` jogos. Metade é entre times de força igual (para mando, empates e números médios);
 * a outra metade tem um favorito com 10 de força a mais, ora em casa, ora fora.
 */
export function medirCalibracao(n: number, semente = "calibracao"): Medicao {
  const rng = new Rng(semente);
  const soma: Record<string, number> = {};
  const add = (k: string, v: number) => (soma[k] = (soma[k] ?? 0) + v);
  let iguais = 0;
  let favoritos = 0;
  for (let i = 0; i < n; i++) {
    const base = rng.int(55, 82);
    const comFavorito = i % 2 === 1;
    const favoritoEmCasa = i % 4 === 1;
    const fCasa = comFavorito && favoritoEmCasa ? base + 10 : base;
    const fFora = comFavorito && !favoritoEmCasa ? base + 10 : base;
    const casa = timeDeTeste(`C${i % 7}`, fCasa);
    const fora = timeDeTeste(`F${i % 5}`, fFora);
    const r = simularPartida({ semente: `${semente}-${i}`, casa, fora });
    contar(r, add, comFavorito, favoritoEmCasa);
    if (comFavorito) favoritos++;
    else iguais++;
  }
  const porJogo = (k: string) => (soma[k] ?? 0) / n;
  return {
    gols: porJogo("gols"),
    vitoriaMandante: (soma.vitoriaMandante ?? 0) / iguais,
    empates: (soma.empates ?? 0) / iguais,
    vitoriaVisitante: (soma.vitoriaVisitante ?? 0) / iguais,
    zeroAZero: porJogo("zeroAZero"),
    chutes: porJogo("chutes") / 2,
    chutesNoGol: porJogo("chutesNoGol") / 2,
    escanteios: porJogo("escanteios"),
    faltas: porJogo("faltas"),
    amarelos: porJogo("amarelos"),
    vermelhos: porJogo("vermelhos"),
    penaltis: porJogo("penaltis"),
    impedimentos: porJogo("impedimentos"),
    golsAtacantes: (soma.golsAtacantes ?? 0) / Math.max(1, soma.gols ?? 0),
    hatTricks: porJogo("hatTricks"),
    favoritoVence: (soma.favoritoVence ?? 0) / Math.max(1, favoritos),
  };
}

function contar(
  r: ResultadoPartida,
  add: (k: string, v: number) => void,
  comFavorito: boolean,
  favoritoEmCasa: boolean,
): void {
  const [c, f] = r.placar;
  add("gols", c + f);
  if (c + f === 0) add("zeroAZero", 1);
  if (!comFavorito) {
    if (c > f) add("vitoriaMandante", 1);
    else if (c === f) add("empates", 1);
    else add("vitoriaVisitante", 1);
  } else if ((favoritoEmCasa && c > f) || (!favoritoEmCasa && f > c)) add("favoritoVence", 1);
  for (const lado of ["casa", "fora"] as const) {
    const e = r.estatisticas[lado];
    add("chutes", e.chutes);
    add("chutesNoGol", e.chutesNoGol);
    add("escanteios", e.escanteios);
    add("faltas", e.faltas);
    add("amarelos", e.amarelos);
    add("vermelhos", e.vermelhos);
    add("impedimentos", e.impedimentos);
  }
  add("penaltis", r.eventos.filter((e) => e.tipo === "penalti").length);
  const gols = r.eventos.filter((e) => e.tipo === "gol");
  const porJogador = new Map<string, number>();
  for (const g of gols)
    if (g.jogador) porJogador.set(g.jogador, (porJogador.get(g.jogador) ?? 0) + 1);
  if ([...porJogador.values()].some((n) => n >= 3)) add("hatTricks", 1);
  // Nos times de teste, os atacantes são os de índice 15 a 18 do elenco.
  add(
    "golsAtacantes",
    gols.filter((g) => {
      const n = Number(g.jogador?.split("-").at(-1));
      return n >= 15;
    }).length,
  );
}

/** Metas fora da faixa (vazio = calibrado). */
export function foraDasMetas(m: Medicao): string[] {
  return (Object.keys(METAS) as (keyof typeof METAS)[])
    .filter((k) => m[k] < METAS[k].min || m[k] > METAS[k].max)
    .map((k) => `${METAS[k].nome}: ${m[k].toFixed(3)} (meta ${METAS[k].min} a ${METAS[k].max})`);
}
