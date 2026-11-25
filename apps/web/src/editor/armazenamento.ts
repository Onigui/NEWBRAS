/**
 * Guarda as edições do usuário no próprio navegador (IndexedDB), para valerem na próxima visita.
 * Só o patch é guardado; o banco oficial é montado de novo a cada abertura.
 */
const NOME_BANCO = "newbras";
const LOJA = "editor";
const CHAVE_PATCH = "patch";

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(NOME_BANCO, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(LOJA);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function operar<T>(
  modo: IDBTransactionMode,
  fazer: (loja: IDBObjectStore) => IDBRequest,
): Promise<T> {
  const db = await abrir();
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = fazer(db.transaction(LOJA, modo).objectStore(LOJA));
      req.onsuccess = () => resolve(req.result as T);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

/** O patch salvo, ou undefined se não houver (ou se o navegador não deixar ler). */
export async function lerPatchSalvo(): Promise<unknown> {
  try {
    return await operar<unknown>("readonly", (l) => l.get(CHAVE_PATCH));
  } catch {
    return undefined;
  }
}

export async function salvarPatch(patch: unknown): Promise<void> {
  await operar("readwrite", (l) => l.put(patch, CHAVE_PATCH));
}

export async function apagarPatch(): Promise<void> {
  await operar("readwrite", (l) => l.delete(CHAVE_PATCH));
}
