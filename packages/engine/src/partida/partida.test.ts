import { describe, expect, it } from "vitest";
import { FORMACOES, NOMES_FORMACOES } from "./formacoes";
import { escalacaoAutomatica } from "./escalacao";
import { Partida, simularPartida } from "./motor";
import { textoDoEvento } from "./narracao";
import { timeDeTeste } from "./teste-utils";
import type { ResultadoPartida } from "./tipos";

const jogo = (semente: string, forcaCasa = 70, forcaFora = 70) =>
  simularPartida({ semente, casa: timeDeTeste("A", forcaCasa), fora: timeDeTeste("B", forcaFora) });

function lote(n: number, criar: (i: number) => ResultadoPartida) {
  return Array.from({ length: n }, (_, i) => criar(i));
}

describe("escalação automática", () => {
  it("goleiro na primeira vaga, 11 diferentes e goleiro no banco", () => {
    const time = timeDeTeste("A", 70);
    for (const formacao of NOMES_FORMACOES) {
      const e = escalacaoAutomatica(time.jogadores, formacao);
      expect(e.titulares).toHaveLength(FORMACOES[formacao].length);
      expect(new Set(e.titulares).size).toBe(11);
      const porId = new Map(time.jogadores.map((j) => [j.id, j]));
      expect(porId.get(e.titulares[0]!)?.posicao).toBe("G");
      expect(e.reservas.some((id) => porId.get(id)?.posicao === "G")).toBe(true);
    }
  });
});

describe("partida", () => {
  it("é determinística: mesma semente, mesma partida", () => {
    expect(jogo("x")).toEqual(jogo("x"));
    expect(jogo("x").eventos).not.toEqual(jogo("y").eventos);
  });

  it("avançar aos poucos dá o mesmo que simular de uma vez", () => {
    const opcoes = { semente: "passos", casa: timeDeTeste("A", 70), fora: timeDeTeste("B", 70) };
    const p = new Partida(opcoes);
    while (!p.terminada) p.avancar(97);
    expect(p.resultado()).toEqual(simularPartida(opcoes));
  });

  it("placar, eventos e estatísticas batem entre si", () => {
    for (const r of lote(40, (i) => jogo(`consistencia-${i}`))) {
      const gols = r.eventos.filter((e) => e.tipo === "gol");
      expect(gols.filter((e) => e.time === "casa")).toHaveLength(r.placar[0]);
      expect(gols.filter((e) => e.time === "fora")).toHaveLength(r.placar[1]);
      for (const lado of ["casa", "fora"] as const) {
        const e = r.estatisticas[lado];
        expect(e.gols).toBe(r.placar[lado === "casa" ? 0 : 1]);
        expect(e.chutes).toBeGreaterThanOrEqual(e.chutesNoGol);
        expect(e.chutesNoGol).toBeGreaterThanOrEqual(e.gols);
        expect(e.passes).toBeGreaterThanOrEqual(e.passesCertos);
        const dosJogadores = r.jogadores.filter((j) => j.time === lado);
        expect(dosJogadores.reduce((s, j) => s + j.gols, 0)).toBe(e.gols);
        expect(e.substituicoes).toBeLessThanOrEqual(5);
      }
      expect(r.estatisticas.casa.posse + r.estatisticas.fora.posse).toBe(100);
      for (const j of r.jogadores) {
        expect(j.nota).toBeGreaterThanOrEqual(0.5);
        expect(j.nota).toBeLessThanOrEqual(10);
        expect(j.nota * 2).toBe(Math.round(j.nota * 2));
      }
      expect(r.eventos[0]?.tipo).toBe("inicio");
      expect(r.eventos.at(-1)?.tipo).toBe("fim");
      expect(r.duracao).toBeGreaterThanOrEqual(5400 + 120);
    }
  });

  it("os números de um jogo médio ficam perto do futebol real", { timeout: 60_000 }, () => {
    const jogos = lote(200, (i) => jogo(`media-${i}`));
    const media = (f: (r: ResultadoPartida) => number) =>
      jogos.reduce((s, r) => s + f(r), 0) / jogos.length;
    const ambos = (f: (e: ResultadoPartida["estatisticas"]["casa"]) => number) =>
      media((r) => f(r.estatisticas.casa) + f(r.estatisticas.fora));
    const gols = media((r) => r.placar[0] + r.placar[1]);
    expect(gols).toBeGreaterThan(2.2);
    expect(gols).toBeLessThan(3.4);
    expect(ambos((e) => e.chutes) / 2).toBeGreaterThan(9);
    expect(ambos((e) => e.chutes) / 2).toBeLessThan(17);
    expect(ambos((e) => e.passesCertos) / ambos((e) => e.passes)).toBeGreaterThan(0.72);
    expect(ambos((e) => e.faltas)).toBeGreaterThan(14);
    expect(ambos((e) => e.faltas)).toBeLessThan(32);
    expect(ambos((e) => e.amarelos)).toBeGreaterThan(2);
    expect(ambos((e) => e.amarelos)).toBeLessThan(5.5);
    expect(ambos((e) => e.escanteios)).toBeGreaterThan(5);
    const empates = jogos.filter((r) => r.placar[0] === r.placar[1]).length / jogos.length;
    expect(empates).toBeGreaterThan(0.15);
    expect(empates).toBeLessThan(0.38);
    const titulares90 = jogos.flatMap((r) =>
      r.jogadores.filter((j) => j.titular && j.minutos >= 88),
    );
    const distancia = titulares90.reduce((s, j) => s + j.distancia, 0) / titulares90.length;
    expect(distancia).toBeGreaterThan(8000);
    expect(distancia).toBeLessThan(12_500);
    const condicao = titulares90.reduce((s, j) => s + j.condicaoFinal, 0) / titulares90.length;
    expect(condicao).toBeGreaterThan(50);
    expect(condicao).toBeLessThan(82);
    const notas = jogos.flatMap((r) => r.jogadores.map((j) => j.nota));
    const notaMedia = notas.reduce((s, n) => s + n, 0) / notas.length;
    expect(notaMedia).toBeGreaterThan(6.2);
    expect(notaMedia).toBeLessThan(7.4);
  });

  it("o time mais forte ganha a maioria", { timeout: 60_000 }, () => {
    const jogos = lote(150, (i) => jogo(`forte-${i}`, 80, 65));
    const vitorias = jogos.filter((r) => r.vencedor === "casa").length / jogos.length;
    const derrotas = jogos.filter((r) => r.vencedor === "fora").length / jogos.length;
    expect(vitorias).toBeGreaterThan(0.6);
    expect(derrotas).toBeLessThan(0.15);
  });

  it(
    "atributos pesam: atacantes rápidos e finalizadores fazem mais gols",
    { timeout: 60_000 },
    () => {
      const rapidos = (i: number) =>
        simularPartida({
          semente: `rapido-${i}`,
          casa: timeDeTeste("A", 70, {
            ajusteAtributos: (p) => (p === "A" ? { velocidade: 97, finalizacao: 92 } : {}),
          }),
          fora: timeDeTeste("B", 70),
        });
      const normais = (i: number) => jogo(`rapido-${i}`);
      const golsRapidos = lote(150, rapidos).reduce((s, r) => s + r.placar[0], 0);
      const golsNormais = lote(150, normais).reduce((s, r) => s + r.placar[0], 0);
      expect(golsRapidos).toBeGreaterThan(golsNormais * 1.15);
    },
  );

  it("time do humano não troca por cansaço; troca pedida respeita as regras", () => {
    const humano = { ...timeDeTeste("H", 70), cpu: false };
    const p = new Partida({ semente: "humano", casa: humano, fora: timeDeTeste("B", 70) });
    p.avancar(60 * 30);
    const titular = p.emCampo("casa")[5]!;
    const reserva = humano.escalacao.reservas[1]!;
    expect(p.substituir("casa", titular, "nao-existe")).toBe(false);
    expect(p.substituir("casa", titular, reserva)).toBe(true);
    expect(p.emCampo("casa")[5]).toBe(reserva);
    expect(p.substituir("casa", titular, humano.escalacao.reservas[2]!)).toBe(false);
    const r = p.simular();
    const trocasHumano = r.eventos.filter((e) => e.tipo === "substituicao" && e.time === "casa");
    const lesoes = r.eventos.filter((e) => e.tipo === "lesao" && e.time === "casa").length;
    expect(trocasHumano.length).toBeLessThanOrEqual(1 + lesoes);
  });

  it("expulsão deixa a vaga vazia nos quadros do mini-campo", () => {
    for (let i = 0; i < 300; i++) {
      const r = simularPartida({
        semente: `expulsao-${i}`,
        casa: timeDeTeste("A", 70, {
          tatica: { estilo: "equilibrado", marcacao: "muito-pesada", concentracao: "equilibrada" },
        }),
        fora: timeDeTeste("B", 70),
        gravarQuadros: true,
      });
      const vermelho = r.eventos.find((e) => e.tipo === "cartao-vermelho" && e.time === "casa");
      if (!vermelho) continue;
      expect(r.quadros).toHaveLength(r.duracao);
      const ultimo = r.quadros!.at(-1)!;
      expect(ultimo.posicoes).toHaveLength(44);
      expect(
        ultimo.posicoes.slice(0, 22).filter((v) => Number.isNaN(v)).length,
      ).toBeGreaterThanOrEqual(2);
      return;
    }
    throw new Error("nenhuma expulsão em 300 jogos");
  });

  it("mata-mata: empate vai para os pênaltis ou para a prorrogação", () => {
    let penaltis = false;
    let prorrogacao = false;
    for (let i = 0; i < 80 && !(penaltis && prorrogacao); i++) {
      const r = simularPartida({
        semente: `mata-${i}`,
        casa: timeDeTeste("A", 70),
        fora: timeDeTeste("B", 70),
        desempate: i % 2 ? "penaltis" : "prorrogacao",
      });
      expect(r.vencedor).not.toBe("empate");
      if (r.penaltis) {
        penaltis = true;
        expect(r.penaltis[0]).not.toBe(r.penaltis[1]);
      }
      if (r.eventos.some((e) => e.tipo === "inicio-prorrogacao")) {
        prorrogacao = true;
        expect(r.duracao).toBeGreaterThan(5400 + 1800);
      }
    }
    expect(penaltis && prorrogacao).toBe(true);
  });

  it("narra os eventos em português", () => {
    const r = jogo("narracao");
    const nomes = new Map(
      [...timeDeTeste("A", 70).jogadores, ...timeDeTeste("B", 70).jogadores].map((j) => [
        j.id,
        j.nome,
      ]),
    );
    const gol = r.eventos.find((e) => e.tipo === "gol" || e.tipo === "defesa")!;
    expect(textoDoEvento(gol, { nomes, times: { casa: "A", fora: "B" } })).toMatch(/A|B/);
  });

  it("roda rápido o bastante para uma rodada inteira", () => {
    const casa = timeDeTeste("A", 70);
    const fora = timeDeTeste("B", 70);
    const inicio = Date.now();
    for (let i = 0; i < 30; i++) simularPartida({ semente: `rapidez-${i}`, casa, fora });
    expect((Date.now() - inicio) / 30).toBeLessThan(150);
  });
});
