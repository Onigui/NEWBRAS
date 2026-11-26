/**
 * Motor de partida espacial (Fase 5). A partida anda de segundo em segundo: os 22 se movem
 * em volta das vagas da formação, seguindo a bola e a fase do jogo; quem tem a bola decide o
 * que fazer (passar, conduzir, driblar, cruzar, chutar) pelos atributos e pela posição; cada
 * ação vira uma disputa contra o adversário mais próximo. Tudo sorteado passa pelo Rng, então a
 * mesma semente dá sempre a mesma partida.
 *
 * O registro de eventos alimenta o modo clássico (linha de minutos) e os quadros alimentam o
 * mini-campo (Fase 7). A calibração fina e o mando ficam para a Fase 6.
 */
import { chave } from "@newbras/textos";
import {
  DADOS_FUNCAO,
  familiaridade,
  type Atributo,
  type PapelEmCampo,
  type Posicao,
} from "@newbras/data";
import { Rng } from "../rng";
import {
  COMPRIMENTO,
  LARGURA,
  MEIO_X,
  MEIO_Y,
  distancia,
  distanciaAoGol,
  distanciaAoSegmento,
  limitar,
  naArea,
  noQuadro,
  type Ponto,
} from "./campo";
import { notaNaVaga, papelNaVaga, vagasDaEscalacao } from "./escalacao";
import { COMPORTAMENTO, type Comportamento } from "./funcoes";
import { FORMACOES, type Formacao, type Vaga } from "./formacoes";
import {
  CHANCE_HUMOR,
  EFEITO_HUMOR,
  TATICA_PADRAO,
  type Evento,
  type EstatisticasJogador,
  type EstatisticasTime,
  type Estilo,
  type Humor,
  type Marcacao,
  type JogadorPartida,
  type LadoCampo,
  type OpcoesPartida,
  type Periodo,
  type Quadro,
  type ResultadoPartida,
  type Tatica,
  type TimePartida,
  type TipoEvento,
} from "./tipos";

/** Segundos regulamentares de cada período. */
const DURACAO: Readonly<Record<Periodo, number>> = { 1: 2700, 2: 2700, 3: 900, 4: 900, 5: 0 };
/** Minuto de relógio em que cada período começa. */
const MINUTO_INICIAL: Readonly<Record<Periodo, number>> = { 1: 0, 2: 45, 3: 90, 4: 105, 5: 120 };
const FISICOS: ReadonlySet<Atributo> = new Set(["velocidade", "resistencia", "forcaFisica"]);

/** Quanto cada posição acompanha a bola no sentido do comprimento. */
const ACOMPANHA: Readonly<Record<string, number>> = { G: 0.12, Z: 0.5, L: 0.55, M: 0.6, A: 0.5 };

interface Atleta {
  j: JogadorPartida;
  lado: LadoCampo;
  vaga: number;
  pos: Ponto;
  alvo: Ponto | null;
  condicao: number;
  emCampo: boolean;
  usado: boolean;
  amarelos: number;
  fator: number;
  entrouEm: number;
  saiuEm: number | null;
  est: EstatisticasJogador;
  /** Atributos efetivos guardados por um minuto (a condição muda devagar). */
  efetivos: Partial<Record<Atributo, number>>;
  velocidade: number;
  /** Resistência de base, que decide o quanto o jogador cansa. */
  resistencia: number;
  /** Adversário que ele está marcando. */
  marcado: Atleta | null;
  /** Forma do dia: humor e, raramente, o dia iluminado (escondido). */
  forma: number;
  /** Posição e função em campo (null no banco). */
  papel: PapelEmCampo | null;
  /** Como a função joga (posicionamento e preferências). */
  comp: Comportamento;
}

interface Time {
  lado: LadoCampo;
  dados: TimePartida;
  tatica: Tatica;
  atletas: Atleta[];
  vagas: (Atleta | null)[];
  formacao: readonly Vaga[];
  /** Posição e função pedidas pelo técnico em cada vaga (null = a melhor de quem estiver lá). */
  papeis: (PapelEmCampo | null)[];
  trocas: number;
  paradas: Set<number>;
  est: EstatisticasTime;
  /** Último plano da CPU (postura, estilo e marcação), para não mexer à toa. */
  planoCpu?: string;
  posturaCpu: number;
  /** Algo mudou (gol, expulsão): a CPU revê a estratégia no próximo minuto. */
  reavaliar: boolean;
  /** Mando de campo, moral e dia do time, juntos. */
  forma: number;
  /** Time que já goleia relaxa um pouco. */
  acomodacao: number;
}

function estatisticasVazias(): EstatisticasTime {
  return {
    gols: 0,
    posse: 0,
    chutes: 0,
    chutesNoGol: 0,
    xg: 0,
    passes: 0,
    passesCertos: 0,
    dribles: 0,
    driblesCertos: 0,
    desarmes: 0,
    interceptacoes: 0,
    cruzamentos: 0,
    escanteios: 0,
    faltas: 0,
    impedimentos: 0,
    amarelos: 0,
    vermelhos: 0,
    defesas: 0,
    substituicoes: 0,
  };
}

const outro = (l: LadoCampo): LadoCampo => (l === "casa" ? "fora" : "casa");

/** Quanto o time avança (atacando) ou recua (defendendo) a partir das vagas, por estilo. */
const AVANCO_ATACANDO: Readonly<Record<Estilo, number>> = {
  ataque: 11,
  equilibrado: 9,
  cadenciado: 9,
  "contra-ataque": 8,
};
const AVANCO_DEFENDENDO: Readonly<Record<Estilo, number>> = {
  ataque: -3,
  equilibrado: -5,
  cadenciado: -5,
  "contra-ataque": -7,
};
const LADOS_CAMPO: readonly LadoCampo[] = ["casa", "fora"];

/** Quanto o mando de campo rende (torcida, gramado, viagem do adversário). */
export const VANTAGEM_MANDO = 0.04;
/** O raro dia em que tudo dá certo para um jogador (escondido, como no Brasfoot). */
export const CHANCE_DIA_ILUMINADO = 0.02;
export const EFEITO_DIA_ILUMINADO = 0.1;

/** Formação que a CPU usa em cada postura (0 = a formação escolhida antes do jogo). */
const FORMACAO_POR_POSTURA: Readonly<Record<number, Formacao>> = {
  2: "4-3-3",
  1: "4-4-2",
  [-1]: "4-5-1",
  [-2]: "4-5-1",
};
/** Ordem de preencher as vagas ao reorganizar: o que é mais difícil de improvisar primeiro. */
const PRIORIDADE_VAGA: readonly Posicao[] = ["G", "Z", "L", "M", "A"];

export class Partida {
  private readonly rng: Rng;
  private readonly times: Record<LadoCampo, Time>;
  private readonly opcoes: OpcoesPartida;
  private readonly maxTrocas: number;
  private readonly eventosRegistrados: Evento[] = [];
  private readonly quadros: Quadro[] = [];

  /** Segundos de jogo desde o começo da partida. */
  private t = 0;
  private periodo: Periodo = 1;
  /** Segundos desde o início do período. */
  private s = 0;
  private acrescimo: number | null = null;
  private encerrada = false;
  private placarAtual: [number, number] = [0, 0];
  private placarPenaltis: [number, number] | undefined;

  private bola: Ponto = { x: MEIO_X, y: MEIO_Y };
  private dono: Atleta | null = null;
  private posse: LadoCampo = "casa";
  private acaoEm = 0;
  private conducao: Ponto | null = null;
  private ultimoPasse: { de: Atleta; t: number } | null = null;

  constructor(opcoes: OpcoesPartida) {
    this.opcoes = opcoes;
    this.rng = new Rng(`partida:${opcoes.semente}`);
    this.maxTrocas = opcoes.substituicoes ?? 5;
    this.times = {
      casa: this.montarTime("casa", opcoes.casa),
      fora: this.montarTime("fora", opcoes.fora),
    };
    this.sortearForma();
    this.registrar("inicio", {});
    this.saidaDeBola("casa");
  }

  // ---------------------------------------------------------------- montagem

  private montarTime(lado: LadoCampo, dados: TimePartida): Time {
    const formacao = vagasDaEscalacao(dados.escalacao);
    const porId = new Map(dados.jogadores.map((j) => [j.id, j]));
    const atletas: Atleta[] = [];
    const vagas: (Atleta | null)[] = formacao.map(() => null);
    const criar = (j: JogadorPartida, vaga: number, titular: boolean): Atleta => ({
      j,
      lado,
      vaga,
      pos: { x: MEIO_X, y: MEIO_Y },
      alvo: null,
      condicao: j.condicao ?? 100,
      emCampo: titular,
      usado: titular,
      amarelos: 0,
      fator: 1,
      entrouEm: titular ? 0 : -1,
      saiuEm: null,
      efetivos: {},
      velocidade: 0,
      resistencia: j.atributos.resistencia ?? j.forca * 0.8,
      marcado: null,
      forma: 1,
      papel: null,
      comp: COMPORTAMENTO.goleiro,
      est: {
        id: j.id,
        time: lado,
        titular,
        humor: j.humor ?? "normal",
        papel: null,
        minutos: 0,
        gols: 0,
        golsContra: 0,
        assistencias: 0,
        chutes: 0,
        chutesNoGol: 0,
        passes: 0,
        passesCertos: 0,
        passesDecisivos: 0,
        dribles: 0,
        desarmes: 0,
        interceptacoes: 0,
        faltas: 0,
        faltasSofridas: 0,
        defesas: 0,
        golsSofridos: 0,
        amarelos: 0,
        vermelho: false,
        lesionado: false,
        distancia: 0,
        condicaoFinal: j.condicao ?? 100,
        nota: 6,
      },
    });
    const papeis = formacao.map((_, i) => dados.escalacao.papeis?.[i] ?? null);
    dados.escalacao.titulares.forEach((id, vaga) => {
      const j = porId.get(id);
      if (!j || vaga >= formacao.length) return;
      const a = criar(j, vaga, true);
      this.definirPapel(a, formacao[vaga] as Vaga, papeis[vaga]);
      atletas.push(a);
      vagas[vaga] = a;
    });
    for (const id of dados.escalacao.reservas) {
      const j = porId.get(id);
      if (j && !atletas.some((a) => a.j.id === id)) atletas.push(criar(j, -1, false));
    }
    return {
      lado,
      dados,
      tatica: dados.tatica ?? TATICA_PADRAO,
      atletas,
      vagas,
      formacao,
      papeis,
      trocas: 0,
      paradas: new Set(),
      est: estatisticasVazias(),
      posturaCpu: 0,
      reavaliar: false,
      forma: 1,
      acomodacao: 1,
    };
  }

  /**
   * Forma do dia (Fase 6), sorteada à parte para não mexer no resto da partida:
   * humor de cada jogador (se a carreira não disser), o raro dia iluminado (escondido, 2%),
   * o dia do time (±6%, escondido), o mando de campo e a moral.
   */
  private sortearForma(): void {
    const rng = this.rng.fork("forma");
    const humores = Object.entries(CHANCE_HUMOR) as [Humor, number][];
    for (const lado of LADOS_CAMPO) {
      const time = this.times[lado];
      for (const a of time.atletas) {
        const humor = a.j.humor ?? rng.weighted(humores, ([, p]) => p)[0];
        a.est.humor = humor;
        const iluminado = rng.chance(CHANCE_DIA_ILUMINADO);
        a.forma = (1 + EFEITO_HUMOR[humor]) * (iluminado ? 1 + EFEITO_DIA_ILUMINADO : 1);
      }
      const diaDoTime = 1 + limitar(rng.normal(0, 0.05), -0.1, 0.1);
      const mando = lado === "casa" && !this.opcoes.neutro ? 1 + VANTAGEM_MANDO : 1;
      const moral = 1 + ((limitar(time.dados.moral ?? 50, 0, 100) - 50) / 50) * 0.03;
      time.forma = diaDoTime * mando * moral;
    }
  }

  /** Humor de cada jogador no jogo (para a escalação e o painel de notas). */
  humor(lado: LadoCampo): ReadonlyMap<string, Humor> {
    return new Map(this.times[lado].atletas.map((a) => [a.j.id, a.est.humor]));
  }

  // ---------------------------------------------------------------- consultas

  get tempo(): number {
    return this.t;
  }
  get terminada(): boolean {
    return this.encerrada;
  }
  get placar(): readonly [number, number] {
    return this.placarAtual;
  }
  get eventos(): readonly Evento[] {
    return this.eventosRegistrados;
  }
  /** Período e minuto de relógio atuais, para a tela. */
  get relogio(): { periodo: Periodo; minuto: number; acrescimo?: number } {
    return this.minutoDe(this.s);
  }

  /** Minutos de acréscimo dados no período atual (null antes de o tempo regulamentar acabar). */
  get acrescimoDado(): number | null {
    return this.acrescimo;
  }

  /** Quem está em campo agora, por vaga. */
  emCampo(lado: LadoCampo): readonly (string | null)[] {
    return this.times[lado].vagas.map((a) => a?.j.id ?? null);
  }

  // ---------------------------------------------------------------- comandos

  /** Avança a partida pelo número de segundos de jogo (ou até acabar) e devolve os eventos novos. */
  avancar(segundos: number): Evento[] {
    const antes = this.eventosRegistrados.length;
    for (let i = 0; i < segundos && !this.encerrada; i++) this.passo();
    return this.eventosRegistrados.slice(antes);
  }

  /** Joga até o fim. */
  simular(): ResultadoPartida {
    while (!this.encerrada) this.passo();
    return this.resultado();
  }

  /** Substituição pedida pelo técnico. Vale com a bola em jogo ou parada; conta parada e troca. */
  substituir(lado: LadoCampo, saiId: string, entraId: string): boolean {
    const time = this.times[lado];
    const sai = time.atletas.find((a) => a.j.id === saiId && a.emCampo);
    const entra = time.atletas.find((a) => a.j.id === entraId && !a.usado);
    if (!sai || !entra || !this.podeTrocar(time)) return false;
    this.trocar(time, sai, entra);
    return true;
  }

  /** Reservas que ainda podem entrar. */
  reservas(lado: LadoCampo): readonly string[] {
    return this.times[lado].atletas.filter((a) => !a.usado).map((a) => a.j.id);
  }

  /** Trocas que o time ainda pode fazer (limite de trocas e de paradas). */
  trocasRestantes(lado: LadoCampo): number {
    const time = this.times[lado];
    return this.podeTrocar(time) ? this.maxTrocas - time.trocas : 0;
  }

  /** Tática em uso. */
  tatica(lado: LadoCampo): Tatica {
    return this.times[lado].tatica;
  }

  /** Vagas em uso (formação atual do time). */
  vagas(lado: LadoCampo): readonly Vaga[] {
    return this.times[lado].formacao;
  }

  /** Condição física atual de quem está em campo, por vaga (0 a 100; null = vaga vazia). */
  condicoes(lado: LadoCampo): readonly (number | null)[] {
    return this.times[lado].vagas.map((a) => (a ? Math.round(a.condicao) : null));
  }

  /**
   * Muda a formação durante o jogo: quem está na vaga i passa para a nova vaga i (o técnico
   * redesenha o time sem trocar ninguém). Vale também para a formação personalizada.
   */
  mudarFormacao(
    lado: LadoCampo,
    vagas: readonly Vaga[],
    papeis?: readonly (PapelEmCampo | null)[],
  ): boolean {
    const time = this.times[lado];
    if (vagas.length !== time.formacao.length || vagas[0]?.posicao !== "G") return false;
    time.formacao = vagas;
    if (papeis) time.papeis = vagas.map((_, i) => papeis[i] ?? null);
    this.cacheEmCampo[lado] = null;
    for (const a of time.vagas) if (a) this.moverParaVaga(time, a, a.vaga);
    return true;
  }

  /** Posição e função de quem está em cada vaga agora (null = vaga vazia). */
  papeis(lado: LadoCampo): readonly (PapelEmCampo | null)[] {
    return this.times[lado].vagas.map((a) => a?.papel ?? null);
  }

  /** Posições e funções pedidas pelo técnico em cada vaga (null = automática). */
  papeisEscolhidos(lado: LadoCampo): readonly (PapelEmCampo | null)[] {
    return this.times[lado].papeis;
  }

  /** Troca dois jogadores em campo de vaga (sem gastar substituição). */
  trocarVagas(lado: LadoCampo, i: number, j: number): boolean {
    const time = this.times[lado];
    const n = time.formacao.length;
    if (i === j || i < 0 || j < 0 || i >= n || j >= n) return false;
    const a = time.vagas[i] ?? null;
    const b = time.vagas[j] ?? null;
    if (!a && !b) return false;
    time.vagas[i] = b;
    time.vagas[j] = a;
    this.cacheEmCampo[lado] = null;
    for (const [atleta, vaga] of [
      [b, i],
      [a, j],
    ] as const) {
      if (!atleta) continue;
      atleta.vaga = vaga;
      atleta.marcado = null;
      this.definirPapel(atleta, time.formacao[vaga] as Vaga, time.papeis[vaga]);
      this.renovar(atleta);
    }
    return true;
  }

  /** O técnico pede outra posição ou função na vaga (null volta para a automática). */
  mudarPapel(lado: LadoCampo, vaga: number, papel: PapelEmCampo | null): void {
    const time = this.times[lado];
    if (vaga < 0 || vaga >= time.formacao.length) return;
    time.papeis[vaga] = papel;
    const a = time.vagas[vaga];
    if (a) {
      this.definirPapel(a, time.formacao[vaga] as Vaga, papel);
      this.renovar(a);
    }
  }

  /** Posição atual dos 22 e da bola, com quem está com a bola (índice da vaga, casa primeiro). */
  instantaneo(): Quadro & { dono: number | null } {
    let dono: number | null = null;
    if (this.dono) dono = (this.dono.lado === "casa" ? 0 : 11) + this.dono.vaga;
    return { ...this.montarQuadro(), dono };
  }

  mudarTatica(lado: LadoCampo, tatica: Partial<Tatica>): void {
    const time = this.times[lado];
    time.tatica = { ...time.tatica, ...tatica };
  }

  // ---------------------------------------------------------------- relógio

  private minutoDe(s: number): { periodo: Periodo; minuto: number; acrescimo?: number } {
    const regulamentar = DURACAO[this.periodo];
    const base = MINUTO_INICIAL[this.periodo];
    if (s < regulamentar) return { periodo: this.periodo, minuto: base + Math.floor(s / 60) + 1 };
    return {
      periodo: this.periodo,
      minuto: base + regulamentar / 60,
      acrescimo: Math.floor((s - regulamentar) / 60) + 1,
    };
  }

  private registrar(tipo: TipoEvento, dados: Partial<Evento>): Evento {
    const relogio = this.minutoDe(this.s);
    const evento: Evento = {
      tipo,
      periodo: relogio.periodo,
      segundo: this.s,
      minuto: relogio.minuto,
      ...(relogio.acrescimo ? { acrescimo: relogio.acrescimo } : {}),
      ...dados,
    };
    this.eventosRegistrados.push(evento);
    return evento;
  }

  /** O time da casa ataca para a direita no 1º tempo e no 1º da prorrogação. */
  private paraDireita(lado: LadoCampo): boolean {
    const primeiro = this.periodo === 1 || this.periodo === 3;
    return lado === "casa" ? primeiro : !primeiro;
  }

  private passo(): void {
    this.movimentar();
    if (this.t >= this.acaoEm) this.agir();
    this.times[this.posse].est.posse++;
    if (this.s % 60 === 59) this.aCadaMinuto();
    if (this.opcoes.gravarQuadros) this.gravarQuadro();
    this.t++;
    this.s++;
    this.verificarFimDoPeriodo();
  }

  private verificarFimDoPeriodo(): void {
    const regulamentar = DURACAO[this.periodo];
    if (this.s === regulamentar && this.acrescimo === null) {
      this.acrescimo = this.calcularAcrescimo();
      // A placa do quarto árbitro: todo mundo fica sabendo quantos minutos foram dados.
      const placa = this.registrar("acrescimo", { valor: this.acrescimo });
      // A placa sobe no último minuto regulamentar (45' ou 90'), não no primeiro do acréscimo.
      delete placa.acrescimo;
    }
    if (this.acrescimo === null || this.s < regulamentar + this.acrescimo * 60) return;
    // Não apita no meio de um ataque perigoso: espera a bola sair da zona de ataque.
    if (this.dono && this.s < regulamentar + (this.acrescimo + 1) * 60) {
      const q = noQuadro(this.bola, this.paraDireita(this.dono.lado));
      if (q.x > 75) return;
    }
    this.encerrarPeriodo();
  }

  private calcularAcrescimo(): number {
    const doPeriodo = this.eventosRegistrados.filter((e) => e.periodo === this.periodo);
    const peso = doPeriodo.reduce((soma, e) => {
      if (e.tipo === "gol" || e.tipo === "gol-contra" || e.tipo === "substituicao")
        return soma + 0.5;
      if (e.tipo === "lesao" || e.tipo === "cartao-vermelho") return soma + 1;
      if (e.tipo === "cartao-amarelo") return soma + 0.25;
      return soma;
    }, 0);
    const curto = this.periodo >= 3;
    return limitar(
      Math.round((curto ? 0 : 1) + peso + this.rng.float(0, 1)),
      curto ? 0 : 1,
      curto ? 3 : 7,
    );
  }

  private encerrarPeriodo(): void {
    // Jogo de volta: o empate que conta é o do placar agregado (ida + volta).
    const [ac, af] = this.opcoes.agregado ?? [0, 0];
    const empate = this.placarAtual[0] + ac === this.placarAtual[1] + af;
    const desempate = this.opcoes.desempate ?? "nenhum";
    if (this.periodo === 1 || this.periodo === 3) {
      this.registrar("intervalo", {});
      this.novoPeriodo((this.periodo + 1) as Periodo);
      this.registrar("reinicio", {});
      // Quem não deu a saída no começo dá agora.
      this.saidaDeBola("fora");
      return;
    }
    if (this.periodo === 2 && empate && desempate === "prorrogacao") {
      this.registrar("fim-tempo-normal", {});
      this.novoPeriodo(3);
      this.registrar("inicio-prorrogacao", {});
      this.saidaDeBola("casa");
      return;
    }
    if (empate && desempate !== "nenhum") this.disputaDePenaltis();
    this.encerrar();
  }

  private novoPeriodo(p: Periodo): void {
    this.periodo = p;
    this.s = 0;
    this.acrescimo = null;
    // Descanso do intervalo: recupera um pouco do fôlego.
    for (const time of Object.values(this.times))
      for (const a of time.atletas) if (a.emCampo) a.condicao = Math.min(100, a.condicao + 4);
  }

  private encerrar(): void {
    this.registrar("fim", { placar: [...this.placarAtual] as [number, number] });
    this.encerrada = true;
    this.fecharEstatisticas();
  }

  // ---------------------------------------------------------------- atributos

  /** Atributo efetivo: base × encaixe na vaga × condição física × ajuste do time. */
  private att(a: Atleta, nome: Atributo): number {
    const guardado = a.efetivos[nome];
    if (guardado !== undefined) return guardado;
    const base = a.j.atributos[nome] ?? a.j.forca * 0.35;
    const fisico = FISICOS.has(nome);
    const condicao = fisico ? 0.7 + 0.3 * (a.condicao / 100) : 0.9 + 0.1 * (a.condicao / 100);
    const time = this.times[a.lado];
    const ajuste = (time.dados.ajuste ?? 1) * time.forma * time.acomodacao * a.forma;
    const valor = limitar(base * a.fator * condicao * ajuste, 1, 100);
    a.efetivos[nome] = valor;
    return valor;
  }

  /** Esquece os atributos guardados (a condição ou a vaga mudou). */
  private renovar(a: Atleta): void {
    a.efetivos = {};
    a.velocidade = 0;
  }

  private velocidadeMaxima(a: Atleta): number {
    if (!a.velocidade) a.velocidade = 4.2 + 3.3 * (this.att(a, "velocidade") / 100);
    return a.velocidade;
  }

  private readonly cacheEmCampo: Record<LadoCampo, Atleta[] | null> = { casa: null, fora: null };

  /** Quem está em campo (lista guardada; muda só em trocas, expulsões e lesões). */
  private emCampoDe(lado: LadoCampo): Atleta[] {
    let lista = this.cacheEmCampo[lado];
    if (!lista) {
      lista = this.times[lado].vagas.filter((a): a is Atleta => a !== null);
      this.cacheEmCampo[lado] = lista;
    }
    return lista;
  }

  private goleiroDe(lado: LadoCampo): Atleta | null {
    return this.times[lado].vagas[0] ?? null;
  }

  // ---------------------------------------------------------------- movimento

  private movimentar(): void {
    // Quem pressiona: os mais próximos da bola no time sem a bola (busca linear, sem ordenar).
    const defensor = this.times[outro(this.posse)];
    const quantos = defensor.tatica.marcacao === "leve" ? 1 : 2;
    const bolaNaArea = naArea(noQuadro(this.bola, !this.paraDireita(defensor.lado)));
    let p1: Atleta | null = null;
    let p2: Atleta | null = null;
    let d1 = Infinity;
    let d2 = Infinity;
    for (const a of this.emCampoDe(defensor.lado)) {
      if (a.vaga === 0 && !bolaNaArea) continue;
      const d = distancia(a.pos, this.bola);
      if (d < d1) {
        p2 = p1;
        d2 = d1;
        p1 = a;
        d1 = d;
      } else if (d < d2) {
        p2 = a;
        d2 = d;
      }
    }
    if (quantos < 2) p2 = null;

    for (const lado of LADOS_CAMPO) {
      const time = this.times[lado];
      const direita = this.paraDireita(lado);
      const bx = direita ? this.bola.x : COMPRIMENTO - this.bola.x;
      const by = direita ? this.bola.y : LARGURA - this.bola.y;
      const atacando = this.posse === lado;
      const estilo = time.tatica.estilo;
      const concentracao = time.tatica.concentracao;
      const avancoBase = (atacando ? AVANCO_ATACANDO : AVANCO_DEFENDENDO)[estilo];
      const marcacao = time.tatica.marcacao;
      const kMarcacao = marcacao === "leve" ? 0.55 : marcacao === "pesada" ? 0.7 : 0.8;
      // Ataque total e marcação forte cobram fôlego: o time cansa mais rápido.
      const desgaste =
        (estilo === "ataque" ? 1.25 : estilo === "cadenciado" ? 0.9 : 1) *
        (marcacao === "leve" ? 1 : marcacao === "pesada" ? 1.12 : 1.25);
      const golX = direita ? 0 : COMPRIMENTO;
      const adversarios = atacando ? null : this.emCampoDe(outro(lado));
      // Linha de impedimento: o penúltimo adversário (contando o goleiro), no quadro de ataque.
      let linhaImpedimento = COMPRIMENTO;
      if (atacando) {
        let primeiro = 0;
        let segundo = 0;
        for (const o of this.emCampoDe(outro(lado))) {
          const ox = direita ? o.pos.x : COMPRIMENTO - o.pos.x;
          if (ox > primeiro) {
            segundo = primeiro;
            primeiro = ox;
          } else if (ox > segundo) segundo = ox;
        }
        linhaImpedimento = Math.max(segundo, bx, MEIO_X);
      }

      for (const a of this.emCampoDe(lado)) {
        let tx: number;
        let ty: number;
        let correndo = false;
        if (a === this.dono) {
          if (!this.conducao) continue;
          tx = this.conducao.x;
          ty = this.conducao.y;
          correndo = true;
        } else if (a === p1 || a === p2 || (!this.dono && distancia(a.pos, this.bola) < 15)) {
          tx = this.bola.x;
          ty = this.bola.y;
          correndo = true;
        } else {
          // Vaga deslocada pela bola e pela fase, no quadro de ataque do time.
          const vaga = time.formacao[a.vaga] as Vaga;
          const goleiro = vaga.posicao === "G";
          const comp = a.comp;
          let avanco = 0;
          if (!goleiro) {
            avanco = avancoBase;
            const aberto = Math.abs(vaga.y - MEIO_Y) > 15;
            if (atacando && concentracao === "laterais" && aberto) avanco += 4;
            if (atacando && concentracao === "meio" && !aberto) avanco += 3;
          }
          // A função mexe no posicionamento: o volante segura, o ala sobe, o meia-armador
          // espera o contra-ataque mais à frente.
          if (atacando) avanco += comp.avanco + (bx > 65 ? comp.avancoFinal : 0);
          else avanco += comp.defesa;
          // Recua menos do que avança: a linha de defesa não se enterra na área com a bola no
          // meio-campo; só desce de vez quando a bola chega perto do gol.
          const recuo = bx < MEIO_X ? 0.85 : 1;
          let x = vaga.x + (bx - MEIO_X) * (ACOMPANHA[vaga.posicao] ?? 0.5) * recuo + avanco;
          let y = vaga.y + (by - MEIO_Y) * (goleiro ? 0.15 : 0.35);
          if (!atacando && !goleiro) y += (by - y) * 0.12;
          // Atacando, o ponta abre e o ponta invertido (ou o meia por dentro) fecha para o meio.
          if (atacando && comp.largura && bx > 50) {
            const lado = vaga.y < MEIO_Y ? -1 : 1;
            y += lado * comp.largura;
          }
          const linhaMinima = vaga.posicao === "Z" || vaga.posicao === "L" ? (bx < 20 ? 5 : 8) : 3;
          x = goleiro ? limitar(x, 1, comp.avanco > 0 ? 28 : 20) : limitar(x, linhaMinima, 101);
          // Chegada de trás: com o ataque no terço final, quem tem a função de chegar passa da
          // bola e entra na área (é de onde saem os gols de meio-campista).
          if (atacando && comp.chegada && bx > 72) x = Math.max(x, Math.min(bx + 6, 91));
          // Atacando, ninguém espera a bola em impedimento: fica na linha do penúltimo defensor.
          // Quem joga no limite arrisca (e às vezes passa: impedimento); o falso 9 sai da área.
          if (atacando && !goleiro) {
            x = Math.min(x, linhaImpedimento + (comp.linha ? 1.2 : -0.5));
            if (comp.recua) x = Math.min(x, linhaImpedimento - comp.recua);
          }
          y = limitar(y, 2, LARGURA - 2);
          tx = direita ? x : COMPRIMENTO - x;
          ty = direita ? y : LARGURA - y;
          // Marcação: encosta no adversário mais perto da zona, entre ele e o gol.
          if (adversarios && !goleiro) {
            // Quem marcar é revisto a cada 3 segundos; a posição do marcado, a cada segundo.
            let perto = a.marcado;
            if (this.t % 3 === 0 || (perto && !perto.emCampo)) {
              perto = null;
              let menor = 14 * 14;
              for (const o of adversarios) {
                const dx = o.pos.x - tx;
                const dy = o.pos.y - ty;
                const d2o = dx * dx + dy * dy;
                if (d2o < menor) {
                  menor = d2o;
                  perto = o;
                }
              }
              a.marcado = perto;
            }
            if (perto) {
              const gx = golX - perto.pos.x;
              const gy = MEIO_Y - perto.pos.y;
              const dg = Math.sqrt(gx * gx + gy * gy) || 1;
              const mx = perto.pos.x + (gx / dg) * 1.5;
              const my = perto.pos.y + (gy / dg) * 1.5;
              tx += (mx - tx) * kMarcacao;
              ty += (my - ty) * kMarcacao;
            }
          }
        }
        const dx = tx - a.pos.x;
        const dy = ty - a.pos.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        // Fora do lance, ajusta a posição trotando e só quando está longe da vaga.
        if (d < 0.05 || (!correndo && d < 1.5)) {
          a.condicao = Math.min(100, a.condicao + 0.004);
          continue;
        }
        const maxima = this.velocidadeMaxima(a);
        const velocidade = correndo || d > 12 ? maxima : Math.min(d, maxima * 0.3);
        const passo = Math.min(d, velocidade);
        a.pos.x += (dx / d) * passo;
        a.pos.y += (dy / d) * passo;
        a.est.distancia += passo;
        // Cansaço: correr cansa mais quem tem pouca resistência.
        a.condicao = Math.max(
          0,
          a.condicao -
            passo * 0.0046 * desgaste * a.comp.desgaste * (1.55 - a.resistencia / 100) -
            0.0006,
        );
      }
    }
    if (this.dono) {
      this.bola = { x: this.dono.pos.x, y: this.dono.pos.y };
      if (this.conducao && distancia(this.dono.pos, this.conducao) < 0.5) this.conducao = null;
    }
  }

  // ---------------------------------------------------------------- reinícios

  private saidaDeBola(lado: LadoCampo): void {
    this.bola = { x: MEIO_X, y: MEIO_Y };
    for (const time of Object.values(this.times))
      for (const a of this.emCampoDe(time.lado)) {
        const ancora = this.ancoraDeSaida(a, time);
        a.pos = ancora;
      }
    const batedor =
      this.emCampoDe(lado)
        .filter((a) => a.vaga !== 0)
        .sort((a, b) => distancia(a.pos, this.bola) - distancia(b.pos, this.bola))[0] ?? null;
    this.posse = lado;
    this.darBola(batedor);
    if (batedor) batedor.pos = { ...this.bola };
    this.conducao = null;
    this.ultimoPasse = null;
    this.acaoEm = this.t + 2;
  }

  /** Posição na saída de bola: a vaga recuada para o próprio campo. */
  private ancoraDeSaida(a: Atleta, time: Time): Ponto {
    const vaga = time.formacao[a.vaga] as Vaga;
    const x = vaga.posicao === "G" ? vaga.x : Math.min(MEIO_X - 1, vaga.x * 0.85);
    return noQuadro({ x, y: vaga.y }, this.paraDireita(time.lado));
  }

  private darBola(a: Atleta | null): void {
    this.dono = a;
    this.conducao = null;
    if (a) {
      this.posse = a.lado;
      this.bola = { ...a.pos };
    }
  }

  /** Bola para o adversário mais perto de um ponto (lateral, tiro livre, rebatida). */
  private bolaPara(lado: LadoCampo, ponto: Ponto, pausa = 3): void {
    const alvo = {
      x: limitar(ponto.x, 0.5, COMPRIMENTO - 0.5),
      y: limitar(ponto.y, 0.5, LARGURA - 0.5),
    };
    const atleta =
      [...this.emCampoDe(lado)].sort(
        (a, b) => distancia(a.pos, alvo) - distancia(b.pos, alvo),
      )[0] ?? null;
    if (atleta) atleta.pos = { ...alvo };
    this.darBola(atleta);
    this.bola = alvo;
    this.ultimoPasse = null;
    this.acaoEm = this.t + pausa;
  }

  private tiroDeMeta(lado: LadoCampo): void {
    const goleiro = this.goleiroDe(lado);
    const ponto = noQuadro({ x: 5.5, y: MEIO_Y }, this.paraDireita(lado));
    if (goleiro) {
      goleiro.pos = ponto;
      this.darBola(goleiro);
      this.acaoEm = this.t + 6;
      this.ultimoPasse = null;
    } else this.bolaPara(lado, ponto, 6);
  }

  /** Bola solta: fica com quem chegar primeiro. */
  private bolaSolta(ponto: Ponto): void {
    this.dono = null;
    this.conducao = null;
    this.bola = {
      x: limitar(ponto.x, 0.5, COMPRIMENTO - 0.5),
      y: limitar(ponto.y, 0.5, LARGURA - 0.5),
    };
    this.acaoEm = this.t + 1;
  }

  private disputarBolaSolta(): void {
    const todos = [...this.emCampoDe("casa"), ...this.emCampoDe("fora")];
    let melhor: Atleta | null = null;
    let melhorTempo = Infinity;
    for (const a of todos) {
      const tempo = distancia(a.pos, this.bola) / this.velocidadeMaxima(a) + this.rng.float(0, 0.6);
      if (tempo < melhorTempo) {
        melhorTempo = tempo;
        melhor = a;
      }
    }
    if (!melhor) return;
    if (melhorTempo > 1.5) {
      this.acaoEm = this.t + 1;
      return;
    }
    melhor.pos = { ...this.bola };
    this.darBola(melhor);
    this.acaoEm = this.t + 1;
  }

  // ---------------------------------------------------------------- decisão

  private agir(): void {
    if (!this.dono) {
      this.disputarBolaSolta();
      return;
    }
    const dono = this.dono;
    const time = this.times[dono.lado];
    const direita = this.paraDireita(dono.lado);
    const q = noQuadro(dono.pos, direita);
    const d = distanciaAoGol(q);
    const adversarios = this.emCampoDe(outro(dono.lado));
    const pertos = adversarios.filter((a) => distancia(a.pos, dono.pos) < 4).length;
    const maisPerto = Math.min(...adversarios.map((a) => distancia(a.pos, dono.pos)), 99);
    const estilo = time.tatica.estilo;

    if (dono.vaga === 0) {
      this.passar(dono, q, pertos);
      return;
    }
    // Sob pressão, o marcador pode dar o bote antes da jogada.
    if (pertos > 0 && this.bote(dono, adversarios)) return;

    const fin = this.att(dono, "finalizacao");
    const longe = this.att(dono, "chuteLonge");
    const cru = this.att(dono, "cruzamento");
    const dri = this.att(dono, "drible");
    const vel = this.att(dono, "velocidade");
    const angulo = Math.abs(q.y - MEIO_Y);

    // Os pesos usam o atributo comparado com a força do próprio jogador: decide o estilo
    // (quem finaliza bem chuta mais), sem fazer times fortes chutarem mais só por serem fortes.
    const nivel = Math.max(40, dono.j.forca);
    let wChute = 0;
    if (d <= 11) wChute = 1.45 * (fin / nivel);
    else if (d <= 18) wChute = 0.45 * (fin / nivel);
    else if (d <= 25) wChute = 0.16 * (longe / nivel) ** 2;
    else if (d <= 32) wChute = 0.05 * (longe / nivel) ** 3;
    if (angulo > 18 && d < 20) wChute *= 0.25;
    // Livre na entrada da área, arrisca; cercado lá dentro, prefere servir quem chega.
    if (d > 16 && d <= 28 && maisPerto > 4) wChute *= 2.2;
    if (d <= 16 && pertos >= 2) wChute *= 0.6;
    else if (d <= 16 && pertos === 1) wChute *= 0.8;

    let wCruz = 0;
    if (q.x > 78 && angulo > 14)
      wCruz = 1.5 * (cru / nivel) * (time.tatica.concentracao === "laterais" ? 1.4 : 1);

    const wDrible = pertos > 0 || maisPerto < 3 ? 0.3 * (dri / nivel) ** 2 : 0.04 * (dri / nivel);
    let wConduz = maisPerto > 6 ? 1.8 * (vel / nivel) : 0.25;
    if (q.x > 88) wConduz *= 0.4;
    let wPasse = 2.6 + (pertos > 0 ? 1 : 0) + (q.x < 35 ? 1 : 0);
    if (estilo === "contra-ataque" && q.x < 60) wPasse += 0.5;
    // Cadenciado: toca de lado, segura a bola e só arrisca o chute claro.
    if (estilo === "cadenciado") wPasse += 0.5;

    const comp = dono.comp;
    const opcoes = [
      { acao: "chute" as const, peso: wChute * 0.85 * comp.chute },
      { acao: "cruzamento" as const, peso: wCruz * comp.cruza },
      { acao: "drible" as const, peso: wDrible * comp.drible },
      { acao: "conducao" as const, peso: wConduz * comp.conduz },
      { acao: "passe" as const, peso: wPasse * comp.passe },
    ];
    const escolha = this.rng.weighted(opcoes, (o) => o.peso).acao;
    if (escolha === "chute") this.chutar(dono, "pe", pertos);
    else if (escolha === "cruzamento") this.cruzar(dono, false);
    else if (escolha === "drible") this.driblar(dono, q);
    else if (escolha === "conducao") this.conduzir(dono, q);
    else this.passar(dono, q, pertos);
  }

  // ---------------------------------------------------------------- ações

  private passar(dono: Atleta, q: Ponto, pertos: number): void {
    const time = this.times[dono.lado];
    const direita = this.paraDireita(dono.lado);
    const adversarios = this.emCampoDe(outro(dono.lado));
    const goleiro = dono.vaga === 0;
    const alcance = goleiro ? 65 : 45;
    const estilo = time.tatica.estilo;

    const opcoes: Array<{
      c: Atleta;
      rq: Ponto;
      dist: number;
      linha: number;
      livre: number;
      nota: number;
    }> = [];
    for (const c of this.emCampoDe(dono.lado)) {
      if (c === dono) continue;
      const dist = distancia(dono.pos, c.pos);
      if (dist < 3 || dist > alcance) continue;
      let livre = 10;
      let linha = 6;
      for (const o of adversarios) {
        const dl = distancia(o.pos, c.pos);
        if (dl < livre) livre = dl;
        const ds = distanciaAoSegmento(o.pos, dono.pos, c.pos);
        if (ds < linha) linha = ds;
      }
      const rq = noQuadro(c.pos, direita);
      const avanco = rq.x - q.x;
      let nota =
        (0.5 + livre / 10) *
        (0.4 + linha / 6) *
        // No terço final, avançar pesa menos: o jogo roda para quem chega de trás.
        Math.exp(
          avanco /
            ((estilo === "ataque" ? 20 : estilo === "cadenciado" ? 28 : 26) * (q.x > 70 ? 1.8 : 1)),
        );
      if (estilo === "contra-ataque" && avanco > 15) nota *= 1.5;
      if (dist > 30) nota *= 0.6;
      if (goleiro && c.vaga !== 0 && rq.x < 30) nota *= 1.3;
      // Passe para trás na linha de fundo: quem chega de frente para o gol, na marca do pênalti.
      if (q.x > 85 && rq.x > 80 && rq.x < q.x && Math.abs(rq.y - MEIO_Y) < 14 && livre > 3)
        nota *= 2.5;
      // Companheiro livre dentro da área: a assistência vale mais do que forçar o chute.
      if (q.x > 75 && naArea(rq) && livre > 4) nota *= 1.8;
      // Quem decide pesa o risco: passe arriscado só compensa se avança muito.
      const risco =
        (linha < 1.5 ? 0.2 : linha < 3 ? 0.06 : 0) + (livre < 1.5 ? 0.22 : livre < 3.5 ? 0.08 : 0);
      nota *= (1 - risco) ** (estilo === "cadenciado" ? 5 : 4);
      opcoes.push({ c, rq, dist, linha, livre, nota });
    }
    const profundidade = goleiro
      ? null
      : this.passeEmProfundidade(dono, q, direita, adversarios, estilo);
    if (!opcoes.length && !profundidade) {
      this.conduzir(dono, q);
      return;
    }
    if (profundidade) {
      const pesoNormal = opcoes.reduce((soma, o) => soma + o.nota ** 2, 0);
      if (this.rng.chance(profundidade.nota ** 2 / (pesoNormal + profundidade.nota ** 2))) {
        this.lancarEmProfundidade(dono, profundidade);
        return;
      }
    }
    if (!opcoes.length) {
      this.conduzir(dono, q);
      return;
    }
    const escolha = this.rng.weighted(opcoes, (o) => o.nota ** 2);
    const passe = this.att(dono, "passe");
    time.est.passes++;
    dono.est.passes++;

    // Impedimento: passe para frente, além do penúltimo defensor, no campo de ataque.
    if (escolha.rq.x > q.x && escolha.rq.x > MEIO_X) {
      const linhas = adversarios.map((o) => noQuadro(o.pos, direita).x).sort((a, b) => b - a);
      const penultimo = linhas[1] ?? COMPRIMENTO;
      if (escolha.rq.x > penultimo + 1 && this.rng.chance(0.8)) {
        time.est.impedimentos++;
        this.registrar("impedimento", {
          time: dono.lado,
          jogador: escolha.c.j.id,
          ...this.xy(escolha.c.pos),
        });
        this.bolaPara(outro(dono.lado), escolha.c.pos, 4);
        return;
      }
    }

    let chance =
      0.99 -
      0.004 * Math.max(0, escolha.dist - 15) -
      (escolha.linha < 1.5 ? 0.15 : escolha.linha < 3 ? 0.04 : 0) -
      (escolha.livre < 1.5 ? 0.15 : escolha.livre < 3.5 ? 0.04 : 0) -
      (pertos > 0 ? 0.03 : 0) +
      (passe - this.marcacaoPerto(escolha.c, adversarios)) / 250;
    chance = limitar(chance, 0.3, 0.98);
    const duracao = Math.max(1, Math.round(escolha.dist / 16));

    if (this.rng.chance(chance)) {
      time.est.passesCertos++;
      dono.est.passesCertos++;
      this.ultimoPasse = { de: dono, t: this.t };
      escolha.c.pos = { ...escolha.c.pos };
      this.darBola(escolha.c);
      // Tempo de dominar e olhar o jogo antes da próxima ação.
      this.acaoEm = this.t + duracao + this.rng.int(3, 5);
      return;
    }
    // Passe errado: interceptado por quem corta a linha, ou sai pela lateral.
    const cortador = [...adversarios].sort(
      (a, b) =>
        distanciaAoSegmento(a.pos, dono.pos, escolha.c.pos) -
        distanciaAoSegmento(b.pos, dono.pos, escolha.c.pos),
    )[0];
    if (cortador && this.rng.chance(0.8)) {
      this.times[cortador.lado].est.interceptacoes++;
      cortador.est.interceptacoes++;
      this.darBola(cortador);
      this.ultimoPasse = null;
      this.acaoEm = this.t + duracao;
      return;
    }
    const fora = { x: escolha.c.pos.x, y: escolha.c.pos.y < MEIO_Y ? 0.5 : LARGURA - 0.5 };
    this.bolaPara(outro(dono.lado), fora, 5);
  }

  /**
   * Passe em profundidade: bola no espaço atrás da linha de defesa para quem chega correndo.
   * Só existe se houver espaço entre a linha e o goleiro: contra linha alta é a arma do
   * contra-ataque; contra time fechado lá atrás, quase não aparece.
   */
  private passeEmProfundidade(
    dono: Atleta,
    q: Ponto,
    direita: boolean,
    adversarios: readonly Atleta[],
    estilo: Estilo,
  ): { alvo: Ponto; nota: number; receptor: Atleta; distancia: number } | null {
    let primeiro = 0;
    let segundo = 0;
    for (const o of adversarios) {
      const ox = noQuadro(o.pos, direita).x;
      if (ox > primeiro) {
        segundo = primeiro;
        primeiro = ox;
      } else if (ox > segundo) segundo = ox;
    }
    const goleiro = this.goleiroDe(outro(dono.lado));
    const goleiroX = goleiro ? noQuadro(goleiro.pos, direita).x : COMPRIMENTO;
    const espaco = goleiroX - segundo;
    if (espaco < 12) return null;
    let melhor: { alvo: Ponto; nota: number; receptor: Atleta; distancia: number } | null = null;
    for (const c of this.emCampoDe(dono.lado)) {
      const familia = c.papel ? DADOS_FUNCAO[c.papel.funcao].familia : c.j.posicao;
      if (c === dono || c.vaga === 0 || familia === "Z" || familia === "G") continue;
      const rq = noQuadro(c.pos, direita);
      if (rq.x < q.x + 4 || rq.x < segundo - 6) continue;
      const alvoQ = {
        x: Math.min(goleiroX - 4, segundo + Math.min(16, espaco * 0.55)),
        y: rq.y + (MEIO_Y - rq.y) * 0.2,
      };
      const alvo = noQuadro(alvoQ, direita);
      const dist = distancia(dono.pos, alvo);
      if (dist > 50 || dist < 10) continue;
      const tempoReceptor = distancia(c.pos, alvo) / this.velocidadeMaxima(c);
      let tempoDefesa = Infinity;
      for (const o of adversarios) {
        const t = distancia(o.pos, alvo) / this.velocidadeMaxima(o);
        if (t < tempoDefesa) tempoDefesa = t;
      }
      const vantagem = tempoDefesa - tempoReceptor;
      if (vantagem < -0.3) continue;
      let nota =
        1.2 *
        Math.exp((alvoQ.x - q.x) / 26) *
        (0.5 + Math.min(vantagem, 2) / 2.5) *
        dono.comp.profundidade *
        c.comp.alvoProfundidade;
      if (estilo === "contra-ataque") nota *= 1.6;
      if (estilo === "cadenciado") nota *= 0.3;
      if (!melhor || nota > melhor.nota) melhor = { alvo, nota, receptor: c, distancia: dist };
    }
    return melhor;
  }

  /** Lança a bola no espaço: quem chegar primeiro (o atacante ou a defesa) fica com ela. */
  private lancarEmProfundidade(
    dono: Atleta,
    lance: { alvo: Ponto; receptor: Atleta; distancia: number },
  ): void {
    const time = this.times[dono.lado];
    time.est.passes++;
    dono.est.passes++;
    const precisao = limitar(
      0.86 + (this.att(dono, "passe") - 65) / 220 - 0.003 * Math.max(0, lance.distancia - 25),
      0.5,
      0.97,
    );
    const direita = this.paraDireita(dono.lado);
    let alvo = lance.alvo;
    if (!this.rng.chance(precisao)) {
      // Passou da conta: a bola corre para o goleiro ou para fora.
      const q = noQuadro(alvo, direita);
      alvo = noQuadro(
        { x: Math.min(COMPRIMENTO - 1, q.x + this.rng.float(8, 16)), y: q.y },
        direita,
      );
    } else {
      time.est.passesCertos++;
      dono.est.passesCertos++;
    }
    this.ultimoPasse = { de: dono, t: this.t };
    this.bolaSolta(alvo);
    this.acaoEm = this.t + Math.max(1, Math.round(lance.distancia / 18));
  }

  private conduzir(dono: Atleta, q: Ponto): void {
    const direita = this.paraDireita(dono.lado);
    const avanco = this.rng.float(5, 9) * (0.8 + this.att(dono, "velocidade") / 250);
    const [de, ate] = dono.comp.corta;
    const y = q.y + (MEIO_Y - q.y) * this.rng.float(de, ate) + this.rng.float(-3, 3);
    this.conducao = noQuadro(
      { x: Math.min(COMPRIMENTO - 3, q.x + avanco), y: limitar(y, 2, LARGURA - 2) },
      direita,
    );
    this.acaoEm = this.t + this.rng.int(2, 3);
  }

  private driblar(dono: Atleta, q: Ponto): void {
    const adversarios = this.emCampoDe(outro(dono.lado));
    const marcador = [...adversarios].sort(
      (a, b) => distancia(a.pos, dono.pos) - distancia(b.pos, dono.pos),
    )[0];
    const time = this.times[dono.lado];
    time.est.dribles++;
    dono.est.dribles++;
    if (!marcador) {
      this.conduzir(dono, q);
      return;
    }
    const chance = limitar(
      0.52 +
        (this.att(dono, "drible") - this.att(marcador, "desarme")) / 110 +
        (this.att(dono, "velocidade") - this.att(marcador, "velocidade")) / 350,
      0.2,
      0.82,
    );
    if (this.rng.chance(chance)) {
      time.est.driblesCertos++;
      const direita = this.paraDireita(dono.lado);
      dono.pos = noQuadro({ x: Math.min(COMPRIMENTO - 2, q.x + 4), y: q.y }, direita);
      const mq = noQuadro(marcador.pos, direita);
      marcador.pos = noQuadro({ x: mq.x - 2, y: mq.y }, direita);
      this.bola = { ...dono.pos };
      this.acaoEm = this.t + 1;
      return;
    }
    const marcacao = this.times[marcador.lado].tatica.marcacao;
    const dureza = marcacao === "leve" ? 0.85 : marcacao === "pesada" ? 1.15 : 1.45;
    // Na área, o defensor evita derrubar: falta ali é pênalti.
    const naAreaDrible = naArea(noQuadro(dono.pos, this.paraDireita(dono.lado)));
    if (this.rng.chance(0.17 * dureza * (naAreaDrible ? 0.15 : 1))) {
      this.falta(marcador, dono);
      return;
    }
    this.times[marcador.lado].est.desarmes++;
    marcador.est.desarmes++;
    this.darBola(marcador);
    this.ultimoPasse = null;
    this.acaoEm = this.t + 1;
  }

  /** Bote do marcador mais perto: desarma, comete falta ou erra (e a jogada segue). */
  private bote(dono: Atleta, adversarios: readonly Atleta[]): boolean {
    let marcador: Atleta | null = null;
    let menor = 4;
    for (const o of adversarios) {
      const d = distancia(o.pos, dono.pos);
      if (d < menor) {
        menor = d;
        marcador = o;
      }
    }
    if (!marcador) return false;
    const marcacao = this.times[marcador.lado].tatica.marcacao;
    const dureza = marcacao === "leve" ? 0.85 : marcacao === "pesada" ? 1.2 : 1.5;
    if (!this.rng.chance(0.1 * dureza * marcador.comp.bote)) return false;
    // Dentro da área o defensor se cuida: falta ali é pênalti.
    const area = naArea(noQuadro(dono.pos, this.paraDireita(dono.lado)));
    if (this.rng.chance(0.17 * dureza * (area ? 0.12 : 1))) {
      this.falta(marcador, dono);
      return true;
    }
    const chance = limitar(
      0.45 +
        (this.att(marcador, "desarme") - this.att(dono, "drible")) / 120 +
        (this.att(marcador, "forcaFisica") - this.att(dono, "forcaFisica")) / 400,
      0.15,
      0.8,
    );
    if (!this.rng.chance(chance)) return false;
    this.times[marcador.lado].est.desarmes++;
    marcador.est.desarmes++;
    this.darBola(marcador);
    this.ultimoPasse = null;
    this.acaoEm = this.t + 1;
    return true;
  }

  /**
   * Nível de quem marca um jogador: média de marcação e desarme do adversário mais perto.
   * Serve de régua para passe e chute serem relativos (70 quando ninguém está perto).
   */
  private marcacaoPerto(a: Atleta, adversarios: readonly Atleta[]): number {
    let perto: Atleta | null = null;
    let menor = 8;
    for (const o of adversarios) {
      if (o.vaga === 0) continue;
      const d = distancia(o.pos, a.pos);
      if (d < menor) {
        menor = d;
        perto = o;
      }
    }
    if (!perto) return 65;
    return 0.5 * this.att(perto, "marcacao") + 0.5 * this.att(perto, "desarme");
  }

  private falta(infrator: Atleta, vitima: Atleta): void {
    const time = this.times[infrator.lado];
    time.est.faltas++;
    infrator.est.faltas++;
    vitima.est.faltasSofridas++;
    this.registrar("falta", {
      time: infrator.lado,
      jogador: infrator.j.id,
      outro: vitima.j.id,
      ...this.xy(vitima.pos),
    });
    const marcacao = time.tatica.marcacao;
    const dureza = marcacao === "leve" ? 0.8 : marcacao === "pesada" ? 1.15 : 1.5;
    if (this.rng.chance(0.003 * dureza)) this.expulsar(infrator, false);
    else if (this.rng.chance(0.19 * dureza * (infrator.amarelos ? 0.45 : 1))) {
      infrator.amarelos++;
      infrator.est.amarelos++;
      time.est.amarelos++;
      this.registrar("cartao-amarelo", { time: infrator.lado, jogador: infrator.j.id });
      if (infrator.amarelos >= 2) this.expulsar(infrator, true);
    }
    if (vitima.emCampo && this.rng.chance(0.01)) this.lesionar(vitima);

    const direita = this.paraDireita(vitima.lado);
    const q = noQuadro(vitima.pos, direita);
    if (naArea(q)) {
      this.penalti(vitima.lado);
      return;
    }
    if (q.x > 77 && Math.abs(q.y - MEIO_Y) < 20 && this.rng.chance(0.35)) {
      const batedor = this.melhor(vitima.lado, (a) => this.att(a, "chuteLonge"));
      if (batedor) {
        batedor.pos = { ...vitima.pos };
        this.darBola(batedor);
        this.chutar(batedor, "falta", 0);
        return;
      }
    }
    this.bolaPara(vitima.lado, vitima.pos, 4);
  }

  private melhor(lado: LadoCampo, valor: (a: Atleta) => number): Atleta | null {
    return (
      this.emCampoDe(lado)
        .filter((a) => a.vaga !== 0)
        .sort((a, b) => valor(b) - valor(a))[0] ?? null
    );
  }

  private penalti(lado: LadoCampo): void {
    this.registrar("penalti", { time: lado });
    const batedor = this.melhor(lado, (a) => this.att(a, "finalizacao"));
    if (!batedor) return;
    batedor.pos = noQuadro({ x: COMPRIMENTO - 11, y: MEIO_Y }, this.paraDireita(lado));
    this.darBola(batedor);
    this.chutar(batedor, "penalti", 0);
  }

  private cruzar(dono: Atleta, bolaParada: boolean): void {
    const time = this.times[dono.lado];
    const direita = this.paraDireita(dono.lado);
    time.est.cruzamentos++;
    let alvos = this.emCampoDe(dono.lado).filter(
      (a) => a !== dono && a.vaga !== 0 && naArea(noQuadro(a.pos, direita)),
    );
    if (bolaParada) {
      // Na bola parada sobem os melhores no cabeceio.
      alvos = this.emCampoDe(dono.lado)
        .filter((a) => a !== dono && a.vaga !== 0)
        .sort((a, b) => this.att(b, "cabeceio") - this.att(a, "cabeceio"))
        .slice(0, 4);
      alvos.forEach((a, i) => {
        a.pos = noQuadro(
          { x: COMPRIMENTO - this.rng.float(5, 12), y: MEIO_Y - 9 + i * 6 },
          direita,
        );
      });
    }
    const defesa = this.outroLado(dono.lado);
    const goleiro = this.goleiroDe(defesa);
    if (!alvos.length) {
      this.rebatida(defesa, dono.pos);
      return;
    }
    if (
      goleiro &&
      this.rng.chance(limitar(0.12 + (this.att(goleiro, "saida") - 60) / 300, 0.05, 0.3))
    ) {
      this.darBola(goleiro);
      this.acaoEm = this.t + 5;
      this.ultimoPasse = null;
      return;
    }
    const alvo = this.rng.weighted(alvos, (a) => this.att(a, "cabeceio") ** 2 * a.comp.alvoArea);
    const zagueiros = this.emCampoDe(defesa).filter((a) => a.vaga !== 0);
    const marcador = zagueiros.sort(
      (a, b) => distancia(a.pos, alvo.pos) - distancia(b.pos, alvo.pos),
    )[0];
    const defesaAerea = marcador
      ? Math.max(this.att(marcador, "cabeceio"), this.att(marcador, "marcacao") * 0.9)
      : 30;
    const chance = limitar(
      0.38 +
        (this.att(alvo, "cabeceio") - defesaAerea) / 120 +
        (this.att(dono, "cruzamento") - 65) / 250,
      0.15,
      0.8,
    );
    if (this.rng.chance(chance)) {
      this.ultimoPasse = { de: dono, t: this.t };
      this.darBola(alvo);
      this.chutar(alvo, "cabeca", 1);
      return;
    }
    this.rebatida(defesa, alvo.pos);
  }

  private outroLado(l: LadoCampo): LadoCampo {
    return outro(l);
  }

  /** Defesa afasta a bola: às vezes para escanteio, às vezes para o meio. */
  private rebatida(defesa: LadoCampo, ponto: Ponto): void {
    if (this.rng.chance(0.42)) {
      this.escanteio(outro(defesa));
      return;
    }
    const direitaDefesa = this.paraDireita(defesa);
    const q = noQuadro(ponto, direitaDefesa);
    this.bolaSolta(
      noQuadro(
        { x: q.x + this.rng.float(15, 35), y: this.rng.float(8, LARGURA - 8) },
        direitaDefesa,
      ),
    );
  }

  private escanteio(lado: LadoCampo): void {
    const time = this.times[lado];
    time.est.escanteios++;
    const direita = this.paraDireita(lado);
    const canto = noQuadro(
      { x: COMPRIMENTO - 0.5, y: this.rng.chance(0.5) ? 0.5 : LARGURA - 0.5 },
      direita,
    );
    this.registrar("escanteio", { time: lado, ...this.xy(canto) });
    const batedor = this.melhor(lado, (a) => this.att(a, "cruzamento"));
    if (!batedor) return;
    batedor.pos = canto;
    this.darBola(batedor);
    this.cruzar(batedor, true);
  }

  private chutar(dono: Atleta, tipo: "pe" | "cabeca" | "falta" | "penalti", pertos: number): void {
    const time = this.times[dono.lado];
    const defesa = outro(dono.lado);
    const direita = this.paraDireita(dono.lado);
    const q = noQuadro(dono.pos, direita);
    const d = distanciaAoGol(q);
    const angulo = Math.abs(q.y - MEIO_Y);
    const golCentro = noQuadro({ x: COMPRIMENTO, y: MEIO_Y }, direita);
    let nafrente = 0;
    if (tipo === "pe" || tipo === "cabeca")
      for (const o of this.emCampoDe(defesa))
        if (o.vaga !== 0 && distanciaAoSegmento(o.pos, dono.pos, golCentro) < 1.6) nafrente++;
    const habilidade =
      tipo === "cabeca"
        ? this.att(dono, "cabeceio")
        : tipo === "falta"
          ? this.att(dono, "chuteLonge")
          : tipo === "penalti"
            ? this.att(dono, "finalizacao")
            : d > 20
              ? 0.6 * this.att(dono, "chuteLonge") + 0.4 * this.att(dono, "finalizacao")
              : this.att(dono, "finalizacao");

    let xg: number;
    if (tipo === "penalti") xg = 0.76 * (habilidade / 75) ** 0.4;
    else if (tipo === "falta") xg = 0.05 * (habilidade / Math.max(40, dono.j.forca)) ** 2;
    else {
      xg = tipo === "cabeca" ? 0.5 * Math.exp(-d / 5.5) : 0.95 * Math.exp(-d / 7.2);
      xg *= limitar(1.15 - Math.max(0, angulo - 4) / 22, 0.25, 1.1);
      xg *= 1 - 0.18 * Math.min(2, pertos);
      // Gente na frente do chute (entre a bola e o gol) tira ângulo: o ferrolho funciona.
      xg *= 0.78 ** Math.min(3, nafrente);
      // Habilidade contra a marcação de quem está perto: craque contra zaga forte vale menos.
      const defesaPerto = this.marcacaoPerto(dono, this.emCampoDe(defesa));
      xg *= (habilidade / Math.max(40, defesaPerto)) ** 1.6 * 0.9;
      // Quem já marcou passa a ser vigiado de perto: o terceiro gol do mesmo jogador é raro.
      xg *= 0.62 ** dono.est.gols;
    }
    xg = limitar(xg, 0.005, 0.95);
    time.est.chutes++;
    time.est.xg += xg;
    dono.est.chutes++;
    const assistente =
      this.ultimoPasse &&
      this.ultimoPasse.de.lado === dono.lado &&
      this.ultimoPasse.de !== dono &&
      this.t - this.ultimoPasse.t <= 12
        ? this.ultimoPasse.de
        : null;
    if (assistente && tipo !== "penalti" && tipo !== "falta") assistente.est.passesDecisivos++;
    const base = {
      time: dono.lado,
      jogador: dono.j.id,
      ...this.xy(dono.pos),
      valor: Math.round(xg * 1000) / 1000,
    };

    // Para onde a bola vai em cada desfecho (o mini-campo anima o chute até lá antes do destaque).
    const destino = (tipoDestino: "gol" | "fora" | "trave" | "bloqueio") =>
      this.destinoDoChute(q, direita, tipoDestino);

    if (tipo === "pe" && this.rng.chance(0.08 + 0.05 * pertos + 0.08 * Math.min(3, nafrente))) {
      this.registrar("bloqueio", { ...base, destino: destino("bloqueio") });
      this.rebatida(defesa, dono.pos);
      return;
    }
    const noAlvo =
      tipo === "penalti"
        ? 0.88
        : tipo === "falta"
          ? 0.38
          : limitar(0.27 + xg * 1.1 + (habilidade - Math.max(40, dono.j.forca)) / 250, 0.15, 0.9);
    if (!this.rng.chance(noAlvo)) {
      if (this.rng.chance(0.06)) {
        this.registrar("chute-trave", { ...base, destino: destino("trave") });
        if (tipo === "penalti") this.registrar("penalti-perdido", base);
        this.bolaSolta(
          noQuadro({ x: COMPRIMENTO - this.rng.float(4, 12), y: this.rng.float(20, 48) }, direita),
        );
        return;
      }
      this.registrar("chute-fora", { ...base, destino: destino("fora") });
      if (tipo === "penalti") this.registrar("penalti-perdido", base);
      this.tiroDeMeta(defesa);
      return;
    }
    time.est.chutesNoGol++;
    dono.est.chutesNoGol++;
    const goleiro = this.goleiroDe(defesa);
    let chanceGol = limitar(xg / noAlvo, 0.03, 0.97);
    if (goleiro) {
      const nota =
        tipo === "penalti"
          ? 0.6 * this.att(goleiro, "penalti") + 0.4 * this.att(goleiro, "reflexo")
          : tipo === "cabeca"
            ? 0.4 * this.att(goleiro, "reflexo") +
              0.3 * this.att(goleiro, "colocacao") +
              0.3 * this.att(goleiro, "saida")
            : 0.5 * this.att(goleiro, "reflexo") +
              0.35 * this.att(goleiro, "colocacao") +
              0.15 * this.att(goleiro, "saida");
      // Goleiro contra o nível de quem chuta, não contra uma régua fixa.
      chanceGol *= limitar(1 - (nota - habilidade) / 140, 0.6, 1.35);
    } else chanceGol = Math.max(chanceGol, 0.85);
    chanceGol = limitar(chanceGol, 0.02, 0.98);

    if (this.rng.chance(chanceGol)) {
      this.gol(
        dono,
        tipo !== "penalti" && tipo !== "falta" ? assistente : null,
        xg,
        destino("gol"),
      );
      return;
    }
    if (goleiro) {
      this.times[defesa].est.defesas++;
      goleiro.est.defesas++;
    }
    this.registrar("defesa", {
      ...base,
      ...(goleiro
        ? { outro: goleiro.j.id, destino: this.xy(goleiro.pos) }
        : { destino: destino("gol") }),
    });
    if (tipo === "penalti") this.registrar("penalti-perdido", base);
    const r = this.rng.next();
    if (r < 0.33) this.escanteio(dono.lado);
    else if (r < 0.75 && goleiro) {
      this.darBola(goleiro);
      this.ultimoPasse = null;
      this.acaoEm = this.t + 4;
    } else
      this.bolaSolta(
        noQuadro({ x: COMPRIMENTO - this.rng.float(5, 12), y: this.rng.float(18, 50) }, direita),
      );
  }

  /**
   * Ponto do campo onde o chute termina: dentro do gol, numa trave, para fora ou na zaga.
   * Sem sorteio (não muda a partida): o lugar sai do segundo de jogo e da posição do chute.
   */
  private destinoDoChute(
    q: Ponto,
    direita: boolean,
    tipo: "gol" | "fora" | "trave" | "bloqueio",
  ): { x: number; y: number } {
    const u = ((this.t * 37 + Math.round(q.y * 10)) % 100) / 100;
    const lado = q.y >= MEIO_Y ? 1 : -1;
    let alvo: Ponto;
    if (tipo === "gol") alvo = { x: COMPRIMENTO + 1.2, y: MEIO_Y + (u * 2 - 1) * 3.2 };
    else if (tipo === "trave") alvo = { x: COMPRIMENTO, y: MEIO_Y + lado * 3.66 };
    else if (tipo === "fora") alvo = { x: COMPRIMENTO + 1.5, y: MEIO_Y + lado * (4.5 + u * 6) };
    else {
      const d = distanciaAoGol(q) || 1;
      alvo = { x: q.x + ((COMPRIMENTO - q.x) / d) * 2, y: q.y + ((MEIO_Y - q.y) / d) * 2 };
    }
    return this.xy(noQuadro(alvo, direita));
  }

  private gol(
    autor: Atleta,
    assistente: Atleta | null,
    xg: number,
    destino?: { x: number; y: number },
  ): void {
    const lado = autor.lado;
    const indice = lado === "casa" ? 0 : 1;
    this.placarAtual[indice]++;
    this.times[lado].est.gols++;
    autor.est.gols++;
    if (assistente) assistente.est.assistencias++;
    for (const a of this.emCampoDe(outro(lado))) a.est.golsSofridos++;
    this.registrar("gol", {
      time: lado,
      jogador: autor.j.id,
      ...(assistente ? { outro: assistente.j.id } : {}),
      ...this.xy(autor.pos),
      valor: Math.round(xg * 1000) / 1000,
      ...(destino ? { destino } : {}),
      placar: [...this.placarAtual] as [number, number],
    });
    this.times.casa.reavaliar = true;
    this.times.fora.reavaliar = true;
    this.saidaDeBola(outro(lado));
    this.acaoEm = this.t + 25;
  }

  // ---------------------------------------------------------------- cartões, lesões e trocas

  private expulsar(a: Atleta, segundoAmarelo: boolean): void {
    const time = this.times[a.lado];
    this.times.casa.reavaliar = true;
    this.times.fora.reavaliar = true;
    time.est.vermelhos++;
    a.est.vermelho = true;
    this.registrar("cartao-vermelho", {
      time: a.lado,
      jogador: a.j.id,
      ...(segundoAmarelo ? { valor: 2 } : {}),
    });
    this.tirarDeCampo(a);
    if (a.vaga === 0) this.cobrirGol(time);
  }

  private tirarDeCampo(a: Atleta): void {
    const time = this.times[a.lado];
    this.cacheEmCampo[a.lado] = null;
    a.emCampo = false;
    a.saiuEm = this.t;
    if (a.vaga >= 0) time.vagas[a.vaga] = null;
    if (this.dono === a) this.bolaSolta(a.pos);
  }

  /** Sem goleiro: entra o reserva (se der) no lugar de um atacante, ou um da linha vai para o gol. */
  private cobrirGol(time: Time): void {
    const reserva = time.atletas.find((a) => !a.usado && a.j.posicao === "G");
    const sacrificado = this.emCampoDe(time.lado)
      .filter((a) => a.vaga !== 0)
      .sort((a, b) => (time.formacao[b.vaga]?.x ?? 0) - (time.formacao[a.vaga]?.x ?? 0))[0];
    if (reserva && sacrificado && this.podeTrocar(time)) {
      this.trocar(time, sacrificado, reserva);
      this.moverParaVaga(time, reserva, 0);
      return;
    }
    const improvisado = [...this.emCampoDe(time.lado)].sort((a, b) => a.j.forca - b.j.forca)[0];
    if (improvisado) this.moverParaVaga(time, improvisado, 0);
  }

  private moverParaVaga(time: Time, a: Atleta, vaga: number): void {
    this.cacheEmCampo[time.lado] = null;
    if (a.vaga >= 0 && time.vagas[a.vaga] === a) time.vagas[a.vaga] = null;
    a.vaga = vaga;
    time.vagas[vaga] = a;
    this.definirPapel(a, time.formacao[vaga] as Vaga, time.papeis[vaga]);
    this.renovar(a);
  }

  /** Posição, função e encaixe de quem está numa vaga. */
  private definirPapel(a: Atleta, vaga: Vaga, escolhido: PapelEmCampo | null | undefined): void {
    const papel = papelNaVaga(a.j, vaga, escolhido);
    a.papel = papel;
    a.comp = COMPORTAMENTO[papel.funcao];
    a.fator = familiaridade(a.j, papel);
    a.est.papel = papel;
  }

  private lesionar(a: Atleta): void {
    a.est.lesionado = true;
    this.registrar("lesao", { time: a.lado, jogador: a.j.id });
    const time = this.times[a.lado];
    const reserva = this.reservaPara(time, a);
    if (reserva && this.podeTrocar(time)) this.trocar(time, a, reserva);
    else {
      const vaga = a.vaga;
      this.tirarDeCampo(a);
      if (vaga === 0) this.cobrirGol(time);
    }
  }

  private podeTrocar(time: Time): boolean {
    if (time.trocas >= this.maxTrocas) return false;
    const intervalo = this.s === 0;
    return intervalo || time.paradas.has(this.t) || time.paradas.size < 3;
  }

  private trocar(time: Time, sai: Atleta, entra: Atleta): void {
    const vaga = sai.vaga;
    this.tirarDeCampo(sai);
    entra.usado = true;
    entra.emCampo = true;
    entra.entrouEm = this.t;
    entra.pos = { ...sai.pos };
    this.moverParaVaga(time, entra, vaga);
    time.trocas++;
    time.est.substituicoes++;
    if (this.s !== 0) time.paradas.add(this.t);
    this.registrar("substituicao", { time: time.lado, jogador: sai.j.id, outro: entra.j.id });
  }

  private reservaPara(time: Time, sai: Atleta): Atleta | null {
    const vaga = time.formacao[sai.vaga];
    if (!vaga) return null;
    const banco = time.atletas.filter(
      (a) => !a.usado && (vaga.posicao === "G" || a.j.posicao !== "G"),
    );
    const escolhido = time.papeis[sai.vaga];
    return (
      banco.sort(
        (a, b) => notaNaVaga(b.j, vaga, escolhido) - notaNaVaga(a.j, vaga, escolhido),
      )[0] ?? null
    );
  }

  private aCadaMinuto(): void {
    for (const time of Object.values(this.times))
      for (const a of this.emCampoDe(time.lado)) this.renovar(a);
    // Lesões raras (uma a cada duas ou três partidas), mais prováveis em quem está esgotado.
    for (const time of Object.values(this.times))
      for (const a of this.emCampoDe(time.lado))
        if (this.rng.chance(0.0001 * (1 + (100 - a.condicao) / 40))) this.lesionar(a);

    const minuto = this.minutoDe(this.s).minuto;
    // Quem goleia relaxa: com 3 gols de vantagem, o time rende um pouco menos.
    for (const lado of LADOS_CAMPO) {
      const saldo =
        this.placarAtual[lado === "casa" ? 0 : 1] - this.placarAtual[lado === "casa" ? 1 : 0];
      this.times[lado].acomodacao = saldo >= 3 ? 0.96 : 1;
    }
    // O técnico da CPU lê o jogo: a cada 5 minutos e logo depois de gol ou expulsão.
    for (const time of Object.values(this.times))
      if (time.dados.cpu && minuto >= 20 && (minuto % 5 === 0 || time.reavaliar)) {
        time.reavaliar = false;
        this.tecnicoCpu(time, minuto);
      }

    // A CPU troca os mais cansados no 2º tempo e na prorrogação.
    if (this.periodo < 2) return;
    if (minuto < 58 || minuto % 6 !== 0) return;
    for (const time of Object.values(this.times)) {
      if (!time.dados.cpu) continue;
      const cansados = this.emCampoDe(time.lado)
        .filter((a) => a.condicao < (minuto >= 75 ? 70 : 62))
        .sort((a, b) => a.condicao - b.condicao)
        .slice(0, 2);
      for (const sai of cansados) {
        const entra = this.reservaPara(time, sai);
        if (entra && this.podeTrocar(time)) this.trocar(time, sai, entra);
      }
    }
  }

  // ---------------------------------------------------------------- técnico da CPU

  /**
   * O técnico da CPU olha placar, minuto, diferença de força e número de jogadores e decide uma
   * postura de -2 (fechar a casinha) a +2 (todo mundo no ataque): perdendo no fim, vai para cima;
   * ganhando, cadencia e fecha a defesa; levando goleada, recua para não piorar. Muda estilo,
   * marcação, formação e, se der, faz uma troca tática. Sem sorteio: a mesma leitura sempre.
   */
  private tecnicoCpu(time: Time, minuto: number): void {
    const adv = this.times[outro(time.lado)];
    const meus = this.placarAtual[time.lado === "casa" ? 0 : 1];
    const deles = this.placarAtual[time.lado === "casa" ? 1 : 0];
    const saldo = meus - deles;
    const forca = (t: Time) =>
      (this.emCampoDe(t.lado).reduce((s, a) => s + a.j.forca, 0) / 11) * (t.dados.ajuste ?? 1);
    const diferenca = forca(time) - forca(adv);
    const final = minuto >= 60;
    // Antes dos 60 minutos, só mexe se o placar já estiver aberto por 2 ou mais.
    if (!final && Math.abs(saldo) < 2 && time.planoCpu === undefined) return;

    let postura = diferenca > 6 ? 1 : diferenca < -6 ? -1 : 0;
    let estilo: Estilo | null = null;
    // Motivos em português: são as chaves da tradução (a narração traduz ao mostrar).
    let motivo: string;
    let umAMenos = false;
    if (final) {
      if (saldo === 0) {
        postura = diferenca >= 3 && minuto >= 70 ? Math.max(postura, 1) : postura;
        motivo =
          postura > 0
            ? chave("vai para cima em busca da vitória")
            : chave("aceita o empate e se protege");
      } else if (saldo === -1) {
        postura = minuto >= 82 ? 2 : minuto >= 65 ? 1 : 0;
        motivo =
          postura === 2
            ? chave("vai para o tudo ou nada atrás do empate")
            : chave("adianta o time atrás do empate");
      } else if (saldo === -2) {
        postura = minuto >= 80 ? 1 : 2;
        motivo = chave("se lança ao ataque para tentar a virada");
      } else if (saldo <= -3) {
        postura = -1;
        estilo = "contra-ataque";
        motivo = chave("recua para não tomar uma goleada ainda maior");
      } else if (saldo === 1) {
        postura = minuto >= 85 ? -2 : minuto >= 75 ? -1 : 0;
        estilo = postura < 0 ? "contra-ataque" : diferenca > 5 ? "cadenciado" : "equilibrado";
        motivo = chave("fecha a defesa para segurar a vantagem");
      } else {
        postura = -1;
        estilo = "cadenciado";
        motivo = chave("cadencia o jogo com a vantagem garantida");
      }
    } else if (saldo <= -2) {
      postura = Math.max(postura, 1);
      motivo = chave("adianta o time para diminuir o placar");
    } else if (saldo >= 2) {
      postura = Math.min(postura, 0);
      estilo = "cadenciado";
      motivo = chave("toca a bola e administra o placar");
    } else motivo = chave("volta ao equilíbrio");
    const meusEmCampo = this.emCampoDe(time.lado).length;
    if (meusEmCampo < this.emCampoDe(adv.lado).length && !(saldo < 0 && minuto >= 70)) {
      postura -= 1;
      umAMenos = true;
    }
    postura = limitar(postura, -2, 2);
    estilo ??= postura >= 1 ? "ataque" : postura <= -1 ? "contra-ataque" : "equilibrado";
    const amarelados = this.emCampoDe(time.lado).filter((a) => a.amarelos > 0).length;
    const marcacao: Marcacao = postura >= 2 && amarelados < 2 ? "pesada" : "leve";
    const plano = `${postura}|${estilo}|${marcacao}`;
    if (plano === time.planoCpu) return;
    time.planoCpu = plano;
    time.tatica = { ...time.tatica, estilo, marcacao };

    const mudouPostura = postura !== time.posturaCpu;
    time.posturaCpu = postura;
    let nomeFormacao = "";
    if (mudouPostura) {
      const formacao = postura === 0 ? null : FORMACAO_POR_POSTURA[postura];
      this.reorganizar(
        time,
        formacao ? FORMACOES[formacao] : vagasDaEscalacao(time.dados.escalacao),
      );
      nomeFormacao = formacao ?? "original";
      // Troca tática: atacante no lugar de defensor para buscar o gol; o contrário para segurar.
      if (minuto >= 55 && postura >= 2) this.trocaTatica(time, ["Z", "M"], ["A"]);
      if (minuto >= 70 && postura <= -1 && saldo > 0) this.trocaTatica(time, ["A"], ["Z", "M"]);
    }
    this.registrar("mudanca-tatica", {
      time: time.lado,
      detalhe: motivo,
      tatica: {
        ...(umAMenos ? { umAMenos } : {}),
        ...(nomeFormacao ? { formacao: nomeFormacao } : {}),
        estilo,
      },
    });
  }

  /** Redistribui quem está em campo nas vagas de outra formação, cada um onde rende mais. */
  private reorganizar(time: Time, vagas: readonly Vaga[]): void {
    const goleiro = time.vagas[0] ?? null;
    const livres = new Set(this.emCampoDe(time.lado).filter((a) => a !== goleiro));
    const novas: (Atleta | null)[] = vagas.map(() => null);
    novas[0] = goleiro;
    const ordem = vagas
      .map((v, i) => ({ v, i }))
      .filter(({ i }) => i !== 0)
      .sort((a, b) => PRIORIDADE_VAGA.indexOf(a.v.posicao) - PRIORIDADE_VAGA.indexOf(b.v.posicao));
    for (const { v, i } of ordem) {
      let melhor: Atleta | null = null;
      for (const a of livres)
        if (!melhor || notaNaVaga(a.j, v) > notaNaVaga(melhor.j, v)) melhor = a;
      if (!melhor) continue;
      livres.delete(melhor);
      novas[i] = melhor;
    }
    time.formacao = vagas;
    time.papeis = vagas.map(() => null);
    time.vagas = novas;
    this.cacheEmCampo[time.lado] = null;
    novas.forEach((a, i) => {
      if (!a) return;
      a.vaga = i;
      this.definirPapel(a, vagas[i] as Vaga, null);
      a.marcado = null;
      this.renovar(a);
    });
  }

  private trocaTatica(time: Time, sai: readonly Posicao[], entra: readonly Posicao[]): void {
    if (!this.podeTrocar(time)) return;
    const quemSai = this.emCampoDe(time.lado)
      .filter((a) => a.vaga !== 0 && sai.includes(a.j.posicao))
      .sort((a, b) => a.j.forca * a.condicao - b.j.forca * b.condicao)[0];
    const quemEntra = time.atletas
      .filter((a) => !a.usado && entra.includes(a.j.posicao))
      .sort((a, b) => b.j.forca - a.j.forca)[0];
    if (!quemSai || !quemEntra) return;
    this.trocar(time, quemSai, quemEntra);
    this.reorganizar(time, time.formacao);
  }

  // ---------------------------------------------------------------- pênaltis

  private disputaDePenaltis(): void {
    this.periodo = 5;
    this.s = 0;
    const placar: [number, number] = [0, 0];
    const fila = (lado: LadoCampo) =>
      this.emCampoDe(lado)
        .slice()
        .sort((a, b) => this.att(b, "finalizacao") - this.att(a, "finalizacao"));
    const filas = { casa: fila("casa"), fora: fila("fora") };
    const cobrar = (lado: LadoCampo, n: number) => {
      const batedores = filas[lado];
      const batedor = batedores[n % Math.max(1, batedores.length)];
      const goleiro = this.goleiroDe(outro(lado));
      if (!batedor) return;
      const chance = limitar(
        0.75 +
          (this.att(batedor, "finalizacao") - 70) / 300 -
          (goleiro ? (this.att(goleiro, "penalti") - 70) / 300 : -0.2),
        0.55,
        0.93,
      );
      const convertido = this.rng.chance(chance);
      if (convertido) placar[lado === "casa" ? 0 : 1]++;
      this.registrar("disputa-penaltis", {
        time: lado,
        jogador: batedor.j.id,
        valor: convertido ? 1 : 0,
        placar: [...placar] as [number, number],
      });
    };
    for (let n = 0; n < 5; n++) {
      cobrar("casa", n);
      if (placar[0] > placar[1] + (5 - n) || placar[1] > placar[0] + (5 - n - 1)) break;
      cobrar("fora", n);
      if (placar[0] > placar[1] + (5 - n - 1) || placar[1] > placar[0] + (5 - n - 1)) break;
    }
    for (let n = 5; placar[0] === placar[1] && n < 60; n++) {
      cobrar("casa", n);
      cobrar("fora", n);
    }
    this.placarPenaltis = placar;
  }

  // ---------------------------------------------------------------- saída

  private xy(p: Ponto): { x: number; y: number } {
    return { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 };
  }

  private montarQuadro(): Quadro {
    const posicoes: number[] = [];
    for (const lado of ["casa", "fora"] as const)
      for (const a of this.times[lado].vagas) {
        if (a) posicoes.push(Math.round(a.pos.x * 10) / 10, Math.round(a.pos.y * 10) / 10);
        else posicoes.push(Number.NaN, Number.NaN);
      }
    return {
      t: this.t,
      bola: [Math.round(this.bola.x * 10) / 10, Math.round(this.bola.y * 10) / 10],
      posicoes,
    };
  }

  private gravarQuadro(): void {
    this.quadros.push(this.montarQuadro());
  }

  /**
   * Estatísticas e notas até o momento, sem mexer na partida: é o que a tela mostra durante o jogo
   * para o técnico ver quem está rendendo. A nota parcial considera o placar de agora.
   */
  parcial(): {
    estatisticas: Record<LadoCampo, EstatisticasTime>;
    jogadores: EstatisticasJogador[];
  } {
    if (this.encerrada) {
      const r = this.resultado();
      return {
        estatisticas: { casa: { ...r.estatisticas.casa }, fora: { ...r.estatisticas.fora } },
        jogadores: [...r.jogadores],
      };
    }
    const total = this.times.casa.est.posse + this.times.fora.est.posse || 1;
    const posseCasa = Math.round((this.times.casa.est.posse / total) * 100);
    const estatisticas = {
      casa: {
        ...this.times.casa.est,
        posse: posseCasa,
        xg: Math.round(this.times.casa.est.xg * 100) / 100,
      },
      fora: {
        ...this.times.fora.est,
        posse: 100 - posseCasa,
        xg: Math.round(this.times.fora.est.xg * 100) / 100,
      },
    };
    const jogadores: EstatisticasJogador[] = [];
    for (const time of Object.values(this.times)) {
      const sofridos = this.placarAtual[time.lado === "casa" ? 1 : 0];
      const feitos = this.placarAtual[time.lado === "casa" ? 0 : 1];
      for (const a of time.atletas) {
        if (!a.usado) continue;
        const saiu = a.saiuEm ?? this.t;
        const e: EstatisticasJogador = {
          ...a.est,
          minutos: Math.max(0, Math.round((saiu - Math.max(0, a.entrouEm)) / 60)),
          condicaoFinal: Math.round(a.condicao),
          distancia: Math.round(a.est.distancia),
        };
        e.nota = this.nota(a, feitos, sofridos, e);
        jogadores.push(e);
      }
    }
    return { estatisticas, jogadores };
  }

  private fecharEstatisticas(): void {
    const total = this.times.casa.est.posse + this.times.fora.est.posse || 1;
    const posseCasa = Math.round((this.times.casa.est.posse / total) * 100);
    this.times.casa.est.posse = posseCasa;
    this.times.fora.est.posse = 100 - posseCasa;
    for (const time of Object.values(this.times)) {
      time.est.xg = Math.round(time.est.xg * 100) / 100;
      const sofridos = this.placarAtual[time.lado === "casa" ? 1 : 0];
      const feitos = this.placarAtual[time.lado === "casa" ? 0 : 1];
      for (const a of time.atletas) {
        if (!a.usado) continue;
        const saiu = a.saiuEm ?? this.t;
        a.est.minutos = Math.max(1, Math.round((saiu - Math.max(0, a.entrouEm)) / 60));
        a.est.condicaoFinal = Math.round(a.condicao);
        a.est.distancia = Math.round(a.est.distancia);
        a.est.nota = this.nota(a, feitos, sofridos);
      }
    }
  }

  /** Nota de 0,5 a 10: parte de 6 e soma o que o jogador fez. */
  private nota(
    a: Atleta,
    feitos: number,
    sofridos: number,
    e: EstatisticasJogador = a.est,
  ): number {
    const posicao = a.papel ? DADOS_FUNCAO[a.papel.funcao].familia : a.j.posicao;
    let n = 5.9;
    n += 1.1 * e.gols + 0.7 * e.assistencias + 0.2 * e.chutesNoGol + 0.2 * e.passesDecisivos;
    n += 0.012 * e.passesCertos - 0.04 * (e.passes - e.passesCertos);
    n += 0.1 * e.desarmes + 0.025 * e.interceptacoes - 0.1 * e.faltas;
    n -= 0.5 * e.amarelos + (e.vermelho ? 2 : 0) + e.golsContra;
    if (posicao === "G") {
      n += 0.35 * e.defesas - 0.45 * e.golsSofridos;
      if (e.golsSofridos === 0 && e.minutos >= 60) n += 0.6;
    } else if (posicao === "Z" || posicao === "L") {
      n -= 0.2 * e.golsSofridos;
      if (e.golsSofridos === 0 && e.minutos >= 60) n += 0.4;
    }
    n += feitos > sofridos ? 0.3 : feitos < sofridos ? -0.3 : 0;
    // Nota alta é rara: acima de 7, cada ponto conta menos (gol e assistência ainda levam longe).
    if (n > 7) n = 7 + (n - 7) * 0.75;
    if (e.minutos < 20) n = 6 + (n - 6) * (e.minutos / 20);
    return limitar(Math.round(n * 2) / 2, 0.5, 10);
  }

  resultado(): ResultadoPartida {
    const [c, f] = this.placarAtual;
    const p = this.placarPenaltis;
    const vencedor: LadoCampo | "empate" =
      c > f ? "casa" : f > c ? "fora" : p ? (p[0] > p[1] ? "casa" : "fora") : "empate";
    const jogadores = [...this.times.casa.atletas, ...this.times.fora.atletas]
      .filter((a) => a.usado)
      .map((a) => a.est);
    return {
      placar: [c, f],
      ...(p ? { penaltis: p } : {}),
      vencedor,
      eventos: this.eventosRegistrados,
      estatisticas: { casa: this.times.casa.est, fora: this.times.fora.est },
      jogadores,
      vagas: {
        casa: this.opcoes.casa.escalacao.titulares,
        fora: this.opcoes.fora.escalacao.titulares,
      },
      ...(this.opcoes.gravarQuadros ? { quadros: this.quadros } : {}),
      duracao: this.t,
    };
  }
}

/** Simula a partida inteira de uma vez (jogos da CPU e testes). */
export function simularPartida(opcoes: OpcoesPartida): ResultadoPartida {
  return new Partida(opcoes).simular();
}
