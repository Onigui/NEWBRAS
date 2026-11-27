/**
 * Mercado aquecido entre os clubes da CPU (etapa 13b). Nas janelas do país, cada clube às vezes
 * vai ao mercado: olha o elenco, acha a posição mais fraca para o nível dele, separa um orçamento
 * pelo quanto precisa de dinheiro e procura no mundo (e entre os livres) quem melhora o time e
 * cabe no bolso. O vendedor decide pela mesma regra do técnico (situação e peso do jogador). Quem
 * passa de 30 no elenco dispensa o mais fraco, que vira livre.
 */
import type { Jogador, Posicao } from "@newbras/data";
import { marcar } from "@newbras/textos";
import type { Carreira, Mundo, Noticia } from "../carreira/carreira";
import { idadeEm } from "../evolucao";
import { Rng } from "../rng";
import { aceitaOClube, livresDe, presosEmNegocio, type Transferencia } from "./comum";
import { respostaDeVenda, situacaoDoClube, type SituacaoDoClube } from "./situacao";
import { janelaAberta, valorDeMercado } from "./valor";

/** Titulares por posição num 4-4-2 (para achar a posição mais fraca). */
const TITULARES: Readonly<Record<Posicao, number>> = { G: 1, Z: 2, L: 2, M: 4, A: 2 };
const ELENCO_MAXIMO = 30;
/** Chance, por dia de janela, de um clube ir ao mercado (os grandes mexem mais). */
const chanceDeIr = (nivel: number) => (nivel >= 80 ? 0.012 : nivel >= 60 ? 0.008 : 0.004);
/** Fração do valor do elenco que o clube saudável gasta numa contratação. */
const ORCAMENTO = 0.15;
/** Quantos candidatos o clube olha antes de escolher. */
const CANDIDATOS = 25;
/** Transferências da CPU que viram notícia: estrela ou acima desse valor (até 4 por dia). */
const VALOR_DE_MANCHETE = 40_000_000;
const MANCHETES_POR_DIA = 4;

/** A posição mais fraca do elenco para o nível do clube, e a força do titular que sairia. */
function posicaoMaisFraca(
  elenco: readonly Jogador[],
  nivel: number,
): { posicao: Posicao; titular: number; buraco: number } {
  let pior = { posicao: "M" as Posicao, titular: 0, buraco: -Infinity };
  for (const p of Object.keys(TITULARES) as Posicao[]) {
    const forcas = elenco
      .filter((j) => j.posicao === p)
      .map((j) => j.forca)
      .sort((a, b) => b - a);
    // Goleiro: precisa de 2 (o reserva conta como buraco se faltar).
    if (p === "G" && forcas.length < 2) return { posicao: "G", titular: 0, buraco: 100 };
    const titular = forcas[TITULARES[p] - 1] ?? 0;
    const buraco = nivel - titular;
    if (buraco > pior.buraco) pior = { posicao: p, titular, buraco };
  }
  return pior;
}

/** O mercado da CPU num dia: as transferências entre os clubes e as notícias das grandes. */
export function mercadoDaCpu(
  c: Carreira,
  mundo: Mundo,
  data: string,
): { transferencias: Transferencia[]; noticias: Noticia[] } {
  const clubes = (mundo.clubes ?? []).filter((x) => !x.filialDe && x.id !== c.clube);
  if (!clubes.length) return { transferencias: [], noticias: [] };
  const rng = new Rng(`${c.semente}:mercado-cpu:${data}`);
  const abertas = new Map<string, boolean>();
  const aberta = (pais: string) => {
    let v = abertas.get(pais);
    if (v === undefined) abertas.set(pais, (v = !!janelaAberta(mundo.pais(pais), data)));
    return v;
  };
  const transferencias: Transferencia[] = [];
  const noticias: Noticia[] = [];
  // Emprestados, com pré-contrato e em leilão ficam fora do mercado comum.
  const movidos = presosEmNegocio(c);
  const tamanho = new Map<string, number>();
  const tamanhoDe = (clube: string) => tamanho.get(clube) ?? mundo.elenco(clube).length;
  // Elenco inchado (lendas que subiram, garotos da base): na janela, dispensa os que passam de 30,
  // do mais fraco (e mais velho) para cima.
  for (const x of clubes) {
    if (!aberta(x.pais)) continue;
    const elenco = mundo.elenco(x.id);
    if (elenco.length <= ELENCO_MAXIMO) continue;
    const saem = elenco
      .filter((j) => !movidos.has(j.id))
      .sort(
        (a, b) => a.forca - b.forca || idadeEm(b.nascimento, data) - idadeEm(a.nascimento, data),
      )
      .slice(0, elenco.length - ELENCO_MAXIMO);
    for (const j of saem) {
      movidos.add(j.id);
      transferencias.push({ jogador: j.id, de: x.id, data, valor: 0, tipo: "dispensa" });
    }
    tamanho.set(x.id, ELENCO_MAXIMO);
  }
  // Quem está sem o mínimo numa posição (menos de 2 goleiros, menos titulares que o 4-4-2) vai
  // ao mercado na certa; os outros, de vez em quando.
  const faltaGente = (clube: string) => {
    const e = mundo.elenco(clube);
    return (Object.keys(TITULARES) as Posicao[]).some(
      (p) => e.filter((j) => j.posicao === p).length < (p === "G" ? 2 : TITULARES[p]),
    );
  };
  const vaoAoMercado = clubes.filter(
    (x) => aberta(x.pais) && (rng.chance(chanceDeIr(x.nivel)) || faltaGente(x.id)),
  );
  if (!vaoAoMercado.length) return { transferencias, noticias };

  const porPosicao = indiceDoMundo(c, mundo, data);
  const livres = livresDe(c)
    .map((id) => mundo.jogador(id))
    .filter((j): j is Jogador => !!j && !j.clube);

  const situacoes = new Map<string, SituacaoDoClube>();
  const situacao = (clube: string) => {
    let s = situacoes.get(clube);
    if (!s) situacoes.set(clube, (s = situacaoDoClube(c, mundo, clube, data)));
    return s;
  };
  // Até 31 anos: nascido depois desta data (comparar texto é bem mais barato que calcular a idade).
  const nascidoAte = `${Number(data.slice(0, 4)) - 32}${data.slice(4)}`;

  for (const comprador of vaoAoMercado) {
    if (tamanhoDe(comprador.id) >= ELENCO_MAXIMO) continue;
    const elenco = mundo.elenco(comprador.id).filter((j) => !movidos.has(j.id));
    const alvo = posicaoMaisFraca(elenco, comprador.nivel);
    // Sem buraco, só às vezes vai atrás de alguém melhor que o titular.
    if (alvo.buraco < 2 && !rng.chance(0.3)) continue;
    const minimo = alvo.titular + 3;
    const maximo = comprador.nivel + 6;
    const meu = situacao(comprador.id);
    const valorDoElenco = elenco.reduce((s, j) => s + valorDeMercado(j, data), 0);
    const orcamento = valorDoElenco * ORCAMENTO * (1 - meu.precisaDeDinheiro);
    const cabe = (j: Jogador) =>
      j.forca >= minimo &&
      j.forca <= maximo &&
      j.nascimento > nascidoAte &&
      !movidos.has(j.id) &&
      aceitaOClube(mundo, j, comprador);
    // Livre que resolve vem de graça.
    const livre = livres.filter((j) => j.posicao === alvo.posicao && cabe(j));
    if (livre.length) {
      const j = livre.sort((a, b) => b.forca - a.forca)[0] as Jogador;
      movidos.add(j.id);
      tamanho.set(comprador.id, tamanhoDe(comprador.id) + 1);
      transferencias.push({ jogador: j.id, para: comprador.id, data, valor: 0, tipo: "livre" });
      continue;
    }
    // Sorteia candidatos na faixa de força (a lista vem da mais forte para a mais fraca).
    const lista = porPosicao.get(alvo.posicao) ?? [];
    const ate = primeiroAbaixo(lista, minimo);
    const de0 = primeiroAbaixo(lista, maximo + 1);
    const olhados: Jogador[] = [];
    for (
      let tentativa = 0;
      tentativa < 200 && olhados.length < CANDIDATOS && ate > de0;
      tentativa++
    ) {
      const indice = lista[rng.int(de0, ate - 1)] as Jogador;
      // O índice é da semana: confere o clube de hoje.
      const j = mundo.jogador(indice.id);
      if (j && j.clube && j.clube !== comprador.id && j.clube !== c.clube && cabe(j))
        if (!olhados.some((x) => x.id === j.id)) olhados.push(j);
    }
    let escolha: { j: Jogador; valor: number } | undefined;
    for (const j of olhados) {
      const vendedor = mundo.clube(j.clube ?? "");
      if (!vendedor || !aberta(comprador.pais)) continue;
      const r = respostaDeVenda(mundo, situacao(vendedor.id), j, Number.MAX_SAFE_INTEGER, data);
      if (r.tipo !== "aceita" || r.pedido > orcamento) continue;
      if (tamanhoDe(vendedor.id) <= 18) continue;
      if (!escolha || j.forca > escolha.j.forca) escolha = { j, valor: r.pedido };
    }
    if (!escolha) continue;
    const { j, valor } = escolha;
    const de = j.clube as string;
    movidos.add(j.id);
    tamanho.set(comprador.id, tamanhoDe(comprador.id) + 1);
    tamanho.set(de, tamanhoDe(de) - 1);
    transferencias.push({ jogador: j.id, de, para: comprador.id, data, valor, tipo: "compra" });
    if ((valor >= VALOR_DE_MANCHETE || j.estrela) && noticias.length < MANCHETES_POR_DIA)
      noticias.push({
        data,
        tipo: "carreira",
        ...marcar("Mercado: {jogador} troca o {de} pelo {para} por {valor}.", {
          jogador: j.nome,
          de: mundo.clube(de)?.nomeCurto ?? de,
          para: comprador.nomeCurto,
          valor,
        }),
      });
  }
  return { transferencias, noticias };
}

/**
 * Enxuga a lista de transferências: de cada jogador fica só a última (ela diz onde ele está), menos
 * as que envolvem o clube do técnico (o histórico dele) e as da temporada (o saldo dos clubes).
 */
export function compactarTransferencias(
  lista: readonly Transferencia[],
  clube: string,
  desde: string,
): Transferencia[] {
  const ultima = new Map<string, number>();
  lista.forEach((t, i) => ultima.set(t.jogador, i));
  return lista.filter(
    (t, i) => ultima.get(t.jogador) === i || t.de === clube || t.para === clube || t.data >= desde,
  );
}

/** Na lista do mais forte ao mais fraco, a posição do primeiro com força abaixo de `forca`. */
function primeiroAbaixo(lista: readonly Jogador[], forca: number): number {
  let a = 0;
  let b = lista.length;
  while (a < b) {
    const m = (a + b) >> 1;
    if ((lista[m] as Jogador).forca >= forca) a = m + 1;
    else b = m;
  }
  return a;
}

/** Índice do mundo por posição, do mais forte ao mais fraco, refeito a cada semana. */
const indices = new Map<string, { semana: string; porPosicao: Map<Posicao, Jogador[]> }>();
function indiceDoMundo(c: Carreira, mundo: Mundo, data: string): Map<Posicao, Jogador[]> {
  const chave = `${c.semente}|${c.inicio}`;
  const dia = Math.floor(Date.parse(`${data}T00:00:00Z`) / 86_400_000);
  const semana = `${Math.floor(dia / 7)}`;
  const guardado = indices.get(chave);
  if (guardado?.semana === semana) return guardado.porPosicao;
  const porPosicao = new Map<Posicao, Jogador[]>();
  for (const x of mundo.clubes ?? [])
    if (x.id !== c.clube)
      for (const j of mundo.elenco(x.id)) {
        const l = porPosicao.get(j.posicao);
        if (l) l.push(j);
        else porPosicao.set(j.posicao, [j]);
      }
  for (const l of porPosicao.values()) l.sort((a, b) => b.forca - a.forca);
  indices.set(chave, { semana, porPosicao });
  return porPosicao;
}
