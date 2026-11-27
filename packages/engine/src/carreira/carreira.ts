/**
 * Carreira (Fase 8): o estado salvo de um jogo. O mundo (clubes e jogadores) vem do banco mais as
 * edições do editor guardadas na carreira; aqui fica só o que a carreira muda: a data, a agenda,
 * a condição física e o humor de cada jogador, a moral do time, a escalação e as notícias.
 * Tudo é determinístico: o mesmo salvamento, avançado do mesmo jeito, dá o mesmo resultado.
 */
import type {
  Banco,
  Clube,
  Competicao,
  Contrato,
  DataFifa,
  Jogador,
  PapelEmCampo,
  Pais,
  Patch,
} from "@newbras/data";
import { convocar } from "../selecoes/convocacao";
import {
  avancarCompeticao,
  desempateDoJogo,
  jogosDoDia,
  lancarResultado,
  nomeCurtoDaCompeticao,
  nomeDaRodada,
} from "../competicoes/competicao";
import {
  abrirTemporadasFaltando,
  reabrirCompeticoes,
  iniciarMundo,
  jogarDia,
  CHAVE_MUNDIAL,
  chaveDaCompeticao,
  jogosDoClube,
  paisDaCompeticao,
  plantaoDoDia,
  virarTemporadas,
  type JogoSimulado,
  type MundoCompeticoes,
  type RegistroHistorico,
} from "../competicoes/mundo";
import { idadeEm } from "../evolucao";
import { Rng } from "../rng";
import { escalacaoAutomatica } from "../partida/escalacao";
import { rotuloMinuto } from "../partida/narracao";
import { chave, marcar, t } from "@newbras/textos";
import { FORMACOES, type Formacao, type Vaga } from "../partida/formacoes";
import {
  CHANCE_HUMOR,
  TATICA_PADRAO,
  type Escalacao,
  type Humor,
  type JogadorPartida,
  type LadoCampo,
  type OpcoesPartida,
  type ResultadoPartida,
  type Tatica,
  type TimePartida,
} from "../partida/tipos";
import { eventosDoDia, inicioDaCarreira } from "./calendario";
import { dataCurta, somarDias } from "./datas";
import { diaDosConvocados, foraPelaSelecao, noticiaDaConvocacao } from "./selecao";
import { evolucaoDe, mundoNaData } from "../elenco/mundo";
import { elencoSemLesionados, riscoDeLesao } from "../elenco/lesoes";
import { diaDaBase, receberRenascido, type EstadoDaBase, type JogadorDaBase } from "../elenco/base";
import { compactarTransferencias, mercadoDaCpu } from "../mercado/cpu";
import {
  diaDoMercado,
  fimDeContrato,
  type Emprestimo,
  type Leilao,
  type PreContrato,
  type PropostaRecebida,
  type Sondagem,
  type Transferencia,
} from "../mercado/mercado";
import { diaDosNegocios } from "../mercado/negocios";
import { bilheteria, premiacoes, type MesFinanceiro } from "../financas/financas";
import { diaDasFinancas } from "../financas/mes";
import type { CriseDoClube, DividaDaCpu, EmprestimoBancario } from "../financas/crise";
import {
  conversasDepoisDoJogo,
  diaDaDiretoria,
  type Conversa,
  type Diretoria,
  type Promessa,
} from "./conversas";
import {
  depoisDoJogo,
  diaDoElenco,
  lesionado,
  minutosNaVirada,
  moralDe,
  type Lesao,
} from "../elenco/vida";
import { noticiasDoElenco } from "../elenco/noticias";

/** Formato do salvamento; muda quando um salvamento antigo não puder mais ser lido como está. */
export const FORMATO_CARREIRA = 9;

/** Copas que mudaram de formato no formato 9 (as de salvamentos antigos são montadas de novo). */
const COPAS_DA_ETAPA_9E = [
  "eng-fa-cup",
  "eng-league-cup",
  "esp-copa-del-rey",
  "ita-coppa-italia",
  "ger-dfb-pokal",
  "fra-coupe-de-france",
  "por-taca-de-portugal",
  "ned-knvb-beker",
];

/** Amarelos acumulados numa competição que dão um jogo de suspensão. */
export const AMARELOS_SUSPENSAO = 3;

export interface EstadoJogador {
  /** Condição física de 0 a 100. */
  condicao: number;
  humor: Humor;
  /** Jogos seguidos do time em que ficou de fora (quem quer jogar fica de mau humor). */
  semJogar: number;
  jogos: number;
  minutos: number;
  gols: number;
  assistencias: number;
  /** Soma das notas (média = somaNotas / jogos). */
  somaNotas: number;
  amarelos: number;
  vermelhos: number;
  /** Amarelos acumulados por competição (zeram ao virar suspensão). */
  amarelosPorCompeticao?: Record<string, number>;
  /** Jogos de suspensão a cumprir, por competição. */
  suspensoes?: Record<string, number>;
  /** Jogos e gols pela seleção desde o começo da carreira. */
  selecao?: { jogos: number; gols: number };
  /** Lesão: fora até a data. */
  lesao?: Lesao;
  /** Moral do jogador, de 0 a 100 (60 é o normal; sem o campo, 60). */
  moral?: number;
  /** Atacante: jogos seguidos sem marcar. */
  jogosSemGol?: number;
  /** Força a mais (ou a menos) pelos minutos jogados quando jovem, somada à evolução. */
  ajuste?: number;
  /** Minutos totais na última virada de temporada (para contar os da temporada). */
  minutosNaVirada?: number;
}

export interface GolDoJogo {
  minuto: string;
  jogador: string;
  time: LadoCampo;
  contra?: boolean;
}

export interface ResultadoCompromisso {
  placar: [number, number];
  penaltis?: [number, number];
  gols: GolDoJogo[];
}

export interface Compromisso {
  id: string;
  data: string;
  tipo: "amistoso" | "oficial";
  adversario: string;
  /** Onde o time do técnico joga. */
  mando: "casa" | "fora";
  resultado?: ResultadoCompromisso;
  /** Jogo oficial: competição e índice do jogo nela. */
  competicao?: string;
  indice?: number;
  neutro?: boolean;
}

export interface EscalacaoSalva {
  formacao: Formacao | "personalizada";
  vagas: Vaga[];
  titulares: string[];
  reservas: string[];
  papeis: (PapelEmCampo | null)[];
}

export interface FormacaoSalva {
  nome: string;
  vagas: Vaga[];
}

export interface Noticia {
  data: string;
  tipo: "calendario" | "jogo" | "elenco" | "carreira";
  /** Texto em português, que é a chave da tradução (mostrado com `t(texto, params)`). */
  texto: string;
  params?: Readonly<Record<string, string | number>>;
}

export interface Carreira {
  formato: typeof FORMATO_CARREIRA;
  id: string;
  semente: string;
  tecnico: string;
  clube: string;
  inicio: string;
  data: string;
  versaoBanco: string;
  /** Edições do editor que valiam quando a carreira começou (o mundo é montado com elas). */
  patch?: Patch;
  /** Moral do time, de 0 a 100 (50 é neutro). */
  moral: number;
  jogadores: Record<string, EstadoJogador>;
  escalacao: EscalacaoSalva | null;
  tatica: Tatica;
  formacoesSalvas: FormacaoSalva[];
  /** Amistosos (os jogos oficiais ficam nas competições). */
  agenda: Compromisso[];
  noticias: Noticia[];
  /** Ligas, estaduais e copas do mundo inteiro, na temporada de cada país. */
  competicoes: MundoCompeticoes;
  /** Contratos renovados pelo técnico (os outros são os do banco). */
  contratos?: Record<string, Contrato>;
  /** Quem saiu do clube (contrato terminado). */
  saidas?: string[];
  /** Categoria de base: jogadores, olheiros e relatórios (sem o campo, a base do banco). */
  base?: EstadoDaBase;
  /** Quem subiu da base ao profissional (evoluem pela curva desde a promoção). */
  promovidos?: JogadorDaBase[];
  /** Caixa para contratações (sem o campo, 10% do valor do elenco no começo). */
  caixa?: number;
  /** Mudanças de clube: compras, vendas, dispensas, fim de contrato e livres contratados. */
  transferencias?: Transferencia[];
  /** Jogadores do técnico à venda. */
  aVenda?: string[];
  /** Propostas da CPU por jogadores do técnico. */
  propostas?: PropostaRecebida[];
  /** Jogadores do técnico oferecidos por empréstimo. */
  aEmprestimo?: string[];
  /** Empréstimos em andamento no mundo (do técnico e entre clubes da CPU). */
  emprestimos?: Emprestimo[];
  /** Pré-contratos assinados com o clube do técnico ou com jogadores dele. */
  preContratos?: PreContrato[];
  /** Leilões abertos (do técnico e de clubes da CPU). */
  leiloes?: Leilao[];
  /** Jogadores do técnico sondados por clubes da CPU no fim do contrato. */
  sondagens?: Sondagem[];
  /** Extrato do clube do técnico, mês a mês (etapa 14a). */
  financas?: MesFinanceiro[];
  /** Caixa de cada clube da CPU (os que ainda não mexeram usam o inicial sorteado). */
  caixasCpu?: Record<string, number>;
  /** Conversas de jogadores e da diretoria esperando resposta. */
  conversas?: Conversa[];
  /** Última conversa de cada jogador (ele não volta a procurar o técnico tão cedo). */
  conversasRecentes?: Record<string, string>;
  /** Promessas do técnico a jogadores. */
  promessas?: Promessa[];
  /** Confiança e metas da diretoria. */
  diretoria?: Diretoria;
  /** Salários atrasados e punições do clube do técnico (etapa 14b). */
  crise?: CriseDoClube;
  /** Empréstimos do técnico no banco. */
  emprestimosBancarios?: EmprestimoBancario[];
  /** Dívida bancária dos clubes da CPU em crise. */
  dividasCpu?: Record<string, DividaDaCpu>;
  /** Garotos que os clubes da CPU subiram da base (crise ou elenco curto). */
  garotosCpu?: JogadorDaBase[];
}

/** O que a carreira precisa saber do mundo. */
export interface Mundo {
  competicoes: readonly Competicao[];
  competicao(id: string): Competicao | undefined;
  clube(id: string): Clube | undefined;
  jogador(id: string): Jogador | undefined;
  /** Elenco profissional do clube (sem a categoria de base). */
  elenco(clube: string): readonly Jogador[];
  pais(codigo: string): Pais | undefined;
  clubesDoPais(codigo: string): readonly Clube[];
  datasFifa: readonly DataFifa[];
  /** Todos os clubes (o mundo evolui com eles; sem a lista, fica parado). */
  clubes?: readonly Clube[];
  /** Categoria de base do clube no banco. */
  base?(clube: string): readonly Jogador[];
}

export function mundoDoBanco(banco: Banco): Mundo {
  const clubes = new Map(banco.clubes.map((c) => [c.id, c]));
  const jogadores = new Map(banco.jogadores.map((j) => [j.id, j]));
  const paises = new Map(banco.paises.map((p) => [p.codigo, p]));
  const competicoes = new Map(banco.competicoes.map((c) => [c.id, c]));
  const elencos = new Map<string, Jogador[]>();
  const bases = new Map<string, Jogador[]>();
  for (const j of banco.jogadores) {
    if (!j.clube) continue;
    const mapa = j.base ? bases : elencos;
    const lista = mapa.get(j.clube);
    if (lista) lista.push(j);
    else mapa.set(j.clube, [j]);
  }
  const porPais = new Map<string, Clube[]>();
  for (const c of banco.clubes) {
    const lista = porPais.get(c.pais);
    if (lista) lista.push(c);
    else porPais.set(c.pais, [c]);
  }
  // Seleções: a convocação dos melhores de cada nacionalidade, montada na primeira vez.
  let porNacionalidade: Map<string, Jogador[]> | undefined;
  const convocacoes = new Map<string, Jogador[]>();
  const convocacao = (pais: string) => {
    let lista = convocacoes.get(pais);
    if (!lista) {
      if (!porNacionalidade) {
        porNacionalidade = new Map();
        for (const j of banco.jogadores) {
          if (!j.clube || j.base) continue;
          const l = porNacionalidade.get(j.nacionalidade);
          if (l) l.push(j);
          else porNacionalidade.set(j.nacionalidade, [j]);
        }
      }
      lista = convocar(pais, porNacionalidade.get(pais) ?? []);
      convocacoes.set(pais, lista);
    }
    return lista;
  };
  return {
    competicoes: banco.competicoes,
    competicao: (id) => competicoes.get(id),
    clube: (id) => clubes.get(id),
    jogador: (id) => jogadores.get(id),
    elenco: (id) => (/^[A-Z]{3}$/.test(id) ? convocacao(id) : (elencos.get(id) ?? [])),
    pais: (codigo) => paises.get(codigo),
    clubesDoPais: (codigo) => porPais.get(codigo) ?? [],
    datasFifa: banco.datasFifa,
    clubes: banco.clubes,
    base: (id) => bases.get(id) ?? [],
  };
}

const HUMORES: readonly Humor[] = ["pessimo", "ruim", "normal", "bom", "otimo"];
const sobe = (h: Humor) => HUMORES[Math.min(4, HUMORES.indexOf(h) + 1)] as Humor;
const desce = (h: Humor) => HUMORES[Math.max(0, HUMORES.indexOf(h) - 1)] as Humor;

/** Chance, por dia, de o humor mudar um degrau (o humor dura alguns dias: sequências). */
export const CHANCE_MUDAR_HUMOR = 0.15;
/** Abaixo disso a escalação avisa "melhor poupar". */
export const CONDICAO_POUPAR = 70;
/** Quantas notícias o salvamento guarda. */
const MAX_NOTICIAS = 200;
/** Amistosos de pré-temporada marcados ao começar. */
const AMISTOSOS_PRE_TEMPORADA = [6, 11, 16];

function estadoNovo(humor: Humor): EstadoJogador {
  return {
    condicao: 100,
    humor,
    semJogar: 0,
    jogos: 0,
    minutos: 0,
    gols: 0,
    assistencias: 0,
    somaNotas: 0,
    amarelos: 0,
    vermelhos: 0,
  };
}

const sortearHumor = (rng: Rng): Humor => rng.weighted(HUMORES, (h) => CHANCE_HUMOR[h]);

export interface OpcoesNovaCarreira {
  id: string;
  semente: string;
  tecnico: string;
  clube: string;
  /** Data de referência do banco (os elencos são os dessa data). */
  referencia: string;
  versaoBanco: string;
  patch?: Patch;
}

/** Começa uma carreira na pré-temporada do país do clube, com amistosos já marcados. */
export function novaCarreira(mundo: Mundo, o: OpcoesNovaCarreira): Carreira {
  const clube = mundo.clube(o.clube);
  if (!clube) throw new Error(`clube "${o.clube}" não existe`);
  const pais = mundo.pais(clube.pais);
  if (!pais) throw new Error(`país "${clube.pais}" não existe`);
  const inicio = inicioDaCarreira(pais, o.referencia);
  const rng = new Rng(`${o.semente}:inicio`);
  const jogadores: Record<string, EstadoJogador> = {};
  for (const j of mundo.elenco(clube.id)) jogadores[j.id] = estadoNovo(sortearHumor(rng));

  // Adversários da pré-temporada: clubes do mesmo país, de nível parecido.
  const parecidos = mundo
    .clubesDoPais(clube.pais)
    .filter((c) => c.id !== clube.id && !c.filialDe && Math.abs(c.nivel - clube.nivel) <= 12);
  const adversarios = rng.shuffle(
    parecidos.length >= 3
      ? parecidos
      : mundo.clubesDoPais(clube.pais).filter((c) => c.id !== clube.id),
  );
  const agenda: Compromisso[] = AMISTOSOS_PRE_TEMPORADA.flatMap((dias, i) => {
    const adversario = adversarios[i];
    return adversario
      ? [
          {
            id: `amistoso-${i + 1}`,
            data: somarDias(inicio, dias),
            tipo: "amistoso" as const,
            adversario: adversario.id,
            mando: i % 2 === 0 ? ("casa" as const) : ("fora" as const),
          },
        ]
      : [];
  });

  return {
    formato: FORMATO_CARREIRA,
    id: o.id,
    semente: o.semente,
    tecnico: o.tecnico.trim() || "Técnico",
    clube: clube.id,
    inicio,
    data: inicio,
    versaoBanco: o.versaoBanco,
    ...(o.patch ? { patch: o.patch } : {}),
    moral: 50,
    jogadores,
    escalacao: null,
    tatica: { ...TATICA_PADRAO },
    formacoesSalvas: [],
    agenda,
    competicoes: iniciarMundo(mundo, inicio, o.semente),
    noticias: [
      {
        data: inicio,
        tipo: "carreira",
        ...marcar(
          "{tecnico} assume o {clube}. A pré-temporada começa hoje, com {amistosos} amistosos marcados.",
          {
            tecnico: o.tecnico.trim() || "Técnico",
            clube: clube.nomeCurto,
            amistosos: agenda.length,
          },
        ),
      },
    ],
  };
}

/** Estado do jogador na carreira; quem a carreira ainda não acompanha está descansado. */
export function estadoDe(c: Carreira, id: string): EstadoJogador {
  return c.jogadores[id] ?? estadoNovo(sortearHumor(new Rng(`${c.semente}:${c.data}:${id}`)));
}

/** "Melhor poupar": cansado ou num dia ruim. */
export function avisoPoupar(e: Pick<EstadoJogador, "condicao" | "humor">): string | null {
  if (e.condicao < CONDICAO_POUPAR) return `cansado (${Math.round(e.condicao)}%)`;
  if (e.humor === "pessimo") return "humor péssimo";
  if (e.humor === "ruim") return "humor ruim";
  return null;
}

/** Jogos oficiais do time do técnico na temporada atual de cada competição. */
export function compromissosOficiais(c: Carreira): Compromisso[] {
  return jogosDoClube(c.competicoes, c.clube).flatMap(({ competicao, indice, data }) => {
    const j = c.competicoes.competicoes[competicao]?.jogos[indice];
    if (!j) return [];
    const casa = j.casa === c.clube;
    return [
      {
        id: `${competicao}#${indice}`,
        data,
        tipo: "oficial" as const,
        competicao,
        indice,
        adversario: casa ? j.fora : j.casa,
        mando: casa ? ("casa" as const) : ("fora" as const),
        ...(j.neutro ? { neutro: true } : {}),
        ...(j.placar
          ? {
              resultado: {
                placar: [j.placar[0], j.placar[1]] as [number, number],
                ...(j.penaltis
                  ? { penaltis: [j.penaltis[0], j.penaltis[1]] as [number, number] }
                  : {}),
                gols: [],
              },
            }
          : {}),
      },
    ];
  });
}

/** Amistosos e jogos oficiais, em ordem de data. */
export function agendaCompleta(c: Carreira): Compromisso[] {
  return [...c.agenda, ...compromissosOficiais(c)].sort(
    (a, b) => a.data.localeCompare(b.data) || (a.tipo === "oficial" ? -1 : 1),
  );
}

/** Compromisso ainda não jogado no dia de hoje (ele precisa ser jogado antes de avançar). */
export function compromissoDoDia(c: Carreira): Compromisso | undefined {
  return agendaCompleta(c).find((x) => x.data === c.data && !x.resultado);
}

export function proximoCompromisso(c: Carreira): Compromisso | undefined {
  return agendaCompleta(c).find((x) => !x.resultado && x.data >= c.data);
}

/** Nome do compromisso: "Amistoso" ou a competição e a rodada. */
export function nomeDoCompromisso(c: Carreira, mundo: Mundo, x: Compromisso): string {
  if (x.tipo !== "oficial" || !x.competicao) return t("Amistoso");
  const comp = mundo.competicao(x.competicao);
  const e = c.competicoes.competicoes[x.competicao];
  const j = e?.jogos[x.indice ?? -1];
  if (!comp || !e || !j) return comp ? nomeCurtoDaCompeticao(comp) : t("Jogo oficial");
  return `${nomeCurtoDaCompeticao(comp)}, ${nomeDaRodada(comp, e, j)}`;
}

/** Quem está suspenso na competição (só o elenco do técnico conta cartões por enquanto). */
export function suspensosNaCompeticao(c: Carreira, competicao: string | undefined): Set<string> {
  const ids = new Set<string>();
  if (!competicao) return ids;
  for (const [id, e] of Object.entries(c.jogadores))
    if ((e.suspensoes?.[competicao] ?? 0) > 0) ids.add(id);
  return ids;
}

/** Quem não pode jogar: os suspensos na competição e os que estão com a seleção na data. */
export function indisponiveisNoJogo(
  c: Carreira,
  mundo: Mundo,
  competicao: string | undefined,
  data: string,
): Set<string> {
  const ids = suspensosNaCompeticao(c, competicao);
  for (const id of foraPelaSelecao(c, mundo, data).keys()) ids.add(id);
  for (const [id, e] of Object.entries(c.jogadores)) if (lesionado(e, data)) ids.add(id);
  return ids;
}

function noticia(c: Carreira, n: Noticia): Noticia[] {
  return [n, ...c.noticias].slice(0, MAX_NOTICIAS);
}

/** Recuperação de um dia: mais rápida com resistência alta, mais lenta depois dos 30. */
export function recuperacaoDiaria(j: Pick<Jogador, "atributos" | "nascimento">, data: string) {
  const resistencia = j.atributos.resistencia ?? 60;
  const idade = idadeEm(j.nascimento, data);
  return Math.max(4, Math.min(22, 8 + resistencia * 0.12 - Math.max(0, idade - 30) * 0.6));
}

/** Para onde o humor puxa hoje: moral do time, cansaço e falta de jogos. */
function pesosHumor(e: EstadoJogador, moralDoTime: number): (h: Humor) => number {
  // A moral do time e a do jogador puxam juntas.
  const moral = (moralDoTime + moralDe(e)) / 2;
  const m = (Math.max(0, Math.min(100, moral)) - 50) / 50;
  return (h) => {
    let p = CHANCE_HUMOR[h];
    const ruim = h === "ruim" || h === "pessimo";
    const bom = h === "bom" || h === "otimo";
    if (bom) p *= 1 + 0.6 * m;
    if (ruim) p *= 1 - 0.6 * m;
    if (ruim && e.condicao < 60) p *= 1.8;
    if (ruim && e.semJogar >= 2) p *= 1.5;
    return p;
  };
}

/** Um dia de descanso e de humor para quem a carreira acompanha. */
function viverDia(c: Carreira, mundo: Mundo, data: string): Record<string, EstadoJogador> {
  const rng = new Rng(`${c.semente}:dia:${data}`);
  const novos: Record<string, EstadoJogador> = {};
  for (const id of Object.keys(c.jogadores).sort()) {
    const e = c.jogadores[id] as EstadoJogador;
    const j = mundo.jogador(id);
    let humor = e.humor;
    if (rng.chance(CHANCE_MUDAR_HUMOR)) {
      const alvo = rng.weighted(HUMORES, pesosHumor(e, c.moral));
      const atual = HUMORES.indexOf(humor);
      const destino = HUMORES.indexOf(alvo);
      if (destino > atual) humor = sobe(humor);
      else if (destino < atual) humor = desce(humor);
    }
    const condicao = j ? Math.min(100, e.condicao + recuperacaoDiaria(j, data)) : 100;
    novos[id] = { ...e, humor, condicao: Math.round(condicao * 10) / 10 };
  }
  return novos;
}

export interface Avanco {
  carreira: Carreira;
  /** Notícias novas desse avanço (as mais novas primeiro). */
  novidades: Noticia[];
  /** Por que parou: dia de jogo, limite de dias. */
  /** "decisao": algo pede resposta do técnico (o avanço até o jogo para). */
  parouPor: "dia" | "jogo" | "limite" | "decisao";
}

/** Avança um dia. Com jogo marcado para hoje, não avança: o jogo vem antes. */
export function avancarDia(c: Carreira, mundoDoBanco: Mundo): Avanco {
  if (compromissoDoDia(c)) return { carreira: c, novidades: [], parouPor: "jogo" };
  // O mundo de hoje (o dia que fecha) e o de amanhã (pode ser o começo de uma temporada).
  const mundo = mundoNaData(mundoDoBanco, c, c.data);
  const mundoAmanha = mundoNaData(mundoDoBanco, c, somarDias(c.data, 1));
  // Fecha o dia: os jogos de hoje no mundo inteiro.
  const antes = c.competicoes;
  let competicoes = jogarDia(mundo, c.competicoes, c.data, c.semente);
  const data = somarDias(c.data, 1);
  const virada = virarTemporadas(mundo, competicoes, data, c.semente);
  competicoes = virada.estado;
  const clube = mundo.clube(c.clube);
  const pais = clube ? mundo.pais(clube.pais) : undefined;
  const eventos = pais ? eventosDoDia(data, pais, mundo.datasFifa) : [];
  let noticias = c.noticias;
  const novidades: Noticia[] = [];
  for (const ev of eventos) {
    const n: Noticia = {
      data,
      tipo: "calendario",
      texto: ev.texto,
      ...(ev.params ? { params: ev.params } : {}),
    };
    novidades.unshift(n);
    noticias = [n, ...noticias].slice(0, MAX_NOTICIAS);
  }
  // Campeões e acessos da temporada do país do técnico, das continentais da confederação dele e das
  // competições mundiais.
  const continental = pais ? `conf:${pais.confederacao}` : "";
  // Títulos e vices do técnico nas competições que acabaram hoje (premiação, etapa 14a).
  const premiadas = new Map<string, RegistroHistorico>();
  for (const v of virada.encerradas) {
    for (const h of competicoes.historico.filter((x) => x.temporada === v.temporada)) {
      const comp = mundo.competicao(h.competicao);
      if (!comp || chaveDaCompeticao(comp) !== v.pais) continue;
      if (h.campeao === c.clube || h.vice === c.clube) premiadas.set(h.competicao, h);
    }
  }
  for (const v of virada.encerradas) {
    if (v.pais !== clube?.pais && v.pais !== continental && v.pais !== CHAVE_MUNDIAL) continue;
    for (const h of competicoes.historico.filter((x) => x.temporada === v.temporada)) {
      const comp = mundo.competicao(h.competicao);
      if (!comp || !h.campeao || comp.escopo.tipo === "estado") continue;
      if (chaveDaCompeticao(comp) !== v.pais) continue;
      const n: Noticia = {
        data,
        tipo: "carreira",
        ...marcar("{competicao} {temporada}: {campeao} campeão.", {
          competicao: nomeCurtoDaCompeticao(comp),
          temporada: v.temporada,
          campeao: mundo.clube(h.campeao)?.nomeCurto ?? h.campeao,
        }),
      };
      novidades.unshift(n);
      noticias = [n, ...noticias].slice(0, MAX_NOTICIAS);
    }
    for (const mv of v.movimentos.filter((x) => x.clube === c.clube)) {
      const destino = mundo.competicao(mv.para);
      const n: Noticia = {
        data,
        tipo: "carreira",
        ...marcar(
          mv.tipo === "acesso"
            ? "Acesso! O {clube} vai disputar a {destino} na próxima temporada."
            : "Rebaixado: o {clube} vai para a {destino} na próxima temporada.",
          {
            clube: clube?.nomeCurto ?? c.clube,
            destino: destino?.nomeCurto ?? destino?.nome ?? mv.para,
          },
        ),
      };
      novidades.unshift(n);
      noticias = [n, ...noticias].slice(0, MAX_NOTICIAS);
    }
  }
  const proximo: Carreira = { ...c, data, competicoes };
  const jogo = compromissoDoDia(proximo);
  if (jogo) {
    const adv = mundo.clube(jogo.adversario);
    const n: Noticia = {
      data,
      tipo: "jogo",
      ...marcar(
        jogo.mando === "casa"
          ? "Dia de jogo: {jogo}, contra o {adversario}."
          : "Dia de jogo: {jogo}, na casa do {adversario}.",
        {
          jogo: nomeDoCompromisso(proximo, mundo, jogo),
          adversario: adv?.nomeCurto ?? jogo.adversario,
        },
      ),
    };
    novidades.unshift(n);
    noticias = [n, ...noticias].slice(0, MAX_NOTICIAS);
  }
  // Convocados: quem jogou pela seleção ontem e quem se apresenta hoje.
  const convocados = diaDosConvocados(
    c,
    mundo,
    antes,
    competicoes,
    c.data,
    viverDia(c, mundoAmanha, data),
  );
  const apresentacao = noticiaDaConvocacao(
    mundo,
    foraPelaSelecao(c, mundo, c.data),
    foraPelaSelecao(proximo, mundoAmanha, data),
    data,
  );
  // Temporada nova no elenco: aposentadorias, juniores, lendas que renascem e a evolução. Os
  // minutos da temporada que acabou pesam na força dos jovens.
  const evolucao = evolucaoDe(mundoDoBanco, c);
  const virou =
    !!evolucao && evolucao.dataDoClube(c.clube, c.data) !== evolucao.dataDoClube(c.clube, data);
  const elenco = noticiasDoElenco(
    c,
    mundo,
    mundoAmanha,
    data,
    virou ? minutosNaVirada(mundo, c.clube, data, convocados.jogadores) : convocados.jogadores,
  );
  // Lesões, moral e contratos do dia; a base (olheiros, peneira e dispensas).
  const dia = diaDoElenco(c, mundoAmanha, data, elenco.jogadores);
  let base = diaDaBase(c, mundoAmanha, data, virou);
  // Sorte grande: uma lenda renascida caiu na base do clube.
  if (evolucao?.ativo(data))
    for (const e of evolucao.eventos(data)) {
      if (e.tipo !== "renascimento" || e.clube !== c.clube) continue;
      const j = evolucao.jogador(e.id, data);
      if (j)
        base = {
          ...base,
          base: receberRenascido(
            { ...c, ...(base.base ? { base: base.base } : {}) },
            mundoAmanha,
            j,
            data,
          ),
        };
    }
  const mercado = diaDoMercado(c, mundoAmanha, data);
  const cpu = mercadoDaCpu(c, mundoAmanha, data);
  for (const n of [
    ...convocados.noticias,
    ...(apresentacao ? [apresentacao] : []),
    ...elenco.noticias,
    ...dia.noticias,
    ...base.noticias,
    ...mercado.noticias,
    ...cpu.noticias,
  ]) {
    novidades.unshift(n);
    noticias = [n, ...noticias].slice(0, MAX_NOTICIAS);
  }
  const carreira: Carreira = {
    ...c,
    data,
    competicoes,
    jogadores: dia.jogadores,
    ...(base.base ? { base: base.base } : {}),
    ...(mercado.propostas !== c.propostas ? { propostas: mercado.propostas ?? [] } : {}),
    ...(cpu.transferencias.length || data.endsWith("-07-01")
      ? {
          transferencias: compactarSeFor(
            [...(c.transferencias ?? []), ...cpu.transferencias],
            c.clube,
            data,
          ),
        }
      : {}),
    moral: Math.round((c.moral + (50 - c.moral) * 0.02) * 10) / 10,
    noticias,
  };
  // Quem terminou o contrato fica livre (no mercado) ou vai para quem assinou o pré-contrato.
  const final = dia.saidas.length ? fimDeContrato(carreira, dia.saidas, data) : carreira;
  // Empréstimos que acabam, pré-contratos que chegam, leilões e os empréstimos da CPU.
  const negocios = diaDosNegocios(final, mundoAmanha, data);
  for (const n of negocios.noticias) novidades.unshift(n);
  // Finanças: premiações, o fechamento do mês e o caixa da CPU.
  const premios = premiacoes(negocios.carreira, mundoAmanha, data, [...premiadas.values()]);
  const financasDoDia = diaDasFinancas(premios.carreira, mundoAmanha, data);
  // Diretoria e conversas: metas, prazos, avaliação mensal, cobranças.
  const diretoria = diaDaDiretoria(financasDoDia.carreira, mundoAmanha, data);
  for (const n of diretoria.noticias) novidades.unshift(n);
  const financas = { carreira: diretoria.carreira, noticias: financasDoDia.noticias };
  const extras = [...premios.noticias, ...financas.noticias];
  for (const n of extras) novidades.unshift(n);
  const comFinancas = extras.length
    ? {
        ...financas.carreira,
        noticias: [...extras, ...financas.carreira.noticias].slice(0, MAX_NOTICIAS),
      }
    : financas.carreira;
  return {
    carreira: comFinancas,
    novidades,
    parouPor: jogo ? "jogo" : negocios.decisao || diretoria.decisao ? "decisao" : "dia",
  };
}

/** No 1º de julho, a lista de transferências encolhe (fica a última de cada jogador). */
function compactarSeFor(lista: Transferencia[], clube: string, data: string): Transferencia[] {
  return data.endsWith("-07-01") ? compactarTransferencias(lista, clube, data) : lista;
}

/** Avança até o próximo dia de jogo (ou até o limite de dias). */
export function avancarAteJogo(c: Carreira, mundo: Mundo, limite = 120): Avanco {
  let atual = c;
  const novidades: Noticia[] = [];
  for (let i = 0; i < limite; i++) {
    const r = avancarDia(atual, mundo);
    novidades.unshift(...r.novidades);
    if (r.carreira === atual) return { carreira: atual, novidades, parouPor: "jogo" };
    atual = r.carreira;
    if (r.parouPor === "jogo" || r.parouPor === "decisao")
      return { carreira: atual, novidades, parouPor: r.parouPor };
  }
  return { carreira: atual, novidades, parouPor: "limite" };
}

/** Problemas de um amistoso pedido pelo técnico (lista vazia = pode marcar). */
export function problemasDoAmistoso(
  c: Carreira,
  mundo: Mundo,
  pedido: { data: string; adversario: string },
): string[] {
  const problemas: string[] = [];
  // Textos em português (chaves da tradução): a interface mostra com t().
  const p = (texto: string) => problemas.push(texto);
  if (pedido.data <= c.data) p(chave("escolha uma data a partir de amanhã"));
  if (pedido.adversario === c.clube) p(chave("o time não pode jogar contra ele mesmo"));
  if (!mundo.clube(pedido.adversario)) p(chave("adversário não encontrado"));
  else if (mundo.elenco(pedido.adversario).length < 11)
    p(chave("o adversário não tem 11 jogadores"));
  if (agendaCompleta(c).some((x) => x.data === pedido.data)) p(chave("já há um jogo nesse dia"));
  else if (jogosDoClube(c.competicoes, pedido.adversario).some((x) => x.data === pedido.data))
    p(chave("o adversário tem jogo oficial nesse dia"));
  return problemas;
}

export function marcarAmistoso(
  c: Carreira,
  mundo: Mundo,
  pedido: { data: string; adversario: string; mando: "casa" | "fora" },
): Carreira {
  if (problemasDoAmistoso(c, mundo, pedido).length) return c;
  const numero = Math.max(0, ...c.agenda.map((x) => Number(x.id.split("-").at(-1)) || 0)) + 1;
  const adv = mundo.clube(pedido.adversario);
  const agenda = [
    ...c.agenda,
    { id: `amistoso-${numero}`, tipo: "amistoso" as const, ...pedido },
  ].sort((a, b) => a.data.localeCompare(b.data));
  return {
    ...c,
    agenda,
    noticias: noticia(c, {
      data: c.data,
      tipo: "jogo",
      ...marcar(
        pedido.mando === "casa"
          ? "Amistoso marcado: {adversario} em {data} (em casa)."
          : "Amistoso marcado: {adversario} em {data} (fora).",
        { adversario: adv?.nomeCurto ?? pedido.adversario, data: dataCurta(pedido.data) },
      ),
    }),
  };
}

export function desmarcarAmistoso(c: Carreira, id: string): Carreira {
  const alvo = c.agenda.find((x) => x.id === id);
  if (!alvo || alvo.resultado || alvo.data <= c.data) return c;
  return { ...c, agenda: c.agenda.filter((x) => x.id !== id) };
}

/** Jogador do banco com o estado da carreira, pronto para o motor. */
export function jogadorParaPartida(j: Jogador, e: EstadoJogador): JogadorPartida {
  return {
    id: j.id,
    nome: j.nome,
    posicao: j.posicao,
    lado: j.lado,
    forca: j.forca,
    atributos: j.atributos,
    condicao: Math.round(e.condicao),
    humor: e.humor,
    ...(j.posicoesCampo ? { posicoesCampo: j.posicoesCampo } : {}),
    ...(j.numero !== undefined ? { numero: j.numero } : {}),
  };
}

/**
 * Elenco do clube com o estado da carreira e o risco de lesão de cada um. Os clubes da CPU vêm sem
 * os lesionados deles.
 */
export function elencoParaPartida(c: Carreira, mundo: Mundo, clube: string): JogadorPartida[] {
  const humano = clube === c.clube;
  const elenco = humano
    ? mundo.elenco(clube)
    : elencoSemLesionados(mundo.elenco(clube), c.competicoes.lesionados, clube, c.data);
  return elenco.map((j) => {
    const e = estadoDe(c, j.id);
    return {
      ...jogadorParaPartida(j, e),
      risco: riscoDeLesao(j, c.data, c.semente, humano ? e.lesao : undefined),
    };
  });
}

/**
 * Escalação salva pelo técnico, conferida contra o elenco de hoje (quem saiu do clube some e a
 * vaga é preenchida pela escalação automática). Sem escalação salva, vale a automática.
 */
export function escalacaoDoTecnico(
  c: Carreira,
  jogadores: readonly JogadorPartida[],
  indisponiveis: ReadonlySet<string> = new Set(),
): Escalacao {
  const salva = c.escalacao;
  const vagas = salva?.vagas ?? FORMACOES["4-4-2"];
  const automatica = escalacaoAutomatica(jogadores, salva ? vagas : "4-4-2", { indisponiveis });
  if (!salva) return automatica;
  const ids = new Set(jogadores.filter((j) => !indisponiveis.has(j.id)).map((j) => j.id));
  const usados = new Set<string>();
  const titulares = vagas.map((_, i) => {
    const id = salva.titulares[i];
    if (id && ids.has(id) && !usados.has(id)) {
      usados.add(id);
      return id;
    }
    return "";
  });
  // Vaga que ficou vazia: o melhor da automática que ainda não está escalado.
  titulares.forEach((id, i) => {
    if (id) return;
    const sugerido = [
      automatica.titulares[i],
      ...automatica.titulares,
      ...automatica.reservas,
    ].find((x) => x && !usados.has(x));
    if (sugerido) {
      usados.add(sugerido);
      titulares[i] = sugerido;
    }
  });
  const reservas = [...salva.reservas, ...automatica.reservas]
    .filter((id) => ids.has(id) && !usados.has(id))
    .filter((id, i, l) => l.indexOf(id) === i)
    .slice(0, 9);
  return {
    formacao: salva.formacao === "personalizada" ? "personalizada" : salva.formacao,
    vagas,
    titulares,
    reservas,
    papeis: vagas.map((_, i) => salva.papeis[i] ?? null),
  };
}

/** Time de um lado do compromisso: o do técnico com a escalação dele; o da CPU, com rodízio. */
export function timeDoCompromisso(
  c: Carreira,
  mundo: Mundo,
  clubeId: string,
  competicao?: string,
  data?: string,
): TimePartida {
  const clube = mundo.clube(clubeId);
  const jogadores = elencoParaPartida(c, mundo, clubeId);
  const humano = clubeId === c.clube;
  const suspensos = humano
    ? indisponiveisNoJogo(c, mundo, competicao, data ?? c.data)
    : new Set<string>();
  return {
    id: clubeId,
    nome: clube?.nomeCurto ?? clubeId,
    jogadores,
    // A CPU escala pela nota na vaga, já descontando cansaço e humor: é o rodízio.
    escalacao: humano
      ? escalacaoDoTecnico(c, jogadores, suspensos)
      : escalacaoAutomatica(jogadores, "4-4-2"),
    tatica: humano ? c.tatica : TATICA_PADRAO,
    cpu: !humano,
    ...(humano ? { moral: c.moral } : {}),
  };
}

/** Opções da partida de um compromisso (a semente sai da carreira e do compromisso). */
export function partidaDoCompromisso(c: Carreira, mundo: Mundo, x: Compromisso): OpcoesPartida {
  const nosso = timeDoCompromisso(c, mundo, c.clube, x.competicao, x.data);
  const deles = timeDoCompromisso(c, mundo, x.adversario, x.competicao, x.data);
  const base: OpcoesPartida = {
    semente: `${c.semente}:${c.competicoes.temporadas[mundo.clube(c.clube)?.pais ?? ""]?.nome ?? ""}:${x.id}`,
    casa: x.mando === "casa" ? nosso : deles,
    fora: x.mando === "casa" ? deles : nosso,
    ...(x.neutro ? { neutro: true } : {}),
  };
  if (x.tipo !== "oficial" || !x.competicao) return base;
  const comp = mundo.competicao(x.competicao);
  const e = c.competicoes.competicoes[x.competicao];
  const j = e?.jogos[x.indice ?? -1];
  if (!comp || !e || !j) return base;
  const d = desempateDoJogo(comp, e, j);
  return { ...base, desempate: d.desempate, ...(d.agregado ? { agregado: d.agregado } : {}) };
}

/**
 * Os outros jogos do dia no país do técnico, já simulados, para o plantão de gols: primeiro os da
 * competição do jogo, depois os das outras. São os mesmos placares que o dia vai registrar.
 */
export function plantaoDoCompromisso(c: Carreira, mundo: Mundo, x: Compromisso): JogoSimulado[] {
  const pais = mundo.clube(c.clube)?.pais;
  // A competição do jogo, as ligas da 1ª divisão para baixo, as copas e, por último, os estaduais.
  const peso = { liga: 1, supercopa: 2, copa: 2, regional: 3, estadual: 4 } as Record<
    string,
    number
  >;
  const ordem = (id: string) => {
    if (id === x.competicao) return 0;
    const comp = mundo.competicao(id);
    return (peso[comp?.tipo ?? ""] ?? 5) * 10 + (comp?.divisao ?? 0);
  };
  const ids = Object.values(c.competicoes.competicoes)
    .filter((e) => {
      const comp = mundo.competicao(e.id);
      return (
        comp &&
        (e.id === x.competicao || paisDaCompeticao(comp) === pais) &&
        jogosDoDia(e, c.data).length > 0
      );
    })
    .map((e) => e.id)
    .sort((a, b) => ordem(a) - ordem(b) || a.localeCompare(b));
  return plantaoDoDia(
    mundo,
    c.competicoes,
    c.data,
    c.semente,
    ids,
    (id, i) => x.tipo === "oficial" && id === x.competicao && i === x.indice,
  );
}

/** Lança o resultado do jogo: condição, humor, números dos jogadores, moral e notícia. */
export function registrarJogo(
  c: Carreira,
  mundo: Mundo,
  compromissoId: string,
  r: ResultadoPartida,
): Carreira {
  const x = agendaCompleta(c).find((y) => y.id === compromissoId);
  if (!x || x.resultado) return c;
  // Depois do placar e dos cartões: lesões e a moral de cada jogador; em casa, a bilheteria; e as
  // conversas (promessas, diretoria e o vestiário).
  const depois = bilheteria(depoisDoJogo(c, lancarJogo(c, mundo, x, r), mundo, x, r), mundo, x);
  return conversasDepoisDoJogo(c, depois, mundo, x, r).carreira;
}

function lancarJogo(c: Carreira, mundo: Mundo, x: Compromisso, r: ResultadoPartida): Carreira {
  const nosso: LadoCampo = x.mando === "casa" ? "casa" : "fora";
  const [gc, gf] = r.placar;
  const pro = nosso === "casa" ? gc : gf;
  const contra = nosso === "casa" ? gf : gc;
  const rng = new Rng(`${c.semente}:pos-jogo:${x.id}`);
  const jogadores = { ...c.jogadores };

  const usados = new Set<string>();
  for (const e of r.jogadores) {
    if (e.minutos <= 0) continue;
    usados.add(e.id);
    const antes = estadoDe(c, e.id);
    let humor = antes.humor;
    if (e.nota >= 7.5 && rng.chance(0.6)) humor = sobe(humor);
    else if (e.nota <= 5.5 && rng.chance(0.5)) humor = desce(humor);
    const meu = e.time === nosso;
    const venceu = meu ? pro > contra : contra > pro;
    const perdeu = meu ? pro < contra : contra < pro;
    if (venceu && rng.chance(0.15)) humor = sobe(humor);
    if (perdeu && rng.chance(0.15)) humor = desce(humor);
    jogadores[e.id] = {
      ...antes,
      humor,
      condicao: Math.round(e.condicaoFinal * 10) / 10,
      semJogar: 0,
      jogos: antes.jogos + 1,
      minutos: antes.minutos + e.minutos,
      gols: antes.gols + e.gols,
      assistencias: antes.assistencias + e.assistencias,
      somaNotas: Math.round((antes.somaNotas + e.nota) * 10) / 10,
      amarelos: antes.amarelos + e.amarelos,
      vermelhos: antes.vermelhos + (e.vermelho ? 1 : 0),
    };
  }
  // Quem é do grupo principal e ficou de fora conta um jogo sem jogar.
  const elenco = [...mundo.elenco(c.clube)].sort((a, b) => b.forca - a.forca);
  for (const j of elenco.slice(0, 16)) {
    if (usados.has(j.id)) continue;
    const antes = estadoDe(c, j.id);
    jogadores[j.id] = { ...antes, semJogar: antes.semJogar + 1 };
  }

  const saldo = pro - contra;
  const moral = Math.max(
    0,
    Math.min(
      100,
      c.moral +
        (saldo > 0 ? 6 : saldo < 0 ? -6 : 1) +
        Math.sign(saldo) * (Math.abs(saldo) >= 3 ? 3 : 0),
    ),
  );
  const gols: GolDoJogo[] = r.eventos
    .filter((ev) => (ev.tipo === "gol" || ev.tipo === "gol-contra") && ev.jogador && ev.time)
    .map((ev) => ({
      minuto: rotuloMinuto(ev),
      jogador: ev.jogador as string,
      time: ev.time as LadoCampo,
      ...(ev.tipo === "gol-contra" ? { contra: true } : {}),
    }));
  const resultado: ResultadoCompromisso = {
    placar: [gc, gf],
    ...(r.penaltis ? { penaltis: [r.penaltis[0], r.penaltis[1]] as [number, number] } : {}),
    gols,
  };
  const clube = mundo.clube(c.clube);
  const adv = mundo.clube(x.adversario);
  const [casa, fora] =
    nosso === "casa" ? [clube?.nomeCurto, adv?.nomeCurto] : [adv?.nomeCurto, clube?.nomeCurto];
  const placar = {
    casa: casa ?? "",
    gc,
    gf,
    fora: fora ?? "",
    ...(r.penaltis ? { pc: r.penaltis[0], pf: r.penaltis[1] } : {}),
  };

  if (x.tipo !== "oficial" || !x.competicao || x.indice === undefined) {
    return {
      ...c,
      jogadores,
      moral,
      agenda: c.agenda.map((y) => (y.id === x.id ? { ...y, resultado } : y)),
      noticias: noticia(c, {
        data: c.data,
        tipo: "jogo",
        ...marcar(
          r.penaltis
            ? "Amistoso: {casa} {gc} x {gf} {fora} (pênaltis {pc} x {pf})."
            : "Amistoso: {casa} {gc} x {gf} {fora}.",
          placar,
        ),
      }),
    };
  }

  // Jogo oficial: cartões e suspensões do elenco do técnico nesta competição.
  const comp = x.competicao;
  for (const j of mundo.elenco(c.clube)) {
    const antes = jogadores[j.id] ?? estadoDe(c, j.id);
    const devia = antes.suspensoes?.[comp] ?? 0;
    // Quem estava suspenso cumpriu a suspensão neste jogo.
    if (devia > 0 && !usados.has(j.id))
      jogadores[j.id] = { ...antes, suspensoes: { ...antes.suspensoes, [comp]: devia - 1 } };
  }
  for (const e of r.jogadores) {
    if (e.time !== nosso || (!e.amarelos && !e.vermelho)) continue;
    const antes = jogadores[e.id] ?? estadoDe(c, e.id);
    const amarelos = (antes.amarelosPorCompeticao?.[comp] ?? 0) + (e.vermelho ? 0 : e.amarelos);
    const suspende = e.vermelho || amarelos >= AMARELOS_SUSPENSAO ? 1 : 0;
    jogadores[e.id] = {
      ...antes,
      amarelosPorCompeticao: {
        ...antes.amarelosPorCompeticao,
        [comp]: amarelos >= AMARELOS_SUSPENSAO ? 0 : amarelos,
      },
      suspensoes: { ...antes.suspensoes, [comp]: (antes.suspensoes?.[comp] ?? 0) + suspende },
    };
  }

  // Lança na competição, avança de fase e fecha os outros jogos do dia no mundo.
  const competicao = mundo.competicao(comp);
  let estado = c.competicoes.competicoes[comp];
  let competicoes = c.competicoes;
  if (competicao && estado) {
    const golsDoJogo = r.eventos
      .filter((ev) => ev.tipo === "gol" && ev.jogador)
      .map((ev) =>
        ev.outro
          ? { jogador: ev.jogador as string, assistencia: ev.outro }
          : { jogador: ev.jogador as string },
      );
    estado = lancarResultado(
      estado,
      x.indice,
      [gc, gf],
      r.penaltis ? [r.penaltis[0], r.penaltis[1]] : undefined,
      golsDoJogo,
    );
    estado = avancarCompeticao(competicao, estado, c.semente);
    competicoes = {
      ...c.competicoes,
      competicoes: { ...c.competicoes.competicoes, [comp]: estado },
    };
    competicoes = jogarDia(mundo, competicoes, c.data, c.semente);
  }
  const suspensos = r.jogadores.filter(
    (e) =>
      e.time === nosso &&
      (jogadores[e.id]?.suspensoes?.[comp] ?? 0) > (c.jogadores[e.id]?.suspensoes?.[comp] ?? 0),
  );
  let noticias = noticia(c, {
    data: c.data,
    tipo: "jogo",
    ...marcar(
      r.penaltis
        ? "{jogo}: {casa} {gc} x {gf} {fora} (pênaltis {pc} x {pf})."
        : "{jogo}: {casa} {gc} x {gf} {fora}.",
      { jogo: nomeDoCompromisso(c, mundo, x), ...placar },
    ),
  });
  for (const e of suspensos)
    noticias = [
      {
        data: c.data,
        tipo: "elenco" as const,
        ...marcar("{jogador} está suspenso para o próximo jogo da {competicao}.", {
          jogador: mundo.jogador(e.id)?.nome ?? e.id,
          competicao: competicao
            ? nomeCurtoDaCompeticao(competicao)
            : (c.competicoes.competicoes[comp]?.id ?? comp),
        }),
      },
      ...noticias,
    ].slice(0, MAX_NOTICIAS);
  return { ...c, jogadores, moral, competicoes, noticias };
}

/** Carreira salva numa versão anterior: completa o que falta (as competições, no formato 2). */
export function atualizarCarreira(c: Carreira, mundo: Mundo): Carreira {
  const antiga = c as Omit<Carreira, "formato" | "competicoes"> & {
    formato: number;
    competicoes?: MundoCompeticoes;
  };
  if (antiga.formato === FORMATO_CARREIRA && antiga.competicoes) return c;
  // Formato 1: sem competições. Formato 2: sem as continentais. Formatos 3 e 4: continentais num
  // formato anterior; formato 5: CONCACAF, AFC, CAF e OFC no formato anterior. Essas são abertas de
  // novo no formato real. Formato 6: sem as competições mundiais (abertas agora; as supercopas
  // continentais entram na virada da temporada). Tudo em dia com a data da carreira.
  let competicoes = antiga.competicoes;
  const refazer =
    antiga.formato === 3 || antiga.formato === 4
      ? ["CONMEBOL", "UEFA", "CONCACAF", "AFC", "CAF", "OFC"]
      : antiga.formato === 5
        ? ["CONCACAF", "AFC", "CAF", "OFC"]
        : [];
  if (competicoes && refazer.length) {
    const daConfederacao = (id: string) => {
      const e = mundo.competicao(id)?.escopo;
      return e?.tipo === "confederacao" && refazer.includes(e.confederacao);
    };
    competicoes = {
      ...competicoes,
      competicoes: Object.fromEntries(
        Object.entries(competicoes.competicoes).filter(([id]) => !daConfederacao(id)),
      ),
      temporadas: Object.fromEntries(
        Object.entries(competicoes.temporadas).filter(
          ([chave]) => !refazer.some((conf) => chave === `conf:${conf}`),
        ),
      ),
    };
  }
  // Formatos 1 a 7: a Copa do Brasil mudou para o formato de 126 clubes (montada de novo).
  if (competicoes && antiga.formato < 8)
    competicoes = reabrirCompeticoes(mundo, competicoes, ["bra-copa-do-brasil"], c.data, c.semente);
  // Formatos 1 a 8: as principais copas da Europa mudaram para o formato real (montadas de novo).
  if (competicoes && antiga.formato < 9)
    competicoes = reabrirCompeticoes(mundo, competicoes, COPAS_DA_ETAPA_9E, c.data, c.semente);
  return {
    ...antiga,
    formato: FORMATO_CARREIRA,
    competicoes: competicoes
      ? abrirTemporadasFaltando(mundo, competicoes, c.data, c.semente)
      : iniciarMundo(mundo, c.data, c.semente),
  };
}
