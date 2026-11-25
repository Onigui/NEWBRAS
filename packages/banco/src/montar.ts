import { COPAS } from "./mundo/copas";
import { COPAS_REGIONAIS } from "./mundo/regionais";
import { paisesComTemporadaAjustada } from "./mundo/temporadas";
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
import * as arabia from "./paises/arabia";
import * as argentina from "./paises/argentina";
import * as austria from "./paises/austria";
import * as belgica from "./paises/belgica";
import * as catar from "./paises/catar";
import * as chile from "./paises/chile";
import * as colombia from "./paises/colombia";
import * as coreia from "./paises/coreia";
import * as dinamarca from "./paises/dinamarca";
import * as escocia from "./paises/escocia";
import * as espanha from "./paises/espanha";
import * as eua from "./paises/eua";
import * as usl from "./paises/eua-usl";
import * as franca from "./paises/franca";
import * as grecia from "./paises/grecia";
import * as holanda from "./paises/holanda";
import * as inglaterra from "./paises/inglaterra";
import * as italia from "./paises/italia";
import * as japao from "./paises/japao";
import * as mexico from "./paises/mexico";
import { PAISES_NIVEL_3_AMERICAS } from "./paises/nivel3-americas";
import { PAISES_NIVEL_3_UEFA } from "./paises/nivel3-uefa";
import { PAISES_NIVEL_3_AFC } from "./paises/nivel3-afc";
import { PAISES_NIVEL_3_CAF } from "./paises/nivel3-caf";
import { PAISES_NIVEL_3_OCEANIA_CARIBE } from "./paises/nivel3-oceania-caribe";
import * as portugal from "./paises/portugal";
import * as suecia from "./paises/suecia";
import * as suica from "./paises/suica";
import * as turquia from "./paises/turquia";
import * as uruguai from "./paises/uruguai";

import { equilibrarElencos } from "./elencos";
import { iconesNaBase } from "./lendas/icones";
import { DATA_REFERENCIA } from "./referencia";

export { DATA_REFERENCIA };
export const VERSAO_BANCO = "0.26.0";

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
  ...PAISES_NIVEL_3_AMERICAS,
  ...PAISES_NIVEL_3_UEFA,
  ...PAISES_NIVEL_3_AFC,
  ...PAISES_NIVEL_3_CAF,
  ...PAISES_NIVEL_3_OCEANIA_CARIBE,
  BRA: {
    clubes: [...brasil.CLUBES, ...CLUBES_ESTADUAIS],
    competicoes: [...brasil.COMPETICOES, ...COMPETICOES_ESTADUAIS],
    estados: brasil.ESTADOS,
    jogadores: brasil.JOGADORES,
    estrangeiros: ["ARG", "URU", "COL", "PAR", "ECU", "VEN", "CHI", "PER"],
    fracaoEstrangeiros: 0.12,
    fimDeContrato: "12-31",
  },
  ENG: {
    clubes: inglaterra.CLUBES,
    competicoes: inglaterra.COMPETICOES,
    jogadores: inglaterra.JOGADORES,
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
    jogadores: espanha.JOGADORES,
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
    jogadores: italia.JOGADORES,
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
    jogadores: alemanha.JOGADORES,
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
    jogadores: franca.JOGADORES,
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
  POR: {
    clubes: portugal.CLUBES,
    competicoes: portugal.COMPETICOES,
    jogadores: portugal.JOGADORES,
    estrangeiros: ["BRA", "ESP", "ANG", "CPV", "URU", "ARG", "FRA", "GNB", "COL", "SRB"],
    fracaoEstrangeiros: 0.35,
    fimDeContrato: "06-30",
  },
  NED: {
    clubes: holanda.CLUBES,
    competicoes: holanda.COMPETICOES,
    jogadores: holanda.JOGADORES,
    estrangeiros: ["BEL", "GER", "SUR", "DEN", "NOR", "SWE", "MAR", "CUW", "ENG", "JPN"],
    fracaoEstrangeiros: 0.3,
    fimDeContrato: "06-30",
  },
  BEL: {
    clubes: belgica.CLUBES,
    competicoes: belgica.COMPETICOES,
    jogadores: belgica.JOGADORES,
    estrangeiros: ["FRA", "NED", "COD", "MAR", "SEN", "CIV", "NGA", "GHA", "DEN", "JPN"],
    fracaoEstrangeiros: 0.35,
    fimDeContrato: "06-30",
  },
  SCO: {
    clubes: escocia.CLUBES,
    competicoes: escocia.COMPETICOES,
    jogadores: escocia.JOGADORES,
    estrangeiros: ["ENG", "IRL", "NIR", "WAL", "AUS", "NOR", "DEN", "NED", "JPN", "USA"],
    fracaoEstrangeiros: 0.3,
    fimDeContrato: "05-31",
  },
  TUR: {
    clubes: turquia.CLUBES,
    competicoes: turquia.COMPETICOES,
    jogadores: turquia.JOGADORES,
    estrangeiros: ["BRA", "NGA", "SEN", "POR", "FRA", "SRB", "BIH", "CRO", "ALB", "NED"],
    fracaoEstrangeiros: 0.3,
    fimDeContrato: "06-30",
  },
  AUT: {
    clubes: austria.CLUBES,
    competicoes: austria.COMPETICOES,
    jogadores: austria.JOGADORES,
    estrangeiros: ["GER", "CRO", "BIH", "SRB", "SVN", "HUN", "SUI", "GHA", "NGA", "MLI"],
    fracaoEstrangeiros: 0.25,
    fimDeContrato: "05-31",
  },
  SUI: {
    clubes: suica.CLUBES,
    competicoes: suica.COMPETICOES,
    jogadores: suica.JOGADORES,
    estrangeiros: ["FRA", "GER", "ITA", "KVX", "ALB", "POR", "SRB", "AUT", "CIV", "SEN"],
    fracaoEstrangeiros: 0.3,
    fimDeContrato: "06-30",
  },
  GRE: {
    clubes: grecia.CLUBES,
    competicoes: grecia.COMPETICOES,
    jogadores: grecia.JOGADORES,
    estrangeiros: ["POR", "ESP", "SRB", "ARG", "BRA", "CRO", "CYP", "ALB", "FRA", "NOR"],
    fracaoEstrangeiros: 0.35,
    fimDeContrato: "06-30",
  },
  DEN: {
    clubes: dinamarca.CLUBES,
    competicoes: dinamarca.COMPETICOES,
    jogadores: dinamarca.JOGADORES,
    estrangeiros: ["SWE", "NOR", "ISL", "FRO", "GHA", "NGA", "FIN", "GER", "NED", "BRA"],
    fracaoEstrangeiros: 0.25,
    fimDeContrato: "06-30",
  },
  SWE: {
    clubes: suecia.CLUBES,
    competicoes: suecia.COMPETICOES,
    jogadores: suecia.JOGADORES,
    estrangeiros: ["NOR", "DEN", "FIN", "ISL", "GHA", "NGA", "GAM", "USA", "BIH", "KVX"],
    fracaoEstrangeiros: 0.2,
    fimDeContrato: "12-31",
  },
  ARG: {
    clubes: argentina.CLUBES,
    competicoes: argentina.COMPETICOES,
    jogadores: argentina.JOGADORES,
    estrangeiros: ["URU", "PAR", "COL", "CHI", "VEN", "ECU", "BRA", "PER", "BOL"],
    fracaoEstrangeiros: 0.12,
    fimDeContrato: "12-31",
  },
  URU: {
    clubes: uruguai.CLUBES,
    competicoes: uruguai.COMPETICOES,
    estrangeiros: ["ARG", "BRA", "PAR", "COL", "VEN", "CHI"],
    fracaoEstrangeiros: 0.12,
    fimDeContrato: "12-31",
  },
  CHI: {
    clubes: chile.CLUBES,
    competicoes: chile.COMPETICOES,
    jogadores: chile.JOGADORES,
    estrangeiros: ["ARG", "URU", "COL", "PAR", "VEN", "ECU", "PER"],
    fracaoEstrangeiros: 0.18,
    fimDeContrato: "12-31",
  },
  COL: {
    clubes: colombia.CLUBES,
    competicoes: colombia.COMPETICOES,
    jogadores: colombia.JOGADORES,
    estrangeiros: ["ARG", "URU", "VEN", "ECU", "PAR", "PAN", "CHI"],
    fracaoEstrangeiros: 0.1,
    fimDeContrato: "12-31",
  },
  MEX: {
    clubes: mexico.CLUBES,
    competicoes: mexico.COMPETICOES,
    jogadores: mexico.JOGADORES,
    estrangeiros: ["ARG", "URU", "COL", "CHI", "PAR", "ECU", "BRA", "USA", "ESP", "VEN"],
    fracaoEstrangeiros: 0.3,
    fimDeContrato: "06-30",
  },
  JPN: {
    clubes: japao.CLUBES,
    competicoes: japao.COMPETICOES,
    jogadores: japao.JOGADORES,
    estrangeiros: ["BRA", "KOR", "AUS", "THA", "ESP", "NED", "SWE", "SRB", "NGA", "USA"],
    fracaoEstrangeiros: 0.12,
    fimDeContrato: "06-30",
  },
  KOR: {
    clubes: coreia.CLUBES,
    competicoes: coreia.COMPETICOES,
    jogadores: coreia.JOGADORES,
    estrangeiros: ["BRA", "JPN", "AUS", "COL", "MNE", "SRB", "CRO", "NGA"],
    fracaoEstrangeiros: 0.12,
    fimDeContrato: "12-31",
  },
  QAT: {
    clubes: catar.CLUBES,
    competicoes: catar.COMPETICOES,
    jogadores: catar.JOGADORES,
    estrangeiros: ["BRA", "ALG", "MAR", "TUN", "ESP", "POR", "FRA", "SEN", "IRN", "COL"],
    fracaoEstrangeiros: 0.3,
    fimDeContrato: "06-30",
  },
  USA: {
    clubes: [...eua.CLUBES, ...usl.CLUBES],
    competicoes: [...eua.COMPETICOES, ...usl.COMPETICOES],
    jogadores: eua.JOGADORES,
    fimDeContrato: "12-31",
  },
  KSA: {
    clubes: arabia.CLUBES,
    competicoes: arabia.COMPETICOES,
    jogadores: arabia.JOGADORES,
    estrangeiros: [
      "BRA",
      "POR",
      "FRA",
      "MAR",
      "ALG",
      "EGY",
      "SEN",
      "CIV",
      "COL",
      "ARG",
      "ESP",
      "TUN",
      "NGA",
      "CMR",
    ],
    fracaoEstrangeiros: 0.25,
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

  // Copas nacionais e supercopas: os participantes vêm das ligas, a cada temporada.
  competicoes.push(...COPAS, ...COPAS_REGIONAIS);

  // Elencos acima do limite profissional: os jovens que sobram vão para a base e o resto
  // para clubes do mesmo país com vaga.
  const elencos = equilibrarElencos(jogadores, clubes, DATA_REFERENCIA).jogadores;
  // Ícones aposentados recomeçam na base de clubes sorteados.
  elencos.push(...iconesNaBase(clubes, semente));

  return Banco.parse({
    formato: 1,
    meta: {
      id: "newbras/mundo-2026",
      nome: "NewBras: Mundo 2026",
      versao: VERSAO_BANCO,
      descricao:
        "Banco oficial do NewBras. Clubes reais; jogadores reais na Série A, na Premier League, na LaLiga, na Serie A italiana, na Bundesliga, na Ligue 1, nas primeiras divisões de 17 países de nível 2, na MLS e na Saudi Pro League, ícones na base e elencos gerados no resto.",
      atualizadoEm: "2026-11-25",
    },
    paises: paisesComTemporadaAjustada(PAISES, competicoes),
    estados,
    datasFifa: DATAS_FIFA,
    clubes,
    jogadores: elencos,
    competicoes,
    selecoes: SELECOES,
  });
}

/** Países com clubes já cadastrados, para acompanhar o progresso da Fase 3. */
export function paisesComClubes(): string[] {
  return Object.keys(PAISES_NO_BANCO);
}
