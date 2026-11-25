/**
 * As competições do mundo inteiro numa carreira: cada país tem a sua temporada, as competições
 * nacionais e estaduais rodam dia a dia (simulação rápida, menos o jogo do técnico) e, quando a
 * temporada do país acaba, vêm o acesso, o rebaixamento e a temporada seguinte.
 */
import type { Competicao, DataFifa, Jogador, Pais } from "@newbras/data";
import { Rng } from "../rng";
import { temporadaDe, nomeTemporada } from "../carreira/calendario";
import { diaAbsoluto, somarDias } from "../carreira/datas";
import {
  avancarCompeticao,
  desempateDoJogo,
  jogosDoDia,
  lancarResultado,
  montarCompeticao,
  movimentosDaTemporada,
  type EstadoCompeticao,
  type Movimento,
} from "./competicao";
import { autoresDosGols, forcaDoElenco, simularRapido } from "./rapida";

export interface TemporadaDoPais {
  nome: string;
  inicio: string;
  fim: string;
}

export interface RegistroHistorico {
  temporada: string;
  competicao: string;
  campeao?: string;
  vice?: string;
  artilheiro?: { jogador: string; gols: number };
}

export interface MundoCompeticoes {
  /** A edição atual de cada competição, pelo id. */
  competicoes: Record<string, EstadoCompeticao>;
  temporadas: Record<string, TemporadaDoPais>;
  /** Participantes de cada competição na próxima temporada (muda com acesso e rebaixamento). */
  participantes: Record<string, string[]>;
  /** Classificação final da última temporada de cada competição (para as vagas das copas). */
  classificacoes?: Record<string, string[]>;
  historico: RegistroHistorico[];
}

/** O que as competições precisam saber do mundo. */
export interface MundoParaCompeticoes {
  competicoes: readonly Competicao[];
  competicao(id: string): Competicao | undefined;
  pais(codigo: string): Pais | undefined;
  elenco(clube: string): readonly Jogador[];
  datasFifa: readonly DataFifa[];
}

/** País de uma competição nacional ou estadual (as continentais ficam para a Fase 10). */
export function paisDaCompeticao(c: Competicao): string | null {
  return c.escopo.tipo === "pais" || c.escopo.tipo === "estado" ? c.escopo.pais : null;
}

const PRIORIDADE: Record<Competicao["tipo"], number> = {
  // A supercopa é um jogo (ou dois) numa janela curta: marca primeiro e os outros fogem dela.
  supercopa: -1,
  estadual: 0,
  regional: 1,
  liga: 2,
  copa: 3,
  continental: 5,
  intercontinental: 6,
  selecoes: 7,
  eliminatorias: 8,
};

function competicoesDoMundo(m: MundoParaCompeticoes): Competicao[] {
  return m.competicoes.filter((c) => c.categoria === "clubes" && paisDaCompeticao(c) !== null);
}

function participantesIniciais(c: Competicao): string[] {
  // Em competição de clubes, os fixos são ids de clube (os códigos de país ficam para as seleções).
  return c.participantes.fixos.filter((x) => !/^[A-Z]{3}$/.test(x));
}

/**
 * Clubes de uma competição em ordem de força: pela classificação da temporada anterior (quem não
 * estava nela vem depois) e, no empate ou na primeira temporada, pela força do elenco.
 */
function ranking(
  m: MundoParaCompeticoes,
  estado: MundoCompeticoes,
  id: string,
  daTemporada: Record<string, EstadoCompeticao>,
): string[] {
  const def = m.competicao(id);
  // A supercopa abre antes das outras: uma copa ainda fechada tem os participantes pelas vagas.
  const membros =
    daTemporada[id]?.participantes ??
    (def && !def.participantes.fixos.length && def.participantes.vagas.length
      ? participantesPorVagas(m, estado, def, daTemporada)
      : (estado.participantes[id] ?? (def ? participantesIniciais(def) : [])));
  const anterior = estado.classificacoes?.[id] ?? [];
  const pos = (x: string) => {
    const i = anterior.indexOf(x);
    return i < 0 ? Infinity : i;
  };
  return [...membros].sort(
    (a, b) => pos(a) - pos(b) || forca(m, b) - forca(m, a) || a.localeCompare(b),
  );
}

/**
 * Participantes de uma copa ou supercopa pelas vagas: os primeiros de cada liga, o campeão e o
 * vice (da temporada anterior; na primeira, os mais fortes). Vaga repetida passa para o próximo.
 */
function participantesPorVagas(
  m: MundoParaCompeticoes,
  estado: MundoCompeticoes,
  c: Competicao,
  daTemporada: Record<string, EstadoCompeticao>,
): string[] {
  const escolhidos: string[] = [];
  for (const v of c.participantes.vagas) {
    const ordem = ranking(m, estado, v.de, daTemporada);
    const proximo = (desde: number) => ordem.slice(desde).find((x) => !escolhidos.includes(x));
    if (v.criterio === "posicoes") {
      for (const p of v.posicoes ?? []) {
        const x = ordem[p - 1];
        const escolhido = x && !escolhidos.includes(x) ? x : v.repassa ? proximo(p - 1) : undefined;
        if (escolhido) escolhidos.push(escolhido);
      }
      continue;
    }
    const registro = [...estado.historico].reverse().find((h) => h.competicao === v.de);
    const doHistorico = v.criterio === "campeao" ? registro?.campeao : registro?.vice;
    const escolhido =
      doHistorico && !escolhidos.includes(doHistorico)
        ? doHistorico
        : proximo(v.criterio === "campeao" ? 0 : 1);
    if (escolhido) escolhidos.push(escolhido);
  }
  return escolhidos;
}

/** Abre a temporada de um país (a que contém a data, ou a próxima) com todas as competições dele. */
function abrirTemporada(
  m: MundoParaCompeticoes,
  estado: MundoCompeticoes,
  codigo: string,
  data: string,
  semente: string,
): MundoCompeticoes {
  const pais = m.pais(codigo);
  if (!pais) return estado;
  const t = temporadaDe(pais, data);
  const temporada: TemporadaDoPais = { nome: nomeTemporada(pais, data), ...t };
  const competicoes = { ...estado.competicoes };
  // Primeiro as de janela curta (supercopas, estaduais e regionais), depois as ligas (da 1ª divisão para baixo)
  // e as copas: cada uma foge das datas das anteriores, para o mesmo clube não ter dois jogos no
  // mesmo dia nem em dias seguidos.
  const ordem = competicoesDoMundo(m)
    .filter((c) => paisDaCompeticao(c) === codigo)
    .sort((a, b) => PRIORIDADE[a.tipo] - PRIORIDADE[b.tipo] || (a.divisao ?? 9) - (b.divisao ?? 9));
  const bloqueadas = new Set<string>();
  for (const c of ordem) {
    const participantes =
      c.participantes.fixos.length || !c.participantes.vagas.length
        ? (estado.participantes[c.id] ?? participantesIniciais(c))
        : participantesPorVagas(m, estado, c, competicoes);
    if (participantes.length < 2) continue;
    const e = montarCompeticao(c, participantes, t.inicio, {
      datasFifa: m.datasFifa,
      semente,
      temporada: temporada.nome,
      bloqueadas: new Set(bloqueadas),
    });
    competicoes[c.id] = e;
    // Estaduais e regionais só bloqueiam a 1ª divisão (as outras começam depois deles); a 1ª
    // divisão bloqueia as copas.
    if (c.tipo !== "liga" || c.divisao === 1) for (const d of e.datas) bloqueadas.add(d);
  }
  return { ...estado, competicoes, temporadas: { ...estado.temporadas, [codigo]: temporada } };
}

/** Começa o mundo na data: todas as temporadas abertas e os jogos anteriores já disputados. */
export function iniciarMundo(
  m: MundoParaCompeticoes,
  data: string,
  semente: string,
): MundoCompeticoes {
  let estado: MundoCompeticoes = {
    competicoes: {},
    temporadas: {},
    participantes: {},
    historico: [],
  };
  const paises = [
    ...new Set(competicoesDoMundo(m).map((c) => paisDaCompeticao(c) as string)),
  ].sort();
  for (const p of paises) estado = abrirTemporada(m, estado, p, data, semente);
  return jogarAte(m, estado, data, semente);
}

/** Cache de força por elenco (o elenco só muda com transferências, na Fase 13). */
const forcas = new WeakMap<readonly Jogador[], number>();
function forca(m: MundoParaCompeticoes, clube: string): number {
  const elenco = m.elenco(clube);
  let f = forcas.get(elenco);
  if (f === undefined) {
    f = forcaDoElenco(elenco);
    forcas.set(elenco, f);
  }
  return f;
}

/**
 * Joga, com a simulação rápida, os jogos de uma data em todas as competições. `pular` deixa de fora
 * o jogo do técnico (ele joga no motor completo).
 */
export function jogarDia(
  m: MundoParaCompeticoes,
  estado: MundoCompeticoes,
  data: string,
  semente: string,
  pular?: (competicao: string, indice: number) => boolean,
): MundoCompeticoes {
  let competicoes: Record<string, EstadoCompeticao> | null = null;
  for (const [id, e0] of Object.entries(estado.competicoes)) {
    const idx = jogosDoDia(e0, data).filter((i) => !pular?.(id, i));
    if (!idx.length) continue;
    const c = m.competicao(id);
    if (!c) continue;
    const rng = new Rng(`${semente}:${id}:${data}`);
    let e = e0;
    for (const i of idx) {
      const j = e.jogos[i];
      if (!j || j.placar) continue;
      const d = desempateDoJogo(c, e, j);
      const r = simularRapido(rng, forca(m, j.casa), forca(m, j.fora), {
        ...(j.neutro ? { neutro: true } : {}),
        desempate: d.desempate,
        ...(d.agregado ? { agregado: d.agregado } : {}),
      });
      const gols = [
        ...autoresDosGols(rng, m.elenco(j.casa), r.placar[0]),
        ...autoresDosGols(rng, m.elenco(j.fora), r.placar[1]),
      ];
      e = lancarResultado(e, i, r.placar, r.penaltis, gols);
    }
    e = avancarCompeticao(c, e, semente);
    competicoes ??= { ...estado.competicoes };
    competicoes[id] = e;
  }
  return competicoes ? { ...estado, competicoes } : estado;
}

/** Joga tudo o que estava marcado antes da data (para começar o mundo com as tabelas em dia). */
export function jogarAte(
  m: MundoParaCompeticoes,
  estado0: MundoCompeticoes,
  data: string,
  semente: string,
): MundoCompeticoes {
  let estado = estado0;
  const limite = diaAbsoluto(data);
  for (let guarda = 0; guarda < 2000; guarda++) {
    let menor: string | null = null;
    for (const e of Object.values(estado.competicoes))
      for (const j of e.jogos) {
        if (j.placar) continue;
        const d = e.datas[j.rodada];
        if (d && diaAbsoluto(d) < limite && (!menor || d < menor)) menor = d;
      }
    if (!menor) break;
    estado = jogarDia(m, estado, menor, semente);
  }
  return estado;
}

export interface Virada {
  estado: MundoCompeticoes;
  /** Competições que acabaram nesta virada e os movimentos de acesso e rebaixamento. */
  encerradas: { pais: string; temporada: string; movimentos: Movimento[] }[];
}

/**
 * Fecha a temporada dos países em que ela acabou (data depois do fim e competições encerradas):
 * guarda o histórico, aplica acesso e rebaixamento e abre a próxima temporada.
 */
export function virarTemporadas(
  m: MundoParaCompeticoes,
  estado0: MundoCompeticoes,
  data: string,
  semente: string,
): Virada {
  let estado = estado0;
  const encerradas: Virada["encerradas"] = [];
  for (const [codigo, t] of Object.entries(estado0.temporadas)) {
    if (data <= t.fim) continue;
    const doPais = Object.values(estado.competicoes).filter((e) => {
      const c = m.competicao(e.id);
      return c && paisDaCompeticao(c) === codigo && e.temporada === t.nome;
    });
    // Espera competições atrasadas até 30 dias depois do fim da temporada.
    if (doPais.some((e) => !e.encerrada) && diaAbsoluto(data) - diaAbsoluto(t.fim) < 30) continue;
    const movimentos: Movimento[] = [];
    const historico = [...estado.historico];
    const participantes = { ...estado.participantes };
    const classificacoes = { ...estado.classificacoes };
    for (const e of doPais) {
      const c = m.competicao(e.id);
      if (!c) continue;
      const artilheiro = Object.entries(e.artilharia).sort((a, b) => b[1][0] - a[1][0])[0];
      historico.push({
        temporada: e.temporada,
        competicao: e.id,
        ...(e.campeao ? { campeao: e.campeao } : {}),
        ...(e.classificacao?.[1] ? { vice: e.classificacao[1] } : {}),
        ...(artilheiro ? { artilheiro: { jogador: artilheiro[0], gols: artilheiro[1][0] } } : {}),
      });
      movimentos.push(...movimentosDaTemporada(c, e));
      if (e.classificacao) classificacoes[e.id] = e.classificacao;
      // Copas montam os participantes de novo a cada temporada, pelas vagas.
      if (c.participantes.fixos.length)
        participantes[e.id] = participantes[e.id] ?? [...e.participantes];
    }
    for (const mv of movimentos) {
      if (!m.competicao(mv.para)) continue;
      participantes[mv.de] = (participantes[mv.de] ?? []).filter((x) => x !== mv.clube);
      const destino = participantes[mv.para] ?? [
        ...(estado.competicoes[mv.para]?.participantes ?? []),
      ];
      participantes[mv.para] = destino.includes(mv.clube) ? destino : [...destino, mv.clube];
    }
    estado = { ...estado, historico, participantes, classificacoes };
    estado = abrirTemporada(m, estado, codigo, somarDias(data, 0), semente);
    encerradas.push({ pais: codigo, temporada: t.nome, movimentos });
  }
  return { estado, encerradas };
}

/** Jogos de um clube (competição, índice, data), em ordem de data. */
export function jogosDoClube(estado: MundoCompeticoes, clube: string) {
  const lista: { competicao: string; indice: number; data: string }[] = [];
  for (const e of Object.values(estado.competicoes))
    e.jogos.forEach((j, i) => {
      if (j.casa === clube || j.fora === clube)
        lista.push({ competicao: e.id, indice: i, data: e.datas[j.rodada] ?? "" });
    });
  return lista.sort((a, b) => a.data.localeCompare(b.data));
}
