/// <reference lib="webworker" />
/**
 * Monta o banco mundial fora da tela principal (leva cerca de um segundo).
 * O banco é determinístico: o navegador gera exatamente o mesmo que os testes.
 */
import { DATA_REFERENCIA, montarBanco } from "@newbras/banco";

const escopo = self as unknown as DedicatedWorkerGlobalScope;

escopo.onmessage = () => {
  try {
    escopo.postMessage({ ok: true, banco: montarBanco(), dataReferencia: DATA_REFERENCIA });
  } catch (erro) {
    escopo.postMessage({
      ok: false,
      mensagem: erro instanceof Error ? erro.message : String(erro),
    });
  }
};
