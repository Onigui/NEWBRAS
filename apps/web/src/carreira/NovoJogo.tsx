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
import { gruposDoPais, procurar } from "../editor/indices";
import { Botao, Campo, estiloCampo } from "../editor/ui";
import { useEditor } from "../editor/useEditor";
import { novoId } from "./salvamentos";
import { TelaDeEspera } from "./TelaDeEspera";
import { t, locale } from "@newbras/textos";

const ESTRELAS = ["", t("Municipal"), t("Estadual"), t("Nacional"), t("Continental"), t("Mundial")];

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
  // Liga escolhida no país ("" = todas); começa na 1ª divisão.
  const [liga, setLiga] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [clubeId, setClubeId] = useState<string | null>(null);
  const [preparando, setPreparando] = useState(false);

  const indices = ed.indices;
  const banco = ed.banco;
  // Só clubes com elenco para jogar, agrupados por liga (da 1ª divisão para baixo).
  const grupos = useMemo(
    () =>
      banco && indices
        ? gruposDoPais(banco, indices, pais)
            .map((g) => ({
              ...g,
              clubes: g.clubes.filter(
                (c) =>
                  (indices.jogadoresDoClube.get(c.id) ?? []).filter((j) => !j.base).length >= 11,
              ),
            }))
            .filter((g) => g.clubes.length)
        : [],
    [banco, indices, pais],
  );
  const ligaAtual = liga ?? grupos[0]?.id ?? "";
  const clubesDoPais = useMemo(
    () =>
      (ligaAtual ? grupos.filter((g) => g.id === ligaAtual) : grupos)
        .flatMap((g) => g.clubes)
        .sort((a, b) => b.nivel - a.nivel || a.nome.localeCompare(b.nome, "pt-BR")),
    [grupos, ligaAtual],
  );
  const achados = useMemo(
    () => (banco && busca.trim() ? procurar(banco, busca, 10).clubes : []),
    [banco, busca],
  );

  if (!banco || !indices)
    return <TelaDeEspera titulo={t("Novo jogo")} carga={ed.carga} onBack={onBack} />;

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
    if (!clube || preparando) return;
    setPreparando(true);
    // Montar as competições do mundo inteiro leva um ou dois segundos: a tela avisa antes.
    setTimeout(() => {
      const id = novoId();
      onComecar(
        novaCarreira(mundoDoBanco(banco), {
          id,
          semente: id,
          tecnico: tecnico.trim() || t("Técnico"),
          clube: clube.id,
          referencia: ed.dataReferencia,
          versaoBanco: banco.meta.versao,
          ...(ed.edicoes > 0 && ed.patch ? { patch: ed.patch } : {}),
        }),
      );
    }, 30);
  };

  const escolher = (c: Clube) => {
    setClubeId(c.id);
    setBusca("");
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-4 p-4 lg:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-md border-2 border-placar-borda bg-placar px-5 py-3">
        <div>
          <h1 className="font-placar text-4xl font-extrabold">{t("Novo jogo")}</h1>
          <p className="text-sm text-suave">
            {t(
              "Escolha seu nome e o clube. A carreira começa na pré-temporada do país do clube, {diasPreTemporada} dias antes da estreia.",
              { diasPreTemporada: DIAS_PRE_TEMPORADA },
            )}
          </p>
        </div>
        <Botao onClick={onBack}>{t("Voltar ao menu")}</Botao>
      </header>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="flex flex-col gap-3 rounded-md border-2 border-placar-borda bg-placar p-4">
          <Campo rotulo={t("Seu nome (técnico)")}>
            <input
              className={estiloCampo}
              value={tecnico}
              maxLength={40}
              placeholder={t("Ex.: Guilherme")}
              onChange={(e) => setTecnico(e.target.value)}
            />
          </Campo>
          <Campo rotulo={t("Procurar clube")}>
            <input
              className={estiloCampo}
              value={busca}
              placeholder={t("Ex.: Corinthians, Barcelona, Botafogo-SP")}
              onChange={(e) => setBusca(e.target.value)}
            />
          </Campo>
          {achados.length > 0 ? (
            <ListaClubes clubes={achados} onEscolher={escolher} selecionado={clubeId} />
          ) : (
            <>
              <Campo rotulo={t("País")}>
                <select
                  className={estiloCampo}
                  value={pais}
                  onChange={(e) => {
                    setPais(e.target.value);
                    setLiga(null);
                  }}
                >
                  {indices.paises.map((p) => (
                    <option key={p.codigo} value={p.codigo}>
                      {p.nome} ({p.clubes})
                    </option>
                  ))}
                </select>
              </Campo>
              {grupos.length > 1 && (
                <Campo rotulo={t("Liga")}>
                  <select
                    className={estiloCampo}
                    value={ligaAtual}
                    onChange={(e) => setLiga(e.target.value)}
                  >
                    {grupos.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nome} ({g.clubes.length})
                      </option>
                    ))}
                    <option value="">
                      {t("Todas as ligas ({grupos})", {
                        grupos: grupos.reduce((s, g) => s + g.clubes.length, 0),
                      })}
                    </option>
                  </select>
                </Campo>
              )}
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
                    {t(
                      "{nome}, reputação {estrelas}, {elenco} jogadores, média dos 11 melhores {media}",
                      {
                        nome: paisDoClube.nome,
                        estrelas: ESTRELAS[clube.reputacao]?.toLowerCase(),
                        elenco: elenco.length,
                        media,
                      },
                    )}
                  </p>
                </div>
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <dt className="text-suave">{t("Começa em")}</dt>
                <dd>{dataPorExtenso(inicio)}</dd>
                <dt className="text-suave">{t("Temporada")}</dt>
                <dd>{nomeTemporada(paisDoClube, inicio)}</dd>
                <dt className="text-suave">{t("Estádio")}</dt>
                <dd>
                  {t("{nome} ({capacidade} lugares)", {
                    nome: clube.estadio.nome,
                    capacidade: clube.estadio.capacidade.toLocaleString(locale()),
                  })}
                </dd>
              </dl>
              <div>
                <p className="mb-1 text-sm font-bold">{t("Destaques do elenco")}</p>
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
                  {t(
                    "As {edicoes} edições do Editor de Equipes entram nesta carreira (e ficam guardadas nela).",
                    { edicoes: ed.edicoes },
                  )}
                </p>
              )}
              <Botao variante="primario" className="mt-auto py-2 text-base" onClick={comecar}>
                {preparando
                  ? t("Preparando as ligas do mundo inteiro…")
                  : t("Começar a carreira no {nomeCurto}", { nomeCurto: clube.nomeCurto })}
              </Botao>
            </>
          ) : (
            <p className="m-auto text-center text-suave">
              {t("Escolha um clube na lista ao lado.")}
            </p>
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
            <span className="text-xs text-suave">
              {t("nível")} {c.nivel}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
