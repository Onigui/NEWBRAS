import { describe, expect, it } from "vitest";
import { Competicao, gerarAtributos, type DataFifa, type Jogador } from "@newbras/data";
import {
  diasDosAmistosos,
  janelaDaData,
  jogarAmistosos,
  jogosDeSelecoes,
  marcarAmistosos,
  selecoesDoMundo,
  type MundoParaAmistosos,
} from "./amistosos";
import { montarCompeticao } from "../competicoes/competicao";

const DATAS: DataFifa[] = [
  { nome: "Data FIFA de março", periodo: { inicio: "03-23", fim: "03-31" } },
  { nome: "Data FIFA de setembro e outubro", periodo: { inicio: "09-21", fim: "10-06" } },
  { nome: "Copa", periodo: { inicio: "06-11", fim: "07-20" }, anos: [2026] },
];

const SELECOES = ["AAA", "BBB", "CCC", "DDD", "EEE", "FFF", "GGG", "HHH"];

function elenco(pais: string, forca: number): Jogador[] {
  return (["G", "Z", "Z", "L", "L", "M", "M", "M", "M", "A", "A"] as const).map(
    (posicao, i) =>
      ({
        id: `${pais}-${i}`,
        nome: `${pais} ${i}`,
        nacionalidade: pais,
        posicao,
        forca,
        atributos: gerarAtributos({ semente: `${pais}-${i}`, posicao, forca }),
      }) as unknown as Jogador,
  );
}

/** Uma liga com 4 das 8 seleções, em turno único nos dias 25 e 28 de março. */
const liga = Competicao.parse({
  id: "liga",
  nome: "Liga",
  tipo: "eliminatorias",
  categoria: "selecoes",
  escopo: { tipo: "confederacao", confederacao: "UEFA" },
  calendario: { inicio: "03-20", fim: "03-31" },
  participantes: { fixos: ["AAA", "BBB", "CCC", "DDD"], quantidade: 4 },
  fases: [
    {
      id: "grupos",
      nome: "Grupos",
      tipo: "grupos",
      grupos: 1,
      turnos: 1,
      periodo: { inicio: "03-20", fim: "03-31" },
      datas: ["03-25", "03-28", "03-31"],
    },
  ],
});
const outra = Competicao.parse({
  ...liga,
  id: "outra",
  participantes: { fixos: ["EEE", "FFF", "GGG", "HHH"], quantidade: 4 },
  calendario: { inicio: "09-01", fim: "09-30" },
  fases: [{ ...liga.fases[0], periodo: { inicio: "09-01", fim: "09-30" }, datas: ["09-02"] }],
});

const elencos = new Map(SELECOES.map((s, i) => [s, elenco(s, 80 - i * 4)]));
const mundo: MundoParaAmistosos = {
  competicoes: [liga, outra],
  competicao: (id) => [liga, outra].find((c) => c.id === id),
  pais: (codigo) => ({ confederacao: codigo < "EEE" ? "UEFA" : "CAF" }),
  elenco: (id) => elencos.get(id) ?? [],
  datasFifa: DATAS,
};

describe("amistosos de seleções", () => {
  it("dias de amistoso: 2 em março, 4 em setembro e outubro; janela de torneio não conta", () => {
    expect(diasDosAmistosos("2027-03-23", "2027-03-31")).toEqual(["2027-03-24", "2027-03-29"]);
    expect(diasDosAmistosos("2026-09-21", "2026-10-06")).toHaveLength(4);
    expect(janelaDaData(DATAS, "2027-03-27")).toEqual({
      inicio: "2027-03-23",
      fim: "2027-03-31",
    });
    expect(janelaDaData(DATAS, "2026-06-20")).toBeUndefined();
    expect(janelaDaData(DATAS, "2027-04-02")).toBeUndefined();
    expect(selecoesDoMundo(mundo)).toEqual(SELECOES);
  });

  it("só quem não tem jogo oficial perto joga amistoso, uma vez por dia, e o mesmo não se repete", () => {
    const e = montarCompeticao(liga, liga.participantes.fixos, "2027-03-20", {
      datasFifa: [],
      semente: "s",
      temporada: "2027",
    });
    const competicoes = { liga: e };
    // 29/03: a liga joga no dia 28; só as 4 de fora podem jogar.
    const dia = marcarAmistosos(mundo, competicoes, [], "2027-03-29", "s");
    expect(dia.length).toBeGreaterThan(0);
    const times = dia.flatMap((a) => [a.casa, a.fora]);
    expect(new Set(times).size).toBe(times.length);
    expect(times.every((t) => ["EEE", "FFF", "GGG", "HHH"].includes(t))).toBe(true);
    expect(dia.every((a) => a.data === "2027-03-29")).toBe(true);
    // Já marcados: não marca de novo. Dia que não é de amistoso: nada.
    expect(marcarAmistosos(mundo, competicoes, dia, "2027-03-29", "s")).toEqual([]);
    expect(marcarAmistosos(mundo, competicoes, [], "2027-03-27", "s")).toEqual([]);
    // Jogado no dia: placar e autores dos gols do elenco da seleção.
    const jogados = jogarAmistosos(mundo, competicoes, dia, "2027-03-29", "s");
    for (const a of jogados) {
      expect(a.placar).toBeDefined();
      expect(a.gols![0]).toHaveLength(a.placar![0]);
      expect(a.gols![0].every((id) => id.startsWith(a.casa))).toBe(true);
    }
    const daEee = jogosDeSelecoes(mundo, competicoes, jogados, "EEE");
    expect(daEee.every((j) => !j.competicao)).toBe(true);
    expect(jogosDeSelecoes(mundo, competicoes, jogados, "AAA").every((j) => j.competicao)).toBe(
      true,
    );
  });

  it("amistoso perto de um jogo oficial marcado depois é cancelado", () => {
    const amistoso = { data: "2027-09-03", casa: "EEE", fora: "FFF" };
    const e = montarCompeticao(outra, outra.participantes.fixos, "2027-09-01", {
      datasFifa: [],
      semente: "s",
      temporada: "2027",
    });
    const r = jogarAmistosos(mundo, { outra: e }, [amistoso], "2027-09-03", "s");
    expect(r[0]?.cancelado).toBe(true);
    expect(r[0]?.placar).toBeUndefined();
  });
});
