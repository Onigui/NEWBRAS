import { describe, expect, it } from "vitest";
import {
  importarNoPatch,
  juntarPatches,
  moverDeLiga,
  novoId,
  patchVazio,
  removerClube,
  removerJogador,
  salvarClube,
  salvarJogador,
  slugId,
  totalDeEdicoes,
  transferirJogador,
} from "./editor";
import { bancoExemplo } from "./exemplo.test-utils";
import { aplicarPatch } from "./patch";
import { Banco } from "./schemas/banco";
import { validarIntegridade } from "./validacao";

const base = Banco.parse(bancoExemplo());
const vazio = () => patchVazio(base, "2026-11-25");
const [clubeA, clubeB] = base.clubes as [(typeof base.clubes)[0], (typeof base.clubes)[0]];
const doClube = (b: typeof base, id: string) => b.jogadores.filter((j) => j.clube === id);

describe("editor: patch sobre o banco", () => {
  it("o patch vazio não muda o banco", () => {
    const p = vazio();
    expect(p.meta.estende).toBe(base.meta.id);
    expect(aplicarPatch(base, p)).toEqual(base);
    expect(totalDeEdicoes(p)).toBe(0);
  });

  it("editar um clube substitui só ele", () => {
    const p = salvarClube(vazio(), { ...clubeA, nome: "Novo Nome" });
    const b = aplicarPatch(base, p);
    expect(b.clubes.find((c) => c.id === clubeA.id)!.nome).toBe("Novo Nome");
    expect(b.clubes).toHaveLength(base.clubes.length);
    expect(totalDeEdicoes(p)).toBe(1);
  });

  it("deletar um clube do banco libera os jogadores e tira dos rivais", () => {
    const p = removerClube(vazio(), clubeA.id, true);
    const b = aplicarPatch(base, p);
    expect(b.clubes.some((c) => c.id === clubeA.id)).toBe(false);
    expect(doClube(b, clubeA.id)).toHaveLength(0);
    expect(b.clubes.every((c) => !c.rivais.includes(clubeA.id))).toBe(true);
    expect(validarIntegridade(b).filter((x) => x.nivel === "erro")).toEqual([]);
  });

  it("deletar um clube criado no patch tira ele do patch", () => {
    const novo = { ...clubeA, id: "bra-novo", nome: "Novo" };
    const p = removerClube(salvarClube(vazio(), novo), novo.id, false);
    expect(p.clubes).toHaveLength(0);
    expect(p.remover.clubes).toHaveLength(0);
  });

  it("refazer um clube deletado tira ele da lista de remoção", () => {
    const p = salvarClube(removerClube(vazio(), clubeA.id, true), clubeA);
    expect(p.remover.clubes).toEqual([]);
    expect(aplicarPatch(base, p).clubes.some((c) => c.id === clubeA.id)).toBe(true);
  });

  it("transferir leva o jogador e tira o número ocupado", () => {
    const j = doClube(base, clubeA.id)[0]!;
    const ocupados = new Set(doClube(base, clubeB.id).flatMap((x) => (x.numero ? [x.numero] : [])));
    const p = transferirJogador(vazio(), j, clubeB.id, ocupados);
    const b = aplicarPatch(base, p);
    const movido = b.jogadores.find((x) => x.id === j.id)!;
    expect(movido.clube).toBe(clubeB.id);
    expect(movido.numero).toBeUndefined();
    expect(movido.contrato).toEqual(j.contrato);
  });

  it("transferir sem destino deixa o jogador livre e sem contrato", () => {
    const j = doClube(base, clubeA.id)[0]!;
    const movido = aplicarPatch(base, transferirJogador(vazio(), j, undefined)).jogadores.find(
      (x) => x.id === j.id,
    )!;
    expect(movido.clube).toBeUndefined();
    expect(movido.contrato).toBeUndefined();
  });

  it("deletar e recriar um jogador", () => {
    const j = doClube(base, clubeA.id)[0]!;
    let p = removerJogador(vazio(), j.id, true);
    expect(aplicarPatch(base, p).jogadores.some((x) => x.id === j.id)).toBe(false);
    p = salvarJogador(p, j);
    expect(p.remover.jogadores).toEqual([]);
  });

  it("planilha e patch de terceiros entram por cima", () => {
    const p1 = importarNoPatch(vazio(), { clubes: [{ ...clubeB, nome: "Planilha" }] });
    const terceiro = removerClube(
      salvarClube(vazio(), { ...clubeB, nome: "Terceiro" }),
      clubeA.id,
      true,
    );
    const p = juntarPatches(p1, terceiro);
    const b = aplicarPatch(base, p);
    expect(b.clubes.find((c) => c.id === clubeB.id)!.nome).toBe("Terceiro");
    expect(b.clubes.some((c) => c.id === clubeA.id)).toBe(false);
  });
});

describe("editor: liga do clube", () => {
  it("tira de uma liga e põe em outra", () => {
    const serieA = base.competicoes.find((c) => c.id === "bra-serie-a")!;
    const fora = moverDeLiga(vazio(), [serieA], clubeA.id, undefined);
    expect(
      aplicarPatch(base, fora).competicoes.find((c) => c.id === "bra-serie-a")!.participantes.fixos,
    ).not.toContain(clubeA.id);
    const volta = moverDeLiga(
      fora,
      aplicarPatch(base, fora).competicoes.filter((c) => c.id === "bra-serie-a"),
      clubeA.id,
      "bra-serie-a",
    );
    expect(
      aplicarPatch(base, volta).competicoes.find((c) => c.id === "bra-serie-a")!.participantes
        .fixos,
    ).toContain(clubeA.id);
  });
});

describe("editor: ids", () => {
  it("gera ids legíveis e livres", () => {
    expect(slugId("São Paulo FC")).toBe("sao-paulo-fc");
    const usados = new Set(["bra-novo-clube", "bra-novo-clube-2"]);
    expect(novoId("bra", "Novo Clube", (id) => usados.has(id))).toBe("bra-novo-clube-3");
    expect(novoId("BRA", "!!!", () => false)).toBe("bra-novo");
  });
});
