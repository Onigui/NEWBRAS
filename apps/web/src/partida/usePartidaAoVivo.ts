/**
 * Partida ao vivo: avança o motor no ritmo escolhido, guarda o instante anterior e o atual para
 * o mini-campo deslizar os jogadores, segura a tela nos lances importantes e para no intervalo.
 *
 * Ritmo (decisão de 25/11/2026): os 90 minutos duram cerca de 3, 4 ou 5 minutos reais. Os lances
 * de perigo andam mais devagar e os gols seguram a tela por alguns segundos.
 */
import { useEffect, useState } from "react";
import type { Evento, LadoCampo, OpcoesPartida, Quadro, ResultadoPartida } from "@newbras/engine";
import { Partida } from "@newbras/engine";
import { t } from "@newbras/textos";

export type Velocidade = "rapida" | "normal" | "lenta";

/** Segundos de jogo por segundo real, já contando que os lances de perigo andam devagar. */
export const RITMO: Record<Velocidade, number> = { rapida: 50, normal: 28, lenta: 13.5 };
export const NOME_VELOCIDADE: Record<Velocidade, string> = {
  rapida: t("Rápida (3 min)"),
  normal: t("Normal (5 min)"),
  lenta: t("Lenta (10 min)"),
};
/** Quanto tempo real a bola leva voando até o gol, a trave ou o goleiro (milissegundos). */
const VOO = 550;
/** Quanto o ritmo cai com a bola perto de um dos gols. */
const RITMO_PERIGO = 0.55;
/** Quanto tempo real a tela segura em cada lance (milissegundos). */
const SEGURAR: Partial<Record<Evento["tipo"], number>> = {
  gol: 3200,
  "gol-contra": 3200,
  penalti: 1500,
  "penalti-perdido": 1500,
  "chute-trave": 1100,
  defesa: 700,
  "chute-fora": 450,
  bloqueio: 250,
  "cartao-vermelho": 1500,
  lesao: 1200,
};

export type Instantaneo = Quadro & { dono: number | null };

/**
 * Estado mutável da partida ao vivo, fora do React: o laço de animação avança o motor aqui e o
 * componente só relê. Separado do hook para poder ser testado sem navegador.
 */
const LADOS: readonly LadoCampo[] = ["casa", "fora"];

export class ControleAoVivo {
  readonly partida: Partida;
  anterior: Instantaneo;
  atual: Instantaneo;
  fracao = 0;
  eventos: Evento[];
  destaque: Evento | null = null;
  aviso: string | null = null;
  resultado: ResultadoPartida | null = null;
  /** Chute em andamento na tela: a bola voa até o destino antes do destaque aparecer. */
  voo: { de: readonly [number, number]; para: readonly [number, number]; inicio: number } | null =
    null;
  /** Posições congeladas no instante do chute (a partida já seguiu, a tela ainda mostra o lance). */
  congelado: Instantaneo | null = null;
  /** Último instante do relógio da animação, para a tela saber onde o voo está. */
  agora = 0;
  private seguraAte = 0;
  private acumulado = 0;
  /** Times do humano: lesão e expulsão param o jogo para ele decidir. */
  private readonly humanos: ReadonlySet<LadoCampo>;
  private readonly nomes: ReadonlyMap<string, string>;

  constructor(opcoes: OpcoesPartida) {
    this.partida = new Partida(opcoes);
    this.humanos = new Set(LADOS.filter((l) => !opcoes[l].cpu));
    this.nomes = new Map(
      LADOS.flatMap((l) => opcoes[l].jogadores.map((j) => [j.id, j.nome] as const)),
    );
    for (const l of this.humanos) this.partida.decidirNaHora(l, true);
    this.atual = this.partida.instantaneo();
    this.anterior = this.atual;
    this.eventos = [...this.partida.eventos];
  }

  /**
   * Avança pelo tempo real que passou (ms), no ritmo pedido. Devolve "pausa" quando a partida
   * para sozinha (intervalo ou fim) e "segue" no resto.
   */
  passo(agora: number, dt: number, velocidade: Velocidade): "segue" | "pausa" {
    const p = this.partida;
    this.agora = agora;
    if (this.seguraAte > agora) return "segue";
    this.destaque = null;
    this.voo = null;
    this.congelado = null;
    const bola = this.atual.bola[0];
    const perigo = bola < 25 || bola > 80;
    this.acumulado += (Math.min(250, dt) / 1000) * RITMO[velocidade] * (perigo ? RITMO_PERIGO : 1);
    while (this.acumulado >= 1 && !p.terminada) {
      this.acumulado -= 1;
      this.anterior = this.atual;
      const periodoAntes = p.relogio.periodo;
      const novos = p.avancar(1);
      this.atual = p.instantaneo();
      if (novos.length) {
        this.eventos = [...this.eventos, ...novos];
        // Lesão ou expulsão no time do técnico: o jogo para e ele decide o que fazer.
        const decisao = novos.find(
          (ev) =>
            (ev.tipo === "lesao" || ev.tipo === "cartao-vermelho") &&
            ev.time !== undefined &&
            this.humanos.has(ev.time),
        );
        if (decisao) {
          const nome = this.nomes.get(decisao.jogador ?? "") ?? "";
          this.destaque = decisao;
          this.aviso =
            decisao.tipo === "lesao"
              ? t(
                  "{jogador} se machucou e está em campo no sacrifício, rendendo bem menos. Substitua (em Substituições ou clicando na vaga dele) ou continue com ele.",
                  { jogador: nome },
                )
              : t(
                  "{jogador} foi expulso e o time está com um a menos. Reorganize a formação, mude as instruções ou faça uma troca, e continue.",
                  { jogador: nome },
                );
          this.acumulado = 0;
          return "pausa";
        }
        const importante = novos.find((ev) => SEGURAR[ev.tipo]);
        if (importante) {
          this.destaque = importante;
          const chute = novos.find((ev) => ev.destino && ev.x !== undefined && ev.y !== undefined);
          if (chute?.destino && chute.x !== undefined && chute.y !== undefined) {
            // Mostra o lance como ele foi: a bola sai do pé e só depois vem o "GOL!".
            this.congelado = this.anterior;
            this.voo = {
              de: [chute.x, chute.y],
              para: [chute.destino.x, chute.destino.y],
              inicio: agora,
            };
          }
          this.seguraAte = agora + (this.voo ? VOO : 0) + (SEGURAR[importante.tipo] ?? 0);
          this.acumulado = 0;
          break;
        }
      }
      const periodo = p.relogio.periodo;
      if (periodo !== periodoAntes && !p.terminada && periodo !== 5) {
        this.aviso =
          periodoAntes === 2
            ? t("Fim do tempo normal: vai ter prorrogação. Faça suas mudanças e continue.")
            : t("Intervalo: faça suas mudanças e continue.");
        this.anterior = this.atual;
        this.acumulado = 0;
        return "pausa";
      }
    }
    this.fracao = Math.min(1, this.acumulado);
    if (p.terminada) {
      this.terminar();
      return "pausa";
    }
    return "segue";
  }

  /**
   * O que o mini-campo mostra agora: as posições congeladas do lance com a bola voando, ou o jogo
   * correndo normalmente. O destaque ("GOL!") só aparece quando a bola chega.
   */
  exibicao(): {
    anterior: Instantaneo;
    atual: Instantaneo;
    fracao: number;
    destaque: Evento | null;
  } {
    if (this.voo && this.congelado) {
      const f = Math.min(1, (this.agora - this.voo.inicio) / VOO);
      const suave = 1 - (1 - f) * (1 - f);
      const bola: [number, number] = [
        this.voo.de[0] + (this.voo.para[0] - this.voo.de[0]) * suave,
        this.voo.de[1] + (this.voo.para[1] - this.voo.de[1]) * suave,
      ];
      const quadro = { ...this.congelado, bola, dono: null };
      return {
        anterior: quadro,
        atual: quadro,
        fracao: 1,
        destaque: f >= 1 ? this.destaque : null,
      };
    }
    return {
      anterior: this.anterior,
      atual: this.atual,
      fracao: this.fracao,
      destaque: this.destaque,
    };
  }

  /** Joga o resto de uma vez. */
  pular(): void {
    // Sem ninguém decidindo, o motor volta a trocar o lesionado sozinho.
    for (const l of this.humanos) this.partida.decidirNaHora(l, false);
    this.partida.simular();
    this.terminar();
  }

  /** Depois de uma troca ou mudança, a tela passa a mostrar o estado novo. */
  atualizar(): void {
    this.atual = this.partida.instantaneo();
    this.anterior = this.atual;
    this.eventos = [...this.partida.eventos];
  }

  continuar(): void {
    this.aviso = null;
  }

  private terminar(): void {
    this.resultado = this.partida.resultado();
    this.eventos = [...this.partida.eventos];
    this.atual = this.partida.instantaneo();
    this.anterior = this.atual;
    this.fracao = 0;
    this.aviso = null;
    this.destaque = null;
    this.voo = null;
    this.congelado = null;
  }
}

export function usePartidaAoVivo(opcoes: OpcoesPartida) {
  const [controle] = useState(() => new ControleAoVivo(opcoes));
  const [velocidade, setVelocidade] = useState<Velocidade>("normal");
  const [rodando, setRodando] = useState(true);
  const [, setVersao] = useState(0);
  const reler = () => setVersao((v) => v + 1);

  useEffect(() => {
    if (!rodando) return;
    let quadro = 0;
    let ultimo = performance.now();
    const passo = (agora: number) => {
      const dt = agora - ultimo;
      ultimo = agora;
      const situacao = controle.passo(agora, dt, velocidade);
      setVersao((v) => v + 1);
      if (situacao === "pausa") setRodando(false);
      else quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [rodando, velocidade, controle]);

  return {
    controle,
    partida: controle.partida,
    rodando,
    velocidade,
    setVelocidade,
    pausar: () => setRodando(false),
    continuar: () => {
      if (controle.partida.terminada) return;
      controle.continuar();
      setRodando(true);
    },
    pular: () => {
      controle.pular();
      setRodando(false);
      reler();
    },
    atualizar: () => {
      controle.atualizar();
      reler();
    },
  };
}
