import { describe, expect, it } from "vitest";
import { gerarAtributos, type Lado, type Posicao } from "@newbras/data";
import { escalacaoAutomatica, type JogadorPartida, type TimePartida } from "@newbras/engine";
import { ControleAoVivo, type Velocidade } from "./usePartidaAoVivo";

const ELENCO: ReadonlyArray<[Posicao, Lado]> = [
  ["G", "C"],
  ["G", "C"],
  ["L", "D"],
  ["L", "E"],
  ["Z", "C"],
  ["Z", "C"],
  ["Z", "C"],
  ["M", "C"],
  ["M", "C"],
  ["M", "D"],
  ["M", "E"],
  ["M", "C"],
  ["A", "C"],
  ["A", "C"],
  ["A", "D"],
];

function time(id: string): TimePartida {
  const jogadores: JogadorPartida[] = ELENCO.map(([posicao, lado], i) => ({
    id: `${id}-${i}`,
    nome: `${id} ${i}`,
    posicao,
    lado,
    forca: 70,
    atributos: gerarAtributos({ semente: `${id}-${i}`, posicao, forca: 70 }),
  }));
  return { id, nome: id, jogadores, escalacao: escalacaoAutomatica(jogadores, "4-4-2"), cpu: true };
}

/** Roda a partida ao vivo com quadros de 16 ms, continuando nas pausas, e mede o tempo real. */
function assistir(velocidade: Velocidade) {
  const c = new ControleAoVivo({ semente: "ao-vivo", casa: time("A"), fora: time("B") });
  let agora = 0;
  let pausas = 0;
  while (!c.resultado && agora < 20 * 60_000) {
    agora += 16;
    if (c.passo(agora, 16, velocidade) === "pausa" && !c.resultado) {
      pausas++;
      c.continuar();
    }
  }
  return { c, minutos: agora / 60_000, pausas };
}

describe("partida ao vivo", () => {
  it("dura 3, 5 ou 10 minutos reais conforme a velocidade e para no intervalo", () => {
    const rapida = assistir("rapida");
    const normal = assistir("normal");
    const lenta = assistir("lenta");
    expect(rapida.minutos).toBeGreaterThan(2.5);
    expect(rapida.minutos).toBeLessThan(3.8);
    expect(normal.minutos).toBeGreaterThan(4.2);
    expect(normal.minutos).toBeLessThan(6);
    expect(lenta.minutos).toBeGreaterThan(8.5);
    expect(lenta.minutos).toBeLessThan(12);
    expect(normal.pausas).toBe(1);
    // O "GOL!" só aparece depois que a bola chega na rede.
    const c = new ControleAoVivo({ semente: "voo", casa: time("A"), fora: time("B") });
    let agora = 0;
    let viuVoo = false;
    while (!c.resultado && agora < 30 * 60_000) {
      agora += 16;
      if (c.passo(agora, 16, "rapida") === "pausa") c.continuar();
      if (c.voo) {
        const tela = c.exibicao();
        viuVoo = true;
        if (agora - c.voo.inicio < 500) expect(tela.destaque).toBeNull();
        expect(tela.atual.dono).toBeNull();
      }
    }
    expect(viuVoo).toBe(true);
    // Assistir ou pular dá o mesmo jogo.
    const pulada = new ControleAoVivo({ semente: "ao-vivo", casa: time("A"), fora: time("B") });
    pulada.pular();
    expect(normal.c.resultado?.placar).toEqual(pulada.resultado?.placar);
  });
});
