import { useState } from "react";
import {
  camisasDoClube,
  ELENCO_MAXIMO,
  NOME_CARACTERISTICA,
  NOME_POSICAO,
  type Banco,
  type Clube,
  type Jogador,
} from "@newbras/data";
import { Camisa } from "../components/Camisa";
import { Escudo } from "../components/Escudo";
import { idade } from "./datas";
import { EditorVisual } from "./EditorVisual";
import { FormClube, NOME_REPUTACAO } from "./FormClube";
import type { Indices } from "./indices";
import { Botao } from "./ui";
import { t, locale } from "@newbras/textos";

type Aba = "elenco" | "base" | "dados" | "visual";

interface Props {
  clube: Clube;
  banco: Banco;
  indices: Indices;
  dataReferencia: string;
  onSalvarClube: (c: Clube, liga?: string | null) => void;
  onRemoverClube: () => void;
  onNovoJogador: () => void;
  onEditarJogador: (j: Jogador) => void;
  onTransferir: (j: Jogador) => void;
  onRemoverJogador: (j: Jogador) => void;
}

export function FichaClube(props: Props) {
  const { clube, banco, indices, dataReferencia } = props;
  const [aba, setAba] = useState<Aba>("elenco");
  const [confirmarRemocao, setConfirmarRemocao] = useState(false);
  const elenco = indices.jogadoresDoClube.get(clube.id) ?? [];
  const goleiros = elenco.filter((j) => j.posicao === "G").length;
  const valido = !indices.invalidos.has(clube.id);
  const liga = indices.ligaDoClube.get(clube.id);
  const nomePais = indices.paises.find((p) => p.codigo === clube.pais)?.nome ?? clube.pais;
  // A base fica separada do elenco profissional, que tem limite de ELENCO_MAXIMO.
  const profissionais = elenco.filter((j) => !j.base);
  const base = elenco.filter((j) => j.base);
  const media = profissionais.length
    ? Math.round(profissionais.reduce((s, j) => s + j.forca, 0) / profissionais.length)
    : 0;

  return (
    <section
      id="ficha-clube"
      className="flex min-h-0 min-w-0 flex-col rounded-md border-2 border-placar-borda bg-placar"
    >
      <header className="flex flex-wrap items-center gap-5 border-b border-placar-borda p-5">
        <Escudo clube={clube} tamanho={64} />
        <div className="min-w-0 flex-1">
          <h2 className="font-placar text-4xl leading-none font-extrabold break-words lg:truncate">
            {clube.nome}
          </h2>
          <p className="mt-1.5 text-sm text-suave">
            {t(
              "{nome}, {nomePais}. Reputação {nomeReputacao}, estádio {nome2} ({capacidade} lugares).",
              {
                nome: liga?.nome ?? t("Sem liga nacional"),
                nomePais,
                nomeReputacao: NOME_REPUTACAO[clube.reputacao - 1]?.toLowerCase(),
                nome2: clube.estadio.nome,
                capacidade: clube.estadio.capacidade.toLocaleString(locale()),
              },
            )}
          </p>
          <p className={`mt-1 text-sm font-bold ${valido ? "text-[#9fd39a]" : "text-[#ff8a7e]"}`}>
            {valido
              ? t(
                  "Time válido: {profissionais} de {elencoMaximo} profissionais, força média {media}{base}.",
                  {
                    profissionais: profissionais.length,
                    elencoMaximo: ELENCO_MAXIMO,
                    media,
                    base: base.length ? t("; {base} na base", { base: base.length }) : "",
                  },
                )
              : t(
                  "Time inválido: precisa de pelo menos 1 goleiro e 11 jogadores de linha (tem {goleiros} e {elenco}).",
                  { goleiros, elenco: elenco.length - goleiros },
                )}
          </p>
        </div>
        <div className="hidden gap-1 sm:flex">
          {camisasDoClube(clube).map((c, i) => (
            <Camisa
              key={i}
              camisa={c}
              tamanho={44}
              rotulo={
                [t("Camisa titular"), t("Camisa reserva"), t("Terceira camisa")][i] ?? t("Camisa")
              }
            />
          ))}
        </div>
      </header>

      <nav
        className="flex gap-1 border-b border-placar-borda px-4"
        aria-label={t("Partes do time")}
      >
        {(
          [
            ["elenco", t("Elenco ({profissionais})", { profissionais: profissionais.length })],
            ["base", t("Base ({base})", { base: base.length })],
            ["dados", t("Dados do time")],
            ["visual", t("Escudo e camisas")],
          ] as const
        ).map(([id, nome]) => (
          <button
            key={id}
            type="button"
            onClick={() => setAba(id)}
            aria-current={aba === id ? "page" : undefined}
            className={`-mb-px border-b-4 px-3 py-2.5 font-placar text-lg font-bold ${aba === id ? "border-canarinho text-canarinho" : "border-transparent text-suave hover:text-cal"}`}
          >
            {nome}
          </button>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {(aba === "elenco" || aba === "base") && (
          <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-suave">
                {aba === "base"
                  ? t(
                      "Jogadores da categoria de base: não contam no limite do elenco até serem promovidos.",
                    )
                  : t("Clique num jogador para editar. Botão direito transfere.")}
              </p>
              <Botao variante="primario" onClick={props.onNovoJogador}>
                {t("Adicionar jogador")}
              </Botao>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[46rem] text-sm">
                <thead className="text-left text-xs text-suave">
                  <tr>
                    <th className="w-10 py-1.5 pr-2 text-right font-bold">Nº</th>
                    <th className="py-1.5 font-bold">{t("Nome")}</th>
                    <th className="py-1.5 font-bold">{t("Posição")}</th>
                    <th className="py-1.5 text-right font-bold">{t("Idade")}</th>
                    <th className="py-1.5 text-right font-bold">{t("Força")}</th>
                    <th className="py-1.5 text-right font-bold">{t("Pot.")}</th>
                    <th className="py-1.5 pl-4 font-bold">{t("Características")}</th>
                    <th className="py-1.5 font-bold">{t("Nac.")}</th>
                    <th className="py-1.5" />
                  </tr>
                </thead>
                <tbody>
                  {(aba === "base" ? base : profissionais).map((j) => (
                    <tr
                      key={j.id}
                      className="cursor-pointer border-t border-placar-borda/60 hover:bg-[#24364a]"
                      onClick={() => props.onEditarJogador(j)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        props.onTransferir(j);
                      }}
                    >
                      <td className="py-1.5 pr-2 text-right text-suave tabular-nums">
                        {j.numero ?? ""}
                      </td>
                      <td className="py-1.5">
                        <span className="font-bold">{j.nome}</span>
                        {j.estrela && (
                          <span className="ml-1.5 text-canarinho" title={t("Estrela")}>
                            ★
                          </span>
                        )}
                        {j.base && <span className="ml-1.5 text-xs text-suave">{t("base")}</span>}
                        {j.aConferir.length > 0 && (
                          <span
                            className="ml-1.5 text-xs text-canarinho"
                            title={t("A conferir: {aConferir}", {
                              aConferir: j.aConferir.join(", "),
                            })}
                          >
                            {t("a conferir")}
                          </span>
                        )}
                      </td>
                      <td className="py-1.5">
                        {NOME_POSICAO[j.posicao]}
                        {j.posicao === "L"
                          ? j.lado === "D"
                            ? t(" direito")
                            : j.lado === "E"
                              ? t(" esquerdo")
                              : ""
                          : ""}
                      </td>
                      <td className="py-1.5 text-right tabular-nums">
                        {idade(j.nascimento, dataReferencia)}
                      </td>
                      <td className="py-1.5 text-right font-bold tabular-nums">{j.forca}</td>
                      <td className="py-1.5 text-right text-suave tabular-nums">{j.potencial}</td>
                      <td className="py-1.5 pl-4 text-suave">
                        {j.caracteristicas.map((c) => NOME_CARACTERISTICA[c]).join(", ")}
                      </td>
                      <td className="py-1.5 text-suave">{j.nacionalidade}</td>
                      <td className="py-1.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          className="px-1.5 text-suave hover:text-canarinho"
                          onClick={(e) => {
                            e.stopPropagation();
                            props.onTransferir(j);
                          }}
                        >
                          {t("Transferir")}
                        </button>
                        <button
                          type="button"
                          className="px-1.5 text-suave hover:text-[#ff8a7e]"
                          onClick={(e) => {
                            e.stopPropagation();
                            props.onRemoverJogador(j);
                          }}
                        >
                          {t("Deletar")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!elenco.length && (
                <p className="py-6 text-center text-suave">
                  {t("Time sem jogadores. Adicione pelo botão acima ou importe uma planilha.")}
                </p>
              )}
            </div>
          </>
        )}

        {aba === "dados" && (
          <>
            <FormClube
              key={clube.id}
              clube={clube}
              ligaAtual={liga?.id}
              banco={banco}
              indices={indices}
              rotuloSalvar={t("Salvar dados do time")}
              onSalvar={props.onSalvarClube}
            />
            <div className="mt-8 border-t border-placar-borda pt-4">
              {!confirmarRemocao ? (
                <Botao variante="perigo" onClick={() => setConfirmarRemocao(true)}>
                  {t("Deletar time")}
                </Botao>
              ) : (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span>
                    {t(
                      "Deletar {nome}? Os {elenco} jogadores ficam livres e o time sai das competições. Dá para recuperar descartando as edições.",
                      { nome: clube.nome, elenco: elenco.length },
                    )}
                  </span>
                  <Botao variante="perigo" onClick={props.onRemoverClube}>
                    {t("Deletar")}
                  </Botao>
                  <Botao onClick={() => setConfirmarRemocao(false)}>{t("Cancelar")}</Botao>
                </div>
              )}
            </div>
          </>
        )}

        {aba === "visual" && (
          <EditorVisual key={clube.id} clube={clube} onSalvar={(c) => props.onSalvarClube(c)} />
        )}
      </div>
    </section>
  );
}
