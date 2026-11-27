import { describe, expect, it } from "vitest";
import { gerarAtributos, type Clube, type Jogador } from "@newbras/data";
import type { Mundo } from "../carreira/carreira";
import { compactarTransferencias } from "./cpu";
import { respostaDeVenda, type SituacaoDoClube } from "./situacao";
import { valorDeMercado } from "./valor";

function jogador(
  id: string,
  clube: string,
  forca: number,
  nascimento: string,
  potencial = forca,
): Jogador {
  return {
    id,
    nome: id,
    nascimento,
    nacionalidade: "BRA",
    posicao: "M",
    lado: "C",
    forca,
    potencial,
    caracteristicas: ["passe"],
    atributos: gerarAtributos({ semente: id, posicao: "M", forca }),
    estrela: false,
    base: false,
    clube,
    aConferir: [],
  } as unknown as Jogador;
}

function mundo(nivel: number, craque: Jogador): Mundo {
  const clube = { id: "clube", nomeCurto: "Clube", pais: "BRA", nivel } as unknown as Clube;
  const elenco = [
    craque,
    ...Array.from({ length: 22 }, (_, i) => jogador(`r${i}`, "clube", 60 + (i % 6), "1998-01-01")),
  ];
  return {
    competicoes: [],
    competicao: () => undefined,
    clube: (id) => (id === "clube" ? clube : undefined),
    jogador: (id) => elenco.find((j) => j.id === id),
    elenco: (id) => (id === "clube" ? elenco : []),
    pais: () => undefined,
    clubesDoPais: () => [clube],
    datasFifa: [],
  };
}

const DATA = "2027-02-01";
const saudavelBrigando: SituacaoDoClube = { precisaDeDinheiro: 0.1, brigandoPorTitulo: true };
const saudavelNoMeio: SituacaoDoClube = { precisaDeDinheiro: 0.1, brigandoPorTitulo: false };
const emCrise: SituacaoDoClube = { precisaDeDinheiro: 0.9, brigandoPorTitulo: true };

describe("jogo duro para vender (regra do dono)", () => {
  const craque = jogador("craque", "clube", 88, "1999-01-01");
  const m = mundo(88, craque);
  const valor = valorDeMercado(craque, DATA);

  it("brigando pelo título e sem precisar de dinheiro: intransferível, até a proposta absurda", () => {
    expect(respostaDeVenda(m, saudavelBrigando, craque, valor * 2, DATA)).toMatchObject({
      tipo: "recusa",
      motivo: "intransferivel",
    });
    expect(respostaDeVenda(m, saudavelBrigando, craque, valor * 3.1, DATA).tipo).toBe("aceita");
  });

  it("o mesmo clube em crise vende o craque por bem menos", () => {
    const r = respostaDeVenda(m, emCrise, craque, valor * 1.3, DATA);
    expect(r.tipo).toBe("aceita");
    expect(r.pedido).toBeLessThan(respostaDeVenda(m, saudavelNoMeio, craque, 0, DATA).pedido);
  });

  it("fora da briga, faz jogo duro com o prodígio mas vende pela proposta boa", () => {
    const prodigio = jogador("joia", "clube", 74, "2008-01-01", 90);
    const pequeno = mundo(70, prodigio);
    const v = valorDeMercado(prodigio, DATA);
    const r = respostaDeVenda(pequeno, saudavelNoMeio, prodigio, v, DATA);
    expect(r.tipo).toBe("recusa");
    expect(r.pedido).toBeGreaterThan(v * 1.8);
    expect(respostaDeVenda(pequeno, saudavelNoMeio, prodigio, r.pedido, DATA).tipo).toBe("aceita");
    // Perto do pedido: contraproposta.
    expect(respostaDeVenda(pequeno, saudavelNoMeio, prodigio, r.pedido * 0.9, DATA).tipo).toBe(
      "contraproposta",
    );
  });

  it("a lista de transferências guarda a última de cada um e o histórico do técnico", () => {
    const lista = [
      { jogador: "a", de: "x", para: "y", data: "2026-08-01", valor: 1, tipo: "compra" as const },
      { jogador: "a", de: "y", para: "z", data: "2026-09-01", valor: 1, tipo: "compra" as const },
      {
        jogador: "b",
        de: "nosso",
        para: "y",
        data: "2026-08-01",
        valor: 1,
        tipo: "venda" as const,
      },
      { jogador: "b", de: "y", para: "z", data: "2026-08-15", valor: 1, tipo: "compra" as const },
    ];
    const r = compactarTransferencias(lista, "nosso", "2027-07-01");
    expect(r.map((t) => `${t.jogador}:${t.para}`)).toEqual(["a:z", "b:y", "b:z"]);
  });
});
