/**
 * Uma competição numa temporada: monta os grupos e o mata-mata a partir da descrição em dados,
 * marca as datas, lança os resultados, avança de fase e diz quem foi campeão, quem sobe e quem cai.
 */
import type { Competicao, DataFifa, Fase } from "@newbras/data";
import { Rng } from "../rng";
import { somarDias } from "../carreira/datas";
import {
  datasDaCompeticao,
  datasDasRodadas,
  proximaData,
  rodadasDoGrupo,
  todosContraTodos,
} from "./rodadas";
import { potesSemCompatriotas, sortearFaseDeLiga } from "./faseDeLiga";
import { ordenarTabela, type Criterio, type LinhaTabela } from "./tabela";
import { t } from "@newbras/textos";

export interface JogoCompeticao {
  fase: number;
  /** Rodada no calendário da competição (a data é `datas[rodada]`). */
  rodada: number;
  grupo?: number;
  /** Mata-mata: rodada eliminatória dentro da fase, confronto e perna (1 = ida, 2 = volta). */
  chave?: number;
  confronto?: number;
  perna?: 1 | 2;
  casa: string;
  fora: string;
  neutro?: boolean;
  placar?: [number, number];
  penaltis?: [number, number];
}

export interface Confronto {
  /** O de melhor campanha (decide o mando). */
  a: string;
  /** Vazio quando `a` passa direto (folga). */
  b: string;
  vencedor?: string;
}

export interface EstadoFase {
  /** Times da fase, do melhor para o pior na entrada (a semente do chaveamento). */
  times: string[];
  grupos?: string[][];
  chaves?: Confronto[][];
  rodadaInicial: number;
  encerrada: boolean;
}

export interface EstadoCompeticao {
  id: string;
  temporada: string;
  inicio: string;
  fim: string;
  participantes: string[];
  datas: string[];
  rodadasDaFase: number[];
  fases: (EstadoFase | null)[];
  jogos: JogoCompeticao[];
  encerrada: boolean;
  campeao?: string;
  /** Quem venceu o playoff de acesso (Série B, Championship). */
  vencedorPlayoff?: string;
  /** Todos os vencedores do playoff, quando ele dá mais de uma vaga (Série B: os dois). */
  vencedoresPlayoff?: string[];
  classificacao?: string[];
  /** Gols e assistências de cada jogador na competição. */
  artilharia: Record<string, [number, number]>;
  /**
   * Quem entra numa fase adiante, pelo índice da fase: os que já têm vaga desde o começo (os 28 dos
   * grupos da Libertadores) e os que vêm de outra competição durante a temporada.
   */
  entrantes?: Record<string, string[]>;
  /** Fases cujos entrantes de outra competição já chegaram. */
  recebidos?: Record<string, boolean>;
  /** A próxima fase espera os entrantes de outra competição para abrir. */
  aguardando?: number;
  /** País de cada clube (para os sorteios evitarem clubes do mesmo país). */
  paises?: Record<string, string>;
  /** Caminho de cada clube nas qualificatórias da UEFA ("campeoes" ou "liga"). */
  caminhos?: Record<string, string>;
  /** Divisão de cada clube nas copas nacionais (para o mando do clube de divisão mais baixa). */
  divisoes?: Record<string, number>;
  /** Eliminatórias: quem se classificou, pelas regras de `classificados` (quando termina). */
  classificados?: string[];
}

/** Vaga pela tabela da própria competição (os primeiros da fase de grupos direto às oitavas). */
export function vagaDaPropria(
  c: Pick<Competicao, "id">,
  v: { de: string; criterio: string },
): boolean {
  return v.de === c.id && v.criterio === "posicoes";
}

/** Vaga que só se resolve durante a temporada (eliminados ou colocação numa fase de outra). */
export function vagaDinamica(v: { criterio: string; fase?: string | undefined }): boolean {
  return v.criterio === "eliminados" || v.criterio === "classificados" || v.fase !== undefined;
}

/** Quantos clubes uma vaga traz (para o calendário). */
function tamanhoDaVaga(v: {
  posicoes?: number[] | undefined;
  quantidade?: number | undefined;
}): number {
  return v.quantidade ?? v.posicoes?.length ?? 1;
}

/** Quantos entram na primeira fase pelos dados (fixos ou vagas da competição). */
export function quantidadeInicial(c: Competicao): number {
  // Os que chegam de outras competições na primeira fase (Intercontinental, Copa do Mundo).
  const primeira = (c.fases[0]?.entramAqui ?? []).reduce((s, v) => s + tamanhoDaVaga(v), 0);
  if (c.participantes.vagas.length)
    return c.participantes.vagas.reduce((s, v) => s + tamanhoDaVaga(v), 0) + primeira;
  if (!c.participantes.fixos.length && primeira) return primeira;
  return (c.participantes.fixos.length || c.participantes.quantidade) + primeira;
}

const criteriosDe = (c: Competicao): Criterio[] =>
  c.desempate[0] === "pontos" ? c.desempate : ["pontos", ...c.desempate];

/** Quantos times entram em cada fase e quantos se classificam (pelo que os dados descrevem). */
function planoDasFases(c: Competicao, n: number) {
  const entram: number[] = [];
  const saem: number[] = [];
  const eliminatorias: number[] = [];
  const rodadas: number[] = [];
  c.fases.forEach((f, i) => {
    const vindos = i === 0 ? n : (saem[i - 1] ?? 0);
    // Os classificados direto da fase de liga entram depois do playoff (Champions League).
    const liga = c.fases[i - 2];
    const diretos = liga?.tipo === "fase-de-liga" && liga.playoff ? liga.classificamDireto : 0;
    const soma =
      vindos + diretos + (i === 0 ? 0 : f.entramAqui.reduce((s, v) => s + tamanhoDaVaga(v), 0));
    const e = f.limiteDeEntradas ? Math.min(soma, f.limiteDeEntradas) : soma;
    entram.push(e);
    const ultima = i === c.fases.length - 1;
    if (f.tipo === "mata-mata") {
      const k = eliminatoriasDaFase(f, e, ultima);
      eliminatorias.push(k);
      let r = 0;
      for (let x = 0; x < k; x++) r += pernas(f, x, k);
      rodadas.push(r);
      // Com lugares do real, a rodada classifica metade deles (os que faltam viram folga).
      const lugares = f.lugares && f.lugares >= e ? f.lugares : 0;
      saem.push(ultima ? 1 : lugares ? lugares / 2 : Math.ceil(e / 2));
    } else {
      const grupos = f.tipo === "grupos" ? f.grupos : 1;
      const turnos = f.tipo === "grupos" ? f.turnos : 1;
      const tamanho = Math.ceil(e / grupos);
      eliminatorias.push(0);
      rodadas.push(f.tipo === "fase-de-liga" ? f.jogosPorTime : rodadasDoGrupo(tamanho, turnos));
      const q =
        f.tipo === "grupos"
          ? f.faixaClassificada
            ? (f.faixaClassificada.ate - f.faixaClassificada.de + 1) * f.grupos
            : f.classificamPorGrupo * f.grupos + (f.melhores?.quantidade ?? 0)
          : f.playoff
            ? f.playoff.ate - f.playoff.de + 1
            : f.classificamDireto * f.grupos;
      saem.push(q);
    }
  });
  return { entram, eliminatorias, rodadas };
}

/** Quantas eliminatórias a fase tem: até sobrar um na última (ou o limite dela), uma nas outras. */
function eliminatoriasDaFase(f: Fase, times: number, ultima: boolean): number {
  if (!ultima) return 1;
  const ate = Math.max(1, Math.ceil(Math.log2(Math.max(2, times))));
  return f.tipo === "mata-mata" && f.eliminatorias ? Math.min(ate, f.eliminatorias) : ate;
}

/** Ano em que uma temporada termina ("2026/27" → 2027; "2027" → 2027). */
export function anoFinal(temporada: string): number {
  const inicio = Number(temporada.slice(0, 4));
  if (!temporada.includes("/")) return inicio;
  // "2026/27" → 2027; edições de mais de um ano: "2027/29" → 2029.
  const fim = Number(temporada.slice(0, 2) + temporada.slice(5, 7));
  return fim > inicio ? fim : inicio + 1;
}

function pernas(f: Fase, rodadaEliminatoria: number, total: number): number {
  if (f.tipo !== "mata-mata") return 1;
  if (rodadaEliminatoria === total - 1 && f.finalJogoUnico) return 1;
  return f.jogos;
}

/** Fase de playoff: vem de uma faixa da tabela que não começa no primeiro (ou de outro playoff). */
export function fasesDePlayoff(c: Competicao): boolean[] {
  const r: boolean[] = [];
  c.fases.forEach((f, i) => {
    const anterior = c.fases[i - 1];
    r.push(
      i > 0 &&
        ((anterior?.tipo === "grupos" && (anterior.faixaClassificada?.de ?? 1) > 1) ||
          r[i - 1] === true),
    );
  });
  return r;
}

/** Ordem do chaveamento para 2^k sementes: 1 x 8, 4 x 5, 2 x 7, 3 x 6... */
function ordemDaChave(tamanho: number): number[] {
  let ordem = [1, 2];
  while (ordem.length < tamanho) {
    const n = ordem.length * 2 + 1;
    ordem = ordem.flatMap((s) => [s, n - s]);
  }
  return ordem;
}

export interface OpcoesMontagem {
  datasFifa: readonly DataFifa[];
  semente: string;
  temporada: string;
  /** Datas já ocupadas por competições mais importantes do país (para não coincidir). */
  bloqueadas?: ReadonlySet<string>;
  /**
   * Planeja as datas para esta quantidade de participantes (e não pela lista real). As
   * continentais usam a quantidade prevista: assim as datas delas são conhecidas antes de abrirem
   * e as ligas de cada país conseguem fugir delas.
   */
  quantidadePlanejada?: number;
  /** Quem entra direto numa fase adiante, pelo índice da fase (já em ordem de força). */
  entrantes?: Record<string, string[]>;
  /** País de cada clube, para os sorteios. */
  paises?: Record<string, string>;
  /** Caminho de cada clube (qualificatórias da UEFA). */
  caminhos?: Record<string, string>;
  /** Divisão de cada clube (copas nacionais). */
  divisoes?: Record<string, number>;
}

/**
 * Dias da semana de jogo: ligas e supercopas aos domingos; estaduais, regionais, copas e a
 * principal continental às quartas; a segunda continental (Sul-Americana, Europa League) às quintas.
 */
export function semanaDaCompeticao(c: Competicao): number[] {
  if (c.diasDeJogo) return c.diasDeJogo;
  // Seleções jogam em qualquer dia da data FIFA.
  if (c.categoria === "selecoes") return [0, 1, 2, 3, 4, 5, 6];
  if (c.tipo === "continental" || c.tipo === "intercontinental")
    return c.participantes.exclui.length ? [4] : [3];
  if (c.tipo === "estadual" || c.tipo === "regional" || c.tipo === "copa") return [3];
  return [0];
}

/** Datas das rodadas da competição na temporada, sem olhar as outras competições. */
export function datasPlanejadas(
  c: Competicao,
  inicioTemporada: string,
  datasFifa: readonly DataFifa[],
  quantidade = quantidadeInicial(c),
  bloqueadas?: ReadonlySet<string>,
): string[] {
  return datasPlanejadasPorFase(c, inicioTemporada, datasFifa, quantidade, bloqueadas).flat();
}

/** As mesmas datas, separadas por fase. */
export function datasPlanejadasPorFase(
  c: Competicao,
  inicioTemporada: string,
  datasFifa: readonly DataFifa[],
  quantidade = quantidadeInicial(c),
  bloqueadas?: ReadonlySet<string>,
): string[][] {
  const { inicio, fim } = datasDaCompeticao(c.calendario, inicioTemporada);
  const plano = planoDasFases(c, quantidade);
  const semana = semanaDaCompeticao(c);
  // Fases com janela própria (as continentais seguem o calendário real de cada fase).
  if (c.fases.some((f) => f.periodo)) {
    const porFase: string[][] = [];
    let ultima: string | undefined;
    c.fases.forEach((f, i) => {
      const n = plano.rodadas[i] ?? 0;
      const janela = f.periodo ? datasDaCompeticao(f.periodo, inicio) : { inicio, fim };
      const desde = ultima && ultima >= janela.inicio ? somarDias(ultima, 2) : janela.inicio;
      // Calendário fixo (seleções nas datas FIFA): os dias marcados, em sequência.
      const fixas: string[] = [];
      if (f.datas && f.datas.length >= n && n > 0) {
        // Os dias seguem a rodada anterior (ou o começo da competição), sem olhar a janela da fase.
        let cursor = ultima ? somarDias(ultima, 1) : inicio;
        for (const md0 of f.datas.slice(0, n)) {
          // "*MM-DD": no ano seguinte ao da rodada anterior.
          const pula = md0.startsWith("*");
          const md = pula ? md0.slice(1) : md0;
          if (pula) cursor = `${Number(cursor.slice(0, 4)) + 1}-01-01`;
          cursor = proximaData(md, cursor);
          fixas.push(cursor);
          cursor = somarDias(cursor, 1);
        }
      }
      const datas = fixas.length
        ? fixas
        : datasDasRodadas(n, desde, janela.fim, datasFifa, semana, bloqueadas);
      porFase.push(datas);
      ultima = datas.at(-1) ?? ultima;
    });
    return porFase;
  }
  // Sem janela por fase: as rodadas em sequência, repartidas pelas fases.
  const total = plano.rodadas.reduce((s, r) => s + r, 0);
  const todas = datasDasRodadas(total, inicio, fim, datasFifa, semana, bloqueadas);
  let k = 0;
  return plano.rodadas.map((r) => todas.slice(k, (k += r)));
}

/** Monta a competição da temporada: datas de todas as rodadas e a primeira fase. */
export function montarCompeticao(
  c: Competicao,
  participantes: readonly string[],
  inicioTemporada: string,
  o: OpcoesMontagem,
): EstadoCompeticao {
  const { inicio, fim } = datasDaCompeticao(c.calendario, inicioTemporada);
  // A primeira fase espera quem vem de outras competições: o plano é pelo previsto.
  const chegamNaPrimeira = (c.fases[0]?.entramAqui ?? []).some((v) => vagaDinamica(v));
  const plano = planoDasFases(
    c,
    chegamNaPrimeira || !participantes.length
      ? (o.quantidadePlanejada ?? quantidadeInicial(c))
      : participantes.length,
  );
  const datas = datasPlanejadas(
    c,
    inicioTemporada,
    o.datasFifa,
    o.quantidadePlanejada ?? participantes.length,
    o.bloqueadas,
  );
  const rodadasDaFase = plano.rodadas;
  const estado: EstadoCompeticao = {
    id: c.id,
    temporada: o.temporada,
    inicio,
    // Edições de vários anos (eliminatórias): o fim é a última rodada.
    fim: (datas.at(-1) ?? fim) > fim ? (datas.at(-1) as string) : fim,
    participantes: [...participantes],
    datas,
    rodadasDaFase,
    fases: c.fases.map(() => null),
    jogos: [],
    encerrada: false,
    artilharia: {},
    ...(o.entrantes ? { entrantes: o.entrantes } : {}),
    ...(o.paises ? { paises: o.paises } : {}),
    ...(o.caminhos && Object.keys(o.caminhos).length ? { caminhos: o.caminhos } : {}),
    ...(o.divisoes ? { divisoes: o.divisoes } : {}),
  };
  // Na lista de participantes entram também os que só jogam a partir de uma fase adiante.
  const adiante = Object.values(o.entrantes ?? {}).flat();
  if (adiante.length) estado.participantes = [...participantes, ...adiante];
  // A primeira fase espera clubes de outras competições (Copa Intercontinental).
  if (esperaOutra(c, estado, 0)) return { ...estado, aguardando: 0 };
  return abrirFase(c, estado, 0, [...participantes], o.semente);
}

function rodadaInicialDaFase(e: EstadoCompeticao, f: number): number {
  return e.rodadasDaFase.slice(0, f).reduce((s, r) => s + r, 0);
}

/** Abre a fase f com os times (na ordem de semente) e cria os jogos dela. */
function abrirFase(
  c: Competicao,
  e: EstadoCompeticao,
  f: number,
  times: string[],
  semente: string,
): EstadoCompeticao {
  const fase = c.fases[f] as Fase;
  const rng = new Rng(`${semente}:${c.id}:${e.temporada}:fase-${f}`);
  const rodadaInicial = rodadaInicialDaFase(e, f);
  const jogos = [...e.jogos];
  let estadoFase: EstadoFase;
  if (fase.tipo === "mata-mata") {
    estadoFase = { times, chaves: [], rodadaInicial, encerrada: false };
    const novo = { ...e, jogos, fases: e.fases.map((x, i) => (i === f ? estadoFase : x)) };
    return abrirRodadaEliminatoria(c, novo, f, times, rng);
  }
  const numGrupos = fase.tipo === "grupos" ? fase.grupos : 1;
  const turnos = fase.tipo === "grupos" ? fase.turnos : 1;
  const divisao = fase.tipo === "grupos" ? fase.divisaoGrupos : "sorteio";
  let grupos: string[][] = Array.from({ length: numGrupos }, () => []);
  if (divisao === "potes") {
    // Com caminhos (regiões da Ásia), cada região sorteia os seus grupos.
    const regioes = porCaminho(times, e.caminhos);
    grupos =
      regioes.length > 1 && numGrupos % regioes.length === 0
        ? regioes.flatMap((r) => gruposPorPotes(r, numGrupos / regioes.length, rng, e.paises))
        : gruposPorPotes(times, numGrupos, rng, separacao(fase, e.paises));
    if (fase.tipo === "grupos" && fase.menoresPara)
      grupos = cabecasNosMenores(grupos, times, fase.menoresPara);
  } else if (divisao === "sorteio" && f === 0) {
    rng.shuffle(times).forEach((t, i) => grupos[i % numGrupos]?.push(t));
  } else if (divisao === "sorteio") {
    // Depois da primeira fase, os grupos são montados em "serpente" pela campanha.
    times.forEach((t, i) => {
      const volta = Math.floor(i / numGrupos) % 2 === 1;
      const g = volta ? numGrupos - 1 - (i % numGrupos) : i % numGrupos;
      grupos[g]?.push(t);
    });
  } else {
    const tamanho = Math.ceil(times.length / numGrupos);
    times.forEach((t, i) => grupos[Math.min(numGrupos - 1, Math.floor(i / tamanho))]?.push(t));
  }
  // Fase de liga da UEFA: potes, sem compatriotas, mesmo número de adversários de cada pote. Com
  // mais de uma liga (Oeste e Leste da Ásia), uma por caminho.
  if (fase.tipo === "fase-de-liga" && fase.potes > 1) {
    // Ligas regionais (Ásia): sem o limite de 2 por país e com potes sem compatriotas.
    const regional = fase.grupos > 1;
    // Sem caminhos marcados (eliminatórias da UEFA), as ligas saem de um sorteio por potes.
    const porCaminhos = porCaminho(times, e.caminhos);
    const separadas =
      regional && porCaminhos.length === 1
        ? gruposPorPotes(times, fase.grupos, rng, e.paises)
        : porCaminhos;
    const ligas = regional
      ? separadas.map((l) => potesSemCompatriotas(l, fase.potes, e.paises))
      : [times];
    const maximo = regional ? fase.jogosPorTime : 2;
    // Se o sorteio com as restrições de país não fecha, sai sem elas (nunca vira todos contra todos).
    const sorteadas = ligas.map(
      (l) =>
        sortearFaseDeLiga(l, fase.potes, fase.jogosPorTime, rng, e.paises, maximo) ??
        sortearFaseDeLiga(l, fase.potes, fase.jogosPorTime, rng),
    );
    if (sorteadas.every((x) => x)) {
      sorteadas.forEach((lista, gi) => {
        for (const j of lista!)
          jogos.push({
            fase: f,
            rodada: rodadaInicial + j.rodada,
            grupo: gi,
            casa: j.casa,
            fora: j.fora,
          });
      });
      estadoFase = { times, grupos: ligas.map((l) => [...l]), rodadaInicial, encerrada: false };
      return garantirDatas({
        ...e,
        jogos,
        fases: e.fases.map((x, k) => (k === f ? estadoFase : x)),
      });
    }
  }
  const maiorGrupo = Math.max(0, ...grupos.map((g) => g.length));
  grupos.forEach((g, gi) => {
    let rodadas = todosContraTodos(g.length, turnos, rng);
    // Grupos menores jogam só as últimas rodadas (eliminatórias da UEFA com grupos de 4 e de 5).
    const atraso =
      fase.tipo === "grupos" && fase.menoresNoFim && g.length < maiorGrupo
        ? Math.max(0, (e.rodadasDaFase[f] ?? 0) - rodadas.length)
        : 0;
    // Fase de liga: cada um joga só `jogosPorTime` vezes, contra adversários de todo o grupo.
    if (fase.tipo === "fase-de-liga") {
      const k = Math.min(fase.jogosPorTime, rodadas.length);
      rodadas = Array.from(
        { length: k },
        (_, i) => rodadas[Math.floor((i * rodadas.length) / k)] as [number, number][],
      );
    }
    rodadas.forEach((rodada, r0) => {
      const r = r0 + atraso;
      if (r >= (e.rodadasDaFase[f] ?? 0)) return;
      for (const [a, b] of rodada)
        jogos.push({
          fase: f,
          rodada: rodadaInicial + r,
          grupo: gi,
          casa: g[a] as string,
          fora: g[b] as string,
        });
    });
  });
  estadoFase = { times, grupos, rodadaInicial, encerrada: false };
  return garantirDatas({ ...e, jogos, fases: e.fases.map((x, i) => (i === f ? estadoFase : x)) });
}

/** Restrição de sorteio: o país (continentais) ou o grupo de times a separar (anfitriões). */
function separacao(
  fase: Fase,
  paises?: Record<string, string>,
): Record<string, string> | undefined {
  if (fase.tipo !== "grupos" || !fase.separar?.length) return paises;
  return { ...paises, ...Object.fromEntries(fase.separar.map((t) => [t, "separados"])) };
}

/**
 * Os `n` primeiros da lista de entrada vão para os grupos menores: cada um que caiu num grupo maior
 * troca de lugar com um companheiro de pote que está num menor.
 */
function cabecasNosMenores(grupos0: string[][], times: readonly string[], n: number): string[][] {
  const grupos = grupos0.map((g) => [...g]);
  const maior = Math.max(...grupos.map((g) => g.length));
  const cabecas = new Set(times.slice(0, n));
  const pote = (t: string) => Math.floor(times.indexOf(t) / grupos.length);
  for (const t of cabecas) {
    const gi = grupos.findIndex((g) => g.includes(t));
    if (gi < 0 || (grupos[gi] as string[]).length < maior) continue;
    for (const g of grupos) {
      if (g.length >= maior) continue;
      const k = g.findIndex((x) => pote(x) === pote(t) && !cabecas.has(x));
      if (k < 0) continue;
      const outro = g[k] as string;
      g[k] = t;
      const de = grupos[gi] as string[];
      de[de.indexOf(t)] = outro;
      break;
    }
  }
  return grupos;
}

/** Separa os times por caminho, na ordem em que cada caminho aparece (mantém a ordem de força). */
function porCaminho(times: readonly string[], caminhos?: Record<string, string>): string[][] {
  const mapa = new Map<string, string[]>();
  for (const t of times) {
    const k = caminhos?.[t] ?? "";
    mapa.set(k, [...(mapa.get(k) ?? []), t]);
  }
  return [...mapa.values()];
}

/**
 * Sorteio por potes: cada pote tem um time de cada grupo, na ordem de força. Dentro do pote, o
 * sorteio tenta não pôr dois clubes do mesmo país no mesmo grupo.
 */
function gruposPorPotes(
  times: readonly string[],
  numGrupos: number,
  rng: Rng,
  paises?: Record<string, string>,
): string[][] {
  const grupos: string[][] = Array.from({ length: numGrupos }, () => []);
  for (let k = 0; k * numGrupos < times.length; k++) {
    const pote = times.slice(k * numGrupos, (k + 1) * numGrupos);
    let melhor: string[] = pote;
    let menor = Infinity;
    for (let tentativa = 0; tentativa < 200 && menor > 0; tentativa++) {
      const ordem = rng.shuffle(pote);
      const choques = paises
        ? ordem.filter((t, g) => grupos[g]?.some((x) => paises[x] && paises[x] === paises[t]))
            .length
        : 0;
      if (choques < menor) {
        menor = choques;
        melhor = ordem;
      }
    }
    melhor.forEach((t, g) => grupos[g]?.push(t));
  }
  return grupos;
}

/** Quantos confrontos entre clubes do mesmo país uma lista de pares tem. */
function choquesDePais(
  pares: readonly (readonly [string, string])[],
  paises?: Record<string, string>,
) {
  if (!paises) return 0;
  return pares.filter(([a, b]) => a && b && paises[a] && paises[a] === paises[b]).length;
}

/** Pares da primeira eliminatória de uma fase, conforme o chaveamento. */
function paresIniciais(
  fase: Extract<Fase, { tipo: "mata-mata" }>,
  times: readonly string[],
  tamanho: number,
  rng: Rng,
  paises?: Record<string, string>,
  rodadaUnica = false,
  caminhos?: Record<string, string>,
  /** Grupo de cada time na fase anterior, quando o sorteio evita repetir o grupo. */
  grupos?: Record<string, string>,
): [string, string][] {
  const pela = (ordem: readonly string[]) => {
    // Fase de uma eliminatória só (pré-Libertadores): todos jogam, sem folga (1 x n, 2 x n-1...).
    if (rodadaUnica) {
      const pares: [string, string][] = [];
      for (let i = 0; i < Math.ceil(ordem.length / 2); i++)
        pares.push([
          ordem[i] ?? "",
          i === ordem.length - 1 - i ? "" : (ordem[ordem.length - 1 - i] ?? ""),
        ]);
      return pares;
    }
    const sementes = ordemDaChave(tamanho).map((s) => ordem[s - 1] ?? "");
    const pares: [string, string][] = [];
    for (let i = 0; i < sementes.length; i += 2)
      pares.push([sementes[i] ?? "", sementes[i + 1] ?? ""]);
    return pares;
  };
  if (fase.chaveamento === "pais" && paises) {
    // Só entre clubes do mesmo país: o mais bem colocado contra o pior, e assim por diante.
    const porPais = new Map<string, string[]>();
    for (const t of times)
      porPais.set(paises[t] ?? "", [...(porPais.get(paises[t] ?? "") ?? []), t]);
    const pares: [string, string][] = [];
    const sobra: string[] = [];
    for (const lista of porPais.values()) {
      while (lista.length >= 2) pares.push([lista.shift() as string, lista.pop() as string]);
      if (lista.length) sobra.push(lista[0] as string);
    }
    for (let i = 0; i < sobra.length; i += 2) pares.push([sobra[i] ?? "", sobra[i + 1] ?? ""]);
    return rng.shuffle(pares);
  }
  if (fase.chaveamento === "caminhos-campanha") {
    // Dentro de cada caminho, pela campanha: 1º x último, 2º x penúltimo...
    const pares: [string, string][] = [];
    for (const lista of porCaminho(times, caminhos))
      for (let i = 0; i < Math.ceil(lista.length / 2); i++)
        pares.push([
          lista[i] ?? "",
          i === lista.length - 1 - i ? "" : (lista[lista.length - 1 - i] ?? ""),
        ]);
    return pares;
  }
  if (fase.chaveamento === "caminhos") {
    // Sorteio dentro de cada caminho, evitando clubes do mesmo país frente a frente.
    const porCaminho = new Map<string, string[]>();
    for (const t of times) {
      const k = caminhos?.[t] ?? "";
      porCaminho.set(k, [...(porCaminho.get(k) ?? []), t]);
    }
    const pares: [string, string][] = [];
    for (const lista of porCaminho.values()) {
      let melhor: [string, string][] = [];
      let menor = Infinity;
      for (let tentativa = 0; tentativa < 60 && menor > 0; tentativa++) {
        const ordem = rng.shuffle(lista);
        const p: [string, string][] = [];
        for (let i = 0; i < ordem.length; i += 2) p.push([ordem[i] ?? "", ordem[i + 1] ?? ""]);
        const choques = choquesDePais(p, paises);
        if (choques < menor) {
          menor = choques;
          melhor = p;
        }
      }
      pares.push(...melhor);
    }
    return pares;
  }
  if (fase.chaveamento === "potes") {
    // Metade de cima (melhores) contra a de baixo, sorteada (sem dois do mesmo grupo, se pedido).
    const meio = Math.ceil(times.length / 2);
    const cima = times.slice(0, meio);
    const sortear = () => {
      const baixo = rng.shuffle(times.slice(meio));
      return cima.map((t, i) => [t, baixo[i] ?? ""] as [string, string]);
    };
    let melhor = sortear();
    if (grupos)
      for (let tentativa = 0; tentativa < 60 && choquesDePais(melhor, grupos) > 0; tentativa++) {
        const outro = sortear();
        if (choquesDePais(outro, grupos) < choquesDePais(melhor, grupos)) melhor = outro;
      }
    return melhor;
  }
  if (fase.chaveamento !== "sorteio") return pela(times);
  // Sorteio livre, tentando evitar clubes do mesmo país frente a frente.
  let melhor = pela(rng.shuffle(times));
  let menor = choquesDePais(melhor, paises);
  for (let tentativa = 0; tentativa < 100 && menor > 0; tentativa++) {
    const pares = pela(rng.shuffle(times));
    const choques = choquesDePais(pares, paises);
    if (choques < menor) {
      menor = choques;
      melhor = pares;
    }
  }
  return melhor;
}

/** Abre uma rodada eliminatória com os times na ordem de semente. */
function abrirRodadaEliminatoria(
  c: Competicao,
  e: EstadoCompeticao,
  f: number,
  times: string[],
  rng: Rng,
): EstadoCompeticao {
  const fase = c.fases[f];
  const ef = e.fases[f];
  if (!fase || fase.tipo !== "mata-mata" || !ef?.chaves) return e;
  const x = ef.chaves.length;
  const ultimaFase = c.fases.length - 1 === f;
  // Quantas eliminatórias a fase tem: até sobrar um (última fase) ou uma só.
  const k = eliminatoriasDaFase(fase, ef.times.length, ultimaFase);
  const tamanho = 2 ** Math.ceil(Math.log2(Math.max(2, times.length)));
  let pares: Confronto[];
  if (x === 0) {
    // Eliminatória que alimenta uma fase onde entram outros clubes (pré-Libertadores), ou marcada
    // para todos jogarem (3ª fase da Copa do Brasil, com 48): sem folga. Nas outras, a chave
    // completa com folgas para os melhores.
    // Lugares do real que faltam no banco (os amadores): folga para os primeiros da ordem de
    // entrada, e os outros jogam todos entre si.
    const folgas = fase.lugares
      ? Math.max(0, Math.min(times.length, fase.lugares - times.length))
      : 0;
    const semFolga =
      folgas > 0 ||
      fase.todosJogam === true ||
      (!ultimaFase && (c.fases[f + 1]?.entramAqui.length ?? 0) > 0);
    const jogam = times.slice(folgas);
    const tamanhoJogam = 2 ** Math.ceil(Math.log2(Math.max(2, jogam.length)));
    pares = [
      ...times.slice(0, folgas).map((t) => [t, ""] as [string, string]),
      ...paresIniciais(
        fase,
        jogam,
        folgas ? tamanhoJogam : tamanho,
        rng,
        e.paises,
        semFolga,
        e.caminhos,
        fase.evitarMesmoGrupo ? grupoNaFaseAnterior(e, f) : undefined,
      ),
    ].map(([p, q]) => {
      const [a, b] = seed(ef.times, p, q);
      return b ? { a, b } : { a, b: "", vencedor: a };
    });
  } else {
    pares = [];
    for (let i = 0; i < times.length; i += 2) {
      const [a, b] = seed(ef.times, times[i] ?? "", times[i + 1] ?? "");
      pares.push(b ? { a, b } : { a, b: "", vencedor: a });
    }
  }
  const offset = Array.from({ length: x }, (_, i) => pernas(fase, i, k)).reduce((s, v) => s + v, 0);
  const legs = pernas(fase, x, k);
  const jogos = [...e.jogos];
  pares.forEach((p, ci) => {
    if (!p.b) return;
    if (legs === 2) {
      jogos.push({
        fase: f,
        rodada: ef.rodadaInicial + offset,
        chave: x,
        confronto: ci,
        perna: 1,
        casa: p.b,
        fora: p.a,
      });
      jogos.push({
        fase: f,
        rodada: ef.rodadaInicial + offset + 1,
        chave: x,
        confronto: ci,
        perna: 2,
        casa: p.a,
        fora: p.b,
      });
    } else {
      const neutro = fase.mando === "neutro";
      const doMenor = fase.mando === "menor-divisao" ? mandanteDeBaixo(fase, e, p.a, p.b) : null;
      const inverte =
        doMenor !== null
          ? doMenor === p.b
          : (fase.mando === "sorteio" || fase.mando === "menor-divisao") && rng.chance(0.5);
      jogos.push({
        fase: f,
        rodada: ef.rodadaInicial + offset,
        chave: x,
        confronto: ci,
        perna: 2,
        casa: inverte ? p.b : p.a,
        fora: inverte ? p.a : p.b,
        ...(neutro ? { neutro: true } : {}),
      });
    }
  });
  const novaFase: EstadoFase = { ...ef, chaves: [...ef.chaves, pares] };
  return garantirDatas({ ...e, jogos, fases: e.fases.map((y, i) => (i === f ? novaFase : y)) });
}

/**
 * Se o mata-mata teve mais eliminatórias do que o previsto (mais classificados), as rodadas extras
 * ficam a cada 3 dias depois da última data.
 */
function garantirDatas(e: EstadoCompeticao): EstadoCompeticao {
  const maior = Math.max(-1, ...e.jogos.map((j) => j.rodada));
  if (maior < e.datas.length) return e;
  const datas = [...e.datas];
  while (datas.length <= maior) datas.push(somarDias(datas.at(-1) ?? e.inicio, 3));
  return { ...e, datas };
}

/** Grupo de cada time na fase anterior (para o sorteio não repetir o confronto do grupo). */
function grupoNaFaseAnterior(e: EstadoCompeticao, f: number): Record<string, string> | undefined {
  const grupos = e.fases[f - 1]?.grupos;
  if (!grupos) return undefined;
  return Object.fromEntries(grupos.flatMap((g, i) => g.map((t) => [t, `g${i}`])));
}

/**
 * Mando do clube de divisão mais baixa (Copa del Rey, DFB-Pokal): quem manda, ou null quando a regra
 * não se aplica (mesma divisão, diferença pequena ou acima da divisão mínima) e o mando é sorteado.
 */
function mandanteDeBaixo(
  fase: Extract<Fase, { tipo: "mata-mata" }>,
  e: EstadoCompeticao,
  a: string,
  b: string,
): string | null {
  const regra = fase.menorDivisao ?? { aPartirDe: 1, diferenca: 1 };
  const divisao = (x: string) => e.divisoes?.[x] ?? 99;
  const [da, db] = [divisao(a), divisao(b)];
  if (Math.abs(da - db) < regra.diferenca) return null;
  const [baixo, d] = da > db ? [a, da] : [b, db];
  return d >= regra.aPartirDe ? baixo : null;
}

/** Os dois na ordem de semente: o que entrou melhor colocado primeiro. */
function seed(ordem: readonly string[], p: string, q: string): [string, string] {
  if (!p) return [q, ""];
  if (!q) return [p, ""];
  return ordem.indexOf(p) <= ordem.indexOf(q) ? [p, q] : [q, p];
}

/** Desempate do jogo, para o motor: só na volta (ou no jogo único) do mata-mata. */
export function desempateDoJogo(
  c: Competicao,
  e: EstadoCompeticao,
  j: JogoCompeticao,
): { desempate: "nenhum" | "penaltis" | "prorrogacao"; agregado?: [number, number] } {
  const fase = c.fases[j.fase];
  if (!fase || fase.tipo !== "mata-mata" || j.perna !== 2) return { desempate: "nenhum" };
  // É a final? Última fase e última eliminatória dela.
  const ef = e.fases[j.fase];
  const final =
    j.fase === c.fases.length - 1 &&
    (j.chave ?? 0) === eliminatoriasDaFase(fase, ef?.times.length ?? 2, true) - 1;
  const desempate =
    fase.prorrogacao || (final && fase.prorrogacaoNaFinal)
      ? "prorrogacao"
      : fase.penaltis
        ? "penaltis"
        : "nenhum";
  const ida = e.jogos.find(
    (x) => x.fase === j.fase && x.chave === j.chave && x.confronto === j.confronto && x.perna === 1,
  );
  if (!ida?.placar) return { desempate };
  // A ida foi na casa do outro: os gols dela, vistos deste jogo.
  const agregado: [number, number] =
    ida.casa === j.casa ? [ida.placar[0], ida.placar[1]] : [ida.placar[1], ida.placar[0]];
  return { desempate, agregado };
}

/** Tabela de um grupo de uma fase de pontos corridos. */
export function tabelaDoGrupo(
  c: Competicao,
  e: EstadoCompeticao,
  f: number,
  g: number,
): LinhaTabela[] {
  const ef = e.fases[f];
  const grupo = ef?.grupos?.[g] ?? [];
  const jogos = e.jogos.filter((j) => j.fase === f && j.grupo === g);
  return ordenarTabela(grupo, jogos, criteriosDe(c), c.pontos, `${c.id}:${e.temporada}:${f}:${g}`);
}

/** Classificação de uma fase de grupos: primeiros de cada grupo, depois segundos... */
function classificacaoDosGrupos(c: Competicao, e: EstadoCompeticao, f: number): string[] {
  const ef = e.fases[f];
  if (!ef?.grupos) return [];
  const tabelas = ef.grupos.map((_, g) => tabelaDoGrupo(c, e, f, g));
  const maior = Math.max(0, ...tabelas.map((t) => t.length));
  const ordem: string[] = [];
  for (let p = 0; p < maior; p++) {
    const nessa = tabelas.map((t) => t[p]).filter((l): l is LinhaTabela => !!l);
    nessa.sort(
      (a, b) =>
        b.pontos / Math.max(1, b.jogos) - a.pontos / Math.max(1, a.jogos) ||
        b.golsPro - b.golsContra - (a.golsPro - a.golsContra) ||
        b.golsPro - a.golsPro,
    );
    ordem.push(...nessa.map((l) => l.clube));
  }
  return ordem;
}

/** Quem passa da fase de grupos, na ordem de semente. */
function classificadosDosGrupos(c: Competicao, e: EstadoCompeticao, f: number): string[] {
  const fase = c.fases[f];
  if (!fase || fase.tipo === "mata-mata") return [];
  const geral = classificacaoDosGrupos(c, e, f);
  if (fase.tipo === "fase-de-liga") {
    if (fase.playoff) return geral.slice(fase.playoff.de - 1, fase.playoff.ate);
    // Várias ligas (Oeste e Leste): os primeiros de cada uma, alternando por colocação.
    return geral.slice(0, fase.classificamDireto * (e.fases[f]?.grupos?.length ?? 1));
  }
  const ef = e.fases[f] as EstadoFase;
  if (fase.faixaClassificada) {
    // A faixa vale em cada grupo (do 2º ao 5º de cada grupo da Primera Federación).
    const { de, ate } = fase.faixaClassificada;
    const naFaixa = new Set(
      (ef.grupos ?? [[]]).flatMap((_, g) =>
        tabelaDoGrupo(c, e, f, g)
          .slice(de - 1, ate)
          .map((l) => l.clube),
      ),
    );
    return geral.filter((t) => naFaixa.has(t));
  }
  const tabelas = (ef.grupos ?? []).map((_, g) => tabelaDoGrupo(c, e, f, g));
  const diretos = new Set(
    tabelas.flatMap((t) => t.slice(0, fase.classificamPorGrupo).map((l) => l.clube)),
  );
  if (fase.melhores) {
    const candidatos = tabelas
      .map((t) => t[fase.melhores!.posicao - 1])
      .filter((l): l is LinhaTabela => !!l)
      .sort((a, b) => b.pontos - a.pontos || b.golsPro - b.golsContra - (a.golsPro - a.golsContra));
    for (const l of candidatos.slice(0, fase.melhores.quantidade)) diretos.add(l.clube);
  }
  return geral.filter((t) => diretos.has(t));
}

/** Vencedor de um confronto do mata-mata (agregado; empate: pênaltis; sem eles, a melhor campanha). */
function vencedorDoConfronto(
  e: EstadoCompeticao,
  f: number,
  chave: number,
  ci: number,
  p: Confronto,
): string | null {
  if (!p.b) return p.a;
  const jogos = e.jogos.filter((j) => j.fase === f && j.chave === chave && j.confronto === ci);
  if (!jogos.length || jogos.some((j) => !j.placar)) return null;
  let ga = 0;
  let gb = 0;
  for (const j of jogos) {
    const [x, y] = j.placar as [number, number];
    if (j.casa === p.a) {
      ga += x;
      gb += y;
    } else {
      ga += y;
      gb += x;
    }
  }
  if (ga !== gb) return ga > gb ? p.a : p.b;
  const decisivo = jogos.find((j) => j.perna === 2) ?? jogos[jogos.length - 1];
  if (decisivo?.penaltis) {
    const [x, y] = decisivo.penaltis;
    const casaVenceu = x > y;
    return (decisivo.casa === p.a) === casaVenceu ? p.a : p.b;
  }
  return p.a;
}

/**
 * Depois de lançar resultados: fecha confrontos, abre a próxima eliminatória ou a próxima fase e,
 * no fim, define o campeão e a classificação final.
 */
export function avancarCompeticao(
  c: Competicao,
  e0: EstadoCompeticao,
  semente: string,
): EstadoCompeticao {
  let e = e0;
  for (let guarda = 0; guarda < 40 && !e.encerrada; guarda++) {
    // Fase esperando clubes de outra competição (os eliminados da Libertadores na Sul-Americana).
    if (e.aguardando !== undefined) {
      const p = e.aguardando;
      if (esperaOutra(c, e, p)) break;
      const { aguardando: _feito, ...resto } = e;
      // Na primeira fase, os que já estavam (os anfitriões da Copa) vêm na frente.
      const adiante = new Set(Object.values(resto.entrantes ?? {}).flat());
      const iniciais = p === 0 ? resto.participantes.filter((t) => !adiante.has(t)) : [];
      const entrada =
        p === 0
          ? [...new Set([...iniciais, ...entradaDaFase(c, resto, 0, [])])]
          : entradaDaFase(c, resto, p, classificadosDaFase(c, resto, p - 1));
      e = abrirFase(c, resto, p, entrada, semente);
      continue;
    }
    const f = e.fases.findIndex((x) => x && !x.encerrada);
    if (f < 0) break;
    const fase = c.fases[f] as Fase;
    const ef = e.fases[f] as EstadoFase;
    const rng = new Rng(`${semente}:${c.id}:${e.temporada}:avanco-${f}-${ef.chaves?.length ?? 0}`);
    if (fase.tipo === "mata-mata") {
      const chaves = ef.chaves ?? [];
      const atual = chaves[chaves.length - 1] ?? [];
      const x = chaves.length - 1;
      const vencedores = atual.map((p, ci) => p.vencedor ?? vencedorDoConfronto(e, f, x, ci, p));
      if (vencedores.some((v) => v === null)) break;
      const fechadas = atual.map((p, i) => ({ ...p, vencedor: vencedores[i] as string }));
      const novaFase: EstadoFase = { ...ef, chaves: [...chaves.slice(0, -1), fechadas] };
      e = { ...e, fases: e.fases.map((y, i) => (i === f ? novaFase : y)) };
      const ultimaFase = c.fases.length - 1 === f;
      const k = eliminatoriasDaFase(fase, ef.times.length, ultimaFase);
      if (chaves.length < k && vencedores.length > 1) {
        e = abrirRodadaEliminatoria(c, e, f, vencedores as string[], rng);
        continue;
      }
    } else if (e.jogos.some((j) => j.fase === f && !j.placar)) break;
    e = {
      ...e,
      fases: e.fases.map((y, i) => (i === f ? { ...(y as EstadoFase), encerrada: true } : y)),
    };
    if (!c.fases[f + 1]) {
      e = encerrar(c, e);
      break;
    }
    if (esperaOutra(c, e, f + 1)) {
      e = { ...e, aguardando: f + 1 };
      break;
    }
    e = abrirFase(c, e, f + 1, entradaDaFase(c, e, f + 1, classificadosDaFase(c, e, f)), semente);
  }
  return e;
}

/** Quem passou da fase f (encerrada), na ordem de semente. */
function classificadosDaFase(c: Competicao, e: EstadoCompeticao, f: number): string[] {
  const fase = c.fases[f];
  const ef = e.fases[f];
  if (!fase || !ef) return [];
  if (fase.tipo === "mata-mata") return (ef.chaves?.at(-1) ?? []).map((p) => p.vencedor ?? p.a);
  return classificadosDosGrupos(c, e, f);
}

/** A fase p ainda espera clubes que vêm de outra competição durante a temporada. */
function esperaOutra(c: Competicao, e: EstadoCompeticao, p: number): boolean {
  const fase = c.fases[p];
  if (!fase) return false;
  return fase.entramAqui.some((v) => !vagaDaPropria(c, v) && vagaDinamica(v)) && !e.recebidos?.[p];
}

/** Colocados da própria competição numa fase anterior (sem fase: a tabela da primeira). */
function daPropriaTabela(
  c: Competicao,
  e: EstadoCompeticao,
  v: {
    fase?: string | undefined;
    posicoes?: number[] | undefined;
    porGrupo: boolean;
    melhores?: number | undefined;
    pular?: number | undefined;
    maximo?: number | undefined;
    exceto?: string[] | undefined;
  },
): string[] {
  const fi = v.fase ? c.fases.findIndex((x) => x.id === v.fase) : 0;
  const grupos = v.porGrupo ? (e.fases[fi]?.grupos ?? []).map((_, g) => g) : [0];
  const linhas: LinhaTabela[] = [];
  for (const p of v.posicoes ?? [])
    for (const g of grupos) {
      const l = tabelaDoGrupo(c, e, fi, g)[p - 1];
      if (l) linhas.push(l);
    }
  // Só os melhores entre os grupos (os 3 melhores segundos da África), pela campanha.
  const lista = v.melhores
    ? porCampanha(linhas)
        .slice(0, v.melhores)
        .map((l) => l.clube)
    : linhas.map((l) => l.clube);
  return recortar(lista, v);
}

/** Aplica os filtros da vaga à lista que ela traz: tira os `exceto`, pula e limita. */
function recortar(
  lista: readonly string[],
  v: { pular?: number | undefined; maximo?: number | undefined; exceto?: string[] | undefined },
): string[] {
  const sem = v.exceto ? lista.filter((t) => !v.exceto!.includes(t)) : [...lista];
  const desde = v.pular ?? 0;
  return sem.slice(desde, v.maximo !== undefined ? desde + v.maximo : undefined);
}

/**
 * Times da fase p na ordem de semente: quem entra direto (vagas em ordem), os classificados da fase
 * anterior e, por último, as vagas marcadas para entrar depois (pote mais baixo).
 */
function entradaDaFase(
  c: Competicao,
  e: EstadoCompeticao,
  p: number,
  classificados: readonly string[],
): string[] {
  const fase = c.fases[p] as Fase;
  const antes: string[] = [];
  const depois: string[] = [];
  const usados = new Set(classificados);
  // Quem já se classificou pelas fases anteriores (eliminatórias) fica fora das vagas marcadas.
  const jaClassificados = fase.entramAqui.some((v) => v.foraDosClassificados)
    ? new Set(classificadosPelasRegras(c, e, p))
    : new Set<string>();
  const por = (lista: readonly string[], destino: string[]) => {
    for (const t of lista)
      if (!usados.has(t)) {
        usados.add(t);
        destino.push(t);
      }
  };
  // Os primeiros da fase de liga entram depois do playoff (Champions League).
  const liga = c.fases[p - 2];
  if (liga?.tipo === "fase-de-liga" && liga.playoff)
    por(
      tabelaDoGrupo(c, e, p - 2, 0)
        .slice(0, liga.classificamDireto)
        .map((l) => l.clube),
      antes,
    );
  fase.entramAqui.forEach((v, vi) => {
    const bruta = vagaDaPropria(c, v)
      ? daPropriaTabela(c, e, v)
      : (e.entrantes?.[`${p}.${vi}`] ?? []);
    const lista = v.foraDosClassificados ? bruta.filter((t) => !jaClassificados.has(t)) : bruta;
    por(lista, v.depois ? depois : antes);
  });
  const todos = [...antes, ...classificados, ...depois];
  return fase.limiteDeEntradas ? todos.slice(0, fase.limiteDeEntradas) : todos;
}

/**
 * Clubes de uma vaga que depende do andamento de outra competição na mesma temporada (null se a
 * fase de origem ainda não acabou).
 */
export function resolverVagaDinamica(
  origem: Competicao,
  e: EstadoCompeticao,
  v: {
    criterio: string;
    fase?: string | undefined;
    posicoes?: number[] | undefined;
    porGrupo: boolean;
    doCaminho?: string | undefined;
    melhores?: number | undefined;
    pular?: number | undefined;
    maximo?: number | undefined;
    exceto?: string[] | undefined;
  },
): string[] | null {
  // Classificados pelas eliminatórias: quando elas terminam.
  if (v.criterio === "classificados")
    return e.encerrada ? recortar(e.classificados ?? [], v) : null;
  // Campeão (ou vice) da edição: quando ela termina.
  if (v.criterio === "campeao" || v.criterio === "vice") {
    if (!e.encerrada) return null;
    const dono = v.criterio === "campeao" ? e.campeao : e.classificacao?.[1];
    return dono ? [dono] : [];
  }
  const fi = v.fase ? origem.fases.findIndex((x) => x.id === v.fase) : -1;
  const ef = e.fases[fi];
  if (fi < 0 || !ef?.encerrada) return null;
  if (v.criterio === "eliminados") {
    const passaram = new Set(classificadosDaFase(origem, e, fi));
    return ef.times.filter(
      // Quem não tem caminho marcado é do caminho principal.
      (t) => !passaram.has(t) && (!v.doCaminho || (e.caminhos?.[t] ?? "principal") === v.doCaminho),
    );
  }
  return daPropriaTabela(origem, e, v);
}

/** Entrega à competição os clubes que vêm de outra para a fase p e abre a fase, se esperava. */
export function receberEntrantes(
  c: Competicao,
  e: EstadoCompeticao,
  p: number,
  porVaga: Record<number, string[]>,
  semente: string,
  paises?: Record<string, string>,
): EstadoCompeticao {
  const entrantes = { ...e.entrantes };
  const caminhos = { ...e.caminhos };
  const novos: string[] = [];
  for (const [vi, lista] of Object.entries(porVaga)) {
    entrantes[`${p}.${vi}`] = lista;
    novos.push(...lista);
    const caminho = c.fases[p]?.entramAqui[Number(vi)]?.caminho;
    if (caminho) for (const t of lista) caminhos[t] = caminho;
  }
  const participantes = [...e.participantes, ...novos.filter((t) => !e.participantes.includes(t))];
  const recebido = {
    ...e,
    entrantes,
    ...(Object.keys(caminhos).length ? { caminhos } : {}),
    ...(paises || e.paises ? { paises: { ...e.paises, ...paises } } : {}),
    participantes,
    recebidos: { ...e.recebidos, [p]: true },
  };
  return avancarCompeticao(c, recebido, semente);
}

function encerrar(c: Competicao, e: EstadoCompeticao): EstadoCompeticao {
  const playoff = fasesDePlayoff(c);
  const classificacao = classificacaoFinal(c, e);
  const ultima = c.fases.length - 1;
  const ef = e.fases[ultima];
  const vencedores = (ef?.chaves?.at(-1) ?? [])
    .map((p) => p.vencedor)
    .filter((x): x is string => !!x);
  const vencedorUltima = vencedores[0];
  const campeao = playoff[ultima] ? classificacao[0] : (vencedorUltima ?? classificacao[0]);
  return {
    ...e,
    encerrada: true,
    classificacao,
    ...(campeao ? { campeao } : {}),
    ...(playoff[ultima] && vencedorUltima ? { vencedorPlayoff: vencedorUltima } : {}),
    ...(playoff[ultima] && vencedores.length > 1 ? { vencedoresPlayoff: vencedores } : {}),
    ...(c.classificados.length ? { classificados: classificadosPelasRegras(c, e) } : {}),
  };
}

/** Linhas de tabela em ordem entre grupos diferentes: pontos por jogo, saldo por jogo, gols. */
function porCampanha(linhas: LinhaTabela[]): LinhaTabela[] {
  const pj = (l: LinhaTabela) => Math.max(1, l.jogos);
  return [...linhas].sort(
    (a, b) =>
      b.pontos / pj(b) - a.pontos / pj(a) ||
      (b.golsPro - b.golsContra) / pj(b) - (a.golsPro - a.golsContra) / pj(a) ||
      b.golsPro / pj(b) - a.golsPro / pj(a) ||
      a.clube.localeCompare(b.clube),
  );
}

/**
 * Quem as eliminatórias classificam, pelas regras de `classificados`, olhando só as fases antes de
 * `ateFase` (para os playoffs saberem quem já foi direto).
 */
export function classificadosPelasRegras(
  c: Competicao,
  e: EstadoCompeticao,
  ateFase = Infinity,
): string[] {
  const lista: string[] = [];
  for (const r of c.classificados) {
    const fi = c.fases.findIndex((f) => f.id === r.fase);
    const ef = e.fases[fi];
    if (fi < 0 || fi >= ateFase || !ef?.encerrada) continue;
    const ja = new Set(lista);
    if (r.vencedores || r.perdedores) {
      for (const p of ef.chaves?.at(-1) ?? []) {
        const perdedor = p.vencedor && p.b ? (p.vencedor === p.a ? p.b : p.a) : undefined;
        const t = r.vencedores ? p.vencedor : perdedor;
        if (t && !ja.has(t)) lista.push(t);
      }
      continue;
    }
    const grupos = (ef.grupos ?? []).map((_, g) => tabelaDoGrupo(c, e, fi, g));
    const candidatos = porCampanha(
      grupos.flatMap((t) =>
        (r.posicoes ?? []).map((p) => t[p - 1]).filter((l) => !!l),
      ) as LinhaTabela[],
    )
      .map((l) => l.clube)
      .filter((t) => !ja.has(t));
    if (r.reservados) {
      // Vagas reservadas (anfitriões): os mais bem colocados que ainda não se classificaram.
      const todos = porCampanha(grupos.flat()).map((l) => l.clube);
      const donos = todos.filter((t) => r.reservados!.includes(t) && !ja.has(t));
      const n = r.quantidade ?? donos.length;
      const escolhidos = donos.slice(0, n);
      for (const t of candidatos)
        if (escolhidos.length < n && !escolhidos.includes(t)) escolhidos.push(t);
      lista.push(...escolhidos);
      continue;
    }
    lista.push(...candidatos.slice(0, r.melhores ?? r.quantidade ?? candidatos.length));
  }
  return lista;
}

/**
 * Classificação final: a da primeira fase, reordenada por cada fase seguinte que não seja playoff
 * (quem chegou mais longe fica na frente; no mata-mata, quem caiu depois fica melhor).
 */
/** Ordem de uma fase de mata-mata pela eliminatória em que cada um caiu; o campeão fica na frente. */
function ordemDoMataMata(ef: EstadoFase, ordem: readonly string[]): string[] {
  const nivel = new Map<string, number>();
  (ef.chaves ?? []).forEach((rodada, x) =>
    rodada.forEach((p) => {
      for (const t of [p.a, p.b]) if (t) nivel.set(t, x);
      if (p.vencedor) nivel.set(p.vencedor, x + 1);
    }),
  );
  return [...nivel.keys()].sort(
    (a, b) => (nivel.get(b) ?? 0) - (nivel.get(a) ?? 0) || ordem.indexOf(a) - ordem.indexOf(b),
  );
}

export function classificacaoFinal(c: Competicao, e: EstadoCompeticao): string[] {
  const playoff = fasesDePlayoff(c);
  let ordem: string[] = [...e.participantes];
  for (let f = 0; f < c.fases.length; f++) {
    const ef = e.fases[f];
    if (!ef || (f > 0 && playoff[f])) continue;
    const fase = c.fases[f] as Fase;
    const daFase =
      fase.tipo === "mata-mata" ? ordemDoMataMata(ef, ordem) : classificacaoDosGrupos(c, e, f);
    const ficam = new Set(daFase);
    ordem = [...daFase, ...ordem.filter((t) => !ficam.has(t))];
  }
  return ordem;
}

export interface Movimento {
  clube: string;
  de: string;
  para: string;
  tipo: "acesso" | "rebaixamento";
  /** Subiu pelo playoff da própria divisão: ainda pode ter barragem contra a de cima. */
  viaPlayoff?: boolean;
}

/** Quem sobe e quem cai ao fim da temporada (acesso direto, playoff e rebaixamento). */
export function movimentosDaTemporada(c: Competicao, e: EstadoCompeticao): Movimento[] {
  if (!e.encerrada || !e.classificacao) return [];
  const lista: Movimento[] = [];
  const ano = anoFinal(e.temporada);
  for (const m of c.movimentos) {
    if ((m.desde && ano < m.desde) || (m.ate && ano > m.ate)) continue;
    if (m.tipo === "acesso" || m.tipo === "rebaixamento") {
      // Por grupo: as posições valem em cada grupo da primeira fase (o 1º de cada grupo sobe).
      const grupos = m.porGrupo ? (e.fases[0]?.grupos ?? []).map((_, g) => g) : [];
      const tabelas = m.porGrupo
        ? grupos.map((g) => tabelaDoGrupo(c, e, 0, g).map((l) => l.clube))
        : [e.classificacao];
      for (const tabela of tabelas)
        for (const p of m.posicoes) {
          const clube = tabela[p - 1];
          if (clube) lista.push({ clube, de: c.id, para: m.para, tipo: m.tipo });
        }
    } else if (m.tipo === "playoff-acesso" && e.vencedorPlayoff) {
      for (const clube of e.vencedoresPlayoff ?? [e.vencedorPlayoff])
        lista.push({ clube, de: c.id, para: m.para, tipo: "acesso", viaPlayoff: true });
    }
  }
  return lista;
}

/** Jogos de uma data (índices em `e.jogos`), sem resultado ainda. */
export function jogosDoDia(e: EstadoCompeticao, data: string): number[] {
  const idx: number[] = [];
  e.jogos.forEach((j, i) => {
    if (!j.placar && e.datas[j.rodada] === data) idx.push(i);
  });
  return idx;
}

/** Lança o placar de um jogo (sem avançar de fase). */
export function lancarResultado(
  e: EstadoCompeticao,
  indice: number,
  placar: [number, number],
  penaltis?: [number, number],
  gols: readonly { jogador: string; assistencia?: string }[] = [],
): EstadoCompeticao {
  const jogos = e.jogos.slice();
  const j = jogos[indice];
  if (!j || j.placar) return e;
  jogos[indice] = { ...j, placar, ...(penaltis ? { penaltis } : {}) };
  let artilharia = e.artilharia;
  if (gols.length) {
    artilharia = { ...artilharia };
    for (const g of gols) {
      const a = artilharia[g.jogador] ?? [0, 0];
      artilharia[g.jogador] = [a[0] + 1, a[1]];
      if (g.assistencia) {
        const b = artilharia[g.assistencia] ?? [0, 0];
        artilharia[g.assistencia] = [b[0], b[1] + 1];
      }
    }
  }
  return { ...e, jogos, artilharia };
}

/**
 * A competição com placares parciais nos jogos ainda sem resultado, para a tabela ao vivo durante
 * a rodada. Não mexe no estado guardado.
 */
export function comPlacaresParciais(
  e: EstadoCompeticao,
  parciais: readonly { indice: number; placar: [number, number] }[],
): EstadoCompeticao {
  if (!parciais.length) return e;
  const jogos = e.jogos.slice();
  for (const p of parciais) {
    const j = jogos[p.indice];
    if (j && !j.placar) jogos[p.indice] = { ...j, placar: p.placar };
  }
  return { ...e, jogos };
}

/** Nome curto: o próprio, o que está entre parênteses ("Paulistão") ou o nome inteiro. */
export function nomeCurtoDaCompeticao(c: Pick<Competicao, "nome" | "nomeCurto">): string {
  return c.nomeCurto ?? /\(([^)]+)\)/.exec(c.nome)?.[1] ?? c.nome;
}

/** Nome da fase e, no mata-mata, da eliminatória (oitavas, quartas, semifinal, final). */
export function nomeDaRodada(c: Competicao, e: EstadoCompeticao, j: JogoCompeticao): string {
  const fase = c.fases[j.fase];
  if (!fase) return "";
  if (fase.tipo !== "mata-mata") {
    const ef = e.fases[j.fase];
    const r = j.rodada - (ef?.rodadaInicial ?? 0) + 1;
    return c.fases.length > 1
      ? t("{nome}, {r}ª rodada", { nome: fase.nome, r })
      : t("{r}ª rodada", { r });
  }
  const confrontos = e.fases[j.fase]?.chaves?.[j.chave ?? 0]?.length ?? 1;
  const ultima = c.fases.length - 1 === j.fase;
  const ehFinal = (ultima && confrontos === 1) || fase.nome === "Final";
  const nome = !ultima
    ? fase.nome
    : confrontos === 1
      ? t("Final")
      : confrontos === 2
        ? t("Semifinal")
        : confrontos === 4
          ? t("Quartas de final")
          : confrontos === 8
            ? t("Oitavas de final")
            : fase.nome;
  return j.perna === 1
    ? t("{nome} (ida)", { nome })
    : fase.jogos === 2 && !(fase.finalJogoUnico && ehFinal)
      ? t("{nome} (volta)", { nome })
      : nome;
}
