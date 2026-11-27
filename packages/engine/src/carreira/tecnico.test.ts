import { describe, expect, it } from "vitest";
import { gerarAtributos, type Clube, type Jogador, type Pais } from "@newbras/data";
import { salarioBase } from "../gerador/jogador";
import { caixaDaCpu } from "../financas/financas";
import { novaCarreira, type Carreira, type Mundo } from "./carreira";
import { diaDaDiretoria } from "./conversas";
import {
  aceitarConvite,
  convitesDeEmprego,
  perfilDe,
  resultadoNaCarreira,
  titulosNaCarreira,
} from "./tecnico";

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

describe("reputação do técnico", () => {
  it("começa pelo tamanho do clube; resultados e títulos contam", () => {
    const m = mundo();
    let c = nova(m);
    expect(perfilDe(c, m).reputacao).toBe(50);
    c = resultadoNaCarreira(c, m, 2, 0);
    c = resultadoNaCarreira(c, m, 0, 1);
    expect(c.perfil?.passagens[0]).toMatchObject({ jogos: 2, vitorias: 1, derrotas: 1 });
    c = titulosNaCarreira(c, m, "2027-12-10", [{ competicao: "liga", campeao: "nosso" }]);
    expect(c.perfil?.reputacao).toBeCloseTo(58.1, 1);
    expect(c.perfil?.passagens[0]?.titulos).toEqual(["Liga"]);
  });
});

describe("demissão e convites", () => {
  it("confiança abaixo de 10: demitido, com convites de clubes menores; aceitar troca de clube", () => {
    const m = mundo();
    const c: Carreira = {
      ...nova(m),
      caixa: 5_000_000,
      diretoria: { confianca: 5 },
      promovidos: [],
      aVenda: ["n1"],
    };
    const r = diaDaDiretoria(c, m, "2027-03-02");
    expect(r.decisao).toBe(true);
    const p = r.carreira.perfil!;
    expect(p.demitido?.clube).toBe("nosso");
    expect(p.reputacao).toBe(44);
    expect(p.convites?.length).toBeGreaterThan(0);
    expect(p.convites!.every((x) => (m.clube(x.clube)?.nivel ?? 99) < 75)).toBe(true);
    const novo = aceitarConvite(r.carreira, m, p.convites![0]!.id);
    expect(novo.clube).toBe(p.convites![0]!.clube);
    expect(novo.perfil?.demitido).toBeUndefined();
    expect(novo.perfil?.passagens.map((x) => x.motivo)).toEqual(["demitido", undefined]);
    expect(novo.caixasCpu?.nosso).toBe(5_000_000);
    expect(novo.caixa).toBe(caixaDaCpu(c, m, novo.clube));
    expect(novo.aVenda).toBeUndefined();
    expect(novo.agenda).toEqual([]);
  });

  it("quem vai bem recebe convite de clube maior, até onde a reputação alcança", () => {
    const m = mundo();
    const base: Carreira = { ...nova(m), diretoria: { confianca: 85 } };
    const fraco = { ...base, perfil: { ...perfilDe(base, m), reputacao: 40 } };
    const forte = { ...base, perfil: { ...perfilDe(base, m), reputacao: 90 } };
    let convite;
    for (let i = 1; i <= 24 && !convite; i++) {
      const data = `${2027 + Math.floor((i - 1) / 12)}-${String(((i - 1) % 12) + 1).padStart(2, "0")}-01`;
      expect(
        convitesDeEmprego({ ...fraco, data }, m, data).carreira.perfil?.convites ?? [],
      ).toEqual([]);
      convite = convitesDeEmprego({ ...forte, data }, m, data).carreira.perfil?.convites?.[0];
    }
    expect(convite?.clube).toBe("rico");
  });
});
