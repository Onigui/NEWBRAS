import { describe, expect, it } from "vitest";
import { idade, nascimentoParaIdade } from "./datas";

describe("datas do editor", () => {
  it("calcula a idade na data de referência", () => {
    expect(idade("2000-07-01", "2026-07-01")).toBe(26);
    expect(idade("2000-07-02", "2026-07-01")).toBe(25);
  });
  it("muda o ano de nascimento para a idade pedida", () => {
    expect(nascimentoParaIdade("2000-03-15", 30, "2026-07-01")).toBe("1996-03-15");
    expect(nascimentoParaIdade("2000-12-15", 30, "2026-07-01")).toBe("1995-12-15");
  });
});
