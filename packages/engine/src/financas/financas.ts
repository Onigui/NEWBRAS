/**
 * Finanças de verdade (etapa 14a): receitas e despesas do clube do técnico mês a mês e o caixa de
 * cada clube da CPU, que passa a decidir se ele "precisa de dinheiro" no mercado.
 *
 * A escala segue o futebol real. A receita anual cresce uns 3 vezes a cada 10 pontos de nível
 * econômico (o do clube com a força do elenco; 750 milhões no 90) e muda com a economia do país (a Premier League vale 1,3; a Argentina,
 * 0,55). Os salários sobem 4,2 vezes a cada 10 pontos de força (2 milhões por mês na força 90);
 * como os clubes pequenos têm elencos mais espalhados, a folha fica perto de metade da receita em
 * todos os níveis.
 *
 * Do clube do técnico:
 * - todo dia 1, entram TV (30% da receita anual, dividida por 12), patrocínio (22%) e comercial
 *   (6%) e saem salários, estrutura e funcionários (20%), manutenção do estádio e olheiros;
 * - em cada jogo em casa entra a bilheteria (público pela reputação e pela moral do time, vezes o
 *   preço do ingresso);
 * - título e vice dão premiação.
 * Da CPU: todo dia 1, o caixa recebe 78% da receita do mês (com um ajuste pela posição na liga) e
 * paga a folha (pela força atual) e a estrutura (20%, ou 8% cortando gastos no vermelho); compras
 * e vendas mexem no caixa no dia.
 */
import type { Clube } from "@newbras/data";
import { marcar } from "@newbras/textos";
import type { Carreira, Compromisso, Mundo, Noticia } from "../carreira/carreira";
import { contratoDe } from "../elenco/vida";
import { salarioBase } from "../gerador/jogador";
import { tabelaDoGrupo } from "../competicoes/competicao";
import { caixaDe } from "../mercado/comum";
import { Rng } from "../rng";

/** Economia de cada país: quanto a mesma força rende lá (TV, patrocínio, público). */
export const FATOR_DO_PAIS: Readonly<Record<string, number>> = {
  ENG: 1.3,
  ESP: 1.1,
  GER: 1.1,
  ITA: 1.0,
  KSA: 1.2,
  FRA: 0.9,
  USA: 0.9,
  POR: 0.8,
  NED: 0.8,
  BRA: 0.75,
  MEX: 0.8,
  TUR: 0.8,
  ARG: 0.55,
};
const FATOR_PADRAO = 0.65;

export type CategoriaFinanceira =
  | "tv"
  | "patrocinio"
  | "comercial"
  | "bilheteria"
  | "premios"
  | "salarios"
  | "estrutura"
  | "manutencao"
  | "olheiros"
  | "emprestimo"
  | "credito"
  | "socios"
  | "naming"
  | "eventos"
  | "obras"
  | "amistosos";

/** Receitas e despesas do clube do técnico num mês (receita positiva, despesa negativa). */
export interface MesFinanceiro {
  /** AAAA-MM. */
  mes: string;
  valores: Partial<Record<CategoriaFinanceira, number>>;
  /** Jogos em casa e público total no mês. */
  jogosEmCasa?: number;
  publico?: number;
}

/** Meses guardados no extrato. */
const MESES_NO_EXTRATO = 24;
/** Teto do caixa da CPU, em anos de receita (acima disso, o dono investe ou retira). */
const TETO_DO_CAIXA_DA_CPU = 0.6;

const arredondar = (v: number) => Math.round(v / 1000) * 1000;
const fatorDoPais = (clube: Clube | undefined) => FATOR_DO_PAIS[clube?.pais ?? ""] ?? FATOR_PADRAO;

/**
 * Nível econômico: metade o nível do clube (tamanho, torcida, história) e metade a força dos 11
 * melhores do elenco agora. Time que melhora ganha mais (prêmios, público, patrocínio) e o que se
 * desmancha perde, então a receita acompanha a folha.
 */
export function nivelEconomico(mundo: Mundo, clube: string): number {
  const c = mundo.clube(clube);
  if (!c) return 0;
  const onze = mundo
    .elenco(clube)
    .map((j) => j.forca)
    .sort((a, b) => b - a)
    .slice(0, 11);
  if (!onze.length) return c.nivel;
  return (c.nivel + onze.reduce((a, b) => a + b, 0) / onze.length) / 2;
}

/** Receita anual do clube (TV, patrocínio, comercial, bilheteria e premiações médias). */
export function receitaAnual(mundo: Mundo, clube: string): number {
  const c = mundo.clube(clube);
  if (!c) return 0;
  return arredondar(750_000_000 * 1.122 ** (nivelEconomico(mundo, clube) - 90) * fatorDoPais(c));
}

/** Preço médio do ingresso no estádio do clube. */
export function precoDoIngresso(mundo: Mundo, clube: string): number {
  const c = mundo.clube(clube);
  if (!c) return 0;
  return Math.max(2, Math.round(80 * 1.08 ** (c.nivel - 90) * Math.sqrt(fatorDoPais(c))));
}

/** Manutenção do estádio por mês: meio jogo de casa cheia. */
export function manutencaoMensal(mundo: Mundo, clube: string, capacidade?: number): number {
  const c = mundo.clube(clube);
  if (!c) return 0;
  return arredondar((capacidade ?? c.estadio.capacidade) * precoDoIngresso(mundo, clube) * 0.5);
}

/**
 * Público e renda de um jogo em casa: a reputação enche o estádio (35% na reputação 1, 85% na 5),
 * a moral do time soma ou tira até 20 pontos, e o amistoso leva metade do público pela metade do
 * preço.
 */
export function rendaDoJogo(
  c: Pick<Carreira, "clube" | "moral">,
  mundo: Mundo,
  amistoso: boolean,
): { publico: number; renda: number } {
  const clube = mundo.clube(c.clube);
  if (!clube) return { publico: 0, renda: 0 };
  const ocupacao = Math.min(
    1,
    Math.max(0.15, 0.225 + 0.125 * clube.reputacao + ((c.moral ?? 50) - 50) / 250),
  );
  const publico = Math.round(clube.estadio.capacidade * ocupacao * (amistoso ? 0.5 : 1));
  const preco = precoDoIngresso(mundo, c.clube) * (amistoso ? 0.5 : 1);
  return { publico, renda: arredondar(publico * preco) };
}

/** Folha salarial do clube do técnico por mês (os emprestados a outro clube pagam a parte deles). */
export function folhaSalarial(c: Carreira, mundo: Mundo): number {
  let total = 0;
  for (const j of mundo.elenco(c.clube)) total += contratoDe(c, mundo, j.id)?.salario ?? 0;
  for (const e of c.emprestimos ?? []) {
    if (e.de !== c.clube) continue;
    const salario = contratoDe(c, mundo, e.jogador)?.salario ?? 0;
    total += salario * (1 - e.parteDoSalario);
  }
  return Math.round(total);
}

/** O que entra e sai todo mês no clube do técnico (sem bilheteria, premiação e transferências). */
export function orcamentoMensal(
  c: Carreira,
  mundo: Mundo,
): Partial<Record<CategoriaFinanceira, number>> {
  const r = receitaAnual(mundo, c.clube) / 12;
  const olheiros = (c.base?.olheiros ?? []).reduce((s, o) => s + o.salario, 0);
  // Em crise (salários atrasados ou caixa negativo), os patrocinadores desconfiam: 15% a menos.
  const emCrise = (c.crise?.mesesAtrasados ?? 0) > 0 || caixaDe(c, mundo) < 0;
  return {
    tv: arredondar(r * 0.3),
    patrocinio: arredondar(r * 0.22 * (emCrise ? 0.85 : 1)),
    comercial: arredondar(r * 0.06),
    salarios: -folhaSalarial(c, mundo),
    estrutura: -arredondar(r * 0.2),
    manutencao: -manutencaoMensal(mundo, c.clube, c.estadio?.capacidade),
    ...(olheiros ? { olheiros: -olheiros } : {}),
  };
}

/** Lança valores no caixa e no extrato do mês. */
export function lancar(
  c: Carreira,
  mundo: Mundo,
  data: string,
  valores: Partial<Record<CategoriaFinanceira, number>>,
  publico?: number,
): Carreira {
  const mes = data.slice(0, 7);
  const lista = [...(c.financas ?? [])];
  let atual = lista.at(-1);
  if (atual?.mes !== mes) {
    atual = { mes, valores: {} };
    lista.push(atual);
  } else {
    atual = { ...atual, valores: { ...atual.valores } };
    lista[lista.length - 1] = atual;
  }
  let soma = 0;
  for (const [k, v] of Object.entries(valores) as [CategoriaFinanceira, number][]) {
    if (!v) continue;
    atual.valores[k] = (atual.valores[k] ?? 0) + v;
    soma += v;
  }
  if (publico !== undefined) {
    atual.jogosEmCasa = (atual.jogosEmCasa ?? 0) + 1;
    atual.publico = (atual.publico ?? 0) + publico;
  }
  return {
    ...c,
    caixa: caixaDe(c, mundo) + soma,
    financas: lista.slice(-MESES_NO_EXTRATO),
  };
}

/** Bilheteria do jogo em casa do técnico (chamada ao registrar o jogo). */
export function bilheteria(c: Carreira, mundo: Mundo, x: Compromisso): Carreira {
  if (x.mando !== "casa" || x.neutro) return c;
  const { publico, renda } = rendaDoJogo(c, mundo, x.tipo === "amistoso");
  return lancar(c, mundo, x.data, { bilheteria: renda }, publico);
}

/** Peso da premiação de título (e metade para o vice), em parte da receita anual. */
function pesoDoPremio(tipo: string, escopo: string): number {
  if (escopo === "mundial") return 0.08;
  if (escopo === "confederacao") return 0.12;
  if (escopo === "estado") return 0.02;
  return tipo === "liga" ? 0.1 : 0.04;
}

/** Premiações do técnico pelas competições que acabaram hoje (título e vice). */
export function premiacoes(
  c: Carreira,
  mundo: Mundo,
  data: string,
  registros: readonly { competicao: string; campeao?: string; vice?: string }[],
): { carreira: Carreira; noticias: Noticia[] } {
  let r = c;
  const noticias: Noticia[] = [];
  const receita = receitaAnual(mundo, c.clube);
  for (const h of registros) {
    const titulo = h.campeao === c.clube;
    if (!titulo && h.vice !== c.clube) continue;
    const comp = mundo.competicao(h.competicao);
    if (!comp) continue;
    const valor = arredondar(
      receita * pesoDoPremio(comp.tipo, comp.escopo.tipo) * (titulo ? 1 : 0.5),
    );
    if (!valor) continue;
    r = lancar(r, mundo, data, { premios: valor });
    noticias.push({
      data,
      tipo: "carreira",
      ...marcar(
        titulo
          ? "Premiação pelo título da {competicao}: {valor} em caixa."
          : "Premiação pelo vice da {competicao}: {valor} em caixa.",
        { competicao: comp.nome, valor },
      ),
    });
  }
  return { carreira: r, noticias };
}

// ------------------------------------------------------------------------------------- CPU

/** Posição e jogos de cada clube na 1ª divisão do país, calculados uma vez por estado do mundo. */
const posicoes = new WeakMap<object, Map<string, { posicao: number; jogos: number }>>();
export function posicoesNaLiga(c: Pick<Carreira, "competicoes">, mundo: Mundo) {
  const chave = c.competicoes.competicoes;
  let mapa = posicoes.get(chave);
  if (mapa) return mapa;
  mapa = new Map();
  for (const e of Object.values(chave)) {
    const comp = mundo.competicao(e.id);
    if (!comp || comp.tipo !== "liga" || comp.divisao !== 1 || e.encerrada) continue;
    (e.fases[0]?.grupos ?? []).forEach((_, g) => {
      tabelaDoGrupo(comp, e, 0, g).forEach((l, i) =>
        mapa!.set(l.clube, { posicao: i, jogos: l.jogos }),
      );
    });
  }
  posicoes.set(chave, mapa);
  return mapa;
}

/**
 * Caixa inicial de um clube da CPU, em parte da receita anual: a maioria tem folga, alguns estão
 * apertados e uns poucos já começam no vermelho (mais comum nos pequenos).
 */
export function caixaInicialDaCpu(semente: string, mundo: Mundo, clube: string): number {
  const info = mundo.clube(clube);
  const nivel = info?.nivel ?? 50;
  const rng = new Rng(`${semente}:caixa:${clube}`);
  const crise = nivel < 60 ? 0.18 : nivel < 80 ? 0.1 : 0.05;
  const sorte = rng.next();
  const fracao =
    sorte < crise
      ? rng.float(-0.5, -0.1)
      : sorte < crise * 3
        ? rng.float(0, 0.12)
        : rng.float(0.15, 0.5);
  return arredondar(receitaAnual(mundo, clube) * fracao);
}

/** Caixa de um clube da CPU agora. */
export function caixaDaCpu(
  c: Pick<Carreira, "semente" | "caixasCpu">,
  mundo: Mundo,
  clube: string,
): number {
  return c.caixasCpu?.[clube] ?? caixaInicialDaCpu(c.semente, mundo, clube);
}

/**
 * De 0 (cofre cheio) a 1 (precisa vender): pelo caixa em meses de receita. Com 4 meses de folga ou
 * mais, nada; no zero, 0,6; com 2,7 meses no vermelho, 1.
 */
export function precisaDeDinheiro(
  c: Pick<Carreira, "semente" | "caixasCpu">,
  mundo: Mundo,
  clube: string,
): number {
  const mes = receitaAnual(mundo, clube) / 12;
  if (mes <= 0) return 0.5;
  const folga = caixaDaCpu(c, mundo, clube) / mes;
  return Math.round(Math.min(1, Math.max(0, 0.6 - 0.15 * folga)) * 100) / 100;
}

/** O mês da CPU: receita (com ajuste pela posição na liga) menos folha e estrutura. */
export function mesDaCpu(c: Carreira, mundo: Mundo): Record<string, number> {
  const caixas: Record<string, number> = { ...c.caixasCpu };
  const posicoes = posicoesNaLiga(c, mundo);
  for (const x of mundo.clubes ?? []) {
    if (x.filialDe || x.id === c.clube) continue;
    const receita = receitaAnual(mundo, x.id);
    const p = posicoes.get(x.id);
    const desempenho = !p || p.jogos < 5 ? 1 : p.posicao < 3 ? 1.1 : p.posicao >= 14 ? 0.92 : 1;
    let folha = 0;
    for (const j of mundo.elenco(x.id)) folha += salarioBase(j.forca);
    // 78% da receita no mês (a bilheteria e a premiação médias inclusas) menos folha e os 20% de
    // estrutura, viagens e funcionários; no vermelho, o clube corta gastos e a estrutura cai a 8%.
    const atual = caixaDaCpu(c, mundo, x.id);
    const estrutura = atual < 0 ? 0.08 : 0.2;
    const saldo = (receita / 12) * (0.78 * desempenho - estrutura) - folha;
    const novo = atual + saldo;
    caixas[x.id] = arredondar(Math.min(novo, receita * TETO_DO_CAIXA_DA_CPU));
  }
  return caixas;
}

/** Compras e vendas do dia no caixa dos clubes da CPU (o técnico já paga e recebe na hora). */
export function transferenciasNoCaixa(c: Carreira, mundo: Mundo, data: string): Carreira {
  const hoje = (c.transferencias ?? []).filter((t) => t.data === data && t.valor > 0);
  if (!hoje.length) return c;
  const caixas: Record<string, number> = { ...c.caixasCpu };
  const mexer = (clube: string, v: number) => {
    if (clube === c.clube || mundo.clube(clube)?.filialDe) return;
    caixas[clube] = (caixas[clube] ?? caixaInicialDaCpu(c.semente, mundo, clube)) + v;
  };
  for (const t of hoje) {
    if (t.de) mexer(t.de, t.valor);
    if (t.para) mexer(t.para, -t.valor);
  }
  return { ...c, caixasCpu: caixas };
}
