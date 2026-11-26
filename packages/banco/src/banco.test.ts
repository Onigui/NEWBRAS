import {
  atributosDaPosicao,
  CONFEDERACOES,
  elencoValido,
  BASE_MAXIMA,
  ELENCO_MAXIMO,
  FORCA_RECORDE,
  FORCA_TETO,
  forcaDosAtributos,
  validarIntegridade,
} from "@newbras/data";
import { datasDaCompeticao, gruposDeNomes, idadeEm, temporadaDe } from "@newbras/engine";
import { describe, expect, it } from "vitest";
import { TOTAL_ICONES } from "./lendas/icones";
import { NOTAVEIS } from "./reais/notaveis";
import { DATA_REFERENCIA, montarBanco } from "./montar";
import { PAISES } from "./mundo/paises";

const banco = montarBanco();
/** Jogadores gerados do clube (o clube pode ter recebido também quem sobrou em outro elenco). */
const geradosDe = (clube: string) =>
  banco.jogadores.filter((j) => j.clube === clube && j.id.startsWith(`${clube}-`));

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

describe("atributos", () => {
  it("todo jogador tem os atributos da posição e a força é a média ponderada deles", () => {
    for (const j of banco.jogadores) {
      expect(Object.keys(j.atributos)).toHaveLength(atributosDaPosicao(j.posicao).length);
      expect(j.forca).toBe(forcaDosAtributos(j.posicao, j.atributos));
    }
  });

  it("só o Cristiano Ronaldo chega a 99; Messi é o segundo, com 97, e ninguém mais passa de 97", () => {
    const nome = (n: string) => banco.jogadores.find((j) => j.nome === n);
    const cr7 = nome("Cristiano Ronaldo");
    const messi = nome("Lionel Messi");
    expect(cr7?.forcaAuge).toBe(FORCA_RECORDE);
    expect(messi?.forcaAuge).toBe(97);
    for (const j of banco.jogadores) {
      if (j === cr7) continue;
      expect(Math.max(j.forca, j.potencial, j.forcaAuge ?? 0), j.id).toBeLessThanOrEqual(
        FORCA_TETO,
      );
    }
    // O CR7 é mais completo: cabeceio e força física bem acima dos do Messi.
    expect(cr7?.atributos.cabeceio ?? 0).toBeGreaterThan(messi?.atributos.cabeceio ?? 0);
    expect(cr7?.caracteristicas).toEqual(["finalizacao", "cabeceio"]);
    expect(messi?.caracteristicas).toEqual(["drible", "finalizacao"]);
  });

  it("o potencial é o auge da carreira e não baixa com a idade", () => {
    const nome = (n: string) => banco.jogadores.find((j) => j.nome === n && j.forcaAuge)!;
    const neymar = nome("Neymar");
    expect(neymar.potencial).toBe(95);
    expect(neymar.forca).toBeLessThan(neymar.potencial);
    expect(neymar.estrela).toBe(true);
    expect(neymar.posicao).toBe("A");
    for (const n of ["Luka Modrić", "Thiago Silva", "Hulk", "Ángel Di María", "Kevin De Bruyne"])
      expect(nome(n).potencial, n).toBeGreaterThan(nome(n).forca);
    // Homônimo não herda o ajuste: o Luis Suárez do Sporting é colombiano e jovem.
    const suarezSporting = banco.jogadores.find(
      (j) => j.nome === "Luis Suárez" && j.clube === "por-sporting",
    );
    expect(suarezSporting?.forcaAuge).toBeUndefined();
  });

  it("os perfis do auge feitos à mão dão exatamente a força do auge", () => {
    for (const n of Object.values(NOTAVEIS))
      if (n.atributosAuge)
        expect(forcaDosAtributos(n.posicao ?? "A", n.atributosAuge)).toBe(n.forcaAuge);
  });

  it("uma parte pequena dos jogadores mostra só uma característica, como no Brasfoot", () => {
    const uma = banco.jogadores.filter((j) => j.caracteristicas.length === 1).length;
    const fracao = uma / banco.jogadores.length;
    expect(fracao).toBeGreaterThan(0.05);
    expect(fracao).toBeLessThan(0.25);
  });

  it("os destaques à mão aparecem: Bale é o mais rápido dos ícones, Roberto Carlos chuta de longe", () => {
    const icone = (id: string) => banco.jogadores.find((j) => j.id === id);
    const bale = icone("icone-gareth-bale");
    const rc = icone("icone-roberto-carlos");
    expect(bale?.caracteristicas[0]).toBe("velocidade");
    expect(rc?.caracteristicas).toContain("chuteLonge");
    const icones = banco.jogadores.filter((j) => j.id.startsWith("icone-") && j.posicao !== "G");
    const fracaoVelocidade = (j: (typeof icones)[number]) =>
      (j.atributos.velocidade ?? 0) / j.forca;
    const maisRapido = [...icones].sort((a, b) => fracaoVelocidade(b) - fracaoVelocidade(a))[0];
    expect(maisRapido?.id).toBe("icone-gareth-bale");
  });
});

describe("tamanho dos elencos", () => {
  it(`nenhum clube passa de ${ELENCO_MAXIMO} profissionais; a base fica separada`, () => {
    const profissionais = new Map<string, number>();
    const base = new Map<string, number>();
    for (const j of banco.jogadores) {
      if (!j.clube) continue;
      const mapa = j.base ? base : profissionais;
      mapa.set(j.clube, (mapa.get(j.clube) ?? 0) + 1);
    }
    for (const [clube, n] of profissionais) expect(n, clube).toBeLessThanOrEqual(ELENCO_MAXIMO);
    // Os ícones também começam na base; fora eles, cada clube tem até BASE_MAXIMA.
    const icones = banco.jogadores.filter((j) => j.id.startsWith("icone-"));
    for (const [clube, n] of base) {
      const iconesNoClube = icones.filter((j) => j.clube === clube).length;
      expect(n - iconesNoClube, clube).toBeLessThanOrEqual(BASE_MAXIMA);
    }
    expect(profissionais.get("bra-vasco")).toBe(ELENCO_MAXIMO);
    expect(base.get("bra-vasco") ?? 0).toBeGreaterThan(0);
  });

  it("quem saiu dos elencos grandes foi para clubes do mesmo país", () => {
    const clubePorId = new Map(banco.clubes.map((c) => [c.id, c]));
    const transferidos = banco.jogadores.filter(
      (j) => j.clube && !j.id.startsWith(`${j.clube}-`) && !j.id.startsWith("icone-"),
    );
    expect(transferidos.length).toBeGreaterThan(50);
    for (const j of transferidos) {
      const origem = banco.clubes.find((c) => j.id.startsWith(`${c.id}-`));
      if (origem) expect(clubePorId.get(j.clube!)?.pais, j.id).toBe(origem.pais);
    }
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
    expect(messi.forcaAuge).toBe(97);
    expect(messi.estrela).toBe(true);
    expect(jogador("Cristiano Ronaldo").clube).toBe("ksa-al-nassr");
    expect(jogador("Cristiano Ronaldo").forcaAuge).toBe(99);
    expect(jogador("Robert Lewandowski").clube).toBe("usa-chicago-fire");
    expect(jogador("Antoine Griezmann").clube).toBe("usa-orlando-city");
    expect(jogador("Thomas Müller").clube).toBe("can-vancouver-whitecaps");
  });

  it("veteranos estão em declínio: força atual bem abaixo do auge", () => {
    for (const nome of ["Lionel Messi", "Cristiano Ronaldo", "Luis Suárez", "Marco Reus"]) {
      // O Luis Suárez colombiano do Sporting é homônimo e não tem auge guardado.
      const j = banco.jogadores.find((x) => x.nome === nome && x.forcaAuge !== undefined)!;
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
    expect(geradosDe(clube)).toHaveLength(25);
  });
});

describe("jogadores reais: Premier League 2026/27", () => {
  const premier = banco.competicoes.find((c) => c.id === "eng-premier-league")!;

  it("os 20 clubes da Premier League têm elenco real e jogável", () => {
    expect(premier.participantes.fixos).toHaveLength(20);
    for (const clube of premier.participantes.fixos) {
      const elenco = banco.jogadores.filter((j) => j.clube === clube);
      expect(elenco.length, clube).toBeGreaterThanOrEqual(21);
      expect(elenco.filter((j) => j.posicao === "G").length, clube).toBeGreaterThanOrEqual(2);
    }
    const liverpool = banco.jogadores.filter((j) => j.clube === "eng-liverpool").map((j) => j.nome);
    expect(liverpool).toContain("Virgil van Dijk");
    const city = banco.jogadores.find((j) => j.nome === "Erling Haaland")!;
    expect(city.clube).toBe("eng-manchester-city");
    expect(city.nacionalidade).toBe("NOR");
  });

  it("a Championship segue com elencos gerados", () => {
    const championship = banco.competicoes.find((c) => c.id === "eng-championship")!;
    const clube = championship.participantes.fixos[0]!;
    expect(geradosDe(clube)).toHaveLength(25);
  });
});

describe("jogadores reais: LaLiga 2026/27", () => {
  const laliga = banco.competicoes.find((c) => c.id === "esp-laliga")!;

  it("os 20 clubes da LaLiga têm elenco real e jogável", () => {
    expect(laliga.participantes.fixos).toHaveLength(20);
    for (const clube of laliga.participantes.fixos) {
      const elenco = banco.jogadores.filter((j) => j.clube === clube);
      expect(elenco.length, clube).toBeGreaterThanOrEqual(23);
      expect(elenco.filter((j) => j.posicao === "G").length, clube).toBeGreaterThanOrEqual(2);
    }
    const barca = banco.jogadores.filter((j) => j.clube === "esp-barcelona").map((j) => j.nome);
    expect(barca).toContain("Lamine Yamal");
    const mbappe = banco.jogadores.find((j) => j.nome === "Kylian Mbappé")!;
    expect(mbappe.clube).toBe("esp-real-madrid");
    expect(mbappe.nacionalidade).toBe("FRA");
  });

  it("a LaLiga 2 segue com elencos gerados", () => {
    const segunda = banco.competicoes.find((c) => c.id === "esp-laliga-2")!;
    const clube = segunda.participantes.fixos[0]!;
    expect(geradosDe(clube)).toHaveLength(25);
  });
});

describe("jogadores reais: Serie A 2026/27", () => {
  const serieA = banco.competicoes.find((c) => c.id === "ita-serie-a")!;

  it("os 20 clubes da Serie A italiana têm elenco real e jogável", () => {
    expect(serieA.participantes.fixos).toHaveLength(20);
    for (const clube of serieA.participantes.fixos) {
      const elenco = banco.jogadores.filter((j) => j.clube === clube);
      expect(elenco.length, clube).toBeGreaterThanOrEqual(25);
      expect(elenco.filter((j) => j.posicao === "G").length, clube).toBeGreaterThanOrEqual(2);
    }
    const inter = banco.jogadores.filter((j) => j.clube === "ita-inter").map((j) => j.nome);
    expect(inter).toContain("Lautaro Martínez");
    const debruyne = banco.jogadores.find((j) => j.nome === "Kevin De Bruyne")!;
    expect(debruyne.clube).toBe("ita-napoli");
    expect(debruyne.nacionalidade).toBe("BEL");
  });

  it("a Serie B segue com elencos gerados", () => {
    const serieB = banco.competicoes.find((c) => c.id === "ita-serie-b")!;
    const clube = serieB.participantes.fixos[0]!;
    expect(geradosDe(clube)).toHaveLength(25);
  });
});

describe("jogadores reais: Bundesliga 2026/27", () => {
  const bundesliga = banco.competicoes.find((c) => c.id === "ger-bundesliga")!;
  it("os 18 clubes da Bundesliga têm elenco real e jogável", () => {
    expect(bundesliga.participantes.fixos).toHaveLength(18);
    for (const clube of bundesliga.participantes.fixos) {
      const elenco = banco.jogadores.filter((j) => j.clube === clube);
      expect(elenco.length, clube).toBeGreaterThanOrEqual(22);
      expect(elenco.filter((j) => j.posicao === "G").length, clube).toBeGreaterThanOrEqual(2);
    }
    const bayern = banco.jogadores.filter((j) => j.clube === "ger-bayern").map((j) => j.nome);
    expect(bayern).toContain("Jamal Musiala");
    const kane = banco.jogadores.find((j) => j.nome === "Harry Kane")!;
    expect(kane.clube).toBe("ger-bayern");
    expect(kane.nacionalidade).toBe("ENG");
  });
  it("a 2. Bundesliga segue com elencos gerados", () => {
    const segunda = banco.competicoes.find((c) => c.id === "ger-2-bundesliga")!;
    const clube = segunda.participantes.fixos[0]!;
    expect(geradosDe(clube)).toHaveLength(25);
  });
});

describe("jogadores reais: Ligue 1 2026/27", () => {
  const ligue1 = banco.competicoes.find((c) => c.id === "fra-ligue-1")!;
  it("os 18 clubes da Ligue 1 têm elenco real e jogável", () => {
    expect(ligue1.participantes.fixos).toHaveLength(18);
    for (const clube of ligue1.participantes.fixos) {
      const elenco = banco.jogadores.filter((j) => j.clube === clube);
      expect(elenco.length, clube).toBeGreaterThanOrEqual(21);
      expect(elenco.filter((j) => j.posicao === "G").length, clube).toBeGreaterThanOrEqual(2);
    }
    const psg = banco.jogadores.filter((j) => j.clube === "fra-psg").map((j) => j.nome);
    expect(psg).toContain("Ousmane Dembélé");
    const kvara = banco.jogadores.find((j) => j.nome === "Khvicha Kvaratskhelia")!;
    expect(kvara.clube).toBe("fra-psg");
    expect(kvara.nacionalidade).toBe("GEO");
  });
  it("sem país na fonte, o jogador fica com o país do clube e a conferir", () => {
    const mesloub = banco.jogadores.find((j) => j.nome === "Mezian Mesloub")!;
    expect(mesloub.nacionalidade).toBe("FRA");
    expect(mesloub.aConferir).toContain("nacionalidade");
  });
  it("a Ligue 2 segue com elencos gerados", () => {
    const ligue2 = banco.competicoes.find((c) => c.id === "fra-ligue-2")!;
    const clube = ligue2.participantes.fixos[0]!;
    expect(geradosDe(clube)).toHaveLength(25);
  });
});

describe("jogadores reais: ligas de nível 2", () => {
  const LIGAS = [
    "por-liga-portugal",
    "ned-eredivisie",
    "bel-pro-league",
    "sco-premiership",
    "tur-super-lig",
    "aut-bundesliga",
    "sui-super-league",
    "gre-super-league",
    "den-superliga",
    "swe-allsvenskan",
    "arg-liga-profesional",
    "chi-primera",
    "col-primera-a",
    "mex-liga-mx",
    "jpn-j1",
    "kor-k-league-1",
    "qat-stars-league",
  ];
  const MINIMO_ELENCO = 18;
  it.each(LIGAS)("%s: todos os clubes têm elenco real e jogável", (id) => {
    const liga = banco.competicoes.find((c) => c.id === id)!;
    for (const clube of liga.participantes.fixos) {
      const elenco = banco.jogadores.filter((j) => j.clube === clube);
      expect(elenco.length, clube).toBeGreaterThanOrEqual(MINIMO_ELENCO);
      expect(elenco.filter((j) => j.posicao === "G").length, clube).toBeGreaterThanOrEqual(2);
    }
  });
  it("craques nos clubes certos", () => {
    const clube = (nome: string) => banco.jogadores.find((j) => j.nome === nome)?.clube;
    expect(clube("Diogo Costa")).toBe("por-porto");
    expect(clube("Vangelis Pavlidis")).toBe("por-benfica");
  });
  it("as segundas divisões seguem com elencos gerados", () => {
    for (const id of ["por-liga-portugal-2", "arg-primera-nacional", "jpn-j2"]) {
      const clube = banco.competicoes.find((c) => c.id === id)!.participantes.fixos[0]!;
      expect(geradosDe(clube)).toHaveLength(25);
    }
  });
});

describe("copas nacionais e supercopas", () => {
  const copas = banco.competicoes.filter((c) => c.tipo === "copa");
  const supercopas = banco.competicoes.filter((c) => c.tipo === "supercopa");
  const regionais = banco.competicoes.filter((c) => c.tipo === "regional");
  const competicao = (id: string) => banco.competicoes.find((c) => c.id === id);
  const paisDe = (c: (typeof banco.competicoes)[number]) =>
    c.escopo.tipo === "pais" || c.escopo.tipo === "estado" ? c.escopo.pais : undefined;

  it("todo país de nível 1 e 2 tem copa nacional, e os de nível 1 têm supercopa", () => {
    for (const p of PAISES.filter((p) => p.nivel === 1 || p.nivel === 2))
      expect(
        copas.some((c) => paisDe(c) === p.codigo),
        p.codigo,
      ).toBe(true);
    for (const p of PAISES.filter((p) => p.nivel === 1))
      expect(
        supercopas.some((c) => paisDe(c) === p.codigo),
        p.codigo,
      ).toBe(true);
    expect(copas.filter((c) => paisDe(c) === "ENG").map((c) => c.id)).toEqual([
      "eng-fa-cup",
      "eng-league-cup",
    ]);
  });

  it("as vagas vêm de competições do mesmo país, com posições que existem", () => {
    for (const c of [...copas, ...supercopas, ...regionais]) {
      expect(c.participantes.fixos, c.id).toEqual([]);
      let total = 0;
      // Vagas da primeira fase e as das fases adiante (Copa do Brasil: Série A na 5ª fase).
      const vagas = [...c.participantes.vagas, ...c.fases.flatMap((f) => f.entramAqui)];
      for (const v of vagas) {
        const origem = competicao(v.de);
        expect(origem, `${c.id} → ${v.de}`).toBeDefined();
        expect(paisDe(origem!), c.id).toBe(paisDe(c));
        if (v.criterio === "posicoes") {
          expect(Math.max(...(v.posicoes ?? [])), c.id).toBeLessThanOrEqual(
            origem!.participantes.fixos.length,
          );
          total += v.posicoes?.length ?? 0;
          // Campeão e vice de uma liga que já entra pelas posições (os da Supercopa na Copa del Rey)
          // ou da própria copa não somam clubes novos.
        } else if (v.de !== c.id && !vagas.some((o) => o.criterio === "posicoes" && o.de === v.de))
          total += 1;
      }
      expect(total, c.id).toBe(c.participantes.quantidade);
    }
  });

  it("copas têm uma fase por eliminatória até a final", () => {
    // As de formato real (Copa do Brasil e as principais da Europa) têm a janela de cada fase.
    for (const c of copas.filter((x) => !x.fases.some((f) => f.periodo))) {
      const n = c.participantes.quantidade;
      expect(c.fases, c.id).toHaveLength(Math.ceil(Math.log2(n)));
      expect(c.fases.at(-1)?.nome, c.id).toBe("Final");
      expect(c.fases.every((f) => f.tipo === "mata-mata")).toBe(true);
    }
    // Copa do Brasil de 2026: 126 clubes, 28 na 1ª fase, 74 na 2ª, 4 na 3ª e a Série A na 5ª.
    const copaDoBrasil = competicao("bra-copa-do-brasil")!;
    expect(copaDoBrasil.participantes.quantidade).toBe(126);
    const conta = (vs: readonly { posicoes?: number[] | undefined }[]) =>
      vs.reduce((s, v) => s + (v.posicoes?.length ?? 1), 0);
    expect(conta(copaDoBrasil.participantes.vagas)).toBe(28);
    expect(copaDoBrasil.fases.map((f) => conta(f.entramAqui))).toEqual([
      0, 74, 4, 0, 20, 0, 0, 0, 0,
    ]);
    const jogos = (f: (typeof copaDoBrasil.fases)[number]) =>
      f.tipo === "mata-mata" ? f.jogos : 0;
    expect(copaDoBrasil.fases.map(jogos)).toEqual([1, 1, 1, 1, 2, 2, 2, 2, 1]);
    const final = competicao("eng-fa-cup")!.fases.at(-1);
    expect(final?.tipo === "mata-mata" && final.mando).toBe("neutro");
  });

  it("copas da Europa no formato real: cada divisão entra na rodada dela", () => {
    const conta = (vs: readonly { posicoes?: number[] | undefined }[]) =>
      vs.reduce((s, v) => s + (v.posicoes?.length ?? 1), 0);
    const entradas = (id: string) => {
      const c = competicao(id)!;
      return [conta(c.participantes.vagas), ...c.fases.slice(1).map((f) => conta(f.entramAqui))];
    };
    const mm = (id: string, fase: string) => {
      const f = competicao(id)!.fases.find((x) => x.id === fase);
      return f?.tipo === "mata-mata" ? f : undefined;
    };
    // EFL Cup: 4 na preliminar, 68 na 1ª fase, 11 da Premier League na 2ª e 9 na 3ª.
    expect(entradas("eng-league-cup")).toEqual([4, 68, 11, 9, 0, 0, 0, 0]);
    // FA Cup: League One e Two na 1ª fase (80 lugares), Premier League e Championship na 3ª.
    expect(entradas("eng-fa-cup")).toEqual([48, 0, 44, 0, 0, 0, 0, 0]);
    expect(mm("eng-fa-cup", "1-fase")?.lugares).toBe(80);
    // Copa del Rey: 112 lugares na 1ª eliminatória; os quatro da Supercopa nos 16 avos.
    expect(mm("esp-copa-del-rey", "1-eliminatoria")?.lugares).toBe(112);
    expect(entradas("esp-copa-del-rey")).toEqual([82, 0, 4, 0, 0, 0, 0]);
    expect(mm("esp-copa-del-rey", "1-eliminatoria")?.mando).toBe("menor-divisao");
    // Coppa Italia: 8 na preliminar, 28 na 1ª fase, os 8 primeiros da Serie A nas oitavas.
    expect(entradas("ita-coppa-italia")).toEqual([8, 28, 0, 8, 0, 0, 0]);
    // DFB-Pokal e Coupe de France: 64 lugares; mando dos amadores e de dois níveis abaixo.
    expect(mm("ger-dfb-pokal", "1-rodada")?.menorDivisao?.aPartirDe).toBe(3);
    expect(mm("fra-coupe-de-france", "32-avos")?.menorDivisao?.diferenca).toBe(2);
    // Coupe de France: pênaltis direto até a semifinal; prorrogação só na final.
    expect(mm("fra-coupe-de-france", "semifinal")?.prorrogacao).toBe(false);
    expect(mm("fra-coupe-de-france", "final")?.prorrogacao).toBe(true);
    // Taça de Portugal e KNVB Beker: os das copas europeias só na rodada seguinte.
    expect(entradas("por-taca-de-portugal")).toEqual([30, 6, 0, 0, 0, 0]);
    expect(entradas("ned-knvb-beker")).toEqual([32, 6, 0, 0, 0, 0]);
    for (const id of ["eng-fa-cup", "esp-copa-del-rey", "ger-dfb-pokal", "ned-knvb-beker"])
      expect(competicao(id)!.fases.at(-1)?.nome, id).toBe("Final");
  });

  it("a temporada de cada país contém todas as competições dele", () => {
    const pais = new Map(banco.paises.map((p) => [p.codigo, p]));
    for (const c of banco.competicoes) {
      const codigo = c.escopo.tipo === "pais" || c.escopo.tipo === "estado" ? c.escopo.pais : null;
      const p = codigo ? pais.get(codigo) : undefined;
      if (!p) continue;
      const t = temporadaDe(p, "2026-06-15");
      const d = datasDaCompeticao(c.calendario, t.inicio);
      expect(d.fim <= t.fim, `${c.id}: ${d.inicio}..${d.fim} fora de ${t.inicio}..${t.fim}`).toBe(
        true,
      );
    }
  });
});

describe("seleções", () => {
  const competicao = (id: string) => banco.competicoes.find((c) => c.id === id);
  it("Nations League 2026/27: as 54 seleções da UEFA (sem a Rússia) nos grupos do sorteio", () => {
    const ligas = ["a", "b", "c", "d"].map((l) => competicao(`uefa-nations-league-${l}`)!);
    const todas = ligas.flatMap((c) => c.participantes.fixos);
    expect(todas).toHaveLength(54);
    expect(new Set(todas).size).toBe(54);
    const uefa = banco.paises.filter((p) => p.confederacao === "UEFA").map((p) => p.codigo);
    expect(todas.every((x) => uefa.includes(x))).toBe(true);
    expect(todas).not.toContain("RUS");
    expect(ligas[0]!.participantes.fixos.slice(8, 12)).toEqual(["ESP", "CRO", "ENG", "CZE"]);
    expect(ligas.map((c) => c.fases[0]?.tipo === "grupos" && c.fases[0].grupos)).toEqual([
      4, 4, 4, 2,
    ]);
    // Só a Liga A tem quartas (ida e volta) e a fase final.
    expect(ligas[0]!.fases.map((f) => f.id)).toEqual([
      "fase-de-liga",
      "quartas",
      "semifinal",
      "final",
    ]);
    for (const c of ligas) expect(c.fases[0]?.datas).toHaveLength(6);
  });

  it("Euro 2028: eliminatórias pela Nations League, 24 na fase final", () => {
    const elim = competicao("uefa-eliminatorias-euro")!;
    const euro = competicao("uefa-euro")!;
    // As 54 da Nations League entram nos 12 grupos; dez rodadas nas datas FIFA de 2027.
    const entram = elim.fases[0]!.entramAqui.reduce((s, v) => s + (v.quantidade ?? 0), 0);
    expect(entram).toBe(54);
    expect(elim.fases[0]?.datas).toHaveLength(10);
    expect(elim.anos).toBe(2);
    // 12 primeiros + 8 melhores segundos + 2 anfitriões + 2 dos playoffs = 24.
    expect(
      elim.classificados.map((r) => r.melhores ?? r.quantidade ?? (r.vencedores ? 2 : 12)),
    ).toEqual([12, 8, 2, 2]);
    expect(euro.participantes.quantidade).toBe(24);
    expect(euro.fases.map((f) => f.id)).toEqual([
      "grupos",
      "oitavas",
      "quartas",
      "semifinal",
      "final",
    ]);
    expect(euro.campeaoAnterior?.campeao).toBe("ESP");
  });
});

describe("copas regionais", () => {
  const estadoDe = (id: string) => {
    const c = banco.competicoes.find((x) => x.id === id);
    return c?.escopo.tipo === "estado" ? c.escopo.estado : undefined;
  };
  const estados = (id: string) =>
    banco.competicoes.find((c) => c.id === id)!.participantes.vagas.map((v) => estadoDe(v.de));

  it("Copa do Nordeste: 16 clubes dos 9 estados do Nordeste, grupos e mata-mata", () => {
    const c = banco.competicoes.find((x) => x.id === "bra-copa-do-nordeste")!;
    expect(c.participantes.quantidade).toBe(16);
    expect(new Set(estados(c.id))).toEqual(
      new Set(["BA", "CE", "PE", "AL", "RN", "PB", "SE", "MA", "PI"]),
    );
    expect(c.fases.map((f) => f.tipo)).toEqual(["grupos", "mata-mata", "mata-mata", "mata-mata"]);
  });

  it("Copa Verde: 16 clubes do Norte, do Centro-Oeste e do Espírito Santo em mata-mata", () => {
    const c = banco.competicoes.find((x) => x.id === "bra-copa-verde")!;
    expect(c.participantes.quantidade).toBe(16);
    expect(estados(c.id)).toContain("ES");
    expect(estados(c.id)).not.toContain("SP");
    expect(c.fases).toHaveLength(4);
  });
});

describe("copas continentais", () => {
  const continentais = banco.competicoes.filter((c) => c.tipo === "continental");
  const competicao = (id: string) => banco.competicoes.find((c) => c.id === id);
  const confDoPais = new Map(banco.paises.map((p) => [p.codigo, p.confederacao]));

  it("as seis confederações têm a sua, e CONMEBOL e UEFA têm a segunda e a terceira", () => {
    const conf = (c: (typeof continentais)[number]) =>
      c.escopo.tipo === "confederacao" ? c.escopo.confederacao : "";
    expect(new Set(continentais.map(conf))).toEqual(
      new Set(["CONMEBOL", "UEFA", "CONCACAF", "AFC", "CAF", "OFC"]),
    );
    expect(competicao("conmebol-sul-americana")?.participantes.exclui).toEqual([
      "conmebol-libertadores",
    ]);
    expect(competicao("uefa-conference-league")?.participantes.exclui).toHaveLength(2);
  });

  it("as vagas vêm de ligas e copas da própria confederação, com posições que existem", () => {
    for (const c of continentais) {
      const conf = c.escopo.tipo === "confederacao" ? c.escopo.confederacao : "";
      let total = 0;
      const vagas = [
        ...c.participantes.vagas,
        // Vagas das fases adiante, menos as da própria tabela (os primeiros dos grupos etc.).
        ...c.fases.flatMap((f) =>
          f.entramAqui.filter((v) => !(v.de === c.id && v.criterio === "posicoes")),
        ),
      ];
      for (const v of vagas) {
        const origem = competicao(v.de);
        expect(origem, `${c.id} → ${v.de}`).toBeDefined();
        if (origem!.escopo.tipo === "confederacao") {
          expect(origem!.escopo.confederacao).toBe(conf);
          total += v.quantidade ?? v.posicoes?.length ?? 1;
          continue;
        }
        const pais = origem!.escopo.tipo === "pais" ? origem!.escopo.pais : "";
        expect(confDoPais.get(pais), `${c.id} → ${v.de}`).toBe(conf);
        if (v.criterio === "posicoes") {
          expect(Math.max(...(v.posicoes ?? []))).toBeLessThanOrEqual(
            origem!.participantes.fixos.length,
          );
          total += v.posicoes?.length ?? 0;
        } else total += 1;
      }
      expect(total, c.id).toBe(c.participantes.quantidade);
    }
  });

  it("Libertadores e Champions no formato atual", () => {
    const liberta = competicao("conmebol-libertadores")!;
    expect(liberta.participantes.quantidade).toBe(47);
    expect(liberta.fases.map((f) => f.id)).toEqual([
      "fase-1",
      "fase-2",
      "fase-3",
      "grupos",
      "mata-mata",
    ]);
    expect(liberta.fases[3]?.entramAqui.reduce((s, v) => s + (v.posicoes?.length ?? 1), 0)).toBe(
      28,
    );
    expect(liberta.fases[1]?.entramAqui.reduce((s, v) => s + (v.posicoes?.length ?? 1), 0)).toBe(
      13,
    );
    const sula = competicao("conmebol-sul-americana")!;
    expect(sula.participantes.quantidade).toBe(56);
    const ucl = competicao("uefa-champions-league")!;
    expect(ucl.fases.filter((f) => f.tipo === "fase-de-liga")).toHaveLength(1);
  });
});

describe("UEFA 2026/27 pela lista de acesso", () => {
  const comp = (id: string) => banco.competicoes.find((c) => c.id === id)!;
  const conta = (vagas: { posicoes?: number[] | undefined; quantidade?: number | undefined }[]) =>
    vagas.reduce((s, v) => s + (v.quantidade ?? v.posicoes?.length ?? 1), 0);

  it("Champions: 28 na 1ª qualificatória, 29 direto na fase de liga, 81 no total", () => {
    const ucl = comp("uefa-champions-league");
    expect(conta(ucl.participantes.vagas)).toBe(28);
    expect(ucl.fases.map((f) => f.id)).toEqual([
      "q1",
      "q2",
      "q3",
      "rodada-playoff",
      "fase-de-liga",
      "playoff",
      "mata-mata",
    ]);
    expect(conta(ucl.fases[4]!.entramAqui)).toBe(29);
    expect(ucl.participantes.quantidade).toBe(81);
    // Inglaterra e Espanha com 5 (vagas de desempenho europeu).
    const doPais = (liga: string) =>
      ucl.fases[4]!.entramAqui.find((v) => v.de === liga)?.posicoes?.length;
    expect(doPais("eng-premier-league")).toBe(5);
    expect(doPais("esp-laliga")).toBe(5);
    expect(doPais("ita-serie-a")).toBe(4);
  });

  it("Europa League e Conference League recebem os eliminados de cima em cada rodada", () => {
    const uel = comp("uefa-europa-league");
    const uecl = comp("uefa-conference-league");
    expect(uel.participantes.exclui).toEqual(["uefa-champions-league"]);
    expect(uecl.participantes.exclui).toEqual(["uefa-champions-league", "uefa-europa-league"]);
    const eliminados = (c: typeof uel) =>
      c.fases.flatMap((f) => f.entramAqui.filter((v) => v.criterio === "eliminados"));
    expect(conta(eliminados(uel))).toBe(12 + 2 + 6 + 7 + 4);
    expect(conta(eliminados(uecl))).toBe(14 + 6 + 9 + 6 + 7 + 12);
    expect(conta(uecl.participantes.vagas)).toBe(52);
    expect(uecl.fases[4]).toMatchObject({ tipo: "fase-de-liga", jogosPorTime: 6, potes: 6 });
  });
});

describe("CONCACAF, AFC, CAF e OFC no formato real", () => {
  const comp = (id: string) => banco.competicoes.find((c) => c.id === id)!;
  const conta = (vagas: { posicoes?: number[] | undefined; quantidade?: number | undefined }[]) =>
    vagas.reduce((s, v) => s + (v.quantidade ?? v.posicoes?.length ?? 1), 0);

  it("Copa dos Campeões: 22 na 1ª fase e 5 direto às oitavas, com as copas que dão vaga", () => {
    const cc = comp("concacaf-champions-cup");
    expect(conta(cc.participantes.vagas)).toBe(22);
    expect(conta(cc.fases[1]!.entramAqui)).toBe(5);
    for (const id of [
      "concacaf-leagues-cup",
      "concacaf-copa-centro-americana",
      "concacaf-copa-do-caribe",
    ])
      expect(cc.fases[1]!.entramAqui.some((v) => v.de === id && v.criterio === "campeao")).toBe(
        true,
      );
  });

  it("Champions da Ásia: preliminar e fase de liga com 16 no Oeste e 16 no Leste", () => {
    const elite = comp("afc-champions-league");
    const liga = elite.fases.find((f) => f.tipo === "fase-de-liga")!;
    expect(liga).toMatchObject({ grupos: 2, jogosPorTime: 8, classificamDireto: 8 });
    const regiao = (r: string) => [
      ...elite.participantes.vagas.filter((v) => v.caminho === r),
      ...liga.entramAqui.filter((v) => v.caminho === r),
    ];
    // 14 direto e 4 na preliminar (2 passam) em cada região.
    expect(conta(regiao("oeste"))).toBe(18);
    expect(conta(regiao("leste"))).toBe(18);
    const two = comp("afc-champions-league-two");
    expect(two.participantes.exclui).toEqual(["afc-champions-league"]);
    expect(two.fases[1]!.entramAqui.filter((v) => v.criterio === "eliminados")).toHaveLength(2);
  });

  it("CAF: 61 e 56 clubes, com 3 e 8 direto na 2ª fase preliminar", () => {
    const cl = comp("caf-champions-league");
    const cc = comp("caf-confederation-cup");
    expect(cl.participantes.quantidade).toBe(61);
    expect(conta(cl.fases[1]!.entramAqui)).toBe(3);
    expect(cc.participantes.quantidade).toBe(56);
    expect(conta(cc.fases[1]!.entramAqui)).toBe(8);
    expect(cc.participantes.exclui).toEqual(["caf-champions-league"]);
  });

  it("OFC: qualificatória de 4 e fase final com dois grupos de 4", () => {
    const ofc = comp("ofc-champions-league");
    expect(conta(ofc.participantes.vagas)).toBe(4);
    expect(ofc.fases[1]).toMatchObject({ tipo: "grupos", grupos: 2 });
    expect(conta(ofc.fases[1]!.entramAqui)).toBe(7);
  });
});

describe("supercopas continentais e competições mundiais", () => {
  const comp = (id: string) => banco.competicoes.find((c) => c.id === id)!;

  it("Recopa, Supercopa da UEFA e da CAF juntam os dois campeões continentais", () => {
    for (const [id, de] of [
      ["conmebol-recopa", ["conmebol-libertadores", "conmebol-sul-americana"]],
      ["uefa-supercopa", ["uefa-champions-league", "uefa-europa-league"]],
      ["caf-supercopa", ["caf-champions-league", "caf-confederation-cup"]],
    ] as const) {
      const c = comp(id);
      expect(c.tipo).toBe("supercopa");
      expect(c.participantes.vagas.map((v) => [v.de, v.criterio])).toEqual(
        de.map((d) => [d, "campeao"]),
      );
    }
    expect(comp("conmebol-recopa").fases[0]).toMatchObject({ jogos: 2, prorrogacao: true });
    expect(comp("uefa-supercopa").fases[0]).toMatchObject({ jogos: 1, mando: "neutro" });
  });

  it("Intercontinental: os seis campeões entram cada um na sua fase, o da Champions só na final", () => {
    const ic = comp("fifa-intercontinental");
    expect(ic.escopo.tipo).toBe("mundial");
    const entram = ic.fases.map((f) => f.entramAqui.map((v) => v.de));
    expect(entram).toEqual([
      ["afc-champions-league", "ofc-champions-league"],
      ["caf-champions-league"],
      ["concacaf-champions-cup", "conmebol-libertadores"],
      ["uefa-champions-league"],
    ]);
    // A vaga aponta para a última fase da origem (entra quando a final acontece).
    for (const v of ic.fases.flatMap((f) => f.entramAqui))
      expect(v.fase).toBe(comp(v.de).fases.at(-1)!.id);
  });

  it("Mundial de Clubes a cada 4 anos, com 32 vagas na divisão da FIFA", () => {
    const m = comp("fifa-mundial-de-clubes");
    expect(m.periodicidade).toEqual({ aCadaAnos: 4, anoBase: 2029 });
    const total = m.participantes.vagas.reduce((s, v) => s + (v.quantidade ?? 1), 0);
    expect(total).toBe(32);
    const porConf = (conf: string) =>
      m.participantes.vagas
        .filter((v) => {
          const o = comp(v.de).escopo;
          return o.tipo === "confederacao" && o.confederacao === conf;
        })
        .reduce((s, v) => s + (v.quantidade ?? 1), 0);
    expect(porConf("UEFA")).toBe(12);
    expect(porConf("CONMEBOL")).toBe(6);
    expect(porConf("AFC")).toBe(4);
    expect(porConf("CAF")).toBe(4);
    expect(porConf("CONCACAF")).toBe(4);
    expect(porConf("OFC")).toBe(1);
    // Campeões dos últimos 4 anos: o de 2024/25 da Champions entra pelos campeões anteriores.
    expect(comp("uefa-champions-league").campeoesAnteriores[0]?.temporada).toBe("2024/25");
  });
});
