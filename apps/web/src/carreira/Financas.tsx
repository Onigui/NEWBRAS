/**
 * Finanças (etapa 14a): caixa, orçamento do mês (TV, patrocínio, comercial, salários, estrutura,
 * manutenção e olheiros), estádio (preço, público e renda por jogo), extrato mês a mês com a
 * bilheteria, as premiações e as transferências, e a folha salarial.
 */
import {
  caixaDe,
  contratoDe,
  folhaSalarial,
  orcamentoMensal,
  precoDoIngresso,
  receitaAnual,
  rendaDoJogo,
  type Carreira,
  type CategoriaFinanceira,
} from "@newbras/engine";
import { locale, t } from "@newbras/textos";
import { NOME_POSICAO } from "@newbras/data";
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
};
const RECEITAS: CategoriaFinanceira[] = ["tv", "patrocinio", "comercial", "bilheteria", "premios"];
const DESPESAS: CategoriaFinanceira[] = ["salarios", "estrutura", "manutencao", "olheiros"];

function Valor({ v }: { v: number }) {
  return (
    <span className={v < 0 ? "text-[#ff8a7a]" : v > 0 ? "text-[#7ed37a]" : "text-suave"}>
      {v > 0 ? "+" : ""}
      {dinheiro(v)}
    </span>
  );
}

export function Financas({ c, montado }: { c: Carreira; montado: MundoMontado }) {
  const { mundo } = montado;
  const clube = mundo.clube(c.clube);
  const caixa = caixaDe(c, mundo);
  const receita = receitaAnual(mundo, c.clube);
  const orcamento = orcamentoMensal(c, mundo);
  const saldoFixo = Object.values(orcamento).reduce((s, v) => s + (v ?? 0), 0);
  const jogo = rendaDoJogo(c, mundo, false);
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
        <div>
          <h2 className="mb-2 font-placar text-xl font-bold">{t("Estádio")}</h2>
          <p className="text-sm">
            {t("{estadio}: {capacidade} lugares, ingresso médio de {preco}.", {
              estadio: clube?.estadio.nome ?? "",
              capacidade: dinheiro(clube?.estadio.capacidade ?? 0),
              preco: dinheiro(precoDoIngresso(mundo, c.clube)),
            })}
          </p>
          <p className="text-sm">
            {t("Público esperado agora: {publico}, renda de {renda} por jogo em casa.", {
              publico: dinheiro(jogo.publico),
              renda: dinheiro(jogo.renda),
            })}
          </p>
          <p className="mt-1 text-xs text-suave">
            {t("O público sobe com a reputação do clube e com a moral do time.")}
          </p>
        </div>
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
