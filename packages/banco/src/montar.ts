import {
  Banco,
  type Banco as BancoT,
  type ClubeEntrada,
  type CompeticaoEntrada,
  type JogadorEntrada,
} from "@newbras/data";
import { Rng, gerarElenco } from "@newbras/engine";
import { PAISES } from "./mundo/paises";
import { DATAS_FIFA, SELECOES } from "./mundo/selecoes";
import * as brasil from "./paises/brasil";
import { CLUBES_ESTADUAIS, COMPETICOES_ESTADUAIS } from "./paises/brasil-estaduais";
import * as alemanha from "./paises/alemanha";
import * as espanha from "./paises/espanha";
import * as franca from "./paises/franca";
import * as inglaterra from "./paises/inglaterra";
import * as italia from "./paises/italia";

/** Data de referência do banco: idades e contratos são calculados a partir dela. */
export const DATA_REFERENCIA = "2026-07-01";
export const VERSAO_BANCO = "0.4.0";

interface PaisNoBanco {
  clubes: readonly ClubeEntrada[];
  competicoes: readonly CompeticaoEntrada[];
  /** Jogadores reais; clubes sem jogadores reais recebem elencos gerados. */
  jogadores?: readonly JogadorEntrada[];
  estados?: readonly BancoT["estados"][number][];
  /** Nacionalidades mais comuns entre os estrangeiros desse país. */
  estrangeiros?: readonly string[];
  fracaoEstrangeiros?: number;
  fimDeContrato?: string;
}

const PAISES_NO_BANCO: Readonly<Record<string, PaisNoBanco>> = {
  BRA: {
    clubes: [...brasil.CLUBES, ...CLUBES_ESTADUAIS],
    competicoes: [...brasil.COMPETICOES, ...COMPETICOES_ESTADUAIS],
    estados: brasil.ESTADOS,
    estrangeiros: ["ARG", "URU", "COL", "PAR", "ECU", "VEN", "CHI", "PER"],
    fracaoEstrangeiros: 0.12,
    fimDeContrato: "12-31",
  },
  ENG: {
    clubes: inglaterra.CLUBES,
    competicoes: inglaterra.COMPETICOES,
    estrangeiros: [
      "FRA",
      "ESP",
      "POR",
      "BRA",
      "NED",
      "BEL",
      "GER",
      "IRL",
      "SCO",
      "NOR",
      "DEN",
      "ARG",
      "NGA",
      "SEN",
      "CIV",
      "GHA",
      "JAM",
      "USA",
    ],
    fracaoEstrangeiros: 0.35,
    fimDeContrato: "06-30",
  },
  ESP: {
    clubes: espanha.CLUBES,
    competicoes: espanha.COMPETICOES,
    estrangeiros: [
      "FRA",
      "POR",
      "ARG",
      "URU",
      "BRA",
      "COL",
      "MAR",
      "SEN",
      "NED",
      "BEL",
      "ITA",
      "GER",
      "CRO",
      "SRB",
      "VEN",
      "MEX",
    ],
    fracaoEstrangeiros: 0.22,
    fimDeContrato: "06-30",
  },
  ITA: {
    clubes: italia.CLUBES,
    competicoes: italia.COMPETICOES,
    estrangeiros: [
      "FRA",
      "ARG",
      "BRA",
      "ESP",
      "NED",
      "BEL",
      "SRB",
      "CRO",
      "POR",
      "DEN",
      "NGA",
      "SEN",
      "URU",
      "ALB",
      "POL",
      "SUI",
    ],
    fracaoEstrangeiros: 0.3,
    fimDeContrato: "06-30",
  },
  GER: {
    clubes: alemanha.CLUBES,
    competicoes: alemanha.COMPETICOES,
    estrangeiros: [
      "AUT",
      "SUI",
      "NED",
      "DEN",
      "FRA",
      "POL",
      "CRO",
      "TUR",
      "JPN",
      "KOR",
      "USA",
      "BEL",
      "CZE",
      "SWE",
      "GHA",
      "BRA",
    ],
    fracaoEstrangeiros: 0.3,
    fimDeContrato: "06-30",
  },
  FRA: {
    clubes: franca.CLUBES,
    competicoes: franca.COMPETICOES,
    estrangeiros: [
      "SEN",
      "CIV",
      "MLI",
      "CMR",
      "ALG",
      "MAR",
      "TUN",
      "BEL",
      "POR",
      "BRA",
      "NED",
      "DEN",
      "GHA",
      "COD",
      "GUI",
      "USA",
    ],
    fracaoEstrangeiros: 0.3,
    fimDeContrato: "06-30",
  },
};

export interface OpcoesBanco {
  /** Semente dos jogadores gerados. A mesma semente sempre gera o mesmo banco. */
  semente?: string;
}

/** Monta o banco mundial completo e valida pelo esquema. */
export function montarBanco(opcoes: OpcoesBanco = {}): BancoT {
  const semente = opcoes.semente ?? "newbras-mundo-2026";
  const grupoDe = new Map(PAISES.map((p) => [p.codigo, p.grupoNomes]));

  const clubes: ClubeEntrada[] = [];
  const jogadores: JogadorEntrada[] = [];
  const competicoes: CompeticaoEntrada[] = [];
  const estados: BancoT["estados"] = [];

  for (const dados of Object.values(PAISES_NO_BANCO)) {
    clubes.push(...dados.clubes);
    competicoes.push(...dados.competicoes);
    estados.push(...(dados.estados ?? []));
    const reais = dados.jogadores ?? [];
    jogadores.push(...reais);
    const comReais = new Set(reais.flatMap((j) => (j.clube ? [j.clube] : [])));

    for (const clube of dados.clubes) {
      if (comReais.has(clube.id)) continue;
      // Cada clube tem seu próprio fluxo: mudar um clube não muda os elencos dos outros.
      const rng = new Rng(`${semente}:${clube.id}`);
      jogadores.push(
        ...gerarElenco(rng, clube, {
          // A nacionalidade segue o país do clube (ex.: galeses no sistema inglês).
          nacionalidade: clube.pais,
          grupoNomes: grupoDe.get(clube.pais) ?? "en",
          hoje: DATA_REFERENCIA,
          estrangeiros: (dados.estrangeiros ?? []).map((n) => ({
            nacionalidade: n,
            grupoNomes: grupoDe.get(n) ?? "en",
          })),
          fracaoEstrangeiros: dados.fracaoEstrangeiros ?? 0.1,
          ...(dados.fimDeContrato ? { fimDeContrato: dados.fimDeContrato } : {}),
        }),
      );
    }
  }

  return Banco.parse({
    formato: 1,
    meta: {
      id: "newbras/mundo-2026",
      nome: "NewBras: Mundo 2026",
      versao: VERSAO_BANCO,
      descricao:
        "Banco oficial do NewBras. Clubes reais; elencos gerados onde ainda não há jogadores reais.",
      atualizadoEm: "2026-11-23",
    },
    paises: PAISES,
    estados,
    datasFifa: DATAS_FIFA,
    clubes,
    jogadores,
    competicoes,
    selecoes: SELECOES,
  });
}

/** Países com clubes já cadastrados, para acompanhar o progresso da Fase 3. */
export function paisesComClubes(): string[] {
  return Object.keys(PAISES_NO_BANCO);
}
