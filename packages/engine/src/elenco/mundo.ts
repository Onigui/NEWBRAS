/**
 * O mundo da carreira numa data (etapa 12a): o mundo do banco com os jogadores evoluídos, os
 * aposentados fora, os juniores e as lendas renascidas dentro, e as convocações refeitas com eles.
 */
import { FORCA_TETO, type Jogador } from "@newbras/data";
import type { Mundo } from "../carreira/carreira";
import { convocar } from "../selecoes/convocacao";
import { somarDias } from "../carreira/datas";
import { EvolucaoDoMundo } from "./evolucao";
import { jogadorDaBaseNaData, type JogadorDaBase } from "./base";
import type { Transferencia } from "../mercado/mercado";

/** Marca do mundo da data: guarda o mundo do banco por trás dele. */
const BASE = Symbol("mundo do banco");
type MundoNaData = Mundo & { [BASE]: Mundo; evolucao?: EvolucaoDoMundo; data: string };

const evolucoes = new WeakMap<Mundo, Map<string, EvolucaoDoMundo>>();
/** Jogadores de cada nacionalidade e as convocações já feitas, numa marca do mundo. */
const convocacoes = new WeakMap<
  EvolucaoDoMundo,
  { marca: string; porNacionalidade: Map<string, Jogador[]>; feitas: Map<string, Jogador[]> }
>();

/** O mundo do banco por trás de um mundo da data (ou ele mesmo). */
export function mundoDoBancoDe(m: Mundo): Mundo {
  return (m as Partial<MundoNaData>)[BASE] ?? m;
}

/** A evolução do mundo de uma carreira (a mesma para a mesma semente e o mesmo começo). */
export function evolucaoDe(
  m: Mundo,
  c: { semente: string; inicio: string },
): EvolucaoDoMundo | undefined {
  const base = mundoDoBancoDe(m);
  if (!base.clubes) return undefined;
  let mapa = evolucoes.get(base);
  if (!mapa) evolucoes.set(base, (mapa = new Map()));
  const chave = `${c.semente}|${c.inicio}`;
  let e = mapa.get(chave);
  if (!e) mapa.set(chave, (e = new EvolucaoDoMundo(base, c.semente, c.inicio)));
  return e;
}

/** O que a carreira diz sobre o próprio elenco: quem saiu e o ajuste dos minutos jogados. */
export interface CarreiraParaMundo {
  semente: string;
  inicio: string;
  clube?: string;
  saidas?: readonly string[];
  jogadores?: Readonly<Record<string, { ajuste?: number }>>;
  /** Quem o técnico subiu da base (entra no elenco, evoluindo desde a promoção). */
  promovidos?: readonly JogadorDaBase[];
  /** Mudanças de clube (compras, vendas, dispensas, livres). */
  transferencias?: readonly Transferencia[];
}

/** O jogador com a força ajustada pelos minutos (os atributos acompanham na mesma proporção). */
function comAjuste(j: Jogador, ajuste: number): Jogador {
  const forca = Math.max(1, Math.min(Math.max(FORCA_TETO, j.potencial), j.forca + ajuste));
  if (forca === j.forca) return j;
  const fator = forca / Math.max(1, j.forca);
  const r: Jogador = { ...j, forca, potencial: Math.max(j.potencial, forca) };
  let atributos: Jogador["atributos"] | undefined;
  Object.defineProperty(r, "atributos", {
    enumerable: true,
    configurable: true,
    get: () =>
      (atributos ??= Object.fromEntries(
        Object.entries(j.atributos ?? {}).map(([a, v]) => [
          a,
          Math.max(1, Math.min(100, Math.round((v as number) * fator))),
        ]),
      ) as Jogador["atributos"]),
  });
  return r;
}

const doClubeCache = new WeakMap<readonly Jogador[], { assinatura: string; lista: Jogador[] }>();
const transferidosCache = new WeakMap<readonly Jogador[], { chave: string; lista: Jogador[] }>();

/**
 * O mundo como está na data da carreira: o elenco evoluído, sem quem saiu do clube do técnico e
 * com o ajuste dos minutos. Sem nada disso para fazer, é o próprio mundo do banco.
 */
export function mundoNaData(m: Mundo, c: CarreiraParaMundo, data: string): Mundo {
  const atual = m as Partial<MundoNaData>;
  if (atual[BASE] && atual.data === data) return m;
  const base = mundoDoBancoDe(m);
  const evolucao = evolucaoDe(base, c);
  const evolui = !!evolucao && evolucao.ativo(data);
  const saidas = new Set(c.saidas ?? []);
  const ajustes = new Map<string, number>();
  for (const [id, e] of Object.entries(c.jogadores ?? {})) if (e.ajuste) ajustes.set(id, e.ajuste);
  const promovidos = c.promovidos ?? [];
  const transferencias = c.transferencias ?? [];
  if (!evolui && !saidas.size && !ajustes.size && !promovidos.length && !transferencias.length)
    return base;
  // Transferências: a última de cada jogador diz onde ele está (sem clube: livre).
  const ultima = new Map<string, Transferencia>();
  for (const t of transferencias) if (t.data <= data) ultima.set(t.jogador, t);
  const entradas = new Map<string, string[]>();
  for (const t of ultima.values())
    if (t.para) {
      const l = entradas.get(t.para);
      if (l) l.push(t.jogador);
      else entradas.set(t.para, [t.jogador]);
    }
  // Os promovidos evoluem pela temporada do clube, como o resto do mundo.
  const dataDoClube = evolucao && c.clube ? evolucao.dataDoClube(c.clube, data) : data;
  const promovidosHoje = new Map(
    promovidos.map((b) => [b.j.id, jogadorDaBaseNaData(b, dataDoClube)] as const),
  );
  // A CPU sobe os garotos da base do banco; no clube do técnico, quem decide é ele.
  const daBase = evolucao?.daBase;
  const assinatura = `${[...saidas].join(",")}|${[...ajustes].join(",")}|${[...promovidosHoje.values()].map((j) => j.id + j.forca).join(",")}`;
  const doClube = (lista: readonly Jogador[]): readonly Jogador[] => {
    if (!saidas.size && !ajustes.size && !promovidos.length && !daBase?.size) return lista;
    const guardado = doClubeCache.get(lista);
    if (guardado?.assinatura === assinatura) return guardado.lista;
    const r = [
      ...lista.filter((j) => !daBase?.has(j.id) && !promovidosHoje.has(j.id)),
      ...promovidosHoje.values(),
    ]
      .filter((j) => !saidas.has(j.id))
      .map((j) => (ajustes.has(j.id) ? comAjuste(j, ajustes.get(j.id)!) : j));
    doClubeCache.set(lista, { assinatura, lista: r });
    return r;
  };
  let marca: string | undefined;
  const convocacao = (pais: string): readonly Jogador[] => {
    if (!evolucao || !evolui) return base.elenco(pais);
    marca ??= evolucao.marca(data);
    let cache = convocacoes.get(evolucao);
    if (!cache || cache.marca !== marca) {
      const porNacionalidade = new Map<string, Jogador[]>();
      for (const clube of base.clubes ?? [])
        for (const j of evolucao.elenco(clube.id, data)) {
          const l = porNacionalidade.get(j.nacionalidade);
          if (l) l.push(j);
          else porNacionalidade.set(j.nacionalidade, [j]);
        }
      cache = { marca, porNacionalidade, feitas: new Map() };
      convocacoes.set(evolucao, cache);
    }
    let lista = cache.feitas.get(pais);
    if (!lista) {
      lista = convocar(pais, cache.porNacionalidade.get(pais) ?? []);
      cache.feitas.set(pais, lista);
    }
    return lista;
  };
  const jogadorBruto = (id: string) =>
    promovidosHoje.get(id) ?? (evolucao && evolui ? evolucao.jogador(id, data) : base.jogador(id));
  const aposentado = (id: string) => !!evolucao && evolui && evolucao.aposentado(id, data);
  const elencoNatural = (id: string) =>
    evolucao && evolui ? evolucao.elenco(id, data) : base.elenco(id);
  const elencoDoClube = (id: string): readonly Jogador[] => {
    const natural = elencoNatural(id);
    const chegaram = entradas.get(id);
    if (!ultima.size || (!chegaram && !natural.some((j) => ultima.has(j.id)))) return natural;
    const chave = `${transferencias.length}|${data}`;
    const guardado = transferidosCache.get(natural);
    if (guardado?.chave === chave) return guardado.lista;
    const lista = [
      ...natural.filter((j) => !ultima.has(j.id)),
      ...(chegaram ?? [])
        .filter((x) => !aposentado(x))
        .map((x) => jogadorBruto(x))
        .filter((j): j is Jogador => !!j)
        .map((j) => (j.clube === id && !j.base ? j : { ...j, clube: id, base: false })),
    ];
    transferidosCache.set(natural, { chave, lista });
    return lista;
  };
  const view: MundoNaData = {
    ...base,
    [BASE]: base,
    ...(evolucao ? { evolucao } : {}),
    data,
    jogador: (id) => {
      let j = jogadorBruto(id);
      const t = ultima.get(id);
      if (j && t && j.clube !== t.para) {
        const { clube: _, ...resto } = j;
        j = t.para ? { ...resto, clube: t.para, base: false } : (resto as Jogador);
      }
      return j && ajustes.has(id) ? comAjuste(j, ajustes.get(id)!) : j;
    },
    elenco: (id) =>
      /^[A-Z]{3}$/.test(id)
        ? convocacao(id)
        : id === c.clube
          ? doClube(elencoDoClube(id))
          : elencoDoClube(id),
  };
  return view;
}

/** Força de cada jogador do clube na temporada anterior (vazio na primeira temporada). */
export function forcasDaTemporadaAnterior(
  m: Mundo,
  c: { semente: string; inicio: string; data: string },
  clube: string,
): Map<string, number> {
  const evolucao = evolucaoDe(m, c);
  if (!evolucao) return new Map();
  const inicio = evolucao.dataDoClube(clube, c.data);
  if (inicio === evolucao.referencia) return new Map();
  return new Map(evolucao.elenco(clube, somarDias(inicio, -1)).map((j) => [j.id, j.forca]));
}
