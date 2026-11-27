import { describe, expect, it } from "vitest";
import { gerarAtributos, type Clube, type Jogador, type Pais } from "@newbras/data";
import { novaCarreira, type Carreira, type Compromisso, type Mundo } from "../carreira/carreira";
import { salarioBase } from "../gerador/jogador";
import {
  bilheteria,
  caixaDaCpu,
  folhaSalarial,
  orcamentoMensal,
  precisaDeDinheiro,
  premiacoes,
  receitaAnual,
  rendaDoJogo,
} from "./financas";
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

describe("escala de salários e receitas", () => {
  it("salário de 2 milhões na força 90, uns 4,2 vezes menos a cada 10 pontos", () => {
    expect(salarioBase(90)).toBe(2_000_000);
    expect(salarioBase(80)).toBeGreaterThan(450_000);
    expect(salarioBase(80)).toBeLessThan(500_000);
    expect(salarioBase(60)).toBeLessThan(30_000);
  });

  it("a receita cresce com o nível e com a economia do país", () => {
    const m = mundo();
    expect(receitaAnual(m, "rico")).toBeGreaterThan(receitaAnual(m, "nosso") * 3);
    expect(receitaAnual(m, "nosso")).toBeGreaterThan(receitaAnual(m, "pobre") * 5);
  });
});

describe("finanças do técnico", () => {
  it("no dia 1 entram TV, patrocínio e comercial e saem salários, estrutura e manutenção", () => {
    const m = mundo();
    const c = { ...nova(m), caixa: 10_000_000 };
    const orcamento = orcamentoMensal(c, m);
    expect(orcamento.salarios).toBe(-folhaSalarial(c, m));
    const saldo = Object.values(orcamento).reduce((s, v) => s + (v ?? 0), 0);
    const r = diaDasFinancas(c, m, "2027-02-01");
    // O estádio soma a mensalidade dos sócios no mesmo dia.
    const socios = r.carreira.financas?.[0]?.valores.socios ?? 0;
    expect((r.carreira.caixa ?? 0) - socios).toBe(10_000_000 + saldo);
    expect(r.carreira.financas?.[0]?.mes).toBe("2027-02");
    expect(r.noticias[0]?.texto).toContain("Fechamento do mês");
    // Fora do dia 1, nada muda.
    expect(diaDasFinancas(c, m, "2027-02-02").carreira).toBe(c);
  });

  it("bilheteria nos jogos em casa: público pela reputação e pela moral; amistoso vale menos", () => {
    const m = mundo();
    const c = { ...nova(m), caixa: 0 };
    const oficial = rendaDoJogo(c, m, false);
    expect(oficial.publico).toBeLessThanOrEqual(40_000);
    expect(oficial.publico).toBeGreaterThan(20_000);
    expect(rendaDoJogo({ ...c, moral: 90 }, m, false).publico).toBeGreaterThan(oficial.publico);
    expect(rendaDoJogo(c, m, true).renda).toBeLessThan(oficial.renda / 3);
    const jogo = {
      id: "j",
      data: "2027-02-10",
      tipo: "oficial",
      adversario: "rico",
      mando: "casa",
    };
    const r = bilheteria(c, m, jogo as Compromisso);
    expect(r.caixa).toBe(oficial.renda);
    expect(r.financas?.[0]).toMatchObject({ jogosEmCasa: 1, publico: oficial.publico });
    expect(bilheteria(c, m, { ...jogo, mando: "fora" } as Compromisso)).toBe(c);
  });

  it("título de liga paga 10% da receita anual; vice, metade", () => {
    const m = mundo();
    const c = { ...nova(m), caixa: 0 };
    const titulo = premiacoes(c, m, "2027-12-10", [{ competicao: "liga", campeao: "nosso" }]);
    expect(titulo.carreira.caixa).toBe(Math.round((receitaAnual(m, "nosso") * 0.1) / 1000) * 1000);
    const vice = premiacoes(c, m, "2027-12-10", [
      { competicao: "liga", campeao: "rico", vice: "nosso" },
    ]);
    expect(vice.carreira.caixa).toBe(Math.round((receitaAnual(m, "nosso") * 0.05) / 1000) * 1000);
    expect(
      premiacoes(c, m, "2027-12-10", [{ competicao: "liga", campeao: "rico" }]).noticias,
    ).toEqual([]);
  });
});

describe("caixa da CPU", () => {
  it("decide se o clube precisa de dinheiro: no vermelho vende, com folga faz jogo duro", () => {
    const m = mundo();
    const mes = receitaAnual(m, "pobre") / 12;
    const c = nova(m);
    expect(precisaDeDinheiro({ ...c, caixasCpu: { pobre: mes * 6 } }, m, "pobre")).toBe(0);
    expect(precisaDeDinheiro({ ...c, caixasCpu: { pobre: 0 } }, m, "pobre")).toBe(0.6);
    expect(precisaDeDinheiro({ ...c, caixasCpu: { pobre: -mes * 4 } }, m, "pobre")).toBe(1);
  });

  it("vendas e compras do dia mexem no caixa da CPU; o mês paga a folha", () => {
    const m = mundo();
    const c: Carreira = {
      ...nova(m),
      caixasCpu: { rico: 50_000_000, pobre: 1_000_000 },
      transferencias: [
        {
          jogador: "p1",
          de: "pobre",
          para: "rico",
          data: "2027-01-20",
          valor: 3_000_000,
          tipo: "compra",
        },
      ],
    };
    const r = diaDasFinancas(c, m, "2027-01-20").carreira;
    expect(r.caixasCpu?.pobre).toBe(4_000_000);
    expect(r.caixasCpu?.rico).toBe(47_000_000);
    const mes = diaDasFinancas(r, m, "2027-02-01").carreira;
    expect(mes.caixasCpu?.rico).not.toBe(47_000_000);
    expect(caixaDaCpu(mes, m, "rico")).toBe(mes.caixasCpu?.rico);
  });
});
