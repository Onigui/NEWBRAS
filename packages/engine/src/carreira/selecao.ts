/**
 * Convocados do clube do técnico (etapa 11e): quem está na lista da seleção dele fica fora dos jogos
 * do clube nos dias perto de um jogo da seleção (amistoso ou oficial, também nos torneios de junho e
 * julho, quando muitas ligas seguem), volta cansado e soma os jogos e os gols pela seleção.
 */
import type { Jogador, Posicao } from "@newbras/data";
import { marcar, t } from "@newbras/textos";
import { nomeCurtoDaCompeticao } from "../competicoes/competicao";
import type { MundoCompeticoes } from "../competicoes/mundo";
import { Rng } from "../rng";
import {
  diasOficiais,
  janelaDaData,
  jogosDeSelecoes,
  type JogoDeSelecao,
} from "../selecoes/amistosos";
import type { Carreira, EstadoJogador, Mundo, Noticia } from "./carreira";
import { diaAbsoluto, somarDias } from "./datas";

/** Fora das datas FIFA, o convocado se apresenta tantos dias antes do jogo da seleção... */
export const DIAS_ANTES_DO_JOGO = 3;
/** ...e volta no dia seguinte. Entre dois jogos de um torneio com até tantos dias, fica. */
const DIAS_NO_TORNEIO = 7;
/** Condição que um jogo pela seleção custa: titular (90 minutos) e reserva que entrou. */
export const DESGASTE_TITULAR = 30;
export const DESGASTE_RESERVA = 10;
/** Chance de um reserva da seleção entrar no jogo. */
const CHANCE_RESERVA_ENTRAR = 0.45;
/** Titulares da seleção: um 4-4-2 pela força, na ordem da convocação. */
const TITULARES: Readonly<Record<Posicao, number>> = { G: 1, Z: 2, L: 2, M: 4, A: 2 };

/** Os jogadores do clube que estão na convocação da seleção deles: jogador → seleção. */
export function convocadosDoClube(mundo: Mundo, clube: string): Map<string, string> {
  const lista = new Map<string, string>();
  for (const j of mundo.elenco(clube)) {
    if (!/^[A-Z]{3}$/.test(j.nacionalidade) || !mundo.pais(j.nacionalidade)) continue;
    if (mundo.elenco(j.nacionalidade).some((x) => x.id === j.id)) lista.set(j.id, j.nacionalidade);
  }
  return lista;
}

/** Os 11 titulares de uma convocação (a lista vem do mais forte para o mais fraco em cada posição). */
export function titularesDaSelecao(convocados: readonly Jogador[]): Set<string> {
  const conta: Partial<Record<Posicao, number>> = {};
  const ids = new Set<string>();
  for (const j of convocados) {
    const n = conta[j.posicao] ?? 0;
    if (n >= TITULARES[j.posicao]) continue;
    conta[j.posicao] = n + 1;
    ids.add(j.id);
  }
  return ids;
}

/** Dias de jogo (oficial e amistoso) de cada seleção. */
function diasDasSelecoes(mundo: Mundo, estado: MundoCompeticoes): Map<string, number[]> {
  const dias = diasOficiais(mundo, estado.competicoes);
  for (const a of estado.amistosos ?? []) {
    if (a.cancelado) continue;
    const d = diaAbsoluto(a.data);
    for (const t of [a.casa, a.fora]) {
      const l = dias.get(t);
      if (l) l.push(d);
      else dias.set(t, [d]);
    }
  }
  return dias;
}

/**
 * Quem do clube está com a seleção na data: jogador → seleção. Numa data FIFA, todos os convocados
 * (a liberação é obrigatória); fora delas, nos dias perto de um jogo da seleção e durante os
 * torneios (a Copa América e a Copa da Ásia caem com muitas ligas em andamento).
 */
export function foraPelaSelecao(
  c: Pick<Carreira, "clube" | "competicoes">,
  mundo: Mundo,
  data: string,
): Map<string, string> {
  const fora = new Map<string, string>();
  const convocados = convocadosDoClube(mundo, c.clube);
  if (!convocados.size) return fora;
  if (janelaDaData(mundo.datasFifa, data)) {
    for (const [id, pais] of convocados) if (mundo.pais(pais)) fora.set(id, pais);
    return fora;
  }
  const dias = diasDasSelecoes(mundo, c.competicoes);
  const d = diaAbsoluto(data);
  for (const [id, pais] of convocados) {
    const l = dias.get(pais) ?? [];
    const perto = l.some((x) => x - d >= -1 && x - d <= DIAS_ANTES_DO_JOGO);
    const noTorneio =
      l.some((x) => x < d && d - x <= DIAS_NO_TORNEIO) &&
      l.some((x) => x > d && x - d <= DIAS_NO_TORNEIO);
    if (perto || noTorneio) fora.set(id, pais);
  }
  return fora;
}

/** Os jogos de uma seleção (oficiais e amistosos), em ordem de data. */
export function jogosDaSelecao(c: Pick<Carreira, "competicoes">, mundo: Mundo, pais: string) {
  return jogosDeSelecoes(mundo, c.competicoes.competicoes, c.competicoes.amistosos, pais);
}

const nomeDaSelecao = (mundo: Mundo, pais: string) => mundo.pais(pais)?.nome ?? pais;

/** "Brasil 2 x 1 Uruguai" (com os pênaltis, quando houve). */
export function placarDaSelecao(mundo: Mundo, j: JogoDeSelecao): string {
  const p = j.placar ?? [0, 0];
  const pen = j.penaltis ? ` (${j.penaltis[0]} x ${j.penaltis[1]} pên.)` : "";
  return `${nomeDaSelecao(mundo, j.casa)} ${p[0]} x ${p[1]}${pen} ${nomeDaSelecao(mundo, j.fora)}`;
}

/**
 * Fecha o dia para os convocados: quem jogou pela seleção perde condição e soma o jogo e os gols;
 * as notícias trazem os gols deles e os jogos da seleção do país do clube.
 */
export function diaDosConvocados(
  c: Carreira,
  mundo: Mundo,
  antes: MundoCompeticoes,
  depois: MundoCompeticoes,
  dia: string,
  jogadores: Record<string, EstadoJogador>,
): { jogadores: Record<string, EstadoJogador>; noticias: Noticia[] } {
  const jogos = jogosDeSelecoes(mundo, depois.competicoes, depois.amistosos).filter(
    (j) => j.data === dia && j.placar,
  );
  if (!jogos.length) return { jogadores, noticias: [] };
  const convocados = convocadosDoClube(mundo, c.clube);
  const paisDoClube = mundo.clube(c.clube)?.pais;
  const rng = new Rng(`${c.semente}:selecao:${dia}`);
  const novos = { ...jogadores };
  const noticias: Noticia[] = [];
  const amanha = somarDias(dia, 1);
  for (const j of jogos) {
    const competicao = j.competicao ? mundo.competicao(j.competicao) : undefined;
    const placar = placarDaSelecao(mundo, j);
    const nossos = [...convocados].filter(([, p]) => p === j.casa || p === j.fora);
    const autores: string[] = [];
    for (const [id, pais] of nossos) {
      const e = novos[id];
      if (!e) continue;
      const lado = pais === j.casa ? 0 : 1;
      const gols = j.competicao
        ? (depois.competicoes[j.competicao]?.artilharia[id]?.[0] ?? 0) -
          (antes.competicoes[j.competicao]?.artilharia[id]?.[0] ?? 0)
        : (j.gols?.[lado]?.filter((x) => x === id).length ?? 0);
      const titular = titularesDaSelecao(mundo.elenco(pais)).has(id);
      const entrou = titular || gols > 0 || rng.chance(CHANCE_RESERVA_ENTRAR);
      if (!entrou) continue;
      const desgaste = titular ? DESGASTE_TITULAR : DESGASTE_RESERVA;
      const s = e.selecao ?? { jogos: 0, gols: 0 };
      novos[id] = {
        ...e,
        condicao: Math.max(0, Math.round((e.condicao - desgaste) * 10) / 10),
        selecao: { jogos: s.jogos + 1, gols: s.gols + gols },
      };
      if (gols)
        autores.push(
          gols > 1 ? `${mundo.jogador(id)?.nome ?? id} (${gols})` : (mundo.jogador(id)?.nome ?? id),
        );
    }
    const onde = competicao ? nomeCurtoDaCompeticao(competicao) : t("Amistoso");
    if (autores.length)
      noticias.push({
        data: amanha,
        tipo: "elenco",
        ...marcar("Gol pela seleção: {autores}. {placar} ({competicao}).", {
          autores: autores.join(", "),
          placar,
          competicao: onde,
        }),
      });
    else if (paisDoClube && (j.casa === paisDoClube || j.fora === paisDoClube))
      noticias.push({
        data: amanha,
        tipo: "carreira",
        ...marcar("Seleção: {placar} ({competicao}).", { placar, competicao: onde }),
      });
  }
  return { jogadores: novos, noticias };
}

/** Notícia dos que se apresentam às seleções hoje (os que ontem ainda estavam no clube). */
export function noticiaDaConvocacao(
  mundo: Mundo,
  ontem: ReadonlyMap<string, string>,
  hoje: ReadonlyMap<string, string>,
  data: string,
): Noticia | undefined {
  const novos = [...hoje].filter(([id]) => !ontem.has(id));
  if (!novos.length) return undefined;
  const nomes = novos
    .map(([id, pais]) => `${mundo.jogador(id)?.nome ?? id} (${nomeDaSelecao(mundo, pais)})`)
    .join(", ");
  return {
    data,
    tipo: "elenco",
    ...marcar("Com a seleção: {jogadores} se apresentam e desfalcam o time nos próximos dias.", {
      jogadores: nomes,
    }),
  };
}
