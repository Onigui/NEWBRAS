/**
 * O dia das finanças (etapas 14a e 14b): as transferências do dia no caixa da CPU, os salários
 * atrasados pagos assim que der e, todo dia 1, o mês do técnico (receitas e despesas fixas, depois
 * salários e parcelas do banco) e o mês da CPU (com a crise e o banco dos clubes da CPU).
 */
import { marcar } from "@newbras/textos";
import type { Carreira, Mundo, Noticia } from "../carreira/carreira";
import type { Transferencia } from "../mercado/comum";
import { crisesDaCpu, pagarAtrasados, salariosEParcelas } from "./crise";
import {
  folhaSalarial,
  lancar,
  mesDaCpu,
  orcamentoMensal,
  transferenciasNoCaixa,
} from "./financas";

export function diaDasFinancas(
  c: Carreira,
  mundo: Mundo,
  data: string,
): { carreira: Carreira; noticias: Noticia[] } {
  let r = transferenciasNoCaixa(c, mundo, data);
  const noticias: Noticia[] = [];
  const pagos = pagarAtrasados(r, mundo, data);
  r = pagos.carreira;
  noticias.push(...pagos.noticias);
  if (!data.endsWith("-01")) return { carreira: r, noticias };

  // O mês do técnico: o fixo primeiro, depois salários (prioridade) e parcelas.
  const valores = orcamentoMensal(r, mundo);
  const { salarios: _folha, ...fixos } = valores;
  r = lancar(r, mundo, data, fixos);
  const folha = folhaSalarial(r, mundo);
  const mes = salariosEParcelas(r, mundo, data, folha);
  r = mes.carreira;
  const receitas = (valores.tv ?? 0) + (valores.patrocinio ?? 0) + (valores.comercial ?? 0);
  const saldo = Object.values(fixos).reduce((s, v) => s + (v ?? 0), 0) - (mes.atrasou ? 0 : folha);
  noticias.push({
    data,
    tipo: "carreira",
    ...(mes.atrasou
      ? marcar(
          "Fechamento do mês: TV, patrocínio e comercial somaram {receitas}; os salários de {salarios} não foram pagos.",
          { receitas, salarios: folha },
        )
      : marcar(
          "Fechamento do mês: salários de {salarios} pagos; TV, patrocínio e comercial somaram {receitas}. Saldo fixo do mês: {saldo}.",
          { salarios: folha, receitas, saldo },
        )),
  });
  noticias.push(...mes.noticias);

  // O mês da CPU, com a crise, o banco e as rescisões.
  const crises = crisesDaCpu(r, mundo, data, mesDaCpu(r, mundo));
  r = { ...r, caixasCpu: crises.caixas, dividasCpu: crises.dividas };
  if (crises.rescisoes.length) {
    const novas: Transferencia[] = crises.rescisoes.map((x) => ({
      jogador: x.jogador,
      de: x.clube,
      data,
      valor: 0,
      tipo: "rescisao",
    }));
    r = { ...r, transferencias: [...(r.transferencias ?? []), ...novas] };
  }
  return { carreira: r, noticias };
}
