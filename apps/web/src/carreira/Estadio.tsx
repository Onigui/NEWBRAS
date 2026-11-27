/**
 * Estádio (etapa 14c), dentro da aba Finanças: preços por setor com o preço justo e a previsão de
 * público e renda, sócio-torcedor, obra de ampliação, proposta pelo nome do estádio e eventos.
 */
import { useState } from "react";
import {
  aceitarNome,
  AMPLIACOES,
  capacidadeAtual,
  dataCurta,
  definirMensalidade,
  definirPrecos,
  estadioDe,
  iniciarObra,
  mensalidadeJusta,
  nomeDoEstadio,
  orcamentoDaObra,
  precosAtuais,
  precosJustos,
  publicoDoJogo,
  recusarNome,
  responderEvento,
  SETORES,
  sociosEsperados,
  tetoDosPrecos,
  type Carreira,
  type Setor,
} from "@newbras/engine";
import { locale, t } from "@newbras/textos";
import { estiloCampo } from "../editor/ui";
import type { MundoMontado } from "./useCarreira";

const dinheiro = (v: number) => Math.round(v).toLocaleString(locale());
const botao =
  "rounded border border-placar-borda px-2 py-0.5 text-xs hover:border-canarinho hover:text-canarinho disabled:opacity-40";

const NOME_DO_SETOR: Record<Setor, string> = {
  popular: t("Popular"),
  central: t("Central"),
  camarote: t("Camarote"),
};

const NOME_DO_EVENTO = {
  show: t("Show"),
  festival: t("Festival"),
  "jogo-beneficente": t("Jogo beneficente"),
} as const;

export function PainelDoEstadio({
  c,
  montado,
  mudar,
}: {
  c: Carreira;
  montado: MundoMontado;
  mudar: (f: (c: Carreira) => Carreira) => void;
}) {
  const { mundo } = montado;
  const e = estadioDe(c);
  const atuais = precosAtuais(c, mundo);
  const justos = precosJustos(c, mundo);
  const teto = tetoDosPrecos(c, mundo);
  const [rascunho, setRascunho] = useState<Record<Setor, number>>(atuais);
  const previsto = publicoDoJogo(c, mundo, undefined, rascunho);
  const atual = publicoDoJogo(c, mundo, undefined, atuais);
  const mensalidade = e.mensalidade ?? mensalidadeJusta(c, mundo);
  const [novaMensalidade, setNovaMensalidade] = useState(mensalidade);
  const [aviso, setAviso] = useState("");
  const capacidade = capacidadeAtual(c, mundo);

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="mb-1 font-placar text-xl font-bold">{t("Estádio")}</h2>
        <p className="text-sm">
          {t("{estadio}: {capacidade} lugares.", {
            estadio: nomeDoEstadio(c, mundo),
            capacidade: dinheiro(capacidade),
          })}
          {e.naming && (
            <span className="ml-1 text-suave">
              {t("(nome vendido por {valor} ao ano, até {fim})", {
                valor: dinheiro(e.naming.valorAnual),
                fim: dataCurta(e.naming.fim),
              })}
            </span>
          )}
        </p>
        {(e.abuso ?? 0) >= 2 && (
          <p className="text-sm text-[#ff8a7a]">
            {t(
              "A torcida está revoltada com o preço dos ingressos: mais um jogo assim e vem protesto.",
            )}
          </p>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="mb-1 font-bold">{t("Ingressos")}</h3>
          <table className="w-full max-w-lg text-sm">
            <thead className="text-left text-xs text-suave">
              <tr>
                <th className="py-1 pr-2">{t("Setor")}</th>
                <th className="py-1 pr-2 text-right">{t("Preço justo")}</th>
                <th className="py-1 pr-2 text-right">{t("Preço")}</th>
                <th className="py-1 pr-2 text-right">{t("Público")}</th>
                <th className="py-1 text-right">{t("Renda")}</th>
              </tr>
            </thead>
            <tbody>
              {SETORES.map((s) => (
                <tr key={s} className="border-b border-white/5">
                  <td className="py-1 pr-2">{NOME_DO_SETOR[s]}</td>
                  <td className="py-1 pr-2 text-right text-suave">{dinheiro(justos[s])}</td>
                  <td className="py-1 pr-2 text-right">
                    <input
                      type="number"
                      min={1}
                      max={teto[s]}
                      className={`${estiloCampo} w-24! text-right`}
                      value={rascunho[s]}
                      onChange={(ev) => setRascunho({ ...rascunho, [s]: Number(ev.target.value) })}
                    />
                  </td>
                  <td className="py-1 pr-2 text-right">{dinheiro(previsto.porSetor[s].publico)}</td>
                  <td className="py-1 text-right">{dinheiro(previsto.porSetor[s].renda)}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td className="py-1 pr-2" colSpan={3}>
                  {t("Previsão por jogo (com {socios} sócios)", {
                    socios: dinheiro(previsto.socios),
                  })}
                </td>
                <td className="py-1 pr-2 text-right">{dinheiro(previsto.publico)}</td>
                <td className="py-1 text-right">{dinheiro(previsto.renda)}</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={botao}
              onClick={() => {
                const r = definirPrecos(c, mundo, rascunho);
                const aplicados = r.estadio?.precos ?? rascunho;
                setRascunho(aplicados);
                setAviso(
                  SETORES.some((s) => aplicados[s] < rascunho[s])
                    ? t("O preço sobe no máximo 20% por mês: o que passou foi cortado.")
                    : "",
                );
                mudar(() => r);
              }}
            >
              {t("Aplicar preços")}
            </button>
            <button type="button" className={botao} onClick={() => setRascunho(justos)}>
              {t("Usar o preço justo")}
            </button>
            <span className="text-xs text-suave">
              {t("Hoje: {renda} por jogo.", { renda: dinheiro(atual.renda) })}
            </span>
          </div>
          {aviso && <p className="text-xs text-[#ffc38a]">{aviso}</p>}
          <p className="mt-1 max-w-lg text-xs text-suave">
            {t(
              "O preço justo sobe com a fase do time e com o peso do jogo. Acima dele o público cai rápido, e a renda máxima fica perto dele. O preço sobe no máximo 20% por mês; caro demais por três jogos seguidos gera protesto.",
            )}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h3 className="mb-1 font-bold">{t("Sócio-torcedor")}</h3>
            <p className="text-sm">
              {t("{socios} sócios pagando {mensalidade} por mês (justo: {justa}).", {
                socios: dinheiro(e.socios ?? sociosEsperados(c, mundo, mensalidade)),
                mensalidade: dinheiro(mensalidade),
                justa: dinheiro(mensalidadeJusta(c, mundo)),
              })}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={1}
                className={`${estiloCampo} w-28!`}
                value={novaMensalidade}
                onChange={(ev) => setNovaMensalidade(Number(ev.target.value))}
              />
              <span className="text-xs text-suave">
                {t("com esse valor: uns {n} sócios", {
                  n: dinheiro(sociosEsperados(c, mundo, novaMensalidade)),
                })}
              </span>
              <button
                type="button"
                className={botao}
                onClick={() => mudar((x) => definirMensalidade(x, mundo, novaMensalidade))}
              >
                {t("Aplicar mensalidade")}
              </button>
            </div>
          </div>

          <div>
            <h3 className="mb-1 font-bold">{t("Obras")}</h3>
            {e.obra ? (
              <p className="text-sm">
                {t(
                  "Ampliação de {lugares} lugares em andamento: pronta em {fim} ({pago} de {custo} pagos). Durante a obra, 10% do estádio fica fechado.",
                  {
                    lugares: dinheiro(e.obra.lugares),
                    fim: dataCurta(e.obra.fim),
                    pago: dinheiro(e.obra.pago),
                    custo: dinheiro(e.obra.custo),
                  },
                )}
              </p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {AMPLIACOES.map((l) => {
                  const o = orcamentoDaObra(mundo, c.clube, l);
                  return (
                    <button
                      key={l}
                      type="button"
                      className={botao}
                      title={t("Entrada de 30%; o resto em parcelas mensais até o fim")}
                      onClick={() => {
                        const r = iniciarObra(c, mundo, l);
                        setAviso(
                          r.resultado === "caixa"
                            ? t("Não há caixa para a entrada da obra (30%).")
                            : r.resultado === "limite"
                              ? t("O estádio não passa de 100 mil lugares.")
                              : "",
                        );
                        mudar(() => r.carreira);
                      }}
                    >
                      {t("+{lugares} lugares: {custo}, {meses} meses", {
                        lugares: dinheiro(l),
                        custo: dinheiro(o.custo),
                        meses: o.meses,
                      })}
                    </button>
                  );
                })}
              </div>
            )}
            <p className="mt-1 text-xs text-suave">
              {t(
                "Competições continentais exigem 20 mil lugares; o Mundial, 30 mil. Sem isso, o jogo vai para um estádio alugado e a renda cai 40%.",
              )}
            </p>
          </div>

          {e.ofertaDeNome && (
            <div className="rounded border border-placar-borda p-2 text-sm">
              <p>
                {t(
                  "A {marca} quer dar nome ao estádio ({nome}): {valor} por ano, por {anos} anos. Responda até {ate}.",
                  {
                    marca: e.ofertaDeNome.marca,
                    nome: `${e.ofertaDeNome.marca} Arena`,
                    valor: dinheiro(e.ofertaDeNome.valorAnual),
                    anos: e.ofertaDeNome.anos,
                    ate: dataCurta(e.ofertaDeNome.ate),
                  },
                )}
              </p>
              <div className="mt-1 flex gap-1">
                <button
                  type="button"
                  className={botao}
                  onClick={() => mudar((x) => aceitarNome(x))}
                >
                  {t("Aceitar")}
                </button>
                <button
                  type="button"
                  className={botao}
                  onClick={() => mudar((x) => recusarNome(x))}
                >
                  {t("Recusar")}
                </button>
              </div>
            </div>
          )}

          {(e.eventos ?? []).map((ev) => (
            <div key={ev.id} className="rounded border border-placar-borda p-2 text-sm">
              <p>
                {t("{evento} no estádio em {data}: {renda} para o clube. Responda até {ate}.", {
                  evento: NOME_DO_EVENTO[ev.tipo],
                  data: dataCurta(ev.data),
                  renda: dinheiro(ev.renda),
                  ate: dataCurta(ev.ate),
                })}
              </p>
              <div className="mt-1 flex gap-1">
                <button
                  type="button"
                  className={botao}
                  onClick={() => mudar((x) => responderEvento(x, ev.id, true))}
                >
                  {t("Aceitar")}
                </button>
                <button
                  type="button"
                  className={botao}
                  onClick={() => mudar((x) => responderEvento(x, ev.id, false))}
                >
                  {t("Recusar")}
                </button>
              </div>
            </div>
          ))}
          {(e.agendados ?? []).length > 0 && (
            <p className="text-xs text-suave">
              {t("Eventos marcados: {lista}.", {
                lista: (e.agendados ?? []).map((ev) => dataCurta(ev.data)).join(", "),
              })}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
