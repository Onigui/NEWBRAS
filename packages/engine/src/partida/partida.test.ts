import { describe, expect, it } from "vitest";
import {
  classificarVaga,
  desenhoDaFormacao,
  FORMACOES,
  formacaoPersonalizada,
  NOMES_FORMACOES,
  validarFormacao,
} from "./formacoes";
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

describe("formações", () => {
  it("tem muitas formações prontas, todas válidas e com o desenho do nome", () => {
    expect(NOMES_FORMACOES.length).toBeGreaterThanOrEqual(25);
    for (const nome of NOMES_FORMACOES) {
      const vagas = FORMACOES[nome];
      expect(validarFormacao(vagas), nome).toEqual([]);
      const numeros = nome.match(/^\d(-\d)+/)?.[0];
      // O desenho só bate quando o nome conta defesa-meio-ataque (4-2-3-1 junta meias).
      if (numeros && numeros.split("-").length === 3)
        expect(desenhoDaFormacao(vagas), nome).toBe(numeros);
    }
  });

  it("a função da vaga vem do lugar no campo", () => {
    expect(classificarVaga(20, 34).posicao).toBe("Z");
    expect(classificarVaga(25, 6)).toMatchObject({ posicao: "L", lado: "D" });
    expect(classificarVaga(25, 62)).toMatchObject({ posicao: "L", lado: "E" });
    expect(classificarVaga(50, 34).posicao).toBe("M");
    expect(classificarVaga(75, 60)).toMatchObject({ posicao: "A", lado: "E" });
    expect(classificarVaga(70, 34, true).posicao).toBe("G");
  });

  it("formação personalizada: valida e o jogo respeita o lugar de cada um", () => {
    const pontos = FORMACOES["4-4-2"].map((v) => ({ x: v.x, y: v.y }));
    pontos[10] = { x: 80, y: 60 }; // um atacante bem aberto pela esquerda, colado na área
    pontos[9] = { x: 40, y: 34 }; // o outro recua para o meio
    const vagas = formacaoPersonalizada(pontos);
    expect(validarFormacao(vagas)).toEqual([]);
    expect(vagas[10]).toMatchObject({ posicao: "A", lado: "E" });
    expect(vagas[9]?.posicao).toBe("M");
    expect(
      validarFormacao(formacaoPersonalizada([...pontos.slice(0, 10), pontos[1]!])),
    ).not.toEqual([]);

    // Time do humano: a CPU não mexe na formação que ele desenhou.
    const casa = timeDeTeste("A", 70, { cpu: false });
    casa.escalacao = escalacaoAutomatica(casa.jogadores, vagas);
    expect(casa.escalacao.formacao).toBe("personalizada");
    const r = simularPartida({
      semente: "livre",
      casa,
      fora: timeDeTeste("B", 70),
      gravarQuadros: true,
    });
    // No 1º tempo a casa ataca para a direita: o campo já é o quadro de ataque dela.
    const primeiro = r.quadros!.filter((q) => q.t < 2700);
    const media = (vaga: number, eixo: 0 | 1) =>
      primeiro.reduce((s, q) => s + (q.posicoes[vaga * 2 + eixo] ?? 0), 0) / primeiro.length;
    expect(media(10, 1)).toBeGreaterThan(48);
    expect(media(10, 0)).toBeGreaterThan(media(9, 0) + 12);
  });
});

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

  it("controle ao vivo: posições, reservas, trocas restantes e nova formação", () => {
    const humano = { ...timeDeTeste("H", 70), cpu: false };
    const p = new Partida({ semente: "ao-vivo", casa: humano, fora: timeDeTeste("B", 70) });
    p.avancar(600);
    const agora = p.instantaneo();
    expect(agora.posicoes).toHaveLength(44);
    expect(agora.t).toBe(p.tempo);
    // Uma lesão pode ter forçado uma troca: reservas que sobram + trocas feitas = banco inteiro.
    expect(p.reservas("casa").length + (5 - p.trocasRestantes("casa"))).toBe(
      humano.escalacao.reservas.length,
    );
    expect(p.condicoes("casa").every((c) => c === null || (c > 0 && c <= 100))).toBe(true);
    // Recua todo mundo para um 5-4-1: quem estava em cada vaga continua, só muda o lugar.
    const antes = p.emCampo("casa");
    expect(p.mudarFormacao("casa", FORMACOES["5-4-1"])).toBe(true);
    expect(p.emCampo("casa")).toEqual(antes);
    expect(p.vagas("casa")).toBe(FORMACOES["5-4-1"]);
    expect(p.mudarFormacao("casa", FORMACOES["4-4-2"].slice(1))).toBe(false);
    p.mudarTatica("casa", { estilo: "contra-ataque" });
    expect(p.tatica("casa").estilo).toBe("contra-ataque");
    expect(p.simular().placar).toHaveLength(2);
  });

  it("o chute termina num lugar: gol dentro da rede, trave, fora ou nas mãos do goleiro", () => {
    for (const r of lote(20, (i) => jogo(`destino-${i}`))) {
      for (const e of r.eventos) {
        if (e.tipo === "gol" || e.tipo === "chute-fora" || e.tipo === "chute-trave") {
          expect(e.destino, e.tipo).toBeDefined();
          // Fim do campo: além da linha de fundo de um dos lados.
          expect(e.destino!.x <= 0.1 || e.destino!.x >= 104.9).toBe(true);
          if (e.tipo === "gol") expect(Math.abs(e.destino!.y - 34)).toBeLessThan(3.66);
        }
        if (e.tipo === "defesa") expect(e.destino).toBeDefined();
      }
    }
  });

  it("a placa de acréscimo aparece no fim de cada tempo", () => {
    const r = jogo("acrescimo");
    const placas = r.eventos.filter((e) => e.tipo === "acrescimo");
    expect(placas.map((e) => e.periodo)).toEqual([1, 2]);
    for (const p of placas) {
      expect(p.valor).toBeGreaterThanOrEqual(1);
      expect(p.minuto).toBe(p.periodo === 1 ? 45 : 90);
    }
  });

  it(
    "o técnico da CPU lê o jogo: reage ao placar e o humano decide sozinho",
    { timeout: 120_000 },
    () => {
      // Mesmo jogo com e sem o técnico da CPU no time da casa (o visitante nunca reage).
      const medir = (cpu: boolean) => {
        let liderando = 0;
        let segurou = 0;
        let perdendo = 0;
        let buscou = 0;
        let mudancas = 0;
        let mudancasVisitante = 0;
        for (let i = 0; i < 250; i++) {
          const r = simularPartida({
            semente: `tecnico-${i}`,
            casa: timeDeTeste("A", 70, { cpu }),
            fora: timeDeTeste("B", 70, { cpu: false }),
          });
          const ate60 = r.eventos.filter(
            (e) => (e.tipo === "gol" && e.periodo === 1) || (e.tipo === "gol" && e.minuto <= 60),
          );
          const c = ate60.filter((e) => e.time === "casa").length;
          const f = ate60.length - c;
          if (c > f) {
            liderando++;
            if (r.placar[0] > r.placar[1]) segurou++;
          }
          if (c < f) {
            perdendo++;
            if (r.placar[0] >= r.placar[1]) buscou++;
          }
          mudancas += r.eventos.filter(
            (e) => e.tipo === "mudanca-tatica" && e.time === "casa",
          ).length;
          mudancasVisitante += r.eventos.filter(
            (e) => e.tipo === "mudanca-tatica" && e.time === "fora",
          ).length;
        }
        return {
          segurou: segurou / liderando,
          buscou: buscou / perdendo,
          mudancas,
          mudancasVisitante,
        };
      };
      const com = medir(true);
      const sem = medir(false);
      expect(com.mudancas).toBeGreaterThan(100);
      expect(sem.mudancas).toBe(0);
      expect(com.mudancasVisitante).toBe(0);
      // Atrás no placar, a CPU busca o empate mais vezes; na frente, segura pelo menos tão bem.
      expect(com.buscou).toBeGreaterThan(sem.buscou);
      expect(com.segurou).toBeGreaterThanOrEqual(sem.segurou - 0.05);
    },
  );

  it("estatísticas e notas parciais durante o jogo, sem mudar a partida", () => {
    const opcoes = { semente: "parcial", casa: timeDeTeste("A", 70), fora: timeDeTeste("B", 70) };
    const p = new Partida(opcoes);
    p.avancar(60 * 40);
    const agora = p.parcial();
    expect(agora.estatisticas.casa.posse + agora.estatisticas.fora.posse).toBe(100);
    expect(agora.jogadores.filter((j) => j.time === "casa").length).toBeGreaterThanOrEqual(11);
    for (const j of agora.jogadores) {
      expect(j.minutos).toBeLessThanOrEqual(41);
      expect(j.nota).toBeGreaterThanOrEqual(0.5);
      expect(j.nota).toBeLessThanOrEqual(10);
    }
    p.parcial();
    // Consultar no meio do jogo não altera o resultado final.
    expect(p.simular()).toEqual(simularPartida(opcoes));
    expect(p.parcial().jogadores).toEqual(p.resultado().jogadores);
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
