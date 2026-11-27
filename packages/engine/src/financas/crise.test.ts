import { describe, expect, it } from "vitest";
import { gerarAtributos, type Clube, type Jogador, type Pais } from "@newbras/data";
import { estadoDe, novaCarreira, type Carreira, type Mundo } from "../carreira/carreira";
import { ordenarTabela } from "../competicoes/tabela";
import { moralDe, propostaDeRenovacao } from "../elenco/vida";
import { salarioBase } from "../gerador/jogador";
import { proporCompra } from "../mercado/mercado";
import {
  crisesDaCpu,
  ofertaDeCredito,
  parcelaDoEmprestimo,
  pegarEmprestimoBancario,
  proibidoDeContratar,
  quitarEmprestimo,
} from "./crise";
import { folhaSalarial, receitaAnual } from "./financas";
import { diaDasFinancas } from "./mes";

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

describe("salários atrasados e o efeito cascata", () => {
  it("sem caixa no dia 1, os salários atrasam; pagando tudo, a crise acaba", () => {
    const m = mundo();
    const c: Carreira = { ...nova(m), caixa: -50_000_000 };
    const moral = moralDe(estadoDe(c, "n0"));
    const dia = diaDasFinancas(c, m, "2027-02-01");
    let r = dia.carreira;
    const folha = folhaSalarial(c, m);
    expect(r.crise).toMatchObject({ mesesAtrasados: 1, salariosAtrasados: folha });
    expect(moralDe(estadoDe(r, "n0"))).toBe(moral - 8);
    expect(propostaDeRenovacao(r, m, "n0").recusa).toBe("salarios-atrasados");
    expect(dia.noticias.some((n) => n.texto.startsWith("Sem dinheiro em caixa"))).toBe(true);
    // Dinheiro entrou: paga no dia seguinte.
    r = diaDasFinancas({ ...r, caixa: folha * 3 }, m, "2027-02-02").carreira;
    expect(r.crise).toMatchObject({ mesesAtrasados: 0, salariosAtrasados: 0 });
    expect(r.caixa).toBe(folha * 2);
  });

  it("com 2 meses atrasados, a liga proíbe contratar", () => {
    const m = mundo();
    const c: Carreira = {
      ...nova(m),
      caixa: 1e9,
      crise: { salariosAtrasados: 1, mesesAtrasados: 2 },
    };
    expect(proibidoDeContratar(c, m)).toBe(true);
    expect(proporCompra(c, m, "p0", 1).resultado).toEqual({
      tipo: "impossivel",
      motivo: "proibido",
    });
    expect(
      proibidoDeContratar({ ...c, crise: { salariosAtrasados: 0, mesesAtrasados: 0 } }, m),
    ).toBe(false);
  });

  it("punição em pontos sai da tabela", () => {
    const jogos = [{ casa: "A", fora: "B", placar: [1, 0] as const }];
    expect(ordenarTabela(["A", "B"], jogos, ["pontos"])[0]?.clube).toBe("A");
    const t = ordenarTabela(["A", "B"], jogos, ["pontos"], undefined, "x", { A: 6 });
    expect(t[0]?.clube).toBe("B");
    expect(t[1]).toMatchObject({ clube: "A", pontos: -3 });
  });
});

describe("empréstimo bancário", () => {
  it("limite de metade da receita; parcela fixa todo dia 1; dá para quitar", () => {
    const m = mundo();
    const c: Carreira = { ...nova(m), caixa: 0 };
    const oferta = ofertaDeCredito(c, m);
    expect(oferta).toMatchObject({
      tipo: "ok",
      limite: Math.round((receitaAnual(m, "nosso") * 0.5) / 1000) * 1000,
    });
    if (oferta.tipo !== "ok") return;
    expect(oferta.taxa).toBe(0.008);
    let r = pegarEmprestimoBancario(c, m, 10_000_000, 12).carreira;
    expect(r.caixa).toBe(10_000_000);
    const e = r.emprestimosBancarios![0]!;
    expect(e.parcela).toBe(parcelaDoEmprestimo(10_000_000, 0.008, 12));
    // Mais do que o limite, não.
    expect(pegarEmprestimoBancario(c, m, oferta.limite * 2, 12).resultado).toEqual({
      tipo: "invalido",
    });
    r = diaDasFinancas({ ...r, caixa: 1e9 }, m, "2027-02-01").carreira;
    const depois = r.emprestimosBancarios![0]!;
    expect(depois.restantes).toBe(11);
    expect(depois.saldo).toBeLessThan(10_000_000);
    r = quitarEmprestimo(r, m, depois.id);
    expect(r.emprestimosBancarios).toEqual([]);
  });

  it("três parcelas atrasadas e o crédito acaba", () => {
    const m = mundo();
    let r = pegarEmprestimoBancario({ ...nova(m), caixa: 0 }, m, 5_000_000, 12).carreira;
    for (const mes of ["02", "03", "04"])
      r = diaDasFinancas({ ...r, caixa: -1e10 }, m, `2027-${mes}-01`).carreira;
    expect(r.emprestimosBancarios![0]!.atrasos).toBe(3);
    expect(ofertaDeCredito({ ...r, caixa: 1e9 }, m)).toEqual({
      tipo: "negado",
      motivo: "inadimplente",
    });
  });
});

describe("crise da CPU", () => {
  it("no vermelho fundo, pega empréstimo e paga a parcela; afundando, perde os melhores", () => {
    const m = mundo();
    const receita = receitaAnual(m, "pobre");
    const c = nova(m);
    const r = crisesDaCpu(c, m, "2027-02-01", { pobre: -receita * 0.4 });
    expect(r.dividas.pobre?.saldo).toBe(Math.round(receita * 0.35));
    expect(r.caixas.pobre).toBe(Math.round(-receita * 0.4 + receita * 0.35));
    const fundo = crisesDaCpu({ ...c, dividasCpu: r.dividas }, m, "2027-03-01", {
      pobre: -receita * 2,
    });
    expect(fundo.dividas.pobre!.saldo).toBeLessThan(r.dividas.pobre!.saldo);
    let perdas = 0;
    for (let i = 1; i <= 12; i++)
      perdas += crisesDaCpu(
        { ...c, dividasCpu: r.dividas },
        m,
        `2028-${String(i).padStart(2, "0")}-01`,
        { pobre: -receita * 2 },
      ).rescisoes.length;
    expect(perdas).toBeGreaterThan(0);
  });
});
