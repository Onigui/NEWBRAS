import { describe, expect, it } from "vitest";
import { gerarAtributos, type Jogador, type Pais, type Posicao } from "@newbras/data";
import { Rng } from "../rng";
import {
  emFerias,
  fatorDeRecaida,
  foraNaCpu,
  fragilidade,
  lesaoNaCpu,
  RISCO_DA_POSICAO,
  riscoDeLesao,
  sortearLesao,
  type CausaDaLesao,
} from "./lesoes";

function jogador(id: string, posicao: Posicao, nascimento = "2000-01-01", fisico = 60): Jogador {
  const atributos = gerarAtributos({ semente: id, posicao, forca: 70 });
  return {
    id,
    nome: id,
    posicao,
    nascimento,
    forca: 70,
    atributos:
      posicao === "G" ? atributos : { ...atributos, resistencia: fisico, forcaFisica: fisico },
  } as unknown as Jogador;
}

const media = (l: number[]) => l.reduce((a, b) => a + b, 0) / l.length;

describe("risco de lesão", () => {
  it("goleiro arrisca bem menos; veterano e físico fraco arriscam mais", () => {
    const risco = (j: Jogador, data = "2027-03-01") => riscoDeLesao(j, data, "s");
    // Mesma fragilidade (mesmo id): só a posição muda.
    const g = risco(jogador("x", "G"));
    const a = risco(jogador("x", "A"));
    expect(g / a).toBeCloseTo(RISCO_DA_POSICAO.G / RISCO_DA_POSICAO.A, 1);
    expect(risco(jogador("x", "M", "1992-01-01"))).toBeGreaterThan(risco(jogador("x", "M")));
    expect(risco(jogador("x", "M", "2000-01-01", 30))).toBeGreaterThan(
      risco(jogador("x", "M", "2000-01-01", 95)),
    );
  });

  it("fragilidade fixa por jogador: uns de vidro, outros quase nunca param", () => {
    const l = Array.from({ length: 2000 }, (_, i) => fragilidade("s", `j${i}`));
    expect(fragilidade("s", "j1")).toBe(l[1]);
    expect(Math.min(...l)).toBeGreaterThanOrEqual(0.5);
    expect(Math.max(...l)).toBeLessThanOrEqual(2.2);
    expect(l.filter((x) => x >= 1.5).length / l.length).toBeGreaterThan(0.05);
    expect(l.filter((x) => x <= 0.7).length / l.length).toBeGreaterThan(0.05);
    expect(media(l)).toBeGreaterThan(0.95);
    expect(media(l)).toBeLessThan(1.15);
  });

  it("recaída: risco 2,5 vezes na volta, normal depois de 4 semanas", () => {
    const l = { nome: "Fratura", ate: "2027-03-01", dias: 70 };
    expect(fatorDeRecaida(l, "2027-02-20")).toBe(1);
    expect(fatorDeRecaida(l, "2027-03-01")).toBe(2.5);
    expect(fatorDeRecaida(l, "2027-03-15")).toBeCloseTo(1.75, 2);
    expect(fatorDeRecaida(l, "2027-04-01")).toBe(1);
  });

  it("o tipo depende da causa e o veterano demora mais para voltar", () => {
    const rng = new Rng("tipos");
    const parte = (causa: CausaDaLesao, nome: string) =>
      Array.from({ length: 3000 }, () => sortearLesao(rng, "2027-03-01", causa)).filter(
        (x) => x.nome === nome,
      ).length / 3000;
    expect(parte("falta", "Pancada")).toBeGreaterThan(0.35);
    expect(parte("falta", "Fratura")).toBeGreaterThan(parte("treino", "Fratura") * 3);
    expect(parte("cansaco", "Estiramento muscular")).toBeGreaterThan(0.3);
    const dias = (idade: number) =>
      media(
        Array.from(
          { length: 2000 },
          () => sortearLesao(new Rng(`d${idade}`), "2027-03-01", "treino", idade).dias,
        ),
      );
    expect(dias(36)).toBeGreaterThan(dias(24));
  });
});

describe("férias e CPU", () => {
  it("sem treino nas férias: junho na Europa, dezembro no Brasil", () => {
    const europa = { temporada: { inicio: "08-15", fim: "05-31" } } as Pais;
    const brasil = { temporada: { inicio: "01-10", fim: "12-10" } } as Pais;
    expect(emFerias(europa, "2027-06-10")).toBe(true);
    expect(emFerias(europa, "2027-07-20")).toBe(true);
    expect(emFerias(europa, "2027-07-30")).toBe(false);
    expect(emFerias(europa, "2027-03-01")).toBe(false);
    expect(emFerias(brasil, "2027-12-20")).toBe(true);
    expect(emFerias(brasil, "2028-01-05")).toBe(false);
    expect(emFerias(brasil, "2027-12-05")).toBe(false);
  });

  it("CPU: cerca de uma lesão a cada 4 jogos, quase nunca no goleiro", () => {
    const elenco = [
      jogador("g", "G"),
      ...["z1", "z2", "l1", "l2", "m1", "m2", "m3", "m4", "a1", "a2"].map((id) =>
        jogador(id, id[0]!.toUpperCase() as Posicao),
      ),
    ];
    const lesoes = Array.from({ length: 4000 }, (_, i) =>
      lesaoNaCpu(elenco, "2027-03-01", "s", `jogo${i}`),
    ).filter((x) => x !== undefined);
    expect(lesoes.length / 4000).toBeGreaterThan(0.2);
    expect(lesoes.length / 4000).toBeLessThan(0.28);
    expect(lesoes.filter(([id]) => id === "g").length / lesoes.length).toBeLessThan(0.06);
    const fora = foraNaCpu({ c: [["a1", "2027-03-10"]] }, "c", "2027-03-05");
    expect([...(fora ?? [])]).toEqual(["a1"]);
    expect(foraNaCpu({ c: [["a1", "2027-03-10"]] }, "c", "2027-03-10")).toBeUndefined();
  });
});
