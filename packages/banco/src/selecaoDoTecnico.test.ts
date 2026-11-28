import { describe, expect, it } from "vitest";
import {
  agendaCompleta,
  assumirSelecao,
  avancarAteJogo,
  compromissoDoDia,
  definirConvocacao,
  deixarSelecao,
  elegiveisDaSelecao,
  mundoDoBanco,
  mundoNaData,
  novaCarreira,
  partidaDoCompromisso,
  problemasDaConvocacao,
  registrarJogo,
  simularPartida,
} from "@newbras/engine";
import { montarBanco } from "./index";

const banco = montarBanco();
const base = mundoDoBanco(banco);
const nova = () =>
  novaCarreira(base, {
    id: "t",
    semente: "selecao",
    tecnico: "T",
    clube: "bra-flamengo",
    referencia: "2026-07-01",
    versaoBanco: banco.meta.versao,
  });

describe("técnico de seleção", () => {
  it(
    "assume a seleção, convoca à mão e os jogos dela entram na agenda",
    { timeout: 300_000 },
    () => {
      let c = nova();
      const m = mundoNaData(base, c, c.data);
      c = assumirSelecao(c, m, "BRA");
      expect(c.selecao?.pais).toBe("BRA");
      const elegiveis = elegiveisDaSelecao(m, "BRA");
      expect(elegiveis.length).toBeGreaterThan(100);
      // Convocação à mão: 2 goleiros e os 21 melhores de linha.
      const goleiros = elegiveis.filter((j) => j.posicao === "G").slice(0, 2);
      const linha = elegiveis.filter((j) => j.posicao !== "G").slice(0, 21);
      const ids = [...goleiros, ...linha].map((j) => j.id);
      expect(problemasDaConvocacao([...goleiros, ...linha])).toEqual([]);
      expect(definirConvocacao(c, m, ids.slice(0, 10))).toBe(c);
      c = definirConvocacao(c, m, ids);
      expect(c.selecao?.convocados).toHaveLength(23);
      const convocacao = mundoNaData(base, c, c.data).elenco("BRA");
      expect(new Set(convocacao.map((j) => j.id))).toEqual(new Set(ids));
      // Os jogos da seleção aparecem na agenda (quando as competições abrem) e o técnico os joga.
      let jogou = false;
      for (let i = 0; i < 80 && !jogou; i++) {
        c = avancarAteJogo(c, base).carreira;
        const x = compromissoDoDia(c);
        if (!x) break;
        const mundo = mundoNaData(base, c, c.data);
        const r = simularPartida(partidaDoCompromisso(c, mundo, x));
        c = registrarJogo(c, mundo, x.id, r);
        if (x.selecao) {
          jogou = true;
          expect(agendaCompleta(c).some((y) => y.selecao === "BRA")).toBe(true);
          expect(c.selecao?.jogos).toBe(1);
          const depois = agendaCompleta(c).find((y) => y.id === x.id);
          expect(depois?.resultado?.placar).toEqual([r.placar[0], r.placar[1]]);
          const time = partidaDoCompromisso(c, mundo, x);
          const nosso = x.mando === "casa" ? time.casa : time.fora;
          expect(nosso.escalacao.titulares.every((id) => !id || ids.includes(id))).toBe(true);
        }
      }
      expect(jogou).toBe(true);
      // Sair da seleção guarda a passagem.
      c = deixarSelecao(c, mundoNaData(base, c, c.data), "pediu");
      expect(c.selecao).toBeUndefined();
      expect(c.selecoesAnteriores?.[0]?.pais).toBe("BRA");
    },
  );
});
