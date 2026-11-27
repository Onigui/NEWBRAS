import { describe, expect, it } from "vitest";
import { gerarAtributos, type Clube, type Jogador, type Pais, type Posicao } from "@newbras/data";
import {
  EvolucaoDoMundo,
  forcaNaIdade,
  inicioDaTemporadaContada,
  temporadasContadas,
  type Geracao,
  type MundoParaEvolucao,
} from "./evolucao";

const PAIS: Pais = {
  codigo: "ENG",
  nome: "Inglaterra",
  confederacao: "UEFA",
  nivel: 1,
  grupoNomes: "en",
  temporada: { inicio: "08-01", fim: "05-31" },
  janelas: [],
  cores: { primaria: "#ffffff", secundaria: "#000000" },
} as unknown as Pais;

function jogador(
  id: string,
  clube: string,
  o: { nascimento: string; forca: number; potencial: number; posicao?: Posicao; estrela?: boolean },
): Jogador {
  const posicao = o.posicao ?? "M";
  return {
    id,
    nome: id,
    nascimento: o.nascimento,
    nacionalidade: "ENG",
    posicao,
    lado: "C",
    forca: o.forca,
    potencial: o.potencial,
    caracteristicas: ["passe"],
    atributos: gerarAtributos({ semente: id, posicao, forca: o.forca }),
    estrela: o.estrela ?? false,
    base: false,
    clube,
    aConferir: [],
  } as unknown as Jogador;
}

function mundo(): MundoParaEvolucao {
  const clubes = ["a", "b", "c"].map(
    (id) => ({ id, nome: id, nomeCurto: id, pais: "ENG", nivel: 70 }) as unknown as Clube,
  );
  const elencos: Record<string, Jogador[]> = {
    a: [
      jogador("veterano", "a", { nascimento: "1991-03-01", forca: 75, potencial: 78 }),
      jogador("lenda", "a", {
        nascimento: "1990-05-01",
        forca: 84,
        potencial: 92,
        estrela: true,
      }),
      jogador("jovem", "a", { nascimento: "2007-01-01", forca: 60, potencial: 84 }),
      jogador("goleiro", "a", {
        nascimento: "1999-01-01",
        forca: 70,
        potencial: 74,
        posicao: "G",
      }),
    ],
    b: [jogador("b1", "b", { nascimento: "2000-01-01", forca: 65, potencial: 70 })],
    c: [jogador("c1", "c", { nascimento: "2001-01-01", forca: 66, potencial: 70 })],
  };
  const todos = Object.values(elencos).flat();
  return {
    clubes,
    clube: (id) => clubes.find((c) => c.id === id),
    pais: (c) => (c === "ENG" ? PAIS : undefined),
    elenco: (id) => elencos[id] ?? [],
    jogador: (id) => todos.find((j) => j.id === id),
  };
}

const geracao = (j: Jogador, idadeInicio: number, o: Partial<Geracao> = {}): Geracao => ({
  j,
  clube: "a",
  inicio: "2026-07-01",
  idadeInicio,
  potencialReal: j.potencial,
  aposentadoria: 36,
  atraso: 0,
  ...o,
});

describe("evolução dos jogadores", () => {
  it("o jovem cresce até o potencial aos 28; o veterano cai depois do auge", () => {
    const jovem = jogador("j", "a", { nascimento: "2007-01-01", forca: 60, potencial: 84 });
    const g = geracao(jovem, 19);
    expect(forcaNaIdade(g, 19)).toBe(60);
    expect(forcaNaIdade(g, 22)).toBeGreaterThan(65);
    expect(forcaNaIdade(g, 28)).toBe(84);
    expect(forcaNaIdade(g, 30)).toBe(84);
    const veterano = jogador("v", "a", { nascimento: "1991-01-01", forca: 80, potencial: 90 });
    const v = geracao(veterano, 33);
    expect(forcaNaIdade(v, 33)).toBe(80);
    expect(forcaNaIdade(v, 34)).toBeLessThan(80);
    expect(forcaNaIdade(v, 36)).toBeLessThan(forcaNaIdade(v, 34));
    // Com 2 anos a mais de auge, cai depois.
    expect(forcaNaIdade({ ...v, atraso: 2 }, 34)).toBeGreaterThan(forcaNaIdade(v, 34));
  });

  it("temporadas contadas pelo começo da temporada do país, depois da carência", () => {
    expect(inicioDaTemporadaContada(PAIS, "2026-07-11", 1)).toBe("2027-08-01");
    expect(temporadasContadas(PAIS, "2026-07-11", "2027-07-31")).toBe(0);
    expect(temporadasContadas(PAIS, "2026-07-11", "2027-08-01")).toBe(1);
    expect(temporadasContadas(PAIS, "2026-07-11", "2029-09-01")).toBe(3);
  });

  it("aposentados dão lugar a juniores; a lenda renasce em outro elenco com o auge de potencial", () => {
    const m = mundo();
    const e = new EvolucaoDoMundo(m, "s", "2026-07-11");
    // Primeira temporada: o banco como está.
    expect(e.elenco("a", "2027-01-01")).toBe(m.elenco("a"));
    const daqui10 = e.elenco("a", "2036-09-01");
    const ids = daqui10.map((j) => j.id);
    // Veterano e lenda pararam (32 a 41 anos); juniores no lugar, na mesma posição.
    expect(ids).not.toContain("veterano");
    expect(ids).not.toContain("lenda");
    const juniores = daqui10.filter((j) => j.id.startsWith("veterano~"));
    expect(juniores).toHaveLength(1);
    expect(juniores[0]?.posicao).toBe("M");
    expect(juniores[0]?.clube).toBe("a");
    // O jovem chegou perto do potencial.
    expect(daqui10.find((j) => j.id === "jovem")!.forca).toBeGreaterThan(75);
    // A lenda renasceu num dos clubes, com o potencial do auge.
    const renascido = ["a", "b", "c"]
      .flatMap((c) => e.elenco(c, "2036-09-01"))
      .find((j) => j.id === "lenda~r");
    expect(renascido).toBeDefined();
    expect(renascido!.nome).toBe("lenda");
    expect(renascido!.potencial).toBeGreaterThanOrEqual(84);
    // Os eventos contam a história.
    const aposentadoria = [...Array(4000).keys()]
      .map((i) => new Date(Date.UTC(2027, 0, 1) + i * 86_400_000).toISOString().slice(0, 10))
      .flatMap((d) => e.eventos(d))
      .filter((x) => x.id === "lenda" && x.tipo === "aposentadoria");
    expect(aposentadoria).toHaveLength(1);
    // Mesma semente, mesmo mundo.
    const outra = new EvolucaoDoMundo(m, "s", "2026-07-11");
    expect(outra.elenco("a", "2036-09-01").map((j) => [j.id, j.forca])).toEqual(
      daqui10.map((j) => [j.id, j.forca]),
    );
  });
});

describe("renascimento das lendas", () => {
  it("qualquer clube do mundo com a mesma chance, nunca o clube de onde saiu", () => {
    const clubes = Array.from(
      { length: 40 },
      (_, i) =>
        ({
          id: `c${i}`,
          nome: `c${i}`,
          nomeCurto: `c${i}`,
          pais: "ENG",
          nivel: i < 4 ? 90 : 40,
        }) as unknown as Clube,
    );
    const destinos = new Map<string, number>();
    for (let s = 0; s < 400; s++) {
      const lenda = jogador(`lenda${s}`, "c0", {
        nascimento: "1990-05-01",
        forca: 84,
        potencial: 92,
        estrela: true,
      });
      const m: MundoParaEvolucao = {
        clubes,
        clube: (id) => clubes.find((c) => c.id === id),
        pais: (c) => (c === "ENG" ? PAIS : undefined),
        elenco: (id) => (id === "c0" ? [lenda] : []),
        jogador: (id) => (id === lenda.id ? lenda : undefined),
      };
      const e = new EvolucaoDoMundo(m, `s${s}`, "2026-07-11");
      const r = clubes
        .flatMap((c) => e.elenco(c.id, "2036-09-01"))
        .find((j) => j.id === `${lenda.id}~r`);
      if (r?.clube) destinos.set(r.clube, (destinos.get(r.clube) ?? 0) + 1);
    }
    expect(destinos.get("c0") ?? 0).toBe(0);
    // Os 4 clubes fortes (de 39 possíveis) ficam perto da parte deles: ~10%, não a maioria.
    const fortes = ["c1", "c2", "c3"].reduce((s, c) => s + (destinos.get(c) ?? 0), 0);
    const total = [...destinos.values()].reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThan(300);
    expect(fortes / total).toBeLessThan(0.2);
  });
});
