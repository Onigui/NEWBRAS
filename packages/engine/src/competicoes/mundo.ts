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
  anoFinal,
  avancarCompeticao,
  datasPlanejadas,
  datasPlanejadasPorFase,
  quantidadeInicial,
  receberEntrantes,
  resolverVagaDinamica,
  vagaDaPropria,
  vagaDinamica,
  desempateDoJogo,
  jogosDoDia,
  lancarResultado,
  montarCompeticao,
  movimentosDaTemporada,
  type EstadoCompeticao,
  type Movimento,
} from "./competicao";
import { autoresDosGols, forcaDoElenco, simularRapido } from "./rapida";

export { anoFinal };

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
  /** Até os 32 primeiros (só nas continentais): o ranking do Mundial de Clubes sai daqui. */
  classificacao?: string[];
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
  /** País do clube, para os sorteios das continentais evitarem clubes do mesmo país. */
  clube?(id: string): { pais: string; filialDe?: string | undefined } | undefined;
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

/** Temporada das competições mundiais de clubes (Copa Intercontinental, Mundial de Clubes). */
export const TEMPORADA_MUNDIAL: Periodo = { inicio: "01-01", fim: "12-31" };
export const CHAVE_MUNDIAL = "mundial";

/** Chave da temporada de uma competição: o país, "conf:UEFA" nas continentais ou "mundial". */
export function chaveDaCompeticao(c: Competicao): string | null {
  if (c.escopo.tipo === "confederacao") return `conf:${c.escopo.confederacao}`;
  if (c.escopo.tipo === "mundial") return c.categoria === "clubes" ? CHAVE_MUNDIAL : null;
  return paisDaCompeticao(c);
}

/** Período da temporada de uma chave (país, confederação ou mundial). */
function periodoDaChave(m: MundoParaCompeticoes, chave: string): Periodo | undefined {
  if (chave === CHAVE_MUNDIAL) return TEMPORADA_MUNDIAL;
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
      if (!lista) cache.set(chave, (lista = planoContinental(m, c, i)));
      for (const d of lista) if (d >= inicio && d <= fim) datas.add(d);
    }
  return datas;
}

/**
 * Datas de uma continental na temporada que começa em `inicio`, fugindo das datas mundiais em que
 * os clubes da confederação podem jogar (a fase de liga da Champions não cai no dia da final da
 * Intercontinental).
 */
function bloqueiosMundiais(m: MundoParaCompeticoes, c: Competicao, inicio: string) {
  if (c.escopo.tipo !== "confederacao") return undefined;
  const fim = somarDias(inicio, 400);
  return datasMundiais(m, c.escopo.confederacao, inicio, fim);
}

function planoContinental(m: MundoParaCompeticoes, c: Competicao, inicio: string): string[] {
  return datasPlanejadas(
    c,
    inicio,
    m.datasFifa,
    quantidadeInicial(c),
    bloqueiosMundiais(m, c, inicio),
  );
}

/** Datas planejadas das continentais, por mundo (o calendário não muda durante o jogo). */
const cacheContinental = new WeakMap<MundoParaCompeticoes, Map<string, string[]>>();

/** Confederação da competição de origem de uma vaga (null se não for continental). */
function confederacaoDaOrigem(m: MundoParaCompeticoes, de: string): Confederacao | null {
  const o = m.competicao(de)?.escopo;
  return o?.tipo === "confederacao" ? o.confederacao : null;
}

/**
 * Datas das competições mundiais em que um clube da confederação pode jogar, entre `inicio` e
 * `fim`: de cada fase em diante a partir daquela em que entra o campeão da confederação (o da UEFA
 * só joga a final da Intercontinental; o da OFC, desde a primeira rodada). As ligas do país fogem
 * delas. O Mundial de Clubes, que tem os participantes conhecidos antes, trava só os países deles.
 */
export function datasMundiais(
  m: MundoParaCompeticoes,
  confederacao: Confederacao,
  inicio: string,
  fim: string,
): Set<string> {
  const datas = new Set<string>();
  const mundiais = m.competicoes.filter(
    (c) =>
      c.categoria === "clubes" &&
      c.escopo.tipo === "mundial" &&
      !c.participantes.vagas.length &&
      c.fases.some((f) => f.entramAqui.length),
  );
  if (!mundiais.length) return datas;
  let cache = cacheContinental.get(m);
  if (!cache) cacheContinental.set(m, (cache = new Map()));
  const anos = new Set([Number(inicio.slice(0, 4)), Number(fim.slice(0, 4))]);
  for (const ano of anos)
    for (const c of mundiais) {
      const primeira = c.fases.findIndex((f) =>
        f.entramAqui.some((v) => confederacaoDaOrigem(m, v.de) === confederacao),
      );
      if (primeira < 0) continue;
      const chave = `${c.id}:${ano}:${confederacao}`;
      let lista = cache.get(chave);
      if (!lista)
        cache.set(
          chave,
          (lista = datasPlanejadasPorFase(c, `${ano}-01-01`, m.datasFifa).slice(primeira).flat()),
        );
      for (const d of lista) if (d >= inicio && d <= fim) datas.add(d);
    }
  return datas;
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
  // Liga da temporada que acabou (as divisões de baixo abrem depois das copas, na virada): os
  // participantes já são os da próxima, com quem subiu e quem caiu.
  const daVez = daTemporada[id];
  const atual = daVez && !(daVez.encerrada && def?.tipo === "liga") ? daVez : undefined;
  // A supercopa abre antes das outras: uma copa ainda fechada tem os participantes pelas vagas.
  const membros =
    atual?.participantes ??
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

/** Clubes que entram numa competição: na primeira fase e, pelo índice "fase.vaga", nas adiante. */
interface Resolucao {
  inicial: string[];
  entrantes: Record<string, string[]>;
  /** Caminho de cada clube nas qualificatórias da UEFA. */
  caminhos: Record<string, string>;
}

const continentalOuMais = (c: Competicao | undefined) =>
  c?.tipo === "continental" || c?.tipo === "intercontinental";

/**
 * Origem de cada clube para os sorteios evitarem confrontos da mesma origem: o país nas
 * continentais e a confederação nas mundiais (grupos do Mundial de Clubes sem dois da mesma).
 */
function origemDosClubes(
  m: MundoParaCompeticoes,
  c: Competicao,
  clubes: readonly string[],
): Record<string, string> {
  const mundial = c.escopo.tipo === "mundial";
  return Object.fromEntries(
    clubes.map((x) => {
      const pais = m.clube?.(x)?.pais ?? "";
      return [x, mundial ? (m.pais(pais)?.confederacao ?? pais) : pais];
    }),
  );
}

/**
 * Campeão (ou vice) da edição de uma competição que termina no ano: a edição em andamento, o
 * histórico ou os campeões anteriores ao banco. null: a edição ainda não acabou; undefined: não há.
 */
function donoDaEdicao(
  m: MundoParaCompeticoes,
  estado: MundoCompeticoes,
  de: string,
  ano: number,
  vice = false,
  competicoes: Record<string, EstadoCompeticao> = estado.competicoes,
): string | null | undefined {
  const eo = competicoes[de];
  if (eo && anoFinal(eo.temporada) === ano) {
    if (!eo.encerrada) return null;
    return (vice ? eo.classificacao?.[1] : eo.campeao) ?? undefined;
  }
  const h = estado.historico.find((x) => x.competicao === de && anoFinal(x.temporada) === ano);
  if (h) return vice ? h.vice : h.campeao;
  const def = m.competicao(de);
  const antes = [
    ...(def?.campeaoAnterior ? [def.campeaoAnterior] : []),
    ...(def?.campeoesAnteriores ?? []),
  ].find((x) => anoFinal(x.temporada) === ano);
  return antes ? (vice ? antes.vice : antes.campeao) : undefined;
}

/**
 * Clubes da confederação de uma competição continental em ordem de ranking: pontos pela campanha
 * nas edições que terminaram entre `ano - edicoes` e `ano - 1` (32 pelo campeão, 31 pelo vice...),
 * e depois os clubes das primeiras divisões da confederação pela força do elenco.
 */
function rankingDaConfederacao(
  m: MundoParaCompeticoes,
  estado: MundoCompeticoes,
  de: string,
  ano: number,
  edicoes: number,
): string[] {
  const pontos = new Map<string, number>();
  for (const h of estado.historico) {
    if (h.competicao !== de) continue;
    const a = anoFinal(h.temporada);
    if (a < ano - edicoes || a > ano - 1) continue;
    (h.classificacao ?? [h.campeao, h.vice].filter((x): x is string => !!x)).forEach((t, i) =>
      pontos.set(t, (pontos.get(t) ?? 0) + Math.max(1, 32 - i)),
    );
  }
  const conf = confederacaoDaOrigem(m, de);
  const ligas = m.competicoes.filter(
    (c) =>
      c.tipo === "liga" &&
      (c.divisao ?? 1) === 1 &&
      conf !== null &&
      m.pais(paisDaCompeticao(c) ?? "")?.confederacao === conf,
  );
  const todos = new Set(pontos.keys());
  for (const l of ligas)
    for (const t of estado.competicoes[l.id]?.participantes ??
      estado.participantes[l.id] ??
      participantesIniciais(l))
      todos.add(t);
  return [...todos].sort(
    (a, b) =>
      (pontos.get(b) ?? 0) - (pontos.get(a) ?? 0) ||
      forca(m, b) - forca(m, a) ||
      a.localeCompare(b),
  );
}

/**
 * Participantes pelas vagas: os primeiros de cada liga, o campeão e o vice (da última edição; na
 * primeira temporada, o campeão anterior ao banco ou os mais fortes). As vagas das fases mais
 * adiantadas são resolvidas antes (o campeão da Libertadores entra nos grupos e empurra os do país
 * para baixo, como no real). Vaga repetida passa para o próximo da tabela.
 */
function resolverParticipantes(
  m: MundoParaCompeticoes,
  estado: MundoCompeticoes,
  c: Competicao,
  daTemporada: Record<string, EstadoCompeticao>,
  temporada?: string,
): Resolucao {
  const escolhidos: string[] = [];
  // Quem já está numa competição excluída (a Libertadores, para a Sul-Americana) não entra.
  const fora = new Set(
    c.participantes.exclui.flatMap((id) => daTemporada[id]?.participantes ?? []),
  );
  // Times B e sub-23 não jogam as copas nacionais.
  const semFiliais = c.tipo === "copa";
  const ocupado = (x: string) =>
    escolhidos.includes(x) || fora.has(x) || (semFiliais && !!m.clube?.(x)?.filialDe);
  // Reserva para vaga de campeão sem dono conhecido: o mais forte que sobra entre as origens.
  const origens = [
    ...c.participantes.vagas,
    ...c.fases.flatMap((f) => f.entramAqui.filter((v) => !vagaDaPropria(c, v) && !vagaDinamica(v))),
  ].filter((v) => v.criterio === "posicoes");
  const maisForteQueSobra = () =>
    origens
      .flatMap((v) => ranking(m, estado, v.de, daTemporada))
      .filter((x) => !ocupado(x))
      .sort((a, b) => forca(m, b) - forca(m, a))[0];
  const caminhos: Record<string, string> = {};
  // Quem entrou pela alternativa de uma vaga de campeão não é campeão (não vai para o pote 1).
  const porAlternativa = new Set<string>();
  const resolver = (v: Competicao["participantes"]["vagas"][number]): string[] => {
    const lista = resolverVaga(v);
    if (v.caminho) for (const t of lista) caminhos[t] = v.caminho;
    return lista;
  };
  const ano = temporada ? anoFinal(temporada) : undefined;
  const paisDe = (x: string) => m.clube?.(x)?.pais ?? "";
  const resolverVaga = (v: Competicao["participantes"]["vagas"][number]): string[] => {
    if (v.criterio === "eliminados") return [];
    // Mundial de Clubes: os campeões das últimas edições e os melhores do ranking.
    if (v.criterio === "campeoes" || v.criterio === "ranking") {
      const n = v.edicoes ?? 4;
      const alvo = ano ?? anoFinal(estado.historico.at(-1)?.temporada ?? "2026");
      const ordem = rankingDaConfederacao(m, estado, v.de, alvo, n);
      const lista: string[] = [];
      const pegar = (x: string) => {
        escolhidos.push(x);
        lista.push(x);
      };
      if (v.criterio === "campeoes") {
        for (let a = alvo - n; a < alvo; a++) {
          const dono = donoDaEdicao(m, estado, v.de, a);
          if (dono && !ocupado(dono)) pegar(dono);
        }
        // Campeão repetido (ou edição sem campeão conhecido): a vaga vai para o ranking.
        const falta = (v.quantidade ?? n) - lista.length;
        for (const x of ordem.filter((t) => !ocupado(t)).slice(0, Math.max(0, falta))) pegar(x);
        return lista;
      }
      const limite = v.maximoPorPais ?? Infinity;
      for (const x of ordem) {
        if (lista.length >= (v.quantidade ?? 1)) break;
        if (ocupado(x)) continue;
        if (escolhidos.filter((t) => paisDe(t) === paisDe(x)).length >= limite) continue;
        pegar(x);
      }
      return lista;
    }
    if (v.criterio === "posicoes") {
      const ordem = ranking(m, estado, v.de, daTemporada);
      const proximo = (desde: number) => ordem.slice(desde).find((x) => !ocupado(x));
      const lista: string[] = [];
      for (const p of v.posicoes ?? []) {
        const x = ordem[p - 1];
        const escolhido = x && !ocupado(x) ? x : v.repassa ? proximo(p - 1) : undefined;
        if (escolhido) {
          escolhidos.push(escolhido);
          lista.push(escolhido);
        }
      }
      return lista;
    }
    const origem = m.competicao(v.de);
    const registro = [...estado.historico].reverse().find((h) => h.competicao === v.de);
    const anterior = origem?.campeaoAnterior;
    const dono =
      v.criterio === "campeao"
        ? (registro?.campeao ?? anterior?.campeao)
        : registro
          ? registro.vice
          : anterior?.vice;
    let escolhido = dono && !ocupado(dono) ? dono : undefined;
    // UEFA: campeão que já tem vaga cede a dele ao mais forte das alternativas.
    if (!escolhido && v.alternativas.length)
      escolhido = v.alternativas
        .flatMap((a) => {
          const ordem = ranking(m, estado, a.de, daTemporada);
          return a.posicoes.map((p) => ordem[p - 1]).filter((x): x is string => !!x);
        })
        .filter((x) => !ocupado(x))
        .sort((a, b) => forca(m, b) - forca(m, a))[0];
    if (escolhido && escolhido !== dono) porAlternativa.add(escolhido);
    if (!escolhido && !v.alternativas.length)
      escolhido =
        continentalOuMais(origem) || v.de === c.id
          ? maisForteQueSobra()
          : ranking(m, estado, v.de, daTemporada)
              .slice(v.criterio === "campeao" ? 0 : 1)
              .find((x) => !ocupado(x));
    if (!escolhido) return [];
    escolhidos.push(escolhido);
    return [escolhido];
  };
  const entrantes: Record<string, string[]> = {};
  for (let p = c.fases.length - 1; p >= 1; p--) {
    const fase = c.fases[p] as Competicao["fases"][number];
    const fixas = fase.entramAqui
      .map((v, vi) => ({ v, vi }))
      .filter(({ v }) => !vagaDaPropria(c, v) && !vagaDinamica(v));
    if (!fixas.length) continue;
    // O atual campeão primeiro (pote 1), depois os outros por força.
    const campeoes: string[] = [];
    const outros: string[] = [];
    for (const { v } of fixas) {
      const lista = resolver(v);
      // Só o atual campeão da própria competição abre o pote 1 (o da Libertadores, o da Champions).
      const campeao = v.criterio !== "posicoes" && v.de === c.id;
      for (const t of lista) (campeao && !porAlternativa.has(t) ? campeoes : outros).push(t);
    }
    outros.sort((a, b) => forca(m, b) - forca(m, a));
    entrantes[`${p}.${fixas[0]!.vi}`] = [...campeoes, ...outros];
  }
  const inicial = c.participantes.vagas.flatMap(resolver);
  return { inicial, entrantes, caminhos };
}

/** Divisão de cada clube nas ligas do país da copa nesta temporada (para o mando do de baixo). */
function divisoesDoPais(
  m: MundoParaCompeticoes,
  estado: MundoCompeticoes,
  daTemporada: Record<string, EstadoCompeticao>,
  c: Competicao,
): Record<string, number> | undefined {
  const pais = paisDaCompeticao(c);
  if (!pais || c.escopo.tipo !== "pais") return undefined;
  const r: Record<string, number> = {};
  for (const l of m.competicoes) {
    if (l.tipo !== "liga" || paisDaCompeticao(l) !== pais || l.escopo.tipo !== "pais") continue;
    const membros =
      daTemporada[l.id]?.participantes ?? estado.participantes[l.id] ?? participantesIniciais(l);
    for (const t of membros) r[t] = Math.min(r[t] ?? 99, l.divisao ?? 1);
  }
  return Object.keys(r).length ? r : undefined;
}

/** Todos os participantes previstos pelas vagas (para a ordem de força de uma copa ainda fechada). */
function participantesPorVagas(
  m: MundoParaCompeticoes,
  estado: MundoCompeticoes,
  c: Competicao,
  daTemporada: Record<string, EstadoCompeticao>,
): string[] {
  const r = resolverParticipantes(m, estado, c, daTemporada);
  return [...r.inicial, ...Object.values(r.entrantes).flat()];
}

/**
 * Entrega a cada competição os clubes que vêm de outra durante a temporada (os eliminados da 3ª
 * fase da Libertadores para os grupos da Sul-Americana, os 3º colocados dos grupos para o playoff),
 * assim que a fase de origem termina.
 */
function distribuirEntrantes(
  m: MundoParaCompeticoes,
  estado: MundoCompeticoes,
  competicoes: Record<string, EstadoCompeticao>,
  semente: string,
): Record<string, EstadoCompeticao> | null {
  let mudou: Record<string, EstadoCompeticao> | null = null;
  for (const c of m.competicoes) {
    if (!c.fases.some((f) => f.entramAqui.some((v) => !vagaDaPropria(c, v) && vagaDinamica(v))))
      continue;
    let e = (mudou ?? competicoes)[c.id];
    if (!e || e.encerrada) continue;
    for (let p = 0; p < c.fases.length; p++) {
      const fase = c.fases[p] as Competicao["fases"][number];
      const dinamicas = fase.entramAqui
        .map((v, vi) => ({ v, vi }))
        .filter(({ v }) => !vagaDaPropria(c, v) && vagaDinamica(v));
      if (!dinamicas.length || e.recebidos?.[p]) continue;
      const porVaga: Record<number, string[]> = {};
      let pronto = true;
      for (const { v, vi } of dinamicas) {
        const origem = m.competicao(v.de);
        const atuais = mudou ?? competicoes;
        const eo = atuais[v.de];
        let lista =
          origem && eo && eo.temporada === e.temporada ? resolverVagaDinamica(origem, eo, v) : null;
        // Campeão de uma competição de outra temporada (o da Champions na Intercontinental): a
        // edição que termina no ano desta, em andamento ou já no histórico.
        if (!lista && origem && (v.criterio === "campeao" || v.criterio === "vice")) {
          const ano = anoFinal(e.temporada);
          const dono = donoDaEdicao(m, estado, v.de, ano, v.criterio === "vice", atuais);
          if (dono) lista = [dono];
          // Edição que não existe (nem no banco): o mais forte da confederação.
          else if (dono === undefined && !(eo && eo.temporada === e.temporada))
            lista = rankingDaConfederacao(m, estado, v.de, ano, 4).slice(0, 1);
        }
        if (!lista) {
          pronto = false;
          break;
        }
        porVaga[vi] = lista;
      }
      if (!pronto) continue;
      // País dos que chegam, para o sorteio da fase evitar compatriotas.
      const novos = Object.values(porVaga).flat();
      const paises = m.clube && continentalOuMais(c) ? origemDosClubes(m, c, novos) : undefined;
      e = receberEntrantes(c, e, p, porVaga, semente, paises);
      mudou ??= { ...competicoes };
      mudou[c.id] = e;
    }
  }
  return mudou;
}

/** Abre a temporada de um país (a que contém a data, ou a próxima) com todas as competições dele. */
function abrirTemporada(
  m: MundoParaCompeticoes,
  estado: MundoCompeticoes,
  codigo: string,
  data: string,
  semente: string,
  /** Só estas competições (as outras da chave continuam como estão e só ocupam datas). */
  apenas?: ReadonlySet<string>,
): MundoCompeticoes {
  const periodo = periodoDaChave(m, codigo);
  if (!periodo) return estado;
  const t = temporadaDe({ temporada: periodo }, data);
  const temporada: TemporadaDoPais = { nome: nomeTemporada({ temporada: periodo }, data), ...t };
  const competicoes = { ...estado.competicoes };
  const mundial = codigo === CHAVE_MUNDIAL;
  // Continentais e mundiais marcam as datas pelo plano (as ligas é que fogem delas).
  const continental = codigo.startsWith("conf:") || mundial;
  const confederacao = continental ? undefined : m.pais(codigo)?.confederacao;
  // Primeiro as de janela curta (supercopas, estaduais e regionais), depois as ligas (da 1ª divisão para baixo)
  // e as copas: cada uma foge das datas das anteriores, para o mesmo clube não ter dois jogos no
  // mesmo dia nem em dias seguidos.
  // Nas continentais, a que exclui outra abre depois dela (a Sul-Americana depois da Libertadores).
  // Competições que não são anuais (o Mundial de Clubes, a cada 4 anos) só abrem no ano delas.
  const ano = anoFinal(temporada.nome);
  const ordem = competicoesDoMundo(m)
    .filter((c) => chaveDaCompeticao(c) === codigo)
    .filter((c) => (ano - c.periodicidade.anoBase) % c.periodicidade.aCadaAnos === 0)
    .filter((c) => !apenas || apenas.has(c.id))
    .sort(
      (a, b) =>
        prioridade(a) - prioridade(b) ||
        a.participantes.exclui.length - b.participantes.exclui.length ||
        (a.divisao ?? 9) - (b.divisao ?? 9),
    );
  // As datas das continentais da confederação ficam reservadas desde o começo.
  const reservadas = confederacao
    ? new Set([
        ...datasContinentais(m, confederacao, t.inicio, t.fim),
        ...datasMundiais(m, confederacao, t.inicio, t.fim),
      ])
    : new Set<string>();
  // Cada competição foge das datas das que já marcaram e dividem clubes com ela (o Paulistão não
  // atrapalha o Carioca; a Copa do Nordeste só pesa para quem a joga). O Mundial de Clubes já
  // aberto trava as datas dele nas competições dos países que têm clubes lá.
  const marcadas: { clubes: Set<string>; datas: readonly string[] }[] = [];
  if (!continental)
    for (const e of Object.values(estado.competicoes)) {
      const def = m.competicao(e.id);
      // Reabrindo só algumas: as outras do país já marcaram as datas delas.
      if (apenas && def && !apenas.has(e.id) && chaveDaCompeticao(def) === codigo) {
        marcadas.push({ clubes: new Set(e.participantes), datas: e.datas });
        continue;
      }
      if (def?.escopo.tipo !== "mundial" || e.encerrada || !e.participantes.length) continue;
      if (e.fim < t.inicio || e.inicio > t.fim) continue;
      marcadas.push({ clubes: new Set(e.participantes), datas: e.datas });
    }
  for (const c of ordem) {
    const porVagas = !c.participantes.fixos.length && c.participantes.vagas.length > 0;
    const resolucao = porVagas
      ? resolverParticipantes(m, estado, c, competicoes, temporada.nome)
      : undefined;
    const participantes =
      resolucao?.inicial ?? estado.participantes[c.id] ?? participantesIniciais(c);
    // Sem ninguém no começo só se todos vierem de outras competições (Copa Intercontinental).
    const chegamDepois = !participantes.length && c.fases[0]?.entramAqui.length;
    if (participantes.length < 2 && !chegamDepois) continue;
    const entrantes =
      resolucao && Object.keys(resolucao.entrantes).length ? resolucao.entrantes : undefined;
    const todos = [...participantes, ...Object.values(entrantes ?? {}).flat()];
    const paises = m.clube && continentalOuMais(c) ? origemDosClubes(m, c, todos) : undefined;
    const divisoes = c.tipo === "copa" ? divisoesDoPais(m, estado, competicoes, c) : undefined;
    let bloqueadas: Set<string> | undefined;
    if (!continental) {
      // Todas reservam as datas continentais: até um campeão de copa da 2ª divisão pode jogá-las.
      bloqueadas = new Set(reservadas);
      for (const x of marcadas)
        if (todos.some((p) => x.clubes.has(p))) for (const d of x.datas) bloqueadas.add(d);
    }
    const e = montarCompeticao(c, participantes, t.inicio, {
      datasFifa: m.datasFifa,
      semente,
      temporada: temporada.nome,
      ...(entrantes ? { entrantes } : {}),
      ...(paises ? { paises } : {}),
      ...(divisoes ? { divisoes } : {}),
      ...(resolucao && Object.keys(resolucao.caminhos).length
        ? { caminhos: resolucao.caminhos }
        : {}),
      ...(bloqueadas
        ? { bloqueadas }
        : {
            quantidadePlanejada: quantidadeInicial(c),
            // As continentais fogem das datas mundiais (o mesmo plano que as ligas reservaram).
            ...(codigo.startsWith("conf:")
              ? { bloqueadas: bloqueiosMundiais(m, c, t.inicio) ?? new Set<string>() }
              : {}),
          }),
    });
    competicoes[c.id] = e;
    if (!continental) marcadas.push({ clubes: new Set(todos), datas: e.datas });
  }
  return { ...estado, competicoes, temporadas: { ...estado.temporadas, [codigo]: temporada } };
}

/**
 * Monta de novo a edição atual de algumas competições (o formato delas mudou desde o salvamento),
 * com os jogos que já passaram disputados; as outras ficam como estão.
 */
export function reabrirCompeticoes(
  m: MundoParaCompeticoes,
  estado0: MundoCompeticoes,
  ids: readonly string[],
  data: string,
  semente: string,
): MundoCompeticoes {
  const alvo = new Set(ids.filter((id) => estado0.competicoes[id]));
  if (!alvo.size) return estado0;
  const competicoes = Object.fromEntries(
    Object.entries(estado0.competicoes).filter(([id]) => !alvo.has(id)),
  );
  let estado: MundoCompeticoes = { ...estado0, competicoes };
  const chaves = new Set(
    [...alvo].map((id) => m.competicao(id)).flatMap((c) => (c ? [chaveDaCompeticao(c)] : [])),
  );
  for (const ch of chaves) {
    const t = ch ? estado.temporadas[ch] : undefined;
    if (ch && t) estado = abrirTemporada(m, estado, ch, t.inicio, semente, alvo);
  }
  const inicios = [...alvo]
    .map((id) => estado.competicoes[id]?.inicio)
    .filter((x): x is string => !!x)
    .sort();
  for (let d = inicios[0] ?? data; d < data; d = somarDias(d, 1))
    estado = jogarDia(m, estado, d, semente, (id) => !alvo.has(id));
  return estado;
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
  // Só os jogos já passados das competições novas (as outras já estão em dia), dia a dia desde o
  // começo delas: quem chega de outra competição (Intercontinental) entra antes do jogo.
  const inicios = Object.values(estado.competicoes)
    .filter((e) => novas.has(e.id))
    .map((e) => e.inicio)
    .sort();
  for (let d = inicios[0] ?? data; d < data; d = somarDias(d, 1))
    estado = jogarDia(m, estado, d, semente, (id) => !novas.has(id));
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
  // Quem caiu numa competição e segue em outra (eliminados da Libertadores na Sul-Americana), e
  // os campeões que chegam à Intercontinental (mesmo num dia sem jogos).
  const base = competicoes ?? estado.competicoes;
  const distribuidas = distribuirEntrantes(m, estado, base, semente);
  if (!competicoes && !distribuidas) return estado;
  return { ...estado, competicoes: distribuidas ?? base };
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
  // A mundial vira antes: o Mundial de Clubes abre antes das ligas e trava as datas dos clubes dele.
  const chaves = Object.entries(estado0.temporadas).sort(
    ([a], [b]) => Number(b === CHAVE_MUNDIAL) - Number(a === CHAVE_MUNDIAL),
  );
  for (const [codigo, t] of chaves) {
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
        ...(c.tipo === "continental" && e.classificacao
          ? { classificacao: e.classificacao.slice(0, 32) }
          : {}),
        ...(artilheiro ? { artilheiro: { jogador: artilheiro[0], gols: artilheiro[1][0] } } : {}),
      });
      movimentos.push(...movimentosDaTemporada(c, e));
      if (e.classificacao) classificacoes[e.id] = e.classificacao;
      // Copas montam os participantes de novo a cada temporada, pelas vagas.
      if (c.participantes.fixos.length)
        participantes[e.id] = participantes[e.id] ?? [...e.participantes];
    }
    resolverBarragens(m, doPais, movimentos, semente);
    for (const mv of movimentos) {
      if (!m.competicao(mv.para)) continue;
      participantes[mv.de] = (participantes[mv.de] ?? []).filter((x) => x !== mv.clube);
      const destino = participantes[mv.para] ?? [
        ...(estado.competicoes[mv.para]?.participantes ?? []),
      ];
      participantes[mv.para] = destino.includes(mv.clube) ? destino : [...destino, mv.clube];
    }
    estado = { ...estado, historico, participantes, classificacoes };
    renovarLigasAbertas(m, estado, doPais, participantes);
    estado = abrirTemporada(m, estado, codigo, somarDias(data, 0), semente);
    encerradas.push({ pais: codigo, temporada: t.nome, movimentos });
  }
  return { estado, encerradas };
}

/**
 * Ligas abertas (Série D), na virada (muda `participantes`): ficam os que chegaram à fase marcada e
 * os que vieram por acesso ou rebaixamento; as vagas dos estaduais completam o resto, cada uma com o
 * melhor colocado que não está em outra liga do país; faltando, entram os mais fortes que sobraram.
 * A lista sai na ordem dos estados da lista inicial, para os grupos regionais.
 */
function renovarLigasAbertas(
  m: MundoParaCompeticoes,
  estado: MundoCompeticoes,
  doPais: readonly EstadoCompeticao[],
  participantes: Record<string, string[]>,
): void {
  for (const e of doPais) {
    const c = m.competicao(e.id);
    const r = c?.participantes.renovacao;
    if (!c || !r) continue;
    const pais = paisDaCompeticao(c);
    const fi = c.fases.findIndex((f) => f.id === r.ficam);
    const chegaram = new Set(e.fases[fi]?.times ?? []);
    const atuais = participantes[c.id] ?? [...e.participantes];
    const lista = atuais.filter((x) => !e.participantes.includes(x) || chegaram.has(x));
    const ocupados = new Set(lista);
    for (const l of m.competicoes)
      if (l.id !== c.id && l.tipo === "liga" && paisDaCompeticao(l) === pais)
        for (const x of participantes[l.id] ??
          estado.competicoes[l.id]?.participantes ??
          participantesIniciais(l))
          ocupados.add(x);
    const sobras: string[] = [];
    for (const v of r.vagas) {
      const ordem = ranking(m, estado, v.de, estado.competicoes);
      const desde = Math.max(0, Math.min(...(v.posicoes ?? [1])) - 1);
      let faltam = v.posicoes?.length ?? 1;
      for (const x of ordem.slice(desde)) {
        if (ocupados.has(x)) continue;
        if (faltam > 0 && lista.length < c.participantes.quantidade) {
          lista.push(x);
          ocupados.add(x);
          faltam--;
        } else sobras.push(x);
      }
    }
    const resto = sobras
      .filter((x) => !ocupados.has(x))
      .sort((a, b) => forca(m, b) - forca(m, a) || a.localeCompare(b));
    while (lista.length < c.participantes.quantidade && resto.length) {
      const x = resto.shift() as string;
      if (!ocupados.has(x)) {
        lista.push(x);
        ocupados.add(x);
      }
    }
    // Estado de cada clube pelos estaduais; os estados na ordem da lista inicial.
    const uf = new Map<string, string>();
    for (const x of m.competicoes)
      if (x.tipo === "estadual" && x.escopo.tipo === "estado" && x.escopo.pais === pais)
        for (const t of participantesIniciais(x)) if (!uf.has(t)) uf.set(t, x.escopo.estado);
    const ordemUf: string[] = [];
    for (const t of participantesIniciais(c)) {
      const u = uf.get(t);
      if (u && !ordemUf.includes(u)) ordemUf.push(u);
    }
    const posUf = (t: string) => {
      const i = ordemUf.indexOf(uf.get(t) ?? "");
      return i < 0 ? ordemUf.length : i;
    };
    participantes[c.id] = lista
      .slice(0, c.participantes.quantidade)
      .map((t, i) => ({ t, i }))
      .sort((a, b) => posUf(a.t) - posUf(b.t) || a.i - b.i)
      .map((x) => x.t);
  }
}

/**
 * Barragens entre divisões, na virada da temporada (muda `movimentos`): o 16º da Ligue 1 contra o
 * vencedor do playoff da Ligue 2, o 10º e o 11º da K League 1 contra os da K League 2, o playout da
 * Serie B (16º x 17º, quem perde cai). Jogo de ida e volta resumido num confronto em campo neutro,
 * pela força dos elencos.
 */
function resolverBarragens(
  m: MundoParaCompeticoes,
  doPais: readonly EstadoCompeticao[],
  movimentos: Movimento[],
  semente: string,
): void {
  for (const e of doPais) {
    const c = m.competicao(e.id);
    if (!c || !e.classificacao) continue;
    const ano = anoFinal(e.temporada);
    for (const mv of c.movimentos) {
      if (mv.tipo !== "playoff-rebaixamento") continue;
      if ((mv.desde && ano < mv.desde) || (mv.ate && ano > mv.ate)) continue;
      const rng = new Rng(`${semente}:barragem:${c.id}:${e.temporada}`);
      // Quem perde a barragem fica com `vence` = false (o de cima cai, ou o de baixo não sobe).
      const confronto = (a: string, b: string) => {
        const r = simularRapido(rng, forca(m, a), forca(m, b), {
          neutro: true,
          desempate: "penaltis",
        });
        const [x, y] = r.placar;
        const [px, py] = r.penaltis ?? [0, 0];
        return x > y || (x === y && px > py) ? a : b;
      };
      const posicoes = mv.posicoes
        .map((p) => e.classificacao?.[p - 1])
        .filter((x): x is string => !!x);
      if (mv.barragem === "entre-si") {
        // Playout: o pior contra o melhor das posições, quem perde cai.
        for (let i = 0; i + 1 < posicoes.length; i += 2) {
          const [a, b] = [posicoes[i] as string, posicoes[i + 1] as string];
          const perdeu = confronto(a, b) === a ? b : a;
          movimentos.push({ clube: perdeu, de: c.id, para: mv.para, tipo: "rebaixamento" });
        }
        continue;
      }
      // Contra quem subiu pelo playoff da divisão de baixo (o pior de cima contra o primeiro).
      const candidatos = movimentos.filter(
        (x) => x.tipo === "acesso" && x.viaPlayoff && x.de === mv.para && x.para === c.id,
      );
      [...posicoes].reverse().forEach((deCima, i) => {
        const deBaixo = candidatos[i];
        if (!deBaixo) return;
        if (confronto(deCima, deBaixo.clube) === deCima) {
          movimentos.splice(movimentos.indexOf(deBaixo), 1);
        } else movimentos.push({ clube: deCima, de: c.id, para: mv.para, tipo: "rebaixamento" });
      });
    }
  }
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
