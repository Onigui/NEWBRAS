import { describe, expect, it } from "vitest";
import { MENU, findMenuItem } from "./menu";

describe("menu inicial", () => {
  it("tem o Editor de equipes na tela inicial, como no Brasfoot", () => {
    expect(MENU.map((m) => m.id)).toContain("editor");
  });

  it("não repete teclas de atalho", () => {
    const keys = MENU.map((m) => m.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("encontra cada item pelo id", () => {
    for (const item of MENU) expect(findMenuItem(item.id)).toBe(item);
  });
});
