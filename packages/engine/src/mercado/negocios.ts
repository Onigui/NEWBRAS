/**
 * Negócios além da compra e venda (etapa 13c): pré-contrato, empréstimos nos dois sentidos (com
 * taxa, divisão do salário e opção de compra), trocas com ou sem diferença em dinheiro e leilões.
 *
 * Tudo vira transferência na lista da carreira, como as compras: o mundo da data continua lendo a
 * última de cada jogador para saber onde ele está. O que tem prazo (empréstimo, pré-contrato,
 * leilão) fica numa lista própria e o dia dos negócios cuida de encerrar.
 */
import type { Clube, Jogador } from "@newbras/data";
import { marcar } from "@newbras/textos";
import type { Carreira, Mundo, Noticia } from "../carreira/carreira";
import { estadoDe } from "../carreira/carreira";
import { diasEntre, somarDias } from "../carreira/datas";
import { contratoDe } from "../elenco/vida";
import { idadeEm } from "../evolucao";
import { salarioBase } from "../gerador/jogador";
import { Rng } from "../rng";
import { diaDasSondagens } from "./sondagens";
import {
  aceitaOClube,
  caixaDe,
  chegouAoClube,
  comNoticias,
  contratoNovo,
  DIAS_DA_PROPOSTA,
  ELENCO_MAXIMO,
  emprestadoAoClube,
  emprestimoDe,
  noticia,
  presosEmNegocio,
  saiuDoClube,
  transferir,
  type Emprestimo,
  type Leilao,
  type PreContrato,
  type PropostaRecebida,
  type Transferencia,
} from "./comum";
import {
  ehProdigio,
  importanciaNoElenco,
  respostaDeVenda,
  situacaoDoClube,
  ELENCO_MINIMO_PARA_VENDER,
} from "./situacao";
import { contratoVigente, janelaAberta, salarioPedido, valorDeMercado } from "./valor";

/** Pré-contrato só nos últimos 6 meses do contrato. */
export const DIAS_DO_PRE_CONTRATO = 183;
/** Leilão fica aberto por tantos dias. */
export const DIAS_DO_LEILAO = 4;
/** Cada lance novo passa o anterior em pelo menos 5%. */
const AUMENTO_DO_LANCE = 1.05;
/** Leilões da CPU abertos ao mesmo tempo, no máximo. */
const LEILOES_DA_CPU = 4;

const arredondar = (v: number) => Math.round(v / 100_000) * 100_000;
const nomeDoClube = (mundo: Mundo, id: string) => mundo.clube(id)?.nomeCurto ?? id;
const salarioDe = (j: Jogador) => j.contrato?.salario ?? salarioBase(j.forca);

/** Último dia da temporada do clube (ou da seguinte), com pelo menos 45 dias pela frente. */
export function fimDaTemporada(mundo: Mundo, clube: string, data: string, temporadas = 1): string {
  const inicio = mundo.pais(mundo.clube(clube)?.pais ?? "")?.temporada?.inicio ?? "07-01";
  const ano = Number(data.slice(0, 4)) + (data.slice(5) < inicio ? 0 : 1);
  let fim = somarDias(`${ano + temporadas - 1}-${inicio}`, -1);
  if (diasEntre(data, fim) < 45) fim = somarDias(`${ano + temporadas}-${inicio}`, -1);
  return fim;
}

// ------------------------------------------------------------------------------ Pré-contrato

export type ResultadoPreContrato =
  | { tipo: "aceita"; chegada: string; salario: number }
  | { tipo: "recusa-jogador"; motivo: "salario" | "quer-ficar" | "clube-menor"; pedido?: number }
  | {
      tipo: "impossivel";
      motivo: "contrato-longo" | "em-negocio" | "elenco-cheio" | "mesmo-clube";
    };

/** O fim do contrato do jogador de outro clube, se faltar o bastante pouco para o pré-contrato. */
export function fimParaPreContrato(j: Jogador, data: string): string | undefined {
  const fim = contratoVigente(j.contrato, j.id, data)?.fim;
  if (!fim) return undefined;
  const faltam = diasEntre(data, fim);
  return faltam >= 0 && faltam <= DIAS_DO_PRE_CONTRATO ? fim : undefined;
}

/** Quanto o jogador quer para assinar o pré-contrato (o titular do clube dele pede mais). */
export function salarioDoPreContrato(mundo: Mundo, j: Jogador): number {
  const pedido = salarioPedido(j, j.contrato, salarioBase);
  const peso = j.clube ? importanciaNoElenco(mundo.elenco(j.clube), j.id) : "reserva";
  return Math.round((pedido * (peso === "reserva" ? 1 : 1.25)) / 100) * 100;
}

/** Quantos chegam ao clube do técnico por pré-contrato. */
const chegandoPorPreContrato = (c: Carreira) =>
  (c.preContratos ?? []).filter((p) => p.para === c.clube).length;

/**
 * Pré-contrato com jogador de outro clube nos últimos 6 meses do contrato dele: não precisa de
 * janela nem paga nada ao clube; ele chega quando o contrato acaba. O titular do clube dele só
 * aceita com salário bem melhor ou para ir a um clube maior.
 */
export function proporPreContrato(
  c: Carreira,
  mundo: Mundo,
  id: string,
  salario: number,
): { carreira: Carreira; resultado: ResultadoPreContrato } {
  const j = mundo.jogador(id);
  const nosso = mundo.clube(c.clube);
  const fim = (resultado: ResultadoPreContrato) => ({ carreira: c, resultado });
  if (!j?.clube || !nosso || j.clube === c.clube)
    return fim({ tipo: "impossivel", motivo: "mesmo-clube" });
  if (presosEmNegocio(c).has(id)) return fim({ tipo: "impossivel", motivo: "em-negocio" });
  const termina = fimParaPreContrato(j, c.data);
  if (!termina) return fim({ tipo: "impossivel", motivo: "contrato-longo" });
  if (mundo.elenco(c.clube).length + chegandoPorPreContrato(c) >= ELENCO_MAXIMO)
    return fim({ tipo: "impossivel", motivo: "elenco-cheio" });
  if (!aceitaOClube(mundo, j, nosso)) return fim({ tipo: "recusa-jogador", motivo: "clube-menor" });
  const base = salarioPedido(j, j.contrato, salarioBase);
  const pedido = salarioDoPreContrato(mundo, j);
  const origem = mundo.clube(j.clube);
  const clubeMaior = !!origem && nosso.nivel >= origem.nivel + 3;
  if (salario < base) return fim({ tipo: "recusa-jogador", motivo: "salario", pedido: base });
  if (salario < pedido && !clubeMaior)
    return fim({ tipo: "recusa-jogador", motivo: "quer-ficar", pedido });
  const chegada = somarDias(termina, 1);
  const pre: PreContrato = {
    jogador: id,
    de: j.clube,
    para: c.clube,
    assinatura: c.data,
    chegada,
    salario,
  };
  return {
    carreira: {
      ...c,
      preContratos: [...(c.preContratos ?? []), pre],
      noticias: comNoticias(c, [
        noticia(
          c.data,
          marcar("Pré-contrato assinado: {jogador} chega do {clube} em {data}, sem custo.", {
            jogador: j.nome,
            clube: nomeDoClube(mundo, j.clube),
            data: chegada,
          }),
        ),
      ]),
    },
    resultado: { tipo: "aceita", chegada, salario },
  };
}

// ------------------------------------------------------------------------------- Empréstimos

export type CondicoesDeEmprestimo =
  | {
      tipo: "ok";
      taxa: number;
      parteDoSalario: number;
      salario: number;
      fim: string;
      opcao?: number;
    }
  | {
      tipo: "recusa";
      motivo:
        | "titular"
        | "elenco-curto"
        | "clube-menor"
        | "em-negocio"
        | "janela-fechada"
        | "elenco-cheio"
        | "mesmo-clube";
    };

/**
 * O que o clube dono pede para emprestar ao técnico: cede reservas e jovens titulares (até 23
 * anos, se não brigar pelo título), nunca o craque. A taxa e a parte do salário sobem quando o
 * clube precisa de dinheiro; a opção de compra é o valor com folga (no prodígio, só se precisar).
 */
export function condicoesDoEmprestimo(
  c: Carreira,
  mundo: Mundo,
  id: string,
  temporadas: 1 | 2 = 1,
): CondicoesDeEmprestimo {
  const j = mundo.jogador(id);
  const nosso = mundo.clube(c.clube);
  const recusa = (motivo: Extract<CondicoesDeEmprestimo, { tipo: "recusa" }>["motivo"]) =>
    ({ tipo: "recusa", motivo }) as const;
  if (!j?.clube || !nosso || j.clube === c.clube) return recusa("mesmo-clube");
  if (presosEmNegocio(c).has(id)) return recusa("em-negocio");
  if (!janelaAberta(mundo.pais(nosso.pais), c.data)) return recusa("janela-fechada");
  if (mundo.elenco(c.clube).length >= ELENCO_MAXIMO) return recusa("elenco-cheio");
  const elenco = mundo.elenco(j.clube);
  const goleiros = elenco.filter((x) => x.posicao === "G").length;
  if (elenco.length <= ELENCO_MINIMO_PARA_VENDER || (j.posicao === "G" && goleiros <= 2))
    return recusa("elenco-curto");
  const situacao = situacaoDoClube(c, mundo, j.clube, c.data);
  const peso = importanciaNoElenco(elenco, id);
  const jovem = idadeEm(j.nascimento, c.data) <= 23;
  if (peso === "craque" || (peso === "titular" && (!jovem || situacao.brigandoPorTitulo)))
    return recusa("titular");
  if (!aceitaOClube(mundo, j, nosso)) return recusa("clube-menor");
  const valor = valorDeMercado(j, c.data);
  const precisa = situacao.precisaDeDinheiro;
  const rico = (mundo.clube(j.clube)?.nivel ?? 0) >= 85;
  const taxa = arredondar(valor * (0.04 + 0.08 * precisa) * temporadas);
  const parteDoSalario = Math.round(Math.min(1, 0.6 + 0.4 * precisa + (rico ? 0.2 : 0)) * 10) / 10;
  const prodigio = ehProdigio(j, c.data);
  const opcao =
    !prodigio || precisa >= 0.5 ? arredondar(valor * 1.25 * (prodigio ? 1.3 : 1)) : undefined;
  const fim = fimDaTemporada(mundo, c.clube, c.data, temporadas);
  return {
    tipo: "ok",
    taxa,
    parteDoSalario,
    salario: Math.round((salarioDe(j) * parteDoSalario) / 100) * 100,
    fim,
    ...(opcao ? { opcao } : {}),
  };
}

/** Pega o jogador emprestado nas condições do dono (com ou sem a opção de compra). */
export function pegarEmprestado(
  c: Carreira,
  mundo: Mundo,
  id: string,
  temporadas: 1 | 2 = 1,
  comOpcao = true,
): { carreira: Carreira; resultado: CondicoesDeEmprestimo | { tipo: "caixa" } } {
  const condicoes = condicoesDoEmprestimo(c, mundo, id, temporadas);
  const j = mundo.jogador(id);
  if (condicoes.tipo !== "ok" || !j?.clube) return { carreira: c, resultado: condicoes };
  const caixa = caixaDe(c, mundo);
  if (condicoes.taxa > caixa) return { carreira: c, resultado: { tipo: "caixa" } };
  const e: Emprestimo = {
    jogador: id,
    de: j.clube,
    para: c.clube,
    inicio: c.data,
    fim: condicoes.fim,
    taxa: condicoes.taxa,
    parteDoSalario: condicoes.parteDoSalario,
    ...(comOpcao && condicoes.opcao ? { opcao: condicoes.opcao } : {}),
  };
  let r = transferir(c, {
    jogador: id,
    de: j.clube,
    para: c.clube,
    data: c.data,
    valor: condicoes.taxa,
    tipo: "emprestimo",
  });
  r = chegouAoClube(r, id, { fim: e.fim, salario: condicoes.salario });
  r = {
    ...r,
    caixa: caixa - condicoes.taxa,
    emprestimos: [...(r.emprestimos ?? []), e],
    noticias: comNoticias(r, [
      noticia(
        c.data,
        marcar("Emprestado: {jogador} chega do {clube} até {fim} (taxa de {valor}).", {
          jogador: j.nome,
          clube: nomeDoClube(mundo, j.clube),
          fim: e.fim,
          valor: e.taxa,
        }),
      ),
    ]),
  };
  return { carreira: r, resultado: condicoes };
}

/** Oferece (ou tira da oferta) um jogador do técnico por empréstimo. */
export function porParaEmprestimo(c: Carreira, id: string, sim: boolean): Carreira {
  if (sim && emprestadoAoClube(c, id)) return c;
  const lista = (c.aEmprestimo ?? []).filter((x) => x !== id);
  return { ...c, aEmprestimo: sim ? [...lista, id] : lista };
}

/** Chance, por dia de janela, de um jogador oferecido por empréstimo receber proposta. */
const CHANCE_PROPOSTA_EMPRESTIMO = 0.1;

/**
 * Proposta de empréstimo de um clube da CPU por um jogador oferecido (o clube é de nível em que
 * ele jogaria). Usada pelo dia do mercado, junto com as propostas de compra.
 */
export function propostaDeEmprestimo(
  c: Carreira,
  mundo: Mundo,
  j: Jogador,
  data: string,
  rng: Rng,
): PropostaRecebida | undefined {
  if (!rng.chance(CHANCE_PROPOSTA_EMPRESTIMO)) return undefined;
  const candidatos = (mundo.clubes ?? []).filter(
    (x) =>
      x.id !== c.clube &&
      !x.filialDe &&
      x.nivel >= j.forca - 8 &&
      x.nivel <= j.forca + 3 &&
      !!janelaAberta(mundo.pais(x.pais), data),
  );
  if (!candidatos.length) return undefined;
  const clube = candidatos[rng.int(0, candidatos.length - 1)] as Clube;
  const valor = valorDeMercado(j, data, contratoDe(c, mundo, j.id));
  const contrato = contratoDe(c, mundo, j.id);
  let fim = fimDaTemporada(mundo, clube.id, data);
  if (contrato && contrato.fim < fim) fim = contrato.fim;
  if (diasEntre(data, fim) < 30) return undefined;
  const opcao = rng.chance(0.35) ? arredondar(valor * rng.float(1.1, 1.4)) : undefined;
  return {
    id: `${j.id}:emprestimo:${data}`,
    jogador: j.id,
    clube: clube.id,
    valor: arredondar(valor * rng.float(0.02, 0.06)),
    ate: somarDias(data, DIAS_DA_PROPOSTA),
    emprestimo: {
      fim,
      parteDoSalario: Math.round(rng.float(0.5, 1) * 10) / 10,
      ...(opcao ? { opcao } : {}),
    },
  };
}

/** Aceita a proposta de empréstimo: o jogador vai, o passe e o contrato continuam do técnico. */
export function aceitarEmprestimoProposto(
  c: Carreira,
  mundo: Mundo,
  p: PropostaRecebida,
): Carreira {
  const j = mundo.jogador(p.jogador);
  if (!j || !p.emprestimo || emprestadoAoClube(c, p.jogador)) return c;
  const e: Emprestimo = {
    jogador: p.jogador,
    de: c.clube,
    para: p.clube,
    inicio: c.data,
    fim: p.emprestimo.fim,
    taxa: p.valor,
    parteDoSalario: p.emprestimo.parteDoSalario,
    ...(p.emprestimo.opcao ? { opcao: p.emprestimo.opcao } : {}),
  };
  let r = transferir(c, {
    jogador: p.jogador,
    de: c.clube,
    para: p.clube,
    data: c.data,
    valor: p.valor,
    tipo: "emprestimo",
  });
  r = saiuDoClube(r, p.jogador, true);
  return {
    ...r,
    caixa: caixaDe(c, mundo) + p.valor,
    emprestimos: [...(r.emprestimos ?? []), e],
    noticias: comNoticias(r, [
      noticia(
        c.data,
        marcar("{jogador} foi emprestado ao {clube} até {fim} (taxa de {valor}).", {
          jogador: j.nome,
          clube: nomeDoClube(mundo, p.clube),
          fim: e.fim,
          valor: p.valor,
        }),
      ),
    ]),
  };
}

/** Compra o jogador emprestado ao técnico pelo valor da opção (com a janela aberta). */
export function exercerOpcao(
  c: Carreira,
  mundo: Mundo,
  id: string,
): { carreira: Carreira; resultado: "ok" | "sem-opcao" | "caixa" | "janela-fechada" } {
  const e = emprestimoDe(c, id);
  const j = mundo.jogador(id);
  const nosso = mundo.clube(c.clube);
  if (!e || e.para !== c.clube || !e.opcao || !j || !nosso)
    return { carreira: c, resultado: "sem-opcao" };
  if (!janelaAberta(mundo.pais(nosso.pais), c.data))
    return { carreira: c, resultado: "janela-fechada" };
  const caixa = caixaDe(c, mundo);
  if (e.opcao > caixa) return { carreira: c, resultado: "caixa" };
  let r = transferir(c, {
    jogador: id,
    de: e.de,
    para: c.clube,
    data: c.data,
    valor: e.opcao,
    tipo: "opcao-de-compra",
  });
  r = {
    ...r,
    caixa: caixa - e.opcao,
    emprestimos: (r.emprestimos ?? []).filter((x) => x !== e),
    contratos: {
      ...r.contratos,
      [id]: contratoNovo(j, c.data, salarioPedido(j, j.contrato, salarioBase)),
    },
    noticias: comNoticias(r, [
      noticia(
        c.data,
        marcar("Opção de compra exercida: {jogador} fica de vez, por {valor}.", {
          jogador: j.nome,
          valor: e.opcao,
        }),
      ),
    ]),
  };
  return { carreira: r, resultado: "ok" };
}

// ------------------------------------------------------------------------------------ Trocas

export type ResultadoTroca =
  | { tipo: "aceita" }
  | { tipo: "falta-dinheiro"; falta: number }
  | {
      tipo: "recusa-clube";
      motivo: "intransferivel" | "elenco-curto" | "elenco-cheio" | "sem-dinheiro";
    }
  | { tipo: "recusa-jogador"; jogador: string }
  | {
      tipo: "impossivel";
      motivo: "janela-fechada" | "caixa" | "elenco-cheio" | "mesmo-clube" | "em-negocio";
    };

/** Quanto o clube da CPU dá por um jogador que recebe na troca: o que serve ao nível dele vale mais. */
export function valorNaTroca(j: Jogador, clube: Clube, data: string): number {
  const util = j.forca >= clube.nivel - 4 ? 1 : j.forca >= clube.nivel - 10 ? 0.7 : 0.35;
  const idade = idadeEm(j.nascimento, data) >= 32 ? 0.7 : 1;
  return arredondar(valorDeMercado(j, data) * util * idade);
}

/**
 * Avalia a troca: o alvo (de um clube da CPU) pelos jogadores oferecidos, mais o dinheiro
 * (positivo: o técnico paga a diferença; negativo: o clube paga). O clube decide pela mesma regra
 * da venda, contando os oferecidos pelo valor que têm para ele.
 */
export function avaliarTroca(
  c: Carreira,
  mundo: Mundo,
  alvo: string,
  oferecidos: readonly string[],
  dinheiro: number,
): { resultado: ResultadoTroca; recebido: number; pedido: number } {
  const j = mundo.jogador(alvo);
  const nosso = mundo.clube(c.clube);
  const fim = (resultado: ResultadoTroca, recebido = 0, pedido = 0) => ({
    resultado,
    recebido,
    pedido,
  });
  const outro = j?.clube ? mundo.clube(j.clube) : undefined;
  if (!j || !nosso || !outro || outro.id === c.clube)
    return fim({ tipo: "impossivel", motivo: "mesmo-clube" });
  const meus = mundo.elenco(c.clube);
  const vao = oferecidos
    .map((id) => meus.find((x) => x.id === id))
    .filter((x): x is Jogador => !!x);
  if (!vao.length || vao.length !== oferecidos.length)
    return fim({ tipo: "impossivel", motivo: "mesmo-clube" });
  const presos = presosEmNegocio(c);
  if (presos.has(alvo) || vao.some((x) => emprestadoAoClube(c, x.id)))
    return fim({ tipo: "impossivel", motivo: "em-negocio" });
  if (
    !janelaAberta(mundo.pais(nosso.pais), c.data) ||
    !janelaAberta(mundo.pais(outro.pais), c.data)
  )
    return fim({ tipo: "impossivel", motivo: "janela-fechada" });
  if (meus.length - vao.length + 1 > ELENCO_MAXIMO)
    return fim({ tipo: "impossivel", motivo: "elenco-cheio" });
  if (dinheiro > caixaDe(c, mundo)) return fim({ tipo: "impossivel", motivo: "caixa" });
  if (mundo.elenco(outro.id).length - 1 + vao.length > ELENCO_MAXIMO)
    return fim({ tipo: "recusa-clube", motivo: "elenco-cheio" });
  const situacao = situacaoDoClube(c, mundo, outro.id, c.data);
  // O clube só paga diferença com dinheiro que tem.
  if (dinheiro < 0) {
    const valorDoElenco = mundo.elenco(outro.id).reduce((s, x) => s + valorDeMercado(x, c.data), 0);
    if (-dinheiro > valorDoElenco * 0.15 * (1 - situacao.precisaDeDinheiro))
      return fim({ tipo: "recusa-clube", motivo: "sem-dinheiro" });
  }
  const recebido = vao.reduce((s, x) => s + valorNaTroca(x, outro, c.data), 0) + dinheiro;
  const r = respostaDeVenda(mundo, situacao, j, recebido, c.data, vao);
  if (r.tipo === "recusa" && r.motivo !== "pedido")
    return fim({ tipo: "recusa-clube", motivo: r.motivo }, recebido, r.pedido);
  if (r.tipo !== "aceita")
    return fim(
      { tipo: "falta-dinheiro", falta: arredondar(r.pedido - recebido) || 100_000 },
      recebido,
      r.pedido,
    );
  if (!aceitaOClube(mundo, j, nosso))
    return fim({ tipo: "recusa-jogador", jogador: alvo }, recebido, r.pedido);
  const naoQuer = vao.find((x) => !aceitaOClube(mundo, x, outro));
  if (naoQuer) return fim({ tipo: "recusa-jogador", jogador: naoQuer.id }, recebido, r.pedido);
  return fim({ tipo: "aceita" }, recebido, r.pedido);
}

/** Faz a troca, se o clube e os jogadores aceitarem. */
export function proporTroca(
  c: Carreira,
  mundo: Mundo,
  alvo: string,
  oferecidos: readonly string[],
  dinheiro: number,
): { carreira: Carreira; resultado: ResultadoTroca } {
  const { resultado } = avaliarTroca(c, mundo, alvo, oferecidos, dinheiro);
  const j = mundo.jogador(alvo);
  if (resultado.tipo !== "aceita" || !j?.clube) return { carreira: c, resultado };
  const outro = j.clube;
  let r = transferir(c, {
    jogador: alvo,
    de: outro,
    para: c.clube,
    data: c.data,
    valor: Math.max(0, dinheiro),
    tipo: "troca",
  });
  r = chegouAoClube(r, alvo, contratoNovo(j, c.data, salarioPedido(j, j.contrato, salarioBase)));
  oferecidos.forEach((id, i) => {
    r = saiuDoClube(
      transferir(r, {
        jogador: id,
        de: c.clube,
        para: outro,
        data: c.data,
        valor: i === 0 && dinheiro < 0 ? -dinheiro : 0,
        tipo: "troca",
      }),
      id,
    );
  });
  const nomes = oferecidos.map((id) => mundo.jogador(id)?.nome ?? id).join(", ");
  r = {
    ...r,
    caixa: caixaDe(c, mundo) - dinheiro,
    noticias: comNoticias(r, [
      noticia(
        c.data,
        dinheiro > 0
          ? marcar("Troca: {jogador} chega do {clube}; vão {nomes} e mais {valor}.", {
              jogador: j.nome,
              clube: nomeDoClube(mundo, outro),
              nomes,
              valor: dinheiro,
            })
          : dinheiro < 0
            ? marcar("Troca: {jogador} chega do {clube}; vão {nomes} e o clube paga {valor}.", {
                jogador: j.nome,
                clube: nomeDoClube(mundo, outro),
                nomes,
                valor: -dinheiro,
              })
            : marcar("Troca: {jogador} chega do {clube}; vão {nomes}.", {
                jogador: j.nome,
                clube: nomeDoClube(mundo, outro),
                nomes,
              }),
      ),
    ]),
  };
  return { carreira: r, resultado };
}

// ----------------------------------------------------------------------------------- Leilões

/** O lance mínimo agora: o mínimo do leilão ou 5% acima do maior lance. */
export function lanceMinimo(l: Leilao): number {
  const maior = l.lances.reduce((m, x) => Math.max(m, x.valor), 0);
  return maior ? arredondar(maior * AUMENTO_DO_LANCE) || maior + 100_000 : l.minimo;
}

export const maiorLance = (l: Leilao) =>
  l.lances.reduce<Leilao["lances"][number] | undefined>(
    (m, x) => (!m || x.valor > m.valor ? x : m),
    undefined,
  );

/** Leiloa um jogador do técnico: fica aberto por 4 dias, com o mínimo que ele escolher. */
export function leiloar(
  c: Carreira,
  mundo: Mundo,
  id: string,
  minimo: number,
): { carreira: Carreira; resultado: "ok" | "janela-fechada" | "em-negocio" | "nao-e-do-clube" } {
  const j = mundo.jogador(id);
  const nosso = mundo.clube(c.clube);
  if (!j || !nosso || !mundo.elenco(c.clube).some((x) => x.id === id))
    return { carreira: c, resultado: "nao-e-do-clube" };
  if (emprestadoAoClube(c, id) || presosEmNegocio(c).has(id))
    return { carreira: c, resultado: "em-negocio" };
  if (!janelaAberta(mundo.pais(nosso.pais), c.data))
    return { carreira: c, resultado: "janela-fechada" };
  const fim = somarDias(c.data, DIAS_DO_LEILAO - 1);
  const l: Leilao = {
    id: `${id}:leilao:${c.data}`,
    jogador: id,
    vendedor: c.clube,
    minimo: Math.max(100_000, arredondar(minimo)),
    fim,
    lances: [],
  };
  return {
    carreira: {
      ...c,
      leiloes: [...(c.leiloes ?? []), l],
      aVenda: (c.aVenda ?? []).filter((x) => x !== id),
      noticias: comNoticias(c, [
        noticia(
          c.data,
          marcar("Leilão aberto: {jogador}, lance mínimo de {valor}, até {fim}.", {
            jogador: j.nome,
            valor: l.minimo,
            fim,
          }),
        ),
      ]),
    },
    resultado: "ok",
  };
}

export type ResultadoLance =
  | { tipo: "ok" }
  | {
      tipo: "impossivel";
      motivo:
        "baixo" | "caixa" | "janela-fechada" | "elenco-cheio" | "encerrado" | "recusa-jogador";
      minimo?: number;
    };

/** Lance do técnico num leilão de um clube da CPU. */
export function darLance(
  c: Carreira,
  mundo: Mundo,
  leilao: string,
  valor: number,
): { carreira: Carreira; resultado: ResultadoLance } {
  const l = (c.leiloes ?? []).find((x) => x.id === leilao);
  const nosso = mundo.clube(c.clube);
  const j = l ? mundo.jogador(l.jogador) : undefined;
  const fim = (resultado: ResultadoLance) => ({ carreira: c, resultado });
  if (!l || !nosso || !j || l.fim < c.data || l.vendedor === c.clube)
    return fim({ tipo: "impossivel", motivo: "encerrado" });
  const minimo = lanceMinimo(l);
  if (valor < minimo) return fim({ tipo: "impossivel", motivo: "baixo", minimo });
  if (valor > caixaDe(c, mundo)) return fim({ tipo: "impossivel", motivo: "caixa" });
  if (!janelaAberta(mundo.pais(nosso.pais), c.data))
    return fim({ tipo: "impossivel", motivo: "janela-fechada" });
  if (mundo.elenco(c.clube).length >= ELENCO_MAXIMO)
    return fim({ tipo: "impossivel", motivo: "elenco-cheio" });
  if (!aceitaOClube(mundo, j, nosso)) return fim({ tipo: "impossivel", motivo: "recusa-jogador" });
  const lance = { clube: c.clube, valor: arredondar(valor) || valor, data: c.data };
  return {
    carreira: {
      ...c,
      leiloes: (c.leiloes ?? []).map((x) => (x === l ? { ...x, lances: [...x.lances, lance] } : x)),
    },
    resultado: { tipo: "ok" },
  };
}

// ----------------------------------------------------------------------------- O dia

/** O dia dos negócios: o que vence hoje, o que a CPU faz e as notícias para o técnico. */
export function diaDosNegocios(
  c: Carreira,
  mundo: Mundo,
  data: string,
): { carreira: Carreira; noticias: Noticia[]; decisao: boolean } {
  const rng = new Rng(`${c.semente}:negocios:${data}`);
  const noticias: Noticia[] = [];
  let decisao = false;
  let r = c;
  // Quem mudou de clube hoje (a CPU não mexe de novo no mesmo dia).
  const movidos = new Set(
    (c.transferencias ?? []).filter((t) => t.data === data).map((t) => t.jogador),
  );
  const novas: Transferencia[] = [];
  const caixa = () => caixaDe(r, mundo);

  // Empréstimos que acabaram ontem: o jogador volta (ou o clube exerce a opção de compra).
  if (r.emprestimos?.some((e) => e.fim < data)) {
    const ficam: Emprestimo[] = [];
    for (const e of r.emprestimos) {
      if (e.fim >= data) {
        ficam.push(e);
        continue;
      }
      const j = mundo.jogador(e.jogador);
      if (!j) continue;
      if (e.para === r.clube) {
        // Volta do clube do técnico para o dono.
        r = saiuDoClube(
          transferir(r, {
            jogador: e.jogador,
            de: e.para,
            para: e.de,
            data,
            valor: 0,
            tipo: "volta-de-emprestimo",
          }),
          e.jogador,
        );
        noticias.push(
          noticia(
            data,
            marcar("Fim do empréstimo: {jogador} volta ao {clube}.", {
              jogador: j.nome,
              clube: nomeDoClube(mundo, e.de),
            }),
          ),
        );
        continue;
      }
      if (j.clube !== e.para) continue;
      if (e.de === r.clube) {
        // Jogador do técnico: o clube que pegou pode comprar pela opção, se ele se firmou lá.
        const clube = mundo.clube(e.para);
        if (e.opcao && clube && j.forca >= clube.nivel - 3 && rng.chance(0.6)) {
          r = saiuDoClube(
            transferir(r, {
              jogador: e.jogador,
              de: r.clube,
              para: e.para,
              data,
              valor: e.opcao,
              tipo: "opcao-de-compra",
            }),
            e.jogador,
          );
          r = { ...r, caixa: caixa() + e.opcao };
          noticias.push(
            noticia(
              data,
              marcar("O {clube} exerceu a opção de compra de {jogador}: {valor} em caixa.", {
                clube: nomeDoClube(mundo, e.para),
                jogador: j.nome,
                valor: e.opcao,
              }),
            ),
          );
          continue;
        }
        r = transferir(r, {
          jogador: e.jogador,
          de: e.para,
          para: r.clube,
          data,
          valor: 0,
          tipo: "volta-de-emprestimo",
        });
        r = { ...r, jogadores: { ...r.jogadores, [e.jogador]: estadoDe(r, e.jogador) } };
        noticias.push(
          noticia(
            data,
            marcar("{jogador} volta do empréstimo ao {clube}.", {
              jogador: j.nome,
              clube: nomeDoClube(mundo, e.para),
            }),
          ),
        );
        continue;
      }
      novas.push({
        jogador: e.jogador,
        de: e.para,
        para: e.de,
        data,
        valor: 0,
        tipo: "volta-de-emprestimo",
      });
    }
    r = { ...r, emprestimos: ficam };
  }

  // Pré-contratos: quem chega hoje ao clube do técnico (ou sai dele, pelo fim do contrato, no
  // diaDoElenco); e a CPU assediando os jogadores do técnico nos últimos 6 meses de contrato.
  if (r.preContratos?.some((p) => p.para === r.clube && p.chegada <= data)) {
    const ficam: PreContrato[] = [];
    for (const p of r.preContratos) {
      if (p.para !== r.clube || p.chegada > data) {
        ficam.push(p);
        continue;
      }
      const j = mundo.jogador(p.jogador);
      if (!j) continue;
      r = transferir(r, {
        jogador: p.jogador,
        ...(j.clube ? { de: j.clube } : {}),
        para: r.clube,
        data,
        valor: 0,
        tipo: "pre-contrato",
      });
      r = chegouAoClube(r, p.jogador, contratoNovo(j, data, p.salario));
      noticias.push(
        noticia(
          data,
          marcar("{jogador} se apresenta: chegou pelo pré-contrato, sem custo.", {
            jogador: j.nome,
          }),
        ),
      );
    }
    r = { ...r, preContratos: ficam };
  }
  // Sondagens: aviso da diretoria, conversa do jogador, prazo e, sem renovação, o pré-contrato.
  const sondagens = diaDasSondagens(r, mundo, data, rng.fork("assedio"));
  if (sondagens.decisao) decisao = true;
  noticias.push(...sondagens.noticias);
  if (sondagens.sondagens.length || r.sondagens?.length)
    r = { ...r, sondagens: sondagens.sondagens };
  if (sondagens.preContratos.length)
    r = { ...r, preContratos: [...(r.preContratos ?? []), ...sondagens.preContratos] };
  if (sondagens.propostas.length)
    r = { ...r, propostas: [...(r.propostas ?? []), ...sondagens.propostas] };

  // Leilões: fecham os vencidos, a CPU abre leilões de clubes em crise e dá lances.
  const leiloes = diaDosLeiloes(r, mundo, data, rng.fork("leiloes"), movidos);
  r = leiloes.carreira;
  noticias.push(...leiloes.noticias);
  novas.push(...leiloes.transferencias);

  // A CPU empresta os garotos que não jogam a clubes menores.
  novas.push(
    ...emprestimosDaCpu(r, mundo, data, rng.fork("emprestimos"), movidos).map((e) => {
      r = { ...r, emprestimos: [...(r.emprestimos ?? []), e] };
      return {
        jogador: e.jogador,
        de: e.de,
        para: e.para,
        data,
        valor: e.taxa,
        tipo: "emprestimo",
      } as Transferencia;
    }),
  );

  if (novas.length) r = { ...r, transferencias: [...(r.transferencias ?? []), ...novas] };
  if (noticias.length) r = { ...r, noticias: comNoticias(r, noticias) };
  return { carreira: r, noticias, decisao };
}

/** Empréstimos entre clubes da CPU: o grande cede o garoto que não joga a um clube do nível dele. */
function emprestimosDaCpu(
  c: Carreira,
  mundo: Mundo,
  data: string,
  rng: Rng,
  movidos: Set<string>,
): Emprestimo[] {
  const clubes = (mundo.clubes ?? []).filter((x) => !x.filialDe && x.id !== c.clube);
  if (!clubes.length) return [];
  const presos = presosEmNegocio(c);
  const aberta = (x: Clube) => !!janelaAberta(mundo.pais(x.pais), data);
  const novos: Emprestimo[] = [];
  const usados = new Set<string>();
  for (let i = 0; i < 60; i++) {
    const dono = clubes[rng.int(0, clubes.length - 1)] as Clube;
    if (dono.nivel < 70 || usados.has(dono.id) || !aberta(dono) || !rng.chance(0.4)) continue;
    usados.add(dono.id);
    const elenco = mundo.elenco(dono.id);
    if (elenco.length <= 22) continue;
    const garotos = elenco.filter(
      (j) =>
        !presos.has(j.id) &&
        !movidos.has(j.id) &&
        j.posicao !== "G" &&
        idadeEm(j.nascimento, data) <= 21 &&
        j.forca <= dono.nivel - 8 &&
        j.potencial >= j.forca + 5,
    );
    if (!garotos.length) continue;
    const j = garotos[rng.int(0, garotos.length - 1)] as Jogador;
    const destinos = clubes.filter(
      (x) =>
        x.id !== dono.id &&
        !usados.has(x.id) &&
        x.nivel >= j.forca - 6 &&
        x.nivel <= j.forca + 2 &&
        aberta(x),
    );
    if (!destinos.length) continue;
    const destino = destinos[rng.int(0, destinos.length - 1)] as Clube;
    if (mundo.elenco(destino.id).length >= 28) continue;
    usados.add(destino.id);
    presos.add(j.id);
    novos.push({
      jogador: j.id,
      de: dono.id,
      para: destino.id,
      inicio: data,
      fim: fimDaTemporada(mundo, destino.id, data),
      taxa: 0,
      parteDoSalario: 1,
    });
  }
  return novos;
}

/** Fecha os leilões vencidos, abre os da CPU e põe os lances da CPU. */
function diaDosLeiloes(
  c: Carreira,
  mundo: Mundo,
  data: string,
  rng: Rng,
  movidos: Set<string>,
): { carreira: Carreira; noticias: Noticia[]; transferencias: Transferencia[] } {
  let r = c;
  const noticias: Noticia[] = [];
  const transferencias: Transferencia[] = [];
  const nosso = mundo.clube(c.clube);
  const abertaNoPais = (pais: string) => !!janelaAberta(mundo.pais(pais), data);
  const abertos: Leilao[] = [];
  for (const l of r.leiloes ?? []) {
    if (l.fim >= data) {
      abertos.push(l);
      continue;
    }
    const j = mundo.jogador(l.jogador);
    const doTecnico = l.vendedor === r.clube;
    const lances = [...l.lances].sort((a, b) => b.valor - a.valor);
    let vencedor: (typeof lances)[number] | undefined;
    // O clube da CPU que ficou com o elenco curto no caminho desiste do leilão.
    const curto = !doTecnico && mundo.elenco(l.vendedor).length <= ELENCO_MINIMO_PARA_VENDER;
    for (const x of lances) {
      if (!j || j.clube !== l.vendedor || curto) break;
      if (x.clube === r.clube) {
        const ok =
          !!nosso &&
          abertaNoPais(nosso.pais) &&
          x.valor <= caixaDe(r, mundo) &&
          mundo.elenco(r.clube).length < ELENCO_MAXIMO;
        if (ok) {
          vencedor = x;
          break;
        }
        continue;
      }
      const clube = mundo.clube(x.clube);
      if (clube && abertaNoPais(clube.pais)) {
        vencedor = x;
        break;
      }
    }
    if (!j) continue;
    if (!vencedor) {
      if (doTecnico || l.lances.some((x) => x.clube === r.clube))
        noticias.push(
          noticia(
            data,
            marcar("Leilão encerrado sem venda: {jogador} fica no {clube}.", {
              jogador: j.nome,
              clube: nomeDoClube(mundo, l.vendedor),
            }),
          ),
        );
      continue;
    }
    const t: Transferencia = {
      jogador: l.jogador,
      de: l.vendedor,
      para: vencedor.clube,
      data,
      valor: vencedor.valor,
      tipo: "leilao",
    };
    if (vencedor.clube === r.clube) {
      r = transferir(r, t);
      r = chegouAoClube(
        r,
        l.jogador,
        contratoNovo(j, data, salarioPedido(j, j.contrato, salarioBase)),
      );
      r = { ...r, caixa: caixaDe(r, mundo) - vencedor.valor };
      noticias.push(
        noticia(
          data,
          marcar("Leilão vencido: {jogador} chega do {clube} por {valor}.", {
            jogador: j.nome,
            clube: nomeDoClube(mundo, l.vendedor),
            valor: vencedor.valor,
          }),
        ),
      );
    } else if (doTecnico) {
      r = saiuDoClube(transferir(r, t), l.jogador);
      r = { ...r, caixa: caixaDe(r, mundo) + vencedor.valor };
      noticias.push(
        noticia(
          data,
          marcar("Leilão encerrado: {jogador} vai para o {clube} por {valor}.", {
            jogador: j.nome,
            clube: nomeDoClube(mundo, vencedor.clube),
            valor: vencedor.valor,
          }),
        ),
      );
    } else {
      transferencias.push(t);
      if (l.lances.some((x) => x.clube === r.clube))
        noticias.push(
          noticia(
            data,
            marcar("Leilão perdido: {jogador} foi para o {clube} por {valor}.", {
              jogador: j.nome,
              clube: nomeDoClube(mundo, vencedor.clube),
              valor: vencedor.valor,
            }),
          ),
        );
    }
  }
  // Leilões do técnico que saíram do elenco no caminho (vendido, dispensado) já sumiram; os
  // abertos seguem.
  r = { ...r, leiloes: abertos };

  // Um clube da CPU em crise leiloa um titular (no máximo 4 leilões da CPU abertos).
  const daCpu = abertos.filter((l) => l.vendedor !== r.clube).length;
  if (daCpu < LEILOES_DA_CPU && rng.chance(0.35)) {
    const presos = presosEmNegocio(r);
    const clubes = (mundo.clubes ?? []).filter((x) => !x.filialDe && x.id !== r.clube);
    for (let i = 0; i < 25 && clubes.length; i++) {
      const x = clubes[rng.int(0, clubes.length - 1)] as Clube;
      if (!abertaNoPais(x.pais)) continue;
      const s = situacaoDoClube(r, mundo, x.id, data);
      if (s.precisaDeDinheiro < 0.6) continue;
      const elenco = [...mundo.elenco(x.id)].sort((a, b) => b.forca - a.forca);
      if (elenco.length <= 20) continue;
      const opcoes = elenco
        .slice(1, 8)
        .filter((j) => !presos.has(j.id) && !movidos.has(j.id) && j.posicao !== "G");
      if (!opcoes.length) continue;
      const j = opcoes[rng.int(0, opcoes.length - 1)] as Jogador;
      const minimo = arredondar(valorDeMercado(j, data) * 0.6);
      if (!minimo) continue;
      const l: Leilao = {
        id: `${j.id}:leilao:${data}`,
        jogador: j.id,
        vendedor: x.id,
        minimo,
        fim: somarDias(data, DIAS_DO_LEILAO - 1),
        lances: [],
      };
      r = { ...r, leiloes: [...(r.leiloes ?? []), l] };
      if (nosso && j.forca >= nosso.nivel - 5)
        noticias.push(
          noticia(
            data,
            marcar(
              "Leilão: o {clube}, apertado, leiloa {jogador} (lance mínimo de {valor}) até {fim}. Dê seu lance na aba Mercado.",
              { clube: x.nomeCurto, jogador: j.nome, valor: minimo, fim: l.fim },
            ),
          ),
        );
      break;
    }
  }

  // Lances da CPU: um interessado por leilão por dia, até o limite que ele se deu.
  r = {
    ...r,
    leiloes: (r.leiloes ?? []).map((l) => {
      if (!rng.chance(0.6)) return l;
      const j = mundo.jogador(l.jogador);
      if (!j) return l;
      const candidatos = (mundo.clubes ?? []).filter(
        (x) =>
          x.id !== l.vendedor &&
          x.id !== r.clube &&
          !x.filialDe &&
          x.nivel >= j.forca - 10 &&
          x.nivel <= j.forca + 6,
      );
      for (let i = 0; i < 6 && candidatos.length; i++) {
        const x = candidatos[rng.int(0, candidatos.length - 1)] as Clube;
        if (!abertaNoPais(x.pais)) continue;
        const valor = Math.max(lanceMinimo(l), arredondar(lanceMinimo(l) * rng.float(1, 1.1)));
        // Cada clube vai até um teto fixo por leilão (de 1 a 1,4 vez o valor).
        const teto =
          valorDeMercado(j, data) * new Rng(`${c.semente}:${l.id}:${x.id}`).float(1, 1.4);
        if (valor > teto) continue;
        const s = situacaoDoClube(r, mundo, x.id, data);
        const valorDoElenco = mundo.elenco(x.id).reduce((t, y) => t + valorDeMercado(y, data), 0);
        if (valor > valorDoElenco * 0.2 * (1 - s.precisaDeDinheiro)) continue;
        const superou = maiorLance(l)?.clube === r.clube;
        if (superou && nosso)
          noticias.push(
            noticia(
              data,
              marcar("Leilão de {jogador}: o {clube} cobriu seu lance com {valor}.", {
                jogador: j.nome,
                clube: x.nomeCurto,
                valor,
              }),
            ),
          );
        return { ...l, lances: [...l.lances, { clube: x.id, valor, data }] };
      }
      return l;
    }),
  };
  return { carreira: r, noticias, transferencias };
}
