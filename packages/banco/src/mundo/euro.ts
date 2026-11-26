/**
 * Euro 2028 (etapa 11b): as eliminatórias de março de 2027 a março de 2028 e a fase final no Reino
 * Unido e na Irlanda, de 9 de junho a 9 de julho de 2028.
 *
 * Eliminatórias: as 54 seleções em 12 grupos de 4 ou 5, sorteados em potes pela campanha na Nations
 * League de 2026/27 (no jogo, o sorteio acontece quando as eliminatórias começam). Os grupos de 4
 * recebem os primeiros da Nations League e jogam só as seis últimas rodadas; os anfitriões ficam em
 * grupos separados. Vão direto os 12 primeiros e os 8 melhores segundos; duas vagas são dos
 * anfitriões mais bem colocados que ainda não se classificaram; as duas últimas saem dos playoffs de
 * março de 2028 (8 seleções em dois caminhos, semifinal e final em jogo único), com os segundos que
 * sobraram e os campeões de grupo da Nations League ainda sem vaga.
 *
 * Aproximações: com menos de dois anfitriões precisando da vaga reservada, ela vai para o melhor
 * segundo colocado que sobrou (no real, os playoffs mudam de tamanho); os potes da fase final seguem
 * a ordem dos classificados.
 */
import type { CompeticaoEntrada } from "@newbras/data";

type Fase = CompeticaoEntrada["fases"][number];
type Vaga = NonNullable<CompeticaoEntrada["participantes"]["vagas"]>[number];

const ELIMINATORIAS = "uefa-eliminatorias-euro";
const ANFITRIOES = ["ENG", "IRL", "SCO", "WAL"];
const DESEMPATE_UEFA: CompeticaoEntrada["desempate"] = [
  "pontos",
  "confronto-direto",
  "saldo-confronto-direto",
  "saldo",
  "gols-pro",
  "vitorias",
];

/** Vagas pela fase de liga da Nations League (as posições em cada grupo). */
const daNationsLeague = (liga: string, posicoes: number[], grupos: number, extra = {}): Vaga =>
  ({
    de: `uefa-nations-league-${liga}`,
    criterio: "posicoes",
    fase: "fase-de-liga",
    porGrupo: true,
    posicoes,
    quantidade: posicoes.length * grupos,
    ...extra,
  }) as Vaga;

const mataMata = (
  id: string,
  nome: string,
  janela: [string, string],
  datas: string[],
  o: Partial<Extract<Fase, { tipo: "mata-mata" }>> = {},
): Fase =>
  ({
    id,
    nome,
    tipo: "mata-mata",
    jogos: 1,
    prorrogacao: true,
    penaltis: true,
    chaveamento: "chave-fixa",
    mando: "neutro",
    periodo: { inicio: janela[0], fim: janela[1] },
    datas,
    entramAqui: [],
    ...o,
  }) as Fase;

export const ELIMINATORIAS_EURO: CompeticaoEntrada = {
  id: ELIMINATORIAS,
  nome: "Eliminatórias da Euro",
  nomeCurto: "Eliminatórias Euro",
  tipo: "eliminatorias",
  categoria: "selecoes",
  escopo: { tipo: "confederacao", confederacao: "UEFA" },
  periodicidade: { aCadaAnos: 4, anoBase: 2028 },
  calendario: { inicio: "03-25", fim: "03-31" },
  anos: 2,
  participantes: { fixos: [], quantidade: 54 },
  fases: [
    {
      id: "grupos",
      nome: "Fase de grupos",
      tipo: "grupos",
      grupos: 12,
      turnos: 2,
      classificamPorGrupo: 0,
      divisaoGrupos: "potes",
      menoresNoFim: true,
      menoresPara: 6,
      separar: ANFITRIOES,
      periodo: { inicio: "03-25", fim: "11-17" },
      // Dez rodadas nas datas FIFA de março, junho, setembro, outubro e novembro de 2027.
      datas: [
        "03-26",
        "03-29",
        "06-04",
        "06-07",
        "09-24",
        "09-27",
        "10-01",
        "10-04",
        "11-12",
        "11-15",
      ],
      entramAqui: [
        daNationsLeague("a", [1, 2, 3, 4], 4),
        daNationsLeague("b", [1, 2, 3, 4], 4),
        daNationsLeague("c", [1, 2, 3, 4], 4),
        daNationsLeague("d", [1, 2, 3], 2),
      ],
    } as Fase,
    mataMata("playoffs", "Playoffs", ["03-23", "03-31"], ["03-26", "03-30"], {
      chaveamento: "campanha",
      mando: "melhor-campanha",
      eliminatorias: 2,
      limiteDeEntradas: 8,
      entramAqui: [
        {
          de: ELIMINATORIAS,
          criterio: "posicoes",
          fase: "grupos",
          porGrupo: true,
          posicoes: [2],
          foraDosClassificados: true,
        } as Vaga,
        ...(["a", "b", "c"] as const).map((l) =>
          daNationsLeague(l, [1], 4, { foraDosClassificados: true }),
        ),
        daNationsLeague("d", [1], 2, { foraDosClassificados: true }),
      ],
    }),
  ],
  desempate: DESEMPATE_UEFA,
  classificados: [
    { fase: "grupos", posicoes: [1], porGrupo: true },
    { fase: "grupos", posicoes: [2], porGrupo: true, melhores: 8 },
    { fase: "grupos", posicoes: [2], porGrupo: true, reservados: ANFITRIOES, quantidade: 2 },
    { fase: "playoffs", vencedores: true, porGrupo: false },
  ],
} as CompeticaoEntrada;

export const EURO: CompeticaoEntrada = {
  id: "uefa-euro",
  nome: "Eurocopa",
  nomeCurto: "Euro",
  tipo: "selecoes",
  categoria: "selecoes",
  escopo: { tipo: "confederacao", confederacao: "UEFA" },
  periodicidade: { aCadaAnos: 4, anoBase: 2028 },
  calendario: { inicio: "06-09", fim: "07-09" },
  participantes: { fixos: [], quantidade: 24 },
  campeaoAnterior: { temporada: "2024", campeao: "ESP", vice: "ENG" },
  fases: [
    {
      id: "grupos",
      nome: "Fase de grupos",
      tipo: "grupos",
      grupos: 6,
      turnos: 1,
      classificamPorGrupo: 2,
      melhores: { posicao: 3, quantidade: 4 },
      divisaoGrupos: "potes",
      periodo: { inicio: "06-09", fim: "06-26" },
      datas: ["06-10", "06-15", "06-20"],
      entramAqui: [{ de: ELIMINATORIAS, criterio: "classificados", quantidade: 24 } as Vaga],
    } as Fase,
    mataMata("oitavas", "Oitavas de final", ["06-28", "07-02"], ["06-29"], {
      chaveamento: "potes",
      evitarMesmoGrupo: true,
    }),
    mataMata("quartas", "Quartas de final", ["07-03", "07-04"], ["07-03"]),
    mataMata("semifinal", "Semifinal", ["07-06", "07-07"], ["07-06"]),
    mataMata("final", "Final", ["07-09", "07-09"], ["07-09"]),
  ],
  desempate: DESEMPATE_UEFA,
} as CompeticaoEntrada;

export const COMPETICOES_DA_EURO: readonly CompeticaoEntrada[] = [ELIMINATORIAS_EURO, EURO];
