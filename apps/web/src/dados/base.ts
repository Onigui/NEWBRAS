/**
 * O banco oficial é montado uma vez por visita, num Web Worker, e reaproveitado por todas as
 * telas (editor, amistoso, carreira).
 */
import type { Banco } from "@newbras/data";

export interface Base {
  banco: Banco;
  dataReferencia: string;
}

let promessa: Promise<Base> | null = null;

export function carregarBase(): Promise<Base> {
  if (promessa) return promessa;
  promessa = new Promise<Base>((resolve, reject) => {
    const worker = new Worker(new URL("../editor/banco.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (
      e: MessageEvent<{ ok: boolean; banco: Banco; dataReferencia: string; mensagem?: string }>,
    ) => {
      worker.terminate();
      if (e.data.ok) resolve({ banco: e.data.banco, dataReferencia: e.data.dataReferencia });
      else reject(new Error(e.data.mensagem));
    };
    worker.onerror = (e) => {
      worker.terminate();
      reject(new Error(e.message || "falha ao montar o banco"));
    };
    worker.postMessage("montar");
  });
  // Falhou: a próxima tela tenta de novo.
  promessa.catch(() => {
    promessa = null;
  });
  return promessa;
}
