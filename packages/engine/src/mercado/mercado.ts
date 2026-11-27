/**
 * Mercado do técnico (etapa 13a): comprar de outro clube (só com a janela do comprador aberta),
 * contratar jogador livre (a qualquer hora), dispensar profissional (pagando metade do que falta do
 * contrato), pôr à venda e receber propostas dos clubes da CPU.
 *
 * Toda mudança de clube fica numa lista de transferências na carreira; o mundo da data lê essa
 * lista para montar os elencos (quem saiu some, quem chegou entra, quem está sem clube é livre).
 */
import type { Clube, Contrato, Jogador } from "@newbras/data";
import { marcar } from "@newbras/textos";
import type { Carreira, Mundo, Noticia } from "../carreira/carreira";
import { estadoDe } from "../carreira/carreira";
import { diasEntre, somarDias } from "../carreira/datas";
import { contratoDe, somarMeses } from "../elenco/vida";
import { idadeEm } from "../evolucao";
import { salarioBase } from "../gerador/jogador";
import { Rng } from "../rng";
import { janelaAberta, salarioPedido, valorDeMercado } from "./valor";

export type TipoTransferencia = "compra" | "venda" | "livre" | "dispensa" | "fim-de-contrato";

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
}

/** O elenco profissional não passa disso, e o da CPU não vende abaixo disso. */
const ELENCO_MAXIMO = 30;
const ELENCO_MINIMO_CPU = 18;
/** A oferta perto do pedido vira contraproposta. */
const PERTO_DO_PEDIDO = 0.85;
/** Proposta recebida vale tantos dias. */
const DIAS_DA_PROPOSTA = 7;
/** Chance, por dia de janela, de um jogador à venda receber proposta. */
const CHANCE_PROPOSTA_A_VENDA = 0.12;
/** Chance, por dia de janela, de um dos 5 melhores do clube receber proposta sem estar à venda. */
const CHANCE_PROPOSTA_CRAQUE = 0.006;

const noticia = (data: string, texto: ReturnType<typeof marcar>): Noticia => ({
  data,
  tipo: "elenco",
  ...texto,
});

const comNoticias = (c: Carreira, novas: Noticia[]): Noticia[] =>
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

function transferir(c: Carreira, t: Transferencia): Carreira {
  return { ...c, transferencias: [...(c.transferencias ?? []), t] };
}

/** Saiu do clube do técnico: tira o estado, o contrato, a venda e as propostas dele. */
function saiuDoClube(c: Carreira, id: string): Carreira {
  const jogadores = { ...c.jogadores };
  delete jogadores[id];
  const contratos = { ...c.contratos };
  delete contratos[id];
  return {
    ...c,
    jogadores,
    contratos,
    aVenda: (c.aVenda ?? []).filter((x) => x !== id),
    propostas: (c.propostas ?? []).filter((p) => p.jogador !== id),
  };
}

/** Chegou ao clube do técnico: estado novo e contrato. */
function chegouAoClube(c: Carreira, id: string, contrato: Contrato): Carreira {
  return {
    ...c,
    jogadores: { ...c.jogadores, [id]: estadoDe(c, id) },
    contratos: { ...c.contratos, [id]: contrato },
  };
}

// ------------------------------------------------------------------------------ Compra

export type ResultadoProposta =
  | { tipo: "aceita"; valor: number; salario: number }
  | { tipo: "contraproposta"; pedido: number }
  | { tipo: "recusa-clube"; motivo: "pedido" | "elenco-curto" | "nao-vende" }
  | { tipo: "recusa-jogador"; motivo: "clube-menor" }
  | { tipo: "impossivel"; motivo: "janela-fechada" | "caixa" | "elenco-cheio" | "mesmo-clube" };

/** Quanto o clube pede: o valor, mais caro para os titulares e os craques do elenco. */
export function pedidoDoClube(mundo: Mundo, j: Jogador, data: string): number {
  const clube = j.clube ? mundo.clube(j.clube) : undefined;
  if (!clube) return 0;
  const elenco = [...mundo.elenco(clube.id)].sort((a, b) => b.forca - a.forca);
  const posicao = elenco.findIndex((x) => x.id === j.id);
  const fator = posicao < 0 ? 1 : posicao < 3 ? 1.6 : posicao < 11 ? 1.3 : 1.05;
  const rico = clube.nivel >= 85 ? 1.15 : 1;
  return Math.round((valorDeMercado(j, data) * fator * rico) / 100_000) * 100_000;
}

/** O jogador aceita ir para o clube? Não desce muito de nível. */
export function aceitaOClube(mundo: Mundo, j: Jogador, destino: Clube): boolean {
  const origem = j.clube ? mundo.clube(j.clube) : undefined;
  if (!origem) return j.forca <= destino.nivel + 12;
  return destino.nivel >= origem.nivel - 8 || j.forca <= destino.nivel + 3;
}

/** Contrato para quem chega: 3 anos (2 depois dos 31, 1 depois dos 34). */
function contratoNovo(j: Jogador, data: string, salario: number): Contrato {
  const idade = idadeEm(j.nascimento, data);
  const anos = idade >= 34 ? 1 : idade >= 31 ? 2 : 3;
  return { fim: somarMeses(data, anos * 12), salario };
}

/** Proposta de compra a outro clube. Aceita: o jogador vem na hora. */
export function proporCompra(
  c: Carreira,
  mundo: Mundo,
  id: string,
  valor: number,
): { carreira: Carreira; resultado: ResultadoProposta } {
  const j = mundo.jogador(id);
  const nosso = mundo.clube(c.clube);
  const fim = (resultado: ResultadoProposta) => ({ carreira: c, resultado });
  if (!j || !nosso) return fim({ tipo: "impossivel", motivo: "mesmo-clube" });
  if (!j.clube) return fim({ tipo: "impossivel", motivo: "mesmo-clube" });
  if (j.clube === c.clube) return fim({ tipo: "impossivel", motivo: "mesmo-clube" });
  if (!janelaAberta(mundo.pais(nosso.pais), c.data))
    return fim({ tipo: "impossivel", motivo: "janela-fechada" });
  if (mundo.elenco(c.clube).length >= ELENCO_MAXIMO)
    return fim({ tipo: "impossivel", motivo: "elenco-cheio" });
  if (valor > caixaDe(c, mundo)) return fim({ tipo: "impossivel", motivo: "caixa" });
  if (mundo.elenco(j.clube).length <= ELENCO_MINIMO_CPU)
    return fim({ tipo: "recusa-clube", motivo: "elenco-curto" });
  const pedido = pedidoDoClube(mundo, j, c.data);
  if (valor < pedido) {
    return fim(
      valor >= pedido * PERTO_DO_PEDIDO
        ? { tipo: "contraproposta", pedido }
        : { tipo: "recusa-clube", motivo: "pedido" },
    );
  }
  if (!aceitaOClube(mundo, j, nosso)) return fim({ tipo: "recusa-jogador", motivo: "clube-menor" });
  const salario = salarioPedido(j, j.contrato, salarioBase);
  const de = j.clube;
  let r = transferir(c, { jogador: id, de, para: c.clube, data: c.data, valor, tipo: "compra" });
  r = chegouAoClube(r, id, contratoNovo(j, c.data, salario));
  r = {
    ...r,
    caixa: caixaDe(c, mundo) - valor,
    noticias: comNoticias(r, [
      noticia(
        c.data,
        marcar("Contratado: {jogador} chega do {clube} por {valor}.", {
          jogador: j.nome,
          clube: mundo.clube(de)?.nomeCurto ?? de,
          valor,
        }),
      ),
    ]),
  };
  return { carreira: r, resultado: { tipo: "aceita", valor, salario } };
}

// ------------------------------------------------------------------------------- Livres

/** Contrata um jogador livre (a qualquer hora, com vaga no elenco). */
export function contratarLivre(
  c: Carreira,
  mundo: Mundo,
  id: string,
): { carreira: Carreira; resultado: ResultadoProposta } {
  const j = mundo.jogador(id);
  const nosso = mundo.clube(c.clube);
  if (!j || !nosso || !livresDe(c).includes(id))
    return { carreira: c, resultado: { tipo: "impossivel", motivo: "mesmo-clube" } };
  if (mundo.elenco(c.clube).length >= ELENCO_MAXIMO)
    return { carreira: c, resultado: { tipo: "impossivel", motivo: "elenco-cheio" } };
  if (!aceitaOClube(mundo, { ...j, clube: undefined } as Jogador, nosso))
    return { carreira: c, resultado: { tipo: "recusa-jogador", motivo: "clube-menor" } };
  const salario = salarioPedido(j, undefined, salarioBase);
  let r = transferir(c, { jogador: id, para: c.clube, data: c.data, valor: 0, tipo: "livre" });
  r = chegouAoClube(r, id, contratoNovo(j, c.data, salario));
  r = {
    ...r,
    noticias: comNoticias(r, [
      noticia(
        c.data,
        marcar("Contratado sem custo: {jogador}, que estava livre.", { jogador: j.nome }),
      ),
    ]),
  };
  return { carreira: r, resultado: { tipo: "aceita", valor: 0, salario } };
}

// ------------------------------------------------------------------------------- Saídas

/** Custo da rescisão: metade dos salários que faltam do contrato. */
export function custoDaDispensa(c: Carreira, mundo: Mundo, id: string): number {
  const contrato = contratoDe(c, mundo, id);
  if (!contrato) return 0;
  const meses = Math.max(0, diasEntre(c.data, contrato.fim) / 30.4);
  return Math.round((contrato.salario * meses * 0.5) / 100) * 100;
}

/** Dispensa um profissional: paga a rescisão e ele fica livre. */
export function dispensarJogador(c: Carreira, mundo: Mundo, id: string): Carreira {
  const j = mundo.jogador(id);
  if (!j || !mundo.elenco(c.clube).some((x) => x.id === id)) return c;
  const custo = custoDaDispensa(c, mundo, id);
  let r = transferir(c, { jogador: id, de: c.clube, data: c.data, valor: custo, tipo: "dispensa" });
  r = saiuDoClube(r, id);
  return {
    ...r,
    caixa: caixaDe(c, mundo) - custo,
    noticias: comNoticias(r, [
      noticia(
        c.data,
        marcar("{jogador} foi dispensado (rescisão de {valor}).", {
          jogador: j.nome,
          valor: custo,
        }),
      ),
    ]),
  };
}

/** Quem saiu porque o contrato acabou fica livre. */
export function fimDeContrato(c: Carreira, ids: readonly string[], data: string): Carreira {
  let r = c;
  for (const id of ids)
    r = saiuDoClube(
      transferir(r, { jogador: id, de: c.clube, data, valor: 0, tipo: "fim-de-contrato" }),
      id,
    );
  return r;
}

export function porAVenda(c: Carreira, id: string, sim: boolean): Carreira {
  const lista = (c.aVenda ?? []).filter((x) => x !== id);
  return { ...c, aVenda: sim ? [...lista, id] : lista };
}

// --------------------------------------------------------------------------- Propostas

/** Um clube da CPU que se interessaria pelo jogador (nível perto da força dele, janela aberta). */
function compradorPara(mundo: Mundo, j: Jogador, data: string, rng: Rng): Clube | undefined {
  const candidatos = (mundo.clubes ?? []).filter(
    (x) =>
      x.id !== j.clube &&
      !x.filialDe &&
      x.nivel >= j.forca - 12 &&
      x.nivel <= j.forca + 8 &&
      !!janelaAberta(mundo.pais(x.pais), data),
  );
  if (!candidatos.length) return undefined;
  return rng.weighted(candidatos, (x) => x.nivel);
}

/** Aceita a proposta: o jogador vai para o clube da CPU e o dinheiro entra no caixa. */
export function aceitarProposta(c: Carreira, mundo: Mundo, id: string): Carreira {
  const p = (c.propostas ?? []).find((x) => x.id === id);
  const j = p ? mundo.jogador(p.jogador) : undefined;
  if (!p || !j || p.ate < c.data) return c;
  let r = transferir(c, {
    jogador: p.jogador,
    de: c.clube,
    para: p.clube,
    data: c.data,
    valor: p.valor,
    tipo: "venda",
  });
  r = saiuDoClube(r, p.jogador);
  return {
    ...r,
    caixa: caixaDe(c, mundo) + p.valor,
    noticias: comNoticias(r, [
      noticia(
        c.data,
        marcar("Vendido: {jogador} vai para o {clube} por {valor}.", {
          jogador: j.nome,
          clube: mundo.clube(p.clube)?.nomeCurto ?? p.clube,
          valor: p.valor,
        }),
      ),
    ]),
  };
}

export function recusarProposta(c: Carreira, id: string): Carreira {
  return { ...c, propostas: (c.propostas ?? []).filter((x) => x.id !== id) };
}

/**
 * O dia do mercado: propostas da CPU pelos jogadores à venda (e às vezes pelos craques), e as
 * propostas vencidas somem.
 */
export function diaDoMercado(
  c: Carreira,
  mundo: Mundo,
  data: string,
): { propostas: PropostaRecebida[] | undefined; noticias: Noticia[] } {
  const atuais = (c.propostas ?? []).filter((p) => p.ate >= data);
  const rng = new Rng(`${c.semente}:propostas:${data}`);
  const noticias: Noticia[] = [];
  const elenco = [...mundo.elenco(c.clube)].sort((a, b) => b.forca - a.forca);
  const craques = new Set(elenco.slice(0, 5).map((j) => j.id));
  const aVenda = new Set(c.aVenda ?? []);
  for (const j of elenco) {
    const chance = aVenda.has(j.id)
      ? CHANCE_PROPOSTA_A_VENDA
      : craques.has(j.id)
        ? CHANCE_PROPOSTA_CRAQUE
        : 0;
    if (!chance || !rng.chance(chance)) continue;
    if (atuais.some((p) => p.jogador === j.id)) continue;
    const comprador = compradorPara(mundo, j, data, rng);
    if (!comprador) continue;
    const base = valorDeMercado(j, data, contratoDe(c, mundo, j.id));
    // À venda, o interessado oferece perto do valor; pelo craque, oferece acima.
    const fator = aVenda.has(j.id) ? rng.float(0.8, 1.1) : rng.float(1.1, 1.5);
    const valor = Math.round((base * fator) / 100_000) * 100_000;
    if (!valor) continue;
    const p: PropostaRecebida = {
      id: `${j.id}:${data}`,
      jogador: j.id,
      clube: comprador.id,
      valor,
      ate: somarDias(data, DIAS_DA_PROPOSTA),
    };
    atuais.push(p);
    noticias.push(
      noticia(
        data,
        marcar("Proposta do {clube} por {jogador}: {valor}. Responda na aba Mercado.", {
          clube: comprador.nomeCurto,
          jogador: j.nome,
          valor,
        }),
      ),
    );
  }
  const mudou = atuais.length !== (c.propostas ?? []).length || noticias.length > 0;
  return { propostas: mudou ? atuais : c.propostas, noticias };
}
