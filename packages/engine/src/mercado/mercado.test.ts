import { describe, expect, it } from "vitest";
import { gerarAtributos, type Clube, type Jogador, type Pais } from "@newbras/data";
import { novaCarreira, type Carreira, type Mundo } from "../carreira/carreira";
import { mundoNaData } from "../elenco/mundo";
import {
  aceitarProposta,
  caixaDe,
  contratarLivre,
  custoDaDispensa,
  diaDoMercado,
  dispensarJogador,
  livresDe,
  pedidoDoClube,
  porAVenda,
  proporCompra,
} from "./mercado";
import { janelaAberta, proximaJanela, valorDeMercado } from "./valor";

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

describe("valor e janelas", () => {
  it("valor sobe com a força, cai com a idade e com o contrato no fim", () => {
    const j = jogador("x", "nosso", 80, "2000-01-01");
    const v = valorDeMercado(j, "2027-01-01");
    expect(valorDeMercado({ ...j, forca: 90, potencial: 92 }, "2027-01-01")).toBeGreaterThan(v * 3);
    expect(valorDeMercado({ ...j, nascimento: "1992-01-01" }, "2027-01-01")).toBeLessThan(v / 2);
    expect(valorDeMercado(j, "2027-01-01", { fim: "2027-04-01", salario: 1 })).toBeLessThanOrEqual(
      v / 2,
    );
  });

  it("janela aberta e a próxima", () => {
    expect(janelaAberta(PAIS, "2027-02-10")?.fim).toBe("2027-03-03");
    expect(janelaAberta(PAIS, "2027-05-10")).toBeUndefined();
    expect(proximaJanela(PAIS, "2027-05-10")).toBe("2027-07-20");
  });
});

describe("mercado do técnico", () => {
  it("compra com a janela aberta: contraproposta perto do pedido, aceita no pedido", () => {
    const m = mundo();
    let c = { ...nova(m), data: "2027-02-01" };
    const alvo = m.elenco("medio").find((j) => j.forca === 75)!;
    const pedido = pedidoDoClube(m, alvo, c.data);
    expect(pedido).toBeGreaterThan(0);
    const caixa = caixaDe(c, m);
    expect(caixa).toBeGreaterThan(pedido);
    const pouco = proporCompra(c, m, alvo.id, Math.round(pedido * 0.9));
    expect(pouco.resultado.tipo).toBe("contraproposta");
    const ok = proporCompra(c, m, alvo.id, pedido);
    expect(ok.resultado.tipo).toBe("aceita");
    c = ok.carreira;
    expect(c.caixa).toBe(caixa - pedido);
    const hoje = mundoNaData(m, c, c.data);
    expect(hoje.elenco("nosso").some((j) => j.id === alvo.id)).toBe(true);
    expect(hoje.elenco("medio").some((j) => j.id === alvo.id)).toBe(false);
    expect(hoje.jogador(alvo.id)?.clube).toBe("nosso");
    expect(c.contratos?.[alvo.id]?.fim).toBe("2030-02-01");
    // Fora da janela não dá.
    const fechada = proporCompra({ ...c, data: "2027-05-01" }, hoje, "m1", 1e9);
    expect(fechada.resultado).toEqual({ tipo: "impossivel", motivo: "janela-fechada" });
  });

  it("o craque do clube grande não quer descer de nível", () => {
    const m = mundo();
    const c = { ...nova(m), data: "2027-02-01", caixa: 1e12 };
    const craque = [...m.elenco("grande")].sort((a, b) => b.forca - a.forca)[0]!;
    const r = proporCompra(c, m, craque.id, 1e10);
    expect(r.resultado).toEqual({ tipo: "recusa-jogador", motivo: "clube-menor" });
  });

  it("dispensado fica livre e pode ser contratado de novo, a qualquer hora", () => {
    const m = mundo();
    let c = { ...nova(m), data: "2027-05-01" };
    const custo = custoDaDispensa(c, m, "n0");
    expect(custo).toBeGreaterThan(0);
    const caixa = caixaDe(c, m);
    c = dispensarJogador(c, m, "n0");
    expect(c.caixa).toBe(caixa - custo);
    expect(livresDe(c)).toEqual(["n0"]);
    const hoje = mundoNaData(m, c, c.data);
    expect(hoje.elenco("nosso").some((j) => j.id === "n0")).toBe(false);
    expect(hoje.jogador("n0")?.clube).toBeUndefined();
    const volta = contratarLivre(c, hoje, "n0");
    expect(volta.resultado.tipo).toBe("aceita");
    expect(livresDe(volta.carreira)).toEqual([]);
  });

  it("à venda recebe proposta na janela; aceita, o dinheiro entra e o jogador sai", () => {
    const m = mundo();
    let c = porAVenda({ ...nova(m), data: "2027-01-10" }, "n3", true);
    let proposta;
    for (let d = 10; d < 60 && !proposta; d++) {
      const data = `2027-${d < 32 ? "01" : "02"}-${String(d < 32 ? d : d - 31).padStart(2, "0")}`;
      const r = diaDoMercado({ ...c, data }, m, data);
      proposta = r.propostas?.find((p) => p.jogador === "n3");
      if (proposta) c = { ...c, data, propostas: r.propostas ?? [] };
    }
    expect(proposta).toBeDefined();
    const caixa = caixaDe(c, m);
    c = aceitarProposta(c, m, proposta!.id);
    expect(c.caixa).toBe(caixa + proposta!.valor);
    expect(
      mundoNaData(m, c, c.data)
        .elenco(proposta!.clube)
        .some((j) => j.id === "n3"),
    ).toBe(true);
    expect(c.aVenda).toEqual([]);
  });
});
