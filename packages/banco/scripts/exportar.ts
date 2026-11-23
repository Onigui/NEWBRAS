/**
 * Exporta o banco mundial para conferência: JSON completo e planilhas CSV de clubes e jogadores.
 * Uso: pnpm --filter @newbras/banco exportar
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { exportarClubesCsv, exportarJogadoresCsv } from "@newbras/data";
import { montarBanco } from "../src/montar";

const saida = join(import.meta.dirname, "..", "saida");
mkdirSync(saida, { recursive: true });

const banco = montarBanco();
writeFileSync(join(saida, "mundo-2026.json"), JSON.stringify(banco));
writeFileSync(join(saida, "clubes.csv"), exportarClubesCsv(banco.clubes, ";"));
writeFileSync(join(saida, "jogadores.csv"), exportarJogadoresCsv(banco.jogadores, ";"));

console.log(
  `Banco ${banco.meta.versao}: ${banco.paises.length} países, ${banco.clubes.length} clubes, ` +
    `${banco.jogadores.length} jogadores, ${banco.competicoes.length} competições. Arquivos em ${saida}`,
);
