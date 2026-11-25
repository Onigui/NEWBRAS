import { describe, expect, it } from "vitest";
import { FORMATO_CARREIRA } from "@newbras/engine";
import { lerCarreira } from "./salvamentos";

describe("leitura de salvamentos", () => {
  const minima = {
    formato: FORMATO_CARREIRA,
    id: "c1",
    semente: "s",
    clube: "bra-corinthians",
    data: "2026-12-20",
    agenda: [],
    jogadores: {},
    noticias: [],
  };

  it("aceita uma carreira do formato atual", () => {
    expect(lerCarreira(minima).ok).toBe(true);
  });

  it("recusa arquivo de outro jogo, formato antigo ou incompleto, explicando o motivo", () => {
    expect(lerCarreira("texto")).toEqual({
      ok: false,
      erro: "o arquivo não é uma carreira do NewBras",
    });
    const antiga = lerCarreira({ ...minima, formato: 0 });
    expect(antiga.ok).toBe(false);
    const { agenda: _a, ...semAgenda } = minima;
    const r = lerCarreira(semAgenda);
    expect(r.ok ? "" : r.erro).toContain("agenda");
  });
});
