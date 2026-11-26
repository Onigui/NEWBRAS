/**
 * Seleções (etapa 11e): os convocados do clube, e de cada seleção os próximos jogos, os resultados
 * (oficiais e amistosos nas datas FIFA) e a convocação de 26.
 */
import { useMemo, useState } from "react";
import { NOME_POSICAO } from "@newbras/data";
import {
  convocadosDoClube,
  dataCurta,
  estadoDe,
  foraPelaSelecao,
  idadeEm,
  jogosDaSelecao,
  nomeCurtoDaCompeticao,
  selecoesDoMundo,
  type Carreira,
  type JogoDeSelecao,
} from "@newbras/engine";
import { Campo, estiloCampo } from "../editor/ui";
import type { MundoMontado } from "./useCarreira";
import { t } from "@newbras/textos";

const PROXIMOS = 6;
const RESULTADOS = 12;

export function Selecoes({ c, montado }: { c: Carreira; montado: MundoMontado }) {
  const { mundo } = montado;
  const clube = mundo.clube(c.clube);
  const convocados = useMemo(() => convocadosDoClube(mundo, c.clube), [mundo, c.clube]);
  const fora = foraPelaSelecao(c, mundo, c.data);
  const nome = (pais: string) => mundo.pais(pais)?.nome ?? pais;
  const selecoes = useMemo(() => {
    const nomeDe = (pais: string) => mundo.pais(pais)?.nome ?? pais;
    return selecoesDoMundo(mundo)
      .filter((p) => mundo.pais(p))
      .sort((a, b) => nomeDe(a).localeCompare(nomeDe(b), "pt-BR"));
  }, [mundo]);
  const [selecao, setSelecao] = useState(
    clube && mundo.pais(clube.pais) ? clube.pais : (selecoes[0] ?? "BRA"),
  );
  const jogos = useMemo(() => jogosDaSelecao(c, mundo, selecao), [c, mundo, selecao]);
  const proximos = jogos.filter((j) => !j.placar && j.data >= c.data).slice(0, PROXIMOS);
  const resultados = jogos
    .filter((j) => j.placar)
    .slice(-RESULTADOS)
    .reverse();
  const convocacao = mundo.elenco(selecao);

  return (
    <div className="flex flex-col gap-5">
      <section>
        <h2 className="mb-2 font-placar text-2xl font-bold">
          {t("Convocados do {clube}", { clube: clube?.nomeCurto ?? c.clube })}
        </h2>
        {convocados.size ? (
          <table className="w-full max-w-3xl text-sm">
            <thead className="text-left text-xs text-suave">
              <tr>
                <th className="py-1 pr-2">{t("Jogador")}</th>
                <th className="py-1 pr-2">{t("Seleção")}</th>
                <th className="py-1 pr-2">{t("Agora")}</th>
                <th className="py-1 pr-2 text-right">{t("Jogos")}</th>
                <th className="py-1 pr-2 text-right">{t("Gols")}</th>
              </tr>
            </thead>
            <tbody>
              {[...convocados].map(([id, pais]) => {
                const e = estadoDe(c, id);
                return (
                  <tr key={id} className="border-b border-white/5">
                    <td className="py-1 pr-2">{mundo.jogador(id)?.nome ?? id}</td>
                    <td className="py-1 pr-2">
                      <button
                        type="button"
                        className="underline decoration-white/30 hover:text-canarinho"
                        onClick={() => setSelecao(pais)}
                      >
                        {nome(pais)}
                      </button>
                    </td>
                    <td className="py-1 pr-2 text-suave">
                      {fora.has(id) ? t("com a seleção") : t("no clube")}
                    </td>
                    <td className="py-1 pr-2 text-right">{e.selecao?.jogos ?? 0}</td>
                    <td className="py-1 pr-2 text-right">{e.selecao?.gols ?? 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-suave">{t("Nenhum jogador do clube está numa convocação.")}</p>
        )}
        <p className="mt-2 max-w-3xl text-xs text-suave">
          {t(
            "Nas datas FIFA os convocados se apresentam à seleção; fora delas, saem 3 dias antes de cada jogo e ficam durante os torneios. Quem joga pela seleção volta cansado.",
          )}
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <h2 className="font-placar text-2xl font-bold">{nome(selecao)}</h2>
          <Campo rotulo={t("Seleção")}>
            <select
              className={estiloCampo}
              value={selecao}
              onChange={(e) => setSelecao(e.target.value)}
            >
              {selecoes.map((p) => (
                <option key={p} value={p}>
                  {nome(p)}
                </option>
              ))}
            </select>
          </Campo>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <ListaDeJogos
              titulo={t("Próximos jogos")}
              vazio={t("Nenhum jogo marcado. Os amistosos saem na véspera de cada data FIFA.")}
              jogos={proximos}
              selecao={selecao}
              montado={montado}
            />
            <ListaDeJogos
              titulo={t("Resultados")}
              vazio={t("Ainda sem jogos nesta carreira.")}
              jogos={resultados}
              selecao={selecao}
              montado={montado}
            />
          </div>
          <div>
            <h3 className="mb-1 text-sm font-bold text-suave">
              {t("Convocação ({n})", { n: convocacao.length })}
            </h3>
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-suave">
                <tr>
                  <th className="py-1 pr-2">{t("Pos.")}</th>
                  <th className="py-1 pr-2">{t("Jogador")}</th>
                  <th className="py-1 pr-2 text-right">{t("Idade")}</th>
                  <th className="py-1 pr-2 text-right">{t("Força")}</th>
                  <th className="py-1 pr-2">{t("Clube")}</th>
                </tr>
              </thead>
              <tbody>
                {convocacao.map((j) => {
                  const nosso = j.clube === c.clube;
                  return (
                    <tr
                      key={j.id}
                      className={`border-b border-white/5 ${nosso ? "bg-canarinho/10" : ""}`}
                    >
                      <td className="py-0.5 pr-2 text-xs font-bold text-suave">
                        {NOME_POSICAO[j.posicao]}
                      </td>
                      <td className="py-0.5 pr-2">{j.nome}</td>
                      <td className="py-0.5 pr-2 text-right">{idadeEm(j.nascimento, c.data)}</td>
                      <td className="py-0.5 pr-2 text-right font-bold">{j.forca}</td>
                      <td className="py-0.5 pr-2 text-suave">
                        {j.clube ? (mundo.clube(j.clube)?.nomeCurto ?? j.clube) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-1 text-xs text-suave">
              {t(
                "Os 26 melhores do país, em qualquer clube do mundo: 3 goleiros, 5 zagueiros, 4 laterais, 8 meias e 6 atacantes.",
              )}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function ListaDeJogos({
  titulo,
  vazio,
  jogos,
  selecao,
  montado,
}: {
  titulo: string;
  vazio: string;
  jogos: readonly JogoDeSelecao[];
  selecao: string;
  montado: MundoMontado;
}) {
  const { mundo } = montado;
  const nome = (pais: string) => mundo.pais(pais)?.nome ?? pais;
  return (
    <div>
      <h3 className="mb-1 text-sm font-bold text-suave">{titulo}</h3>
      {jogos.length ? (
        <ul className="flex flex-col text-sm">
          {jogos.map((j, i) => {
            const comp = j.competicao ? mundo.competicao(j.competicao) : undefined;
            const nossoLado = j.casa === selecao ? 0 : 1;
            const [nos, eles] = j.placar
              ? [j.placar[nossoLado] ?? 0, j.placar[1 - nossoLado] ?? 0]
              : [0, 0];
            const [pn, pe] = j.penaltis
              ? [j.penaltis[nossoLado] ?? 0, j.penaltis[1 - nossoLado] ?? 0]
              : [0, 0];
            const resultado = j.placar
              ? nos > eles || (j.penaltis && pn > pe)
                ? "V"
                : nos === eles && !j.penaltis
                  ? "E"
                  : "D"
              : null;
            return (
              <li
                key={`${j.data}-${j.casa}-${j.fora}-${i}`}
                className="flex items-center gap-2 border-b border-white/5 py-1"
              >
                <span className="w-12 shrink-0 text-xs text-suave">{dataCurta(j.data)}</span>
                <span className="w-36 shrink-0 truncate text-xs text-suave">
                  {comp ? nomeCurtoDaCompeticao(comp) : t("Amistoso")}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  <span className={j.casa === selecao ? "font-bold" : ""}>{nome(j.casa)}</span>{" "}
                  {j.placar ? (
                    <span className="font-placar font-bold">
                      {j.placar[0]} x {j.placar[1]}
                      {j.penaltis ? ` (${j.penaltis[0]} x ${j.penaltis[1]} ${t("pên.")})` : ""}
                    </span>
                  ) : (
                    "x"
                  )}{" "}
                  <span className={j.fora === selecao ? "font-bold" : ""}>{nome(j.fora)}</span>
                  {j.neutro && <span className="ml-1 text-xs text-suave">{t("(neutro)")}</span>}
                </span>
                {resultado && (
                  <span
                    className={`w-5 shrink-0 rounded-sm text-center text-xs font-bold ${resultado === "V" ? "bg-[#7ed37a]/30" : resultado === "D" ? "bg-[#ff6b5c]/30" : "bg-white/10"}`}
                  >
                    {resultado === "V" ? t("V") : resultado === "D" ? t("D") : t("E")}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-suave">{vazio}</p>
      )}
    </div>
  );
}
