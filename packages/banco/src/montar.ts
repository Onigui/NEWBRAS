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

/** Data de referência do banco: idades e contratos são calculados a partir dela. */
export const DATA_REFERENCIA = "2026-07-01";
export const VERSAO_BANCO = "0.3.0";

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

  for (const [codigo, dados] of Object.entries(PAISES_NO_BANCO)) {
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
          nacionalidade: codigo,
          grupoNomes: grupoDe.get(codigo) ?? "en",
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
