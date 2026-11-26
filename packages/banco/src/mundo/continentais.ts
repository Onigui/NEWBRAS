/**
 * Copas continentais de clubes (etapa 10a). As vagas saem das ligas e das copas de cada país, pela
 * temporada anterior (na primeira, pela força do elenco). A segunda e a terceira competição de cada
 * confederação excluem quem já está na de cima: a vaga passa para o próximo da tabela.
 *
 * Formatos simplificados do real, sem as fases preliminares: Libertadores e Sul-Americana com 32
 * na fase de grupos; Champions, Europa e Conference League com fase de liga de 36 e playoff do 9º
 * ao 24º; Copa dos Campeões da CONCACAF em mata-mata; Champions League da AFC com fase de liga de
 * 24; CAF com grupos; OFC com dois grupos de 4.
 */
import type { CompeticaoEntrada, Confederacao } from "@newbras/data";

type Fase = CompeticaoEntrada["fases"][number];

/** Vagas de um país: liga principal, quantas vagas e, se o campeão da copa ganha uma, a copa. */
type VagasDoPais = readonly [liga: string, quantas: number, copa?: string];

function vagasDe(paises: readonly VagasDoPais[]): CompeticaoEntrada["participantes"]["vagas"] {
  return paises.flatMap(([liga, n, copa]) => {
    const daLiga = copa ? n - 1 : n;
    return [
      // O campeão da copa primeiro: se ele já tiver vaga pela liga, ela passa ao próximo da tabela.
      ...(copa ? [{ de: copa, criterio: "campeao" as const }] : []),
      ...(daLiga > 0
        ? [
            {
              de: liga,
              criterio: "posicoes" as const,
              posicoes: Array.from({ length: daLiga }, (_, i) => i + 1),
              repassa: true,
            },
          ]
        : []),
    ];
  });
}

const total = (paises: readonly VagasDoPais[]) => paises.reduce((s, [, n]) => s + n, 0);

function continental(o: {
  id: string;
  nome: string;
  nomeCurto: string;
  confederacao: Confederacao;
  calendario: { inicio: string; fim: string };
  paises: readonly VagasDoPais[];
  exclui?: string[];
  fases: Fase[];
}): CompeticaoEntrada {
  return {
    id: o.id,
    nome: o.nome,
    nomeCurto: o.nomeCurto,
    tipo: "continental",
    categoria: "clubes",
    escopo: { tipo: "confederacao", confederacao: o.confederacao },
    calendario: o.calendario,
    participantes: {
      fixos: [],
      vagas: vagasDe(o.paises),
      exclui: o.exclui ?? [],
      quantidade: total(o.paises),
    },
    fases: o.fases,
  };
}

/** Fase de grupos em ida e volta com os dois primeiros de cada grupo seguindo. */
const grupos = (n: number, turnos = 2, classificam = 2): Fase => ({
  id: "grupos",
  nome: "Fase de grupos",
  tipo: "grupos",
  grupos: n,
  turnos,
  classificamPorGrupo: classificam,
});

/** Mata-mata até o campeão: ida e volta, com final em jogo único (neutro) ou também em dois jogos. */
const mataMata = (
  o: {
    finalUnica?: boolean;
    mandoFinal?: "neutro" | "melhor-campanha";
    chaveamento?: "campanha" | "sorteio";
  } = {},
): Fase => ({
  id: "mata-mata",
  nome: "Mata-mata",
  tipo: "mata-mata",
  jogos: 2,
  finalJogoUnico: o.finalUnica ?? true,
  prorrogacao: true,
  penaltis: true,
  chaveamento: o.chaveamento ?? "campanha",
  mando: o.mandoFinal ?? "neutro",
});

/** Fase de liga da UEFA: 36 times, 8 primeiros às oitavas e playoff do 9º ao 24º. */
const faseDeLiga = (jogos: number, n = 36): Fase[] => [
  {
    id: "fase-de-liga",
    nome: "Fase de liga",
    tipo: "fase-de-liga",
    jogosPorTime: jogos,
    potes: 4,
    classificamDireto: n === 36 ? 8 : 16,
    ...(n === 36 ? { playoff: { de: 9, ate: 24 } } : {}),
  },
  ...(n === 36
    ? [
        {
          id: "playoff",
          nome: "Playoff",
          tipo: "mata-mata" as const,
          jogos: 2 as const,
          prorrogacao: true,
          penaltis: true,
          chaveamento: "campanha" as const,
          mando: "melhor-campanha" as const,
        },
      ]
    : []),
  mataMata(),
];

export const CONTINENTAIS: readonly CompeticaoEntrada[] = [
  // ------------------------------------------------------------------ CONMEBOL
  continental({
    id: "conmebol-libertadores",
    nome: "Copa Libertadores da América",
    nomeCurto: "Libertadores",
    confederacao: "CONMEBOL",
    calendario: { inicio: "04-01", fim: "11-28" },
    paises: [
      ["bra-serie-a", 6, "bra-copa-do-brasil"],
      ["arg-liga-profesional", 5, "arg-copa-argentina"],
      ["col-primera-a", 3, "col-copa-colombia"],
      ["chi-primera", 3, "chi-copa-chile"],
      ["uru-primera", 3, "uru-copa-auf"],
      ["ecu-ligapro", 3],
      ["par-primera", 3],
      ["per-liga-1", 2],
      ["bol-division-profesional", 2],
      ["ven-liga-futve", 2],
    ],
    fases: [grupos(8), mataMata()],
  }),
  continental({
    id: "conmebol-sul-americana",
    nome: "Copa Sul-Americana",
    nomeCurto: "Sul-Americana",
    confederacao: "CONMEBOL",
    calendario: { inicio: "04-01", fim: "11-21" },
    exclui: ["conmebol-libertadores"],
    paises: [
      ["bra-serie-a", 6],
      ["arg-liga-profesional", 6],
      ["col-primera-a", 3],
      ["chi-primera", 3],
      ["uru-primera", 3],
      ["ecu-ligapro", 3],
      ["par-primera", 2],
      ["per-liga-1", 2],
      ["bol-division-profesional", 2],
      ["ven-liga-futve", 2],
    ],
    fases: [grupos(8), mataMata()],
  }),
  // ------------------------------------------------------------------ UEFA
  continental({
    id: "uefa-champions-league",
    nome: "UEFA Champions League",
    nomeCurto: "Champions League",
    confederacao: "UEFA",
    calendario: { inicio: "09-15", fim: "05-31" },
    paises: [
      ["eng-premier-league", 5],
      ["esp-laliga", 5],
      ["ita-serie-a", 4],
      ["ger-bundesliga", 4],
      ["fra-ligue-1", 3],
      ["por-liga-portugal", 2],
      ["ned-eredivisie", 2],
      ["bel-pro-league", 1],
      ["tur-super-lig", 1],
      ["sco-premiership", 1],
      ["aut-bundesliga", 1],
      ["sui-super-league", 1],
      ["gre-super-league", 1],
      ["den-superliga", 1],
      ["cze-chance-liga", 1],
      ["nor-eliteserien", 1],
      ["cro-hnl", 1],
      ["srb-superliga", 1],
    ],
    fases: faseDeLiga(8),
  }),
  continental({
    id: "uefa-europa-league",
    nome: "UEFA Europa League",
    nomeCurto: "Europa League",
    confederacao: "UEFA",
    calendario: { inicio: "09-15", fim: "05-24" },
    exclui: ["uefa-champions-league"],
    paises: [
      ["eng-premier-league", 2, "eng-fa-cup"],
      ["esp-laliga", 2, "esp-copa-del-rey"],
      ["ita-serie-a", 2, "ita-coppa-italia"],
      ["ger-bundesliga", 2, "ger-dfb-pokal"],
      ["fra-ligue-1", 2, "fra-coupe-de-france"],
      ["por-liga-portugal", 2, "por-taca-de-portugal"],
      ["ned-eredivisie", 2, "ned-knvb-beker"],
      ["bel-pro-league", 2, "bel-copa"],
      ["tur-super-lig", 2, "tur-copa"],
      ["sco-premiership", 1, "sco-scottish-cup"],
      ["aut-bundesliga", 2, "aut-ofb-cup"],
      ["sui-super-league", 1, "sui-copa"],
      ["gre-super-league", 2, "gre-copa"],
      ["den-superliga", 1, "den-landspokal"],
      ["cze-chance-liga", 2],
      ["nor-eliteserien", 2],
      ["cro-hnl", 1],
      ["srb-superliga", 1],
      ["pol-ekstraklasa", 2],
      ["ukr-premier-league", 1],
      ["isr-ligat-haal", 1],
      ["hun-nb-i", 1],
    ],
    fases: faseDeLiga(8),
  }),
  continental({
    id: "uefa-conference-league",
    nome: "UEFA Conference League",
    nomeCurto: "Conference League",
    confederacao: "UEFA",
    calendario: { inicio: "09-15", fim: "05-28" },
    exclui: ["uefa-champions-league", "uefa-europa-league"],
    paises: [
      ["eng-premier-league", 1],
      ["esp-laliga", 1],
      ["ita-serie-a", 1],
      ["ger-bundesliga", 1],
      ["fra-ligue-1", 1],
      ["por-liga-portugal", 1],
      ["ned-eredivisie", 1],
      ["bel-pro-league", 1],
      ["tur-super-lig", 1],
      ["sco-premiership", 2],
      ["aut-bundesliga", 1],
      ["sui-super-league", 2],
      ["gre-super-league", 1],
      ["den-superliga", 2],
      ["swe-allsvenskan", 2, "swe-svenska-cupen"],
      ["cze-chance-liga", 1],
      ["nor-eliteserien", 1],
      ["cro-hnl", 1],
      ["srb-superliga", 1],
      ["pol-ekstraklasa", 2],
      ["ukr-premier-league", 1],
      ["isr-ligat-haal", 1],
      ["hun-nb-i", 1],
      ["rou-superliga", 1],
      ["cyp-first-division", 1],
      ["bul-efbet-liga", 1],
      ["svk-nike-liga", 1],
      ["svn-prvaliga", 1],
      ["aze-premier-league", 1],
      ["kaz-premier-league", 1],
      ["irl-premier-division", 1],
    ],
    fases: faseDeLiga(6),
  }),
  // ------------------------------------------------------------------ CONCACAF
  continental({
    id: "concacaf-champions-cup",
    nome: "Copa dos Campeões da CONCACAF",
    nomeCurto: "Copa dos Campeões",
    confederacao: "CONCACAF",
    calendario: { inicio: "02-04", fim: "06-01" },
    paises: [
      ["mex-liga-mx", 5],
      ["usa-mls", 5, "usa-open-cup"],
      ["can-cpl", 1],
      ["crc-liga-fpd", 2],
      ["hon-liga-nacional", 1],
      ["gua-liga-nacional", 1],
      ["pan-lpf", 1],
    ],
    fases: [mataMata({ mandoFinal: "melhor-campanha", chaveamento: "sorteio" })],
  }),
  // ------------------------------------------------------------------ AFC
  continental({
    id: "afc-champions-league",
    nome: "AFC Champions League Elite",
    nomeCurto: "Champions da Ásia",
    confederacao: "AFC",
    calendario: { inicio: "09-15", fim: "05-20" },
    paises: [
      ["ksa-pro-league", 4, "ksa-kings-cup"],
      ["jpn-j1", 3, "jpn-emperors-cup"],
      ["kor-k-league-1", 3, "kor-copa"],
      ["qat-stars-league", 3, "qat-emir-cup"],
      ["uae-pro-league", 2],
      ["irn-pro-league", 2],
      ["chn-super-league", 2],
      ["aus-a-league", 1],
      ["tha-thai-league-1", 1],
      ["uzb-super-league", 1],
      ["irq-stars-league", 1],
      ["mas-super-league", 1],
    ],
    fases: faseDeLiga(8, 24),
  }),
  // ------------------------------------------------------------------ CAF
  continental({
    id: "caf-champions-league",
    nome: "CAF Champions League",
    nomeCurto: "Champions da África",
    confederacao: "CAF",
    calendario: { inicio: "10-15", fim: "05-31" },
    paises: [
      ["egy-premier-league", 2],
      ["mar-botola-pro", 2],
      ["rsa-premiership", 2],
      ["tun-ligue-1", 2],
      ["alg-ligue-1", 2],
      ["ang-girabola", 1],
      ["nga-npfl", 1],
      ["tan-premier-league", 1],
      ["sen-ligue-1", 1],
      ["gha-premier-league", 1],
      ["civ-ligue-1", 1],
    ],
    fases: [grupos(4), mataMata({ finalUnica: false })],
  }),
  // ------------------------------------------------------------------ OFC
  continental({
    id: "ofc-champions-league",
    nome: "OFC Champions League",
    nomeCurto: "Champions da Oceania",
    confederacao: "OFC",
    calendario: { inicio: "03-01", fim: "05-31" },
    paises: [
      ["nzl-northern-league", 1],
      ["nzl-central-league", 1],
      ["fij-premier-league", 1],
      ["sol-s-league", 1],
      ["van-national-super-league", 1],
      ["ncl-super-ligue", 1],
      ["tah-ligue-1", 1],
      ["png-national-soccer-league", 1],
    ],
    fases: [
      grupos(2, 1, 2),
      {
        id: "mata-mata",
        nome: "Mata-mata",
        tipo: "mata-mata",
        jogos: 1,
        prorrogacao: true,
        penaltis: true,
        chaveamento: "campanha",
        mando: "neutro",
      },
    ],
  }),
];
