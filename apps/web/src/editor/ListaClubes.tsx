import { useMemo } from "react";
import { NOME_POSICAO, type Banco, type Jogador } from "@newbras/data";
import { Escudo } from "../components/Escudo";
import { procurar, type Indices } from "./indices";
import { estiloCampo } from "./ui";

interface Props {
  banco: Banco;
  indices: Indices;
  pais: string;
  onPais: (pais: string) => void;
  busca: string;
  onBusca: (termo: string) => void;
  selecionado: string | undefined;
  onClube: (id: string) => void;
  onJogador: (j: Jogador) => void;
}

/** Coluna da esquerda: times por país, ou resultados da busca por time e jogador. */
export function ListaClubes({
  banco,
  indices,
  pais,
  onPais,
  busca,
  onBusca,
  selecionado,
  onClube,
  onJogador,
}: Props) {
  const resultado = useMemo(() => procurar(banco, busca), [banco, busca]);
  const buscando = busca.trim().length >= 2;
  const clubes = indices.clubesDoPais.get(pais) ?? [];
  const invalidosNoPais = clubes.filter((c) => indices.invalidos.has(c.id)).length;

  const linhaClube = (c: (typeof clubes)[number], mostrarPais = false) => {
    const invalido = indices.invalidos.has(c.id);
    const liga = indices.ligaDoClube.get(c.id);
    return (
      <li key={c.id}>
        <button
          type="button"
          onClick={() => onClube(c.id)}
          aria-current={c.id === selecionado ? "true" : undefined}
          className={`flex w-full items-center gap-2.5 border-l-4 px-3 py-1.5 text-left text-sm hover:bg-[#24364a] ${c.id === selecionado ? "border-canarinho bg-[#24364a]" : "border-transparent"}`}
        >
          <Escudo clube={c} tamanho={20} />
          <span className={`flex-1 truncate ${invalido ? "font-bold text-[#ff8a7e]" : ""}`}>
            {c.nome}
          </span>
          <span className="shrink-0 text-xs text-suave">
            {mostrarPais ? c.pais : liga?.divisao ? `${liga.divisao}ª` : ""}
          </span>
        </button>
      </li>
    );
  };

  return (
    <aside className="flex max-h-[60vh] min-h-0 min-w-0 flex-col rounded-md lg:max-h-none border-2 border-placar-borda bg-placar">
      <div className="flex flex-col gap-2 border-b border-placar-borda p-3">
        <label className="text-xs font-bold text-suave" htmlFor="editor-busca">
          Procurar time ou jogador
        </label>
        <input
          id="editor-busca"
          type="search"
          className={estiloCampo}
          placeholder="Ex.: Flamengo, Neymar"
          value={busca}
          onChange={(e) => onBusca(e.target.value)}
        />
        {!buscando && (
          <>
            <label className="mt-1 text-xs font-bold text-suave" htmlFor="editor-pais">
              País
            </label>
            <select
              id="editor-pais"
              className={estiloCampo}
              value={pais}
              onChange={(e) => onPais(e.target.value)}
            >
              {indices.paises.map((p) => (
                <option key={p.codigo} value={p.codigo}>
                  {p.nome} ({p.clubes})
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        {buscando ? (
          <>
            <h3 className="px-3 pt-2 pb-1 text-xs font-bold text-suave">
              Times ({resultado.clubes.length})
            </h3>
            <ul>{resultado.clubes.map((c) => linhaClube(c, true))}</ul>
            {busca.trim().length >= 3 && (
              <>
                <h3 className="px-3 pt-3 pb-1 text-xs font-bold text-suave">
                  Jogadores ({resultado.jogadores.length}
                  {resultado.mais ? "+" : ""})
                </h3>
                <ul>
                  {resultado.jogadores.map((j) => (
                    <li key={j.id}>
                      <button
                        type="button"
                        onClick={() => onJogador(j)}
                        className="flex w-full items-baseline gap-2 px-3 py-1.5 text-left text-sm hover:bg-[#24364a]"
                      >
                        <span className="flex-1 truncate">{j.nome}</span>
                        <span className="shrink-0 text-xs text-suave">
                          {NOME_POSICAO[j.posicao].slice(0, 3)} ·{" "}
                          {j.clube
                            ? (indices.clubePorId.get(j.clube)?.nomeCurto ?? j.clube)
                            : "livre"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                {resultado.mais && (
                  <p className="px-3 py-2 text-xs text-suave">
                    Mostrando os primeiros 60. Digite mais letras para afinar.
                  </p>
                )}
              </>
            )}
            {!resultado.clubes.length && !resultado.jogadores.length && (
              <p className="px-3 py-2 text-sm text-suave">Nada encontrado.</p>
            )}
          </>
        ) : (
          <ul>{clubes.map((c) => linhaClube(c))}</ul>
        )}
      </div>
      {!buscando && (
        <p className="border-t border-placar-borda px-3 py-2 text-xs text-suave">
          {clubes.length} times
          {invalidosNoPais > 0 && (
            <>
              {", "}
              <span className="font-bold text-[#ff8a7e]">{invalidosNoPais} inválidos</span>
            </>
          )}
        </p>
      )}
    </aside>
  );
}
