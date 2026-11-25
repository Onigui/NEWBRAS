/**
 * Partida ao vivo: avança o motor no ritmo escolhido, guarda o instante anterior e o atual para
 * o mini-campo deslizar os jogadores, segura a tela nos lances importantes e para no intervalo.
 *
 * Ritmo (decisão de 25/11/2026): os 90 minutos duram cerca de 3, 4 ou 5 minutos reais. Os lances
 * de perigo andam mais devagar e os gols seguram a tela por alguns segundos.
 */
import { useEffect, useState } from "react";
import type { Evento, OpcoesPartida, Quadro, ResultadoPartida } from "@newbras/engine";
import { Partida } from "@newbras/engine";

export type Velocidade = "rapida" | "normal" | "lenta";

/** Segundos de jogo por segundo real, já contando que os lances de perigo andam devagar. */
export const RITMO: Record<Velocidade, number> = { rapida: 34, normal: 26, lenta: 21 };
export const NOME_VELOCIDADE: Record<Velocidade, string> = {
  rapida: "Rápida (3 min)",
  normal: "Normal (4 min)",
  lenta: "Lenta (5 min)",
};
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
  "cartao-vermelho": 1500,
  lesao: 1200,
};

export type Instantaneo = Quadro & { dono: number | null };

/**
 * Estado mutável da partida ao vivo, fora do React: o laço de animação avança o motor aqui e o
 * componente só relê. Separado do hook para poder ser testado sem navegador.
 */
export class ControleAoVivo {
  readonly partida: Partida;
  anterior: Instantaneo;
  atual: Instantaneo;
  fracao = 0;
  eventos: Evento[];
  destaque: Evento | null = null;
  aviso: string | null = null;
  resultado: ResultadoPartida | null = null;
  private seguraAte = 0;
  private acumulado = 0;

  constructor(opcoes: OpcoesPartida) {
    this.partida = new Partida(opcoes);
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
    if (this.seguraAte > agora) return "segue";
    this.destaque = null;
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
        const importante = novos.find((ev) => SEGURAR[ev.tipo]);
        if (importante) {
          this.destaque = importante;
          this.seguraAte = agora + (SEGURAR[importante.tipo] ?? 0);
          this.acumulado = 0;
          break;
        }
      }
      const periodo = p.relogio.periodo;
      if (periodo !== periodoAntes && !p.terminada && periodo !== 5) {
        this.aviso =
          periodoAntes === 2
            ? "Fim do tempo normal: vai ter prorrogação. Faça suas mudanças e continue."
            : "Intervalo: faça suas mudanças e continue.";
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

  /** Joga o resto de uma vez. */
  pular(): void {
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
