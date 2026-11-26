/**
 * Copas nacionais e supercopas (etapa 9b). A Copa do Brasil (9d) e as principais da Europa (9e)
 * têm arquivo próprio, no formato real; as daqui seguem o aproximado. Os participantes vêm das ligas do país (os primeiros de
 * cada divisão, pela campanha da temporada anterior ou, na primeira, pela força) e, nas
 * supercopas, dos campeões da liga e da copa. Formato aproximado do real: mata-mata em jogo único
 * na maioria, ida e volta onde a copa faz assim, final em campo neutro onde é tradição.
 */
import type { CompeticaoEntrada } from "@newbras/data";
import { COPA_DO_BRASIL } from "./copaDoBrasil";
import { COPAS_EUROPEIAS } from "./copasEuropeias";

type FaseCopa = CompeticaoEntrada["fases"][number];

interface OpcoesFases {
  /** Quantos times entram (define quantas eliminatórias há). */
  participantes: number;
  /** Eliminatórias em ida e volta, pelo número de times que ainda restam (16 = oitavas). */
  idaEVolta?: readonly number[];
  /** Final em campo neutro (FA Cup, Copa del Rey, DFB-Pokal...). */
  finalNeutra?: boolean;
  /** Todos os jogos em campo neutro (Copa Argentina). */
  tudoNeutro?: boolean;
  /** Prorrogação antes dos pênaltis (sem ela, empate vai direto para os pênaltis). */
  prorrogacao?: boolean;
}

/** Nome da eliminatória pelo número de times que ainda restam. */
function nomeDaEliminatoria(restam: number, ordem: number): string {
  if (restam === 2) return "Final";
  if (restam === 4) return "Semifinal";
  if (restam === 8) return "Quartas de final";
  if (restam === 16) return "Oitavas de final";
  return `${ordem}ª fase`;
}

/** Uma fase de mata-mata por eliminatória, até a final. */
export function fasesDeCopa(o: OpcoesFases): FaseCopa[] {
  const eliminatorias = Math.ceil(Math.log2(o.participantes));
  const fases: FaseCopa[] = [];
  for (let i = 0; i < eliminatorias; i++) {
    const restam = 2 ** (eliminatorias - i);
    const final = restam === 2;
    const dupla = o.idaEVolta?.includes(restam) ?? false;
    fases.push({
      id: nomeDaEliminatoria(restam, i + 1)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-$/, ""),
      nome: nomeDaEliminatoria(restam, i + 1),
      tipo: "mata-mata",
      jogos: dupla ? 2 : 1,
      prorrogacao: o.prorrogacao ?? true,
      penaltis: true,
      chaveamento: i === 0 ? "sorteio" : "chave-fixa",
      mando: o.tudoNeutro || (final && o.finalNeutra && !dupla) ? "neutro" : "sorteio",
    });
  }
  return fases;
}

interface Divisao {
  liga: string;
  /** Quantos times da divisão entram (os primeiros). */
  quantos: number;
}

const ate = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

function copa(o: {
  id: string;
  nome: string;
  nomeCurto: string;
  pais: string;
  calendario: { inicio: string; fim: string };
  divisoes: readonly Divisao[];
  fases: Omit<OpcoesFases, "participantes">;
}): CompeticaoEntrada {
  const participantes = o.divisoes.reduce((s, d) => s + d.quantos, 0);
  return {
    id: o.id,
    nome: o.nome,
    nomeCurto: o.nomeCurto,
    tipo: "copa",
    categoria: "clubes",
    escopo: { tipo: "pais", pais: o.pais },
    calendario: o.calendario,
    participantes: {
      fixos: [],
      vagas: o.divisoes.map((d) => ({
        de: d.liga,
        criterio: "posicoes" as const,
        posicoes: ate(d.quantos),
      })),
      quantidade: participantes,
    },
    fases: fasesDeCopa({ participantes, ...o.fases }),
  };
}

/** Supercopa de jogo único: campeão da liga contra campeão da copa (ou de 4, com os vices). */
function supercopa(o: {
  id: string;
  nome: string;
  nomeCurto: string;
  pais: string;
  calendario: { inicio: string; fim: string };
  liga: string;
  copa: string;
  quatro?: boolean;
  /** O campeão da liga manda o jogo (DFL-Supercup); sem isso, campo neutro. */
  mandoDoCampeao?: boolean;
}): CompeticaoEntrada {
  const vagas = [
    { de: o.liga, criterio: "campeao" as const },
    { de: o.copa, criterio: "campeao" as const },
    ...(o.quatro
      ? [
          { de: o.liga, criterio: "vice" as const },
          { de: o.copa, criterio: "vice" as const },
        ]
      : []),
  ];
  const fases: FaseCopa[] = o.quatro
    ? [
        {
          id: "semifinal",
          nome: "Semifinal",
          tipo: "mata-mata",
          jogos: 1,
          prorrogacao: false,
          penaltis: true,
          chaveamento: "campanha",
          mando: "neutro",
        },
        {
          id: "final",
          nome: "Final",
          tipo: "mata-mata",
          jogos: 1,
          prorrogacao: false,
          penaltis: true,
          chaveamento: "chave-fixa",
          mando: "neutro",
        },
      ]
    : [
        {
          id: "final",
          nome: "Final",
          tipo: "mata-mata",
          jogos: 1,
          prorrogacao: false,
          penaltis: true,
          chaveamento: "campanha",
          mando: o.mandoDoCampeao ? "melhor-campanha" : "neutro",
        },
      ];
  return {
    id: o.id,
    nome: o.nome,
    nomeCurto: o.nomeCurto,
    tipo: "supercopa",
    categoria: "clubes",
    escopo: { tipo: "pais", pais: o.pais },
    calendario: o.calendario,
    participantes: { fixos: [], vagas, quantidade: vagas.length },
    fases,
  };
}

const c = (inicio: string, fim: string) => ({ inicio, fim });

export const COPAS: readonly CompeticaoEntrada[] = [
  // ---------------------------------------------------------------- nível 1
  COPA_DO_BRASIL,
  ...COPAS_EUROPEIAS,
  supercopa({
    id: "bra-supercopa",
    nome: "Supercopa do Brasil",
    nomeCurto: "Supercopa",
    pais: "BRA",
    calendario: c("02-01", "02-08"),
    liga: "bra-serie-a",
    copa: "bra-copa-do-brasil",
  }),
  supercopa({
    id: "eng-community-shield",
    nome: "Community Shield",
    nomeCurto: "Community Shield",
    pais: "ENG",
    calendario: c("08-09", "08-14"),
    liga: "eng-premier-league",
    copa: "eng-fa-cup",
  }),
  supercopa({
    id: "esp-supercopa",
    nome: "Supercopa de España",
    nomeCurto: "Supercopa",
    pais: "ESP",
    calendario: c("01-07", "01-12"),
    liga: "esp-laliga",
    copa: "esp-copa-del-rey",
    quatro: true,
  }),
  supercopa({
    id: "ita-supercoppa",
    nome: "Supercoppa Italiana",
    nomeCurto: "Supercoppa",
    pais: "ITA",
    calendario: c("12-18", "12-23"),
    liga: "ita-serie-a",
    copa: "ita-coppa-italia",
    quatro: true,
  }),
  supercopa({
    id: "ger-supercup",
    nome: "DFL-Supercup",
    nomeCurto: "Supercup",
    pais: "GER",
    calendario: c("08-08", "08-12"),
    liga: "ger-bundesliga",
    copa: "ger-dfb-pokal",
    mandoDoCampeao: true,
  }),
  supercopa({
    id: "fra-trophee-des-champions",
    nome: "Trophée des Champions",
    nomeCurto: "Trophée",
    pais: "FRA",
    calendario: c("08-02", "08-07"),
    liga: "fra-ligue-1",
    copa: "fra-coupe-de-france",
  }),
  // ---------------------------------------------------------------- nível 2
  supercopa({
    id: "por-supertaca",
    nome: "Supertaça Cândido de Oliveira",
    nomeCurto: "Supertaça",
    pais: "POR",
    calendario: c("08-02", "08-07"),
    liga: "por-liga-portugal",
    copa: "por-taca-de-portugal",
  }),
  ...(
    [
      [
        "bel-copa",
        "Copa da Bélgica",
        "BEL",
        "08-25",
        "05-01",
        "bel-pro-league",
        18,
        "bel-challenger-pro-league",
        14,
      ],
      [
        "sco-scottish-cup",
        "Scottish Cup",
        "SCO",
        "01-17",
        "05-30",
        "sco-premiership",
        12,
        "sco-championship",
        4,
      ],
      [
        "tur-copa",
        "Copa da Turquia",
        "TUR",
        "10-01",
        "05-14",
        "tur-super-lig",
        18,
        "tur-1-lig",
        14,
      ],
      ["aut-ofb-cup", "ÖFB-Cup", "AUT", "08-08", "05-01", "aut-bundesliga", 12, "aut-2-liga", 4],
      [
        "sui-copa",
        "Copa da Suíça",
        "SUI",
        "08-15",
        "05-18",
        "sui-super-league",
        12,
        "sui-challenge-league",
        4,
      ],
      [
        "gre-copa",
        "Copa da Grécia",
        "GRE",
        "10-01",
        "05-15",
        "gre-super-league",
        14,
        "gre-super-league-2",
        2,
      ],
      [
        "den-landspokal",
        "Landspokal",
        "DEN",
        "08-30",
        "05-21",
        "den-superliga",
        12,
        "den-1-division",
        4,
      ],
      [
        "swe-svenska-cupen",
        "Svenska Cupen",
        "SWE",
        "03-01",
        "05-31",
        "swe-allsvenskan",
        16,
        "swe-superettan",
        0,
      ],
      [
        "arg-copa-argentina",
        "Copa Argentina",
        "ARG",
        "02-20",
        "11-15",
        "arg-liga-profesional",
        30,
        "arg-primera-nacional",
        2,
      ],
      [
        "chi-copa-chile",
        "Copa Chile",
        "CHI",
        "02-20",
        "11-20",
        "chi-primera",
        16,
        "chi-ascenso",
        16,
      ],
      [
        "col-copa-colombia",
        "Copa Colombia",
        "COL",
        "02-15",
        "11-25",
        "col-primera-a",
        20,
        "col-primera-b",
        12,
      ],
      [
        "uru-copa-auf",
        "Copa AUF Uruguay",
        "URU",
        "04-01",
        "11-15",
        "uru-primera",
        16,
        "uru-segunda",
        0,
      ],
      [
        "usa-open-cup",
        "US Open Cup",
        "USA",
        "03-20",
        "10-01",
        "usa-mls",
        16,
        "usa-usl-championship",
        16,
      ],
      [
        "jpn-emperors-cup",
        "Copa do Imperador",
        "JPN",
        "09-01",
        "05-20",
        "jpn-j1",
        20,
        "jpn-j2",
        12,
      ],
      [
        "kor-copa",
        "Copa da Coreia",
        "KOR",
        "03-26",
        "11-30",
        "kor-k-league-1",
        12,
        "kor-k-league-2",
        4,
      ],
      [
        "ksa-kings-cup",
        "Copa do Rei (Arábia)",
        "KSA",
        "09-20",
        "05-20",
        "ksa-pro-league",
        18,
        "ksa-first-division",
        14,
      ],
      [
        "qat-emir-cup",
        "Copa do Emir",
        "QAT",
        "10-01",
        "05-10",
        "qat-stars-league",
        12,
        "qat-qsl-2",
        4,
      ],
      [
        "mex-copa",
        "Copa México",
        "MEX",
        "08-01",
        "04-30",
        "mex-liga-mx",
        18,
        "mex-liga-expansion",
        14,
      ],
    ] as const
  ).map(([id, nome, pais, inicio, fim, l1, q1, l2, q2]) =>
    copa({
      id,
      nome,
      nomeCurto: nome,
      pais,
      calendario: c(inicio, fim),
      divisoes: [{ liga: l1, quantos: q1 }, ...(q2 ? [{ liga: l2, quantos: q2 }] : [])],
      fases: { finalNeutra: true, tudoNeutro: pais === "ARG" },
    }),
  ),
];
