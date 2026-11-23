import { CONFEDERACOES, elencoValido, validarIntegridade } from "@newbras/data";
import { gruposDeNomes } from "@newbras/engine";
import { describe, expect, it } from "vitest";
import { montarBanco } from "./montar";
import { PAISES } from "./mundo/paises";

const banco = montarBanco();

describe("países e seleções", () => {
  it("tem as 211 seleções filiadas à FIFA, sem repetir código", () => {
    expect(PAISES).toHaveLength(211);
    expect(new Set(PAISES.map((p) => p.codigo)).size).toBe(211);
  });

  it("tem o número certo de filiadas por confederação", () => {
    const contagem = Object.fromEntries(
      CONFEDERACOES.map((c) => [c, PAISES.filter((p) => p.confederacao === c).length]),
    );
    expect(contagem).toEqual({ UEFA: 55, CONMEBOL: 10, CONCACAF: 35, AFC: 46, CAF: 54, OFC: 11 });
  });

  it("os 6 países de nível 1 e os 20 de nível 2 estão marcados", () => {
    expect(
      PAISES.filter((p) => p.nivel === 1)
        .map((p) => p.codigo)
        .sort(),
    ).toEqual(["BRA", "ENG", "ESP", "FRA", "GER", "ITA"]);
    expect(PAISES.filter((p) => p.nivel === 2)).toHaveLength(20);
  });

  it("todo grupo de nomes usado por um país existe no gerador", () => {
    const grupos = new Set(gruposDeNomes());
    const faltando = [...new Set(PAISES.map((p) => p.grupoNomes))].filter((g) => !grupos.has(g));
    expect(faltando).toEqual([]);
  });

  it("toda seleção tem país e reputação", () => {
    expect(banco.selecoes).toHaveLength(211);
    expect(banco.selecoes.find((s) => s.pais === "BRA")?.reputacao).toBe(5);
  });

  it("as janelas do Brasil são as oficiais da CBF em 2026", () => {
    expect(PAISES.find((p) => p.codigo === "BRA")?.janelas).toEqual([
      { inicio: "01-05", fim: "03-03" },
      { inicio: "07-20", fim: "09-11" },
    ]);
  });
});

describe("Brasil", () => {
  it("tem os 27 estados", () => {
    expect(banco.estados.filter((e) => e.pais === "BRA")).toHaveLength(27);
  });

  it("Séries A, B e C com 20 clubes cada, sem clube repetido entre elas", () => {
    const series = ["bra-serie-a", "bra-serie-b", "bra-serie-c"].map(
      (id) => banco.competicoes.find((c) => c.id === id)!.participantes.fixos,
    );
    for (const s of series) expect(s).toHaveLength(20);
    expect(new Set(series.flat()).size).toBe(60);
  });

  it("Série D com 96 clubes, em 16 grupos de 6, sem repetir clubes das outras séries", () => {
    const todas = ["bra-serie-a", "bra-serie-b", "bra-serie-c", "bra-serie-d"].flatMap(
      (id) => banco.competicoes.find((c) => c.id === id)!.participantes.fixos,
    );
    const serieD = banco.competicoes.find((c) => c.id === "bra-serie-d")!;
    expect(serieD.participantes.fixos).toHaveLength(96);
    expect(new Set(todas).size).toBe(156);
    const grupos = serieD.fases[0]!;
    expect(grupos.tipo === "grupos" && grupos.grupos * 6).toBe(96);
  });

  it("tem os 27 estaduais, cada um com clubes que existem e sem repetir clube", () => {
    const estaduais = banco.competicoes.filter((c) => c.tipo === "estadual");
    expect(estaduais).toHaveLength(27);
    const ids = new Set(banco.clubes.map((c) => c.id));
    for (const e of estaduais) {
      expect(new Set(e.participantes.fixos).size, e.id).toBe(e.participantes.fixos.length);
      for (const c of e.participantes.fixos) expect(ids.has(c), `${e.id}: ${c}`).toBe(true);
    }
  });

  it("cada clube de estadual é do estado do campeonato", () => {
    const estadoDe = new Map(banco.clubes.map((c) => [c.id, c.estado]));
    for (const e of banco.competicoes.filter((c) => c.tipo === "estadual")) {
      const uf = e.escopo.tipo === "estado" ? e.escopo.estado : "";
      for (const c of e.participantes.fixos) expect(estadoDe.get(c), `${e.id}: ${c}`).toBe(uf);
    }
  });

  it("clubes com dados ainda não confirmados ficam marcados para conferir", () => {
    const marcados = banco.clubes.filter((c) => c.aConferir.length > 0);
    expect(marcados.length).toBeGreaterThan(0);
    expect(banco.clubes.find((c) => c.id === "bra-flamengo")!.aConferir).toEqual([]);
  });

  it("a Série A 2026 tem os 4 promovidos de 2025 e não tem os 4 rebaixados", () => {
    const serieA = banco.competicoes.find((c) => c.id === "bra-serie-a")!.participantes.fixos;
    for (const id of ["bra-athletico-pr", "bra-chapecoense", "bra-coritiba", "bra-remo"])
      expect(serieA).toContain(id);
    for (const id of ["bra-fortaleza", "bra-ceara", "bra-juventude", "bra-sport"])
      expect(serieA).not.toContain(id);
  });

  it("todo clube tem elenco válido", () => {
    const porClube = Map.groupBy(banco.jogadores, (j) => j.clube ?? "");
    for (const clube of banco.clubes) {
      expect(elencoValido(porClube.get(clube.id) ?? []), clube.id).toBe(true);
    }
  });
});

describe("banco montado", () => {
  it("passa na validação de integridade sem erros nem avisos", () => {
    expect(validarIntegridade(banco)).toEqual([]);
  });

  it("é determinístico: a mesma semente gera o mesmo banco", () => {
    expect(montarBanco().jogadores.slice(0, 50)).toEqual(banco.jogadores.slice(0, 50));
    expect(montarBanco({ semente: "outra" }).jogadores[0]).not.toEqual(banco.jogadores[0]);
  });

  it("titulares da Série A são mais fortes que os da Série C", () => {
    const media = (serie: string) => {
      const clubes = new Set(banco.competicoes.find((c) => c.id === serie)!.participantes.fixos);
      const forcas = banco.jogadores
        .filter((j) => j.clube && clubes.has(j.clube) && (j.numero ?? 99) <= 11)
        .map((j) => j.forca);
      return forcas.reduce((a, b) => a + b, 0) / forcas.length;
    };
    expect(media("bra-serie-a")).toBeGreaterThan(media("bra-serie-c") + 12);
  });
});

describe("Inglaterra", () => {
  const liga = (id: string) => banco.competicoes.find((c) => c.id === id)!.participantes.fixos;

  it("tem as 92 equipes da Premier League e da EFL, sem repetir", () => {
    const todas = [
      "eng-premier-league",
      "eng-championship",
      "eng-league-one",
      "eng-league-two",
    ].flatMap(liga);
    expect(todas).toHaveLength(92);
    expect(new Set(todas).size).toBe(92);
    expect(liga("eng-premier-league")).toHaveLength(20);
  });

  it("2026/27: Coventry, Ipswich e Hull subiram; West Ham, Burnley e Wolves caíram", () => {
    for (const c of ["eng-coventry", "eng-ipswich", "eng-hull"])
      expect(liga("eng-premier-league")).toContain(c);
    for (const c of ["eng-west-ham", "eng-burnley", "eng-wolves"])
      expect(liga("eng-championship")).toContain(c);
  });

  it("clubes galeses jogam no sistema inglês com país País de Gales", () => {
    expect(liga("eng-championship")).toContain("wal-cardiff");
    expect(banco.clubes.find((c) => c.id === "wal-wrexham")?.pais).toBe("WAL");
  });
});

describe("Espanha", () => {
  const comp = (id: string) => banco.competicoes.find((c) => c.id === id)!;
  const liga = (id: string) => comp(id).participantes.fixos;

  it("tem LaLiga (20), LaLiga 2 (22) e Primera Federación (2 grupos de 20)", () => {
    expect(liga("esp-laliga")).toHaveLength(20);
    expect(liga("esp-laliga-2")).toHaveLength(22);
    expect(liga("esp-primera-federacion")).toHaveLength(40);
    expect(comp("esp-primera-federacion").fases[0]).toMatchObject({ grupos: 2 });
  });

  it("2026/27: Racing, Deportivo e Málaga subiram; Girona e Mallorca caíram", () => {
    for (const c of ["esp-racing-santander", "esp-deportivo", "esp-malaga"])
      expect(liga("esp-laliga")).toContain(c);
    for (const c of ["esp-girona", "esp-mallorca"]) expect(liga("esp-laliga-2")).toContain(c);
  });

  it("marca equipes B com o clube principal", () => {
    const castilla = banco.clubes.find((c) => c.id === "esp-real-madrid-castilla");
    expect(castilla?.filialDe).toBe("esp-real-madrid");
    expect(banco.clubes.filter((c) => c.pais === "ESP" && c.filialDe)).toHaveLength(7);
  });

  it("o rebaixamento e o acesso da Primera Federación contam por grupo", () => {
    expect(comp("esp-primera-federacion").movimentos.every((m) => m.porGrupo)).toBe(true);
  });
});

describe("Itália", () => {
  const liga = (id: string) => banco.competicoes.find((c) => c.id === id)!.participantes.fixos;

  it("tem Serie A (20), Serie B (20) e Serie C (3 grupos de 20)", () => {
    expect(liga("ita-serie-a")).toHaveLength(20);
    expect(liga("ita-serie-b")).toHaveLength(20);
    expect(liga("ita-serie-c")).toHaveLength(60);
  });

  it("2026/27: Venezia, Frosinone e Monza subiram; Cremonese, Verona e Pisa caíram", () => {
    for (const c of ["ita-venezia", "ita-frosinone", "ita-monza"])
      expect(liga("ita-serie-a")).toContain(c);
    for (const c of ["ita-cremonese", "ita-hellas-verona", "ita-pisa"])
      expect(liga("ita-serie-b")).toContain(c);
  });

  it("as três Under 23 jogam a Serie C, uma em cada grupo", () => {
    const serieC = liga("ita-serie-c");
    const posicoes = ["ita-juventus-next-gen", "ita-atalanta-u23", "ita-inter-u23"].map((c) =>
      Math.floor(serieC.indexOf(c) / 20),
    );
    expect(posicoes).toEqual([0, 1, 2]);
  });
});

describe("Alemanha", () => {
  const comp = (id: string) => banco.competicoes.find((c) => c.id === id)!;
  const liga = (id: string) => comp(id).participantes.fixos;

  it("tem Bundesliga (18), 2. Bundesliga (18) e 3. Liga (20)", () => {
    expect(liga("ger-bundesliga")).toHaveLength(18);
    expect(liga("ger-2-bundesliga")).toHaveLength(18);
    expect(liga("ger-3-liga")).toHaveLength(20);
  });

  it("2026/27: Schalke e Elversberg subiram; St. Pauli, Heidenheim e Wolfsburg caíram", () => {
    for (const c of ["ger-schalke", "ger-elversberg"]) expect(liga("ger-bundesliga")).toContain(c);
    for (const c of ["ger-st-pauli", "ger-heidenheim", "ger-wolfsburg"])
      expect(liga("ger-2-bundesliga")).toContain(c);
  });

  it("o 16º da Bundesliga disputa a repescagem com o 3º da 2. Bundesliga", () => {
    expect(comp("ger-bundesliga").movimentos).toContainEqual(
      expect.objectContaining({ tipo: "playoff-rebaixamento", posicoes: [16] }),
    );
    expect(comp("ger-2-bundesliga").movimentos).toContainEqual(
      expect.objectContaining({ tipo: "playoff-acesso", posicoes: [3] }),
    );
  });
});

describe("França", () => {
  const liga = (id: string) => banco.competicoes.find((c) => c.id === id)!.participantes.fixos;

  it("tem Ligue 1, Ligue 2 e Ligue 3 com 18 clubes cada", () => {
    for (const id of ["fra-ligue-1", "fra-ligue-2", "fra-ligue-3"])
      expect(liga(id)).toHaveLength(18);
  });

  it("2026/27: Troyes e Le Mans subiram; Metz e Nantes caíram", () => {
    for (const c of ["fra-troyes", "fra-le-mans"]) expect(liga("fra-ligue-1")).toContain(c);
    for (const c of ["fra-metz", "fra-nantes"]) expect(liga("fra-ligue-2")).toContain(c);
  });
});

describe("Europa (nível 1)", () => {
  it("todo clube europeu de liga joga exatamente uma divisão", () => {
    const ligas = banco.competicoes.filter(
      (c) =>
        c.tipo === "liga" &&
        ["ENG", "ESP", "ITA", "GER", "FRA"].includes((c.escopo as { pais: string }).pais),
    );
    const ids = ligas.flatMap((c) => c.participantes.fixos);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(92 + 82 + 100 + 56 + 54);
  });

  it("abreviações não se repetem dentro do mesmo país", () => {
    for (const pais of ["ENG", "ESP", "ITA", "GER", "FRA"]) {
      const abrevs = banco.clubes.filter((c) => c.pais === pais).map((c) => c.abreviacao);
      expect(new Set(abrevs).size, pais).toBe(abrevs.length);
    }
  });

  it("contratos europeus vencem em 30 de junho", () => {
    const j = banco.jogadores.find((x) => x.clube === "eng-arsenal" && x.contrato);
    expect(j?.contrato?.fim.slice(5)).toBe("06-30");
  });
});
