/**
 * Tipos da partida: o que entra (times, escalações, táticas) e o que sai (eventos,
 * estatísticas, notas e, se pedido, os quadros para o mini-campo).
 */
import type { Atributos, Lado, PapelEmCampo, Posicao, PosicaoCampo } from "@newbras/data";
import type { Formacao, Vaga } from "./formacoes";

export type LadoCampo = "casa" | "fora";

/** Humor do jogador no dia (decisão de 25/11/2026): visível na escalação. */
export type Humor = "otimo" | "bom" | "normal" | "ruim" | "pessimo";

/** Quanto o humor muda o rendimento: o dia ruim pesa mais do que o dia bom ajuda. */
export const EFEITO_HUMOR: Readonly<Record<Humor, number>> = {
  otimo: 0.05,
  bom: 0.02,
  normal: 0,
  ruim: -0.1,
  pessimo: -0.2,
};

/** Chance de cada humor quando a carreira não diz (Fase 8: sequências, moral e cansaço). */
export const CHANCE_HUMOR: Readonly<Record<Humor, number>> = {
  otimo: 0.08,
  bom: 0.22,
  normal: 0.5,
  ruim: 0.15,
  pessimo: 0.05,
};

/** O que o motor precisa saber de cada jogador. */
export interface JogadorPartida {
  id: string;
  nome: string;
  posicao: Posicao;
  lado: Lado;
  forca: number;
  atributos: Atributos;
  numero?: number;
  /** Condição física no início do jogo, de 0 a 100 (padrão 100). Fase 8: vem da carreira. */
  condicao?: number;
  /** Humor do dia; sem ele, o motor sorteia pelas chances de `CHANCE_HUMOR`. */
  humor?: Humor;
  /** Posições de campo em que ele atua (jogadores reais); deixam a nota por posição mais fiel. */
  posicoesCampo?: readonly PosicaoCampo[];
}

/** Cadenciado: toque de bola para segurar o resultado e esfriar o jogo. */
export type Estilo = "equilibrado" | "ataque" | "contra-ataque" | "cadenciado";
export type Marcacao = "leve" | "pesada" | "muito-pesada";
export type Concentracao = "equilibrada" | "meio" | "laterais";

export interface Tatica {
  estilo: Estilo;
  marcacao: Marcacao;
  concentracao: Concentracao;
}

export const TATICA_PADRAO: Tatica = {
  estilo: "equilibrado",
  marcacao: "leve",
  concentracao: "equilibrada",
};

export interface Escalacao {
  /** Formação pronta, ou "personalizada" com as vagas desenhadas pelo técnico. */
  formacao: Formacao | "personalizada";
  /** Vagas da formação personalizada (11, a primeira é o goleiro). Se vierem, mandam. */
  vagas?: readonly Vaga[];
  /** Os 11 titulares, na ordem das vagas da formação (o primeiro é o goleiro; "" = vaga vazia). */
  titulares: readonly string[];
  /** Reservas disponíveis para substituições. */
  reservas: readonly string[];
  /**
   * Posição e função pedidas pelo técnico em cada vaga (mesma ordem das vagas). Vaga sem escolha
   * (ou com escolha que não cabe nela) fica com a melhor função de quem estiver lá.
   */
  papeis?: readonly (PapelEmCampo | null)[];
}

export interface TimePartida {
  id: string;
  nome: string;
  jogadores: readonly JogadorPartida[];
  escalacao: Escalacao;
  tatica?: Tatica;
  /** A CPU troca cansados e lesionados sozinha. O time do humano só troca lesionado sem opção. */
  cpu?: boolean;
  /** Multiplicador geral de rendimento, para ajustes de fora (padrão 1). */
  ajuste?: number;
  /** Moral do time, de 0 a 100 (padrão 50): rende até 3% a mais ou a menos. */
  moral?: number;
}

export type Desempate = "nenhum" | "penaltis" | "prorrogacao";

export interface OpcoesPartida {
  semente: string;
  casa: TimePartida;
  fora: TimePartida;
  /** Mata-mata: pênaltis direto ou prorrogação e depois pênaltis, se empatar. */
  desempate?: Desempate;
  /** Guarda a posição dos 22 e da bola a cada segundo, para o mini-campo. */
  gravarQuadros?: boolean;
  /** Campo neutro: ninguém tem a vantagem de jogar em casa (finais, por exemplo). */
  neutro?: boolean;
  /** Máximo de substituições por time (padrão 5, em até 3 paradas fora do intervalo). */
  substituicoes?: number;
}

export type TipoEvento =
  | "inicio"
  | "intervalo"
  | "reinicio"
  | "fim-tempo-normal"
  | "inicio-prorrogacao"
  | "fim"
  | "gol"
  | "gol-contra"
  | "chute-fora"
  | "chute-trave"
  | "defesa"
  | "bloqueio"
  | "falta"
  | "cartao-amarelo"
  | "cartao-vermelho"
  | "escanteio"
  | "impedimento"
  | "penalti"
  | "penalti-perdido"
  | "lesao"
  | "substituicao"
  | "disputa-penaltis"
  | "mudanca-tatica"
  | "acrescimo";

/** 1 e 2: tempos normais; 3 e 4: prorrogação; 5: disputa de pênaltis. */
export type Periodo = 1 | 2 | 3 | 4 | 5;

export interface Evento {
  tipo: TipoEvento;
  periodo: Periodo;
  /** Segundos de jogo desde o início do período. */
  segundo: number;
  /** Minuto de relógio (o 1º tempo vai de 1 a 45, mais os acréscimos; o 2º começa no 46). */
  minuto: number;
  /** Minutos de acréscimo, quando o lance foi depois do tempo regulamentar do período. */
  acrescimo?: number;
  time?: LadoCampo;
  jogador?: string;
  /** Segundo jogador: quem deu a assistência, quem sofreu a falta, quem entrou. */
  outro?: string;
  x?: number;
  y?: number;
  /** Para chutes: probabilidade de gol do lance (xG). Para pênaltis da disputa: convertido. */
  valor?: number;
  /** Texto livre do lance (a mudança tática da CPU, por exemplo). */
  detalhe?: string;
  /** Onde a bola terminou (chutes e gols): no gol, na trave, fora ou nas mãos do goleiro. */
  destino?: { x: number; y: number };
  /** Placar logo depois do evento. */
  placar?: readonly [number, number];
}

export interface EstatisticasTime {
  gols: number;
  posse: number;
  chutes: number;
  chutesNoGol: number;
  xg: number;
  passes: number;
  passesCertos: number;
  dribles: number;
  driblesCertos: number;
  desarmes: number;
  interceptacoes: number;
  cruzamentos: number;
  escanteios: number;
  faltas: number;
  impedimentos: number;
  amarelos: number;
  vermelhos: number;
  defesas: number;
  substituicoes: number;
}

export interface EstatisticasJogador {
  id: string;
  time: LadoCampo;
  titular: boolean;
  humor: Humor;
  /** Posição e função em que terminou o jogo (null = não entrou em campo). */
  papel: PapelEmCampo | null;
  minutos: number;
  gols: number;
  golsContra: number;
  assistencias: number;
  chutes: number;
  chutesNoGol: number;
  passes: number;
  passesCertos: number;
  passesDecisivos: number;
  dribles: number;
  desarmes: number;
  interceptacoes: number;
  faltas: number;
  faltasSofridas: number;
  defesas: number;
  golsSofridos: number;
  amarelos: number;
  vermelho: boolean;
  lesionado: boolean;
  /** Metros percorridos. */
  distancia: number;
  condicaoFinal: number;
  /** Nota de 0,5 a 10, de meio em meio ponto (as "estrelas"). */
  nota: number;
}

export interface Quadro {
  /** Segundo de jogo contado desde o início da partida. */
  t: number;
  bola: readonly [number, number];
  /**
   * x e y de cada vaga (11 da casa e depois 11 do visitante), com uma casa decimal.
   * NaN = vaga vazia (expulsão ou lesão sem troca). Quem ocupa a vaga começa por `vagas`
   * e muda a cada evento de substituição.
   */
  posicoes: readonly number[];
}

export interface ResultadoPartida {
  placar: readonly [number, number];
  /** Placar da disputa de pênaltis, se houve. */
  penaltis?: readonly [number, number];
  vencedor: LadoCampo | "empate";
  eventos: readonly Evento[];
  estatisticas: Readonly<Record<LadoCampo, EstatisticasTime>>;
  jogadores: readonly EstatisticasJogador[];
  /** Titulares de cada vaga no início, na ordem das posições dos quadros. */
  vagas: Readonly<Record<LadoCampo, readonly string[]>>;
  quadros?: readonly Quadro[];
  /** Duração em segundos de jogo, com acréscimos e prorrogação. */
  duracao: number;
}
