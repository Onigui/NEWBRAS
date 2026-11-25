import { describe, expect, it } from "vitest";
import { Clube } from "./schemas/clube";
import { camisasDoClube, corDeTexto, escudoDoClube, hashTexto } from "./visual";

const base = {
  id: "bra-teste",
  cores: { primaria: "#004D98", secundaria: "#FFFFFF" },
};

describe("visual gerado", () => {
  it("é estável para o mesmo clube", () => {
    expect(hashTexto("bra-teste")).toBe(hashTexto("bra-teste"));
    expect(escudoDoClube(base)).toEqual(escudoDoClube(base));
    expect(camisasDoClube(base)).toEqual(camisasDoClube(base));
  });

  it("usa o escudo e as camisas definidos quando existem", () => {
    const escudo = { forma: "redondo", padrao: "cruz" } as const;
    const camisas = [{ padrao: "metades", cor1: "#000000", cor2: "#FFFFFF" }] as const;
    expect(escudoDoClube({ ...base, escudo })).toEqual(escudo);
    expect(camisasDoClube({ ...base, camisas: [...camisas] })).toEqual(camisas);
  });

  it("titular nas cores do clube e reserva invertida", () => {
    const [titular, reserva] = camisasDoClube(base);
    expect(titular!.cor1).toBe("#004D98");
    expect(reserva).toEqual({ padrao: "lisa", cor1: "#FFFFFF", cor2: "#004D98" });
  });

  it("escolhe texto legível", () => {
    expect(corDeTexto("#FFFFFF")).toBe("#111111");
    expect(corDeTexto("#1D2B3A")).toBe("#FFFFFF");
  });

  it("o esquema aceita no máximo 3 camisas", () => {
    const clube = {
      id: "bra-x",
      nome: "X",
      nomeCurto: "X",
      abreviacao: "XXX",
      pais: "BRA",
      cidade: "X",
      estadio: { nome: "X", capacidade: 1000 },
      cores: { primaria: "#000000", secundaria: "#FFFFFF" },
      reputacao: 1,
      nivel: 10,
    };
    const camisa = { padrao: "lisa", cor1: "#000000", cor2: "#FFFFFF" };
    expect(Clube.safeParse({ ...clube, camisas: [camisa, camisa, camisa] }).success).toBe(true);
    expect(Clube.safeParse({ ...clube, camisas: [camisa, camisa, camisa, camisa] }).success).toBe(
      false,
    );
  });
});
