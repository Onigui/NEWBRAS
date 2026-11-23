import { describe, expect, it } from "vitest";
import { janelaAberta, periodoContem } from "./periodos";

describe("períodos", () => {
  it("funciona dentro do ano e nas pontas", () => {
    const p = { inicio: "07-01", fim: "08-31" };
    expect(periodoContem(p, "2026-07-01")).toBe(true);
    expect(periodoContem(p, "2026-08-31")).toBe(true);
    expect(periodoContem(p, "2026-09-01")).toBe(false);
  });

  it("funciona em período que vira o ano, como a temporada europeia", () => {
    const temporada = { inicio: "08-10", fim: "05-25" };
    expect(periodoContem(temporada, "2026-12-26")).toBe(true);
    expect(periodoContem(temporada, "2027-03-01")).toBe(true);
    expect(periodoContem(temporada, "2027-06-15")).toBe(false);
  });

  it("janela de transferências: aberta no meio do ano e em janeiro na Europa", () => {
    const inglaterra = {
      janelas: [
        { inicio: "06-15", fim: "09-01" },
        { inicio: "01-01", fim: "02-02" },
      ],
    };
    expect(janelaAberta(inglaterra, "2026-08-20")).toBe(true);
    expect(janelaAberta(inglaterra, "2027-01-15")).toBe(true);
    expect(janelaAberta(inglaterra, "2026-11-10")).toBe(false);
  });
});
