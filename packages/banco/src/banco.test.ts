import { CONFEDERACOES, elencoValido, validarIntegridade } from "@newbras/data";
import { gruposDeNomes } from "@newbras/engine";
import { describe, expect, it } from "vitest";
import { montarBanco } from "./montar";
import { PAISES } from "./mundo/paises";

const banco = montarBanco();

describe("países e seleções", () => {
  it("tem as 211 seleções filiadas à FIFA, sem repetir código", () => {
    expect(PAISES).toHaveLength(211);
    expect(new Set(PAISES.map((p) => p.codigo)).size).toBe(211);
  });

  it("tem o número certo de filiadas por confederação", () => {
    const contagem = Object.fromEntries(
      CONFEDERACOES.map((c) => [c, PAISES.filter((p) => p.confederacao === c).length]),
    );
    expect(contagem).toEqual({ UEFA: 55, CONMEBOL: 10, CONCACAF: 35, AFC: 46, CAF: 54, OFC: 11 });
  });

  it("os 6 países de nível 1 e os 20 de nível 2 estão marcados", () => {
    expect(
      PAISES.filter((p) => p.nivel === 1)
        .map((p) => p.codigo)
        .sort(),
    ).toEqual(["BRA", "ENG", "ESP", "FRA", "GER", "ITA"]);
    expect(PAISES.filter((p) => p.nivel === 2)).toHaveLength(20);
  });

  it("todo grupo de nomes usado por um país existe no gerador", () => {
    const grupos = new Set(gruposDeNomes());
    const faltando = [...new Set(PAISES.map((p) => p.grupoNomes))].filter((g) => !grupos.has(g));
    expect(faltando).toEqual([]);
  });

  it("toda seleção tem país e reputação", () => {
    expect(banco.selecoes).toHaveLength(211);
    expect(banco.selecoes.find((s) => s.pais === "BRA")?.reputacao).toBe(5);
  });

  it("as janelas do Brasil são as oficiais da CBF em 2026", () => {
    expect(PAISES.find((p) => p.codigo === "BRA")?.janelas).toEqual([
      { inicio: "01-05", fim: "03-03" },
      { inicio: "07-20", fim: "09-11" },
    ]);
  });
});

describe("Brasil", () => {
  it("tem os 27 estados", () => {
    expect(banco.estados.filter((e) => e.pais === "BRA")).toHaveLength(27);
  });

  it("Séries A, B e C com 20 clubes cada, sem clube repetido entre elas", () => {
    const series = ["bra-serie-a", "bra-serie-b", "bra-serie-c"].map(
      (id) => banco.competicoes.find((c) => c.id === id)!.participantes.fixos,
    );
    for (const s of series) expect(s).toHaveLength(20);
    expect(new Set(series.flat()).size).toBe(60);
  });

  it("a Série A 2026 tem os 4 promovidos de 2025 e não tem os 4 rebaixados", () => {
    const serieA = banco.competicoes.find((c) => c.id === "bra-serie-a")!.participantes.fixos;
    for (const id of ["bra-athletico-pr", "bra-chapecoense", "bra-coritiba", "bra-remo"])
      expect(serieA).toContain(id);
    for (const id of ["bra-fortaleza", "bra-ceara", "bra-juventude", "bra-sport"])
      expect(serieA).not.toContain(id);
  });

  it("todo clube tem elenco válido", () => {
    const porClube = Map.groupBy(banco.jogadores, (j) => j.clube ?? "");
    for (const clube of banco.clubes) {
      expect(elencoValido(porClube.get(clube.id) ?? []), clube.id).toBe(true);
    }
  });
});

describe("banco montado", () => {
  it("passa na validação de integridade sem erros nem avisos", () => {
    expect(validarIntegridade(banco)).toEqual([]);
  });

  it("é determinístico: a mesma semente gera o mesmo banco", () => {
    expect(montarBanco().jogadores.slice(0, 50)).toEqual(banco.jogadores.slice(0, 50));
    expect(montarBanco({ semente: "outra" }).jogadores[0]).not.toEqual(banco.jogadores[0]);
  });

  it("titulares da Série A são mais fortes que os da Série C", () => {
    const media = (serie: string) => {
      const clubes = new Set(banco.competicoes.find((c) => c.id === serie)!.participantes.fixos);
      const forcas = banco.jogadores
        .filter((j) => j.clube && clubes.has(j.clube) && (j.numero ?? 99) <= 11)
        .map((j) => j.forca);
      return forcas.reduce((a, b) => a + b, 0) / forcas.length;
    };
    expect(media("bra-serie-a")).toBeGreaterThan(media("bra-serie-c") + 12);
  });
});
