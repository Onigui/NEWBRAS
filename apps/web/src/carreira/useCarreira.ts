/**
 * Estado da carreira na tela: monta o mundo (banco oficial + edições guardadas na carreira),
 * guarda a carreira e salva sozinho depois de cada mudança.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { aplicarPatch, type Banco } from "@newbras/data";
import { mundoDoBanco, type Carreira, type Mundo } from "@newbras/engine";
import { carregarBase } from "../dados/base";
import { montarIndices, type Indices } from "../editor/indices";
import { salvar } from "./salvamentos";

type Carga =
  | { status: "carregando" }
  | { status: "erro"; mensagem: string }
  | { status: "pronto"; base: Banco; dataReferencia: string };

export function useBase() {
  const [carga, setCarga] = useState<Carga>({ status: "carregando" });
  useEffect(() => {
    let vivo = true;
    carregarBase()
      .then(
        (b) =>
          vivo && setCarga({ status: "pronto", base: b.banco, dataReferencia: b.dataReferencia }),
      )
      .catch(
        (e: unknown) =>
          vivo &&
          setCarga({ status: "erro", mensagem: e instanceof Error ? e.message : String(e) }),
      );
    return () => {
      vivo = false;
    };
  }, []);
  return carga;
}

export interface MundoMontado {
  banco: Banco;
  mundo: Mundo;
  indices: Indices;
}

/** O mundo de uma carreira: o banco oficial com as edições que valiam quando ela começou. */
export function useMundo(base: Banco | undefined, patch: Carreira["patch"]): MundoMontado | null {
  return useMemo(() => {
    if (!base) return null;
    const banco = patch ? aplicarPatch(base, patch) : base;
    return { banco, mundo: mundoDoBanco(banco), indices: montarIndices(banco) };
  }, [base, patch]);
}

export function useCarreira(inicial: Carreira) {
  const carga = useBase();
  const [carreira, setCarreira] = useState(inicial);
  const [salvoEm, setSalvoEm] = useState<string | null>(null);
  const [erroSalvar, setErroSalvar] = useState("");
  const montado = useMundo(carga.status === "pronto" ? carga.base : undefined, carreira.patch);
  const nomeClube = montado?.mundo.clube(carreira.clube)?.nomeCurto ?? carreira.clube;

  const salvarAgora = useCallback(
    async (c: Carreira = carreira) => {
      try {
        const s = await salvar(c, nomeClube);
        setSalvoEm(s.resumo.salvoEm);
        setErroSalvar("");
      } catch (e) {
        setErroSalvar(e instanceof Error ? e.message : String(e));
      }
    },
    [carreira, nomeClube],
  );

  // Salva sozinho logo depois de cada mudança.
  const primeira = useRef(true);
  useEffect(() => {
    if (primeira.current) {
      primeira.current = false;
      void salvar(carreira, nomeClube).then((s) => setSalvoEm(s.resumo.salvoEm));
      return;
    }
    const espera = setTimeout(() => void salvarAgora(carreira), 600);
    return () => clearTimeout(espera);
  }, [carreira, nomeClube, salvarAgora]);

  const mudar = useCallback((f: (c: Carreira) => Carreira) => setCarreira(f), []);

  return { carga, carreira, montado, mudar, salvarAgora, salvoEm, erroSalvar, nomeClube };
}
