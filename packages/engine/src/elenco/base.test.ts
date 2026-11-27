import { describe, expect, it } from "vitest";
import { gerarAtributos, type Clube, type Jogador, type Pais } from "@newbras/data";
import { novaCarreira, type Carreira, type Mundo } from "../carreira/carreira";
import { Rng } from "../rng";
import {
  BASE_MAXIMA,
  baseDe,
  contratarOlheiro,
  contratarProspecto,
  diaDaBase,
  enviarOlheiro,
  faixaDoOlheiro,
  jogadorDaBaseNaData,
  olheirosDisponiveis,
  podePromover,
  promover,
} from "./base";
import { mundoNaData } from "./mundo";

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

function jogador(id: string, nascimento: string, forca: number, base = false): Jogador {
  return {
    id,
    nome: id,
    nascimento,
    nacionalidade: "BRA",
    posicao: "M",
    lado: "C",
    forca,
    potencial: forca + 15,
    caracteristicas: ["passe"],
    atributos: gerarAtributos({ semente: id, posicao: "M", forca }),
    estrela: false,
    base,
    clube: "clube",
    aConferir: [],
  } as unknown as Jogador;
}

function mundo(): Mundo {
  const clube = { id: "clube", nomeCurto: "Clube", pais: "BRA", nivel: 70 } as unknown as Clube;
  const elenco = Array.from({ length: 20 }, (_, i) => jogador(`p${i}`, "1998-01-01", 70));
  const base = [
    jogador("garoto", "2010-03-01", 50, true),
    jogador("quase20", "2007-02-01", 55, true),
  ];
  return {
    competicoes: [],
    competicao: () => undefined,
    clube: (id) => (id === "clube" ? clube : undefined),
    jogador: (id) => [...elenco, ...base].find((j) => j.id === id),
    elenco: (id) => (id === "clube" ? elenco : []),
    base: (id) => (id === "clube" ? base : []),
    pais: (c) => (c === "BRA" ? BRASIL : undefined),
    clubesDoPais: () => [clube],
    datasFifa: [],
  };
}

const nova = (m: Mundo): Carreira =>
  novaCarreira(m, {
    id: "c",
    semente: "s",
    tecnico: "T",
    clube: "clube",
    referencia: "2026-07-01",
    versaoBanco: "0",
  });

describe("categoria de base", () => {
  it("começa com a base do banco; o garoto cresce pela curva", () => {
    const m = mundo();
    const c = nova(m);
    const base = baseDe(c, m);
    expect(base.jogadores.map((b) => b.j.id)).toEqual(["garoto", "quase20"]);
    const g = base.jogadores[0]!;
    expect(jogadorDaBaseNaData(g, "2029-01-10").forca).toBeGreaterThan(g.j.forca);
  });

  it("faixa do olheiro: contém o potencial e estreita com o nível", () => {
    const rng = new Rng("faixa");
    for (let nivel = 1; nivel <= 5; nivel++)
      for (let i = 0; i < 50; i++) {
        const [a, b] = faixaDoOlheiro(rng, 80, nivel);
        expect(a).toBeLessThanOrEqual(80);
        expect(b).toBeGreaterThanOrEqual(80);
        expect(b - a).toBeLessThanOrEqual(2 * Math.max(1, 9 - 2 * nivel));
      }
  });

  it("olheiro contratado e enviado manda relatórios; o garoto vem para a base", () => {
    const m = mundo();
    let c = nova(m);
    const disponiveis = olheirosDisponiveis(c, m);
    expect(disponiveis).toHaveLength(3);
    expect(olheirosDisponiveis(c, m)).toEqual(disponiveis);
    c = contratarOlheiro(c, m, disponiveis[0]!.id);
    c = enviarOlheiro(c, m, disponiveis[0]!.id, "BRA", 3);
    expect(c.base?.olheiros[0]?.missao?.pais).toBe("BRA");
    let relatorios = 0;
    for (let d = 1; d <= 90; d++) {
      const data = new Date(Date.parse(`${c.data}T00:00:00Z`) + 86_400_000)
        .toISOString()
        .slice(0, 10);
      const r = diaDaBase({ ...c, data }, m, data, false);
      c = { ...c, data, ...(r.base ? { base: r.base } : {}) };
      relatorios = Math.max(relatorios, c.base?.relatorios.length ?? 0);
    }
    expect(relatorios).toBeGreaterThan(0);
    const r = c.base!.relatorios[0] ?? c.base!.relatorios.at(-1);
    if (r) {
      expect(r.faixa[0]).toBeLessThanOrEqual(r.potencialReal);
      expect(r.faixa[1]).toBeGreaterThanOrEqual(r.potencialReal);
      const antes = baseDe(c, m).jogadores.length;
      c = contratarProspecto(c, m, r.id);
      expect(baseDe(c, m).jogadores.length).toBe(antes + 1);
    }
  });

  it("promoção a partir dos 16: entra no elenco com contrato; aos 20 sai; a peneira traz garotos", () => {
    const m = mundo();
    let c = nova(m);
    expect(podePromover(c, m, "garoto")).toBe(true);
    c = promover(c, m, "garoto");
    expect(baseDe(c, m).jogadores.map((b) => b.j.id)).toEqual(["quase20"]);
    expect(c.contratos?.garoto).toBeDefined();
    const elenco = mundoNaData(m, c, c.data).elenco("clube");
    expect(elenco.some((j) => j.id === "garoto")).toBe(true);
    expect(elenco.find((j) => j.id === "garoto")?.base).toBe(false);
    // Aos 20, quem não subiu é dispensado.
    const dispensa = diaDaBase(c, m, "2027-02-02", false);
    expect(dispensa.base?.jogadores.some((b) => b.j.id === "quase20")).toBe(false);
    // Peneira na virada: 2 a 4 garotos de 15 e 16 anos.
    const peneira = diaDaBase(c, m, "2028-01-10", true);
    const novos = peneira.base!.jogadores.filter((b) => b.origem === "peneira");
    expect(novos.length).toBeGreaterThanOrEqual(2);
    expect(novos.length).toBeLessThanOrEqual(Math.min(4, BASE_MAXIMA));
  });
});
