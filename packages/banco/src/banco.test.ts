import { CONFEDERACOES, elencoValido, validarIntegridade } from "@newbras/data";
import { gruposDeNomes, idadeEm } from "@newbras/engine";
import { describe, expect, it } from "vitest";
import { TOTAL_ICONES } from "./lendas/icones";
import { DATA_REFERENCIA, montarBanco } from "./montar";
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

describe("MLS e Saudi Pro League com jogadores reais", () => {
  const liga = (id: string) => banco.competicoes.find((c) => c.id === id)!.participantes.fixos;
  const jogador = (nome: string) => banco.jogadores.find((j) => j.nome === nome)!;

  it("MLS tem 30 clubes em duas conferências, 3 deles do Canadá", () => {
    const mls = liga("usa-mls");
    expect(mls).toHaveLength(30);
    expect(mls.filter((c) => c.startsWith("can-"))).toHaveLength(3);
  });

  it("Saudi Pro League tem 18 clubes e a First Division mais 18", () => {
    expect(liga("ksa-pro-league")).toHaveLength(18);
    expect(liga("ksa-first-division")).toHaveLength(18);
  });

  it("todo clube da MLS e da Saudi Pro League tem elenco real (com ao menos 2 goleiros)", () => {
    for (const clube of [...liga("usa-mls"), ...liga("ksa-pro-league")]) {
      const elenco = banco.jogadores.filter((j) => j.clube === clube && !j.base);
      expect(elenco.length, clube).toBeGreaterThanOrEqual(22);
      expect(elenco.filter((j) => j.posicao === "G").length, clube).toBeGreaterThanOrEqual(2);
      expect(elenco.some((j) => j.id.includes("-goleiro-gerado-")) || elenco.length > 22).toBe(
        true,
      );
    }
  });

  it("as lendas estão nos clubes certos, com a força do auge guardada para o renascimento", () => {
    const messi = jogador("Lionel Messi");
    expect(messi.clube).toBe("usa-inter-miami");
    expect(messi.forcaAuge).toBe(99);
    expect(messi.estrela).toBe(true);
    expect(jogador("Cristiano Ronaldo").clube).toBe("ksa-al-nassr");
    expect(jogador("Cristiano Ronaldo").forcaAuge).toBe(98);
    expect(jogador("Robert Lewandowski").clube).toBe("usa-chicago-fire");
    expect(jogador("Antoine Griezmann").clube).toBe("usa-orlando-city");
    expect(jogador("Thomas Müller").clube).toBe("can-vancouver-whitecaps");
  });

  it("veteranos estão em declínio: força atual bem abaixo do auge", () => {
    for (const nome of ["Lionel Messi", "Cristiano Ronaldo", "Luis Suárez", "Marco Reus"]) {
      const j = jogador(nome);
      expect(j.forcaAuge! - j.forca, nome).toBeGreaterThanOrEqual(10);
    }
  });

  it("dados que a fonte não trouxe ficam marcados para conferir", () => {
    const semData = banco.jogadores.filter((j) => j.aConferir.includes("nascimento"));
    expect(semData.length).toBeGreaterThan(1000);
    expect(jogador("Lionel Messi").aConferir).not.toContain("nascimento");
  });
});

describe("ícones na base", () => {
  const icones = banco.jogadores.filter((j) => j.id.startsWith("icone-"));

  it("Gareth Bale e os outros ícones começam na base, com 15 ou 16 anos e o potencial do auge", () => {
    expect(icones).toHaveLength(TOTAL_ICONES);
    const bale = icones.find((j) => j.nome === "Gareth Bale")!;
    expect(bale.base).toBe(true);
    expect(bale.nacionalidade).toBe("WAL");
    expect(bale.potencial).toBe(90);
    for (const j of icones) {
      const idade = idadeEm(j.nascimento, DATA_REFERENCIA);
      expect(idade, j.nome).toBeGreaterThanOrEqual(15);
      expect(idade, j.nome).toBeLessThanOrEqual(16);
      expect(j.forca, j.nome).toBeLessThan(j.potencial - 30);
      expect(j.contrato).toBeUndefined();
    }
  });

  it("o clube de cada ícone depende da semente do mundo", () => {
    const outro = montarBanco({ semente: "outra" }).jogadores.filter((j) =>
      j.id.startsWith("icone-"),
    );
    expect(outro.map((j) => j.clube)).not.toEqual(icones.map((j) => j.clube));
  });
});

describe("países europeus de nível 2", () => {
  const tamanhos: Record<string, readonly [string, number][]> = {
    POR: [
      ["por-liga-portugal", 18],
      ["por-liga-portugal-2", 18],
    ],
    NED: [
      ["ned-eredivisie", 18],
      ["ned-eerste-divisie", 20],
    ],
    BEL: [
      ["bel-pro-league", 18],
      ["bel-challenger-pro-league", 15],
    ],
    SCO: [
      ["sco-premiership", 12],
      ["sco-championship", 10],
    ],
    TUR: [
      ["tur-super-lig", 18],
      ["tur-1-lig", 20],
    ],
    AUT: [
      ["aut-bundesliga", 12],
      ["aut-2-liga", 16],
    ],
    SUI: [
      ["sui-super-league", 12],
      ["sui-challenge-league", 10],
    ],
    GRE: [
      ["gre-super-league", 14],
      ["gre-super-league-2", 16],
    ],
    DEN: [
      ["den-superliga", 12],
      ["den-1-division", 12],
    ],
    SWE: [
      ["swe-allsvenskan", 16],
      ["swe-superettan", 16],
    ],
  };

  it("cada país tem 1ª e 2ª divisão com o número real de clubes", () => {
    for (const [pais, ligas] of Object.entries(tamanhos)) {
      for (const [id, n] of ligas) {
        const c = banco.competicoes.find((x) => x.id === id);
        expect(c, id).toBeDefined();
        expect(c!.escopo).toEqual({ tipo: "pais", pais });
        expect(c!.participantes.fixos, id).toHaveLength(n);
      }
    }
  });

  it("o Vaduz, de Liechtenstein, joga a Super League suíça", () => {
    const vaduz = banco.clubes.find((c) => c.id === "lie-vaduz")!;
    expect(vaduz.pais).toBe("LIE");
    const sui = banco.competicoes.find((c) => c.id === "sui-super-league")!;
    expect(sui.participantes.fixos).toContain("lie-vaduz");
  });

  it("equipes B e sub-23 apontam para o clube principal", () => {
    const filial = (id: string) => banco.clubes.find((c) => c.id === id)!.filialDe;
    expect(filial("por-benfica-b")).toBe("por-benfica");
    expect(filial("ned-jong-ajax")).toBe("ned-ajax");
    expect(filial("bel-club-nxt")).toBe("bel-club-brugge");
    expect(filial("aut-liefering")).toBe("aut-salzburg");
    expect(filial("gre-paok-b")).toBe("gre-paok");
  });

  it("os grandes de cada país são os mais fortes da liga", () => {
    const nivel = (id: string) => banco.clubes.find((c) => c.id === id)!.nivel;
    for (const [grande, liga] of [
      ["por-sporting", "por-liga-portugal"],
      ["ned-psv", "ned-eredivisie"],
      ["tur-galatasaray", "tur-super-lig"],
      ["gre-olympiacos", "gre-super-league"],
    ] as const) {
      const outros = banco.competicoes
        .find((c) => c.id === liga)!
        .participantes.fixos.filter((id) => id !== grande);
      for (const outro of outros) expect(nivel(grande), outro).toBeGreaterThanOrEqual(nivel(outro));
    }
  });
});

describe("Américas: nível 2", () => {
  const liga = (id: string) => banco.competicoes.find((c) => c.id === id)!;

  it("cada país tem 1ª e 2ª divisão com o número real de clubes", () => {
    const tamanhos: [string, number][] = [
      ["arg-liga-profesional", 30],
      ["arg-primera-nacional", 36],
      ["uru-primera", 16],
      ["uru-segunda", 14],
      ["chi-primera", 16],
      ["chi-ascenso", 16],
      ["col-primera-a", 20],
      ["col-primera-b", 16],
      ["mex-liga-mx", 18],
      ["mex-liga-expansion", 16],
      ["usa-usl-championship", 25],
    ];
    for (const [id, n] of tamanhos) expect(liga(id).participantes.fixos, id).toHaveLength(n);
  });

  it("Argentina joga em duas zonas, com o último de cada zona rebaixado", () => {
    const lpf = liga("arg-liga-profesional");
    expect(lpf.fases[0]).toMatchObject({ tipo: "grupos", grupos: 2 });
    expect(lpf.movimentos).toEqual([
      expect.objectContaining({ tipo: "rebaixamento", posicoes: [15], porGrupo: true }),
    ]);
    expect(lpf.participantes.fixos).toContain("arg-boca-juniors");
    expect(lpf.participantes.fixos).toContain("arg-river-plate");
  });

  it("Liga MX e Liga de Expansión são fechadas", () => {
    expect(liga("mex-liga-mx").movimentos).toEqual([]);
    expect(liga("mex-liga-expansion").movimentos).toEqual([]);
  });

  it("a USL Championship fica abaixo da MLS, sem acesso, com o Loudoun ligado ao D.C. United", () => {
    expect(liga("usa-usl-championship").divisao).toBe(2);
    expect(liga("usa-usl-championship").movimentos).toEqual([]);
    expect(banco.clubes.find((c) => c.id === "usa-loudoun-united")!.filialDe).toBe("usa-dc-united");
  });
});

describe("Ásia: nível 2", () => {
  const liga = (id: string) => banco.competicoes.find((c) => c.id === id)!;

  it("Japão, Coreia do Sul e Catar têm 1ª e 2ª divisão com o número real de clubes", () => {
    const tamanhos: [string, number][] = [
      ["jpn-j1", 20],
      ["jpn-j2", 20],
      ["kor-k-league-1", 12],
      ["kor-k-league-2", 17],
      ["qat-stars-league", 12],
      ["qat-qsl-2", 12],
    ];
    for (const [id, n] of tamanhos) expect(liga(id).participantes.fixos, id).toHaveLength(n);
  });

  it("a J.League joga no calendário europeu desde 2026/27", () => {
    expect(liga("jpn-j1").calendario).toEqual({ inicio: "08-07", fim: "06-06" });
  });

  it("o Lusail estreia na Stars League e o Umm Salal joga a QSL 2", () => {
    expect(liga("qat-stars-league").participantes.fixos).toContain("qat-lusail");
    expect(liga("qat-qsl-2").participantes.fixos).toContain("qat-umm-salal");
  });
});

describe("nível 3: Américas", () => {
  const liga = (id: string) => banco.competicoes.find((c) => c.id === id)!;

  it("cada país tem a primeira divisão, sem acesso nem rebaixamento", () => {
    const tamanhos: [string, number][] = [
      ["par-primera", 12],
      ["per-liga-1", 18],
      ["bol-division-profesional", 16],
      ["ven-liga-futve", 14],
      ["ecu-ligapro", 16],
      ["can-cpl", 8],
      ["crc-liga-fpd", 10],
      ["hon-liga-nacional", 10],
      ["gua-liga-nacional", 12],
      ["slv-primera", 12],
      ["pan-lpf", 12],
    ];
    for (const [id, n] of tamanhos) {
      expect(liga(id).participantes.fixos, id).toHaveLength(n);
      expect(liga(id).divisao).toBe(1);
      expect(liga(id).movimentos, id).toEqual([]);
    }
  });

  it("os clubes canadenses da CPL convivem com os da MLS", () => {
    const can = banco.clubes.filter((c) => c.pais === "CAN");
    expect(can.length).toBe(11);
  });
});

describe("nível 3: UEFA", () => {
  const ligas = banco.competicoes.filter(
    (c) => c.divisao === 1 && c.escopo.tipo === "pais" && c.movimentos.length === 0,
  );

  it("38 países europeus ganham a primeira divisão", () => {
    const paises = [
      "ALB",
      "AND",
      "ARM",
      "AZE",
      "BLR",
      "BIH",
      "BUL",
      "CRO",
      "CYP",
      "CZE",
      "EST",
      "FIN",
      "GEO",
      "GIB",
      "HUN",
      "ISL",
      "ISR",
      "KAZ",
      "KVX",
      "LVA",
      "LTU",
      "LUX",
      "MLT",
      "MDA",
      "MNE",
      "MKD",
      "NIR",
      "NOR",
      "POL",
      "IRL",
      "ROU",
      "RUS",
      "SMR",
      "SRB",
      "SVK",
      "SVN",
      "UKR",
      "WAL",
    ];
    for (const pais of paises) {
      const liga = ligas.find((c) => c.escopo.tipo === "pais" && c.escopo.pais === pais);
      expect(liga, pais).toBeDefined();
      expect(liga!.participantes.fixos.length, pais).toBeGreaterThanOrEqual(8);
    }
  });

  it("estádios desconhecidos ficam marcados para conferir", () => {
    const semEstadio = banco.clubes.filter((c) => c.estadio.nome === `Estádio de ${c.cidade}`);
    expect(semEstadio.length).toBeGreaterThan(100);
    for (const c of semEstadio) expect(c.aConferir, c.id).toContain("estadio");
  });
});

describe("nível 3: AFC", () => {
  const ligaDe = (pais: string) =>
    banco.competicoes.find(
      (c) => c.divisao === 1 && c.escopo.tipo === "pais" && c.escopo.pais === pais,
    );

  it("39 países asiáticos ganham a primeira divisão", () => {
    const paises = [
      "AUS",
      "CHN",
      "IRN",
      "UAE",
      "UZB",
      "IRQ",
      "JOR",
      "OMA",
      "BHR",
      "KUW",
      "SYR",
      "LBN",
      "PLE",
      "YEM",
      "IND",
      "IDN",
      "THA",
      "VIE",
      "MAS",
      "SGP",
      "PHI",
      "MYA",
      "CAM",
      "LAO",
      "BRU",
      "TLS",
      "HKG",
      "MAC",
      "TPE",
      "PRK",
      "MNG",
      "KGZ",
      "TJK",
      "TKM",
      "AFG",
      "BAN",
      "NEP",
      "BHU",
      "MDV",
    ];
    for (const pais of paises) {
      const liga = ligaDe(pais);
      expect(liga, pais).toBeDefined();
      expect(liga!.participantes.fixos.length, pais).toBeGreaterThanOrEqual(8);
    }
  });

  it("clubes estrangeiros jogam na liga do país vizinho", () => {
    expect(ligaDe("AUS")!.participantes.fixos).toContain("nzl-auckland-fc");
    expect(ligaDe("MAS")!.participantes.fixos).toContain("bru-dpmm");
    expect(banco.clubes.find((c) => c.id === "bru-dpmm")?.pais).toBe("BRU");
  });
});

describe("nível 3: CAF", () => {
  it("53 países africanos ganham a primeira divisão", () => {
    const paises = [
      "ALG",
      "ANG",
      "BEN",
      "BOT",
      "BFA",
      "BDI",
      "CMR",
      "CPV",
      "CTA",
      "CHA",
      "CGO",
      "COD",
      "DJI",
      "EGY",
      "EQG",
      "ERI",
      "SWZ",
      "ETH",
      "GAB",
      "GAM",
      "GHA",
      "GUI",
      "GNB",
      "CIV",
      "KEN",
      "LES",
      "LBR",
      "LBY",
      "MAD",
      "MWI",
      "MLI",
      "MTN",
      "MRI",
      "MAR",
      "MOZ",
      "NAM",
      "NIG",
      "NGA",
      "RWA",
      "STP",
      "SEN",
      "SEY",
      "SLE",
      "SOM",
      "RSA",
      "SSD",
      "SDN",
      "TAN",
      "TOG",
      "TUN",
      "UGA",
      "ZAM",
      "ZIM",
    ];
    for (const pais of paises) {
      const liga = banco.competicoes.find(
        (c) => c.divisao === 1 && c.escopo.tipo === "pais" && c.escopo.pais === pais,
      );
      expect(liga, pais).toBeDefined();
      expect(liga!.participantes.fixos.length, pais).toBeGreaterThanOrEqual(8);
    }
  });
});

describe("nível 3: OFC, Caribe e Ilhas Faroé", () => {
  const ligasDe = (pais: string) =>
    banco.competicoes.filter(
      (c) => c.divisao === 1 && c.escopo.tipo === "pais" && c.escopo.pais === pais,
    );

  it("os últimos 38 países ganham a primeira divisão", () => {
    const paises = [
      "NZL",
      "FIJ",
      "NCL",
      "TAH",
      "PNG",
      "SAM",
      "ASA",
      "COK",
      "SOL",
      "TGA",
      "VAN",
      "JAM",
      "TRI",
      "HAI",
      "CUB",
      "DOM",
      "PUR",
      "SUR",
      "GUY",
      "CUW",
      "NCA",
      "BLZ",
      "ARU",
      "BAH",
      "BRB",
      "BER",
      "CAY",
      "ATG",
      "GRN",
      "LCA",
      "VIN",
      "DMA",
      "SKN",
      "AIA",
      "VGB",
      "TCA",
      "VIR",
      "FRO",
    ];
    for (const pais of paises) {
      const [liga] = ligasDe(pais);
      expect(liga, pais).toBeDefined();
      expect(liga!.participantes.fixos.length, pais).toBeGreaterThanOrEqual(6);
    }
  });

  it("a Nova Zelândia tem as três ligas regionais", () => {
    expect(ligasDe("NZL").map((c) => c.id)).toEqual([
      "nzl-northern-league",
      "nzl-central-league",
      "nzl-southern-league",
    ]);
  });
});

describe("jogadores reais: Série A 2026", () => {
  const serieA = banco.competicoes.find((c) => c.id === "bra-serie-a")!;

  it("os 20 clubes da Série A têm elenco real e jogável", () => {
    for (const clube of serieA.participantes.fixos) {
      const elenco = banco.jogadores.filter((j) => j.clube === clube);
      expect(elenco.length, clube).toBeGreaterThanOrEqual(30);
      expect(elenco.filter((j) => j.posicao === "G").length, clube).toBeGreaterThanOrEqual(2);
    }
    const flamengo = banco.jogadores.filter((j) => j.clube === "bra-flamengo").map((j) => j.nome);
    expect(flamengo).toContain("Giorgian De Arrascaeta");
  });

  it("as outras divisões seguem com elencos gerados", () => {
    const serieB = banco.competicoes.find((c) => c.id === "bra-serie-b")!;
    const clube = serieB.participantes.fixos[0]!;
    expect(banco.jogadores.filter((j) => j.clube === clube)).toHaveLength(25);
  });
});
