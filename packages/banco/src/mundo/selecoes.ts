import type { DataFifa, Selecao } from "@newbras/data";
import { PAISES } from "./paises";

/**
 * Reputação das seleções (1 a 5), com base no desempenho recente e no histórico.
 * Ajuste fino na Fase 11 (seleções), junto com o ranking.
 */
const REPUTACAO_5 = ["ARG", "FRA", "ESP", "ENG", "BRA", "POR", "NED", "BEL", "GER", "ITA", "CRO"];
const REPUTACAO_4 = [
  "URU",
  "COL",
  "MAR",
  "USA",
  "MEX",
  "SUI",
  "JPN",
  "SEN",
  "DEN",
  "AUT",
  "TUR",
  "UKR",
  "SWE",
  "POL",
  "SRB",
  "NOR",
  "KOR",
  "IRN",
  "AUS",
  "ECU",
  "WAL",
  "SCO",
  "HUN",
  "CZE",
  "CAN",
  "EGY",
  "NGA",
  "CIV",
  "ALG",
  "TUN",
];
const REPUTACAO_3 = [
  "PAR",
  "CHI",
  "PER",
  "VEN",
  "BOL",
  "GRE",
  "ROU",
  "SVK",
  "SVN",
  "IRL",
  "NIR",
  "ISL",
  "FIN",
  "GEO",
  "ALB",
  "BIH",
  "MNE",
  "MKD",
  "ISR",
  "RUS",
  "KSA",
  "QAT",
  "UAE",
  "IRQ",
  "UZB",
  "JOR",
  "CMR",
  "GHA",
  "MLI",
  "RSA",
  "COD",
  "BFA",
  "CPV",
  "PAN",
  "CRC",
  "JAM",
  "HON",
  "NZL",
  "KVX",
  "LUX",
  "CYP",
  "BUL",
  "BLR",
  "KAZ",
  "ARM",
  "AZE",
  "EST",
  "LVA",
  "LTU",
  "GAB",
  "GUI",
  "ANG",
  "ZAM",
  "EQG",
  "OMA",
  "BHR",
  "CHN",
  "SYR",
  "SLV",
  "GUA",
  "HAI",
  "TRI",
  "CUW",
  "SUR",
];

function reputacaoDe(codigo: string, nivelPais: number): Selecao["reputacao"] {
  if (REPUTACAO_5.includes(codigo)) return 5;
  if (REPUTACAO_4.includes(codigo)) return 4;
  if (REPUTACAO_3.includes(codigo)) return 3;
  return nivelPais > 0 ? 2 : 1;
}

export const SELECOES: readonly Selecao[] = PAISES.map((p) => ({
  pais: p.codigo,
  reputacao: reputacaoDe(p.codigo, p.nivel),
}));

/** Datas FIFA de 2026, conforme o calendário divulgado pela CBF (com a pausa da Copa do Mundo). */
export const DATAS_FIFA: readonly DataFifa[] = [
  { nome: "Data FIFA de março", periodo: { inicio: "03-23", fim: "03-31" } },
  { nome: "Copa do Mundo e Data FIFA de junho", periodo: { inicio: "06-01", fim: "07-20" } },
  { nome: "Data FIFA de setembro e outubro", periodo: { inicio: "09-21", fim: "10-06" } },
  { nome: "Data FIFA de novembro", periodo: { inicio: "11-09", fim: "11-17" } },
];
