/**
 * Uma competição numa temporada: monta os grupos e o mata-mata a partir da descrição em dados,
 * marca as datas, lança os resultados, avança de fase e diz quem foi campeão, quem sobe e quem cai.
 */
import type { Competicao, DataFifa, Fase } from "@newbras/data";
import { Rng } from "../rng";
import { somarDias } from "../carreira/datas";
import { datasDaCompeticao, datasDasRodadas, rodadasDoGrupo, todosContraTodos } from "./rodadas";
import { ordenarTabela, type Criterio, type LinhaTabela } from "./tabela";

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
  classificacao?: string[];
  /** Gols e assistências de cada jogador na competição. */
  artilharia: Record<string, [number, number]>;
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
    const e =
      vindos + (i === 0 ? 0 : f.entramAqui.reduce((s, v) => s + (v.posicoes?.length ?? 1), 0));
    entram.push(e);
    const ultima = i === c.fases.length - 1;
    if (f.tipo === "mata-mata") {
      const k = ultima ? Math.max(1, Math.ceil(Math.log2(Math.max(2, e)))) : 1;
      eliminatorias.push(k);
      let r = 0;
      for (let x = 0; x < k; x++) r += pernas(f, x, k);
      rodadas.push(r);
      saem.push(ultima ? 1 : Math.ceil(e / 2));
    } else {
      const grupos = f.tipo === "grupos" ? f.grupos : 1;
      const turnos = f.tipo === "grupos" ? f.turnos : 1;
      const tamanho = Math.ceil(e / grupos);
      eliminatorias.push(0);
      rodadas.push(f.tipo === "fase-de-liga" ? f.jogosPorTime : rodadasDoGrupo(tamanho, turnos));
      const q =
        f.tipo === "grupos"
          ? f.faixaClassificada
            ? f.faixaClassificada.ate - f.faixaClassificada.de + 1
            : f.classificamPorGrupo * f.grupos + (f.melhores?.quantidade ?? 0)
          : f.classificamDireto + (f.playoff ? f.playoff.ate - f.playoff.de + 1 : 0);
      saem.push(q);
    }
  });
  return { entram, eliminatorias, rodadas };
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
}

/** Monta a competição da temporada: datas de todas as rodadas e a primeira fase. */
export function montarCompeticao(
  c: Competicao,
  participantes: readonly string[],
  inicioTemporada: string,
  o: OpcoesMontagem,
): EstadoCompeticao {
  const { inicio, fim } = datasDaCompeticao(c.calendario, inicioTemporada);
  const plano = planoDasFases(c, participantes.length);
  const total = plano.rodadas.reduce((s, r) => s + r, 0);
  // Estaduais e regionais no meio de semana e sábado; ligas e copas aos domingos.
  const semana =
    c.tipo === "estadual" || c.tipo === "regional" ? [3] : c.tipo === "copa" ? [3] : [0];
  const datas = datasDasRodadas(total, inicio, fim, o.datasFifa, semana, o.bloqueadas);
  const rodadasDaFase = plano.rodadas;
  const estado: EstadoCompeticao = {
    id: c.id,
    temporada: o.temporada,
    inicio,
    fim,
    participantes: [...participantes],
    datas,
    rodadasDaFase,
    fases: c.fases.map(() => null),
    jogos: [],
    encerrada: false,
    artilharia: {},
  };
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
  const grupos: string[][] = Array.from({ length: numGrupos }, () => []);
  if (divisao === "sorteio" && f === 0) {
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
  grupos.forEach((g, gi) => {
    todosContraTodos(g.length, turnos, rng).forEach((rodada, r) => {
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
  const k = ultimaFase ? Math.max(1, Math.ceil(Math.log2(Math.max(2, ef.times.length)))) : 1;
  const tamanho = 2 ** Math.ceil(Math.log2(Math.max(2, times.length)));
  let pares: Confronto[];
  if (x === 0) {
    const ordem = fase.chaveamento === "sorteio" ? rng.shuffle(times) : times;
    const sementes = ordemDaChave(tamanho).map((s) => ordem[s - 1] ?? "");
    pares = [];
    for (let i = 0; i < sementes.length; i += 2) {
      const p = sementes[i] ?? "";
      const q = sementes[i + 1] ?? "";
      const [a, b] = seed(ef.times, p, q);
      pares.push(b ? { a, b } : { a, b: "", vencedor: a });
    }
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
      const inverte = fase.mando === "sorteio" && rng.chance(0.5);
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
  const desempate = fase.prorrogacao ? "prorrogacao" : fase.penaltis ? "penaltis" : "nenhum";
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
  if (fase.tipo === "fase-de-liga") return geral.slice(0, fase.classificamDireto);
  if (fase.faixaClassificada) {
    const t = tabelaDoGrupo(c, e, f, 0);
    return t.slice(fase.faixaClassificada.de - 1, fase.faixaClassificada.ate).map((l) => l.clube);
  }
  const ef = e.fases[f] as EstadoFase;
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
    const f = e.fases.findIndex((x) => x && !x.encerrada);
    if (f < 0) break;
    const fase = c.fases[f] as Fase;
    const ef = e.fases[f] as EstadoFase;
    const rng = new Rng(`${semente}:${c.id}:${e.temporada}:avanco-${f}-${ef.chaves?.length ?? 0}`);
    let concluida: boolean;
    let classificados: string[];
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
      const k = ultimaFase ? Math.max(1, Math.ceil(Math.log2(Math.max(2, ef.times.length)))) : 1;
      if (chaves.length < k && vencedores.length > 1) {
        e = abrirRodadaEliminatoria(c, e, f, vencedores as string[], rng);
        continue;
      }
      concluida = true;
      classificados = vencedores as string[];
    } else {
      const jogos = e.jogos.filter((j) => j.fase === f);
      if (jogos.some((j) => !j.placar)) break;
      concluida = true;
      classificados = classificadosDosGrupos(c, e, f);
    }
    if (!concluida) break;
    e = {
      ...e,
      fases: e.fases.map((y, i) => (i === f ? { ...(y as EstadoFase), encerrada: true } : y)),
    };
    const proxima = c.fases[f + 1];
    if (!proxima) {
      e = encerrar(c, e);
      break;
    }
    // Quem entra direto na próxima fase pela colocação numa fase anterior desta competição.
    const extras: string[] = [];
    for (const v of proxima.entramAqui) {
      if (v.de !== c.id) continue;
      const tabela = tabelaDoGrupo(c, e, 0, 0);
      for (const p of v.posicoes ?? []) {
        const t = tabela[p - 1]?.clube;
        if (t && !classificados.includes(t)) extras.push(t);
      }
    }
    e = abrirFase(c, e, f + 1, [...extras, ...classificados], semente);
  }
  return e;
}

function encerrar(c: Competicao, e: EstadoCompeticao): EstadoCompeticao {
  const playoff = fasesDePlayoff(c);
  const classificacao = classificacaoFinal(c, e);
  const ultima = c.fases.length - 1;
  const ef = e.fases[ultima];
  const vencedorUltima = ef?.chaves?.at(-1)?.[0]?.vencedor;
  const campeao = playoff[ultima] ? classificacao[0] : (vencedorUltima ?? classificacao[0]);
  return {
    ...e,
    encerrada: true,
    classificacao,
    ...(campeao ? { campeao } : {}),
    ...(playoff[ultima] && vencedorUltima ? { vencedorPlayoff: vencedorUltima } : {}),
  };
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
}

/** Quem sobe e quem cai ao fim da temporada (acesso direto, playoff e rebaixamento). */
export function movimentosDaTemporada(c: Competicao, e: EstadoCompeticao): Movimento[] {
  if (!e.encerrada || !e.classificacao) return [];
  const lista: Movimento[] = [];
  for (const m of c.movimentos) {
    if (m.tipo === "acesso" || m.tipo === "rebaixamento") {
      for (const p of m.posicoes) {
        const clube = e.classificacao[p - 1];
        if (clube) lista.push({ clube, de: c.id, para: m.para, tipo: m.tipo });
      }
    } else if (m.tipo === "playoff-acesso" && e.vencedorPlayoff) {
      lista.push({ clube: e.vencedorPlayoff, de: c.id, para: m.para, tipo: "acesso" });
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
    return c.fases.length > 1 ? `${fase.nome}, ${r}ª rodada` : `${r}ª rodada`;
  }
  const confrontos = e.fases[j.fase]?.chaves?.[j.chave ?? 0]?.length ?? 1;
  const nome =
    c.fases.length - 1 !== j.fase
      ? fase.nome
      : confrontos === 1
        ? "Final"
        : confrontos === 2
          ? "Semifinal"
          : confrontos === 4
            ? "Quartas de final"
            : confrontos === 8
              ? "Oitavas de final"
              : fase.nome;
  return j.perna === 1
    ? `${nome} (ida)`
    : fase.jogos === 2 && !(fase.finalJogoUnico && nome === "Final")
      ? `${nome} (volta)`
      : nome;
}
