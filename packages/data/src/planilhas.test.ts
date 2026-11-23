import { describe, expect, it } from "vitest";
import { detectarSeparador, escreverCsv, lerCsv } from "./csv";
import { bancoExemplo } from "./exemplo.test-utils";
import {
  exportarClubesCsv,
  exportarJogadoresCsv,
  importarClubesCsv,
  importarJogadoresCsv,
} from "./planilhas";
import { Banco } from "./schemas/banco";

describe("CSV", () => {
  it("lê aspas, aspas duplas, quebras de linha e BOM", () => {
    const texto = '\uFEFFnome,obs\n"Silva, J.","disse ""oi""\nem duas linhas"\n';
    expect(lerCsv(texto)).toEqual([
      ["nome", "obs"],
      ["Silva, J.", 'disse "oi"\nem duas linhas'],
    ]);
  });

  it("detecta ponto e vírgula, separador do Excel em português", () => {
    expect(detectarSeparador("id;nome\n1;Zico")).toBe(";");
    expect(detectarSeparador("id,nome\n1,Zico")).toBe(",");
  });

  it("escreve e lê de volta sem perder nada", () => {
    const linhas = [
      ["a", 'b "c"', "d;e"],
      ["1", "", "x\ny"],
    ];
    expect(lerCsv(escreverCsv(linhas, ";"), ";")).toEqual(linhas.map((l) => l));
  });
});

describe("planilha de jogadores", () => {
  it("exporta e importa de volta os mesmos jogadores", () => {
    const banco = Banco.parse(bancoExemplo());
    const csv = exportarJogadoresCsv(banco.jogadores, ";");
    const r = importarJogadoresCsv(csv);
    expect(r.problemas).toEqual([]);
    expect(r.itens).toEqual(banco.jogadores);
  });

  it("entende nomes em português, datas dd/mm/aaaa e acentos", () => {
    const csv = [
      "id;nome;nascimento;nacionalidade;posicao;lado;forca;potencial;caracteristica_1;caracteristica_2;estrela;clube",
      "bra-zico;Zico;03/03/1953;bra;Meia;;95;;Armação;Finalização;sim;",
      "bra-taffarel;Taffarel;08/05/1966;BRA;Goleiro;;88;90;Defesa de pênalti;reflexo;não;",
    ].join("\n");
    const r = importarJogadoresCsv(csv);
    expect(r.problemas).toEqual([]);
    expect(r.itens[0]).toMatchObject({
      nascimento: "1953-03-03",
      nacionalidade: "BRA",
      posicao: "M",
      lado: "C",
      potencial: 95,
      caracteristicas: ["armacao", "finalizacao"],
      estrela: true,
    });
    expect(r.itens[1]!.caracteristicas).toEqual(["penalti", "reflexo"]);
  });

  it("aponta a linha da planilha com problema e importa as outras", () => {
    const csv = [
      "id,nome,nascimento,nacionalidade,posicao,lado,forca,potencial,caracteristica_1",
      "ok-1,Bom,2001-01-01,BRA,A,C,60,70,finalizacao",
      "ruim-1,Ruim,2001-01-01,BRA,A,C,90,70,finalizacao",
    ].join("\n");
    const r = importarJogadoresCsv(csv);
    expect(r.itens).toHaveLength(1);
    expect(r.problemas[0]!.onde).toMatch(/^linha 3/);
  });
});

describe("planilha de clubes", () => {
  it("exporta e importa de volta os mesmos clubes, com rivais separados por |", () => {
    const banco = Banco.parse(bancoExemplo());
    const csv = exportarClubesCsv(banco.clubes);
    expect(csv).toContain("bra-flamengo");
    const r = importarClubesCsv(csv);
    expect(r.problemas).toEqual([]);
    expect(r.itens).toEqual(banco.clubes);
  });
});
