/**
 * Amistosos de seleções nas datas FIFA (etapa 11e). Cada janela tem dias de amistoso; na véspera de
 * cada um, as seleções sem jogo oficial perto dele são pareadas, de preferência com uma da mesma
 * confederação e de força parecida (as rodadas do formato suíço só existem depois da anterior, por
 * isso a véspera). No dia, um amistoso que caiu perto de um jogo oficial sorteado depois (a final
 * de um playoff) é cancelado.
 */
import type { Competicao, DataFifa, Jogador } from "@newbras/data";
import { Rng } from "../rng";
import { diaAbsoluto, diasEntre, somarDias } from "../carreira/datas";
import { autoresDosGols, forcaDoElenco, simularRapido } from "../competicoes/rapida";
import type { EstadoCompeticao } from "../competicoes/competicao";

export interface AmistosoDeSelecao {
  data: string;
  casa: string;
  fora: string;
  placar?: [number, number];
  /** Autores dos gols de cada lado (ids dos jogadores). */
  gols?: [string[], string[]];
  /** Caiu perto de um jogo oficial e não aconteceu. */
  cancelado?: true;
}

/** Chance de uma seleção livre marcar amistoso numa data (nem todas acham adversário). */
export const CHANCE_DE_AMISTOSO = 0.85;
/** Dias da janela por jogo: março, junho e novembro têm 2 datas; setembro e outubro, 4. */
const DIAS_POR_JOGO = 4.5;
/** Janela mais longa que isso é a de um torneio (a Copa do Mundo de 2026): sem amistosos. */
const JANELA_MAXIMA = 20;
/** Uma seleção não joga amistoso a menos desses dias de um jogo oficial. */
const FOLGA = 2;
/** Por quantos dias os amistosos ficam guardados (a aba Seleções mostra o último ano). */
const GUARDAR_DIAS = 400;

/** O que os amistosos precisam do mundo. */
export interface MundoParaAmistosos {
  competicoes: readonly Competicao[];
  competicao(id: string): Competicao | undefined;
  pais(codigo: string): { confederacao: string } | undefined;
  elenco(id: string): readonly Jogador[];
  datasFifa: readonly DataFifa[];
}

const ehSelecao = (x: string) => /^[A-Z]{3}$/.test(x);

const listas = new WeakMap<readonly Competicao[], string[]>();
/** Todas as seleções das competições do banco (as 211 da FIFA estão em alguma eliminatória). */
export function selecoesDoMundo(m: Pick<MundoParaAmistosos, "competicoes">): string[] {
  let l = listas.get(m.competicoes);
  if (!l) {
    const s = new Set<string>();
    for (const c of m.competicoes) {
      if (c.categoria !== "selecoes") continue;
      for (const x of c.participantes.fixos) if (ehSelecao(x)) s.add(x);
      for (const f of c.fases) for (const x of f.fixosAqui) s.add(x);
    }
    l = [...s].sort();
    listas.set(m.competicoes, l);
  }
  return l;
}

const forcas = new WeakMap<readonly Jogador[], number>();
function forca(m: MundoParaAmistosos, pais: string): number {
  const elenco = m.elenco(pais);
  let f = forcas.get(elenco);
  if (f === undefined) {
    f = forcaDoElenco(elenco);
    forcas.set(elenco, f);
  }
  return f;
}

/** A janela FIFA em que a data cai, se houver (as de torneio ficam de fora). */
export function janelaDaData(
  datasFifa: readonly DataFifa[],
  data: string,
): { inicio: string; fim: string } | undefined {
  const ano = Number(data.slice(0, 4));
  for (const d of datasFifa) {
    if (d.anos && !d.anos.includes(ano)) continue;
    const inicio = `${ano}-${d.periodo.inicio}`;
    const fim = `${ano}-${d.periodo.fim}`;
    if (fim < inicio || data < inicio || data > fim) continue;
    if (diasEntre(inicio, fim) + 1 > JANELA_MAXIMA) continue;
    return { inicio, fim };
  }
  return undefined;
}

/** Os dias de amistoso de uma janela: um no meio de cada pedaço dela. */
export function diasDosAmistosos(inicio: string, fim: string): string[] {
  const dias = diasEntre(inicio, fim) + 1;
  const n = Math.max(1, Math.round(dias / DIAS_POR_JOGO));
  const lista: string[] = [];
  for (let i = 0; i < n; i++) {
    const de = Math.floor((i * dias) / n);
    const ate = Math.floor(((i + 1) * dias) / n) - 1;
    lista.push(somarDias(inicio, Math.floor((de + ate) / 2)));
  }
  return lista;
}

/** Dias de jogo oficial de cada seleção (nas competições de seleções em andamento). */
export function diasOficiais(
  m: Pick<MundoParaAmistosos, "competicao">,
  competicoes: Readonly<Record<string, EstadoCompeticao>>,
): Map<string, number[]> {
  const dias = new Map<string, number[]>();
  for (const e of Object.values(competicoes)) {
    if (m.competicao(e.id)?.categoria !== "selecoes") continue;
    for (const j of e.jogos) {
      const d = diaAbsoluto(e.datas[j.rodada] as string);
      for (const t of [j.casa, j.fora]) {
        const l = dias.get(t);
        if (l) l.push(d);
        else dias.set(t, [d]);
      }
    }
  }
  return dias;
}

const perto = (dias: readonly number[] | undefined, d: number, folga = FOLGA) =>
  !!dias?.some((x) => Math.abs(x - d) <= folga);

/**
 * Os amistosos do dia, se ele é um dia de amistoso de uma janela FIFA (vazio se não é ou se os dele
 * já foram marcados).
 */
export function marcarAmistosos(
  m: MundoParaAmistosos,
  competicoes: Readonly<Record<string, EstadoCompeticao>>,
  existentes: readonly AmistosoDeSelecao[],
  dia: string,
  semente: string,
): AmistosoDeSelecao[] {
  const janela = janelaDaData(m.datasFifa, dia);
  if (!janela || !diasDosAmistosos(janela.inicio, janela.fim).includes(dia)) return [];
  if (existentes.some((a) => a.data === dia)) return [];
  const rng = new Rng(`${semente}:amistosos:${dia}`);
  const oficiais = diasOficiais(m, competicoes);
  const selecoes = selecoesDoMundo(m);
  const marcados: AmistosoDeSelecao[] = [];
  {
    const d = diaAbsoluto(dia);
    const livres = rng.shuffle(
      selecoes.filter((s) => !perto(oficiais.get(s), d) && rng.chance(CHANCE_DE_AMISTOSO)),
    );
    while (livres.length > 1) {
      const a = livres.shift() as string;
      const fa = forca(m, a);
      const conf = m.pais(a)?.confederacao;
      let melhor = 0;
      let nota = Infinity;
      livres.forEach((b, i) => {
        const n =
          Math.abs(forca(m, b) - fa) + (m.pais(b)?.confederacao === conf ? 0 : 8) + rng.next() * 6;
        if (n < nota) {
          nota = n;
          melhor = i;
        }
      });
      const b = livres.splice(melhor, 1)[0] as string;
      const [casa, fora] = rng.chance(0.5) ? [a, b] : [b, a];
      marcados.push({ data: dia, casa, fora });
    }
  }
  return marcados.sort((x, y) => x.data.localeCompare(y.data) || x.casa.localeCompare(y.casa));
}

/**
 * Joga os amistosos do dia (e cancela os que caíram perto de um jogo oficial). Devolve a lista nova,
 * ou a mesma se nada mudou.
 */
export function jogarAmistosos(
  m: MundoParaAmistosos,
  competicoes: Readonly<Record<string, EstadoCompeticao>>,
  amistosos: readonly AmistosoDeSelecao[],
  data: string,
  semente: string,
): readonly AmistosoDeSelecao[] {
  if (!amistosos.some((a) => a.data === data && !a.placar && !a.cancelado)) return amistosos;
  const oficiais = diasOficiais(m, competicoes);
  const d = diaAbsoluto(data);
  const rng = new Rng(`${semente}:amistosos:jogos:${data}`);
  return amistosos.map((a) => {
    if (a.data !== data || a.placar || a.cancelado) return a;
    if (perto(oficiais.get(a.casa), d) || perto(oficiais.get(a.fora), d))
      return { ...a, cancelado: true as const };
    const r = simularRapido(rng, forca(m, a.casa), forca(m, a.fora));
    const gols: [string[], string[]] = [
      autoresDosGols(rng, m.elenco(a.casa), r.placar[0]).map((g) => g.jogador),
      autoresDosGols(rng, m.elenco(a.fora), r.placar[1]).map((g) => g.jogador),
    ];
    return { ...a, placar: [r.placar[0], r.placar[1]], gols };
  });
}

/** Tira os amistosos antigos (guarda pouco mais de um ano). */
export function amistososRecentes(
  amistosos: readonly AmistosoDeSelecao[],
  data: string,
): readonly AmistosoDeSelecao[] {
  const corte = somarDias(data, -GUARDAR_DIAS);
  return amistosos[0] && amistosos[0].data < corte
    ? amistosos.filter((a) => a.data >= corte)
    : amistosos;
}

/** Um jogo de seleção, oficial ou amistoso, para a aba Seleções e os convocados. */
export interface JogoDeSelecao {
  data: string;
  casa: string;
  fora: string;
  /** Competição do jogo oficial (sem ela, é amistoso). */
  competicao?: string;
  indice?: number;
  placar?: readonly [number, number];
  penaltis?: readonly [number, number];
  /** Autores dos gols de cada lado (ids; só nos amistosos). */
  gols?: readonly [readonly string[], readonly string[]];
  neutro?: boolean;
}

/** Os jogos de seleções (oficiais e amistosos) em ordem de data, de todas ou só de uma. */
export function jogosDeSelecoes(
  m: Pick<MundoParaAmistosos, "competicao">,
  competicoes: Readonly<Record<string, EstadoCompeticao>>,
  amistosos: readonly AmistosoDeSelecao[] = [],
  selecao?: string,
): JogoDeSelecao[] {
  const lista: JogoDeSelecao[] = [];
  const quer = (j: { casa: string; fora: string }) =>
    !selecao || j.casa === selecao || j.fora === selecao;
  for (const e of Object.values(competicoes)) {
    if (m.competicao(e.id)?.categoria !== "selecoes") continue;
    e.jogos.forEach((j, i) => {
      if (!quer(j)) return;
      lista.push({
        data: e.datas[j.rodada] as string,
        casa: j.casa,
        fora: j.fora,
        competicao: e.id,
        indice: i,
        ...(j.placar ? { placar: j.placar } : {}),
        ...(j.penaltis ? { penaltis: j.penaltis } : {}),
        ...(j.neutro ? { neutro: true } : {}),
      });
    });
  }
  for (const a of amistosos)
    if (!a.cancelado && quer(a))
      lista.push({
        data: a.data,
        casa: a.casa,
        fora: a.fora,
        ...(a.placar ? { placar: a.placar } : {}),
        ...(a.gols ? { gols: a.gols } : {}),
      });
  return lista.sort((x, y) => x.data.localeCompare(y.data) || x.casa.localeCompare(y.casa));
}
