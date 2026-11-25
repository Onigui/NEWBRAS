/**
 * Banco local do navegador (IndexedDB): as edições do editor e as carreiras salvas.
 * Uma versão só para as duas lojas, para uma não travar a abertura da outra.
 */
const NOME = "newbras";
const VERSAO = 2;
export const LOJAS = { editor: "editor", carreiras: "carreiras" } as const;

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(NOME, VERSAO);
    req.onupgradeneeded = () => {
      for (const loja of Object.values(LOJAS))
        if (!req.result.objectStoreNames.contains(loja)) req.result.createObjectStore(loja);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function operar<T>(
  loja: (typeof LOJAS)[keyof typeof LOJAS],
  modo: IDBTransactionMode,
  fazer: (l: IDBObjectStore) => IDBRequest,
): Promise<T> {
  const db = await abrir();
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = fazer(db.transaction(loja, modo).objectStore(loja));
      req.onsuccess = () => resolve(req.result as T);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}
