/**
 * As competições do mundo inteiro numa carreira: cada país tem a sua temporada, as competições
 * nacionais e estaduais rodam dia a dia (simulação rápida, menos o jogo do técnico) e, quando a
 * temporada do país acaba, vêm o acesso, o rebaixamento e a temporada seguinte.
 */
import type { Competicao, Confederacao, DataFifa, Jogador, Pais, Periodo } from "@newbras/data";
import { Rng } from "../rng";
import { temporadaDe, nomeTemporada } from "../carreira/calendario";
import { diaAbsoluto, somarDias } from "../carreira/datas";
import {
  avancarCompeticao,
  datasPlanejadas,
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

/** País de uma competição nacional ou estadual (null nas continentais). */
export function paisDaCompeticao(c: Competicao): string | null {
  return c.escopo.tipo === "pais" || c.escopo.tipo === "estado" ? c.escopo.pais : null;
}

/**
 * Temporada das competições continentais de cada confederação. Começa depois de as ligas que dão
 * as vagas terminarem: a Libertadores de 2028 usa o Brasileirão de 2027; a Champions de 2027/28,
 * as ligas de 2026/27.
 */
export const TEMPORADA_DA_CONFEDERACAO: Record<Confederacao, Periodo> = {
  CONMEBOL: { inicio: "01-01", fim: "12-31" },
  CONCACAF: { inicio: "01-01", fim: "12-31" },
  OFC: { inicio: "01-01", fim: "12-31" },
  UEFA: { inicio: "07-01", fim: "06-30" },
  AFC: { inicio: "07-01", fim: "06-30" },
  CAF: { inicio: "07-01", fim: "06-30" },
};

/** Chave da temporada de uma competição: o país, ou "conf:UEFA" nas continentais. */
export function chaveDaCompeticao(c: Competicao): string | null {
  if (c.escopo.tipo === "confederacao") return `conf:${c.escopo.confederacao}`;
  return paisDaCompeticao(c);
}

/** Período da temporada de uma chave (país ou confederação). */
function periodoDaChave(m: MundoParaCompeticoes, chave: string): Periodo | undefined {
  if (chave.startsWith("conf:"))
    return TEMPORADA_DA_CONFEDERACAO[chave.slice(5) as Confederacao] as Periodo | undefined;
  return m.pais(chave)?.temporada;
}

/**
 * Datas das continentais da confederação que caem entre `inicio` e `fim`. Saem do calendário de
 * cada competição e da quantidade prevista de participantes, então são conhecidas antes de a
 * temporada continental abrir: as ligas e copas do país marcam os jogos fugindo delas.
 */
export function datasContinentais(
  m: MundoParaCompeticoes,
  confederacao: Confederacao,
  inicio: string,
  fim: string,
): Set<string> {
  const periodo = TEMPORADA_DA_CONFEDERACAO[confederacao];
  const datas = new Set<string>();
  const continentais = m.competicoes.filter(
    (c) =>
      c.categoria === "clubes" &&
      c.escopo.tipo === "confederacao" &&
      c.escopo.confederacao === confederacao,
  );
  if (!continentais.length) return datas;
  // As temporadas continentais que tocam o período (uma liga de ano civil pega duas).
  const inicios = new Set([temporadaDe({ temporada: periodo }, inicio).inicio]);
  inicios.add(temporadaDe({ temporada: periodo }, fim).inicio);
  let cache = cacheContinental.get(m);
  if (!cache) cacheContinental.set(m, (cache = new Map()));
  for (const i of inicios)
    for (const c of continentais) {
      const chave = `${c.id}:${i}`;
      let lista = cache.get(chave);
      if (!lista) cache.set(chave, (lista = datasPlanejadas(c, i, m.datasFifa)));
      for (const d of lista) if (d >= inicio && d <= fim) datas.add(d);
    }
  return datas;
}

/** Datas planejadas das continentais, por mundo (o calendário não muda durante o jogo). */
const cacheContinental = new WeakMap<MundoParaCompeticoes, Map<string, string[]>>();

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

/**
 * Ordem em que as competições do país marcam as datas: as copas logo depois da 1ª divisão e antes
 * das outras divisões, que têm mais folga (não jogam continental) e fogem das datas da copa.
 */
function prioridade(c: Competicao): number {
  if (c.tipo === "liga" && (c.divisao ?? 1) > 1) return PRIORIDADE.copa + 0.5;
  return PRIORIDADE[c.tipo];
}

function competicoesDoMundo(m: MundoParaCompeticoes): Competicao[] {
  return m.competicoes.filter((c) => c.categoria === "clubes" && chaveDaCompeticao(c) !== null);
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
  // Quem já está numa competição excluída (a Libertadores, para a Sul-Americana) não entra.
  const fora = new Set(
    c.participantes.exclui.flatMap((id) => daTemporada[id]?.participantes ?? []),
  );
  const ocupado = (x: string) => escolhidos.includes(x) || fora.has(x);
  for (const v of c.participantes.vagas) {
    const ordem = ranking(m, estado, v.de, daTemporada);
    const proximo = (desde: number) => ordem.slice(desde).find((x) => !ocupado(x));
    if (v.criterio === "posicoes") {
      for (const p of v.posicoes ?? []) {
        const x = ordem[p - 1];
        const escolhido = x && !ocupado(x) ? x : v.repassa ? proximo(p - 1) : undefined;
        if (escolhido) escolhidos.push(escolhido);
      }
      continue;
    }
    const registro = [...estado.historico].reverse().find((h) => h.competicao === v.de);
    const doHistorico = v.criterio === "campeao" ? registro?.campeao : registro?.vice;
    const escolhido =
      doHistorico && !ocupado(doHistorico)
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
  const periodo = periodoDaChave(m, codigo);
  if (!periodo) return estado;
  const t = temporadaDe({ temporada: periodo }, data);
  const temporada: TemporadaDoPais = { nome: nomeTemporada({ temporada: periodo }, data), ...t };
  const competicoes = { ...estado.competicoes };
  const continental = codigo.startsWith("conf:");
  const confederacao = continental ? undefined : m.pais(codigo)?.confederacao;
  // Primeiro as de janela curta (supercopas, estaduais e regionais), depois as ligas (da 1ª divisão para baixo)
  // e as copas: cada uma foge das datas das anteriores, para o mesmo clube não ter dois jogos no
  // mesmo dia nem em dias seguidos.
  // Nas continentais, a que exclui outra abre depois dela (a Sul-Americana depois da Libertadores).
  const ordem = competicoesDoMundo(m)
    .filter((c) => chaveDaCompeticao(c) === codigo)
    .sort(
      (a, b) =>
        prioridade(a) - prioridade(b) ||
        a.participantes.exclui.length - b.participantes.exclui.length ||
        (a.divisao ?? 9) - (b.divisao ?? 9),
    );
  // As datas das continentais da confederação ficam reservadas desde o começo, para quem pode ter
  // clube nelas (1ª divisão, copas, estaduais e regionais; as divisões de baixo não).
  const reservadas = confederacao
    ? datasContinentais(m, confederacao, t.inicio, t.fim)
    : new Set<string>();
  // Cada competição foge das datas das que já marcaram e dividem clubes com ela (o Paulistão não
  // atrapalha o Carioca; a Copa do Nordeste só pesa para quem a joga).
  const marcadas: { clubes: Set<string>; datas: readonly string[] }[] = [];
  for (const c of ordem) {
    const participantes =
      c.participantes.fixos.length || !c.participantes.vagas.length
        ? (estado.participantes[c.id] ?? participantesIniciais(c))
        : participantesPorVagas(m, estado, c, competicoes);
    if (participantes.length < 2) continue;
    let bloqueadas: Set<string> | undefined;
    if (!continental) {
      bloqueadas = new Set(c.tipo === "liga" && (c.divisao ?? 1) > 1 ? [] : reservadas);
      for (const x of marcadas)
        if (participantes.some((p) => x.clubes.has(p))) for (const d of x.datas) bloqueadas.add(d);
    }
    const e = montarCompeticao(c, participantes, t.inicio, {
      datasFifa: m.datasFifa,
      semente,
      temporada: temporada.nome,
      ...(bloqueadas ? { bloqueadas } : { quantidadePlanejada: c.participantes.quantidade }),
    });
    competicoes[c.id] = e;
    if (!continental) marcadas.push({ clubes: new Set(participantes), datas: e.datas });
  }
  return { ...estado, competicoes, temporadas: { ...estado.temporadas, [codigo]: temporada } };
}

/**
 * Abre as temporadas que ainda não existem no estado (competições novas num salvamento antigo,
 * como as continentais), simulando os jogos delas que já passaram.
 */
export function abrirTemporadasFaltando(
  m: MundoParaCompeticoes,
  estado0: MundoCompeticoes,
  data: string,
  semente: string,
): MundoCompeticoes {
  const faltando = [...new Set(competicoesDoMundo(m).map((c) => chaveDaCompeticao(c) as string))]
    .filter((ch) => !estado0.temporadas[ch])
    .sort();
  if (!faltando.length) return estado0;
  let estado = estado0;
  for (const ch of faltando) estado = abrirTemporada(m, estado, ch, data, semente);
  const novas = new Set(
    competicoesDoMundo(m)
      .filter((c) => faltando.includes(chaveDaCompeticao(c) as string))
      .map((c) => c.id),
  );
  // Só os jogos já passados das competições novas (as outras já estão em dia).
  for (const e of Object.values(estado.competicoes)) {
    if (!novas.has(e.id)) continue;
    const dias = [...new Set(e.datas.filter((d) => d < data))].sort();
    for (const d of dias) estado = jogarDia(m, estado, d, semente, (id) => !novas.has(id));
  }
  return estado;
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
  // Países antes das confederações ("conf:" vem depois das siglas), para as vagas continentais.
  const paises = [
    ...new Set(competicoesDoMundo(m).map((c) => chaveDaCompeticao(c) as string)),
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
/** Um jogo simulado do dia, com os gols (autor, assistência e minuto) para o plantão. */
export interface JogoSimulado {
  competicao: string;
  indice: number;
  casa: string;
  fora: string;
  placar: [number, number];
  penaltis?: [number, number];
  prorrogacao: boolean;
  gols: { lado: "casa" | "fora"; minuto: number; jogador: string; assistencia?: string }[];
}

/**
 * Simula os jogos do dia de uma competição. O sorteio é o mesmo de `jogarDia` (por competição e
 * data), então o plantão de gols mostra exatamente os resultados que o dia vai registrar. Os
 * minutos dos gols vêm de outro fluxo e não mudam os resultados.
 */
function simularJogosDoDia(
  m: MundoParaCompeticoes,
  c: Competicao,
  e: EstadoCompeticao,
  data: string,
  semente: string,
  pular?: (competicao: string, indice: number) => boolean,
): JogoSimulado[] {
  const idx = jogosDoDia(e, data).filter((i) => !pular?.(c.id, i));
  if (!idx.length) return [];
  const rng = new Rng(`${semente}:${c.id}:${data}`);
  const lista: JogoSimulado[] = [];
  for (const i of idx) {
    const j = e.jogos[i];
    if (!j || j.placar) continue;
    const d = desempateDoJogo(c, e, j);
    const r = simularRapido(rng, forca(m, j.casa), forca(m, j.fora), {
      ...(j.neutro ? { neutro: true } : {}),
      desempate: d.desempate,
      ...(d.agregado ? { agregado: d.agregado } : {}),
    });
    const autores = {
      casa: autoresDosGols(rng, m.elenco(j.casa), r.placar[0]),
      fora: autoresDosGols(rng, m.elenco(j.fora), r.placar[1]),
    };
    const relogio = new Rng(`${semente}:${c.id}:${data}:${i}:minutos`);
    const gols: JogoSimulado["gols"] = [];
    (["casa", "fora"] as const).forEach((lado, k) => {
      const normal = r.noTempoNormal[k] as number;
      for (let g = 0; g < (r.placar[k] as number); g++) {
        const autor = autores[lado][g];
        const minuto = g < normal ? relogio.int(1, 90) : relogio.int(91, 120);
        gols.push({
          lado,
          minuto,
          jogador: autor?.jogador ?? "",
          ...(autor?.assistencia ? { assistencia: autor.assistencia } : {}),
        });
      }
    });
    gols.sort((a, b) => a.minuto - b.minuto);
    lista.push({
      competicao: c.id,
      indice: i,
      casa: j.casa,
      fora: j.fora,
      placar: r.placar,
      ...(r.penaltis ? { penaltis: r.penaltis } : {}),
      prorrogacao: r.prorrogacao,
      gols,
    });
  }
  return lista;
}

/** Joga o dia inteiro no mundo (simulação rápida), menos os jogos que `pular` indicar. */
export function jogarDia(
  m: MundoParaCompeticoes,
  estado: MundoCompeticoes,
  data: string,
  semente: string,
  pular?: (competicao: string, indice: number) => boolean,
): MundoCompeticoes {
  let competicoes: Record<string, EstadoCompeticao> | null = null;
  for (const [id, e0] of Object.entries(estado.competicoes)) {
    if (!jogosDoDia(e0, data).length) continue;
    const c = m.competicao(id);
    if (!c) continue;
    const jogos = simularJogosDoDia(m, c, e0, data, semente, pular);
    if (!jogos.length) continue;
    let e = e0;
    for (const j of jogos)
      e = lancarResultado(
        e,
        j.indice,
        j.placar,
        j.penaltis,
        j.gols.filter((g) => g.jogador),
      );
    e = avancarCompeticao(c, e, semente);
    competicoes ??= { ...estado.competicoes };
    competicoes[id] = e;
  }
  return competicoes ? { ...estado, competicoes } : estado;
}

/**
 * Os outros jogos do dia nas competições pedidas, já simulados, para o plantão de gols durante a
 * partida do técnico. São os mesmos placares que `jogarDia` vai lançar depois.
 */
export function plantaoDoDia(
  m: MundoParaCompeticoes,
  estado: MundoCompeticoes,
  data: string,
  semente: string,
  competicoes: readonly string[],
  pular?: (competicao: string, indice: number) => boolean,
): JogoSimulado[] {
  return competicoes.flatMap((id) => {
    const c = m.competicao(id);
    const e = estado.competicoes[id];
    return c && e ? simularJogosDoDia(m, c, e, data, semente, pular) : [];
  });
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
      return c && chaveDaCompeticao(c) === codigo && e.temporada === t.nome;
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
