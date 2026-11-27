/**
 * Estádio (etapa 14c): ingressos por setor com preço justo e travas contra abuso, sócio-torcedor,
 * obras de ampliação com prazo, exigência de capacidade por competição, nome do estádio vendido a
 * um patrocinador e eventos.
 *
 * Travas do ingresso (pedido do dono, 27/11): cada setor tem um preço justo (pelo nível, pela
 * economia do país, pela reputação, pela fase do time e pelo peso do jogo). Acima dele, o público
 * cai rápido (elasticidade 2,2), então a renda máxima fica no preço justo. O preço sobe no máximo
 * 20% por mês, e cobrar mais de 40% acima do justo três jogos seguidos gera protesto: a moral do
 * time e a confiança da diretoria caem e sócios cancelam.
 */
import { marcar } from "@newbras/textos";
import type { Carreira, Compromisso, Mundo, Noticia } from "../carreira/carreira";
import { somarDias } from "../carreira/datas";
import { caixaDe } from "../mercado/comum";
import { Rng } from "../rng";
import { lancar, precoDoIngresso, receitaAnual } from "./financas";

export type Setor = "popular" | "central" | "camarote";
export const SETORES: readonly Setor[] = ["popular", "central", "camarote"];
/** Parte da capacidade de cada setor. */
const PARTE: Record<Setor, number> = { popular: 0.5, central: 0.38, camarote: 0.12 };
/** Preço justo de cada setor em relação ao ingresso médio. */
const PESO_DO_PRECO: Record<Setor, number> = { popular: 0.6, central: 1, camarote: 3 };
const ELASTICIDADE = 2.2;
const REAJUSTE_MAXIMO = 1.2;
const PRECO_ABUSIVO = 1.4;
const JOGOS_PARA_PROTESTO = 3;
const CAPACIDADE_MAXIMA = 100_000;

export interface ObraNoEstadio {
  lugares: number;
  custo: number;
  inicio: string;
  fim: string;
  meses: number;
  /** Quanto já foi pago. */
  pago: number;
}

export interface OfertaDeNome {
  marca: string;
  valorAnual: number;
  anos: number;
  ate: string;
}

export interface OfertaDeEvento {
  id: string;
  tipo: "show" | "festival" | "jogo-beneficente" | "aluguel";
  /** No aluguel: o clube que aluga o estádio. */
  clube?: string;
  renda: number;
  data: string;
  ate: string;
}

/** Arena nova em construção (etapa 14d). */
export interface ArenaEmObra {
  nome: string;
  capacidade: number;
  custo: number;
  inicio: string;
  fim: string;
  meses: number;
  pago: number;
  /** No lugar do estádio velho: mais barata, mas o time joga em estádio alugado durante a obra. */
  noLugar: boolean;
}

export interface EstadoDoEstadio {
  /** Nome próprio do estádio (a arena nova). */
  nome?: string;
  /** Arena moderna: enche mais e aceita ingresso mais caro. */
  moderna?: boolean;
  arena?: ArenaEmObra;
  /** Capacidade depois das obras (sem o campo, a do banco). */
  capacidade?: number;
  precos?: Record<Setor, number>;
  /** Preços no começo do mês (o reajuste vale a partir deles). */
  precosDoMes?: { mes: string; precos: Record<Setor, number> };
  socios?: number;
  mensalidade?: number;
  /** Jogos seguidos com preço abusivo. */
  abuso?: number;
  obra?: ObraNoEstadio;
  naming?: { marca: string; valorAnual: number; fim: string };
  ofertaDeNome?: OfertaDeNome;
  eventos?: OfertaDeEvento[];
  /** Eventos aceitos, para acontecer na data. */
  agendados?: OfertaDeEvento[];
}

const arredondar = (v: number, passo = 1000) => Math.round(v / passo) * passo;

export const estadioDe = (c: Carreira): EstadoDoEstadio => c.estadio ?? {};

/** Capacidade atual (com obras feitas; durante a obra, 10% fica fechado). */
export function capacidadeAtual(c: Carreira, mundo: Mundo): number {
  const e = estadioDe(c);
  const base = e.capacidade ?? mundo.clube(c.clube)?.estadio.capacidade ?? 0;
  return e.obra ? Math.round(base * 0.9) : base;
}

/** Jogando em estádio alugado por causa da arena nova construída no lugar do velho. */
export function emEstadioAlugado(c: Carreira): boolean {
  return !!estadioDe(c).arena?.noLugar;
}

/** Nome do estádio (com o patrocinador, se houver). */
export function nomeDoEstadio(c: Carreira, mundo: Mundo): string {
  const e = estadioDe(c);
  return e.naming
    ? `${e.naming.marca} Arena`
    : (e.nome ?? mundo.clube(c.clube)?.estadio.nome ?? "");
}

/** Peso do jogo no preço e no público: mata-mata e final valem mais; amistoso, menos. */
function pesoDoJogo(mundo: Mundo, c: Carreira, x?: Compromisso): number {
  if (!x) return 1;
  if (x.tipo === "amistoso") return 0.5;
  const comp = x.competicao ? mundo.competicao(x.competicao) : undefined;
  const estado = x.competicao ? c.competicoes.competicoes[x.competicao] : undefined;
  const fase = estado && comp ? estado.fases.length - 1 : 0;
  // Fase final de copa (mata-mata adiantado) enche mais e aceita ingresso mais caro.
  if (comp && comp.tipo !== "liga" && fase >= 2) return 1.3;
  if (comp?.escopo.tipo === "confederacao" || comp?.escopo.tipo === "mundial") return 1.2;
  return 1;
}

/** Preço justo de cada setor: o que a torcida aceita pagar agora. */
export function precosJustos(c: Carreira, mundo: Mundo, x?: Compromisso): Record<Setor, number> {
  const medio = precoDoIngresso(mundo, c.clube) * (estadioDe(c).moderna ? 1.15 : 1);
  const fase = 0.85 + 0.3 * ((c.moral ?? 50) / 100);
  const peso = pesoDoJogo(mundo, c, x);
  return Object.fromEntries(
    SETORES.map((s) => [s, Math.max(1, Math.round(medio * PESO_DO_PRECO[s] * fase * peso))]),
  ) as Record<Setor, number>;
}

/** Preços em vigor (sem escolha do técnico, os justos de um jogo comum). */
export function precosAtuais(c: Carreira, mundo: Mundo): Record<Setor, number> {
  return estadioDe(c).precos ?? precosJustos(c, mundo);
}

/**
 * Muda os preços: baixar é livre; subir, no máximo 20% sobre o preço do começo do mês.
 * Devolve os preços aplicados (já limitados).
 */
export function definirPrecos(
  c: Carreira,
  mundo: Mundo,
  pedidos: Partial<Record<Setor, number>>,
): Carreira {
  const e = estadioDe(c);
  const mes = c.data.slice(0, 7);
  const doMes = e.precosDoMes?.mes === mes ? e.precosDoMes.precos : precosAtuais(c, mundo);
  const precos = { ...precosAtuais(c, mundo) };
  for (const s of SETORES) {
    const v = pedidos[s];
    if (v === undefined || !Number.isFinite(v)) continue;
    precos[s] = Math.max(1, Math.min(Math.round(v), Math.floor(doMes[s] * REAJUSTE_MAXIMO)));
  }
  return { ...c, estadio: { ...e, precos, precosDoMes: { mes, precos: doMes } } };
}

/** Teto de preço de cada setor neste mês (20% sobre o começo do mês). */
export function tetoDosPrecos(c: Carreira, mundo: Mundo): Record<Setor, number> {
  const e = estadioDe(c);
  const doMes =
    e.precosDoMes?.mes === c.data.slice(0, 7) ? e.precosDoMes.precos : precosAtuais(c, mundo);
  return Object.fromEntries(
    SETORES.map((s) => [s, Math.floor(doMes[s] * REAJUSTE_MAXIMO)]),
  ) as Record<Setor, number>;
}

/** Ocupação de base (reputação e moral) do estádio, antes do preço. */
function ocupacaoBase(c: Carreira, mundo: Mundo, peso: number): number {
  const clube = mundo.clube(c.clube);
  const base =
    0.225 +
    0.125 * (clube?.reputacao ?? 3) +
    ((c.moral ?? 50) - 50) / 250 +
    (estadioDe(c).moderna ? 0.05 : 0);
  const comPeso = peso >= 1 ? base + (peso - 1) * 0.5 : base * peso;
  return Math.min(1, Math.max(0.1, comPeso));
}

export interface PublicoDoJogo {
  porSetor: Record<Setor, { publico: number; renda: number }>;
  socios: number;
  publico: number;
  renda: number;
  /** Preço médio pago sobre o justo (1 = justo). */
  indice: number;
  /** Jogo em estádio alugado por falta de capacidade exigida. */
  alugado: boolean;
}

/** Capacidade mínima exigida pela competição (continental 20 mil, mundial 30 mil). */
export function capacidadeExigida(mundo: Mundo, x?: Compromisso): number {
  const comp = x?.competicao ? mundo.competicao(x.competicao) : undefined;
  if (comp?.escopo.tipo === "mundial") return 30_000;
  if (comp?.escopo.tipo === "confederacao") return 20_000;
  return 0;
}

/**
 * Público e renda de um jogo em casa com os preços escolhidos. Os sócios entram de graça
 * (70% vão ao jogo) e ocupam lugares do popular e do central.
 */
export function publicoDoJogo(
  c: Carreira,
  mundo: Mundo,
  x?: Compromisso,
  precos = precosAtuais(c, mundo),
): PublicoDoJogo {
  const exigida = capacidadeExigida(mundo, x);
  let capacidade = capacidadeAtual(c, mundo);
  const alugado = emEstadioAlugado(c) || (exigida > 0 && capacidade < exigida);
  if (alugado) capacidade = Math.max(exigida, capacidade);
  const peso = pesoDoJogo(mundo, c, x);
  const justos = precosJustos(c, mundo, x);
  const ocupacao = ocupacaoBase(c, mundo, peso);
  const e = estadioDe(c);
  const socios = e.socios ?? sociosEsperados(c, mundo, e.mensalidade ?? mensalidadeJusta(c, mundo));
  const presentes = Math.min(
    Math.round(socios * 0.7 * (x?.tipo === "amistoso" ? 0.4 : 1)),
    Math.round(capacidade * 0.6),
  );
  let publico = presentes;
  let renda = 0;
  let pesoIndice = 0;
  let somaIndice = 0;
  const porSetor = {} as PublicoDoJogo["porSetor"];
  for (const s of SETORES) {
    const lugares = Math.round(capacidade * PARTE[s]);
    const doSocio = s === "camarote" ? 0 : Math.round(presentes * (PARTE[s] / 0.88));
    const livres = Math.max(0, lugares - doSocio);
    const r = precos[s] / Math.max(1, justos[s]);
    const fator = r <= 1 ? 1 + (1 - r) * 0.6 : r ** -ELASTICIDADE;
    const p = Math.min(livres, Math.round(livres * ocupacao * fator));
    const rendaSetor = arredondar(p * precos[s] * (alugado ? 0.6 : 1), 100);
    porSetor[s] = { publico: p, renda: rendaSetor };
    publico += p;
    renda += rendaSetor;
    somaIndice += r * lugares;
    pesoIndice += lugares;
  }
  return {
    porSetor,
    socios: presentes,
    publico,
    renda,
    indice: pesoIndice ? somaIndice / pesoIndice : 1,
    alugado,
  };
}

/** Bilheteria do jogo em casa, com o protesto pelo preço abusivo. */
export function bilheteriaDoJogo(
  c: Carreira,
  mundo: Mundo,
  x: Compromisso,
): { carreira: Carreira; noticias: Noticia[] } {
  if (x.mando !== "casa" || x.neutro) return { carreira: c, noticias: [] };
  const p = publicoDoJogo(c, mundo, x);
  let r = lancar(c, mundo, x.data, { bilheteria: p.renda }, p.publico);
  const noticias: Noticia[] = [];
  if (p.alugado)
    noticias.push({
      data: x.data,
      tipo: "carreira",
      ...marcar(
        "O jogo foi num estádio alugado (obra da arena ou capacidade abaixo da exigida pela competição): a renda caiu 40%.",
      ),
    });
  if (x.tipo === "oficial") {
    const e = estadioDe(r);
    const abuso = p.indice > PRECO_ABUSIVO ? (e.abuso ?? 0) + 1 : Math.max(0, (e.abuso ?? 0) - 1);
    r = { ...r, estadio: { ...e, abuso } };
    if (abuso >= JOGOS_PARA_PROTESTO) {
      const socios = Math.round((e.socios ?? 0) * 0.95);
      const d = r.diretoria;
      r = {
        ...r,
        moral: Math.max(0, (r.moral ?? 50) - 2),
        estadio: { ...estadioDe(r), socios },
        ...(d ? { diretoria: { ...d, confianca: Math.max(0, d.confianca - 2) } } : {}),
      };
      noticias.push({
        data: x.data,
        tipo: "carreira",
        ...marcar(
          "Protesto da torcida contra o preço dos ingressos: estádio vazio, sócios cancelando e a diretoria incomodada.",
        ),
      });
    }
  }
  return { carreira: r, noticias };
}

// ------------------------------------------------------------------------- Sócio-torcedor

/** Mensalidade justa do sócio: duas entradas no popular por mês. */
export function mensalidadeJusta(c: Carreira, mundo: Mundo): number {
  return Math.max(1, Math.round(precosJustos(c, mundo).popular * 2));
}

/** Quantos sócios o clube teria com a mensalidade dada (pela reputação, moral e preço). */
export function sociosEsperados(c: Carreira, mundo: Mundo, mensalidade: number): number {
  const clube = mundo.clube(c.clube);
  const capacidade = capacidadeAtual(c, mundo);
  const base = capacidade * (0.04 + 0.04 * (clube?.reputacao ?? 3));
  const humor = 0.7 + 0.6 * ((c.moral ?? 50) / 100);
  const r = mensalidade / Math.max(1, mensalidadeJusta(c, mundo));
  const fator = r <= 1 ? 1 + (1 - r) * 0.5 : r ** -ELASTICIDADE;
  return Math.round(base * humor * fator);
}

export function definirMensalidade(c: Carreira, mundo: Mundo, valor: number): Carreira {
  const e = estadioDe(c);
  const atual = e.mensalidade ?? mensalidadeJusta(c, mundo);
  const mensalidade = Math.max(1, Math.min(Math.round(valor), Math.floor(atual * REAJUSTE_MAXIMO)));
  return { ...c, estadio: { ...e, mensalidade } };
}

// ----------------------------------------------------------------------------------- Obras

export const AMPLIACOES = [5_000, 10_000, 20_000] as const;

/** Custo e prazo de uma ampliação (o lugar custa mais nos países ricos). */
export function orcamentoDaObra(
  mundo: Mundo,
  clube: string,
  lugares: number,
): { custo: number; meses: number } {
  const fator = Math.sqrt(
    receitaAnual(mundo, clube) > 0 ? Math.max(0.4, precoDoIngresso(mundo, clube) / 35) : 1,
  );
  return {
    custo: arredondar(lugares * 4_000 * fator, 100_000),
    meses: 4 + Math.ceil(lugares / 2500),
  };
}

/** Começa a obra: 30% de entrada, o resto em parcelas mensais até o fim. */
export function iniciarObra(
  c: Carreira,
  mundo: Mundo,
  lugares: number,
): { carreira: Carreira; resultado: "ok" | "em-obra" | "caixa" | "limite" | "invalido" } {
  const e = estadioDe(c);
  if (!(AMPLIACOES as readonly number[]).includes(lugares))
    return { carreira: c, resultado: "invalido" };
  if (e.obra) return { carreira: c, resultado: "em-obra" };
  const base = e.capacidade ?? mundo.clube(c.clube)?.estadio.capacidade ?? 0;
  if (base + lugares > CAPACIDADE_MAXIMA) return { carreira: c, resultado: "limite" };
  const { custo, meses } = orcamentoDaObra(mundo, c.clube, lugares);
  const entrada = arredondar(custo * 0.3, 100_000);
  if (caixaDe(c, mundo) < entrada) return { carreira: c, resultado: "caixa" };
  let r = lancar(c, mundo, c.data, { obras: -entrada });
  const fim = somarDias(c.data, meses * 30);
  r = {
    ...r,
    estadio: {
      ...estadioDe(r),
      obra: { lugares, custo, inicio: c.data, fim, meses, pago: entrada },
    },
    noticias: [
      {
        data: c.data,
        tipo: "carreira" as const,
        ...marcar(
          "Obra de ampliação começou: mais {lugares} lugares, {custo} no total, pronta em {fim}.",
          {
            lugares,
            custo,
            fim,
          },
        ),
      },
      ...r.noticias,
    ].slice(0, 200),
  };
  return { carreira: r, resultado: "ok" };
}

// ----------------------------------------------------------- Nome do estádio e eventos

const SILABAS = [
  "Vel",
  "Tri",
  "Nor",
  "Sol",
  "Max",
  "Cor",
  "Ban",
  "Zen",
  "Ori",
  "Lux",
  "Tec",
  "Ara",
];
const FINAIS = ["tel", "via", "net", "bank", "pay", "tech", "gás", "log", "fit", "cred"];

/** Marca fictícia de patrocinador (nunca marca real). */
function marcaFicticia(rng: Rng): string {
  return `${SILABAS[rng.int(0, SILABAS.length - 1)]}${FINAIS[rng.int(0, FINAIS.length - 1)]}`;
}

export function aceitarNome(c: Carreira): Carreira {
  const e = estadioDe(c);
  const o = e.ofertaDeNome;
  if (!o || o.ate < c.data) return c;
  const fim = `${Number(c.data.slice(0, 4)) + o.anos}${c.data.slice(4)}`;
  const { ofertaDeNome: _, ...resto } = e;
  return {
    ...c,
    estadio: { ...resto, naming: { marca: o.marca, valorAnual: o.valorAnual, fim } },
    noticias: [
      {
        data: c.data,
        tipo: "carreira" as const,
        ...marcar("O estádio agora se chama {nome}: {valor} por ano até {fim}.", {
          nome: `${o.marca} Arena`,
          valor: o.valorAnual,
          fim,
        }),
      },
      ...c.noticias,
    ].slice(0, 200),
  };
}

export function recusarNome(c: Carreira): Carreira {
  const { ofertaDeNome: _, ...resto } = estadioDe(c);
  return { ...c, estadio: resto };
}

export function responderEvento(c: Carreira, id: string, aceitar: boolean): Carreira {
  const e = estadioDe(c);
  const ev = (e.eventos ?? []).find((x) => x.id === id);
  if (!ev) return c;
  return {
    ...c,
    estadio: {
      ...e,
      eventos: (e.eventos ?? []).filter((x) => x !== ev),
      ...(aceitar ? { agendados: [...(e.agendados ?? []), ev] } : {}),
    },
  };
}

/**
 * O dia do estádio: obra (parcelas e entrega), sócios (mensalidade e adesões), nome do estádio
 * (parcela, fim do contrato e ofertas) e eventos (ofertas, prazo e o evento na data).
 */
export function diaDoEstadio(
  c: Carreira,
  mundo: Mundo,
  data: string,
): { carreira: Carreira; noticias: Noticia[] } {
  let r = c;
  let e = estadioDe(r);
  const noticias: Noticia[] = [];
  const rng = new Rng(`${c.semente}:estadio:${data}`);

  // Eventos agendados que acontecem hoje.
  const hoje = (e.agendados ?? []).filter((x) => x.data === data);
  if (hoje.length) {
    for (const ev of hoje) {
      r = lancar(r, mundo, data, { eventos: ev.renda });
      noticias.push({
        data,
        tipo: "carreira",
        ...marcar("Evento no estádio: {renda} em caixa.", { renda: ev.renda }),
      });
    }
    e = { ...estadioDe(r), agendados: (e.agendados ?? []).filter((x) => x.data !== data) };
    r = { ...r, estadio: e };
  }
  // Ofertas vencidas somem.
  if (
    (e.eventos ?? []).some((x) => x.ate < data) ||
    (e.ofertaDeNome && e.ofertaDeNome.ate < data)
  ) {
    const { ofertaDeNome, ...resto } = e;
    e = {
      ...resto,
      ...(ofertaDeNome && ofertaDeNome.ate >= data ? { ofertaDeNome } : {}),
      eventos: (e.eventos ?? []).filter((x) => x.ate >= data),
    };
    r = { ...r, estadio: e };
  }

  if (!data.endsWith("-01")) return { carreira: r, noticias };
  const receita = receitaAnual(mundo, r.clube);
  const valores: Record<string, number> = {};

  // Obra: parcela do mês e entrega.
  if (e.obra) {
    const o = e.obra;
    const parcela = Math.min(o.custo - o.pago, arredondar((o.custo * 0.7) / o.meses, 100_000));
    if (parcela > 0) valores.obras = -parcela;
    const pago = o.pago + Math.max(0, parcela);
    if (data >= o.fim) {
      const base = e.capacidade ?? mundo.clube(r.clube)?.estadio.capacidade ?? 0;
      const { obra: _, ...resto } = e;
      e = { ...resto, capacidade: base + o.lugares };
      if (o.custo - pago > 0) valores.obras = (valores.obras ?? 0) - (o.custo - pago);
      noticias.push({
        data,
        tipo: "carreira",
        ...marcar("Obra entregue: o estádio agora tem {capacidade} lugares.", {
          capacidade: base + o.lugares,
        }),
      });
    } else e = { ...e, obra: { ...o, pago } };
  }
  // Arena nova: parcela do mês (a parte sem financiamento) e entrega.
  if (e.arena) {
    const o = e.arena;
    const parcela = Math.min(
      o.custo - o.pago,
      arredondar((o.custo - o.pago) / Math.max(1, o.meses), 100_000),
    );
    let pago = o.pago;
    if (parcela > 0) {
      valores.obras = (valores.obras ?? 0) - parcela;
      pago += parcela;
    }
    if (data >= o.fim) {
      if (o.custo - pago > 0) valores.obras = (valores.obras ?? 0) - (o.custo - pago);
      const { arena: _, ...resto } = e;
      e = { ...resto, capacidade: o.capacidade, nome: o.nome, moderna: true };
      noticias.push({
        data,
        tipo: "carreira",
        ...marcar(
          "A {nome} foi inaugurada: {capacidade} lugares, arena moderna. A torcida lota e aceita pagar mais.",
          {
            nome: o.nome,
            capacidade: o.capacidade,
          },
        ),
      });
    } else e = { ...e, arena: { ...o, pago, meses: Math.max(1, o.meses - 1) } };
  }
  // Sócios: mensalidade e adesões indo ao esperado aos poucos.
  const mensalidade = e.mensalidade ?? mensalidadeJusta(r, mundo);
  const esperado = sociosEsperados(r, mundo, mensalidade);
  const socios = Math.round((e.socios ?? esperado) + (esperado - (e.socios ?? esperado)) * 0.3);
  e = { ...e, socios, mensalidade };
  if (socios > 0) valores.socios = arredondar(socios * mensalidade, 100);
  // Nome do estádio.
  if (e.naming) {
    if (data > e.naming.fim) {
      const { naming: _, ...resto } = e;
      e = resto;
      noticias.push({
        data,
        tipo: "carreira",
        ...marcar("Acabou o contrato do nome do estádio: ele volta ao nome original."),
      });
    } else valores.naming = arredondar(e.naming.valorAnual / 12, 100);
  } else if (!e.ofertaDeNome && rng.chance(0.15)) {
    const reputacao = mundo.clube(r.clube)?.reputacao ?? 3;
    e = {
      ...e,
      ofertaDeNome: {
        marca: marcaFicticia(rng),
        valorAnual: arredondar(
          receita * (0.015 + 0.007 * reputacao) * rng.float(0.8, 1.2),
          100_000,
        ),
        anos: rng.int(3, 5),
        ate: somarDias(data, 30),
      },
    };
    noticias.push({
      data,
      tipo: "carreira",
      ...marcar("Proposta pelo nome do estádio: responda na aba Finanças."),
    });
  }
  // Eventos: uma oferta de vez em quando, para daqui a 2 a 6 semanas.
  if (rng.chance(0.25) && !emEstadioAlugado(r)) {
    const tipo = rng.weighted<OfertaDeEvento["tipo"]>(
      ["show", "festival", "jogo-beneficente", "aluguel"],
      (x) => (x === "show" ? 3 : x === "festival" ? 2 : x === "aluguel" ? 2 : 1),
    );
    // Aluguel: um clube do mesmo país com estádio bem menor quer mandar um jogo grande aqui.
    const meu = mundo.clube(r.clube);
    const inquilinos =
      tipo === "aluguel"
        ? (mundo.clubes ?? []).filter(
            (x) =>
              x.id !== r.clube &&
              !x.filialDe &&
              x.pais === meu?.pais &&
              x.estadio.capacidade < capacidadeAtual(r, mundo) * 0.5,
          )
        : [];
    const inquilino = inquilinos.length ? inquilinos[rng.int(0, inquilinos.length - 1)] : undefined;
    const cheio = capacidadeAtual(r, mundo) * precoDoIngresso(mundo, r.clube);
    const fator =
      tipo === "show" ? 0.5 : tipo === "festival" ? 0.8 : tipo === "aluguel" ? 0.2 : 0.15;
    const quando = somarDias(data, rng.int(14, 42));
    if (tipo !== "aluguel" || inquilino)
      e = {
        ...e,
        eventos: [
          ...(e.eventos ?? []),
          {
            id: `evento:${data}`,
            tipo,
            ...(inquilino ? { clube: inquilino.id } : {}),
            renda: arredondar(cheio * fator * rng.float(0.7, 1.2), 10_000),
            data: quando,
            ate: somarDias(data, 10),
          },
        ],
      };
  }
  r = { ...r, estadio: e };
  if (Object.keys(valores).length) r = lancar(r, mundo, data, valores);
  return { carreira: r, noticias };
}

// ------------------------------------------------------------------------------ Arena nova

export const CAPACIDADES_DA_ARENA = [30_000, 45_000, 60_000, 80_000] as const;
export const PRAZOS_DO_FINANCIAMENTO = [60, 120] as const;
const TAXA_DO_FINANCIAMENTO = 0.006;

/**
 * Custo e prazo da arena nova: o lugar custa 1,6 vez o da ampliação; ao lado do estádio velho,
 * mais 25% (o time segue jogando em casa). De 24 a 36 meses.
 */
export function orcamentoDaArena(
  mundo: Mundo,
  clube: string,
  capacidade: number,
  noLugar: boolean,
): { custo: number; meses: number } {
  const porLugar = orcamentoDaObra(mundo, clube, 10_000).custo / 10_000;
  const custo = arredondar(capacidade * porLugar * 1.6 * (noLugar ? 1 : 1.25), 1_000_000);
  return { custo, meses: 24 + Math.round((capacidade / 80_000) * 12) };
}

/** Financiamento da arena: até 80% do custo, a 0,6% ao mês, em 60 ou 120 meses. */
export function limiteDoFinanciamento(custo: number): number {
  return arredondar(custo * 0.8, 1_000_000);
}

/**
 * Começa a arena nova. A entrada (o que não for financiado, no mínimo 20%) sai do caixa; o
 * financiamento entra como empréstimo de longo prazo e paga a obra mês a mês.
 */
export function construirArena(
  c: Carreira,
  mundo: Mundo,
  pedido: { capacidade: number; noLugar: boolean; financiar: number; meses: number; nome?: string },
): { carreira: Carreira; resultado: "ok" | "em-obra" | "caixa" | "invalido" } {
  const e = estadioDe(c);
  if (!(CAPACIDADES_DA_ARENA as readonly number[]).includes(pedido.capacidade))
    return { carreira: c, resultado: "invalido" };
  if (!(PRAZOS_DO_FINANCIAMENTO as readonly number[]).includes(pedido.meses))
    return { carreira: c, resultado: "invalido" };
  if (e.obra || e.arena) return { carreira: c, resultado: "em-obra" };
  const { custo, meses } = orcamentoDaArena(mundo, c.clube, pedido.capacidade, pedido.noLugar);
  const financiar = Math.max(
    0,
    Math.min(arredondar(pedido.financiar, 1_000_000), limiteDoFinanciamento(custo)),
  );
  // Entrada de 20% (ou menos, se quase tudo for financiado); o resto sem financiamento vai em
  // parcelas mensais até a entrega.
  const aPagarDoCaixa = Math.min(custo - financiar, arredondar(custo * 0.2, 1_000_000));
  if (caixaDe(c, mundo) < aPagarDoCaixa) return { carreira: c, resultado: "caixa" };
  const clube = mundo.clube(c.clube);
  const nome = pedido.nome?.trim() || `Arena ${clube?.nomeCurto ?? ""}`.trim();
  const fim = somarDias(c.data, meses * 30);
  // O financiamento entra e já paga a obra junto com a entrada.
  let r = lancar(c, mundo, c.data, { obras: -aPagarDoCaixa });
  if (financiar > 0) {
    const parcela = Math.round(
      (financiar * TAXA_DO_FINANCIAMENTO) / (1 - (1 + TAXA_DO_FINANCIAMENTO) ** -pedido.meses),
    );
    r = {
      ...r,
      emprestimosBancarios: [
        ...(r.emprestimosBancarios ?? []),
        {
          id: `arena:${c.data}`,
          valor: financiar,
          saldo: financiar,
          taxa: TAXA_DO_FINANCIAMENTO,
          parcela,
          meses: pedido.meses,
          restantes: pedido.meses,
          inicio: c.data,
          atrasos: 0,
        },
      ],
    };
  }
  r = {
    ...r,
    estadio: {
      ...estadioDe(r),
      arena: {
        nome,
        capacidade: pedido.capacidade,
        custo,
        inicio: c.data,
        fim,
        meses,
        // O financiado conta como pago (o banco paga a construtora).
        pago: aPagarDoCaixa + financiar,
        noLugar: pedido.noLugar,
      },
    },
    noticias: [
      {
        data: c.data,
        tipo: "carreira" as const,
        ...(pedido.noLugar
          ? marcar(
              "Começou a construção da {nome} ({capacidade} lugares, {custo}) no lugar do estádio velho: até {fim}, o time joga em estádio alugado.",
              { nome, capacidade: pedido.capacidade, custo, fim },
            )
          : marcar(
              "Começou a construção da {nome} ({capacidade} lugares, {custo}) ao lado do estádio velho: pronta em {fim}.",
              { nome, capacidade: pedido.capacidade, custo, fim },
            )),
      },
      ...r.noticias,
    ].slice(0, 200),
  };
  return { carreira: r, resultado: "ok" };
}
