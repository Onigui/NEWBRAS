import { describe, expect, it } from "vitest";
import { gerarAtributos, type Clube, type Jogador, type Pais } from "@newbras/data";
import { novaCarreira, type Carreira, type Mundo } from "../carreira/carreira";
import { mundoNaData } from "../elenco/mundo";
import { somarDias } from "../carreira/datas";
import { propostaDeRenovacao } from "../elenco/vida";
import { aceitarProposta, caixaDe, diaDoMercado, proporCompra } from "./mercado";
import {
  avaliarTroca,
  condicoesDoEmprestimo,
  darLance,
  diaDosNegocios,
  exercerOpcao,
  leiloar,
  pegarEmprestado,
  porParaEmprestimo,
  proporPreContrato,
  proporTroca,
  salarioDoPreContrato,
} from "./negocios";
import { contratoVigente, valorDeMercado } from "./valor";

const PAIS = {
  codigo: "BRA",
  nome: "Brasil",
  confederacao: "CONMEBOL",
  nivel: 1,
  grupoNomes: "pt-br",
  temporada: { inicio: "01-10", fim: "12-10" },
  janelas: [
    { inicio: "01-05", fim: "03-03" },
    { inicio: "07-20", fim: "09-11" },
  ],
  cores: { primaria: "#ffdf00", secundaria: "#009c3b" },
} as unknown as Pais;

function jogador(id: string, clube: string, forca: number, nascimento = "1999-01-01"): Jogador {
  return {
    id,
    nome: id,
    nascimento,
    nacionalidade: "BRA",
    posicao: "M",
    lado: "C",
    forca,
    potencial: forca + 2,
    caracteristicas: ["passe"],
    atributos: gerarAtributos({ semente: id, posicao: "M", forca }),
    estrela: false,
    base: false,
    clube,
    contrato: { fim: "2029-12-31", salario: 50_000 },
    aConferir: [],
  } as unknown as Jogador;
}

function mundo(): Mundo {
  const clubes = [
    { id: "nosso", nomeCurto: "Nosso", pais: "BRA", nivel: 75 },
    { id: "grande", nomeCurto: "Grande", pais: "BRA", nivel: 90 },
    { id: "medio", nomeCurto: "Médio", pais: "BRA", nivel: 72 },
  ] as unknown as Clube[];
  const elencos: Record<string, Jogador[]> = {
    nosso: Array.from({ length: 22 }, (_, i) => jogador(`n${i}`, "nosso", 70 + (i % 8))),
    grande: Array.from({ length: 24 }, (_, i) => jogador(`g${i}`, "grande", 80 + (i % 12))),
    medio: Array.from({ length: 24 }, (_, i) => jogador(`m${i}`, "medio", 66 + (i % 10))),
  };
  const todos = Object.values(elencos).flat();
  return {
    competicoes: [],
    competicao: () => undefined,
    clube: (id) => clubes.find((c) => c.id === id),
    jogador: (id) => todos.find((j) => j.id === id),
    elenco: (id) => elencos[id] ?? [],
    pais: (c) => (c === "BRA" ? PAIS : undefined),
    clubesDoPais: () => clubes,
    datasFifa: [],
    clubes,
  };
}

const nova = (m: Mundo): Carreira =>
  novaCarreira(m, {
    id: "c",
    semente: "s",
    tecnico: "T",
    clube: "nosso",
    referencia: "2026-07-01",
    versaoBanco: "0",
  });

/** Avança só os negócios do dia (e o mercado do técnico), dia a dia, até a data. */
function ate(c: Carreira, m: Mundo, data: string): Carreira {
  let r = c;
  while (r.data < data) {
    const d = somarDias(r.data, 1);
    const hoje = mundoNaData(m, r, d);
    const mercado = diaDoMercado({ ...r, data: d }, hoje, d);
    r = diaDosNegocios({ ...r, data: d, propostas: mercado.propostas ?? [] }, hoje, d).carreira;
  }
  return r;
}

describe("contrato da CPU", () => {
  it("renova sozinho quando o do banco acaba, sempre igual para o mesmo jogador", () => {
    const contrato = { fim: "2027-06-30", salario: 1 };
    expect(contratoVigente(contrato, "x", "2027-06-30")).toBe(contrato);
    const depois = contratoVigente(contrato, "x", "2027-07-01")!;
    expect(depois.fim > "2027-07-01").toBe(true);
    expect(["2029-06-30", "2030-06-30", "2031-06-30"]).toContain(depois.fim);
    expect(contratoVigente(contrato, "x", "2027-07-01")).toEqual(depois);
    // O valor não despenca como o de contrato vencido.
    const j = { ...jogador("x", "medio", 75), contrato };
    expect(valorDeMercado(j, "2027-08-01")).toBeGreaterThan(valorDeMercado(j, "2027-06-01"));
  });
});

describe("pré-contrato", () => {
  it("nos últimos 6 meses: o reserva assina pelo pedido e chega quando o contrato acaba", () => {
    const m = mundo();
    const reserva = m.elenco("medio").find((j) => j.forca === 66)!;
    reserva.contrato = { fim: "2027-06-30", salario: 30_000 };
    let c = { ...nova(m), data: "2027-03-01" };
    const salario = salarioDoPreContrato(m, reserva);
    const r = proporPreContrato(c, m, reserva.id, salario);
    expect(r.resultado).toEqual({ tipo: "aceita", chegada: "2027-07-01", salario });
    c = r.carreira;
    // Com pré-contrato, a CPU não o vende para outro nem o técnico compra.
    expect(proporCompra({ ...c, caixa: 1e12 }, m, reserva.id, 1e9).resultado.tipo).toBe(
      "impossivel",
    );
    c = ate(c, m, "2027-07-01");
    const hoje = mundoNaData(m, c, c.data);
    expect(hoje.jogador(reserva.id)?.clube).toBe("nosso");
    expect(hoje.elenco("medio").some((j) => j.id === reserva.id)).toBe(false);
    expect(c.contratos?.[reserva.id]?.salario).toBe(salario);
    expect(c.preContratos).toEqual([]);
  });

  it("contrato longo não dá; o titular quer mais para sair", () => {
    const m = mundo();
    const c = { ...nova(m), data: "2027-03-01" };
    const longe = m.elenco("medio")[0]!;
    expect(proporPreContrato(c, m, longe.id, 1e9).resultado).toEqual({
      tipo: "impossivel",
      motivo: "contrato-longo",
    });
    // Clube do mesmo tamanho: o titular não troca de clube só pelo salário base.
    m.clube("medio")!.nivel = 74;
    const titular = [...m.elenco("medio")].sort((a, b) => b.forca - a.forca)[4]!;
    titular.contrato = { fim: "2027-06-30", salario: 30_000 };
    const pedido = salarioDoPreContrato(m, titular);
    const pouco = proporPreContrato(c, m, titular.id, Math.round(pedido * 0.85));
    expect(pouco.resultado.tipo).toBe("recusa-jogador");
    expect(proporPreContrato(c, m, titular.id, pedido).resultado.tipo).toBe("aceita");
  });

  it("jogador do técnico com pré-contrato assinado não renova e sai para o clube novo", () => {
    const m = mundo();
    const c: Carreira = {
      ...nova(m),
      data: "2027-03-01",
      contratos: { n2: { fim: "2027-06-30", salario: 1 } },
      preContratos: [
        {
          jogador: "n2",
          de: "nosso",
          para: "medio",
          assinatura: "2027-03-01",
          chegada: "2027-07-01",
          salario: 1,
        },
      ],
    };
    expect(propostaDeRenovacao(c, m, "n2").recusa).toBe("pre-contrato");
  });
});

describe("empréstimos", () => {
  it("pega emprestado o reserva, paga a taxa e ele volta no fim", () => {
    const m = mundo();
    let c = { ...nova(m), data: "2027-02-01" };
    const reserva = m.elenco("medio").find((j) => j.forca === 67)!;
    const cond = condicoesDoEmprestimo(c, m, reserva.id);
    expect(cond.tipo).toBe("ok");
    if (cond.tipo !== "ok") return;
    // A temporada do Brasil do teste começa em 10/01.
    expect(cond.fim).toBe("2028-01-09");
    const caixa = caixaDe(c, m);
    c = pegarEmprestado(c, m, reserva.id, 1, false).carreira;
    expect(c.caixa).toBe(caixa - cond.taxa);
    let hoje = mundoNaData(m, c, c.data);
    expect(hoje.elenco("nosso").some((j) => j.id === reserva.id)).toBe(true);
    expect(c.contratos?.[reserva.id]?.salario).toBe(cond.salario);
    // Emprestado não renova nem vai à venda.
    expect(propostaDeRenovacao(c, hoje, reserva.id).recusa).toBe("emprestado");
    c = ate({ ...c, data: "2028-01-08" }, m, "2028-01-10");
    hoje = mundoNaData(m, c, c.data);
    expect(hoje.jogador(reserva.id)?.clube).toBe("medio");
    expect(c.contratos?.[reserva.id]).toBeUndefined();
    expect(c.emprestimos).toEqual([]);
  });

  it("o craque não sai por empréstimo; a opção de compra fica de vez", () => {
    const m = mundo();
    let c: Carreira = { ...nova(m), data: "2027-02-01", caixa: 1e12 };
    const craque = [...m.elenco("medio")].sort((a, b) => b.forca - a.forca)[0]!;
    expect(condicoesDoEmprestimo(c, m, craque.id)).toEqual({ tipo: "recusa", motivo: "titular" });
    const reserva = m.elenco("medio").find((j) => j.forca === 66)!;
    const r = pegarEmprestado(c, m, reserva.id);
    expect(r.resultado.tipo).toBe("ok");
    c = r.carreira;
    const opcao = c.emprestimos?.[0]?.opcao;
    expect(opcao).toBeGreaterThan(0);
    const compra = exercerOpcao(c, mundoNaData(m, c, c.data), reserva.id);
    expect(compra.resultado).toBe("ok");
    c = compra.carreira;
    expect(c.emprestimos).toEqual([]);
    expect(c.contratos?.[reserva.id]?.fim).toBe("2030-02-01");
    expect(mundoNaData(m, c, "2028-03-01").jogador(reserva.id)?.clube).toBe("nosso");
  });

  it("empresta um jogador do técnico: a taxa entra, o contrato fica e ele volta", () => {
    const m = mundo();
    let c = porParaEmprestimo({ ...nova(m), data: "2027-01-10" }, "n1", true);
    let proposta;
    for (let i = 0; i < 50 && !proposta; i++) {
      const data = somarDias("2027-01-10", i);
      const r = diaDoMercado({ ...c, data }, m, data);
      proposta = r.propostas?.find((p) => p.jogador === "n1" && p.emprestimo);
      if (proposta) c = { ...c, data, propostas: r.propostas ?? [] };
    }
    expect(proposta).toBeDefined();
    const caixa = caixaDe(c, m);
    c = aceitarProposta(c, m, proposta!.id);
    expect(c.caixa).toBe(caixa + proposta!.valor);
    expect(c.emprestimos?.[0]).toMatchObject({ jogador: "n1", de: "nosso", para: proposta!.clube });
    expect(c.aEmprestimo).toEqual([]);
    expect(mundoNaData(m, c, c.data).jogador("n1")?.clube).toBe(proposta!.clube);
    c = ate({ ...c, data: proposta!.emprestimo!.fim }, m, somarDias(proposta!.emprestimo!.fim, 1));
    const volta = mundoNaData(m, c, c.data).jogador("n1")?.clube;
    // Volta ao técnico, ou o clube comprou pela opção.
    expect(volta === "nosso" || (!!proposta!.emprestimo!.opcao && volta === proposta!.clube)).toBe(
      true,
    );
    expect(c.emprestimos?.some((e) => e.jogador === "n1")).toBe(false);
  });
});

describe("trocas", () => {
  it("jogador por jogador, com a diferença que o clube pede", () => {
    const m = mundo();
    let c: Carreira = { ...nova(m), data: "2027-02-01", caixa: 1e12 };
    const alvo = [...m.elenco("medio")].sort((a, b) => b.forca - a.forca)[5]!;
    const sem = avaliarTroca(c, m, alvo.id, ["n0"], 0);
    expect(sem.resultado.tipo).toBe("falta-dinheiro");
    const falta = sem.resultado.tipo === "falta-dinheiro" ? sem.resultado.falta : 0;
    const r = proporTroca(c, m, alvo.id, ["n0"], falta);
    expect(r.resultado.tipo).toBe("aceita");
    c = r.carreira;
    expect(c.caixa).toBe(1e12 - falta);
    const hoje = mundoNaData(m, c, c.data);
    expect(hoje.jogador(alvo.id)?.clube).toBe("nosso");
    expect(hoje.jogador("n0")?.clube).toBe("medio");
    expect(c.contratos?.n0).toBeUndefined();
    expect(c.contratos?.[alvo.id]).toBeDefined();
  });

  it("sem janela não troca; troca boa o bastante dispensa o dinheiro", () => {
    const m = mundo();
    const c = { ...nova(m), data: "2027-05-01" };
    expect(avaliarTroca(c, m, "m3", ["n0"], 0).resultado).toEqual({
      tipo: "impossivel",
      motivo: "janela-fechada",
    });
    const reserva = m.elenco("medio").find((j) => j.forca === 66)!;
    const dois = avaliarTroca({ ...c, data: "2027-02-01" }, m, reserva.id, ["n7", "n6"], 0);
    expect(dois.resultado.tipo).toBe("aceita");
  });
});

describe("leilões", () => {
  it("o técnico leiloa e o maior lance leva; ou o leilão acaba sem venda", () => {
    const m = mundo();
    let c = { ...nova(m), data: "2027-02-01" };
    const r = leiloar(c, m, "n4", 1_000_000);
    expect(r.resultado).toBe("ok");
    c = ate(r.carreira, m, "2027-02-06");
    expect(c.leiloes?.some((l) => l.jogador === "n4")).toBe(false);
    const clube = mundoNaData(m, c, c.data).jogador("n4")?.clube;
    const venda = c.transferencias?.find((t) => t.jogador === "n4" && t.tipo === "leilao");
    if (venda) {
      expect(clube).toBe(venda.para);
      expect(venda.valor).toBeGreaterThanOrEqual(1_000_000);
    } else expect(clube).toBe("nosso");
  });

  it("lance alto no leilão da CPU leva o jogador", () => {
    const m = mundo();
    const alvo = m.elenco("medio")[3]!;
    let c: Carreira = {
      ...nova(m),
      data: "2027-02-01",
      caixa: 1e12,
      leiloes: [
        {
          id: "l1",
          jogador: alvo.id,
          vendedor: "medio",
          minimo: 1_000_000,
          fim: "2027-02-03",
          lances: [],
        },
      ],
    };
    expect(darLance(c, m, "l1", 500_000).resultado).toEqual({
      tipo: "impossivel",
      motivo: "baixo",
      minimo: 1_000_000,
    });
    const valor = valorDeMercado(alvo, c.data) * 2;
    c = darLance(c, m, "l1", valor).carreira;
    c = ate(c, m, "2027-02-04");
    expect(mundoNaData(m, c, c.data).jogador(alvo.id)?.clube).toBe("nosso");
    expect(c.caixa).toBeLessThan(1e12);
  });
});
