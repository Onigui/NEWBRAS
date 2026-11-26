import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { chavesDoCodigo, textosSoltos } from "../scripts/chaves";
import { IDIOMAS, catalogo, preencher, traduzir } from "./index";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const codigo = chavesDoCodigo(raiz);
const marcas = (texto: string) => [...texto.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("textos da interface", () => {
  it("todo texto da interface passa pelo t() (nada escrito direto no JSX)", () => {
    expect(textosSoltos(raiz)).toEqual([]);
    expect(codigo.problemas).toEqual([]);
  });

  it("os catálogos têm exatamente as chaves do código (rode o extrair se mudou um texto)", () => {
    const chaves = [...codigo.chaves].sort();
    for (const { codigo: idioma } of IDIOMAS) {
      if (idioma === "pt-BR") continue;
      expect(Object.keys(catalogo(idioma)).sort(), idioma).toEqual(chaves);
    }
  });

  it("cada tradução tem as mesmas partes variáveis do português", () => {
    for (const { codigo: idioma } of IDIOMAS) {
      if (idioma === "pt-BR") continue;
      for (const [chave, texto] of Object.entries(catalogo(idioma)))
        if (texto) expect(marcas(texto), `${idioma}: ${chave}`).toEqual(marcas(chave));
    }
  });

  it("sem tradução, o texto aparece em português, com as partes preenchidas", () => {
    expect(traduzir("en", "Ir até o próximo jogo ({dias} dias)", { dias: 3 })).toBe(
      "Ir até o próximo jogo (3 dias)",
    );
    expect(preencher("{a} x {b}", { a: 2 })).toBe("2 x {b}");
  });
});
