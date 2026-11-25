/**
 * Novo jogo: o nome do técnico e o clube. A carreira começa na pré-temporada do país do clube,
 * com o banco oficial e as edições do editor que valem agora.
 */
import { useMemo, useState } from "react";
import {
  DIAS_PRE_TEMPORADA,
  dataPorExtenso,
  inicioDaCarreira,
  mundoDoBanco,
  nomeTemporada,
  novaCarreira,
  type Carreira,
} from "@newbras/engine";
import type { Clube } from "@newbras/data";
import { Escudo } from "../components/Escudo";
import { procurar } from "../editor/indices";
import { Botao, Campo, estiloCampo } from "../editor/ui";
import { useEditor } from "../editor/useEditor";
import { novoId } from "./salvamentos";
import { TelaDeEspera } from "./TelaDeEspera";

const ESTRELAS = ["", "Municipal", "Estadual", "Nacional", "Continental", "Mundial"];

export function NovoJogo({
  onBack,
  onComecar,
}: {
  onBack: () => void;
  onComecar: (c: Carreira) => void;
}) {
  const ed = useEditor();
  const [tecnico, setTecnico] = useState("");
  const [pais, setPais] = useState("BRA");
  const [busca, setBusca] = useState("");
  const [clubeId, setClubeId] = useState<string | null>(null);

  const indices = ed.indices;
  const banco = ed.banco;
  const clubesDoPais = useMemo(
    () =>
      [...(indices?.clubesDoPais.get(pais) ?? [])]
        .filter(
          (c) => (indices?.jogadoresDoClube.get(c.id) ?? []).filter((j) => !j.base).length >= 11,
        )
        .sort((a, b) => b.nivel - a.nivel),
    [indices, pais],
  );
  const achados = useMemo(
    () => (banco && busca.trim() ? procurar(banco, busca, 10).clubes : []),
    [banco, busca],
  );

  if (!banco || !indices)
    return <TelaDeEspera titulo="Novo jogo" carga={ed.carga} onBack={onBack} />;

  const clube = clubeId ? indices.clubePorId.get(clubeId) : undefined;
  const paisDoClube = clube ? banco.paises.find((p) => p.codigo === clube.pais) : undefined;
  const inicio = paisDoClube ? inicioDaCarreira(paisDoClube, ed.dataReferencia) : null;
  const elenco = clube ? (indices.jogadoresDoClube.get(clube.id) ?? []).filter((j) => !j.base) : [];
  const craques = [...elenco].sort((a, b) => b.forca - a.forca).slice(0, 5);
  const media = elenco.length
    ? Math.round(
        [...elenco]
          .sort((a, b) => b.forca - a.forca)
          .slice(0, 11)
          .reduce((s, j) => s + j.forca, 0) / Math.min(11, elenco.length),
      )
    : 0;

  const comecar = () => {
    if (!clube) return;
    const id = novoId();
    onComecar(
      novaCarreira(mundoDoBanco(banco), {
        id,
        semente: id,
        tecnico: tecnico.trim() || "Técnico",
        clube: clube.id,
        referencia: ed.dataReferencia,
        versaoBanco: banco.meta.versao,
        ...(ed.edicoes > 0 && ed.patch ? { patch: ed.patch } : {}),
      }),
    );
  };

  const escolher = (c: Clube) => {
    setClubeId(c.id);
    setBusca("");
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-4 p-4 lg:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-md border-2 border-placar-borda bg-placar px-5 py-3">
        <div>
          <h1 className="font-placar text-4xl font-extrabold">Novo jogo</h1>
          <p className="text-sm text-suave">
            Escolha seu nome e o clube. A carreira começa na pré-temporada do país do clube,{" "}
            {DIAS_PRE_TEMPORADA} dias antes da estreia.
          </p>
        </div>
        <Botao onClick={onBack}>Voltar ao menu</Botao>
      </header>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="flex flex-col gap-3 rounded-md border-2 border-placar-borda bg-placar p-4">
          <Campo rotulo="Seu nome (técnico)">
            <input
              className={estiloCampo}
              value={tecnico}
              maxLength={40}
              placeholder="Ex.: Guilherme"
              onChange={(e) => setTecnico(e.target.value)}
            />
          </Campo>
          <Campo rotulo="Procurar clube">
            <input
              className={estiloCampo}
              value={busca}
              placeholder="Ex.: Corinthians, Barcelona, Botafogo-SP"
              onChange={(e) => setBusca(e.target.value)}
            />
          </Campo>
          {achados.length > 0 ? (
            <ListaClubes clubes={achados} onEscolher={escolher} selecionado={clubeId} />
          ) : (
            <>
              <Campo rotulo="País">
                <select
                  className={estiloCampo}
                  value={pais}
                  onChange={(e) => setPais(e.target.value)}
                >
                  {indices.paises.map((p) => (
                    <option key={p.codigo} value={p.codigo}>
                      {p.nome} ({p.clubes})
                    </option>
                  ))}
                </select>
              </Campo>
              <ListaClubes clubes={clubesDoPais} onEscolher={escolher} selecionado={clubeId} />
            </>
          )}
        </section>

        <section className="flex flex-col gap-3 rounded-md border-2 border-placar-borda bg-placar p-4">
          {clube && inicio && paisDoClube ? (
            <>
              <div className="flex items-center gap-3">
                <Escudo clube={clube} tamanho={56} />
                <div className="min-w-0">
                  <p className="truncate font-placar text-3xl font-bold">{clube.nome}</p>
                  <p className="text-sm text-suave">
                    {paisDoClube.nome}, reputação {ESTRELAS[clube.reputacao]?.toLowerCase()},{" "}
                    {elenco.length} jogadores, média dos 11 melhores {media}
                  </p>
                </div>
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <dt className="text-suave">Começa em</dt>
                <dd>{dataPorExtenso(inicio)}</dd>
                <dt className="text-suave">Temporada</dt>
                <dd>{nomeTemporada(paisDoClube, inicio)}</dd>
                <dt className="text-suave">Estádio</dt>
                <dd>
                  {clube.estadio.nome} ({clube.estadio.capacidade.toLocaleString("pt-BR")} lugares)
                </dd>
              </dl>
              <div>
                <p className="mb-1 text-sm font-bold">Destaques do elenco</p>
                <ul className="text-sm">
                  {craques.map((j) => (
                    <li key={j.id} className="flex justify-between border-b border-white/5 py-0.5">
                      <span>
                        {j.nome}{" "}
                        <span className="text-xs text-suave">
                          {j.posicoesCampo?.join(", ") ?? j.posicao}
                        </span>
                      </span>
                      <span className="font-bold">{j.forca}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {ed.edicoes > 0 && (
                <p className="text-xs text-suave">
                  As {ed.edicoes} edições do Editor de Equipes entram nesta carreira (e ficam
                  guardadas nela).
                </p>
              )}
              <Botao variante="primario" className="mt-auto py-2 text-base" onClick={comecar}>
                Começar a carreira no {clube.nomeCurto}
              </Botao>
            </>
          ) : (
            <p className="m-auto text-center text-suave">Escolha um clube na lista ao lado.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function ListaClubes({
  clubes,
  selecionado,
  onEscolher,
}: {
  clubes: readonly Clube[];
  selecionado: string | null;
  onEscolher: (c: Clube) => void;
}) {
  return (
    <ul className="flex max-h-[28rem] flex-col overflow-y-auto rounded border border-placar-borda">
      {clubes.map((c) => (
        <li key={c.id}>
          <button
            type="button"
            aria-pressed={selecionado === c.id}
            className={`flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-white/5 ${selecionado === c.id ? "bg-canarinho/15" : ""}`}
            onClick={() => onEscolher(c)}
          >
            <Escudo clube={c} tamanho={22} />
            <span className="min-w-0 flex-1 truncate">{c.nome}</span>
            <span className="text-xs text-suave">nível {c.nivel}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
