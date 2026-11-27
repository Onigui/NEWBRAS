/**
 * Conversas com os jogadores e cobranças da diretoria (pedido do dono, 27/11, no estilo do PES e
 * do FIFA). O vestiário fala com o técnico e a resposta mexe na moral e no humor:
 *
 * - **Quer sair:** o jogador insatisfeito (moral abaixo de 25) pede para ser negociado.
 * - **Quer jogar:** a promessa da base que não entra em campo, ou o reserva bom esquecido, pede
 *   chances.
 * - **Cansado:** quem joga cansado reclama e pede descanso.
 *
 * Cada conversa tem até 7 dias de resposta (sem resposta, o jogador se sente ignorado). Promessas
 * são cobradas: "mais minutos" vale 2 jogos nos 5 oficiais seguintes; "vou te poupar", ficar fora
 * do time titular no jogo seguinte; "vou te negociar", seguir na lista de venda. Cumprir anima,
 * quebrar derruba a moral.
 *
 * A diretoria define as metas da temporada pela força do clube na liga (título, vaga em cima, meio
 * da tabela ou não cair) e pede caixa positivo. A confiança dela (0 a 100) sobe e desce com os
 * resultados, a posição em relação à meta e as finanças. Abaixo de 40 ela cobra; abaixo de 25, dá
 * um ultimato; no fim da liga, avalia a meta. A demissão vem com a carreira, na Fase 15.
 */
import { marcar } from "@newbras/textos";
import type { ResultadoPartida } from "../partida/tipos";
import type { Carreira, Compromisso, EstadoJogador, Mundo, Noticia } from "./carreira";
import { estadoDe } from "./carreira";
import { diasEntre, somarDias } from "./datas";
import { tabelaDoGrupo } from "../competicoes/competicao";
import { moralDe } from "../elenco/vida";
import { idadeEm } from "../evolucao";
import { Rng } from "../rng";

export type TipoConversa =
  "quer-sair" | "quer-jogar" | "cansado" | "diretoria-cobra" | "diretoria-ultimato";

export type OpcaoConversa =
  | "negociar"
  | "fica"
  | "prometer-minutos"
  | "esperar"
  | "emprestar"
  | "poupar"
  | "precisa-jogar"
  | "entendido";

export interface Conversa {
  id: string;
  tipo: TipoConversa;
  jogador?: string;
  data: string;
  /** Sem resposta até aqui, o jogador se sente ignorado. */
  prazo: string;
  params?: Readonly<Record<string, string | number>>;
}

export interface Promessa {
  jogador: string;
  tipo: "minutos" | "poupar" | "negociar";
  feita: string;
  /** Jogos oficiais desde a promessa e em quantos ele jogou. */
  jogos: number;
  jogou: number;
}

export interface Metas {
  /** Temporada da liga a que as metas se referem. */
  temporada: string;
  competicao: string;
  /** Terminar até esta posição. */
  posicao: number;
  /** Rótulo da meta, para o texto. */
  tipo: "titulo" | "vaga" | "meio" | "nao-cair";
  /** Já avaliada no fim da liga. */
  avaliada?: boolean;
}

export interface Diretoria {
  confianca: number;
  metas?: Metas;
  /** Última cobrança e último ultimato (para não repetir todo dia). */
  cobranca?: string;
  ultimato?: string;
  elogio?: string;
}

/** Opções de resposta de cada tipo de conversa. */
export const OPCOES: Readonly<Record<TipoConversa, readonly OpcaoConversa[]>> = {
  "quer-sair": ["negociar", "fica"],
  "quer-jogar": ["prometer-minutos", "esperar", "emprestar"],
  cansado: ["poupar", "precisa-jogar"],
  "diretoria-cobra": ["entendido"],
  "diretoria-ultimato": ["entendido"],
};

const DIAS_PARA_RESPONDER = 7;
/** O mesmo jogador só volta a procurar o técnico depois de tantos dias. */
const DIAS_ENTRE_CONVERSAS = 40;
const MAX_PENDENTES = 3;
const CONFIANCA_INICIAL = 60;

const limitar = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
const nome = (mundo: Mundo, id?: string) => (id ? (mundo.jogador(id)?.nome ?? id) : "");
const noticia = (data: string, m: ReturnType<typeof marcar>): Noticia => ({
  data,
  tipo: "elenco",
  ...m,
});

export const diretoriaDe = (c: Carreira): Diretoria =>
  c.diretoria ?? { confianca: CONFIANCA_INICIAL };

/** Faixa da confiança da diretoria, para o texto. */
export function faixaDaConfianca(
  v: number,
): "prestigiado" | "estavel" | "pressionado" | "ameacado" {
  if (v >= 75) return "prestigiado";
  if (v >= 40) return "estavel";
  if (v >= 25) return "pressionado";
  return "ameacado";
}

function mexerNoJogador(c: Carreira, id: string, moral: number, humor: -1 | 0 | 1 = 0): Carreira {
  const e = estadoDe(c, id);
  const ordem = ["pessimo", "ruim", "normal", "bom", "otimo"] as const;
  const i = ordem.indexOf(e.humor as (typeof ordem)[number]);
  const novoHumor =
    i < 0 || humor === 0 ? e.humor : (ordem[Math.max(0, Math.min(4, i + humor))] ?? e.humor);
  const novo: EstadoJogador = { ...e, moral: limitar(moralDe(e) + moral), humor: novoHumor };
  return { ...c, jogadores: { ...c.jogadores, [id]: novo } };
}

function comNoticias(c: Carreira, ns: Noticia[]): Carreira {
  return ns.length ? { ...c, noticias: [...ns, ...c.noticias].slice(0, 200) } : c;
}

/** Responde uma conversa: a resposta mexe na moral e no humor e pode virar promessa. */
export function responderConversa(
  c: Carreira,
  mundo: Mundo,
  id: string,
  opcao: OpcaoConversa,
): Carreira {
  const conv = (c.conversas ?? []).find((x) => x.id === id);
  if (!conv || !OPCOES[conv.tipo].includes(opcao)) return c;
  let r: Carreira = { ...c, conversas: (c.conversas ?? []).filter((x) => x !== conv) };
  const j = conv.jogador;
  const promessa = (tipo: Promessa["tipo"]) =>
    j
      ? [
          ...(r.promessas ?? []).filter((p) => p.jogador !== j),
          { jogador: j, tipo, feita: c.data, jogos: 0, jogou: 0 },
        ]
      : (r.promessas ?? []);
  const ns: Noticia[] = [];
  switch (opcao) {
    case "negociar":
      if (!j) break;
      r = mexerNoJogador(r, j, 10, 1);
      r = {
        ...r,
        aVenda: [...(r.aVenda ?? []).filter((x) => x !== j), j],
        promessas: promessa("negociar"),
      };
      ns.push(
        noticia(
          c.data,
          marcar("{jogador} foi posto à venda, como pediu.", { jogador: nome(mundo, j) }),
        ),
      );
      break;
    case "fica":
      if (j) r = mexerNoJogador(r, j, -10, -1);
      break;
    case "prometer-minutos":
      if (!j) break;
      r = mexerNoJogador(r, j, 8, 1);
      r = { ...r, promessas: promessa("minutos") };
      break;
    case "esperar":
      if (j) r = mexerNoJogador(r, j, -8);
      break;
    case "emprestar":
      if (!j) break;
      r = mexerNoJogador(r, j, 4);
      r = { ...r, aEmprestimo: [...(r.aEmprestimo ?? []).filter((x) => x !== j), j] };
      ns.push(
        noticia(
          c.data,
          marcar("{jogador} foi oferecido por empréstimo para ganhar minutos.", {
            jogador: nome(mundo, j),
          }),
        ),
      );
      break;
    case "poupar":
      if (!j) break;
      r = mexerNoJogador(r, j, 4);
      r = { ...r, promessas: promessa("poupar") };
      break;
    case "precisa-jogar":
      if (j) r = mexerNoJogador(r, j, -6);
      break;
    case "entendido":
      break;
  }
  return comNoticias(r, ns);
}

/** Resposta padrão quando o técnico deixa a conversa passar do prazo. */
function ignorar(c: Carreira, mundo: Mundo, conv: Conversa, data: string): Carreira {
  if (!conv.jogador) return c;
  const r = mexerNoJogador(c, conv.jogador, -10, -1);
  return comNoticias(r, [
    noticia(
      data,
      marcar("{jogador} esperou uma resposta que não veio e se sentiu ignorado.", {
        jogador: nome(mundo, conv.jogador),
      }),
    ),
  ]);
}

/** A liga do técnico na temporada atual (estado e definição). */
function ligaDoTecnico(c: Carreira, mundo: Mundo) {
  for (const e of Object.values(c.competicoes.competicoes)) {
    const comp = mundo.competicao(e.id);
    if (comp?.tipo === "liga" && e.participantes.includes(c.clube)) return { comp, e };
  }
  return undefined;
}

/** Posição atual (1 = primeiro) do técnico na liga, e quantos jogos fez. */
function posicaoNaLiga(c: Carreira, mundo: Mundo): { posicao: number; jogos: number } | undefined {
  const liga = ligaDoTecnico(c, mundo);
  if (!liga) return undefined;
  const fase = liga.e.fases[0];
  for (let g = 0; g < (fase?.grupos?.length ?? 0); g++) {
    const tabela = tabelaDoGrupo(liga.comp, liga.e, 0, g);
    const i = tabela.findIndex((l) => l.clube === c.clube);
    if (i >= 0) return { posicao: i + 1, jogos: tabela[i]?.jogos ?? 0 };
  }
  return undefined;
}

/** Metas pela força do clube entre os participantes da liga. */
function definirMetas(c: Carreira, mundo: Mundo): Metas | undefined {
  const liga = ligaDoTecnico(c, mundo);
  if (!liga || liga.e.encerrada) return undefined;
  const niveis = liga.e.participantes
    .map((id) => ({ id, nivel: mundo.clube(id)?.nivel ?? 0 }))
    .sort((a, b) => b.nivel - a.nivel);
  const n = niveis.length;
  const ranking = niveis.findIndex((x) => x.id === c.clube) + 1;
  const [tipo, posicao]: [Metas["tipo"], number] =
    ranking <= 2
      ? ["titulo", 2]
      : ranking <= Math.ceil(n / 4)
        ? ["vaga", Math.ceil(n / 4)]
        : ranking <= Math.ceil((n * 2) / 3)
          ? ["meio", Math.ceil(n / 2) + 1]
          : ["nao-cair", n - 4];
  return { temporada: liga.e.temporada, competicao: liga.comp.id, posicao, tipo };
}

function noticiaDaMeta(m: Metas, liga: string, data: string): Noticia {
  const p = { liga, n: m.posicao };
  return {
    data,
    tipo: "carreira",
    ...(m.tipo === "titulo"
      ? marcar(
          "Metas da diretoria para a temporada ({liga}): brigar pelo título, terminando entre os {n} primeiros, e fechar as contas no azul.",
          p,
        )
      : m.tipo === "vaga"
        ? marcar(
            "Metas da diretoria para a temporada ({liga}): terminar entre os {n} primeiros e fechar as contas no azul.",
            p,
          )
        : m.tipo === "meio"
          ? marcar(
              "Metas da diretoria para a temporada ({liga}): uma campanha tranquila, até o {n}º lugar, e fechar as contas no azul.",
              p,
            )
          : marcar(
              "Metas da diretoria para a temporada ({liga}): não cair, terminando até o {n}º lugar, e fechar as contas no azul.",
              p,
            )),
  };
}

/**
 * Depois de cada jogo do técnico: as promessas contam o jogo, a diretoria reage ao resultado e os
 * jogadores podem procurar o técnico (no máximo uma conversa nova por jogo).
 */
export function conversasDepoisDoJogo(
  antes: Carreira,
  c: Carreira,
  mundo: Mundo,
  x: Compromisso,
  r: ResultadoPartida,
): { carreira: Carreira; nova: boolean } {
  const nosso = x.mando === "casa" ? "casa" : "fora";
  const jogaram = new Map(
    r.jogadores.filter((e) => e.time === nosso && e.minutos > 0).map((e) => [e.id, e]),
  );
  const ns: Noticia[] = [];
  let out = c;

  // Promessas: só os jogos oficiais contam.
  if (x.tipo === "oficial" && out.promessas?.length) {
    const ficam: Promessa[] = [];
    for (const p of out.promessas) {
      if (p.tipo === "negociar") {
        ficam.push(p);
        continue;
      }
      const e = jogaram.get(p.jogador);
      const q = { ...p, jogos: p.jogos + 1, jogou: p.jogou + (e ? 1 : 0) };
      if (p.tipo === "poupar") {
        const cumpriu = !e || e.minutos < 45;
        out = mexerNoJogador(out, p.jogador, cumpriu ? 4 : -12, cumpriu ? 1 : -1);
        ns.push(
          noticia(
            x.data,
            cumpriu
              ? marcar("{jogador} agradece o descanso prometido.", {
                  jogador: nome(mundo, p.jogador),
                })
              : marcar("{jogador} jogou de novo cansado e reclama da promessa de descanso.", {
                  jogador: nome(mundo, p.jogador),
                }),
          ),
        );
        continue;
      }
      if (q.jogou >= 2) {
        out = mexerNoJogador(out, p.jogador, 10, 1);
        ns.push(
          noticia(
            x.data,
            marcar("{jogador} está feliz: a promessa de mais minutos foi cumprida.", {
              jogador: nome(mundo, p.jogador),
            }),
          ),
        );
        continue;
      }
      if (q.jogos >= 5) {
        out = mexerNoJogador(out, p.jogador, -20, -1);
        ns.push(
          noticia(
            x.data,
            marcar("{jogador} se sente enganado: a promessa de mais minutos não foi cumprida.", {
              jogador: nome(mundo, p.jogador),
            }),
          ),
        );
        continue;
      }
      ficam.push(q);
    }
    out = { ...out, promessas: ficam };
  }

  // Diretoria: cada resultado oficial mexe na confiança (pesando a força do adversário).
  if (x.tipo === "oficial" && x.resultado === undefined) {
    const [gc, gf] = r.placar;
    const pro = nosso === "casa" ? gc : gf;
    const contra = nosso === "casa" ? gf : gc;
    const nivel = mundo.clube(antes.clube)?.nivel ?? 0;
    const adv = mundo.clube(x.adversario)?.nivel ?? nivel;
    let delta = pro > contra ? 2 : pro < contra ? -2.5 : 0;
    if (pro > contra && adv >= nivel + 5) delta += 2;
    if (pro < contra && adv <= nivel - 5) delta -= 2;
    const d = diretoriaDe(out);
    out = { ...out, diretoria: { ...d, confianca: limitar(d.confianca + delta) } };
  }

  // O vestiário: no máximo uma conversa nova por jogo e 3 pendentes.
  let nova = false;
  const pendentes = out.conversas ?? [];
  if (pendentes.length < MAX_PENDENTES) {
    const rng = new Rng(`${c.semente}:conversa:${x.id}`);
    const recentes = out.conversasRecentes ?? {};
    const livre = (id: string) =>
      !pendentes.some((p) => p.jogador === id) &&
      (!recentes[id] || diasEntre(recentes[id], x.data) >= DIAS_ENTRE_CONVERSAS) &&
      !(out.promessas ?? []).some((p) => p.jogador === id);
    const elenco = [...mundo.elenco(c.clube)].sort((a, b) => b.forca - a.forca);
    const titularMedio =
      elenco.slice(0, 11).reduce((s, j) => s + j.forca, 0) /
      Math.max(1, Math.min(11, elenco.length));
    const candidatos: { id: string; tipo: TipoConversa; peso: number }[] = [];
    for (const j of elenco) {
      if (!livre(j.id)) continue;
      const e = estadoDe(out, j.id);
      const moral = moralDe(e);
      const jogou = jogaram.get(j.id);
      if (moral < 25 && !(out.aVenda ?? []).includes(j.id))
        candidatos.push({ id: j.id, tipo: "quer-sair", peso: 0.3 });
      const promessa =
        idadeEm(j.nascimento, x.data) <= 22 && j.potencial >= j.forca + 6 && e.semJogar >= 4;
      const esquecido = j.forca >= titularMedio - 3 && e.semJogar >= 6;
      if (promessa || esquecido) candidatos.push({ id: j.id, tipo: "quer-jogar", peso: 0.4 });
      const condicaoAntes = estadoDe(antes, j.id).condicao;
      if (jogou && jogou.minutos >= 60 && condicaoAntes < 70)
        candidatos.push({ id: j.id, tipo: "cansado", peso: 0.35 });
    }
    for (const k of candidatos) {
      if (!rng.chance(k.peso)) continue;
      const conv: Conversa = {
        id: `${k.tipo}:${k.id}:${x.data}`,
        tipo: k.tipo,
        jogador: k.id,
        data: x.data,
        prazo: somarDias(x.data, DIAS_PARA_RESPONDER),
        ...(k.tipo === "quer-jogar"
          ? { params: { jogos: estadoDe(out, k.id).semJogar } }
          : k.tipo === "cansado"
            ? { params: { condicao: Math.round(estadoDe(antes, k.id).condicao) } }
            : {}),
      };
      out = {
        ...out,
        conversas: [...pendentes, conv],
        conversasRecentes: { ...recentes, [k.id]: x.data },
      };
      nova = true;
      break;
    }
  }
  return { carreira: comNoticias(out, ns), nova };
}

/**
 * O dia da diretoria e das conversas: metas no começo da liga, prazos vencidos, a promessa de
 * venda, a avaliação mensal (posição e finanças), cobrança, ultimato e o fim da liga.
 */
export function diaDaDiretoria(
  c: Carreira,
  mundo: Mundo,
  data: string,
): { carreira: Carreira; noticias: Noticia[]; decisao: boolean } {
  let r = c;
  const noticias: Noticia[] = [];
  let decisao = false;

  // Conversas sem resposta no prazo.
  const vencidas = (r.conversas ?? []).filter((x) => x.prazo < data);
  if (vencidas.length) {
    r = { ...r, conversas: (r.conversas ?? []).filter((x) => x.prazo >= data) };
    for (const v of vencidas) r = ignorar(r, mundo, v, data);
  }

  // Promessa de negociar: tirar da lista de venda quebra a promessa.
  for (const p of r.promessas ?? []) {
    if (p.tipo !== "negociar") continue;
    const noElenco = mundo.elenco(r.clube).some((j) => j.id === p.jogador);
    if (!noElenco) {
      r = { ...r, promessas: (r.promessas ?? []).filter((x) => x !== p) };
      continue;
    }
    if (!(r.aVenda ?? []).includes(p.jogador)) {
      r = mexerNoJogador(r, p.jogador, -15, -1);
      r = { ...r, promessas: (r.promessas ?? []).filter((x) => x !== p) };
      noticias.push(
        noticia(
          data,
          marcar("{jogador} saiu da lista de venda e se sente traído.", {
            jogador: nome(mundo, p.jogador),
          }),
        ),
      );
    }
  }

  let d = diretoriaDe(r);
  const liga = ligaDoTecnico(r, mundo);
  // Metas da temporada, quando a liga começa.
  if (liga && !liga.e.encerrada && d.metas?.temporada !== liga.e.temporada) {
    const metas = definirMetas(r, mundo);
    if (metas) {
      d = { ...d, metas };
      noticias.push(noticiaDaMeta(metas, liga.comp.nome, data));
    }
  }
  // Fim da liga: avaliação da meta.
  if (
    liga &&
    liga.e.encerrada &&
    d.metas &&
    !d.metas.avaliada &&
    d.metas.temporada === liga.e.temporada
  ) {
    const final = liga.e.classificacao?.indexOf(r.clube);
    const posicao =
      final !== undefined && final >= 0 ? final + 1 : posicaoNaLiga(r, mundo)?.posicao;
    if (posicao) {
      const meta = d.metas.posicao;
      const cumpriu = posicao <= meta;
      d = {
        ...d,
        confianca: limitar(d.confianca + (cumpriu ? 15 : -20)),
        metas: { ...d.metas, avaliada: true },
      };
      noticias.push({
        data,
        tipo: "carreira",
        ...(cumpriu
          ? marcar(
              "Meta cumprida: o clube terminou a liga em {posicao}º. A diretoria está satisfeita.",
              {
                posicao,
              },
            )
          : marcar(
              "Meta não cumprida: o clube terminou a liga em {posicao}º (a meta era até o {meta}º). A diretoria está insatisfeita.",
              {
                posicao,
                meta,
              },
            )),
      });
    }
  }

  // Avaliação mensal: posição em relação à meta e as finanças.
  if (data.endsWith("-01")) {
    let delta = 0;
    const p = posicaoNaLiga(r, mundo);
    if (p && d.metas && !d.metas.avaliada && p.jogos >= 8) {
      if (p.posicao <= d.metas.posicao) delta += 3;
      else if (p.posicao > d.metas.posicao + 3) delta -= 4;
    }
    if ((r.caixa ?? 0) < 0) delta -= 3;
    if ((r.crise?.mesesAtrasados ?? 0) > 0) delta -= 5;
    if (delta) d = { ...d, confianca: limitar(d.confianca + delta) };
  }

  // Cobrança, ultimato e elogio (cada um no máximo uma vez a cada 30 dias).
  const passou = (x?: string) => !x || diasEntre(x, data) >= 30;
  const p = posicaoNaLiga(r, mundo);
  if (d.confianca < 25 && passou(d.ultimato)) {
    d = { ...d, ultimato: data };
    r = adicionarConversa(r, {
      id: `diretoria-ultimato:${data}`,
      tipo: "diretoria-ultimato",
      data,
      prazo: somarDias(data, DIAS_PARA_RESPONDER),
      params: { confianca: d.confianca },
    });
    decisao = true;
  } else if (d.confianca < 40 && passou(d.cobranca)) {
    d = { ...d, cobranca: data };
    r = adicionarConversa(r, {
      id: `diretoria-cobra:${data}`,
      tipo: "diretoria-cobra",
      data,
      prazo: somarDias(data, DIAS_PARA_RESPONDER),
      params: {
        confianca: d.confianca,
        posicao: p?.posicao ?? 0,
        meta: d.metas?.posicao ?? 0,
      },
    });
    decisao = true;
  } else if (
    d.confianca >= 80 &&
    passou(d.elogio) &&
    (!d.elogio || diasEntre(d.elogio, data) >= 120)
  ) {
    d = { ...d, elogio: data };
    noticias.push({
      data,
      tipo: "carreira",
      ...marcar("A diretoria elogia o trabalho do técnico: confiança em alta.", {}),
    });
  }
  if (d !== diretoriaDe(c) || c.diretoria === undefined) r = { ...r, diretoria: d };
  if (noticias.length) r = comNoticias(r, noticias);
  return { carreira: r, noticias, decisao };
}

function adicionarConversa(c: Carreira, conv: Conversa): Carreira {
  return { ...c, conversas: [...(c.conversas ?? []), conv] };
}

/** Promessa em andamento do jogador, se houver. */
export const promessaDe = (c: Carreira, id: string): Promessa | undefined =>
  (c.promessas ?? []).find((p) => p.jogador === id);

/** Posição atual na liga (para a tela da diretoria). */
export const posicaoAtualNaLiga = posicaoNaLiga;
