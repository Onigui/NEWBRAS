import { describe, expect, it } from "vitest";
import {
  anoDaTemporada,
  avancarAteJogo,
  compromissoDoDia,
  melhorDoMundo,
  mundoDoBanco,
  mundoNaData,
  nomearTecnicos,
  novaCarreira,
  partidaDoCompromisso,
  rankingDeClubes,
  rankingDeTecnicos,
  registrarJogo,
  simularPartida,
  type Carreira,
} from "@newbras/engine";
import { montarBanco } from "./index";

const banco = montarBanco();
const base = mundoDoBanco(banco);
const nova = (clube: string) =>
  novaCarreira(base, {
    id: "t",
    semente: "premios",
    tecnico: "T",
    clube,
    referencia: "2026-07-01",
    versaoBanco: banco.meta.versao,
  });

/** Joga a carreira até a data, com as partidas do técnico simuladas. */
function jogarAte(c0: Carreira, ate: string): Carreira {
  let c = c0;
  while (c.data < ate) {
    const x = compromissoDoDia(c);
    if (x) {
      const m = mundoNaData(base, c, c.data);
      c = registrarJogo(c, m, x.id, simularPartida(partidaDoCompromisso(c, m, x)));
      continue;
    }
    const r = avancarAteJogo(c, base);
    if (r.carreira === c || r.carreira.perfil?.demitido) return r.carreira;
    c = r.carreira;
  }
  return c;
}

describe("prêmios e rankings", () => {
  it("ano da temporada", () => {
    expect(anoDaTemporada("2026/27")).toBe(2027);
    expect(anoDaTemporada("2027")).toBe(2027);
    expect(anoDaTemporada("1999/00")).toBe(2000);
  });

  it(
    "a liga que acaba dá Bola de Ouro, Bola de Prata, artilheiro, revelação e técnico",
    { timeout: 300_000 },
    () => {
      const c = jogarAte(nova("eng-arsenal"), "2027-06-15");
      const p = c.premios?.ligas.find((x) => x.competicao === "eng-premier-league");
      expect(p).toBeDefined();
      if (!p) return;
      expect(p.temporada).toBe("2026/27");
      expect(p.craque).toBeDefined();
      const porPosicao = (pos: string) => p.selecao.filter((x) => x.posicao === pos).length;
      expect([
        porPosicao("G"),
        porPosicao("L"),
        porPosicao("Z"),
        porPosicao("M"),
        porPosicao("A"),
      ]).toEqual([1, 2, 2, 3, 3]);
      expect(p.artilheiro?.gols ?? 0).toBeGreaterThan(5);
      expect(p.tecnico?.nome).toBeTruthy();
      expect(p.tabela).toHaveLength(10);
      // O craque é o de maior nota da seleção.
      expect(Math.max(...p.selecao.map((x) => x.nota))).toBe(p.craque!.nota);
      expect(c.noticias.some((n) => n.texto.startsWith("Bola de Ouro da {liga}"))).toBe(true);
      // Rankings: ordenados, com o técnico e o clube dele.
      const m = mundoNaData(base, c, c.data);
      const clubes = rankingDeClubes(c, m, banco.clubes, c.data);
      expect(clubes[0]!.pontos).toBeGreaterThanOrEqual(clubes[1]!.pontos);
      expect(clubes.findIndex((x) => x.id === "eng-arsenal")).toBeLessThan(60);
      const tecnicos = rankingDeTecnicos(c, m, banco.clubes, c.data);
      expect(tecnicos.filter((x) => x.humano)).toHaveLength(1);
      expect(tecnicos).toHaveLength(banco.clubes.length);
      const nomes = nomearTecnicos(tecnicos.slice(0, 5), m, c.semente);
      expect(nomes.every((x) => x.humano || x.nome.length > 3)).toBe(true);
      // O nome do técnico da CPU não muda de um dia para o outro.
      expect(nomearTecnicos(tecnicos.slice(0, 5), m, c.semente)).toEqual(nomes);
    },
  );

  it("o melhor do mundo sai no 1º de janeiro, só do ano inteiro na carreira", () => {
    const c = nova("eng-arsenal");
    const premiado = (jogador: string, clube: string, nota: number) => ({
      jogador,
      nome: jogador,
      clube,
      posicao: "A" as const,
      nota,
    });
    const comPremios: Carreira = {
      ...c,
      premios: {
        ligas: [
          {
            competicao: "eng-premier-league",
            temporada: "2026/27",
            data: "2027-05-30",
            forcaDaLiga: 84,
            tabela: [],
            selecao: [premiado("a", "eng-arsenal", 100), premiado("b", "eng-chelsea", 99)],
          },
          {
            competicao: "bra-serie-a",
            temporada: "2027",
            data: "2027-12-08",
            forcaDaLiga: 70,
            tabela: [],
            selecao: [premiado("c", "bra-flamengo", 101)],
          },
        ],
        mundo: [],
      },
    };
    const m = mundoNaData(base, c, c.data);
    // 2026: a carreira começou em julho, sem a temporada inteira.
    expect(melhorDoMundo(comPremios, m, "2027-01-01").carreira.premios?.mundo).toEqual([]);
    const r = melhorDoMundo(comPremios, m, "2028-01-01");
    const ano = r.carreira.premios?.mundo[0];
    expect(ano?.ano).toBe(2027);
    // A liga mais forte pesa: o da Premier League passa o do Brasileirão com nota maior.
    expect(ano?.ranking.map((x) => x.jogador)).toEqual(["a", "b", "c"]);
    expect(r.noticias.some((n) => n.texto.startsWith("Melhor do mundo"))).toBe(true);
    // Só uma vez por ano.
    expect(melhorDoMundo(r.carreira, m, "2028-01-01").carreira).toBe(r.carreira);
  });
});
