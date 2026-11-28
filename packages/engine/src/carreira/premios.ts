/**
 * Prêmios da temporada e rankings (etapa 15c).
 *
 * Em cada liga principal, quando a temporada do país acaba: Bola de Ouro (o craque), Bola de Prata
 * (a seleção da temporada, por posição, num 4-3-3), artilheiro, revelação (até 21 anos) e técnico da
 * temporada. No 1º de janeiro, o melhor do mundo do ano entre os premiados das ligas.
 *
 * A nota da temporada junta a força do jogador, os gols e as assistências nas competições do país, a
 * campanha do clube na liga e, para goleiros e defensores, os gols sofridos. Só concorre quem jogou:
 * no clube do técnico, quem esteve em 40% dos jogos da liga; na CPU, quem é titular pela força.
 *
 * Rankings: clubes pelos pontos das últimas 5 temporadas (liga, copas, continentais e mundiais, com
 * peso pela força da liga) e técnicos pela reputação; os da CPU têm nome gerado pelo país do clube.
 */
import type { Clube, Competicao, Jogador, Posicao } from "@newbras/data";
import { marcar } from "@newbras/textos";
import type { EstadoCompeticao } from "../competicoes/competicao";
import type { MundoCompeticoes, RegistroHistorico } from "../competicoes/mundo";
import { chaveDaCompeticao } from "../competicoes/mundo";
import { idadeEm } from "../evolucao";
import { gerarNome } from "../gerador/nomes";
import { Rng } from "../rng";
import type { Carreira, Mundo, Noticia } from "./carreira";
import { mexerNaReputacao, perfilDe } from "./tecnico";

export interface Premiado {
  jogador: string;
  /** Nome e clube no dia do prêmio (o jogador pode mudar de clube ou se aposentar depois). */
  nome: string;
  clube: string;
  posicao: Posicao;
  nota: number;
  gols?: number;
}

export interface PremiosDaLiga {
  competicao: string;
  temporada: string;
  data: string;
  /** Média dos 11 melhores dos clubes da liga: o peso dela no melhor do mundo e no ranking. */
  forcaDaLiga: number;
  /** Os 10 primeiros da classificação final (para o ranking de clubes). */
  tabela: string[];
  craque?: Premiado;
  /** Bola de Prata: 1 goleiro, 2 laterais, 2 zagueiros, 3 meias e 3 atacantes. */
  selecao: Premiado[];
  artilheiro?: Premiado;
  revelacao?: Premiado;
  tecnico?: { clube: string; nome: string; humano: boolean };
}

export interface MelhorDoMundo {
  ano: number;
  data: string;
  /** Os 10 mais votados, do primeiro ao décimo. */
  ranking: Premiado[];
}

export interface Premios {
  ligas: PremiosDaLiga[];
  mundo: MelhorDoMundo[];
  /** Jogos de cada jogador do técnico no último prêmio da liga dele (conta os jogos da temporada). */
  marcoDeJogos?: Record<string, number>;
  /** Posições do técnico e do clube nos rankings mundiais no último 1º de janeiro. */
  posicoes?: { tecnico: number; clube: number };
}

/** Temporadas guardadas por liga. */
const TEMPORADAS_GUARDADAS = 5;
const ANOS_DO_RANKING = 5;
const SELECAO_DA_TEMPORADA: Record<Posicao, number> = { G: 1, L: 2, Z: 2, M: 3, A: 3 };
/** Titulares da CPU por posição: quem está até aqui no elenco (pela força) concorre. */
const TITULARES: Record<Posicao, number> = { G: 1, L: 3, Z: 3, M: 5, A: 4 };
const ORDEM: Posicao[] = ["G", "L", "Z", "M", "A"];

/** A liga principal do país (os prêmios saem só dela). */
export function ligaPrincipal(c: Competicao): boolean {
  return (
    c.tipo === "liga" &&
    c.categoria === "clubes" &&
    c.escopo.tipo === "pais" &&
    (c.divisao ?? 1) === 1
  );
}

/** Média dos 11 melhores do elenco. */
function forcaDoElenco(elenco: readonly Jogador[]): number {
  const f = elenco
    .map((j) => j.forca)
    .sort((a, b) => b - a)
    .slice(0, 11);
  return f.length ? f.reduce((s, x) => s + x, 0) / f.length : 0;
}

/** Gols pró e contra de cada clube nos jogos da competição. */
function golsDosClubes(
  e: EstadoCompeticao,
): Map<string, { pro: number; contra: number; jogos: number }> {
  const r = new Map<string, { pro: number; contra: number; jogos: number }>();
  const somar = (clube: string, pro: number, contra: number) => {
    const x = r.get(clube) ?? { pro: 0, contra: 0, jogos: 0 };
    r.set(clube, { pro: x.pro + pro, contra: x.contra + contra, jogos: x.jogos + 1 });
  };
  for (const j of e.jogos) {
    if (!j.placar) continue;
    somar(j.casa, j.placar[0], j.placar[1]);
    somar(j.fora, j.placar[1], j.placar[0]);
  }
  return r;
}

/** Nome do técnico da CPU de um clube: gerado pelo país, o mesmo durante toda a carreira. */
export function tecnicoDaCpu(mundo: Pick<Mundo, "pais">, clube: Clube, semente: string): string {
  if (clube.tecnico) return clube.tecnico;
  const grupo = mundo.pais(clube.pais)?.grupoNomes ?? "en";
  return gerarNome(new Rng(`${semente}:tecnico:${clube.id}`), grupo).nomeCompleto;
}

interface Candidato extends Premiado {
  idade: number;
  lado: Jogador["lado"];
}

/**
 * Os prêmios de uma liga que acabou. `e` é o estado final da liga; `doPais`, as competições do país
 * na mesma temporada (os gols das copas também contam).
 */
export function premiosDaLiga(
  c: Carreira,
  mundo: Mundo,
  comp: Competicao,
  e: EstadoCompeticao,
  doPais: readonly EstadoCompeticao[],
  data: string,
): PremiosDaLiga | null {
  const tabela = e.classificacao ?? [];
  if (tabela.length < 4) return null;
  const n = tabela.length;
  const gols = golsDosClubes(e);
  const mediaContra =
    [...gols.values()].reduce((s, x) => s + x.contra / Math.max(1, x.jogos), 0) /
    Math.max(1, gols.size);
  const artilharia = new Map<string, [number, number]>();
  for (const x of doPais)
    for (const [id, [g, a]] of Object.entries(x.artilharia)) {
      const v = artilharia.get(id) ?? [0, 0];
      artilharia.set(id, [v[0] + g, v[1] + a]);
    }
  const rng = new Rng(`${c.semente}:premios:${comp.id}:${e.temporada}`);
  const jogosDoTecnico = gols.get(c.clube)?.jogos ?? 0;
  const marco = c.premios?.marcoDeJogos ?? {};
  const candidatos: Candidato[] = [];
  const forcas: number[] = [];
  const forcaDoClube = new Map<string, number>();
  for (const [i, id] of tabela.entries()) {
    const clube = mundo.clube(id);
    if (!clube) continue;
    const elenco = mundo.elenco(id);
    const forca = forcaDoElenco(elenco);
    forcas.push(forca);
    forcaDoClube.set(id, forca);
    const campanha = 3.5 * (1 - i / Math.max(1, n - 1)) + (i === 0 ? 1 : 0);
    const g = gols.get(id);
    const defesa = g
      ? Math.max(
          -2,
          Math.min(
            4,
            ((mediaContra - g.contra / Math.max(1, g.jogos)) / Math.max(0.3, mediaContra)) * 4,
          ),
        )
      : 0;
    const porPosicao = new Map<Posicao, Jogador[]>();
    for (const j of elenco) porPosicao.set(j.posicao, [...(porPosicao.get(j.posicao) ?? []), j]);
    for (const [pos, lista] of porPosicao) {
      lista.sort((a, b) => b.forca - a.forca);
      lista.forEach((j, k) => {
        if (id === c.clube) {
          const jogou = (c.jogadores[j.id]?.jogos ?? 0) - (marco[j.id] ?? 0);
          if (jogou < Math.max(1, Math.ceil(jogosDoTecnico * 0.4))) return;
        } else if (k >= TITULARES[pos]) return;
        const [gm, as] = artilharia.get(j.id) ?? [0, 0];
        const ataque =
          pos === "A"
            ? Math.min(10, gm * 0.3 + as * 0.15)
            : pos === "M"
              ? Math.min(10, gm * 0.35 + as * 0.25)
              : pos === "G"
                ? 0
                : Math.min(6, gm * 0.5 + as * 0.3);
        const peso = pos === "G" || pos === "Z" || pos === "L" ? 1 : pos === "M" ? 0.4 : 0;
        const nota = j.forca + ataque + campanha + defesa * peso + rng.float(-1.5, 1.5);
        candidatos.push({
          jogador: j.id,
          nome: j.nome,
          clube: id,
          posicao: pos,
          nota: Math.round(nota * 10) / 10,
          ...(gm ? { gols: gm } : {}),
          idade: idadeEm(j.nascimento, data),
          lado: j.lado,
        });
      });
    }
  }
  if (!candidatos.length) return null;
  candidatos.sort((a, b) => b.nota - a.nota || a.jogador.localeCompare(b.jogador));
  const limpar = ({ idade: _i, lado: _l, ...p }: Candidato): Premiado => p;
  // Seleção da temporada: os melhores de cada posição; nas laterais, um de cada lado quando dá.
  const selecao: Premiado[] = [];
  for (const pos of ORDEM) {
    const lista = candidatos.filter((x) => x.posicao === pos);
    if (pos === "L") {
      const d = lista.find((x) => x.lado !== "E");
      const es = lista.find((x) => x !== d && x.lado !== "D") ?? lista.find((x) => x !== d);
      for (const x of [d, es]) if (x) selecao.push(limpar(x));
    } else for (const x of lista.slice(0, SELECAO_DA_TEMPORADA[pos])) selecao.push(limpar(x));
  }
  const craque = candidatos[0];
  const revelacao = candidatos.find((x) => x.idade <= 21);
  const art = Object.entries(e.artilharia).sort(
    (a, b) => b[1][0] - a[1][0] || b[1][1] - a[1][1] || a[0].localeCompare(b[0]),
  )[0];
  const jArt = art ? mundo.jogador(art[0]) : undefined;
  // Técnico da temporada: quem terminou mais acima do que o elenco prometia (o campeão ganha 3).
  const pelaForca = [...forcaDoClube.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  let tecnico: PremiosDaLiga["tecnico"];
  let melhor = -Infinity;
  for (const [i, id] of tabela.entries()) {
    const esperado = pelaForca.indexOf(id);
    if (esperado < 0) continue;
    const v = esperado - i + (i === 0 ? 3 : 0);
    if (v > melhor) {
      melhor = v;
      const clube = mundo.clube(id);
      if (!clube) continue;
      const humano = id === c.clube;
      tecnico = {
        clube: id,
        nome: humano ? c.tecnico : tecnicoDaCpu(mundo, clube, c.semente),
        humano,
      };
    }
  }
  return {
    competicao: comp.id,
    temporada: e.temporada,
    data,
    forcaDaLiga:
      Math.round((forcas.reduce((s, x) => s + x, 0) / Math.max(1, forcas.length)) * 10) / 10,
    tabela: tabela.slice(0, 10),
    ...(craque ? { craque: limpar(craque) } : {}),
    selecao,
    ...(art && jArt
      ? {
          artilheiro: {
            jogador: art[0],
            nome: jArt.nome,
            clube: jArt.clube ?? "",
            posicao: jArt.posicao,
            nota: 0,
            gols: art[1][0],
          },
        }
      : {}),
    ...(revelacao ? { revelacao: limpar(revelacao) } : {}),
    ...(tecnico ? { tecnico } : {}),
  };
}

function guardarLiga(lista: readonly PremiosDaLiga[], p: PremiosDaLiga): PremiosDaLiga[] {
  const outras = lista.filter((x) => x.competicao !== p.competicao);
  const mesma = [p, ...lista.filter((x) => x.competicao === p.competicao)].slice(
    0,
    TEMPORADAS_GUARDADAS,
  );
  return [...mesma, ...outras];
}

/**
 * Os prêmios das ligas que acabaram hoje. `jogadas` é o estado das competições antes da virada (com
 * as temporadas que terminaram ainda inteiras).
 */
export function premiarTemporadas(
  c: Carreira,
  mundo: Mundo,
  jogadas: MundoCompeticoes,
  encerradas: readonly { pais: string; temporada: string }[],
  data: string,
): { carreira: Carreira; noticias: Noticia[] } {
  if (!encerradas.length) return { carreira: c, noticias: [] };
  let premios: Premios = c.premios ?? { ligas: [], mundo: [] };
  let r = c;
  const noticias: Noticia[] = [];
  const clubeDoTecnico = mundo.clube(c.clube);
  const nome = (id: string) => mundo.clube(id)?.nomeCurto ?? id;
  for (const v of encerradas) {
    const doPais = Object.values(jogadas.competicoes).filter((e) => {
      const comp = mundo.competicao(e.id);
      return comp && chaveDaCompeticao(comp) === v.pais && e.temporada === v.temporada;
    });
    for (const e of doPais) {
      const comp = mundo.competicao(e.id);
      if (!comp || !ligaPrincipal(comp) || !e.encerrada) continue;
      const p = premiosDaLiga(r, mundo, comp, e, doPais, data);
      if (!p) continue;
      premios = { ...premios, ligas: guardarLiga(premios.ligas, p) };
      const daLiga = e.participantes.includes(c.clube);
      // Notícias só do país do técnico (e das ligas em que o clube dele joga).
      if (!daLiga && clubeDoTecnico?.pais !== v.pais) continue;
      const liga = comp.nomeCurto ?? comp.nome;
      if (p.craque)
        noticias.push({
          data,
          tipo: "carreira",
          ...marcar("Bola de Ouro da {liga} {temporada}: {jogador} ({clube}).", {
            liga,
            temporada: e.temporada,
            jogador: p.craque.nome,
            clube: nome(p.craque.clube),
          }),
        });
      if (p.revelacao)
        noticias.push({
          data,
          tipo: "carreira",
          ...marcar("Revelação da {liga}: {jogador} ({clube}).", {
            liga,
            jogador: p.revelacao.nome,
            clube: nome(p.revelacao.clube),
          }),
        });
      if (daLiga) {
        const meus = p.selecao.filter((x) => x.clube === c.clube);
        if (meus.length)
          noticias.push({
            data,
            tipo: "elenco",
            ...marcar("Bola de Prata da {liga}: {jogadores}.", {
              liga,
              jogadores: meus.map((x) => x.nome).join(", "),
            }),
          });
        // Os premiados do clube ganham moral; o técnico premiado, reputação.
        const premiados = new Set(
          [p.craque, p.revelacao, ...p.selecao]
            .filter((x) => x?.clube === c.clube)
            .map((x) => x!.jogador),
        );
        if (premiados.size) {
          const jogadores = { ...r.jogadores };
          for (const id of premiados) {
            const est = jogadores[id];
            if (est) jogadores[id] = { ...est, moral: Math.min(100, (est.moral ?? 60) + 8) };
          }
          r = { ...r, jogadores };
        }
        const marcoDeJogos: Record<string, number> = {};
        for (const [id, est] of Object.entries(r.jogadores)) marcoDeJogos[id] = est.jogos;
        premios = { ...premios, marcoDeJogos };
      }
      if (p.tecnico)
        noticias.push({
          data,
          tipo: "carreira",
          ...(p.tecnico.humano
            ? marcar("Você é o técnico da temporada na {liga}!", { liga })
            : marcar("Técnico da temporada na {liga}: {tecnico} ({clube}).", {
                liga,
                tecnico: p.tecnico.nome,
                clube: nome(p.tecnico.clube),
              })),
        });
      if (p.tecnico?.humano) r = mexerNaReputacao(r, mundo, 3, data);
    }
  }
  return { carreira: { ...r, premios }, noticias };
}

/** Peso de um título no ranking de clubes (campeão, vice). */
function pontosDoTitulo(comp: Competicao): [number, number] {
  if (comp.escopo.tipo === "mundial") return comp.id.includes("mundial") ? [15, 7] : [8, 4];
  if (comp.escopo.tipo === "confederacao") {
    if (comp.tipo === "supercopa") return [4, 2];
    return /champions|libertadores/.test(comp.id) ? [20, 10] : [12, 6];
  }
  if (comp.escopo.tipo === "estado") return [5, 0];
  if (comp.tipo === "supercopa") return [3, 1];
  if (comp.tipo === "copa") return [10, 5];
  return [0, 0];
}

/** Pontos da liga pela posição final (do 1º ao 10º). */
const PONTOS_DA_LIGA = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];

/** O ano em que a temporada termina ("2026/27" → 2027). */
export function anoDaTemporada(temporada: string): number {
  const [a, b] = temporada.split("/");
  const inicio = Number(a);
  if (!b) return inicio;
  const fim = Math.floor(inicio / 100) * 100 + Number(b);
  return fim < inicio ? fim + 100 : fim;
}

/** Peso da liga pela força média dos clubes (Premier League perto de 1,5; ligas fracas, 0,3). */
const pesoDaLiga = (forca: number) => Math.max(0.3, Math.min(1.5, (forca - 55) / 18));

/** Pontos estimados por temporada antes do começo da carreira, pelo nível do clube. */
const pontosEstimados = (nivel: number) => Math.max(0, nivel - 50) * 0.6;

export interface LinhaDoRanking {
  id: string;
  pontos: number;
}

/**
 * Ranking de clubes: as últimas 5 temporadas, a mais recente com peso 1 e a mais antiga 0,2. Antes
 * do começo da carreira, cada ano vale o estimado pelo nível do clube.
 */
export function rankingDeClubes(
  c: Carreira,
  mundo: Mundo,
  clubes: readonly Clube[],
  data: string,
): LinhaDoRanking[] {
  const ano = Number(data.slice(0, 4));
  const inicio = Number(c.inicio.slice(0, 4));
  const peso = (fim: number) => {
    const idade = ano - fim;
    return idade < 0 || idade >= ANOS_DO_RANKING ? 0 : 1 - idade * 0.2;
  };
  const pontos = new Map<string, number>();
  const somar = (id: string, v: number) => pontos.set(id, (pontos.get(id) ?? 0) + v);
  for (const h of c.competicoes.historico) {
    const comp = mundo.competicao(h.competicao);
    if (!comp || comp.categoria !== "clubes") continue;
    const w = peso(anoDaTemporada(h.temporada));
    if (!w) continue;
    const [pc, pv] = pontosDoTitulo(comp);
    if (h.campeao) somar(h.campeao, pc * w);
    if (h.vice) somar(h.vice, pv * w);
  }
  // Países com mais de uma liga principal no ano (Apertura e Clausura) dividem os pontos da liga.
  const ligasDoPais = new Map<string, number>();
  for (const comp of mundo.competicoes)
    if (ligaPrincipal(comp) && comp.escopo.tipo === "pais")
      ligasDoPais.set(comp.escopo.pais, (ligasDoPais.get(comp.escopo.pais) ?? 0) + 1);
  const anosComLiga = new Map<string, Set<number>>();
  for (const p of c.premios?.ligas ?? []) {
    const comp = mundo.competicao(p.competicao);
    if (!comp || comp.escopo.tipo !== "pais") continue;
    const fim = anoDaTemporada(p.temporada);
    const anos = anosComLiga.get(comp.escopo.pais) ?? new Set<number>();
    anos.add(fim);
    anosComLiga.set(comp.escopo.pais, anos);
    const w = peso(fim);
    if (!w) continue;
    const pl = pesoDaLiga(p.forcaDaLiga) / (ligasDoPais.get(comp.escopo.pais) ?? 1);
    p.tabela.forEach((id, i) => somar(id, (PONTOS_DA_LIGA[i] ?? 0) * pl * w));
  }
  // Os anos já passados sem a temporada jogada na carreira: o estimado pelo nível do clube.
  for (const cl of clubes) {
    const anos = anosComLiga.get(cl.pais);
    let antes = 0;
    for (let a = ano - ANOS_DO_RANKING + 1; a < ano; a++)
      if (a < inicio + 1 && !anos?.has(a)) antes += peso(a);
    if (antes > 0) somar(cl.id, pontosEstimados(cl.nivel) * antes);
  }
  return clubes
    .map((cl) => ({ id: cl.id, pontos: Math.round((pontos.get(cl.id) ?? 0) * 10) / 10 }))
    .sort((a, b) => b.pontos - a.pontos || a.id.localeCompare(b.id));
}

export interface TecnicoNoRanking {
  /** Clube que ele dirige (o do técnico humano é o dele). */
  clube: string;
  nome: string;
  humano: boolean;
  reputacao: number;
  titulos: number;
}

const pesoNaReputacao = (comp: Competicao) =>
  comp.escopo.tipo === "mundial"
    ? 15
    : comp.escopo.tipo === "confederacao"
      ? 12
      : comp.escopo.tipo === "estado"
        ? 2
        : comp.tipo === "liga"
          ? 8
          : 5;

/**
 * Ranking de técnicos pela reputação. Os da CPU partem do tamanho do clube (clube grande tem técnico
 * consagrado: nível menos 15, até 82) e somam os títulos do clube na carreira, que se apagam aos
 * poucos (15% por ano).
 */
export function rankingDeTecnicos(
  c: Carreira,
  mundo: Mundo,
  clubes: readonly Clube[],
  data: string,
): TecnicoNoRanking[] {
  const ano = Number(data.slice(0, 4));
  const bonus = new Map<string, number>();
  const titulos = new Map<string, number>();
  for (const h of c.competicoes.historico) {
    if (!h.campeao) continue;
    const comp = mundo.competicao(h.competicao);
    if (!comp || comp.categoria !== "clubes") continue;
    const idade = Math.max(0, ano - anoDaTemporada(h.temporada));
    bonus.set(h.campeao, (bonus.get(h.campeao) ?? 0) + pesoNaReputacao(comp) * 0.85 ** idade);
    titulos.set(h.campeao, (titulos.get(h.campeao) ?? 0) + 1);
  }
  for (const p of c.premios?.ligas ?? [])
    if (p.tecnico && !p.tecnico.humano) {
      const idade = Math.max(0, ano - anoDaTemporada(p.temporada));
      bonus.set(p.tecnico.clube, (bonus.get(p.tecnico.clube) ?? 0) + 3 * 0.85 ** idade);
    }
  const perfil = perfilDe(c, mundo);
  const lista: TecnicoNoRanking[] = clubes
    .filter((cl) => cl.id !== c.clube)
    .map((cl) => ({
      clube: cl.id,
      nome: "",
      humano: false,
      reputacao: Math.min(
        99,
        Math.round((Math.max(10, Math.min(82, cl.nivel - 15)) + (bonus.get(cl.id) ?? 0)) * 10) / 10,
      ),
      titulos: titulos.get(cl.id) ?? 0,
    }));
  lista.push({
    clube: c.clube,
    nome: c.tecnico,
    humano: true,
    reputacao: Math.round(perfil.reputacao * 10) / 10,
    titulos: perfil.passagens.reduce((s, x) => s + x.titulos.length, 0),
  });
  lista.sort((a, b) => b.reputacao - a.reputacao || Number(b.humano) - Number(a.humano));
  return lista;
}

/** Dá nome aos técnicos da CPU de uma parte do ranking (o nome é gerado só quando aparece). */
export function nomearTecnicos(
  lista: readonly TecnicoNoRanking[],
  mundo: Pick<Mundo, "pais" | "clube">,
  semente: string,
): TecnicoNoRanking[] {
  return lista.map((x) => {
    if (x.humano) return x;
    const clube = mundo.clube(x.clube);
    return clube ? { ...x, nome: tecnicoDaCpu(mundo, clube, semente) } : x;
  });
}

/** Títulos de clubes e seleções que terminaram no ano (para o melhor do mundo). */
function titulosDoAno(
  historico: readonly RegistroHistorico[],
  mundo: Mundo,
  ano: number,
): { clubes: Map<string, number>; selecoes: Map<string, number> } {
  const clubes = new Map<string, number>();
  const selecoes = new Map<string, number>();
  for (const h of historico) {
    if (!h.campeao || anoDaTemporada(h.temporada) !== ano) continue;
    const comp = mundo.competicao(h.competicao);
    if (!comp || comp.tipo === "eliminatorias") continue;
    if (comp.categoria === "selecoes") {
      if (comp.escopo.tipo === "confederacao" && comp.tipo !== "selecoes") continue;
      const v = comp.escopo.tipo === "mundial" ? 6 : 3;
      selecoes.set(h.campeao, Math.max(selecoes.get(h.campeao) ?? 0, v));
    } else if (comp.escopo.tipo !== "pais" && comp.escopo.tipo !== "estado") {
      const v = /champions|libertadores|mundial/.test(comp.id) ? 4 : 1.5;
      clubes.set(h.campeao, (clubes.get(h.campeao) ?? 0) + v);
    }
  }
  return { clubes, selecoes };
}

/**
 * O melhor do mundo do ano que acabou (no 1º de janeiro): entre os premiados das ligas no ano, pela
 * nota, a força da liga e os títulos continentais, mundiais e da seleção.
 */
export function melhorDoMundo(
  c: Carreira,
  mundo: Mundo,
  data: string,
): { carreira: Carreira; noticias: Noticia[] } {
  if (!data.endsWith("-01-01")) return { carreira: c, noticias: [] };
  const ano = Number(data.slice(0, 4)) - 1;
  const premios = c.premios;
  // O ano em que a carreira começou no meio não tem a temporada inteira das ligas: fica sem prêmio.
  if (c.inicio > `${ano}-01-15`) return { carreira: c, noticias: [] };
  if (!premios || premios.mundo.some((x) => x.ano === ano)) return { carreira: c, noticias: [] };
  const doAno = premios.ligas.filter((p) => Number(p.data.slice(0, 4)) === ano);
  const noticias: Noticia[] = [];
  let r = c;
  const titulos = titulosDoAno(c.competicoes.historico, mundo, ano);
  const votos = new Map<string, Premiado>();
  for (const p of doAno) {
    const extra = (p.forcaDaLiga - 70) * 0.6;
    for (const x of p.selecao) {
      const nac = mundo.jogador(x.jogador)?.nacionalidade;
      const nota =
        x.nota +
        extra +
        (p.craque?.jogador === x.jogador ? 2 : 0) +
        (titulos.clubes.get(x.clube) ?? 0) +
        (nac ? (titulos.selecoes.get(nac) ?? 0) : 0);
      const antes = votos.get(x.jogador);
      if (!antes || antes.nota < nota)
        votos.set(x.jogador, { ...x, nota: Math.round(nota * 10) / 10 });
    }
  }
  const ranking = [...votos.values()]
    .sort((a, b) => b.nota - a.nota || a.jogador.localeCompare(b.jogador))
    .slice(0, 10);
  let novos: Premios = premios;
  if (ranking.length) {
    novos = { ...novos, mundo: [{ ano, data, ranking }, ...premios.mundo].slice(0, 30) };
    const melhor = ranking[0]!;
    noticias.push({
      data,
      tipo: "carreira",
      ...marcar("Melhor do mundo de {ano}: {jogador} ({clube}).", {
        ano,
        jogador: melhor.nome,
        clube: mundo.clube(melhor.clube)?.nomeCurto ?? melhor.clube,
      }),
    });
    const meus = ranking.filter((x) => x.clube === c.clube);
    if (meus.length)
      noticias.push({
        data,
        tipo: "elenco",
        ...marcar("Entre os 10 melhores do mundo de {ano}: {jogadores}.", {
          ano,
          jogadores: meus.map((x) => x.nome).join(", "),
        }),
      });
  }
  // As posições nos rankings mundiais, comparadas com as do ano passado.
  const clubes = mundo.clubes ?? [];
  if (clubes.length) {
    const tec = rankingDeTecnicos(r, mundo, clubes, data).findIndex((x) => x.humano) + 1;
    const clu = rankingDeClubes(r, mundo, clubes, data).findIndex((x) => x.id === c.clube) + 1;
    const antes = premios.posicoes;
    if (tec > 0)
      noticias.push({
        data,
        tipo: "carreira",
        ...(antes && antes.tecnico !== tec
          ? marcar(
              tec < antes.tecnico
                ? "Ranking mundial de técnicos: você subiu do {antes}º para o {agora}º lugar."
                : "Ranking mundial de técnicos: você caiu do {antes}º para o {agora}º lugar.",
              { antes: antes.tecnico, agora: tec },
            )
          : marcar("Ranking mundial de técnicos: você é o {agora}º.", { agora: tec })),
      });
    if (clu > 0) novos = { ...novos, posicoes: { tecnico: tec, clube: clu } };
  }
  r = { ...r, premios: novos };
  return { carreira: r, noticias };
}
