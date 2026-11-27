import { describe, expect, it } from "vitest";
import { gerarAtributos, type Clube, type Jogador, type Pais } from "@newbras/data";
import { novaCarreira, type Carreira, type Compromisso, type Mundo } from "../carreira/carreira";
import { salarioBase } from "../gerador/jogador";
import {
  aceitarNome,
  bilheteriaDoJogo,
  capacidadeAtual,
  definirMensalidade,
  definirPrecos,
  diaDoEstadio,
  iniciarObra,
  mensalidadeJusta,
  precosJustos,
  publicoDoJogo,
  responderEvento,
  tetoDosPrecos,
} from "./estadio";

const PAIS = {
  codigo: "BRA",
  nome: "Brasil",
  confederacao: "CONMEBOL",
  nivel: 1,
  grupoNomes: "pt-br",
  temporada: { inicio: "01-10", fim: "12-10" },
  janelas: [{ inicio: "01-05", fim: "03-03" }],
  cores: { primaria: "#ffdf00", secundaria: "#009c3b" },
} as unknown as Pais;

function jogador(id: string, clube: string, forca: number): Jogador {
  return {
    id,
    nome: id,
    nascimento: "1999-01-01",
    nacionalidade: "BRA",
    posicao: "M",
    lado: "C",
    forca,
    potencial: forca,
    caracteristicas: [],
    atributos: gerarAtributos({ semente: id, posicao: "M", forca }),
    estrela: false,
    base: false,
    clube,
    contrato: { fim: "2029-12-31", salario: salarioBase(forca) },
    aConferir: [],
  } as unknown as Jogador;
}

function mundo(): Mundo {
  const estadio = (capacidade: number) => ({ nome: "Estádio", capacidade });
  const clubes = [
    {
      id: "nosso",
      nomeCurto: "Nosso",
      pais: "BRA",
      nivel: 75,
      reputacao: 4,
      estadio: estadio(40_000),
    },
    {
      id: "rico",
      nomeCurto: "Rico",
      pais: "ENG",
      nivel: 85,
      reputacao: 5,
      estadio: estadio(60_000),
    },
    {
      id: "pobre",
      nomeCurto: "Pobre",
      pais: "BRA",
      nivel: 55,
      reputacao: 2,
      estadio: estadio(8_000),
    },
  ] as unknown as Clube[];
  const elencos: Record<string, Jogador[]> = {
    nosso: Array.from({ length: 22 }, (_, i) => jogador(`n${i}`, "nosso", 66 + (i % 10))),
    rico: Array.from({ length: 24 }, (_, i) => jogador(`r${i}`, "rico", 76 + (i % 12))),
    pobre: Array.from({ length: 24 }, (_, i) => jogador(`p${i}`, "pobre", 46 + (i % 10))),
  };
  const todos = Object.values(elencos).flat();
  return {
    competicoes: [],
    competicao: (id: string) =>
      id === "liga"
        ? ({ id, nome: "Liga", tipo: "liga", escopo: { tipo: "pais" } } as never)
        : id === "liberta"
          ? ({
              id,
              nome: "Liberta",
              tipo: "continental",
              escopo: { tipo: "confederacao" },
            } as never)
          : undefined,
    clube: (id: string) => clubes.find((c) => c.id === id),
    jogador: (id: string) => todos.find((j) => j.id === id),
    elenco: (id: string) => elencos[id] ?? [],
    pais: () => PAIS,
    clubesDoPais: () => clubes,
    datasFifa: [],
    clubes,
  } as unknown as Mundo;
}

const nova = (m: Mundo): Carreira =>
  novaCarreira(m, {
    id: "t",
    semente: "s",
    tecnico: "T",
    clube: "nosso",
    referencia: "2027-01-10",
    versaoBanco: "1",
  });

const jogo = (id: string, extra: Partial<Compromisso> = {}): Compromisso =>
  ({
    id,
    data: "2027-03-10",
    tipo: "oficial",
    adversario: "rico",
    mando: "casa",
    ...extra,
  }) as Compromisso;

describe("ingressos com preço justo", () => {
  it("a renda máxima fica perto do preço justo: caro esvazia, barato rende menos", () => {
    const m = mundo();
    const c = nova(m);
    const justos = precosJustos(c, m);
    const vezes = (k: number) =>
      Object.fromEntries(
        Object.entries(justos).map(([s, v]) => [s, Math.round(v * k)]),
      ) as typeof justos;
    const justo = publicoDoJogo(c, m, jogo("a"), justos);
    const caro = publicoDoJogo(c, m, jogo("a"), vezes(2));
    const muitoCaro = publicoDoJogo(c, m, jogo("a"), vezes(10));
    const barato = publicoDoJogo(c, m, jogo("a"), vezes(0.5));
    expect(justo.renda).toBeGreaterThan(caro.renda);
    expect(caro.renda).toBeGreaterThan(muitoCaro.renda);
    expect(justo.renda).toBeGreaterThan(barato.renda);
    expect(barato.publico).toBeGreaterThan(justo.publico);
    // Os sócios entram de graça; quem paga some.
    expect(muitoCaro.publico - muitoCaro.socios).toBeLessThan((justo.publico - justo.socios) / 50);
  });

  it("o preço sobe no máximo 20% por mês", () => {
    const m = mundo();
    const c = nova(m);
    const teto = tetoDosPrecos(c, m);
    const r = definirPrecos(c, m, { popular: 1_000_000 });
    expect(r.estadio?.precos?.popular).toBe(teto.popular);
    // De novo no mesmo mês, o teto não sobe.
    expect(definirPrecos(r, m, { popular: 1_000_000 }).estadio?.precos?.popular).toBe(teto.popular);
    // Baixar é livre.
    expect(definirPrecos(r, m, { popular: 1 }).estadio?.precos?.popular).toBe(1);
  });

  it("preço abusivo três jogos seguidos gera protesto", () => {
    const m = mundo();
    let c: Carreira = { ...nova(m), moral: 60, diretoria: { confianca: 60 } };
    const justos = precosJustos(c, m);
    c = {
      ...c,
      estadio: {
        precos: {
          popular: justos.popular * 3,
          central: justos.central * 3,
          camarote: justos.camarote * 3,
        },
      },
    };
    const noticias = [];
    for (const id of ["a", "b", "c"]) {
      const r = bilheteriaDoJogo(c, m, jogo(id));
      c = r.carreira;
      noticias.push(...r.noticias);
    }
    expect(noticias.some((n) => n.texto.startsWith("Protesto da torcida"))).toBe(true);
    expect(c.moral).toBe(58);
    expect(c.diretoria?.confianca).toBe(58);
  });

  it("competição continental exige 20 mil lugares; sem isso, estádio alugado", () => {
    const m = mundo();
    const c = { ...nova(m), clube: "pobre" };
    expect(publicoDoJogo(c, m, jogo("x", { competicao: "liberta" })).alugado).toBe(true);
    expect(publicoDoJogo(c, m, jogo("x", { competicao: "liga" })).alugado).toBe(false);
  });
});

describe("sócios, obras, nome e eventos", () => {
  it("sócios pagam a mensalidade todo mês; o reajuste também tem teto", () => {
    const m = mundo();
    const c = { ...nova(m), caixa: 0 };
    const r = diaDoEstadio(c, m, "2027-02-01").carreira;
    expect(r.estadio?.socios).toBeGreaterThan(0);
    expect(r.financas?.at(-1)?.valores.socios).toBeGreaterThan(0);
    const justa = mensalidadeJusta(c, m);
    expect(definirMensalidade(r, m, justa * 10).estadio?.mensalidade).toBe(Math.floor(justa * 1.2));
  });

  it("obra: entrada de 30%, parcelas e mais lugares na entrega", () => {
    const m = mundo();
    let c: Carreira = { ...nova(m), caixa: 1e10 };
    const antes = capacidadeAtual(c, m);
    const r = iniciarObra(c, m, 10_000);
    expect(r.resultado).toBe("ok");
    c = r.carreira;
    expect(c.caixa).toBeLessThan(1e10);
    expect(capacidadeAtual(c, m)).toBe(Math.round(antes * 0.9));
    expect(iniciarObra(c, m, 5_000).resultado).toBe("em-obra");
    const fim = c.estadio!.obra!.fim;
    // Todo dia 1 até passar do fim da obra.
    let [ano, mes] = c.data.split("-").map(Number) as [number, number];
    for (let i = 0; i < 24; i++) {
      mes++;
      if (mes > 12) {
        mes = 1;
        ano++;
      }
      const data = `${ano}-${String(mes).padStart(2, "0")}-01`;
      c = diaDoEstadio({ ...c, data }, m, data).carreira;
      if (data > fim) break;
    }
    expect(c.estadio?.obra).toBeUndefined();
    expect(capacidadeAtual(c, m)).toBe(antes + 10_000);
  });

  it("nome do estádio vendido paga todo mês; evento aceito rende na data", () => {
    const m = mundo();
    let c: Carreira = {
      ...nova(m),
      caixa: 0,
      estadio: {
        ofertaDeNome: { marca: "Veltel", valorAnual: 12_000_000, anos: 3, ate: "2027-02-20" },
        eventos: [
          { id: "e1", tipo: "show", renda: 2_000_000, data: "2027-02-25", ate: "2027-02-20" },
        ],
      },
    };
    c = aceitarNome({ ...c, data: "2027-02-10" });
    c = responderEvento(c, "e1", true);
    expect(c.estadio?.naming?.marca).toBe("Veltel");
    c = diaDoEstadio(c, m, "2027-02-25").carreira;
    expect(c.caixa).toBe(2_000_000);
    c = diaDoEstadio(c, m, "2027-03-01").carreira;
    expect(c.financas?.at(-1)?.valores.naming).toBe(1_000_000);
  });
});
