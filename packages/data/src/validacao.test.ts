import { describe, expect, it } from "vitest";
import { bancoExemplo, elencoExemplo } from "./exemplo.test-utils";
import { aplicarPatch } from "./patch";
import { Banco, Patch } from "./schemas/banco";
import { elencoValido, lerBanco, validarIntegridade } from "./validacao";

describe("lerBanco", () => {
  it("aceita o banco de exemplo sem erros nem avisos", () => {
    const r = lerBanco(bancoExemplo());
    expect(r.ok).toBe(true);
    expect(r.problemas).toEqual([]);
  });

  it("aponta onde está o erro de esquema, usando o id do item", () => {
    const dados = bancoExemplo();
    dados.clubes![0]!.abreviacao = "santos";
    const r = lerBanco(dados);
    expect(r.ok).toBe(false);
    expect(r.problemas[0]!.onde).toBe("clubes > bra-santos > abreviacao");
  });
});

describe("validarIntegridade", () => {
  const problemas = (mexer: (b: ReturnType<typeof bancoExemplo>) => void) => {
    const dados = bancoExemplo();
    mexer(dados);
    return validarIntegridade(Banco.parse(dados));
  };

  it("não deixa a equipe B jogar a mesma divisão do clube principal", () => {
    const p = problemas((b) => {
      const [a, c] = b.clubes!;
      c!.filialDe = a!.id;
    });
    expect(p.some((x) => x.nivel === "erro" && x.mensagem.includes("é filial de"))).toBe(true);
  });

  it("detecta jogador em clube que não existe", () => {
    const p = problemas((b) => {
      b.jogadores![0]!.clube = "bra-inexistente";
    });
    expect(p.some((x) => x.nivel === "erro" && x.mensagem.includes("bra-inexistente"))).toBe(true);
  });

  it("avisa quando o time fica inválido (menos de 11 jogadores de linha)", () => {
    const p = problemas((b) => {
      b.jogadores = b.jogadores!.filter((j) => j.clube !== "bra-santos" || j.posicao === "G");
    });
    expect(p).toContainEqual(
      expect.objectContaining({ nivel: "aviso", onde: "clubes > bra-santos" }),
    );
  });

  it("detecta estado inexistente, id repetido e vaga de competição inexistente", () => {
    const p = problemas((b) => {
      b.clubes![0]!.estado = "MG";
      b.clubes!.push({ ...b.clubes![1]! });
      b.competicoes![1]!.participantes.vagas = [{ de: "bra-copa", criterio: "campeao" }];
    });
    const msgs = p.map((x) => x.mensagem).join(" | ");
    expect(msgs).toContain("estado MG não existe");
    expect(msgs).toContain("identificador repetido");
    expect(msgs).toContain("bra-copa");
  });

  it("avisa sobre camisa repetida e rival inexistente", () => {
    const p = problemas((b) => {
      b.jogadores![1]!.numero = 1;
      b.clubes![1]!.rivais = ["bra-vasco"];
    });
    const msgs = p.map((x) => x.mensagem).join(" | ");
    expect(msgs).toContain("camisa 1 repetida");
    expect(msgs).toContain("rival bra-vasco");
  });
});

describe("elencoValido", () => {
  it("segue a regra do Brasfoot: 1 goleiro e 11 de linha", () => {
    const elenco = elencoExemplo("x", "BRA");
    expect(elencoValido(elenco)).toBe(true);
    expect(elencoValido(elenco.filter((j) => j.posicao !== "G"))).toBe(false);
    expect(elencoValido(elenco.slice(0, 12))).toBe(false);
  });
});

describe("aplicarPatch", () => {
  it("substitui, acrescenta e remove; jogadores de clube removido ficam livres", () => {
    const banco = Banco.parse(bancoExemplo());
    const patch = Patch.parse({
      formato: 1,
      meta: {
        id: "fulano/ajustes",
        nome: "Ajustes",
        versao: "1.0.0",
        atualizadoEm: "2026-11-23",
        estende: "newbras/exemplo",
      },
      remover: { clubes: ["bra-santos"] },
      clubes: [{ ...banco.clubes[1]!, nivel: 80 }],
      jogadores: [{ ...banco.jogadores[0]!, id: "novo-jogador", clube: "bra-flamengo" }],
    });
    const novo = aplicarPatch(banco, patch);

    expect(novo.clubes.map((c) => c.id)).toEqual(["bra-flamengo"]);
    expect(novo.clubes[0]!.nivel).toBe(80);
    expect(novo.jogadores.find((j) => j.id === "novo-jogador")?.clube).toBe("bra-flamengo");
    const exSantos = novo.jogadores.find((j) => j.id === "bra-santos-j1")!;
    expect(exSantos.clube).toBeUndefined();
    expect(exSantos.contrato).toBeUndefined();
    expect(novo.tecnicos[0]!.clube).toBeUndefined();
    // O banco original não muda.
    expect(banco.clubes).toHaveLength(2);
  });
});
