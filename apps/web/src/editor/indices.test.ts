import { describe, expect, it } from "vitest";
import { montarBanco } from "@newbras/banco";
import { gruposDoPais, montarIndices } from "./indices";

const banco = montarBanco();
const indices = montarIndices(banco);

describe("times do editor agrupados por liga", () => {
  it("Brasil: Séries A a D primeiro, depois quem só joga estadual, por estado", () => {
    const grupos = gruposDoPais(banco, indices, "BRA");
    expect(grupos.slice(0, 4).map((g) => g.id)).toEqual([
      "bra-serie-a",
      "bra-serie-b",
      "bra-serie-c",
      "bra-serie-d",
    ]);
    expect(grupos[0]!.clubes).toHaveLength(20);
    expect(grupos.some((g) => g.id === "estado-SP")).toBe(true);
    const total = grupos.reduce((s, g) => s + g.clubes.length, 0);
    expect(total).toBe(indices.clubesDoPais.get("BRA")!.length);
  });

  it("Inglaterra: Premier League na frente", () => {
    expect(gruposDoPais(banco, indices, "ENG")[0]!.clubes).toHaveLength(20);
  });
});
