/**
 * A seleção que o técnico comanda (etapa 15b): campanha, confiança da federação, os próximos jogos
 * e a convocação escolhida à mão, com a opção de voltar à automática ou deixar o cargo.
 */
import { useMemo, useState } from "react";
import { NOME_POSICAO, type Posicao } from "@newbras/data";
import {
  agendaCompleta,
  clubeOuSelecao,
  CONVOCACAO_MAXIMA,
  CONVOCACAO_MINIMA,
  contarPosicoes,
  dataCurta,
  definirConvocacao,
  deixarSelecao,
  elegiveisDaSelecao,
  idadeEm,
  nomeDoCompromisso,
  problemasDaConvocacao,
  type Carreira,
} from "@newbras/engine";
import { t } from "@newbras/textos";
import { Escudo } from "../components/Escudo";
import { Botao, Campo, estiloCampo } from "../editor/ui";
import type { MundoMontado } from "./useCarreira";

const POSICOES: readonly Posicao[] = ["G", "Z", "L", "M", "A"];
/** Quantos candidatos de cada posição a lista mostra (os mais fortes). */
const POR_POSICAO = 30;

export function MinhaSelecao({
  c,
  montado,
  mudar,
}: {
  c: Carreira;
  montado: MundoMontado;
  mudar: (f: (c: Carreira) => Carreira) => void;
}) {
  const { mundo } = montado;
  const s = c.selecao;
  const pais = s?.pais ?? "";
  const convocacao = useMemo(() => (pais ? mundo.elenco(pais) : []), [mundo, pais]);
  const elegiveis = useMemo(() => (pais ? elegiveisDaSelecao(mundo, pais) : []), [mundo, pais]);
  const [editando, setEditando] = useState<Set<string> | null>(null);
  const [posicao, setPosicao] = useState<Posicao | "todas">("todas");
  if (!s) return null;
  const selecao = clubeOuSelecao(mundo, s.pais);
  const proximos = agendaCompleta(c)
    .filter((x) => x.selecao === s.pais && !x.resultado && x.data >= c.data)
    .slice(0, 5);
  const escolhidos = editando ?? new Set(convocacao.map((j) => j.id));
  const lista = elegiveis.filter((j) => escolhidos.has(j.id));
  const problemas = problemasDaConvocacao(lista);
  const conta = contarPosicoes(lista);
  const candidatos = POSICOES.flatMap((p) =>
    posicao !== "todas" && posicao !== p
      ? []
      : elegiveis.filter((j) => j.posicao === p).slice(0, POR_POSICAO),
  );
  const cor = s.confianca >= 60 ? "#7ed37a" : s.confianca >= 35 ? "#f4e04d" : "#ff8a7a";

  return (
    <section className="flex flex-col gap-3 rounded-md border border-placar-borda p-3">
      <div className="flex flex-wrap items-center gap-3">
        {selecao && <Escudo clube={selecao} tamanho={36} />}
        <div className="min-w-0 flex-1">
          <h2 className="font-placar text-2xl font-bold">
            {t("Sua seleção: {pais}", { pais: mundo.pais(s.pais)?.nome ?? s.pais })}
          </h2>
          <p className="text-xs text-suave">
            {t("Desde {data}: {jogos} jogos, {v}V {e}E {d}D{titulos}", {
              data: dataCurta(s.desde),
              jogos: s.jogos,
              v: s.vitorias,
              e: s.empates,
              d: s.derrotas,
              titulos: s.titulos.length ? ` · ${s.titulos.join(", ")}` : "",
            })}
          </p>
        </div>
        <div className="text-sm">
          <p className="text-xs text-suave">{t("Confiança da federação")}</p>
          <p className="font-bold" style={{ color: cor }}>
            {Math.round(s.confianca)}
          </p>
        </div>
        <Botao
          onClick={() => {
            if (window.confirm(t("Deixar o comando da seleção? O clube continua com você.")))
              mudar((x) => deixarSelecao(x, mundo, "pediu"));
          }}
        >
          {t("Deixar a seleção")}
        </Botao>
      </div>
      <p className="text-xs text-suave">
        {t(
          "Os jogos da seleção entram na sua agenda e você comanda cada um. Vitórias sobem a confiança da federação; derrotas, principalmente em jogos oficiais, derrubam. Abaixo de 15, a federação demite.",
        )}
      </p>
      {proximos.length > 0 && (
        <ul className="flex flex-col gap-0.5 text-sm">
          {proximos.map((x) => (
            <li key={x.id}>
              {dataCurta(x.data)} · {nomeDoCompromisso(c, mundo, x)} ·{" "}
              {x.mando === "casa" ? t("contra") : t("na casa de")}{" "}
              {clubeOuSelecao(mundo, x.adversario)?.nomeCurto ?? x.adversario}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-bold">
          {t("Convocação ({n} de {max})", { n: lista.length, max: CONVOCACAO_MAXIMA })}
        </h3>
        <span className="text-xs text-suave">
          {POSICOES.map((p) => `${NOME_POSICAO[p]} ${conta[p]}`).join(", ")}
        </span>
        <span className="text-xs text-suave">
          {s.convocados ? t("escolhida por você") : t("automática: os melhores do país")}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          {editando ? (
            <>
              <Botao
                variante="primario"
                disabled={problemas.length > 0}
                onClick={() => {
                  mudar((x) => definirConvocacao(x, mundo, [...escolhidos]));
                  setEditando(null);
                }}
              >
                {t("Confirmar a convocação")}
              </Botao>
              <Botao onClick={() => setEditando(null)}>{t("Cancelar")}</Botao>
            </>
          ) : (
            <Botao onClick={() => setEditando(new Set(convocacao.map((j) => j.id)))}>
              {t("Escolher a convocação")}
            </Botao>
          )}
          {s.convocados && !editando && (
            <Botao onClick={() => mudar((x) => definirConvocacao(x, mundo, null))}>
              {t("Voltar à automática")}
            </Botao>
          )}
        </div>
      </div>
      {editando && problemas.length > 0 && (
        <p className="text-xs text-[#ff8a7a]">
          {problemas.map((p) => t(p.texto, p.params)).join("; ")}.
        </p>
      )}
      {editando ? (
        <div className="flex flex-col gap-2">
          <Campo rotulo={t("Posição")} className="max-w-48">
            <select
              className={estiloCampo}
              value={posicao}
              onChange={(e) => setPosicao(e.target.value as Posicao | "todas")}
            >
              <option value="todas">{t("Todas")}</option>
              {POSICOES.map((p) => (
                <option key={p} value={p}>
                  {NOME_POSICAO[p]}
                </option>
              ))}
            </select>
          </Campo>
          <p className="text-xs text-suave">
            {t(
              "Marque de {min} a {max} jogadores, com pelo menos 2 goleiros. A lista mostra os {n} mais fortes de cada posição.",
              { min: CONVOCACAO_MINIMA, max: CONVOCACAO_MAXIMA, n: POR_POSICAO },
            )}
          </p>
          <ul className="grid max-h-96 gap-x-4 overflow-y-auto text-sm sm:grid-cols-2">
            {candidatos.map((j) => {
              const marcado = escolhidos.has(j.id);
              return (
                <li key={j.id}>
                  <label className="flex cursor-pointer items-center gap-2 py-0.5">
                    <input
                      type="checkbox"
                      checked={marcado}
                      onChange={() => {
                        const novo = new Set(escolhidos);
                        if (marcado) novo.delete(j.id);
                        else novo.add(j.id);
                        setEditando(novo);
                      }}
                    />
                    <span className="w-7 text-right font-bold">{j.forca}</span>
                    <span className="min-w-0 flex-1 truncate">
                      {j.nome}{" "}
                      <span className="text-xs text-suave">
                        {NOME_POSICAO[j.posicao]}, {idadeEm(j.nascimento, c.data)} {t("anos")},{" "}
                        {mundo.clube(j.clube ?? "")?.nomeCurto ?? t("sem clube")}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <ul className="grid gap-x-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {convocacao.map((j) => (
            <li key={j.id} className="truncate">
              <span className="inline-block w-7 text-right font-bold">{j.forca}</span> {j.nome}{" "}
              <span className="text-xs text-suave">
                {NOME_POSICAO[j.posicao]}, {mundo.clube(j.clube ?? "")?.nomeCurto ?? ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
