/**
 * O mundo da carreira numa data (etapa 12a): o mundo do banco com os jogadores evoluídos, os
 * aposentados fora, os juniores e as lendas renascidas dentro, e as convocações refeitas com eles.
 */
import type { Jogador } from "@newbras/data";
import type { Mundo } from "../carreira/carreira";
import { convocar } from "../selecoes/convocacao";
import { somarDias } from "../carreira/datas";
import { EvolucaoDoMundo } from "./evolucao";

/** Marca do mundo da data: guarda o mundo do banco por trás dele. */
const BASE = Symbol("mundo do banco");
type MundoNaData = Mundo & { [BASE]: Mundo; evolucao: EvolucaoDoMundo; data: string };

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

/** O mundo como está na data da carreira (sem a evolução ligada, o próprio mundo do banco). */
export function mundoNaData(m: Mundo, c: { semente: string; inicio: string }, data: string): Mundo {
  const atual = m as Partial<MundoNaData>;
  if (atual[BASE] && atual.data === data) return m;
  const base = mundoDoBancoDe(m);
  const evolucao = evolucaoDe(base, c);
  if (!evolucao || !evolucao.ativo(data)) return base;
  let marca: string | undefined;
  const convocacao = (pais: string): readonly Jogador[] => {
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
  const view: MundoNaData = {
    ...base,
    [BASE]: base,
    evolucao,
    data,
    jogador: (id) => evolucao.jogador(id, data),
    elenco: (id) => (/^[A-Z]{3}$/.test(id) ? convocacao(id) : evolucao.elenco(id, data)),
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
