/**
 * Categoria de base (etapa 12c): os garotos da base com promoção e dispensa, os olheiros (contratar,
 * mandar a um país, demitir) e os relatórios com a faixa de potencial.
 */
import { useMemo, useState } from "react";
import { NOME_POSICAO } from "@newbras/data";
import {
  BASE_MAXIMA,
  baseDe,
  contratarOlheiro,
  contratarProspecto,
  dataCurta,
  demitirOlheiro,
  descartarRelatorio,
  dispensarDaBase,
  enviarOlheiro,
  IDADE_DISPENSA,
  IDADE_MINIMA_PROMOCAO,
  idadeEm,
  jogadorDaBaseNaData,
  MESES_DE_MISSAO,
  OLHEIROS_MAXIMO,
  olheirosDisponiveis,
  podePromover,
  promover,
  type Carreira,
} from "@newbras/engine";
import { locale, t } from "@newbras/textos";
import { estiloCampo } from "../editor/ui";
import type { MundoMontado } from "./useCarreira";

const botao =
  "rounded border border-placar-borda px-2 py-0.5 text-xs hover:border-canarinho hover:text-canarinho disabled:opacity-40 disabled:hover:border-placar-borda disabled:hover:text-inherit";

const estrelas = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

export function Base({
  c,
  montado,
  mudar,
}: {
  c: Carreira;
  montado: MundoMontado;
  mudar: (f: (c: Carreira) => Carreira) => void;
}) {
  const { mundo } = montado;
  const base = baseDe(c, mundo);
  const disponiveis = olheirosDisponiveis(c, mundo).filter(
    (o) => !base.olheiros.some((x) => x.id === o.id),
  );
  const paises = useMemo(
    () =>
      [...new Set((mundo.clubes ?? []).map((x) => x.pais))]
        .map((p) => mundo.pais(p))
        .filter((p) => !!p)
        .sort((a, b) => a!.nome.localeCompare(b!.nome, "pt-BR")),
    [mundo],
  );
  const [destino, setDestino] = useState<Record<string, { pais: string; meses: number }>>({});
  const paisDoClube = mundo.clube(c.clube)?.pais ?? "BRA";
  const lotada = base.jogadores.length >= BASE_MAXIMA;
  const cheio = mundo.elenco(c.clube).length >= 30;

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="mb-1 font-placar text-2xl font-bold">
          {t("Base ({n} de {max})", { n: base.jogadores.length, max: BASE_MAXIMA })}
        </h2>
        <p className="mb-2 max-w-3xl text-xs text-suave">
          {t(
            "Os garotos evoluem pela curva de idade. Sobem ao profissional a partir dos {min} anos (com vaga nos 30) e são dispensados aos {max} se não subirem. A cada temporada, a peneira traz 2 a 4 garotos da região.",
            { min: IDADE_MINIMA_PROMOCAO, max: IDADE_DISPENSA },
          )}
        </p>
        {base.jogadores.length ? (
          <table className="w-full max-w-4xl text-sm">
            <thead className="text-left text-xs text-suave">
              <tr>
                <th className="py-1 pr-2">{t("Pos.")}</th>
                <th className="py-1 pr-2">{t("Jogador")}</th>
                <th className="py-1 pr-2 text-right">{t("Idade")}</th>
                <th className="py-1 pr-2 text-right">{t("Força")}</th>
                <th className="py-1 pr-2">{t("Origem")}</th>
                <th className="py-1 pr-2" />
              </tr>
            </thead>
            <tbody>
              {base.jogadores.map((b) => {
                const j = jogadorDaBaseNaData(b, c.data);
                const idade = idadeEm(j.nascimento, c.data);
                return (
                  <tr key={j.id} className="border-b border-white/5">
                    <td className="py-1 pr-2 text-xs font-bold text-suave">
                      {NOME_POSICAO[j.posicao]}
                    </td>
                    <td className="py-1 pr-2">
                      {j.nome}
                      {j.estrela && <span className="ml-1 text-canarinho">★</span>}
                    </td>
                    <td className="py-1 pr-2 text-right">{idade}</td>
                    <td className="py-1 pr-2 text-right font-bold">{j.forca}</td>
                    <td className="py-1 pr-2 text-xs text-suave">
                      {b.origem === "olheiro"
                        ? t("olheiro ({pais})", { pais: mundo.pais(j.nacionalidade)?.nome ?? "" })
                        : b.origem === "peneira"
                          ? t("peneira")
                          : b.origem === "renascido"
                            ? t("lenda renascida (potencial {pot})", { pot: b.potencialReal })
                            : t("já estava")}
                    </td>
                    <td className="flex gap-1 py-1">
                      <button
                        type="button"
                        className={botao}
                        disabled={!podePromover(c, mundo, j.id)}
                        title={
                          idade < IDADE_MINIMA_PROMOCAO
                            ? t("Só a partir dos {n} anos", { n: IDADE_MINIMA_PROMOCAO })
                            : cheio
                              ? t(
                                  "O elenco profissional está cheio (30): abre vaga quando alguém sai ou se aposenta",
                                )
                              : t("Sobe ao profissional com contrato de 3 anos")
                        }
                        onClick={() => mudar((x) => promover(x, mundo, j.id))}
                      >
                        {t("Promover")}
                      </button>
                      <button
                        type="button"
                        className={botao}
                        onClick={() => mudar((x) => dispensarDaBase(x, mundo, j.id))}
                      >
                        {t("Dispensar")}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-suave">
            {t("A base está vazia. Mande olheiros atrás de talentos ou espere a peneira.")}
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-1 font-placar text-2xl font-bold">
          {t("Relatórios ({n})", { n: base.relatorios.length })}
        </h2>
        <p className="mb-2 max-w-3xl text-xs text-suave">
          {t(
            "O olheiro estima o potencial numa faixa: quanto melhor ele, mais estreita. O potencial de verdade está dentro dela. Relatório sem resposta some em 45 dias.",
          )}
        </p>
        {base.relatorios.length ? (
          <table className="w-full max-w-4xl text-sm">
            <thead className="text-left text-xs text-suave">
              <tr>
                <th className="py-1 pr-2">{t("Pos.")}</th>
                <th className="py-1 pr-2">{t("Jogador")}</th>
                <th className="py-1 pr-2">{t("País")}</th>
                <th className="py-1 pr-2 text-right">{t("Idade")}</th>
                <th className="py-1 pr-2 text-right">{t("Força")}</th>
                <th className="py-1 pr-2 text-right">{t("Potencial")}</th>
                <th className="py-1 pr-2" />
              </tr>
            </thead>
            <tbody>
              {base.relatorios.map((r) => (
                <tr key={r.id} className="border-b border-white/5">
                  <td className="py-1 pr-2 text-xs font-bold text-suave">
                    {NOME_POSICAO[r.jogador.posicao]}
                  </td>
                  <td className="py-1 pr-2">{r.jogador.nome}</td>
                  <td className="py-1 pr-2 text-suave">{mundo.pais(r.pais)?.nome ?? r.pais}</td>
                  <td className="py-1 pr-2 text-right">{idadeEm(r.jogador.nascimento, c.data)}</td>
                  <td className="py-1 pr-2 text-right">{r.jogador.forca}</td>
                  <td className="py-1 pr-2 text-right font-bold">
                    {r.faixa[0]}–{r.faixa[1]}
                  </td>
                  <td className="flex gap-1 py-1">
                    <button
                      type="button"
                      className={botao}
                      disabled={lotada}
                      title={lotada ? t("A base está cheia") : undefined}
                      onClick={() => mudar((x) => contratarProspecto(x, mundo, r.id))}
                    >
                      {t("Trazer para a base")}
                    </button>
                    <button
                      type="button"
                      className={botao}
                      onClick={() => mudar((x) => descartarRelatorio(x, mundo, r.id))}
                    >
                      {t("Descartar")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-suave">{t("Nenhum relatório. Mande um olheiro viajar.")}</p>
        )}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 font-placar text-2xl font-bold">
            {t("Seus olheiros ({n} de {max})", {
              n: base.olheiros.length,
              max: OLHEIROS_MAXIMO,
            })}
          </h2>
          {base.olheiros.length ? (
            <ul className="flex flex-col gap-2 text-sm">
              {base.olheiros.map((o) => {
                const d = destino[o.id] ?? { pais: paisDoClube, meses: 3 };
                return (
                  <li key={o.id} className="rounded border border-white/10 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <span>
                        {o.nome}{" "}
                        <span className="text-canarinho" title={t("Nível {n}", { n: o.nivel })}>
                          {estrelas(o.nivel)}
                        </span>
                      </span>
                      <button
                        type="button"
                        className={botao}
                        onClick={() => mudar((x) => demitirOlheiro(x, mundo, o.id))}
                      >
                        {t("Demitir")}
                      </button>
                    </div>
                    {o.missao ? (
                      <p className="mt-1 text-xs text-suave">
                        {t("Em {pais} até {data}.", {
                          pais: mundo.pais(o.missao.pais)?.nome ?? o.missao.pais,
                          data: dataCurta(o.missao.ate),
                        })}
                      </p>
                    ) : (
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        <select
                          className={estiloCampo}
                          value={d.pais}
                          onChange={(e) =>
                            setDestino({ ...destino, [o.id]: { ...d, pais: e.target.value } })
                          }
                        >
                          {paises.map((p) => (
                            <option key={p!.codigo} value={p!.codigo}>
                              {p!.nome}
                            </option>
                          ))}
                        </select>
                        <select
                          className={estiloCampo}
                          value={d.meses}
                          onChange={(e) =>
                            setDestino({
                              ...destino,
                              [o.id]: { ...d, meses: Number(e.target.value) },
                            })
                          }
                        >
                          {MESES_DE_MISSAO.map((m) => (
                            <option key={m} value={m}>
                              {m === 1 ? t("1 mês") : t("{n} meses", { n: m })}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className={botao}
                          onClick={() =>
                            mudar((x) => enviarOlheiro(x, mundo, o.id, d.pais, d.meses))
                          }
                        >
                          {t("Enviar")}
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-suave">{t("Nenhum olheiro contratado.")}</p>
          )}
        </div>
        <div>
          <h2 className="mb-2 font-placar text-2xl font-bold">{t("Olheiros disponíveis")}</h2>
          <p className="mb-2 text-xs text-suave">
            {t(
              "Mudam todo mês. Olheiro de nível alto acha talentos melhores e estima o potencial com mais precisão; países fortes no futebol revelam mais.",
            )}
          </p>
          <ul className="flex flex-col gap-2 text-sm">
            {disponiveis.map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between gap-2 rounded border border-white/10 p-2"
              >
                <span>
                  {o.nome} <span className="text-canarinho">{estrelas(o.nivel)}</span>
                  <span className="ml-2 text-xs text-suave">
                    {t("{salario} por mês", { salario: o.salario.toLocaleString(locale()) })}
                  </span>
                </span>
                <button
                  type="button"
                  className={botao}
                  disabled={base.olheiros.length >= OLHEIROS_MAXIMO}
                  onClick={() => mudar((x) => contratarOlheiro(x, mundo, o.id))}
                >
                  {t("Contratar")}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
