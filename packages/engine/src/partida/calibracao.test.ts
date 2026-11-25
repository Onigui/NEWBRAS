import { describe, expect, it } from "vitest";
import { METAS, medirCalibracao } from "./calibracao";

describe("calibração (Fase 6)", () => {
  it("um lote de 600 jogos cai perto das metas do futebol real", { timeout: 120_000 }, () => {
    const m = medirCalibracao(600, "ci");
    // Lote pequeno: a faixa ganha uma folga para o acaso. O relatório completo (10.000 jogos)
    // está em docs/CALIBRACAO.md e sai de `pnpm calibrar`.
    for (const k of Object.keys(METAS) as (keyof typeof METAS)[]) {
      const meta = METAS[k];
      const folga = (meta.max - meta.min) * 0.5 + (meta.unidade === "%" ? 0.04 : 0);
      expect(m[k], meta.nome).toBeGreaterThanOrEqual(meta.min - folga);
      expect(m[k], meta.nome).toBeLessThanOrEqual(meta.max + folga);
    }
  });
});
