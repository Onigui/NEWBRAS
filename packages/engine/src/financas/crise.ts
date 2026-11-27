/**
 * Crise do clube mal administrado e empréstimo bancário (etapa 14b, pedido do dono em 27/11).
 *
 * O efeito cascata: sem dinheiro no dia 1, os salários atrasam. Cada mês atrasado derruba a moral
 * de todo o elenco e a confiança da diretoria; ninguém renova; os patrocinadores desconfiam (o
 * patrocínio cai 15%). Com 2 meses, a liga proíbe contratar; a partir de 4, tira 3 pontos por mês
 * (até 12 na temporada); a partir de 3, os melhores do elenco podem rescindir e sair de graça.
 * Pagar todos os atrasados encerra a crise.
 *
 * A saída é o banco. O limite é metade da receita anual menos o que já se deve ao banco; os juros
 * sobem com o risco (dívida sobre receita), de 0,8% a uns 3,8% ao mês. A parcela é fixa (tabela
 * Price) e sai todo dia 1, depois dos salários. Parcela sem caixa atrasa, com multa de 2%; três
 * atrasos e o crédito acaba. Dá para quitar antes, pagando o saldo.
 */
import { marcar } from "@newbras/textos";
import type { Carreira, Mundo, Noticia } from "../carreira/carreira";
import { estadoDe } from "../carreira/carreira";
import { moralDe } from "../elenco/vida";
import { caixaDe, saiuDoClube, transferir } from "../mercado/comum";
import { Rng } from "../rng";
import { lancar, receitaAnual } from "./financas";

export interface CriseDoClube {
  /** Salários devidos aos jogadores. */
  salariosAtrasados: number;
  /** Meses seguidos com salário atrasado. */
  mesesAtrasados: number;
  /** Pontos perdidos na temporada da liga (para o teto de 12). */
  pontosPerdidos?: { temporada: string; pontos: number };
}

export interface EmprestimoBancario {
  id: string;
  valor: number;
  /** Saldo devedor. */
  saldo: number;
  /** Juros ao mês (0,012 = 1,2%). */
  taxa: number;
  parcela: number;
  meses: number;
  restantes: number;
  inicio: string;
  atrasos: number;
}

export const PRAZOS_DO_EMPRESTIMO = [12, 24, 36, 60] as const;
const TAXA_BASE = 0.008;
const MULTA_DO_ATRASO = 0.02;
const ATRASOS_PARA_PERDER_O_CREDITO = 3;

const arredondar = (v: number) => Math.round(v / 1000) * 1000;

export const criseDe = (c: Carreira): CriseDoClube =>
  c.crise ?? { salariosAtrasados: 0, mesesAtrasados: 0 };

/** Dívida com o banco (soma dos saldos). */
export const dividaBancaria = (c: Carreira) =>
  (c.emprestimosBancarios ?? []).reduce((s, e) => s + e.saldo, 0);

/**
 * Proibido de contratar: salários atrasados há 2 meses ou mais, ou dívida grave (caixa negativo
 * de mais de metade da receita anual).
 */
export function proibidoDeContratar(c: Carreira, mundo: Mundo): boolean {
  if (criseDe(c).mesesAtrasados >= 2) return true;
  return caixaDe(c, mundo) < -0.5 * receitaAnual(mundo, c.clube);
}

export type OfertaDeCredito =
  | { tipo: "ok"; limite: number; taxa: number }
  | { tipo: "negado"; motivo: "inadimplente" | "divida" | "limite" };

/** O que o banco oferece agora: limite e juros pelo risco. */
export function ofertaDeCredito(c: Carreira, mundo: Mundo): OfertaDeCredito {
  if ((c.emprestimosBancarios ?? []).some((e) => e.atrasos >= ATRASOS_PARA_PERDER_O_CREDITO))
    return { tipo: "negado", motivo: "inadimplente" };
  const receita = receitaAnual(mundo, c.clube);
  const caixa = caixaDe(c, mundo);
  if (caixa < -receita) return { tipo: "negado", motivo: "divida" };
  const divida = dividaBancaria(c);
  const limite = arredondar(Math.max(0, receita * 0.5 - divida));
  if (limite < 100_000) return { tipo: "negado", motivo: "limite" };
  const risco = Math.min(1.5, Math.max(0, (divida - Math.min(0, caixa)) / Math.max(1, receita)));
  return { tipo: "ok", limite, taxa: Math.round((TAXA_BASE + 0.02 * risco) * 10_000) / 10_000 };
}

/** Parcela fixa da tabela Price. */
export function parcelaDoEmprestimo(valor: number, taxa: number, meses: number): number {
  if (taxa <= 0) return Math.round(valor / meses);
  return Math.round((valor * taxa) / (1 - (1 + taxa) ** -meses));
}

/** Pega o empréstimo: o dinheiro entra no caixa e a parcela sai todo dia 1. */
export function pegarEmprestimoBancario(
  c: Carreira,
  mundo: Mundo,
  valor: number,
  meses: number,
): { carreira: Carreira; resultado: OfertaDeCredito | { tipo: "invalido" } } {
  const oferta = ofertaDeCredito(c, mundo);
  if (oferta.tipo !== "ok") return { carreira: c, resultado: oferta };
  const v = arredondar(valor);
  if (v <= 0 || v > oferta.limite || !(PRAZOS_DO_EMPRESTIMO as readonly number[]).includes(meses))
    return { carreira: c, resultado: { tipo: "invalido" } };
  const e: EmprestimoBancario = {
    id: `banco:${c.data}:${(c.emprestimosBancarios ?? []).length}`,
    valor: v,
    saldo: v,
    taxa: oferta.taxa,
    parcela: parcelaDoEmprestimo(v, oferta.taxa, meses),
    meses,
    restantes: meses,
    inicio: c.data,
    atrasos: 0,
  };
  let r = lancar(c, mundo, c.data, { credito: v });
  r = {
    ...r,
    emprestimosBancarios: [...(r.emprestimosBancarios ?? []), e],
    noticias: [
      {
        data: c.data,
        tipo: "carreira" as const,
        ...marcar(
          "Empréstimo bancário de {valor} em {meses} parcelas de {parcela} (juros de {taxa}% ao mês).",
          { valor: v, meses, parcela: e.parcela, taxa: Math.round(e.taxa * 1000) / 10 },
        ),
      },
      ...r.noticias,
    ].slice(0, 200),
  };
  return { carreira: r, resultado: oferta };
}

/** Quita o empréstimo pagando o saldo de uma vez (se houver caixa). */
export function quitarEmprestimo(c: Carreira, mundo: Mundo, id: string): Carreira {
  const e = (c.emprestimosBancarios ?? []).find((x) => x.id === id);
  if (!e || caixaDe(c, mundo) < e.saldo) return c;
  const r = lancar(c, mundo, c.data, { emprestimo: -e.saldo });
  return { ...r, emprestimosBancarios: (r.emprestimosBancarios ?? []).filter((x) => x !== e) };
}

/** Paga os salários atrasados assim que houver caixa (todo dia). */
export function pagarAtrasados(
  c: Carreira,
  mundo: Mundo,
  data: string,
): { carreira: Carreira; noticias: Noticia[] } {
  const crise = criseDe(c);
  if (!crise.salariosAtrasados || caixaDe(c, mundo) < crise.salariosAtrasados)
    return { carreira: c, noticias: [] };
  let r = lancar(c, mundo, data, { salarios: -crise.salariosAtrasados });
  r = moralDoElenco(r, mundo, 5);
  r = { ...r, crise: { ...crise, salariosAtrasados: 0, mesesAtrasados: 0 } };
  return {
    carreira: r,
    noticias: [
      {
        data,
        tipo: "carreira",
        ...marcar("Salários atrasados quitados ({valor}): o elenco respira aliviado.", {
          valor: crise.salariosAtrasados,
        }),
      },
    ],
  };
}

function moralDoElenco(c: Carreira, mundo: Mundo, delta: number): Carreira {
  const jogadores = { ...c.jogadores };
  for (const j of mundo.elenco(c.clube)) {
    const e = estadoDe(c, j.id);
    jogadores[j.id] = { ...e, moral: Math.max(0, Math.min(100, moralDe(e) + delta)) };
  }
  return { ...c, jogadores };
}

/** A liga do técnico (id e temporada) para a perda de pontos. */
function ligaDoTecnico(c: Carreira, mundo: Mundo) {
  for (const e of Object.values(c.competicoes.competicoes)) {
    const comp = mundo.competicao(e.id);
    if (comp?.tipo === "liga" && !e.encerrada && e.participantes.includes(c.clube)) return e;
  }
  return undefined;
}

/**
 * Salários e parcelas do mês do técnico (chamado no dia 1, depois das receitas e despesas fixas).
 * Salário tem prioridade; sem caixa, atrasa e começa o efeito cascata.
 */
export function salariosEParcelas(
  c: Carreira,
  mundo: Mundo,
  data: string,
  folha: number,
): { carreira: Carreira; noticias: Noticia[]; atrasou: boolean } {
  const noticias: Noticia[] = [];
  let r = c;
  let crise = criseDe(r);
  let atrasou = false;
  // Salários do mês.
  if (caixaDe(r, mundo) >= folha) {
    r = lancar(r, mundo, data, { salarios: -folha });
  } else {
    atrasou = true;
    crise = {
      ...crise,
      salariosAtrasados: crise.salariosAtrasados + folha,
      mesesAtrasados: crise.mesesAtrasados + 1,
    };
    r = moralDoElenco(r, mundo, -8);
    noticias.push({
      data,
      tipo: "carreira",
      ...marcar(
        "Sem dinheiro em caixa: os salários do mês atrasaram ({meses} mês(es) seguidos, {valor} devidos). O elenco está revoltado.",
        { meses: crise.mesesAtrasados, valor: crise.salariosAtrasados },
      ),
    });
    // Punições da liga.
    if (crise.mesesAtrasados === 2)
      noticias.push({
        data,
        tipo: "carreira",
        ...marcar(
          "Punição: com 2 meses de salários atrasados, o clube está proibido de contratar até regularizar.",
        ),
      });
    const liga = ligaDoTecnico(r, mundo);
    if (crise.mesesAtrasados >= 4 && liga) {
      const ja =
        crise.pontosPerdidos?.temporada === liga.temporada ? crise.pontosPerdidos.pontos : 0;
      if (ja < 12) {
        const estado = r.competicoes.competicoes[liga.id];
        if (estado) {
          const penalidades = { ...estado.penalidades };
          penalidades[r.clube] = (penalidades[r.clube] ?? 0) + 3;
          r = {
            ...r,
            competicoes: {
              ...r.competicoes,
              competicoes: { ...r.competicoes.competicoes, [liga.id]: { ...estado, penalidades } },
            },
          };
          crise = { ...crise, pontosPerdidos: { temporada: liga.temporada, pontos: ja + 3 } };
          noticias.push({
            data,
            tipo: "carreira",
            ...marcar("Punição: a liga tirou 3 pontos do clube pelos salários atrasados."),
          });
        }
      }
    }
    // A partir de 3 meses, os melhores podem rescindir e sair de graça.
    if (crise.mesesAtrasados >= 3) {
      const rng = new Rng(`${c.semente}:rescisao:${data}`);
      const elenco = mundo.elenco(r.clube);
      const melhores = [...elenco].sort((a, b) => b.forca - a.forca).slice(0, 5);
      let restam = elenco.length;
      for (const j of melhores) {
        // Abaixo de 18 jogadores, ninguém mais sai (o clube precisa de gente para jogar).
        if (restam <= 18 || !rng.chance(0.3)) continue;
        restam--;
        r = saiuDoClube(
          transferir(r, { jogador: j.id, de: r.clube, data, valor: 0, tipo: "rescisao" }),
          j.id,
        );
        noticias.push({
          data,
          tipo: "carreira",
          ...marcar("{jogador} rescindiu na Justiça pelos salários atrasados e saiu de graça.", {
            jogador: j.nome,
          }),
        });
      }
    }
  }
  // Parcelas do banco.
  const emprestimos = [];
  for (const e of r.emprestimosBancarios ?? []) {
    const juros = e.saldo * e.taxa;
    if (caixaDe(r, mundo) >= e.parcela) {
      r = lancar(r, mundo, data, { emprestimo: -e.parcela });
      const saldo = Math.round(e.saldo + juros - e.parcela);
      const restantes = e.restantes - 1;
      if (saldo <= 1000 || restantes <= 0) {
        noticias.push({
          data,
          tipo: "carreira",
          ...marcar("Empréstimo bancário quitado."),
        });
        continue;
      }
      emprestimos.push({ ...e, saldo, restantes });
    } else {
      const atrasos = e.atrasos + 1;
      emprestimos.push({
        ...e,
        saldo: Math.round(e.saldo + juros + e.parcela * MULTA_DO_ATRASO),
        atrasos,
      });
      noticias.push({
        data,
        tipo: "carreira",
        ...(atrasos >= ATRASOS_PARA_PERDER_O_CREDITO
          ? marcar("Parcela do banco atrasada de novo: o clube perdeu o crédito.")
          : marcar("Parcela do banco atrasada: multa de 2% e juros sobre o saldo.")),
      });
    }
  }
  if (r.emprestimosBancarios?.length || emprestimos.length)
    r = { ...r, emprestimosBancarios: emprestimos };
  if (crise !== criseDe(c) || c.crise) r = { ...r, crise };
  return { carreira: r, noticias, atrasou };
}

// ------------------------------------------------------------------------------------- CPU

/** Dívida bancária de um clube da CPU (saldo e parcela). */
export interface DividaDaCpu {
  saldo: number;
  parcela: number;
}

/**
 * O mês da CPU em crise: no vermelho fundo (mais de 30% da receita), o clube pega um empréstimo de
 * 35% da receita em 36 parcelas (1,5% ao mês) e paga a parcela todo mês; se afundar mais de 60%,
 * atrasa salários e os 2 melhores podem rescindir e sair de graça (30% cada), sem deixar o elenco
 * abaixo de 20.
 */
export function crisesDaCpu(
  c: Carreira,
  mundo: Mundo,
  data: string,
  caixas: Record<string, number>,
): {
  caixas: Record<string, number>;
  dividas: Record<string, DividaDaCpu>;
  rescisoes: { jogador: string; clube: string }[];
} {
  const dividas: Record<string, DividaDaCpu> = { ...c.dividasCpu };
  const rescisoes: { jogador: string; clube: string }[] = [];
  const rng = new Rng(`${c.semente}:crise-cpu:${data}`);
  for (const [clube, caixa] of Object.entries(caixas)) {
    const receita = receitaAnual(mundo, clube);
    if (receita <= 0) continue;
    let novo = caixa;
    const d = dividas[clube];
    if (d) {
      novo -= d.parcela;
      const saldo = Math.round(d.saldo * 1.015 - d.parcela);
      if (saldo <= 0) delete dividas[clube];
      else dividas[clube] = { ...d, saldo };
    } else if (caixa < -0.3 * receita) {
      const valor = Math.round(receita * 0.35);
      novo += valor;
      dividas[clube] = { saldo: valor, parcela: parcelaDoEmprestimo(valor, 0.015, 36) };
    }
    // Afundando, atrasa salários e os melhores saem, sem deixar o elenco abaixo de 20.
    const elenco = mundo.elenco(clube);
    if (novo < -0.6 * receita && elenco.length > 20) {
      const melhores = [...elenco].sort((a, b) => b.forca - a.forca).slice(0, 2);
      let restam = elenco.length;
      for (const j of melhores)
        if (restam > 20 && rng.chance(0.3)) {
          rescisoes.push({ jogador: j.id, clube });
          restam--;
        }
    }
    caixas[clube] = Math.round(novo);
  }
  return { caixas, dividas, rescisoes };
}
