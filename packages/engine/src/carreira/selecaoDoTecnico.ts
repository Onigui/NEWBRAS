/**
 * Técnico de seleção (etapa 15b): convites das seleções pela reputação, clube e seleção ao mesmo
 * tempo, convocação escolhida à mão, os jogos da seleção na agenda do técnico e a confiança da
 * federação, que demite quando os resultados não vêm.
 */
import type { Clube, Jogador, Posicao } from "@newbras/data";
import { marcar, type TextoMarcado } from "@newbras/textos";
import { avancarCompeticao, lancarResultado } from "../competicoes/competicao";
import { jogarDia } from "../competicoes/mundo";
import type { ResultadoPartida } from "../partida/tipos";
import { Rng } from "../rng";
import { sortearLesao } from "../elenco/lesoes";
import { idadeEm } from "../evolucao";
import type { AmistosoDeSelecao } from "../selecoes/amistosos";
import { TAMANHO_DA_CONVOCACAO } from "../selecoes/convocacao";
import { jogadoresDaNacionalidade } from "../elenco/mundo";
import type {
  Carreira,
  Compromisso,
  EscalacaoSalva,
  Mundo,
  Noticia,
  ResultadoCompromisso,
} from "./carreira";
import { somarDias } from "./datas";
import { mexerNaReputacao, nivelAlcancado, perfilDe, type ConviteDeEmprego } from "./tecnico";

/** A seleção que o técnico comanda junto com o clube. */
export interface SelecaoDoTecnico {
  pais: string;
  desde: string;
  /** Confiança da federação, de 0 a 100: abaixo de 15, o técnico é demitido da seleção. */
  confianca: number;
  /** Convocação escolhida à mão (sem ela, vale a automática: os 26 melhores do país). */
  convocados?: string[];
  escalacao?: EscalacaoSalva | null;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  titulos: string[];
}

/** Tamanho da convocação escolhida à mão (a lista de Copa vai até 26). */
export const CONVOCACAO_MINIMA = 20;
export const CONVOCACAO_MAXIMA = TAMANHO_DA_CONVOCACAO;
/** Confiança inicial da federação e o limite da demissão. */
const CONFIANCA_INICIAL = 60;
const CONFIANCA_DEMISSAO = 15;
/** Reputação mínima para uma seleção pensar no técnico. */
const REPUTACAO_PARA_SELECAO = 50;
/** Chance de uma seleção chamar no dia 1 do mês (mais depois de um título ou de uma Copa). */
const CHANCE_CONVITE = 0.06;
const CHANCE_CONVITE_EM_ALTA = 0.18;
/** Dias para responder ao convite. */
const PRAZO_DO_CONVITE = 21;

/** Força da seleção: a média dos 11 melhores da convocação de hoje. */
export function forcaDaSelecao(mundo: Mundo, pais: string): number {
  const top = [...mundo.elenco(pais)]
    .map((j) => j.forca)
    .sort((a, b) => b - a)
    .slice(0, 11);
  return top.length ? top.reduce((s, x) => s + x, 0) / top.length : 0;
}

/** Um país visto como "clube", para mostrar escudo, cores e nome no lugar de um clube. */
export function clubeDaSelecao(mundo: Mundo, pais: string): Clube | undefined {
  const p = mundo.pais(pais);
  if (!p) return undefined;
  return {
    id: p.codigo,
    nome: p.nome,
    nomeCurto: p.nome,
    pais: p.codigo,
    cores: p.cores,
    nivel: Math.round(forcaDaSelecao(mundo, pais)),
  } as unknown as Clube;
}

/** O clube ou a seleção com esse id (país em três letras maiúsculas). */
export function clubeOuSelecao(mundo: Mundo, id: string): Clube | undefined {
  return /^[A-Z]{3}$/.test(id) ? clubeDaSelecao(mundo, id) : mundo.clube(id);
}

/** Jogos da seleção do técnico (oficiais e amistosos já marcados), como compromissos. */
export function compromissosDaSelecao(c: Carreira): Compromisso[] {
  const pais = c.selecao?.pais;
  if (!pais) return [];
  const lista: Compromisso[] = [];
  for (const e of Object.values(c.competicoes.competicoes))
    e.jogos.forEach((j, indice) => {
      if (j.casa !== pais && j.fora !== pais) return;
      const casa = j.casa === pais;
      lista.push({
        id: `${e.id}#${indice}`,
        data: e.datas[j.rodada] ?? "",
        tipo: "oficial",
        competicao: e.id,
        indice,
        selecao: pais,
        adversario: casa ? j.fora : j.casa,
        mando: casa ? "casa" : "fora",
        ...(j.neutro ? { neutro: true } : {}),
        ...(j.placar ? { resultado: resultadoDe(j.placar, j.penaltis) } : {}),
      });
    });
  for (const a of c.competicoes.amistosos ?? []) {
    if (a.cancelado || (a.casa !== pais && a.fora !== pais)) continue;
    const casa = a.casa === pais;
    lista.push({
      id: idDoAmistoso(a),
      data: a.data,
      tipo: "amistoso",
      selecao: pais,
      adversario: casa ? a.fora : a.casa,
      mando: casa ? "casa" : "fora",
      ...(a.placar ? { resultado: resultadoDe(a.placar) } : {}),
    });
  }
  return lista.filter((x) => x.data && x.data >= c.selecao!.desde);
}

const idDoAmistoso = (a: Pick<AmistosoDeSelecao, "data" | "casa" | "fora">) =>
  `amistoso-selecao:${a.data}:${a.casa}:${a.fora}`;

function resultadoDe(
  placar: readonly number[],
  penaltis?: readonly number[] | null,
): ResultadoCompromisso {
  return {
    placar: [placar[0] ?? 0, placar[1] ?? 0],
    ...(penaltis ? { penaltis: [penaltis[0] ?? 0, penaltis[1] ?? 0] as [number, number] } : {}),
    gols: [],
  };
}

/**
 * Todos os jogadores do país (em qualquer clube), do mais forte ao mais fraco, para o técnico
 * escolher a convocação.
 */
export function elegiveisDaSelecao(mundo: Mundo, pais: string): Jogador[] {
  return jogadoresDaNacionalidade(mundo, pais)
    .filter((j) => !j.base)
    .sort((a, b) => b.forca - a.forca || a.id.localeCompare(b.id));
}

/** Contagem por posição de uma lista de jogadores. */
export function contarPosicoes(jogadores: readonly Pick<Jogador, "posicao">[]) {
  const conta: Record<Posicao, number> = { G: 0, Z: 0, L: 0, M: 0, A: 0 };
  for (const j of jogadores) conta[j.posicao]++;
  return conta;
}

/** Problemas da convocação escolhida (lista vazia = vale), para traduzir ao mostrar. */
export function problemasDaConvocacao(
  jogadores: readonly Pick<Jogador, "posicao">[],
): TextoMarcado[] {
  const p: TextoMarcado[] = [];
  if (jogadores.length < CONVOCACAO_MINIMA)
    p.push(marcar("convoque pelo menos {n} jogadores", { n: CONVOCACAO_MINIMA }));
  if (jogadores.length > CONVOCACAO_MAXIMA)
    p.push(marcar("convoque no máximo {n} jogadores", { n: CONVOCACAO_MAXIMA }));
  if (contarPosicoes(jogadores).G < 2) p.push(marcar("convoque pelo menos 2 goleiros"));
  return p;
}

/** Define a convocação à mão (null volta para a automática). Lista inválida é recusada. */
export function definirConvocacao(
  c: Carreira,
  mundo: Mundo,
  ids: readonly string[] | null,
): Carreira {
  const s = c.selecao;
  if (!s) return c;
  if (!ids) {
    const { convocados: _, ...resto } = s;
    return { ...c, selecao: { ...resto, escalacao: null } };
  }
  const unicos = [...new Set(ids)];
  const jogadores = unicos
    .map((id) => mundo.jogador(id))
    .filter((j): j is Jogador => !!j && j.nacionalidade === s.pais);
  if (problemasDaConvocacao(jogadores).length) return c;
  return { ...c, selecao: { ...s, convocados: jogadores.map((j) => j.id), escalacao: null } };
}

/** Convites das seleções no dia 1 do mês, pela reputação (só para quem ainda não tem seleção). */
export function convitesDeSelecao(
  c: Carreira,
  mundo: Mundo,
  data: string,
): { carreira: Carreira; noticias: Noticia[] } {
  const nada = { carreira: c, noticias: [] };
  if (c.selecao || !data.endsWith("-01")) return nada;
  const p = perfilDe(c, mundo);
  if (p.demitido || p.reputacao < REPUTACAO_PARA_SELECAO) return nada;
  const abertos = (p.convites ?? []).filter((x) => x.ate >= data);
  if (abertos.some((x) => x.tipo === "selecao")) return nada;
  const rng = new Rng(`${c.semente}:convite-selecao:${data}`);
  const emAlta = !!p.emAlta && p.emAlta >= somarDias(data, -90);
  if (!rng.chance(emAlta ? CHANCE_CONVITE_EM_ALTA : CHANCE_CONVITE)) return nada;
  // Seleções do tamanho que a reputação alcança (até 12 pontos abaixo dela), com jogadores.
  const teto = nivelAlcancado(p.reputacao);
  const lista = (mundo.paises ?? [])
    .map((x) => ({ pais: x, forca: forcaDaSelecao(mundo, x.codigo) }))
    .filter(({ forca }) => forca >= teto - 12 && forca <= teto + 1)
    .sort((a, b) => b.forca - a.forca || a.pais.codigo.localeCompare(b.pais.codigo));
  if (!lista.length) return nada;
  // A seleção do país do clube tem mais chance (o técnico é conhecido lá).
  const doPais = lista.find((x) => x.pais.codigo === mundo.clube(c.clube)?.pais);
  const escolhida =
    doPais && rng.chance(0.4) ? doPais : (lista[rng.int(0, lista.length - 1)] as (typeof lista)[0]);
  const convite: ConviteDeEmprego = {
    id: `selecao:${escolhida.pais.codigo}:${data}`,
    clube: escolhida.pais.codigo,
    data,
    ate: somarDias(data, PRAZO_DO_CONVITE),
    motivo: "reputacao",
    tipo: "selecao",
  };
  return {
    carreira: { ...c, perfil: { ...p, convites: [...abertos, convite] } },
    noticias: [
      {
        data,
        tipo: "elenco",
        ...marcar(
          "A federação de {pais} quer você como técnico da seleção, junto com o clube. Responda até {ate}.",
          { pais: escolhida.pais.nome, ate: convite.ate },
        ),
      },
    ],
  };
}

/** O técnico aceita a seleção: passa a comandar os dois, com a confiança inicial da federação. */
export function assumirSelecao(c: Carreira, mundo: Mundo, pais: string): Carreira {
  const p = perfilDe(c, mundo);
  const selecao: SelecaoDoTecnico = {
    pais,
    desde: c.data,
    confianca: CONFIANCA_INICIAL,
    jogos: 0,
    vitorias: 0,
    empates: 0,
    derrotas: 0,
    titulos: [],
  };
  const historico = [...(c.selecoesAnteriores ?? [])];
  return {
    ...c,
    selecao,
    selecoesAnteriores: historico,
    perfil: { ...p, convites: (p.convites ?? []).filter((x) => x.tipo !== "selecao") },
    noticias: [
      {
        data: c.data,
        tipo: "elenco" as const,
        ...marcar("Você assumiu a seleção de {pais}, sem deixar o clube.", {
          pais: mundo.pais(pais)?.nome ?? pais,
        }),
      },
      ...c.noticias,
    ].slice(0, 200),
  };
}

/** Sai da seleção: a pedido do técnico ou demitido pela federação. */
export function deixarSelecao(c: Carreira, mundo: Mundo, motivo: "pediu" | "demitido"): Carreira {
  const s = c.selecao;
  if (!s) return c;
  const { selecao: _, ...resto } = c;
  const nome = mundo.pais(s.pais)?.nome ?? s.pais;
  let r: Carreira = {
    ...resto,
    selecoesAnteriores: [
      ...(c.selecoesAnteriores ?? []),
      {
        pais: s.pais,
        inicio: s.desde,
        fim: c.data,
        jogos: s.jogos,
        vitorias: s.vitorias,
        empates: s.empates,
        derrotas: s.derrotas,
        titulos: s.titulos,
        motivo,
      },
    ],
    noticias: [
      {
        data: c.data,
        tipo: "elenco" as const,
        ...(motivo === "demitido"
          ? marcar("A federação de {pais} demitiu você do comando da seleção.", { pais: nome })
          : marcar("Você deixou o comando da seleção de {pais}.", { pais: nome })),
      },
      ...c.noticias,
    ].slice(0, 200),
  };
  if (motivo === "demitido") r = mexerNaReputacao(r, mundo, -3, c.data);
  return r;
}

/** Os convocados que estão machucados no clube do técnico ou nos clubes da CPU. */
export function indisponiveisNaSelecao(c: Carreira, mundo: Mundo, data: string): Set<string> {
  const ids = new Set<string>();
  const pais = c.selecao?.pais;
  if (!pais) return ids;
  for (const j of mundo.elenco(pais)) {
    const e = c.jogadores[j.id];
    if (e?.lesao && e.lesao.ate > data) ids.add(j.id);
    const clube = j.clube;
    const lista = clube ? c.competicoes.lesionados?.[clube] : undefined;
    if (lista?.some(([id, ate]) => id === j.id && ate > data)) ids.add(j.id);
  }
  return ids;
}

/**
 * Lança um jogo da seleção do técnico: o placar na competição (ou no amistoso), a campanha e a
 * confiança da federação, a reputação, as lesões dos jogadores do clube e a notícia. Os convocados
 * do clube perdem condição e somam o jogo no fechamento do dia, como sempre.
 */
export function registrarJogoDaSelecao(
  c: Carreira,
  mundo: Mundo,
  x: Compromisso,
  r: ResultadoPartida,
  nomeDoJogo: string,
): Carreira {
  const s = c.selecao;
  if (!s || !x.selecao) return c;
  const [gc, gf] = r.placar;
  const nosso = x.mando === "casa" ? "casa" : "fora";
  const pro = nosso === "casa" ? gc : gf;
  const contra = nosso === "casa" ? gf : gc;
  let competicoes = c.competicoes;
  const golsDoJogo = r.eventos
    .filter((ev) => ev.tipo === "gol" && ev.jogador)
    .map((ev) =>
      ev.outro
        ? { jogador: ev.jogador as string, assistencia: ev.outro }
        : { jogador: ev.jogador as string },
    );
  if (x.tipo === "oficial" && x.competicao && x.indice !== undefined) {
    const comp = mundo.competicao(x.competicao);
    let estado = competicoes.competicoes[x.competicao];
    if (comp && estado) {
      estado = lancarResultado(
        estado,
        x.indice,
        [gc, gf],
        r.penaltis ? [r.penaltis[0], r.penaltis[1]] : undefined,
        golsDoJogo,
      );
      estado = avancarCompeticao(comp, estado, c.semente);
      competicoes = {
        ...competicoes,
        competicoes: { ...competicoes.competicoes, [x.competicao]: estado },
      };
      competicoes = jogarDia(mundo, competicoes, c.data, c.semente);
    }
  } else {
    const casaGols = golsDoJogo.filter((g) => {
      const ev = r.eventos.find((e) => e.tipo === "gol" && e.jogador === g.jogador);
      return ev?.time === "casa";
    });
    competicoes = {
      ...competicoes,
      amistosos: (competicoes.amistosos ?? []).map((a) =>
        idDoAmistoso(a) === x.id
          ? {
              ...a,
              placar: [gc, gf] as [number, number],
              gols: [
                casaGols.map((g) => g.jogador),
                golsDoJogo.filter((g) => !casaGols.includes(g)).map((g) => g.jogador),
              ] as [string[], string[]],
            }
          : a,
      ),
    };
  }
  // Campanha e confiança: jogo oficial pesa mais que amistoso.
  const oficial = x.tipo === "oficial";
  const venceu = pro > contra || (pro === contra && !!r.penaltis && vencedorNosPenaltis(r, nosso));
  const perdeu = pro < contra || (pro === contra && !!r.penaltis && !venceu);
  const delta = venceu ? (oficial ? 6 : 3) : perdeu ? (oficial ? -9 : -4) : oficial ? 0 : 1;
  const confianca = Math.max(0, Math.min(100, s.confianca + delta));
  const selecao: SelecaoDoTecnico = {
    ...s,
    confianca,
    jogos: s.jogos + 1,
    vitorias: s.vitorias + (venceu ? 1 : 0),
    empates: s.empates + (!venceu && !perdeu ? 1 : 0),
    derrotas: s.derrotas + (perdeu ? 1 : 0),
  };
  // Lesões dos jogadores do clube do técnico na seleção.
  const jogadores = { ...c.jogadores };
  const doClube = new Set(mundo.elenco(c.clube).map((j) => j.id));
  const rng = new Rng(`${c.semente}:selecao-lesao:${x.id}`);
  for (const ev of r.eventos) {
    if (ev.tipo !== "lesao" || !ev.jogador || !doClube.has(ev.jogador)) continue;
    const j = mundo.jogador(ev.jogador);
    const lesao = sortearLesao(
      rng,
      c.data,
      ev.outro ? "falta" : "cansaco",
      j ? idadeEm(j.nascimento, c.data) : 25,
    );
    const antes = jogadores[ev.jogador];
    if (antes) jogadores[ev.jogador] = { ...antes, lesao };
  }
  const nomes = {
    casa: clubeOuSelecao(mundo, nosso === "casa" ? s.pais : x.adversario)?.nomeCurto ?? "",
    fora: clubeOuSelecao(mundo, nosso === "casa" ? x.adversario : s.pais)?.nomeCurto ?? "",
  };
  let carreira: Carreira = {
    ...c,
    jogadores,
    competicoes,
    selecao,
    noticias: [
      {
        data: c.data,
        tipo: "jogo" as const,
        ...marcar(
          r.penaltis
            ? "{jogo}: {casa} {gc} x {gf} {fora} (pênaltis {pc} x {pf})."
            : "{jogo}: {casa} {gc} x {gf} {fora}.",
          {
            jogo: nomeDoJogo,
            ...nomes,
            gc,
            gf,
            ...(r.penaltis ? { pc: r.penaltis[0], pf: r.penaltis[1] } : {}),
          },
        ),
      },
      ...c.noticias,
    ].slice(0, 200),
  };
  if (oficial)
    carreira = mexerNaReputacao(carreira, mundo, venceu ? 0.3 : perdeu ? -0.2 : 0, c.data);
  if (confianca < CONFIANCA_DEMISSAO) carreira = deixarSelecao(carreira, mundo, "demitido");
  return carreira;
}

function vencedorNosPenaltis(r: ResultadoPartida, nosso: "casa" | "fora"): boolean {
  if (!r.penaltis) return false;
  return nosso === "casa" ? r.penaltis[0] > r.penaltis[1] : r.penaltis[1] > r.penaltis[0];
}

/** Títulos da seleção do técnico nas competições que acabaram: reputação e a lista de títulos. */
export function titulosDaSelecao(
  c: Carreira,
  mundo: Mundo,
  data: string,
  registros: readonly { competicao: string; campeao?: string }[],
): { carreira: Carreira; noticias: Noticia[] } {
  const s = c.selecao;
  if (!s) return { carreira: c, noticias: [] };
  let r = c;
  const noticias: Noticia[] = [];
  for (const h of registros) {
    if (h.campeao !== s.pais) continue;
    const comp = mundo.competicao(h.competicao);
    if (!comp) continue;
    const mundial = comp.escopo.tipo === "mundial";
    r = mexerNaReputacao(r, mundo, mundial ? 18 : 12, data);
    r = {
      ...r,
      selecao: {
        ...(r.selecao as SelecaoDoTecnico),
        titulos: [...(r.selecao?.titulos ?? []), comp.nome],
        confianca: Math.min(100, (r.selecao?.confianca ?? 60) + 25),
      },
    };
    noticias.push({
      data,
      tipo: "jogo",
      ...marcar("Campeão com a seleção: {pais} conquistou a {competicao}!", {
        pais: mundo.pais(s.pais)?.nome ?? s.pais,
        competicao: comp.nome,
      }),
    });
  }
  return { carreira: r, noticias };
}
