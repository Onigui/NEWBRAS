import type { CompeticaoEntrada } from "@newbras/data";

type Fase = CompeticaoEntrada["fases"][number];
type Movimento = NonNullable<CompeticaoEntrada["movimentos"]>[number];
type Desempate = NonNullable<CompeticaoEntrada["desempate"]>;

export interface OpcoesLiga {
  pais: string;
  id: string;
  nome: string;
  nomeCurto: string;
  divisao: number;
  /** Ids dos clubes. Em ligas com grupos, na ordem dos grupos (os primeiros N formam o grupo 1). */
  clubes: readonly string[];
  calendario: { inicio: string; fim: string };
  desempate: Desempate;
  /** Grupos regionais da temporada regular (padrão: 1, pontos corridos). */
  grupos?: number;
  /** Faixa que segue para os playoffs (por grupo, quando houver grupos). */
  playoff?: { de: number; ate: number; fases: readonly Fase[] };
  movimentos: readonly Movimento[];
}

/** Liga nacional em pontos corridos (ida e volta), com playoffs opcionais depois da temporada. */
export function liga(o: OpcoesLiga): CompeticaoEntrada {
  const grupos = o.grupos ?? 1;
  return {
    id: o.id,
    nome: o.nome,
    nomeCurto: o.nomeCurto,
    tipo: "liga",
    categoria: "clubes",
    escopo: { tipo: "pais", pais: o.pais },
    divisao: o.divisao,
    calendario: o.calendario,
    participantes: { fixos: [...o.clubes], quantidade: o.clubes.length },
    fases: [
      {
        id: "temporada",
        nome: "Temporada regular",
        tipo: "grupos",
        grupos,
        turnos: 2,
        ...(grupos > 1 ? { divisaoGrupos: "ordem-da-lista" as const } : {}),
        ...(o.playoff ? { faixaClassificada: { de: o.playoff.de, ate: o.playoff.ate } } : {}),
      },
      ...(o.playoff?.fases ?? []),
    ],
    desempate: [...o.desempate],
    movimentos: [...o.movimentos],
  };
}

/** Semifinais e final em ida e volta, com o melhor colocado decidindo em casa. */
export const playoffIdaEVolta = (nome = "Playoffs"): Fase => ({
  id: "playoffs",
  nome,
  tipo: "mata-mata",
  jogos: 2,
  chaveamento: "campanha",
  mando: "melhor-campanha",
});

/** Semifinais em ida e volta e final em jogo único, em campo neutro (modelo inglês). */
export const playoffFinalNeutra = (nome = "Playoffs"): Fase => ({
  id: "playoffs",
  nome,
  tipo: "mata-mata",
  jogos: 2,
  finalJogoUnico: true,
  chaveamento: "campanha",
  mando: "neutro",
});

/** Rodada de jogo único na casa do melhor colocado. */
export const rodadaUnica = (
  id: string,
  nome: string,
  entramAqui: Fase["entramAqui"] = [],
): Fase => ({
  id,
  nome,
  tipo: "mata-mata",
  jogos: 1,
  chaveamento: "campanha",
  mando: "melhor-campanha",
  entramAqui,
});

/** Lista de 1 até n, para descrever faixas de posições. */
export const faixa = (de: number, ate: number) =>
  Array.from({ length: ate - de + 1 }, (_, i) => de + i);
