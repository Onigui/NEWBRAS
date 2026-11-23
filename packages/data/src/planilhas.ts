/**
 * Importação e exportação de clubes e jogadores em planilha (CSV).
 * É o caminho para atualizar elencos a cada janela sem digitar jogador por jogador no editor.
 */
import { escreverCsv, lerCsvComCabecalho, type Separador } from "./csv";
import {
  CARACTERISTICAS_GOLEIRO,
  CARACTERISTICAS_LINHA,
  NOME_CARACTERISTICA,
  NOME_POSICAO,
  POSICOES,
  type Caracteristica,
} from "./football";
import { Clube, type Clube as ClubeT } from "./schemas/clube";
import { Jogador, type Jogador as JogadorT } from "./schemas/jogador";
import { problemasDoZod, type Problema } from "./validacao";

export const COLUNAS_JOGADORES = [
  "id",
  "nome",
  "nome_completo",
  "nascimento",
  "nacionalidade",
  "segunda_nacionalidade",
  "posicao",
  "lado",
  "forca",
  "potencial",
  "caracteristica_1",
  "caracteristica_2",
  "estrela",
  "clube",
  "contrato_fim",
  "salario",
  "numero",
] as const;

export const COLUNAS_CLUBES = [
  "id",
  "nome",
  "nome_curto",
  "abreviacao",
  "pais",
  "estado",
  "cidade",
  "estadio",
  "capacidade",
  "cor_primaria",
  "cor_secundaria",
  "cor_terciaria",
  "reputacao",
  "nivel",
  "rivais",
  "tecnico",
  "fundacao",
] as const;

/** Tira acentos e caixa para comparar textos digitados à mão. */
function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
}

const POSICAO_POR_TEXTO = new Map<string, (typeof POSICOES)[number]>();
for (const p of POSICOES) {
  POSICAO_POR_TEXTO.set(normalizar(p), p);
  POSICAO_POR_TEXTO.set(normalizar(NOME_POSICAO[p]), p);
}
POSICAO_POR_TEXTO.set("gol", "G");
POSICAO_POR_TEXTO.set("ld", "L");
POSICAO_POR_TEXTO.set("le", "L");
POSICAO_POR_TEXTO.set("volante", "M");
POSICAO_POR_TEXTO.set("meio-campo", "M");

const CARACTERISTICA_POR_TEXTO = new Map<string, Caracteristica>();
for (const c of [...CARACTERISTICAS_GOLEIRO, ...CARACTERISTICAS_LINHA]) {
  CARACTERISTICA_POR_TEXTO.set(normalizar(c), c);
  CARACTERISTICA_POR_TEXTO.set(normalizar(NOME_CARACTERISTICA[c]), c);
}

function numero(valor: string): number | undefined {
  if (valor === "") return undefined;
  const n = Number(valor.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : Number.NaN;
}

function texto(valor: string | undefined): string | undefined {
  return valor ? valor : undefined;
}

function simNao(valor: string): boolean {
  return ["sim", "s", "1", "true", "x", "estrela"].includes(normalizar(valor));
}

/** Converte "BR"/"2026-12-31"/"31/12/2026" para AAAA-MM-DD. */
function data(valor: string): string | undefined {
  if (!valor) return undefined;
  const br = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(valor);
  if (br) return `${br[3]}-${br[2]!.padStart(2, "0")}-${br[1]!.padStart(2, "0")}`;
  return valor;
}

export interface ResultadoPlanilha<T> {
  itens: T[];
  problemas: Problema[];
}

export function importarJogadoresCsv(conteudo: string): ResultadoPlanilha<JogadorT> {
  const { linhas } = lerCsvComCabecalho(conteudo);
  const itens: JogadorT[] = [];
  const problemas: Problema[] = [];

  linhas.forEach((l, i) => {
    const onde = `linha ${i + 2}`;
    const posicao = POSICAO_POR_TEXTO.get(normalizar(l.posicao ?? ""));
    const caracteristicas = [l.caracteristica_1, l.caracteristica_2]
      .filter((c): c is string => !!c)
      .map((c) => CARACTERISTICA_POR_TEXTO.get(normalizar(c)) ?? c);
    const forca = numero(l.forca ?? "");
    const contratoFim = data(l.contrato_fim ?? "");
    const bruto = {
      id: l.id,
      nome: l.nome,
      nomeCompleto: texto(l.nome_completo),
      nascimento: data(l.nascimento ?? ""),
      nacionalidade: l.nacionalidade?.toUpperCase(),
      segundaNacionalidade: texto(l.segunda_nacionalidade?.toUpperCase()),
      posicao: posicao ?? l.posicao,
      lado: (l.lado || (posicao === "L" ? "" : "C")).toUpperCase(),
      forca,
      potencial: numero(l.potencial ?? "") ?? forca,
      caracteristicas,
      estrela: simNao(l.estrela ?? ""),
      clube: texto(l.clube),
      contrato: contratoFim
        ? { fim: contratoFim, salario: numero(l.salario ?? "") ?? 0 }
        : undefined,
      numero: numero(l.numero ?? ""),
    };
    const r = Jogador.safeParse(JSON.parse(JSON.stringify(bruto)));
    if (r.success) itens.push(r.data);
    else
      problemas.push(
        ...problemasDoZod(r.error, bruto).map((p) => ({ ...p, onde: `${onde} > ${p.onde}` })),
      );
  });

  return { itens, problemas };
}

export function exportarJogadoresCsv(
  jogadores: readonly JogadorT[],
  separador: Separador = ",",
): string {
  const linhas = jogadores.map((j) => [
    j.id,
    j.nome,
    j.nomeCompleto ?? "",
    j.nascimento,
    j.nacionalidade,
    j.segundaNacionalidade ?? "",
    j.posicao,
    j.lado,
    String(j.forca),
    String(j.potencial),
    j.caracteristicas[0] ?? "",
    j.caracteristicas[1] ?? "",
    j.estrela ? "sim" : "nao",
    j.clube ?? "",
    j.contrato?.fim ?? "",
    j.contrato ? String(j.contrato.salario) : "",
    j.numero ? String(j.numero) : "",
  ]);
  return escreverCsv([[...COLUNAS_JOGADORES], ...linhas], separador);
}

export function importarClubesCsv(conteudo: string): ResultadoPlanilha<ClubeT> {
  const { linhas } = lerCsvComCabecalho(conteudo);
  const itens: ClubeT[] = [];
  const problemas: Problema[] = [];

  linhas.forEach((l, i) => {
    const bruto = {
      id: l.id,
      nome: l.nome,
      nomeCurto: l.nome_curto || l.nome,
      abreviacao: l.abreviacao?.toUpperCase(),
      pais: l.pais?.toUpperCase(),
      estado: texto(l.estado?.toUpperCase()),
      cidade: l.cidade,
      estadio: { nome: l.estadio, capacidade: numero(l.capacidade ?? "") },
      cores: {
        primaria: l.cor_primaria,
        secundaria: l.cor_secundaria,
        terciaria: texto(l.cor_terciaria),
      },
      reputacao: numero(l.reputacao ?? ""),
      nivel: numero(l.nivel ?? ""),
      rivais: (l.rivais ?? "")
        .split("|")
        .map((r) => r.trim())
        .filter(Boolean),
      tecnico: texto(l.tecnico),
      fundacao: numero(l.fundacao ?? ""),
    };
    const r = Clube.safeParse(JSON.parse(JSON.stringify(bruto)));
    if (r.success) itens.push(r.data);
    else
      problemas.push(
        ...problemasDoZod(r.error, bruto).map((p) => ({
          ...p,
          onde: `linha ${i + 2} > ${p.onde}`,
        })),
      );
  });

  return { itens, problemas };
}

export function exportarClubesCsv(clubes: readonly ClubeT[], separador: Separador = ","): string {
  const linhas = clubes.map((c) => [
    c.id,
    c.nome,
    c.nomeCurto,
    c.abreviacao,
    c.pais,
    c.estado ?? "",
    c.cidade,
    c.estadio.nome,
    String(c.estadio.capacidade),
    c.cores.primaria,
    c.cores.secundaria,
    c.cores.terciaria ?? "",
    String(c.reputacao),
    String(c.nivel),
    c.rivais.join("|"),
    c.tecnico ?? "",
    c.fundacao ? String(c.fundacao) : "",
  ]);
  return escreverCsv([[...COLUNAS_CLUBES], ...linhas], separador);
}
