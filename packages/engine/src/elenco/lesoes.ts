/**
 * Lesões (etapas 12b e 12b2). A chance de se machucar depende do cansaço, da posição, da idade, do
 * físico (resistência e força física protegem), da fragilidade de cada jogador (sorteada pela
 * semente: uns são de vidro, outros quase nunca param) e da recaída logo depois de voltar. O tipo
 * da lesão depende da causa: falta puxa pancada, entorse e fratura; cansaço e treino puxam lesão
 * muscular. Veteranos demoram mais para voltar.
 */
import type { Atributos, Jogador, Pais, Posicao } from "@newbras/data";
import { chave } from "@newbras/textos";
import { diasEntre, somarDias } from "../carreira/datas";
import { idadeEm } from "../evolucao";
import { Rng } from "../rng";

export interface Lesao {
  /** Nome da lesão em português (a chave da tradução). */
  nome: string;
  /** Volta a poder jogar nesta data. */
  ate: string;
  dias: number;
}

export type CausaDaLesao = "falta" | "cansaco" | "treino";

/**
 * Tipos de lesão com a faixa de dias fora e o peso de cada causa (falta, cansaço no jogo, treino).
 * Os pesos de cada causa somam 100.
 */
export const TIPOS_DE_LESAO: readonly {
  nome: string;
  dias: [number, number];
  peso: Record<CausaDaLesao, number>;
}[] = [
  { nome: chave("Pancada"), dias: [2, 6], peso: { falta: 45, cansaco: 8, treino: 25 } },
  {
    nome: chave("Estiramento muscular"),
    dias: [7, 21],
    peso: { falta: 6, cansaco: 40, treino: 35 },
  },
  {
    nome: chave("Entorse no tornozelo"),
    dias: [10, 28],
    peso: { falta: 22, cansaco: 12, treino: 13 },
  },
  {
    nome: chave("Lesão muscular na coxa"),
    dias: [21, 45],
    peso: { falta: 5, cansaco: 26, treino: 17 },
  },
  { nome: chave("Lesão no joelho"), dias: [40, 100], peso: { falta: 9, cansaco: 8, treino: 6 } },
  { nome: chave("Fratura"), dias: [60, 120], peso: { falta: 9, cansaco: 1, treino: 1 } },
  {
    nome: chave("Ruptura do ligamento cruzado"),
    dias: [180, 270],
    peso: { falta: 4, cansaco: 5, treino: 3 },
  },
];

/** Chance de se machucar num dia de treino, antes dos fatores do jogador. */
export const CHANCE_LESAO_TREINO = 0.001;
/** Lesões por time em cada jogo simulado da CPU (a média do motor de partida). */
export const LESOES_POR_JOGO_CPU = 0.24;
/** Na CPU, lesão por falta e por cansaço meio a meio (como no motor). */
const FALTA_NA_CPU = 0.45;

/** Risco pela posição: goleiro quase não se machuca; laterais e atacantes, mais. */
export const RISCO_DA_POSICAO: Readonly<Record<Posicao, number>> = {
  G: 0.35,
  Z: 0.9,
  L: 1.1,
  M: 1,
  A: 1.1,
};
/** A partir dessa idade, o risco sobe 4% por ano e a recuperação demora 2% a mais por ano. */
const IDADE_DO_RISCO = 28;
/** Recaída: logo depois de voltar, o risco chega a 2,5 vezes e cai até o normal nesses dias. */
const DIAS_DE_RECAIDA = 28;

/** Fragilidade do jogador: fixa, sorteada pela semente (0,5 = quase nunca para; 2,2 = de vidro). */
export function fragilidade(semente: string, id: string): number {
  const r = new Rng(`${semente}:fragilidade:${id}`);
  return Math.round(Math.min(2.2, Math.max(0.5, Math.exp(r.normal(0, 0.35)))) * 100) / 100;
}

/** O físico protege: resistência e força física altas tiram até 12% do risco; baixas somam. */
function protecaoDoFisico(posicao: Posicao, atributos: Atributos | undefined): number {
  if (posicao === "G" || !atributos) return 1;
  const media = ((atributos.resistencia ?? 50) + (atributos.forcaFisica ?? 50)) / 2;
  return 1.15 - 0.3 * (media / 100);
}

/** Recaída: o risco a mais nos dias seguintes à volta da última lesão. */
export function fatorDeRecaida(lesao: Lesao | undefined, data: string): number {
  if (!lesao || lesao.ate > data) return 1;
  const dias = diasEntre(lesao.ate, data);
  return dias >= DIAS_DE_RECAIDA ? 1 : 1 + 1.5 * (1 - dias / DIAS_DE_RECAIDA);
}

/** Multiplicador do risco de lesão do jogador (1 = o normal). */
export function riscoDeLesao(
  j: Pick<Jogador, "id" | "posicao" | "nascimento" | "atributos">,
  data: string,
  semente: string,
  ultima?: Lesao,
): number {
  const idade = idadeEm(j.nascimento, data);
  const r =
    RISCO_DA_POSICAO[j.posicao] *
    (1 + 0.04 * Math.max(0, idade - IDADE_DO_RISCO)) *
    protecaoDoFisico(j.posicao, j.atributos) *
    fragilidade(semente, j.id) *
    fatorDeRecaida(ultima, data);
  return Math.round(r * 100) / 100;
}

/** Sorteia a lesão pela causa; veteranos demoram mais para voltar. */
export function sortearLesao(rng: Rng, data: string, causa: CausaDaLesao, idade = 25): Lesao {
  const tipo = rng.weighted(TIPOS_DE_LESAO, (x) => x.peso[causa]);
  const base = rng.int(tipo.dias[0], tipo.dias[1]);
  const dias = Math.round(base * (1 + 0.02 * Math.max(0, idade - IDADE_DO_RISCO)));
  return { nome: tipo.nome, ate: somarDias(data, dias), dias };
}

export function lesionado(e: { lesao?: Lesao } | undefined, data: string): boolean {
  return !!e?.lesao && e.lesao.ate > data;
}

/**
 * Férias: das 3 semanas depois do fim da temporada até a pré-temporada (3 semanas antes do começo).
 * Sem treino, sem lesão de treino.
 */
export function emFerias(pais: Pick<Pais, "temporada"> | undefined, data: string): boolean {
  if (!pais) return false;
  const ano = Number(data.slice(0, 4));
  for (const a of [ano - 1, ano]) {
    const fim = `${a}-${pais.temporada.fim}`;
    let inicio = `${a}-${pais.temporada.inicio}`;
    if (inicio <= fim) inicio = `${a + 1}-${pais.temporada.inicio}`;
    const ferias = somarDias(fim, 1);
    const ate = [somarDias(fim, 21), somarDias(inicio, -21)].sort().at(-1) as string;
    const limite = ate < inicio ? ate : somarDias(inicio, -1);
    if (data >= ferias && data <= limite) return true;
  }
  return false;
}

// ------------------------------------------------------------------------------- A CPU

/** Lesionados dos clubes da CPU: clube → [jogador, volta em]. */
export type LesionadosDaCpu = Readonly<Record<string, readonly (readonly [string, string])[]>>;

/** Quem está fora no clube da CPU na data. */
export function foraNaCpu(lesionados: LesionadosDaCpu | undefined, clube: string, data: string) {
  const l = lesionados?.[clube];
  if (!l?.length) return undefined;
  const ids = new Set(l.filter(([, ate]) => ate > data).map(([id]) => id));
  return ids.size ? ids : undefined;
}

/** O elenco da CPU sem os lesionados (o mesmo array, se ninguém estiver fora). */
export function elencoSemLesionados(
  elenco: readonly Jogador[],
  lesionados: LesionadosDaCpu | undefined,
  clube: string,
  data: string,
): readonly Jogador[] {
  const fora = foraNaCpu(lesionados, clube, data);
  return fora ? elenco.filter((j) => !fora.has(j.id)) : elenco;
}

/**
 * Depois de um jogo simulado da CPU: pode haver uma lesão no time, de quem costuma jogar (os 16
 * mais fortes), pesando o risco de cada um. Devolve [jogador, volta em] ou nada.
 */
export function lesaoNaCpu(
  elenco: readonly Jogador[],
  data: string,
  semente: string,
  chaveDoJogo: string,
): readonly [string, string] | undefined {
  const rng = new Rng(`${semente}:lesao-cpu:${chaveDoJogo}`);
  if (!elenco.length || !rng.chance(LESOES_POR_JOGO_CPU)) return undefined;
  const provaveis = [...elenco].sort((a, b) => b.forca - a.forca).slice(0, 16);
  const j = rng.weighted(provaveis, (x) => riscoDeLesao(x, data, semente));
  const causa: CausaDaLesao = rng.chance(FALTA_NA_CPU) ? "falta" : "cansaco";
  const l = sortearLesao(rng, data, causa, idadeEm(j.nascimento, data));
  return [j.id, l.ate];
}
