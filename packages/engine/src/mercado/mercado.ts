/**
 * Mercado do técnico (etapa 13a): comprar de outro clube (só com a janela do comprador aberta),
 * contratar jogador livre (a qualquer hora), dispensar profissional (pagando metade do que falta do
 * contrato), pôr à venda e receber propostas dos clubes da CPU.
 *
 * Toda mudança de clube fica numa lista de transferências na carreira; o mundo da data lê essa
 * lista para montar os elencos (quem saiu some, quem chegou entra, quem está sem clube é livre).
 */
import type { Clube, Jogador } from "@newbras/data";
import { marcar } from "@newbras/textos";
import type { Carreira, Mundo, Noticia } from "../carreira/carreira";
import { diasEntre, somarDias } from "../carreira/datas";
import { contratoDe } from "../elenco/vida";
import { salarioBase } from "../gerador/jogador";
import { Rng } from "../rng";
import {
  aceitaOClube,
  caixaDe,
  chegouAoClube,
  comNoticias,
  contratoNovo,
  DIAS_DA_PROPOSTA,
  ELENCO_MAXIMO,
  emprestadoAoClube,
  presosEmNegocio,
  livresDe,
  noticia,
  saiuDoClube,
  transferir,
  type PropostaRecebida,
} from "./comum";
import { aceitarEmprestimoProposto, propostaDeEmprestimo } from "./negocios";
import { janelaAberta, salarioPedido, valorDeMercado } from "./valor";
import { respostaDeVenda, situacaoDoClube } from "./situacao";

export * from "./comum";

/** Chance, por dia de janela, de um jogador à venda receber proposta. */
const CHANCE_PROPOSTA_A_VENDA = 0.12;
/** Chance, por dia de janela, de um dos 5 melhores do clube receber proposta sem estar à venda. */
const CHANCE_PROPOSTA_CRAQUE = 0.006;

// ------------------------------------------------------------------------------ Compra

export type ResultadoProposta =
  | { tipo: "aceita"; valor: number; salario: number }
  | { tipo: "contraproposta"; pedido: number }
  | { tipo: "recusa-clube"; motivo: "pedido" | "elenco-curto" | "intransferivel"; pedido?: number }
  | { tipo: "recusa-jogador"; motivo: "clube-menor" }
  | {
      tipo: "impossivel";
      motivo: "janela-fechada" | "caixa" | "elenco-cheio" | "mesmo-clube" | "em-negocio";
    };

/** Quanto o clube pede, pela situação dele (dinheiro, briga por título) e pelo peso do jogador. */
export function pedidoDoClube(c: Carreira, mundo: Mundo, j: Jogador): number {
  if (!j.clube) return 0;
  const situacao = situacaoDoClube(c, mundo, j.clube, c.data);
  return respostaDeVenda(mundo, situacao, j, 0, c.data).pedido;
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
  if (presosEmNegocio(c).has(id)) return fim({ tipo: "impossivel", motivo: "em-negocio" });
  if (!janelaAberta(mundo.pais(nosso.pais), c.data))
    return fim({ tipo: "impossivel", motivo: "janela-fechada" });
  if (mundo.elenco(c.clube).length >= ELENCO_MAXIMO)
    return fim({ tipo: "impossivel", motivo: "elenco-cheio" });
  if (valor > caixaDe(c, mundo)) return fim({ tipo: "impossivel", motivo: "caixa" });
  const situacao = situacaoDoClube(c, mundo, j.clube, c.data);
  const resposta = respostaDeVenda(mundo, situacao, j, valor, c.data);
  if (resposta.tipo === "contraproposta")
    return fim({ tipo: "contraproposta", pedido: resposta.pedido });
  if (resposta.tipo === "recusa")
    return fim({ tipo: "recusa-clube", motivo: resposta.motivo, pedido: resposta.pedido });
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
  if (!j || !mundo.elenco(c.clube).some((x) => x.id === id) || emprestadoAoClube(c, id)) return c;
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
/** Quem saiu porque o contrato acabou fica livre (ou vai para quem assinou o pré-contrato). */
export function fimDeContrato(c: Carreira, ids: readonly string[], data: string): Carreira {
  let r = c;
  for (const id of ids) {
    const pre = (c.preContratos ?? []).find((p) => p.jogador === id && p.de === c.clube);
    r = saiuDoClube(
      transferir(r, {
        jogador: id,
        de: c.clube,
        ...(pre ? { para: pre.para } : {}),
        data,
        valor: 0,
        tipo: pre ? "pre-contrato" : "fim-de-contrato",
      }),
      id,
    );
  }
  return r;
}

export function porAVenda(c: Carreira, id: string, sim: boolean): Carreira {
  if (sim && emprestadoAoClube(c, id)) return c;
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
  if (p.emprestimo) return aceitarEmprestimoProposto(c, mundo, p);
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
    if (emprestadoAoClube(c, j.id)) continue;
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
  // Empréstimo: os oferecidos recebem propostas de clubes onde jogariam.
  for (const id of c.aEmprestimo ?? []) {
    const j = elenco.find((x) => x.id === id);
    if (!j || atuais.some((p) => p.jogador === id)) continue;
    const p = propostaDeEmprestimo(c, mundo, j, data, rng);
    if (!p) continue;
    atuais.push(p);
    noticias.push(
      noticia(
        data,
        marcar(
          "Proposta de empréstimo do {clube} por {jogador} até {fim}. Responda na aba Mercado.",
          {
            clube: mundo.clube(p.clube)?.nomeCurto ?? p.clube,
            jogador: j.nome,
            fim: p.emprestimo?.fim ?? "",
          },
        ),
      ),
    );
  }
  const mudou = atuais.length !== (c.propostas ?? []).length || noticias.length > 0;
  return { propostas: mudou ? atuais : c.propostas, noticias };
}
