import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  aplicarPatch,
  juntarPatches,
  importarNoPatch,
  lerPatch,
  moverDeLiga,
  patchVazio,
  removerClube,
  removerJogador,
  salvarClube,
  salvarJogador,
  totalDeEdicoes,
  transferirJogador,
  type Banco,
  type Clube,
  type Jogador,
  type Patch,
} from "@newbras/data";
import { carregarBase } from "../dados/base";
import { apagarPatch, lerPatchSalvo, salvarPatch } from "./armazenamento";
import { montarIndices } from "./indices";

type Carga =
  | { status: "carregando" }
  | { status: "erro"; mensagem: string }
  | { status: "pronto"; base: Banco; dataReferencia: string; patch: Patch };

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Estado do Editor de Equipes: banco oficial + patch com as edições do usuário. */
export function useEditor() {
  const [carga, setCarga] = useState<Carga>({ status: "carregando" });

  useEffect(() => {
    let vivo = true;
    Promise.all([carregarBase(), lerPatchSalvo()])
      .then(([{ banco: base, dataReferencia }, salvo]) => {
        if (!vivo) return;
        const lido = salvo === undefined ? undefined : lerPatch(salvo);
        const patch = lido?.ok ? lido.valor : patchVazio(base, hoje());
        setCarga({ status: "pronto", base, dataReferencia, patch });
      })
      .catch((erro: unknown) => {
        if (vivo)
          setCarga({
            status: "erro",
            mensagem: erro instanceof Error ? erro.message : String(erro),
          });
      });
    return () => {
      vivo = false;
    };
  }, []);

  const base = carga.status === "pronto" ? carga.base : undefined;
  const patch = carga.status === "pronto" ? carga.patch : undefined;

  const banco = useMemo(
    () => (base && patch ? aplicarPatch(base, patch) : undefined),
    [base, patch],
  );
  const indices = useMemo(() => (banco ? montarIndices(banco) : undefined), [banco]);
  const idsBase = useMemo(
    () =>
      base
        ? {
            clubes: new Set(base.clubes.map((c) => c.id)),
            jogadores: new Set(base.jogadores.map((j) => j.id)),
          }
        : undefined,
    [base],
  );

  // Grava as edições no navegador logo depois de cada mudança.
  const primeiro = useRef(true);
  useEffect(() => {
    if (!patch) return;
    if (primeiro.current) {
      primeiro.current = false;
      return;
    }
    const espera = setTimeout(() => {
      void (totalDeEdicoes(patch) === 0 ? apagarPatch() : salvarPatch(patch));
    }, 300);
    return () => clearTimeout(espera);
  }, [patch]);

  const mudar = useCallback((f: (p: Patch) => Patch) => {
    setCarga((c) => (c.status === "pronto" ? { ...c, patch: f(c.patch) } : c));
  }, []);

  const acoes = useMemo(
    () => ({
      salvarClube: (clube: Clube, liga?: string | null) =>
        mudar((p) => {
          let novo = salvarClube(p, clube);
          if (liga !== undefined && banco && indices) {
            novo = moverDeLiga(
              novo,
              indices.ligasDoPais.get(clube.pais) ?? [],
              clube.id,
              liga ?? undefined,
            );
          }
          return novo;
        }),
      removerClube: (id: string) =>
        mudar((p) => removerClube(p, id, idsBase?.clubes.has(id) ?? false)),
      salvarJogador: (j: Jogador) => mudar((p) => salvarJogador(p, j)),
      removerJogador: (id: string) =>
        mudar((p) => removerJogador(p, id, idsBase?.jogadores.has(id) ?? false)),
      transferir: (j: Jogador, destino: string | undefined) =>
        mudar((p) =>
          transferirJogador(p, j, destino, destino ? indices?.numerosOcupados(destino) : undefined),
        ),
      importar: (itens: { clubes?: Clube[]; jogadores?: Jogador[] }) =>
        mudar((p) => importarNoPatch(p, itens)),
      aplicarPatchDeTerceiros: (novo: Patch) => mudar((p) => juntarPatches(p, novo)),
      descartarTudo: () =>
        mudar(() =>
          patchVazio(base ?? { meta: { id: "newbras/mundo-2026" } as Banco["meta"] }, hoje()),
        ),
    }),
    [mudar, banco, indices, idsBase, base],
  );

  return {
    carga,
    banco,
    indices,
    patch,
    dataReferencia: carga.status === "pronto" ? carga.dataReferencia : "2026-07-01",
    edicoes: patch ? totalDeEdicoes(patch) : 0,
    existeNaBase: (tipo: "clubes" | "jogadores", id: string) => idsBase?.[tipo].has(id) ?? false,
    acoes,
  };
}

export type EditorApi = ReturnType<typeof useEditor>;
