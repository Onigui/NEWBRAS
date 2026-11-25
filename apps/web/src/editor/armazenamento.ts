/**
 * Guarda as edições do usuário no próprio navegador (IndexedDB), para valerem na próxima visita.
 * Só o patch é guardado; o banco oficial é montado de novo a cada abertura.
 */
import { LOJAS, operar } from "../dados/idb";

const CHAVE_PATCH = "patch";

/** O patch salvo, ou undefined se não houver (ou se o navegador não deixar ler). */
export async function lerPatchSalvo(): Promise<unknown> {
  try {
    return await operar<unknown>(LOJAS.editor, "readonly", (l) => l.get(CHAVE_PATCH));
  } catch {
    return undefined;
  }
}

export async function salvarPatch(patch: unknown): Promise<void> {
  await operar(LOJAS.editor, "readwrite", (l) => l.put(patch, CHAVE_PATCH));
}

export async function apagarPatch(): Promise<void> {
  await operar(LOJAS.editor, "readwrite", (l) => l.delete(CHAVE_PATCH));
}
