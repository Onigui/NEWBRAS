import type { ClubeEntrada } from "@newbras/data";

/**
 * Tupla compacta de clube, para os arquivos de cada país ficarem legíveis:
 * [id (sem o prefixo do país), nome, nome curto, abreviação, estado (ou ""), cidade,
 *  estádio, capacidade, cor principal, cor secundária, reputação 1-5, nível 1-100, rivais (ids sem prefixo),
 *  campos a conferir (opcional)]
 */
export type ClubeLinha = readonly [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  string,
  number,
  number,
  readonly string[],
  (readonly ("nome" | "cidade" | "estadio" | "capacidade" | "cores")[])?,
];

/** Converte as tuplas de um país em clubes completos, com id "pais-nome" (ex.: "bra-flamengo"). */
export function clubesDe(pais: string, linhas: readonly ClubeLinha[]): ClubeEntrada[] {
  const prefixo = pais.toLowerCase();
  return linhas.map(
    ([
      id,
      nome,
      nomeCurto,
      abreviacao,
      estado,
      cidade,
      estadio,
      capacidade,
      primaria,
      secundaria,
      reputacao,
      nivel,
      rivais,
      aConferir,
    ]) => ({
      id: `${prefixo}-${id}`,
      nome,
      nomeCurto,
      abreviacao,
      pais,
      ...(estado ? { estado } : {}),
      cidade,
      estadio: { nome: estadio, capacidade },
      cores: { primaria, secundaria },
      reputacao,
      nivel,
      rivais: rivais.map((r) => `${prefixo}-${r}`),
      aConferir: [...(aConferir ?? [])],
    }),
  );
}

/** Marca equipes B e sub-23: { "esp-real-madrid-castilla": "esp-real-madrid" }. */
export function comFiliais(
  clubes: readonly ClubeEntrada[],
  filiais: Readonly<Record<string, string>>,
): ClubeEntrada[] {
  return clubes.map((c) => {
    const principal = filiais[c.id];
    return principal ? { ...c, filialDe: principal } : c;
  });
}
