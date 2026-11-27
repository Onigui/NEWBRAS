import { describe, expect, it } from "vitest";
import { gerarAtributos, type Clube, type Jogador, type Pais } from "@newbras/data";
import { novaCarreira, type Carreira, type Mundo } from "../carreira/carreira";
import { Rng } from "../rng";
import {
  diaDoElenco,
  lesionado,
  minutosNaVirada,
  propostaDeRenovacao,
  renovarContrato,
  somarMeses,
  sortearLesao,
  TIPOS_DE_LESAO,
} from "./vida";

const BRASIL = {
  codigo: "BRA",
  nome: "Brasil",
  confederacao: "CONMEBOL",
  nivel: 1,
  grupoNomes: "pt-br",
  temporada: { inicio: "01-10", fim: "12-10" },
  janelas: [],
  cores: { primaria: "#ffdf00", secundaria: "#009c3b" },
} as unknown as Pais;

function jogador(id: string, nascimento: string, forca: number, fim: string): Jogador {
  return {
    id,
    nome: id,
    nascimento,
    nacionalidade: "BRA",
    posicao: "M",
    lado: "C",
    forca,
    potencial: forca + 5,
    caracteristicas: ["passe"],
    atributos: gerarAtributos({ semente: id, posicao: "M", forca }),
    estrela: false,
    base: false,
    clube: "clube",
    contrato: { fim, salario: 10_000 },
    aConferir: [],
  } as unknown as Jogador;
}

function mundo(): Mundo {
  const clube = { id: "clube", nomeCurto: "Clube", pais: "BRA", nivel: 70 } as unknown as Clube;
  const elenco = [
    jogador("jovem", "2006-05-01", 70, "2028-06-30"),
    jogador("veterano", "1993-05-01", 75, "2027-03-01"),
    jogador("velho", "1989-05-01", 70, "2028-06-30"),
  ];
  return {
    competicoes: [],
    competicao: () => undefined,
    clube: (id) => (id === "clube" ? clube : undefined),
    jogador: (id) => elenco.find((j) => j.id === id),
    elenco: (id) => (id === "clube" ? elenco : []),
    pais: (c) => (c === "BRA" ? BRASIL : undefined),
    clubesDoPais: () => [clube],
    datasFifa: [],
  };
}

function nova(m = mundo()): Carreira {
  return novaCarreira(m, {
    id: "c",
    semente: "s",
    tecnico: "T",
    clube: "clube",
    referencia: "2026-07-01",
    versaoBanco: "0",
  });
}

describe("lesões", () => {
  it("sorteia pela gravidade, a maioria leve, e conta a volta pela data", () => {
    const rng = new Rng("lesoes");
    const lista = Array.from({ length: 2000 }, () => sortearLesao(rng, "2027-03-01", "treino"));
    const leves = lista.filter((l) => l.dias <= 21).length / lista.length;
    expect(leves).toBeGreaterThan(0.5);
    expect(lista.some((l) => l.nome === TIPOS_DE_LESAO.at(-1)!.nome)).toBe(true);
    for (const l of lista.slice(0, 50)) {
      const tipo = TIPOS_DE_LESAO.find((t) => t.nome === l.nome)!;
      expect(l.dias).toBeGreaterThanOrEqual(tipo.dias[0]);
      expect(l.dias).toBeLessThanOrEqual(tipo.dias[1]);
    }
    const l = { nome: "Pancada", ate: "2027-03-05", dias: 4 };
    expect(lesionado({ lesao: l }, "2027-03-04")).toBe(true);
    expect(lesionado({ lesao: l }, "2027-03-05")).toBe(false);
  });
});

describe("contratos", () => {
  it("soma meses respeitando o fim do mês", () => {
    expect(somarMeses("2027-01-31", 1)).toBe("2027-02-28");
    expect(somarMeses("2027-06-30", 36)).toBe("2030-06-30");
    expect(somarMeses("2027-12-31", 6)).toBe("2028-06-30");
  });

  it("o jogador pede salário pela força; veterano renova por menos tempo; insatisfeito recusa", () => {
    const m = mundo();
    const c = nova(m);
    const jovem = propostaDeRenovacao(c, m, "jovem");
    expect(jovem.meses).toEqual([6, 12, 24, 36]);
    expect(jovem.salario).toBeGreaterThanOrEqual(10_500);
    const velho = propostaDeRenovacao(c, m, "velho");
    expect(velho.meses).toEqual([6, 12]);
    const triste = {
      ...c,
      jogadores: { ...c.jogadores, jovem: { ...c.jogadores.jovem!, moral: 10 } },
    };
    expect(propostaDeRenovacao(triste, m, "jovem").recusa).toBe("insatisfeito");
    // Renovado: novo fim e moral mais alta.
    const r = renovarContrato(c, m, "jovem", 24);
    expect(r.contratos?.jovem?.fim).toBe("2030-06-30");
    // Com mais de 2 anos pela frente, não renova de novo.
    expect(propostaDeRenovacao(r, m, "jovem").recusa).toBe("contrato-longo");
    expect(r.jogadores.jovem?.moral).toBeGreaterThan(60);
    expect(r.noticias[0]?.texto).toContain("renovou");
  });

  it("contrato que acabou: o jogador sai do clube; lesionado volta na data", () => {
    const m = mundo();
    const c = nova(m);
    const aviso = diaDoElenco(c, m, "2026-09-02", c.jogadores);
    expect(aviso.noticias.some((n) => n.texto.includes("termina em"))).toBe(true);
    const fim = diaDoElenco(c, m, "2027-03-02", c.jogadores);
    expect(fim.saidas).toEqual(["veterano"]);
    expect(fim.jogadores.veterano).toBeUndefined();
    const machucado = {
      ...c.jogadores,
      jovem: { ...c.jogadores.jovem!, lesao: { nome: "Pancada", ate: "2027-01-05", dias: 3 } },
    };
    const volta = diaDoElenco(c, m, "2027-01-05", machucado);
    expect(lesionado(volta.jogadores.jovem, "2027-01-05")).toBe(false);
    // A lesão fica guardada (para a recaída).
    expect(volta.jogadores.jovem?.lesao?.nome).toBe("Pancada");
    expect(volta.noticias.some((n) => n.texto.includes("recuperado"))).toBe(true);
  });
});

describe("minutos na virada", () => {
  it("jovem que jogou muito ganha força; jovem esquecido perde; veterano não muda", () => {
    const m = mundo();
    const c = nova(m);
    const jogaram = {
      ...c.jogadores,
      jovem: { ...c.jogadores.jovem!, minutos: 3000, moral: 80 },
      veterano: { ...c.jogadores.veterano!, minutos: 3000 },
      velho: { ...c.jogadores.velho!, minutos: 100 },
    };
    const r = minutosNaVirada(m, "clube", "2028-01-10", jogaram);
    expect(r.jovem?.ajuste).toBe(2);
    expect(r.veterano?.ajuste ?? 0).toBe(0);
    expect(r.jovem?.minutosNaVirada).toBe(3000);
    const esquecido = minutosNaVirada(m, "clube", "2028-01-10", {
      ...jogaram,
      jovem: { ...jogaram.jovem, minutos: 10 },
    });
    expect(esquecido.jovem?.ajuste).toBe(-1);
  });
});
