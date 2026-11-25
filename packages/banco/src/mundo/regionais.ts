/**
 * Copas regionais do Brasil (etapa 9c): Copa do Nordeste e Copa Verde. As vagas saem dos
 * estaduais de cada estado, pela classificação da temporada anterior (na primeira, pela força).
 * O formato segue o real de forma simplificada: no Nordeste, dois grupos de 8 em turno único e
 * mata-mata dos 4 melhores de cada; na Copa Verde, 16 times em mata-mata.
 */
import type { CompeticaoEntrada } from "@newbras/data";
import { fasesDeCopa } from "./copas";

type FaseRegional = CompeticaoEntrada["fases"][number];

/** Vagas por estado: [sigla, quantos]. */
type Vagas = readonly (readonly [string, number])[];

const vagasDosEstaduais = (vagas: Vagas) =>
  vagas.map(([uf, n]) => ({
    de: `bra-estadual-${uf.toLowerCase()}`,
    criterio: "posicoes" as const,
    posicoes: Array.from({ length: n }, (_, i) => i + 1),
    // Se um clube do estado já entrou por outra vaga, a vaga passa para o próximo do estadual.
    repassa: true,
  }));

const total = (vagas: Vagas) => vagas.reduce((s, [, n]) => s + n, 0);

const NORDESTE: Vagas = [
  ["BA", 3],
  ["CE", 3],
  ["PE", 3],
  ["AL", 2],
  ["RN", 1],
  ["PB", 1],
  ["SE", 1],
  ["MA", 1],
  ["PI", 1],
];

const VERDE: Vagas = [
  ["PA", 2],
  ["AM", 2],
  ["GO", 2],
  ["MT", 2],
  ["DF", 1],
  ["MS", 1],
  ["ES", 1],
  ["TO", 1],
  ["AC", 1],
  ["AP", 1],
  ["RO", 1],
  ["RR", 1],
];

const mataMata = (
  id: string,
  nome: string,
  jogos: 1 | 2,
  chaveamento: "campanha" | "chave-fixa",
): FaseRegional => ({
  id,
  nome,
  tipo: "mata-mata",
  jogos,
  prorrogacao: false,
  penaltis: true,
  chaveamento,
  mando: "melhor-campanha",
});

export const COPAS_REGIONAIS: readonly CompeticaoEntrada[] = [
  {
    id: "bra-copa-do-nordeste",
    nome: "Copa do Nordeste",
    nomeCurto: "Copa do Nordeste",
    tipo: "regional",
    categoria: "clubes",
    escopo: { tipo: "pais", pais: "BRA" },
    calendario: { inicio: "01-21", fim: "06-14" },
    participantes: { fixos: [], vagas: vagasDosEstaduais(NORDESTE), quantidade: total(NORDESTE) },
    fases: [
      {
        id: "grupos",
        nome: "Fase de grupos",
        tipo: "grupos",
        grupos: 2,
        turnos: 1,
        classificamPorGrupo: 4,
      },
      mataMata("quartas-de-final", "Quartas de final", 1, "campanha"),
      mataMata("semifinal", "Semifinal", 1, "chave-fixa"),
      mataMata("final", "Final", 2, "chave-fixa"),
    ],
  },
  {
    id: "bra-copa-verde",
    nome: "Copa Verde",
    nomeCurto: "Copa Verde",
    tipo: "regional",
    categoria: "clubes",
    escopo: { tipo: "pais", pais: "BRA" },
    calendario: { inicio: "01-21", fim: "05-10" },
    participantes: { fixos: [], vagas: vagasDosEstaduais(VERDE), quantidade: total(VERDE) },
    fases: fasesDeCopa({ participantes: total(VERDE), idaEVolta: [4, 2], prorrogacao: false }),
  },
];
