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
import type { Atributo } from "@newbras/data";
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
import { encaixe, vagasDaEscalacao } from "./escalacao";
import type { Vaga } from "./formacoes";
import {
  TATICA_PADRAO,
  type Evento,
  type EstatisticasJogador,
  type EstatisticasTime,
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
}

interface Time {
  lado: LadoCampo;
  dados: TimePartida;
  tatica: Tatica;
  atletas: Atleta[];
  vagas: (Atleta | null)[];
  formacao: readonly Vaga[];
  trocas: number;
  paradas: Set<number>;
  est: EstatisticasTime;
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
const LADOS_CAMPO: readonly LadoCampo[] = ["casa", "fora"];

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
      fator: vaga >= 0 ? encaixe(j, formacao[vaga] as Vaga) : 1,
      entrouEm: titular ? 0 : -1,
      saiuEm: null,
      efetivos: {},
      velocidade: 0,
      resistencia: j.atributos.resistencia ?? j.forca * 0.8,
      marcado: null,
      est: {
        id: j.id,
        time: lado,
        titular,
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
    dados.escalacao.titulares.forEach((id, vaga) => {
      const j = porId.get(id);
      if (!j || vaga >= formacao.length) return;
      const a = criar(j, vaga, true);
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
      trocas: 0,
      paradas: new Set(),
      est: estatisticasVazias(),
    };
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
    if (this.s === regulamentar && this.acrescimo === null)
      this.acrescimo = this.calcularAcrescimo();
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
    const empate = this.placarAtual[0] === this.placarAtual[1];
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
    const ajuste = this.times[a.lado].dados.ajuste ?? 1;
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
      const avancoBase = atacando
        ? estilo === "ataque"
          ? 14
          : estilo === "contra-ataque"
            ? 5
            : 9
        : estilo === "ataque"
          ? -2
          : estilo === "contra-ataque"
            ? -10
            : -5;
      const marcacao = time.tatica.marcacao;
      const kMarcacao = marcacao === "leve" ? 0.55 : marcacao === "pesada" ? 0.7 : 0.8;
      const golX = direita ? 0 : COMPRIMENTO;
      const adversarios = atacando ? null : this.emCampoDe(outro(lado));

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
          let avanco = 0;
          if (!goleiro) {
            avanco = avancoBase;
            const aberto = Math.abs(vaga.y - MEIO_Y) > 15;
            if (atacando && concentracao === "laterais" && aberto) avanco += 4;
            if (atacando && concentracao === "meio" && !aberto) avanco += 3;
            if (atacando && vaga.posicao === "A" && bx > 65) avanco += 6;
          }
          let x = vaga.x + (bx - MEIO_X) * (ACOMPANHA[vaga.posicao] ?? 0.5) + avanco;
          let y = vaga.y + (by - MEIO_Y) * (goleiro ? 0.15 : 0.35);
          if (!atacando && !goleiro) y += (by - y) * 0.12;
          x = goleiro ? limitar(x, 1, 20) : limitar(x, 3, 101);
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
          a.condicao - passo * 0.0046 * (1.55 - a.resistencia / 100) - 0.0006,
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
    else if (d <= 25) wChute = 0.1 * (longe / nivel) ** 2;
    else if (d <= 32) wChute = 0.025 * (longe / nivel) ** 3;
    if (angulo > 18 && d < 20) wChute *= 0.25;
    if (estilo === "ataque") wChute *= 1.15;

    let wCruz = 0;
    if (q.x > 78 && angulo > 14)
      wCruz = 1.5 * (cru / nivel) * (time.tatica.concentracao === "laterais" ? 1.4 : 1);

    const wDrible = pertos > 0 || maisPerto < 3 ? 0.3 * (dri / nivel) ** 2 : 0.04 * (dri / nivel);
    let wConduz = maisPerto > 6 ? 1.8 * (vel / nivel) : 0.25;
    if (q.x > 88) wConduz *= 0.4;
    if (estilo === "ataque") wConduz *= 1.1;
    let wPasse = 2.6 + (pertos > 0 ? 1 : 0) + (q.x < 35 ? 1 : 0);
    if (estilo === "contra-ataque" && q.x < 60) wPasse += 0.5;

    const opcoes = [
      { acao: "chute" as const, peso: wChute },
      { acao: "cruzamento" as const, peso: wCruz },
      { acao: "drible" as const, peso: wDrible },
      { acao: "conducao" as const, peso: wConduz },
      { acao: "passe" as const, peso: wPasse },
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
        (0.5 + livre / 10) * (0.4 + linha / 6) * Math.exp(avanco / (estilo === "ataque" ? 20 : 26));
      if (estilo === "contra-ataque" && avanco > 15) nota *= 1.5;
      if (dist > 30) nota *= 0.6;
      if (goleiro && c.vaga !== 0 && rq.x < 30) nota *= 1.3;
      // Quem decide pesa o risco: passe arriscado só compensa se avança muito.
      const risco =
        (linha < 1.5 ? 0.2 : linha < 3 ? 0.06 : 0) + (livre < 1.5 ? 0.22 : livre < 3.5 ? 0.08 : 0);
      nota *= (1 - risco) ** 4;
      opcoes.push({ c, rq, dist, linha, livre, nota });
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
      if (escolha.rq.x > penultimo + 1 && this.rng.chance(0.18)) {
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

  private conduzir(dono: Atleta, q: Ponto): void {
    const direita = this.paraDireita(dono.lado);
    const avanco = this.rng.float(5, 9) * (0.8 + this.att(dono, "velocidade") / 250);
    const y = q.y + (MEIO_Y - q.y) * this.rng.float(0.05, 0.25) + this.rng.float(-3, 3);
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
    if (this.rng.chance(0.17 * dureza)) {
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
    if (!this.rng.chance(0.1 * dureza)) return false;
    // Dentro da área o defensor se cuida: falta ali é pênalti.
    const area = naArea(noQuadro(dono.pos, this.paraDireita(dono.lado)));
    if (this.rng.chance(0.17 * dureza * (area ? 0.3 : 1))) {
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
    if (q.x > 75 && Math.abs(q.y - MEIO_Y) < 22 && this.rng.chance(0.5)) {
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
    const alvo = this.rng.weighted(alvos, (a) => this.att(a, "cabeceio") ** 2);
    const zagueiros = this.emCampoDe(defesa).filter((a) => a.vaga !== 0);
    const marcador = zagueiros.sort(
      (a, b) => distancia(a.pos, alvo.pos) - distancia(b.pos, alvo.pos),
    )[0];
    const defesaAerea = marcador
      ? Math.max(this.att(marcador, "cabeceio"), this.att(marcador, "marcacao") * 0.9)
      : 30;
    const chance = limitar(
      0.42 +
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
    else if (tipo === "falta") xg = 0.065 * (habilidade / 70) ** 2;
    else {
      xg = tipo === "cabeca" ? 0.6 * Math.exp(-d / 5.5) : 0.95 * Math.exp(-d / 7.2);
      xg *= limitar(1.15 - Math.max(0, angulo - 4) / 22, 0.25, 1.1);
      xg *= 1 - 0.18 * Math.min(2, pertos);
      // Habilidade contra a marcação de quem está perto: craque contra zaga forte vale menos.
      const defesaPerto = this.marcacaoPerto(dono, this.emCampoDe(defesa));
      xg *= (habilidade / Math.max(40, defesaPerto)) ** 1.6 * 0.55;
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

    if (tipo === "pe" && this.rng.chance(0.1 + 0.07 * pertos)) {
      this.registrar("bloqueio", base);
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
        this.registrar("chute-trave", base);
        if (tipo === "penalti") this.registrar("penalti-perdido", base);
        this.bolaSolta(
          noQuadro({ x: COMPRIMENTO - this.rng.float(4, 12), y: this.rng.float(20, 48) }, direita),
        );
        return;
      }
      this.registrar("chute-fora", base);
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
      this.gol(dono, tipo !== "penalti" && tipo !== "falta" ? assistente : null, xg);
      return;
    }
    if (goleiro) {
      this.times[defesa].est.defesas++;
      goleiro.est.defesas++;
    }
    this.registrar("defesa", { ...base, ...(goleiro ? { outro: goleiro.j.id } : {}) });
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

  private gol(autor: Atleta, assistente: Atleta | null, xg: number): void {
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
      placar: [...this.placarAtual] as [number, number],
    });
    this.saidaDeBola(outro(lado));
    this.acaoEm = this.t + 25;
  }

  // ---------------------------------------------------------------- cartões, lesões e trocas

  private expulsar(a: Atleta, segundoAmarelo: boolean): void {
    const time = this.times[a.lado];
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
    a.fator = encaixe(a.j, time.formacao[vaga] as Vaga);
    this.renovar(a);
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
    return (
      banco.sort((a, b) => b.j.forca * encaixe(b.j, vaga) - a.j.forca * encaixe(a.j, vaga))[0] ??
      null
    );
  }

  private aCadaMinuto(): void {
    for (const time of Object.values(this.times))
      for (const a of this.emCampoDe(time.lado)) this.renovar(a);
    // Lesões raras (uma a cada duas ou três partidas), mais prováveis em quem está esgotado.
    for (const time of Object.values(this.times))
      for (const a of this.emCampoDe(time.lado))
        if (this.rng.chance(0.0001 * (1 + (100 - a.condicao) / 40))) this.lesionar(a);

    // A CPU troca os mais cansados no 2º tempo e na prorrogação.
    if (this.periodo < 2) return;
    const minuto = this.minutoDe(this.s).minuto;
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

  private gravarQuadro(): void {
    const posicoes: number[] = [];
    for (const lado of ["casa", "fora"] as const)
      for (const a of this.times[lado].vagas) {
        if (a) posicoes.push(Math.round(a.pos.x * 10) / 10, Math.round(a.pos.y * 10) / 10);
        else posicoes.push(Number.NaN, Number.NaN);
      }
    this.quadros.push({
      t: this.t,
      bola: [Math.round(this.bola.x * 10) / 10, Math.round(this.bola.y * 10) / 10],
      posicoes,
    });
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
  private nota(a: Atleta, feitos: number, sofridos: number): number {
    const e = a.est;
    const posicao = a.j.posicao;
    let n = 6;
    n += 1.1 * e.gols + 0.7 * e.assistencias + 0.2 * e.chutesNoGol + 0.25 * e.passesDecisivos;
    n += 0.012 * e.passesCertos - 0.04 * (e.passes - e.passesCertos);
    n += 0.15 * e.desarmes + 0.05 * e.interceptacoes - 0.1 * e.faltas;
    n -= 0.5 * e.amarelos + (e.vermelho ? 2 : 0) + e.golsContra;
    if (posicao === "G") {
      n += 0.35 * e.defesas - 0.45 * e.golsSofridos;
      if (e.golsSofridos === 0 && e.minutos >= 60) n += 0.6;
    } else if (posicao === "Z" || posicao === "L") {
      n -= 0.2 * e.golsSofridos;
      if (e.golsSofridos === 0 && e.minutos >= 60) n += 0.4;
    }
    n += feitos > sofridos ? 0.3 : feitos < sofridos ? -0.3 : 0;
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
