/**
 * Peças comuns do mercado: o registro das transferências, a entrada e a saída de jogadores do
 * clube do técnico, o caixa e a vontade do jogador de mudar de clube.
 */
import type { Clube, Contrato, Jogador } from "@newbras/data";
import type { marcar } from "@newbras/textos";
import type { Carreira, Mundo, Noticia } from "../carreira/carreira";
import { estadoDe } from "../carreira/carreira";
import { contratoDe, somarMeses } from "../elenco/vida";
import { idadeEm } from "../evolucao";
import { valorDeMercado } from "./valor";

export type TipoTransferencia =
  | "compra"
  | "venda"
  | "livre"
  | "dispensa"
  | "fim-de-contrato"
  | "troca"
  | "emprestimo"
  | "volta-de-emprestimo"
  | "opcao-de-compra"
  | "pre-contrato"
  | "leilao"
  | "rescisao";

export interface Transferencia {
  jogador: string;
  /** Clube de onde saiu (vazio: estava livre). */
  de?: string;
  /** Clube para onde foi (vazio: ficou livre). */
  para?: string;
  data: string;
  valor: number;
  tipo: TipoTransferencia;
}

export interface PropostaRecebida {
  id: string;
  jogador: string;
  clube: string;
  valor: number;
  /** Até quando vale. */
  ate: string;
  /** Proposta de empréstimo (o valor é a taxa): até quando, a parte do salário e a opção. */
  emprestimo?: { fim: string; parteDoSalario: number; opcao?: number };
}

/** Empréstimo em andamento (do técnico, para o técnico ou entre clubes da CPU). */
export interface Emprestimo {
  jogador: string;
  /** Dono do passe. */
  de: string;
  /** Quem pegou emprestado. */
  para: string;
  inicio: string;
  /** Último dia: no dia seguinte o jogador volta. */
  fim: string;
  /** Taxa paga ao dono. */
  taxa: number;
  /** Parte do salário que quem pegou paga (de 0 a 1). */
  parteDoSalario: number;
  /** Opção de compra: quem pegou pode comprar por esse valor. */
  opcao?: number;
}

/** Pré-contrato: o jogador muda de clube de graça quando o contrato acaba. */
export interface PreContrato {
  jogador: string;
  de: string;
  para: string;
  assinatura: string;
  /** Dia em que chega ao clube novo (o seguinte ao fim do contrato). */
  chegada: string;
  /** Salário no clube novo. */
  salario: number;
}

/**
 * Sondagem de um clube da CPU por jogador do técnico no último ano de contrato: a diretoria
 * avisa, o jogador vem conversar e dá um prazo; sem renovação até lá, assina o pré-contrato.
 */
export interface Sondagem {
  jogador: string;
  clube: string;
  /** Dia em que a diretoria avisou. */
  inicio: string;
  /** Dia em que o jogador vem conversar com o técnico. */
  conversa: string;
  /** Até quando ele espera a renovação. */
  prazo: string;
  /** O técnico liberou o jogador para negociar. */
  liberado?: boolean;
}

export interface Lance {
  clube: string;
  valor: number;
  data: string;
}

/** Leilão: o jogador vai para quem der o maior lance até o fim (se passar do mínimo). */
export interface Leilao {
  id: string;
  jogador: string;
  vendedor: string;
  minimo: number;
  /** Último dia de lances: fecha no dia seguinte. */
  fim: string;
  lances: Lance[];
}

/** O elenco profissional não passa disso, e o da CPU não vende abaixo disso. */
export const ELENCO_MAXIMO = 30;
/** Proposta recebida vale tantos dias. */
export const DIAS_DA_PROPOSTA = 7;

export const noticia = (data: string, texto: ReturnType<typeof marcar>): Noticia => ({
  data,
  tipo: "elenco",
  ...texto,
});

export const comNoticias = (c: Carreira, novas: Noticia[]): Noticia[] =>
  [...novas, ...c.noticias].slice(0, 200);

// --------------------------------------------------------------------------------- Caixa

/** Caixa para contratações: começa com 10% do valor do elenco (as finanças vêm na Fase 14). */
export function caixaDe(c: Carreira, mundo: Mundo): number {
  if (c.caixa !== undefined) return c.caixa;
  const soma = mundo
    .elenco(c.clube)
    .reduce((s, j) => s + valorDeMercado(j, c.inicio, contratoDe(c, mundo, j.id)), 0);
  return Math.round((soma * 0.1) / 100_000) * 100_000;
}

// --------------------------------------------------------------------------- Transferências

/** Quem está sem clube (livre) na carreira: a última transferência dele foi para lugar nenhum. */
export function livresDe(c: Pick<Carreira, "transferencias">): string[] {
  const ultima = new Map<string, Transferencia>();
  for (const t of c.transferencias ?? []) ultima.set(t.jogador, t);
  return [...ultima.values()].filter((t) => !t.para).map((t) => t.jogador);
}

export function transferir(c: Carreira, t: Transferencia): Carreira {
  return { ...c, transferencias: [...(c.transferencias ?? []), t] };
}

/**
 * Saiu do clube do técnico: tira o estado, a venda, o empréstimo oferecido, as propostas, o
 * pré-contrato e o leilão dele. O contrato também sai, menos no empréstimo (o passe continua dele).
 */
export function saiuDoClube(c: Carreira, id: string, manterContrato = false): Carreira {
  const jogadores = { ...c.jogadores };
  delete jogadores[id];
  const contratos = { ...c.contratos };
  if (!manterContrato) delete contratos[id];
  return {
    ...c,
    jogadores,
    contratos,
    aVenda: (c.aVenda ?? []).filter((x) => x !== id),
    ...(c.aEmprestimo ? { aEmprestimo: c.aEmprestimo.filter((x) => x !== id) } : {}),
    propostas: (c.propostas ?? []).filter((p) => p.jogador !== id),
    ...(c.preContratos
      ? { preContratos: c.preContratos.filter((p) => p.jogador !== id || p.de !== c.clube) }
      : {}),
    ...(c.leiloes
      ? { leiloes: c.leiloes.filter((l) => l.jogador !== id || l.vendedor !== c.clube) }
      : {}),
    ...(c.sondagens ? { sondagens: c.sondagens.filter((x) => x.jogador !== id) } : {}),
  };
}

/** O empréstimo em andamento do jogador, se houver. */
export const emprestimoDe = (
  c: Pick<Carreira, "emprestimos">,
  id: string,
): Emprestimo | undefined => (c.emprestimos ?? []).find((e) => e.jogador === id);

/** Emprestado ao clube do técnico (não dá para vender, dispensar nem renovar). */
export const emprestadoAoClube = (c: Pick<Carreira, "emprestimos" | "clube">, id: string) =>
  emprestimoDe(c, id)?.para === c.clube;

/** Jogadores que a CPU não pode negociar: emprestados, com pré-contrato ou em leilão. */
export function presosEmNegocio(
  c: Pick<Carreira, "emprestimos" | "preContratos" | "leiloes">,
): Set<string> {
  return new Set([
    ...(c.emprestimos ?? []).map((e) => e.jogador),
    ...(c.preContratos ?? []).map((p) => p.jogador),
    ...(c.leiloes ?? []).map((l) => l.jogador),
  ]);
}

/** Chegou ao clube do técnico: estado novo e contrato. */
export function chegouAoClube(c: Carreira, id: string, contrato: Contrato): Carreira {
  return {
    ...c,
    jogadores: { ...c.jogadores, [id]: estadoDe(c, id) },
    contratos: { ...c.contratos, [id]: contrato },
  };
}

/** O jogador aceita ir para o clube? Não desce muito de nível. */
export function aceitaOClube(mundo: Mundo, j: Jogador, destino: Clube): boolean {
  const origem = j.clube ? mundo.clube(j.clube) : undefined;
  if (!origem) return j.forca <= destino.nivel + 12;
  return destino.nivel >= origem.nivel - 8 || j.forca <= destino.nivel + 3;
}

/** Contrato para quem chega: 3 anos (2 depois dos 31, 1 depois dos 34). */
export function contratoNovo(j: Jogador, data: string, salario: number): Contrato {
  const idade = idadeEm(j.nascimento, data);
  const anos = idade >= 34 ? 1 : idade >= 31 ? 2 : 3;
  return { fim: somarMeses(data, anos * 12), salario };
}
