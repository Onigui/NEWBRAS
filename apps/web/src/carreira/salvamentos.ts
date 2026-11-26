/**
 * Carreiras salvas no navegador (IndexedDB), com exportação para arquivo e importação de volta.
 */
import { FORMATO_CARREIRA, type Carreira } from "@newbras/engine";
import { LOJAS, operar } from "../dados/idb";

export interface Salvamento {
  carreira: Carreira;
  /** Para a lista de jogos salvos. */
  resumo: {
    tecnico: string;
    clube: string;
    data: string;
    /** Quando foi salvo, no relógio do computador (ISO). */
    salvoEm: string;
  };
}

/** Confere se o que veio de um arquivo ou do navegador é uma carreira que este jogo lê. */
export function lerCarreira(
  bruto: unknown,
): { ok: true; carreira: Carreira } | { ok: false; erro: string } {
  const c = bruto as Partial<Carreira> | null;
  if (!c || typeof c !== "object")
    return { ok: false, erro: "o arquivo não é uma carreira do NewBras" };
  // Formatos antigos (1 a 4) são atualizados ao abrir a carreira.
  if (c.formato !== FORMATO_CARREIRA && ![1, 2, 3, 4, 5].includes(Number(c.formato)))
    return {
      ok: false,
      erro: `formato de salvamento ${String(c.formato)} não é lido por esta versão`,
    };
  for (const campo of [
    "id",
    "semente",
    "clube",
    "data",
    "agenda",
    "jogadores",
    "noticias",
  ] as const)
    if (c[campo] === undefined) return { ok: false, erro: `salvamento sem o campo "${campo}"` };
  return { ok: true, carreira: c as Carreira };
}

export async function listarSalvamentos(): Promise<Salvamento[]> {
  try {
    const todos = await operar<Salvamento[]>(LOJAS.carreiras, "readonly", (l) => l.getAll());
    return todos.sort((a, b) => b.resumo.salvoEm.localeCompare(a.resumo.salvoEm));
  } catch {
    return [];
  }
}

export async function lerSalvamento(id: string): Promise<Salvamento | undefined> {
  try {
    return await operar<Salvamento | undefined>(LOJAS.carreiras, "readonly", (l) => l.get(id));
  } catch {
    return undefined;
  }
}

export async function salvar(carreira: Carreira, clube: string): Promise<Salvamento> {
  const s: Salvamento = {
    carreira,
    resumo: {
      tecnico: carreira.tecnico,
      clube,
      data: carreira.data,
      salvoEm: new Date().toISOString(),
    },
  };
  await operar(LOJAS.carreiras, "readwrite", (l) => l.put(s, carreira.id));
  return s;
}

export async function apagarSalvamento(id: string): Promise<void> {
  await operar(LOJAS.carreiras, "readwrite", (l) => l.delete(id));
}

/** Baixa a carreira como arquivo .json (para guardar ou levar para outro aparelho). */
export function exportarCarreira(c: Carreira, clube: string): void {
  const blob = new Blob([JSON.stringify(c)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `newbras-${clube.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${c.data}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Id novo para uma carreira (não precisa ser determinístico: é só o nome da gaveta). */
export function novoId(): string {
  return `carreira-${new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14)}-${Math.floor(performance.now())}`;
}
