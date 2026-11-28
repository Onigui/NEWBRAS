import { describe, expect, it } from "vitest";
import { gerarAtributos, type Clube, type Jogador, type Pais } from "@newbras/data";
import type { ResultadoPartida } from "../partida/tipos";
import { salarioBase } from "../gerador/jogador";
import { novaCarreira, estadoDe, type Carreira, type Compromisso, type Mundo } from "./carreira";
import { moralDe } from "../elenco/vida";
import {
  capitaoDe,
  escolherCapitao,
  lideranca,
  pedeAumento,
  salarioDeMercado,
  torcidaDe,
} from "./vestiario";
import {
  conversasDepoisDoJogo,
  diaDaDiretoria,
  diretoriaDe,
  responderConversa,
  type Conversa,
} from "./conversas";

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

const resultado = (time: "casa" | "fora", jogaram: [string, number][], placar: [number, number]) =>
  ({
    placar,
    eventos: [],
    jogadores: jogaram.map(([id, minutos]) => ({ id, time, minutos, nota: 6, gols: 0 })),
  }) as unknown as ResultadoPartida;

const jogo = (id: string, data: string, tipo: "oficial" | "amistoso" = "oficial"): Compromisso =>
  ({ id, data, tipo, adversario: "rico", mando: "casa" }) as Compromisso;

describe("conversas com os jogadores", () => {
  it("quem quer jogar e recebe a promessa fica feliz; promessa quebrada derruba a moral", () => {
    const m = mundo();
    const conversa: Conversa = {
      id: "c1",
      tipo: "quer-jogar",
      jogador: "n3",
      data: "2027-02-01",
      prazo: "2027-02-08",
    };
    let c: Carreira = { ...nova(m), data: "2027-02-02", conversas: [conversa] };
    const antes = moralDe(estadoDe(c, "n3"));
    c = responderConversa(c, m, "c1", "prometer-minutos");
    expect(c.conversas).toEqual([]);
    expect(moralDe(estadoDe(c, "n3"))).toBe(antes + 8);
    expect(c.promessas?.[0]).toMatchObject({ jogador: "n3", tipo: "minutos" });
    // Cinco jogos oficiais sem jogar: promessa quebrada.
    for (let i = 0; i < 5; i++) {
      const x = jogo(`j${i}`, `2027-02-1${i}`);
      c = conversasDepoisDoJogo(c, c, m, x, resultado("casa", [["n0", 90]], [1, 0])).carreira;
    }
    expect(c.promessas).toEqual([]);
    expect(moralDe(estadoDe(c, "n3"))).toBe(antes + 8 - 20);
    expect(c.noticias.some((n) => n.texto.includes("se sente enganado"))).toBe(true);
  });

  it("o lesionado sabe da condição: não conta jogo na promessa e não pede para jogar", () => {
    const m = mundo();
    const lesao = { nome: "Lesão muscular", ate: "2027-03-30", dias: 30 };
    const promessa = {
      jogador: "n3",
      tipo: "minutos" as const,
      feita: "2027-02-01",
      jogos: 0,
      jogou: 0,
    };
    let c: Carreira = {
      ...nova(m),
      promessas: [promessa],
      jogadores: { ...nova(m).jogadores, n3: { ...estadoDe(nova(m), "n3"), lesao, semJogar: 9 } },
    };
    for (let i = 0; i < 5; i++)
      c = conversasDepoisDoJogo(
        c,
        c,
        m,
        jogo(`j${i}`, `2027-02-1${i}`),
        resultado("casa", [["n0", 90]], [1, 0]),
      ).carreira;
    // A promessa espera a volta dele, e ele não abre conversa de minutos.
    expect(c.promessas).toEqual([promessa]);
    expect((c.conversas ?? []).some((x) => x.jogador === "n3")).toBe(false);
    // Conversa de minutos aberta antes da lesão sai da lista.
    const conversa: Conversa = {
      id: "c9",
      tipo: "quer-jogar",
      jogador: "n3",
      data: "2027-02-20",
      prazo: "2027-02-27",
    };
    const r = diaDaDiretoria({ ...c, conversas: [conversa] }, m, "2027-02-21");
    expect(r.carreira.conversas).toEqual([]);
  });

  it("promessa cumprida: jogou 2 dos jogos seguintes", () => {
    const m = mundo();
    let c: Carreira = {
      ...nova(m),
      promessas: [{ jogador: "n3", tipo: "minutos", feita: "2027-02-01", jogos: 0, jogou: 0 }],
    };
    const antes = moralDe(estadoDe(c, "n3"));
    for (let i = 0; i < 2; i++)
      c = conversasDepoisDoJogo(
        c,
        c,
        m,
        jogo(`j${i}`, `2027-02-1${i}`),
        resultado("casa", [["n3", 30]], [1, 0]),
      ).carreira;
    expect(c.promessas).toEqual([]);
    expect(moralDe(estadoDe(c, "n3"))).toBe(antes + 10);
  });

  it("quer sair: pôr à venda vira promessa; tirar da lista depois é traição", () => {
    const m = mundo();
    let c: Carreira = {
      ...nova(m),
      data: "2027-02-02",
      conversas: [
        { id: "s", tipo: "quer-sair", jogador: "n1", data: "2027-02-01", prazo: "2027-02-08" },
      ],
    };
    c = responderConversa(c, m, "s", "negociar");
    expect(c.aVenda).toContain("n1");
    const moral = moralDe(estadoDe(c, "n1"));
    c = { ...c, aVenda: [] };
    c = diaDaDiretoria(c, m, "2027-02-03").carreira;
    expect(moralDe(estadoDe(c, "n1"))).toBe(moral - 15);
    expect(c.promessas).toEqual([]);
  });

  it("quem joga cansado reclama; sem resposta no prazo, se sente ignorado", () => {
    const m = mundo();
    const base: Carreira = {
      ...nova(m),
      jogadores: { n2: { ...estadoDe(nova(m), "n2"), condicao: 60 } },
    };
    let achou: Carreira | undefined;
    for (let i = 0; i < 30 && !achou; i++) {
      const r = conversasDepoisDoJogo(
        base,
        base,
        m,
        jogo(`k${i}`, "2027-02-10"),
        resultado("casa", [["n2", 90]], [0, 0]),
      );
      if (r.nova) achou = r.carreira;
    }
    expect(achou?.conversas?.[0]).toMatchObject({
      tipo: "cansado",
      jogador: "n2",
      params: { condicao: 60 },
    });
    const moral = moralDe(estadoDe(achou!, "n2"));
    const depois = diaDaDiretoria(achou!, m, "2027-02-18").carreira;
    expect(depois.conversas).toEqual([]);
    expect(moralDe(estadoDe(depois, "n2"))).toBe(moral - 10);
  });
});

describe("diretoria", () => {
  it("resultados mexem na confiança; abaixo de 40 cobra, abaixo de 25 dá ultimato", () => {
    const m = mundo();
    let c = nova(m);
    c = conversasDepoisDoJogo(
      c,
      c,
      m,
      jogo("d1", "2027-02-10"),
      resultado("casa", [], [0, 2]),
    ).carreira;
    expect(c.diretoria?.confianca).toBe(58);
    c = conversasDepoisDoJogo(
      c,
      c,
      m,
      jogo("d2", "2027-02-12"),
      resultado("casa", [], [2, 0]),
    ).carreira;
    // Vitória sobre um clube bem mais forte vale mais.
    expect(c.diretoria?.confianca).toBe(62);
    const cobra = diaDaDiretoria({ ...c, diretoria: { confianca: 35 } }, m, "2027-03-02");
    expect(cobra.decisao).toBe(true);
    expect(cobra.carreira.conversas?.[0]?.tipo).toBe("diretoria-cobra");
    const ultimato = diaDaDiretoria({ ...c, diretoria: { confianca: 20 } }, m, "2027-03-02");
    expect(ultimato.carreira.conversas?.[0]?.tipo).toBe("diretoria-ultimato");
    // Não repete no dia seguinte.
    expect(diaDaDiretoria(cobra.carreira, m, "2027-03-03").decisao).toBe(false);
  });
});

describe("vestiário e imprensa (etapa 15d)", () => {
  it("aumento: dado, o salário vai ao mercado; negado, a moral cai e ele não pede de novo logo", () => {
    const m = mundo();
    const conv: Conversa = {
      id: "a1",
      tipo: "pede-aumento",
      jogador: "n9",
      data: "2027-02-01",
      prazo: "2027-02-08",
    };
    const c: Carreira = {
      ...nova(m),
      data: "2027-02-02",
      contratos: { n9: { fim: "2029-12-31", salario: 1000 } },
      conversas: [conv],
    };
    const dado = responderConversa(c, m, "a1", "dar-aumento");
    expect(dado.contratos?.n9?.salario).toBe(salarioDeMercado(m.jogador("n9")!));
    expect(dado.contratos?.n9?.fim).toBe("2029-12-31");
    expect(moralDe(estadoDe(dado, "n9"))).toBe(moralDe(estadoDe(c, "n9")) + 10);
    const negado = responderConversa(c, m, "a1", "negar-aumento");
    expect(moralDe(estadoDe(negado, "n9"))).toBe(moralDe(estadoDe(c, "n9")) - 12);
    expect(pedeAumento(negado, m, m.jogador("n9")!, true)).toBe(false);
    expect(pedeAumento(c, m, m.jogador("n9")!, true)).toBe(true);
  });

  it("capitão: a braçadeira passa e o antigo capitão fica chateado", () => {
    const m = mundo();
    const c = nova(m);
    const antigo = capitaoDe(c, m)!;
    const novo = antigo === "n1" ? "n2" : "n1";
    const r = escolherCapitao(c, m, novo);
    expect(capitaoDe(r, m)).toBe(novo);
    expect(moralDe(estadoDe(r, novo))).toBe(moralDe(estadoDe(c, novo)) + 10);
    expect(moralDe(estadoDe(r, antigo))).toBe(moralDe(estadoDe(c, antigo)) - 8);
    // A liderança é a mesma em qualquer carreira.
    expect(lideranca(m.jogador("n1")!, "2027-01-01")).toBe(
      lideranca(m.jogador("n1")!, "2027-01-01"),
    );
  });

  it("briga: punir um anima o elenco; deixar para lá derruba a moral do time", () => {
    const m = mundo();
    const conv: Conversa = {
      id: "b1",
      tipo: "briga",
      jogador: "n3",
      outro: "n4",
      data: "2027-02-01",
      prazo: "2027-02-08",
    };
    const c: Carreira = { ...nova(m), data: "2027-02-02", conversas: [conv] };
    const punido = responderConversa(c, m, "b1", "punir-primeiro");
    expect(moralDe(estadoDe(punido, "n3"))).toBe(moralDe(estadoDe(c, "n3")) - 10);
    expect(moralDe(estadoDe(punido, "n4"))).toBe(moralDe(estadoDe(c, "n4")) + 3);
    expect(punido.moral).toBe(c.moral + 3);
    expect(responderConversa(c, m, "b1", "deixar-briga").moral).toBe(c.moral - 6);
  });

  it("imprensa: a provocação que dá errado custa torcida e diretoria", () => {
    const m = mundo();
    const conv: Conversa = {
      id: "i1",
      tipo: "imprensa-antes",
      data: "2027-02-10",
      prazo: "2027-02-10",
      jogo: "j0",
      adversario: "rico",
    };
    let c: Carreira = { ...nova(m), data: "2027-02-10", conversas: [conv] };
    c = responderConversa(c, m, "i1", "provocador");
    expect(c.entrevista).toEqual({ jogo: "j0", tom: "provocador" });
    const torcida = torcidaDe(c);
    const confianca = diretoriaDe(c).confianca;
    const depois = conversasDepoisDoJogo(
      c,
      c,
      m,
      jogo("j0", "2027-02-10"),
      resultado("casa", [["n0", 90]], [0, 2]),
    ).carreira;
    expect(depois.entrevista).toBeUndefined();
    // Derrota (−2) e a provocação que deu errado (−6).
    expect(torcidaDe(depois)).toBeLessThanOrEqual(torcida - 8);
    expect(diretoriaDe(depois).confianca).toBeLessThan(confianca);
    // A derrota por 2 gols chama a imprensa (às vezes) e a conversa tem o placar.
    const coletiva = depois.conversas?.find((x) => x.tipo === "imprensa-derrota");
    if (coletiva) expect(coletiva.params).toEqual({ pro: 0, contra: 2 });
  });

  it("três jogos fora da posição: ele reclama; a promessa quebra se jogar fora de novo", () => {
    const m = mundo();
    const vagas = Array.from({ length: 11 }, (_, i) => ({
      posicao: i === 0 ? "G" : "M",
      lado: "C",
      x: 10 + i * 5,
      y: 34,
    }));
    // O n5 é meia e joga de goleiro.
    const titulares = ["n5", "n1", "n2", "n3", "n4", "n0", "n6", "n7", "n8", "n9", "n10"];
    let c: Carreira = {
      ...nova(m),
      escalacao: {
        formacao: "personalizada",
        vagas,
        titulares,
        reservas: [],
        papeis: titulares.map(() => null),
      } as never,
    };
    for (let i = 0; i < 3; i++)
      c = conversasDepoisDoJogo(
        c,
        c,
        m,
        jogo(`j${i}`, `2027-02-1${i}`),
        resultado(
          "casa",
          titulares.map((id) => [id, 90] as [string, number]),
          [1, 0],
        ),
      ).carreira;
    expect(c.foraDaPosicao?.n5).toBe(3);
    c = {
      ...c,
      conversas: [
        { id: "p1", tipo: "posicao", jogador: "n5", data: "2027-02-13", prazo: "2027-02-20" },
      ],
    };
    c = responderConversa(c, m, "p1", "volta-posicao");
    expect(c.foraDaPosicao?.n5).toBeUndefined();
    expect(c.promessas?.[0]).toMatchObject({ jogador: "n5", tipo: "posicao" });
    const antes = moralDe(estadoDe(c, "n5"));
    c = conversasDepoisDoJogo(
      c,
      c,
      m,
      jogo("j9", "2027-02-19"),
      resultado(
        "casa",
        titulares.map((id) => [id, 90] as [string, number]),
        [1, 0],
      ),
    ).carreira;
    expect(c.promessas).toEqual([]);
    expect(moralDe(estadoDe(c, "n5"))).toBe(antes - 15);
  });
});
