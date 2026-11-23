import { Rng } from "@newbras/engine";
import { describe, expect, it } from "vitest";
import { ELENCOS_KSA } from "./elencos-ksa";
import { ELENCOS_MLS } from "./elencos-mls";
import { forcaPeloValor, lerElencos, lerValor, slug } from "./fotmob";
import { PAIS_POR_NOME_EN } from "./paises-en";

describe("fonte dos elencos reais", () => {
  it("lê valores de mercado em K e M", () => {
    expect(lerValor("€1.8M")).toBe(1800);
    expect(lerValor("€516.4k")).toBeCloseTo(516.4);
    expect(lerValor("€170K")).toBe(170);
    expect(lerValor("")).toBeUndefined();
    expect(lerValor("-")).toBeUndefined();
  });

  it("tem os 30 elencos da MLS e os 18 da Saudi Pro League, todos com país conhecido", () => {
    const mls = lerElencos(ELENCOS_MLS);
    const ksa = lerElencos(ELENCOS_KSA);
    expect(mls.size).toBe(30);
    expect(ksa.size).toBe(18);
    for (const linhas of [...mls.values(), ...ksa.values()]) {
      expect(linhas.length).toBeGreaterThanOrEqual(20);
      for (const l of linhas) expect(PAIS_POR_NOME_EN[l.pais], l.nome).toBeDefined();
    }
  });

  it("jovem caro tem força menor que o valor sugere e potencial alto; veterano barato não despenca", () => {
    const rng = new Rng("teste");
    const jovem = forcaPeloValor(rng, 14_000, 17, 68);
    expect(jovem.forca).toBeLessThan(70);
    expect(jovem.potencial).toBeGreaterThanOrEqual(85);
    const veterano = forcaPeloValor(rng, 2_300, 37, 68);
    expect(veterano.forca).toBeGreaterThanOrEqual(78);
    expect(veterano.potencial).toBe(veterano.forca);
  });

  it("gera ids simples a partir do nome", () => {
    expect(slug("Iñigo Martínez")).toBe("inigo-martinez");
    expect(slug("Dawid Poręba")).toBe("dawid-poreba");
    expect(slug("Marcin Bułka")).toBe("marcin-bulka");
  });
});
