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
import { agendaCompleta, estadoDe, indisponiveisNoJogo } from "./carreira";
import { lesionado } from "../elenco/lesoes";
import { diasEntre, somarDias } from "./datas";
import { tabelaDoGrupo } from "../competicoes/competicao";
import { moralDe } from "../elenco/vida";
import { idadeEm } from "../evolucao";
import { Rng } from "../rng";
import { demitir, mexerNaReputacao } from "./tecnico";
import {
  capitaoDe,
  cobrarEntrevista,
  contarForaDaPosicao,
  darAumento,
  escolherCapitao,
  jogoGrande,
  lideranca,
  mexerNaTorcida,
  naPosicao,
  pedeAumento,
  posicoesJogadas,
  prazoDaImprensa,
  resultadoDeImprensa,
  salarioDeMercado,
  torcidaDe,
  torcidaDepoisDoJogo,
} from "./vestiario";
import { contratoDe } from "../elenco/vida";
import type { PosicaoCampo } from "@newbras/data";

export type TipoConversa =
  | "quer-sair"
  | "quer-jogar"
  | "cansado"
  | "diretoria-cobra"
  | "diretoria-ultimato"
  // Etapa 15d: vestiário e imprensa.
  | "pede-aumento"
  | "posicao"
  | "quer-ser-capitao"
  | "briga"
  | "imprensa-antes"
  | "imprensa-vitoria"
  | "imprensa-derrota";

export type OpcaoConversa =
  | "negociar"
  | "fica"
  | "prometer-minutos"
  | "esperar"
  | "emprestar"
  | "poupar"
  | "precisa-jogar"
  | "entendido"
  | "dar-aumento"
  | "aumento-depois"
  | "negar-aumento"
  | "volta-posicao"
  | "time-precisa"
  | "dar-bracadeira"
  | "manter-capitao"
  | "punir-primeiro"
  | "punir-segundo"
  | "reunir"
  | "deixar-briga"
  | "confiante"
  | "cauteloso"
  | "provocador"
  | "elogiar-time"
  | "pes-no-chao"
  | "assumir-culpa"
  | "cobrar-elenco"
  | "culpar-arbitragem";

export interface Conversa {
  id: string;
  tipo: TipoConversa;
  jogador?: string;
  data: string;
  /** Sem resposta até aqui, o jogador se sente ignorado. */
  prazo: string;
  params?: Readonly<Record<string, string | number>>;
  /** O outro jogador da conversa (na briga, com quem brigou; no capitão, o capitão atual). */
  outro?: string;
  /** Entrevista: o jogo e o adversário. */
  jogo?: string;
  adversario?: string;
}

export interface Promessa {
  jogador: string;
  tipo: "minutos" | "poupar" | "negociar" | "posicao";
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
  "pede-aumento": ["dar-aumento", "aumento-depois", "negar-aumento"],
  posicao: ["volta-posicao", "time-precisa"],
  "quer-ser-capitao": ["dar-bracadeira", "manter-capitao"],
  briga: ["punir-primeiro", "punir-segundo", "reunir", "deixar-briga"],
  "imprensa-antes": ["confiante", "cauteloso", "provocador"],
  "imprensa-vitoria": ["elogiar-time", "pes-no-chao"],
  "imprensa-derrota": ["assumir-culpa", "cobrar-elenco", "culpar-arbitragem"],
};

/** Conversas da imprensa (não contam no limite das conversas dos jogadores). */
export const DA_IMPRENSA: ReadonlySet<TipoConversa> = new Set([
  "imprensa-antes",
  "imprensa-vitoria",
  "imprensa-derrota",
]);

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
    case "dar-aumento":
      if (!j) break;
      r = darAumento(r, mundo, j);
      r = mexerNoJogador(r, j, 10, 1);
      break;
    case "aumento-depois":
      if (j) r = mexerNoJogador({ ...r, aumentos: { ...r.aumentos, [j]: c.data } }, j, -4);
      break;
    case "negar-aumento":
      if (j) r = mexerNoJogador({ ...r, aumentos: { ...r.aumentos, [j]: c.data } }, j, -12, -1);
      break;
    case "volta-posicao":
      if (!j) break;
      r = mexerNoJogador(r, j, 6);
      r = { ...r, promessas: promessa("posicao"), foraDaPosicao: semContagem(r, j) };
      break;
    case "time-precisa":
      if (j) r = mexerNoJogador({ ...r, foraDaPosicao: semContagem(r, j) }, j, -6);
      break;
    case "dar-bracadeira":
      if (j) r = escolherCapitao(r, mundo, j);
      break;
    case "manter-capitao":
      if (j) r = mexerNoJogador(r, j, -6);
      break;
    case "punir-primeiro":
    case "punir-segundo": {
      const [punido, poupado] = opcao === "punir-primeiro" ? [j, conv.outro] : [conv.outro, j];
      if (punido) r = mexerNoJogador(r, punido, -10, -1);
      if (poupado) r = mexerNoJogador(r, poupado, 3);
      r = moralDoTime(r, 3);
      if (punido)
        ns.push(
          noticia(
            c.data,
            marcar("{jogador} foi punido pela briga no treino. O elenco viu pulso firme.", {
              jogador: nome(mundo, punido),
            }),
          ),
        );
      break;
    }
    case "reunir":
      if (j) r = mexerNoJogador(r, j, -2);
      if (conv.outro) r = mexerNoJogador(r, conv.outro, -2);
      r = moralDoTime(r, 1);
      break;
    case "deixar-briga":
      r = moralDoTime(r, -6);
      break;
    case "confiante":
    case "cauteloso":
    case "provocador":
      if (conv.jogo) r = { ...r, entrevista: { jogo: conv.jogo, tom: opcao } };
      r = moralDoTime(r, opcao === "confiante" ? 3 : opcao === "provocador" ? 4 : 1);
      break;
    case "elogiar-time":
      r = moralDoTime(r, 3);
      break;
    case "pes-no-chao":
      r = confiancaDaDiretoria(mexerNaTorcida(moralDoTime(r, 1), 1), 1);
      break;
    case "assumir-culpa":
      r = confiancaDaDiretoria(mexerNaTorcida(moralDoTime(r, 3), 1), -1);
      break;
    case "cobrar-elenco":
      r = confiancaDaDiretoria(mexerNaTorcida(moralDoTime(r, -4), 2), 1);
      break;
    case "culpar-arbitragem":
      r = confiancaDaDiretoria(mexerNaTorcida(moralDoTime(r, 1), 2), -2);
      break;
  }
  return comNoticias(r, ns);
}

const semContagem = (c: Carreira, id: string): Record<string, number> => {
  const fora = { ...c.foraDaPosicao };
  delete fora[id];
  return fora;
};

function moralDoTime(c: Carreira, delta: number): Carreira {
  return { ...c, moral: Math.max(0, Math.min(100, Math.round((c.moral + delta) * 10) / 10)) };
}

function confiancaDaDiretoria(c: Carreira, delta: number): Carreira {
  const d = diretoriaDe(c);
  return { ...c, diretoria: { ...d, confianca: limitar(d.confianca + delta) } };
}

/** Resposta padrão quando o técnico deixa a conversa passar do prazo. */
function ignorar(c: Carreira, mundo: Mundo, conv: Conversa, data: string): Carreira {
  if (conv.tipo === "imprensa-antes") return c;
  if (conv.tipo === "imprensa-vitoria" || conv.tipo === "imprensa-derrota")
    return comNoticias(mexerNaTorcida(c, -1), [
      noticia(
        data,
        marcar("O técnico não deu entrevista, e a torcida não gostou do silêncio.", {}),
      ),
    ]);
  if (conv.tipo === "briga") return moralDoTime(c, -6);
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
  const saldo = nosso === "casa" ? r.placar[0] - r.placar[1] : r.placar[1] - r.placar[0];
  const doClube = x.tipo === "oficial" && !x.selecao;
  // A posição em que cada titular começou (para a reclamação e a promessa de posição).
  const jogadas = doClube ? posicoesJogadas(antes, x, r) : new Map<string, PosicaoCampo>();

  // Promessas: só os jogos oficiais contam.
  if (x.tipo === "oficial" && out.promessas?.length) {
    // Quem não podia jogar (lesionado, suspenso, com a seleção) não conta o jogo na promessa.
    const fora = indisponiveisNoJogo(antes, mundo, x.competicao, x.data);
    const ficam: Promessa[] = [];
    for (const p of out.promessas) {
      if (p.tipo === "negociar" || fora.has(p.jogador)) {
        ficam.push(p);
        continue;
      }
      if (p.tipo === "posicao") {
        // Conta só os jogos em que ele começou: fora da posição, a promessa quebra.
        const pos = jogadas.get(p.jogador);
        const j = mundo.jogador(p.jogador);
        if (!pos || !j) {
          ficam.push(p);
          continue;
        }
        if (!naPosicao(j, pos)) {
          out = mexerNoJogador(out, p.jogador, -15, -1);
          ns.push(
            noticia(
              x.data,
              marcar("{jogador} jogou de novo fora da posição e diz que a promessa não valeu.", {
                jogador: j.nome,
              }),
            ),
          );
          continue;
        }
        if (p.jogou + 1 >= 2) {
          out = mexerNoJogador(out, p.jogador, 6, 1);
          ns.push(
            noticia(
              x.data,
              marcar("{jogador} voltou à posição dele, como o técnico prometeu.", {
                jogador: j.nome,
              }),
            ),
          );
          continue;
        }
        ficam.push({ ...p, jogos: p.jogos + 1, jogou: p.jogou + 1 });
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

  if (doClube) {
    // Jogos fora da posição, a torcida, a entrevista de antes do jogo e a que ficou sem resposta.
    out = contarForaDaPosicao(out, mundo, jogadas);
    out = torcidaDepoisDoJogo(out, mundo, x, saldo);
    const cobrada = cobrarEntrevista(out, mundo, x, saldo);
    out = cobrada.carreira;
    ns.push(...cobrada.noticias);
    out = {
      ...out,
      conversas: (out.conversas ?? []).filter(
        (v) => !(v.tipo === "imprensa-antes" && v.jogo === x.id),
      ),
    };
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
  const doVestiario = pendentes.filter((v) => !DA_IMPRENSA.has(v.tipo));
  if (doVestiario.length < MAX_PENDENTES) {
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
    const principais = new Set(elenco.slice(0, 13).map((j) => j.id));
    const idCapitao = capitaoDe(out, mundo);
    const capitao = idCapitao ? mundo.jogador(idCapitao) : undefined;
    for (const j of elenco) {
      if (!livre(j.id)) continue;
      const e = estadoDe(out, j.id);
      // O lesionado sabe da condição dele: não pede para jogar nem reclama de cansaço.
      const machucado = lesionado(e, x.data);
      const moral = moralDe(e);
      const jogou = jogaram.get(j.id);
      if (moral < 25 && !(out.aVenda ?? []).includes(j.id))
        candidatos.push({ id: j.id, tipo: "quer-sair", peso: 0.3 });
      const promessa =
        idadeEm(j.nascimento, x.data) <= 22 && j.potencial >= j.forca + 6 && e.semJogar >= 4;
      const esquecido = j.forca >= titularMedio - 3 && e.semJogar >= 6;
      if ((promessa || esquecido) && !machucado)
        candidatos.push({ id: j.id, tipo: "quer-jogar", peso: 0.4 });
      const condicaoAntes = estadoDe(antes, j.id).condicao;
      if (jogou && jogou.minutos >= 60 && condicaoAntes < 70 && !machucado)
        candidatos.push({ id: j.id, tipo: "cansado", peso: 0.35 });
      if (!doClube || machucado) continue;
      // Etapa 15d: aumento, posição e braçadeira.
      const titular = principais.has(j.id);
      if (moral >= 30 && pedeAumento(out, mundo, j, titular))
        candidatos.push({ id: j.id, tipo: "pede-aumento", peso: 0.25 });
      if ((out.foraDaPosicao?.[j.id] ?? 0) >= 3)
        candidatos.push({ id: j.id, tipo: "posicao", peso: 0.4 });
      if (
        capitao &&
        capitao.id !== j.id &&
        titular &&
        moral >= 50 &&
        idadeEm(j.nascimento, x.data) >= 26 &&
        lideranca(j, x.data) >= lideranca(capitao, x.data) + 12
      )
        candidatos.push({ id: j.id, tipo: "quer-ser-capitao", peso: 0.12 });
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
            : k.tipo === "pede-aumento"
              ? { params: paramsDoAumento(out, mundo, k.id) }
              : k.tipo === "posicao"
                ? {
                    params: {
                      jogos: out.foraDaPosicao?.[k.id] ?? 0,
                      posicao: jogadas.get(k.id) ?? "",
                    },
                  }
                : k.tipo === "quer-ser-capitao" && capitao
                  ? { outro: capitao.id }
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
    // Briga no vestiário: time de moral baixa ou goleada sofrida. O capitão líder evita.
    const comBriga = out.conversas ?? [];
    const lider = capitao ? lideranca(capitao, x.data) : 50;
    if (
      doClube &&
      !nova &&
      comBriga.filter((v) => !DA_IMPRENSA.has(v.tipo)).length < MAX_PENDENTES &&
      (out.moral < 45 || saldo <= -3) &&
      rng.chance(0.2 * Math.max(0.3, 1.5 - lider / 100))
    ) {
      const grupo = elenco
        .slice(0, 18)
        .filter((j) => livre(j.id) && !lesionado(estadoDe(out, j.id), x.data));
      const a = [...grupo].sort(
        (p, q) => moralDe(estadoDe(out, p.id)) - moralDe(estadoDe(out, q.id)),
      )[0];
      const outros = grupo.filter((j) => j !== a);
      const b = outros.length ? outros[rng.int(0, outros.length - 1)] : undefined;
      if (a && b) {
        out = {
          ...out,
          conversas: [
            ...comBriga,
            {
              id: `briga:${a.id}:${x.data}`,
              tipo: "briga",
              jogador: a.id,
              outro: b.id,
              data: x.data,
              prazo: somarDias(x.data, DIAS_PARA_RESPONDER),
            },
          ],
          conversasRecentes: { ...out.conversasRecentes, [a.id]: x.data, [b.id]: x.data },
        };
        nova = true;
      }
    }
  }
  // A imprensa depois dos resultados que chamam atenção.
  const imprensa = resultadoDeImprensa(out, mundo, x, saldo);
  if (
    imprensa &&
    new Rng(`${c.semente}:imprensa:${x.id}`).chance(imprensa === "imprensa-derrota" ? 0.7 : 0.5)
  ) {
    out = {
      ...out,
      conversas: [
        ...(out.conversas ?? []).filter(
          (v) => v.tipo !== "imprensa-vitoria" && v.tipo !== "imprensa-derrota",
        ),
        {
          id: `${imprensa}:${x.id}`,
          tipo: imprensa,
          data: x.data,
          prazo: prazoDaImprensa(x.data),
          jogo: x.id,
          adversario: x.adversario,
          params: {
            pro: nosso === "casa" ? r.placar[0] : r.placar[1],
            contra: nosso === "casa" ? r.placar[1] : r.placar[0],
          },
        },
      ],
    };
    nova = true;
  }
  return { carreira: comNoticias(out, ns), nova };
}

function paramsDoAumento(c: Carreira, mundo: Mundo, id: string): Record<string, number> {
  const j = mundo.jogador(id);
  const atual = contratoDe(c, mundo, id)?.salario ?? 0;
  return { salario: atual, pedido: j ? Math.max(atual, salarioDeMercado(j)) : atual };
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

  // Quem se machucou com uma conversa de minutos ou de cansaço aberta deixa o assunto para depois.
  const conversas = r.conversas ?? [];
  const deLesionado = (x: Conversa) =>
    (x.tipo === "quer-jogar" || x.tipo === "cansado") &&
    !!x.jogador &&
    lesionado(r.jogadores[x.jogador], data);
  if (conversas.some(deLesionado))
    r = { ...r, conversas: conversas.filter((x) => !deLesionado(x)) };

  // Entrevista antes do jogo grande, no dia do jogo (vale até a bola rolar).
  const hoje = agendaCompleta(r).find((x) => x.data === data && !x.resultado);
  if (
    hoje &&
    jogoGrande(r, mundo, hoje) &&
    !(r.conversas ?? []).some((v) => v.tipo === "imprensa-antes" && v.jogo === hoje.id)
  )
    r = adicionarConversa(r, {
      id: `imprensa-antes:${hoje.id}`,
      tipo: "imprensa-antes",
      data,
      prazo: data,
      jogo: hoje.id,
      adversario: hoje.adversario,
    });

  // A torcida volta aos poucos ao normal; muito brava ou muito feliz, pesa na diretoria todo mês.
  if (r.torcida !== undefined) {
    const t = torcidaDe(r);
    r = { ...r, torcida: Math.round((t + (60 - t) * 0.01) * 10) / 10 };
  }

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
      r = mexerNaReputacao(r, mundo, cumpriu ? 4 : -3, cumpriu ? data : undefined);
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
    const torcida = torcidaDe(r);
    if (torcida < 30) delta -= 3;
    else if (torcida >= 80) delta += 2;
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
  // Demissão: confiança no fundo (abaixo de 10) ou 6 meses de salários atrasados.
  const salarios = (r.crise?.mesesAtrasados ?? 0) >= 6;
  if (d.confianca < 10 || salarios) {
    const demissao = demitir(r, mundo, data, salarios ? "salarios" : "confianca");
    r = demissao.carreira;
    noticias.push(...demissao.noticias);
    decisao = true;
  }
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
