/**
 * Finanças (etapa 14a): caixa, orçamento do mês (TV, patrocínio, comercial, salários, estrutura,
 * manutenção e olheiros), estádio (preço, público e renda por jogo), extrato mês a mês com a
 * bilheteria, as premiações e as transferências, e a folha salarial.
 */
import { useState } from "react";
import {
  caixaDe,
  contratoDe,
  criseDe,
  ofertaDeCredito,
  parcelaDoEmprestimo,
  pegarEmprestimoBancario,
  PRAZOS_DO_EMPRESTIMO,
  proibidoDeContratar,
  quitarEmprestimo,
  folhaSalarial,
  orcamentoMensal,
  receitaAnual,
  type Carreira,
  type CategoriaFinanceira,
} from "@newbras/engine";
import { locale, t } from "@newbras/textos";
import { NOME_POSICAO } from "@newbras/data";
import { estiloCampo } from "../editor/ui";
import { PainelDoEstadio } from "./Estadio";

const botao =
  "rounded border border-placar-borda px-2 py-0.5 text-xs hover:border-canarinho hover:text-canarinho disabled:opacity-40";
import type { MundoMontado } from "./useCarreira";

const dinheiro = (v: number) => Math.round(v).toLocaleString(locale());

const NOME: Record<CategoriaFinanceira, string> = {
  tv: t("Cotas de TV"),
  patrocinio: t("Patrocínio"),
  comercial: t("Comercial"),
  bilheteria: t("Bilheteria"),
  premios: t("Premiações"),
  salarios: t("Salários"),
  estrutura: t("Estrutura e funcionários"),
  manutencao: t("Manutenção do estádio"),
  olheiros: t("Olheiros"),
  emprestimo: t("Parcelas do banco"),
  credito: t("Crédito bancário"),
  socios: t("Sócios"),
  naming: t("Nome do estádio"),
  eventos: t("Eventos"),
  obras: t("Obras"),
};
const RECEITAS: CategoriaFinanceira[] = [
  "tv",
  "patrocinio",
  "comercial",
  "bilheteria",
  "premios",
  "socios",
  "naming",
  "eventos",
  "credito",
];
const DESPESAS: CategoriaFinanceira[] = [
  "salarios",
  "estrutura",
  "manutencao",
  "olheiros",
  "obras",
  "emprestimo",
];

function Valor({ v }: { v: number }) {
  return (
    <span className={v < 0 ? "text-[#ff8a7a]" : v > 0 ? "text-[#7ed37a]" : "text-suave"}>
      {v > 0 ? "+" : ""}
      {dinheiro(v)}
    </span>
  );
}

export function Financas({
  c,
  montado,
  mudar,
}: {
  c: Carreira;
  montado: MundoMontado;
  mudar: (f: (c: Carreira) => Carreira) => void;
}) {
  const { mundo } = montado;
  const crise = criseDe(c);
  const proibido = proibidoDeContratar(c, mundo);
  const oferta = ofertaDeCredito(c, mundo);
  const [valor, setValor] = useState(0);
  const [prazo, setPrazo] = useState<number>(24);
  const caixa = caixaDe(c, mundo);
  const receita = receitaAnual(mundo, c.clube);
  const orcamento = orcamentoMensal(c, mundo);
  const saldoFixo = Object.values(orcamento).reduce((s, v) => s + (v ?? 0), 0);
  const folha = folhaSalarial(c, mundo);
  const meses = [...(c.financas ?? [])].reverse().slice(0, 12);
  const transferenciasDoMes = (mes: string) => {
    let compras = 0;
    let vendas = 0;
    for (const x of c.transferencias ?? []) {
      if (!x.valor || !x.data.startsWith(mes)) continue;
      if (x.para === c.clube) compras += x.valor;
      else if (x.de === c.clube) vendas += x.valor;
    }
    return { compras, vendas };
  };
  const salarios = mundo
    .elenco(c.clube)
    .map((j) => ({ j, salario: contratoDe(c, mundo, j.id)?.salario ?? 0 }))
    .sort((a, b) => b.salario - a.salario)
    .slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-wrap items-baseline gap-x-8 gap-y-1">
        <h2 className="font-placar text-2xl font-bold">
          {t("Caixa: {valor}", { valor: dinheiro(caixa) })}
        </h2>
        <p className="text-suave">
          {t("Receita anual estimada: {valor}. Folha salarial: {folha} por mês.", {
            valor: dinheiro(receita),
            folha: dinheiro(folha),
          })}
        </p>
      </section>

      {(crise.mesesAtrasados > 0 || proibido) && (
        <section className="rounded-md border border-[#ff8a7a]/50 bg-[#ff8a7a]/10 px-3 py-2 text-sm text-[#ffb3a8]">
          <h2 className="font-placar text-xl font-bold">{t("Crise")}</h2>
          {crise.mesesAtrasados > 0 && (
            <p>
              {t(
                "Salários atrasados há {meses} mês(es): {valor} devidos. A moral do elenco cai todo mês, ninguém renova e, a partir de 3 meses, os melhores podem rescindir e sair de graça.",
                { meses: crise.mesesAtrasados, valor: dinheiro(crise.salariosAtrasados) },
              )}
            </p>
          )}
          {proibido && (
            <p>{t("Proibido de contratar até pagar os atrasados e sair da dívida grave.")}</p>
          )}
          {crise.pontosPerdidos?.pontos ? (
            <p>
              {t("Pontos perdidos na liga por punição: {n}.", { n: crise.pontosPerdidos.pontos })}
            </p>
          ) : null}
          <p className="mt-1 text-xs">
            {t(
              "Os atrasados são pagos sozinhos assim que houver caixa. Vender jogadores ou pegar um empréstimo no banco são as saídas.",
            )}
          </p>
        </section>
      )}

      <section className="grid gap-5 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 font-placar text-xl font-bold">{t("Todo mês")}</h2>
          <table className="w-full max-w-md text-sm">
            <tbody>
              {[...RECEITAS, ...DESPESAS]
                .filter((k) => orcamento[k] !== undefined)
                .map((k) => (
                  <tr key={k} className="border-b border-white/5">
                    <td className="py-1 pr-2">{NOME[k]}</td>
                    <td className="py-1 text-right">
                      <Valor v={orcamento[k] ?? 0} />
                    </td>
                  </tr>
                ))}
              <tr className="font-bold">
                <td className="py-1 pr-2">{t("Saldo fixo do mês")}</td>
                <td className="py-1 text-right">
                  <Valor v={saldoFixo} />
                </td>
              </tr>
            </tbody>
          </table>
          <p className="mt-1 max-w-md text-xs text-suave">
            {t(
              "Entra e sai todo dia 1. A bilheteria entra a cada jogo em casa; título e vice dão premiação.",
            )}
          </p>
        </div>
      </section>

      <PainelDoEstadio c={c} montado={montado} mudar={mudar} />

      <section>
        <h2 className="mb-2 font-placar text-xl font-bold">{t("Banco")}</h2>
        {oferta.tipo === "ok" ? (
          <div className="flex flex-col gap-1 text-sm">
            <p>
              {t("Crédito disponível: até {limite}, com juros de {taxa}% ao mês.", {
                limite: dinheiro(oferta.limite),
                taxa: Math.round(oferta.taxa * 1000) / 10,
              })}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                className={`${estiloCampo} w-40!`}
                value={valor}
                min={0}
                max={oferta.limite}
                onChange={(e) => setValor(Number(e.target.value))}
              />
              <select
                className={`${estiloCampo} w-36!`}
                value={prazo}
                onChange={(e) => setPrazo(Number(e.target.value))}
              >
                {PRAZOS_DO_EMPRESTIMO.map((p) => (
                  <option key={p} value={p}>
                    {t("{n} meses", { n: p })}
                  </option>
                ))}
              </select>
              {valor > 0 && valor <= oferta.limite && (
                <span className="text-xs text-suave">
                  {t("Parcela de {parcela} por mês (total de {total}).", {
                    parcela: dinheiro(parcelaDoEmprestimo(valor, oferta.taxa, prazo)),
                    total: dinheiro(parcelaDoEmprestimo(valor, oferta.taxa, prazo) * prazo),
                  })}
                </span>
              )}
              <button
                type="button"
                className={botao}
                disabled={valor <= 0 || valor > oferta.limite}
                onClick={() => {
                  mudar((x) => pegarEmprestimoBancario(x, mundo, valor, prazo).carreira);
                  setValor(0);
                }}
              >
                {t("Pegar empréstimo")}
              </button>
            </div>
            <p className="text-xs text-suave">
              {t(
                "A parcela sai todo dia 1, depois dos salários. Parcela sem caixa atrasa com multa de 2%; três atrasos e o crédito acaba.",
              )}
            </p>
          </div>
        ) : (
          <p className="text-sm text-[#ffc38a]">
            {oferta.motivo === "inadimplente"
              ? t("Crédito negado: o clube atrasou parcelas demais.")
              : oferta.motivo === "divida"
                ? t("Crédito negado: a dívida já passa da receita de um ano.")
                : t("Crédito esgotado: o clube já deve ao banco o máximo que ele empresta.")}
          </p>
        )}
        {(c.emprestimosBancarios ?? []).length > 0 && (
          <table className="mt-2 w-full max-w-2xl text-sm">
            <thead className="text-left text-xs text-suave">
              <tr>
                <th className="py-1 pr-2">{t("Início")}</th>
                <th className="py-1 pr-2 text-right">{t("Valor")}</th>
                <th className="py-1 pr-2 text-right">{t("Saldo")}</th>
                <th className="py-1 pr-2 text-right">{t("Parcela")}</th>
                <th className="py-1 pr-2 text-right">{t("Restam")}</th>
                <th className="py-1" />
              </tr>
            </thead>
            <tbody>
              {(c.emprestimosBancarios ?? []).map((e) => (
                <tr key={e.id} className="border-b border-white/5">
                  <td className="py-1 pr-2">{e.inicio.split("-").reverse().join("/")}</td>
                  <td className="py-1 pr-2 text-right">{dinheiro(e.valor)}</td>
                  <td className="py-1 pr-2 text-right">{dinheiro(e.saldo)}</td>
                  <td className="py-1 pr-2 text-right">{dinheiro(e.parcela)}</td>
                  <td className="py-1 pr-2 text-right">
                    {e.restantes}
                    {e.atrasos ? (
                      <span className="ml-1 text-xs text-[#ff8a7a]">
                        {t("({n} atrasos)", { n: e.atrasos })}
                      </span>
                    ) : null}
                  </td>
                  <td className="py-1 text-right">
                    <button
                      type="button"
                      className={botao}
                      disabled={caixa < e.saldo}
                      onClick={() => mudar((x) => quitarEmprestimo(x, mundo, e.id))}
                    >
                      {t("Quitar")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-placar text-xl font-bold">{t("Extrato")}</h2>
        {meses.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-suave">
                <tr>
                  <th className="py-1 pr-3">{t("Mês")}</th>
                  {[...RECEITAS, ...DESPESAS].map((k) => (
                    <th key={k} className="py-1 pr-3 text-right">
                      {NOME[k]}
                    </th>
                  ))}
                  <th className="py-1 pr-3 text-right">{t("Vendas")}</th>
                  <th className="py-1 pr-3 text-right">{t("Compras")}</th>
                  <th className="py-1 text-right">{t("Saldo")}</th>
                </tr>
              </thead>
              <tbody>
                {meses.map((m) => {
                  const tr = transferenciasDoMes(m.mes);
                  const saldo =
                    Object.values(m.valores).reduce((s, v) => s + (v ?? 0), 0) +
                    tr.vendas -
                    tr.compras;
                  return (
                    <tr key={m.mes} className="border-b border-white/5">
                      <td className="py-1 pr-3 whitespace-nowrap">
                        {m.mes.slice(5)}/{m.mes.slice(0, 4)}
                        {m.jogosEmCasa ? (
                          <span className="ml-1 text-xs text-suave">
                            {t("({n} em casa, {publico} pagantes)", {
                              n: m.jogosEmCasa,
                              publico: dinheiro(m.publico ?? 0),
                            })}
                          </span>
                        ) : null}
                      </td>
                      {[...RECEITAS, ...DESPESAS].map((k) => (
                        <td key={k} className="py-1 pr-3 text-right">
                          {m.valores[k] ? <Valor v={m.valores[k] ?? 0} /> : "—"}
                        </td>
                      ))}
                      <td className="py-1 pr-3 text-right">
                        {tr.vendas ? <Valor v={tr.vendas} /> : "—"}
                      </td>
                      <td className="py-1 pr-3 text-right">
                        {tr.compras ? <Valor v={-tr.compras} /> : "—"}
                      </td>
                      <td className="py-1 text-right font-bold">
                        <Valor v={saldo} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-suave">
            {t("O extrato começa no primeiro jogo em casa ou no primeiro dia do mês.")}
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-placar text-xl font-bold">{t("Maiores salários")}</h2>
        <table className="w-full max-w-lg text-sm">
          <tbody>
            {salarios.map(({ j, salario }) => (
              <tr key={j.id} className="border-b border-white/5">
                <td className="py-1 pr-2 text-xs font-bold text-suave">
                  {NOME_POSICAO[j.posicao]}
                </td>
                <td className="py-1 pr-2">{j.nome}</td>
                <td className="py-1 text-right">{dinheiro(salario)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
