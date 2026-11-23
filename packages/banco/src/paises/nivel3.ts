import type { CompeticaoEntrada } from "@newbras/data";
import { clubesDe, type ClubeLinha } from "../tipos";
import { liga } from "./liga";

/**
 * Formato compacto para os países de nível 3 (só a primeira divisão): nome de uso, cidade,
 * estádio, capacidade, cores ("#primária #secundária", com " ?" no fim quando a conferir),
 * reputação, nível e rivais. A abreviação sai do nome; estádio vazio vira "Estádio de <cidade>",
 * marcado "a conferir".
 */
export type ClubeSimples = readonly [
  slug: string,
  nome: string,
  cidade: string,
  estadio: string,
  capacidade: number,
  cores: string,
  reputacao: number,
  nivel: number,
  rivais?: readonly string[],
];

const SEM_SIGNIFICADO = new Set([
  "FC",
  "FK",
  "SC",
  "CF",
  "AC",
  "NK",
  "HNK",
  "GNK",
  "KF",
  "KS",
  "CS",
  "SK",
  "PFC",
  "AFC",
  "JK",
  "IF",
  "BK",
  "FCI",
  "CFR",
  "MFK",
  "NŠ",
  "OFK",
  "PFK",
  "TJ",
  "DE",
  "DA",
  "DO",
  "LA",
  "THE",
]);

function semAcento(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[ðÐ]/g, "D")
    .replace(/[þÞ]/g, "TH")
    .replace(/[łŁ]/g, "L")
    .replace(/[øØ]/g, "O")
    .replace(/[ħĦ]/g, "H")
    .replace(/[ıİ]/g, "I")
    .replace(/[æÆ]/g, "AE")
    .replace(/ß/g, "SS");
}

/** Gera abreviações de três letras sem repetir dentro do país. */
export function abreviacoes(nomes: readonly string[]): string[] {
  const usadas = new Set<string>();
  return nomes.map((nome) => {
    const palavras = semAcento(nome)
      .toUpperCase()
      .split(/[^A-Z0-9]+/)
      .filter((p) => p && !SEM_SIGNIFICADO.has(p));
    const todas = palavras.length ? palavras : ["CLUBE"];
    const letras = todas.join("");
    const candidatas: string[] = [];
    if (todas.length >= 3)
      candidatas.push(
        todas
          .slice(0, 3)
          .map((p) => p[0])
          .join(""),
      );
    if (todas.length >= 2) candidatas.push(todas[0]![0]! + todas[1]!.slice(0, 2));
    candidatas.push(letras.slice(0, 3));
    for (let i = 3; i < letras.length; i++) candidatas.push(letras.slice(0, 2) + letras[i]);
    for (let d = 2; d <= 9; d++) candidatas.push(letras.slice(0, 2) + d);
    const escolhida =
      candidatas
        .map((c) => c.padEnd(3, "X"))
        .find((c) => /^[A-Z0-9]{3}$/.test(c) && !usadas.has(c)) ?? "XXX";
    usadas.add(escolhida);
    return escolhida;
  });
}

function nomeCurto(nome: string): string {
  if (nome.length <= 20) return nome;
  const palavras = nome.split(" ");
  let curto = "";
  for (const p of palavras) {
    if ((curto ? `${curto} ${p}` : p).length > 20) break;
    curto = curto ? `${curto} ${p}` : p;
  }
  return curto || nome.slice(0, 20);
}

export function linhasDe(clubes: readonly ClubeSimples[]): ClubeLinha[] {
  const abrevs = abreviacoes(clubes.map((c) => c[1]));
  return clubes.map(
    ([slug, nome, cidade, estadio, capacidade, cores, reputacao, nivel, rivais], i) => {
      const incerto = cores.trim().endsWith("?");
      const [primaria = "#FFFFFF", secundaria = "#000000"] = cores
        .replace("?", "")
        .trim()
        .split(/\s+/);
      const aConferir: ("estadio" | "capacidade" | "cores")[] = [];
      if (!estadio) aConferir.push("estadio", "capacidade");
      if (incerto) aConferir.push("cores");
      return [
        slug,
        nome,
        nomeCurto(nome),
        abrevs[i]!,
        "",
        cidade,
        estadio || `Estádio de ${cidade}`,
        Math.max(500, capacidade || 3_000),
        primaria,
        secundaria,
        reputacao,
        nivel,
        rivais ?? [],
        aConferir,
      ] as const;
    },
  );
}

export interface LigaNivel3 {
  pais: string;
  id: string;
  nome: string;
  nomeCurto: string;
  clubes: readonly ClubeSimples[];
  calendario: { inicio: string; fim: string };
  turnos?: number;
  estrangeiros: readonly string[];
  fracaoEstrangeiros?: number;
}

/** Monta o país: clubes, a liga (sem acesso nem rebaixamento) e os dados de elenco. */
export function paisNivel3(l: LigaNivel3) {
  const prefixo = l.pais.toLowerCase();
  const primavera = l.calendario.inicio < l.calendario.fim;
  const competicao: CompeticaoEntrada = liga({
    pais: l.pais,
    id: l.id,
    nome: l.nome,
    nomeCurto: l.nomeCurto,
    divisao: 1,
    clubes: l.clubes.map((c) => `${prefixo}-${c[0]}`),
    calendario: l.calendario,
    ...(l.turnos ? { turnos: l.turnos } : {}),
    desempate: ["pontos", "saldo", "gols-pro", "confronto-direto", "sorteio"],
    movimentos: [],
  });
  return {
    clubes: clubesDe(l.pais, linhasDe(l.clubes)),
    competicoes: [competicao],
    estrangeiros: l.estrangeiros,
    fracaoEstrangeiros: l.fracaoEstrangeiros ?? 0.15,
    fimDeContrato: primavera ? "12-31" : "06-30",
  };
}
