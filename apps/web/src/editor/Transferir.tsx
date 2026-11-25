import { useMemo, useState } from "react";
import type { Banco, Jogador } from "@newbras/data";
import { Escudo } from "../components/Escudo";
import { normalizar, type Indices } from "./indices";
import { Botao, Dialogo, estiloCampo } from "./ui";

interface Props {
  jogador: Jogador;
  banco: Banco;
  indices: Indices;
  onTransferir: (destino: string | undefined) => void;
  onFechar: () => void;
}

/** Leva o jogador para outro time (ou o deixa livre), como o botão direito do editor do Brasfoot. */
export function Transferir({ jogador, banco, indices, onTransferir, onFechar }: Props) {
  const [termo, setTermo] = useState("");
  const atual = jogador.clube ? indices.clubePorId.get(jogador.clube) : undefined;
  const opcoes = useMemo(() => {
    const t = normalizar(termo);
    const lista =
      t.length >= 2
        ? banco.clubes.filter(
            (c) => normalizar(c.nome).includes(t) || c.abreviacao.toLowerCase() === t,
          )
        : (indices.clubesDoPais.get(atual?.pais ?? "BRA") ?? []);
    return lista.filter((c) => c.id !== jogador.clube).slice(0, 40);
  }, [termo, banco.clubes, indices, atual, jogador.clube]);

  return (
    <Dialogo titulo={`Transferir ${jogador.nome}`} onFechar={onFechar}>
      <p className="mb-3 text-sm text-suave">
        Hoje: {atual?.nome ?? "sem clube"}. Escolha o novo time ou procure pelo nome.
      </p>
      <input
        className={estiloCampo}
        placeholder="Procurar time"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
      />
      <ul className="mt-3 max-h-80 overflow-y-auto rounded-sm border border-placar-borda">
        {opcoes.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[#24364a]"
              onClick={() => onTransferir(c.id)}
            >
              <Escudo clube={c} tamanho={22} />
              <span className="flex-1">{c.nome}</span>
              <span className="text-xs text-suave">
                {indices.ligaDoClube.get(c.id)?.nomeCurto ??
                  indices.ligaDoClube.get(c.id)?.nome ??
                  c.pais}
              </span>
            </button>
          </li>
        ))}
        {!opcoes.length && (
          <li className="px-3 py-2 text-sm text-suave">Nenhum time encontrado.</li>
        )}
      </ul>
      <div className="mt-4 flex justify-between gap-2">
        {jogador.clube ? (
          <Botao onClick={() => onTransferir(undefined)}>Deixar livre</Botao>
        ) : (
          <span />
        )}
        <Botao onClick={onFechar}>Cancelar</Botao>
      </div>
    </Dialogo>
  );
}
