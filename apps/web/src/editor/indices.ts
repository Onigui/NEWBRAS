/** Índices para o editor achar rápido os elencos, as ligas e os resultados de busca. */
import { elencoValido, type Banco, type Clube, type Competicao, type Jogador } from "@newbras/data";

export interface Indices {
  clubePorId: Map<string, Clube>;
  jogadoresDoClube: Map<string, Jogador[]>;
  clubesDoPais: Map<string, Clube[]>;
  /** Ligas nacionais do país, da 1ª divisão para baixo. */
  ligasDoPais: Map<string, Competicao[]>;
  /** Liga nacional de cada clube. */
  ligaDoClube: Map<string, Competicao>;
  /** Países com clubes, em ordem alfabética do nome. */
  paises: { codigo: string; nome: string; clubes: number }[];
  invalidos: Set<string>;
  numerosOcupados: (clube: string) => Set<number>;
}

const ordemNome = (a: { nome: string }, b: { nome: string }) =>
  a.nome.localeCompare(b.nome, "pt-BR");

export function montarIndices(banco: Banco): Indices {
  const clubePorId = new Map(banco.clubes.map((c) => [c.id, c]));
  const jogadoresDoClube = new Map<string, Jogador[]>();
  for (const j of banco.jogadores) {
    if (!j.clube) continue;
    const lista = jogadoresDoClube.get(j.clube);
    if (lista) lista.push(j);
    else jogadoresDoClube.set(j.clube, [j]);
  }
  const ordemPosicao = { G: 0, L: 1, Z: 2, M: 3, A: 4 } as const;
  for (const lista of jogadoresDoClube.values())
    lista.sort((a, b) => ordemPosicao[a.posicao] - ordemPosicao[b.posicao] || b.forca - a.forca);

  const clubesDoPais = new Map<string, Clube[]>();
  for (const c of banco.clubes) {
    const lista = clubesDoPais.get(c.pais);
    if (lista) lista.push(c);
    else clubesDoPais.set(c.pais, [c]);
  }
  for (const lista of clubesDoPais.values()) lista.sort(ordemNome);

  const ligasDoPais = new Map<string, Competicao[]>();
  const ligaDoClube = new Map<string, Competicao>();
  for (const comp of banco.competicoes) {
    if (comp.tipo !== "liga" || comp.escopo.tipo !== "pais") continue;
    const pais = comp.escopo.pais;
    ligasDoPais.set(pais, [...(ligasDoPais.get(pais) ?? []), comp]);
    for (const f of comp.participantes.fixos) if (!ligaDoClube.has(f)) ligaDoClube.set(f, comp);
  }
  for (const lista of ligasDoPais.values())
    lista.sort((a, b) => (a.divisao ?? 9) - (b.divisao ?? 9));

  const nomePais = new Map(banco.paises.map((p) => [p.codigo, p.nome]));
  const paises = [...clubesDoPais.entries()]
    .map(([codigo, clubes]) => ({
      codigo,
      nome: nomePais.get(codigo) ?? codigo,
      clubes: clubes.length,
    }))
    .sort(ordemNome);

  const invalidos = new Set(
    banco.clubes.filter((c) => !elencoValido(jogadoresDoClube.get(c.id) ?? [])).map((c) => c.id),
  );

  return {
    clubePorId,
    jogadoresDoClube,
    clubesDoPais,
    ligasDoPais,
    ligaDoClube,
    paises,
    invalidos,
    numerosOcupados: (clube) =>
      new Set((jogadoresDoClube.get(clube) ?? []).flatMap((j) => (j.numero ? [j.numero] : []))),
  };
}

/** Tira acentos e caixa para comparar nomes. */
export function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export interface ResultadoBusca {
  clubes: Clube[];
  jogadores: Jogador[];
  /** A busca de jogadores parou no limite. */
  mais: boolean;
}

/** Procura times e jogadores pelo nome em todo o banco. */
export function procurar(banco: Banco, termo: string, limite = 60): ResultadoBusca {
  const t = normalizar(termo);
  if (t.length < 2) return { clubes: [], jogadores: [], mais: false };
  const clubes = banco.clubes
    .filter(
      (c) =>
        normalizar(c.nome).includes(t) ||
        normalizar(c.nomeCurto).includes(t) ||
        c.abreviacao.toLowerCase() === t,
    )
    .sort(ordemNome)
    .slice(0, limite);
  const jogadores: Jogador[] = [];
  let mais = false;
  if (t.length >= 3) {
    for (const j of banco.jogadores) {
      if (
        normalizar(j.nome).includes(t) ||
        (j.nomeCompleto && normalizar(j.nomeCompleto).includes(t))
      ) {
        if (jogadores.length >= limite) {
          mais = true;
          break;
        }
        jogadores.push(j);
      }
    }
  }
  return { clubes, jogadores, mais };
}
