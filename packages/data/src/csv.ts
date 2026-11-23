/**
 * Leitura e escrita de CSV (RFC 4180), aceitando vírgula ou ponto e vírgula,
 * que é o separador padrão do Excel e do Google Planilhas em português.
 */

export type Separador = "," | ";";

/** Descobre o separador olhando a primeira linha fora de aspas. */
export function detectarSeparador(texto: string): Separador {
  let dentroAspas = false;
  let virgulas = 0;
  let pontoVirgulas = 0;
  for (const ch of texto) {
    if (ch === '"') dentroAspas = !dentroAspas;
    else if (!dentroAspas && (ch === "\n" || ch === "\r")) break;
    else if (!dentroAspas && ch === ",") virgulas++;
    else if (!dentroAspas && ch === ";") pontoVirgulas++;
  }
  return pontoVirgulas > virgulas ? ";" : ",";
}

/** Transforma o texto em linhas de células. */
export function lerCsv(texto: string, separador: Separador = detectarSeparador(texto)): string[][] {
  const limpo = texto.replace(/^\uFEFF/, "");
  const linhas: string[][] = [];
  let linha: string[] = [];
  let celula = "";
  let dentroAspas = false;

  for (let i = 0; i < limpo.length; i++) {
    const ch = limpo[i];
    if (dentroAspas) {
      if (ch === '"') {
        if (limpo[i + 1] === '"') {
          celula += '"';
          i++;
        } else {
          dentroAspas = false;
        }
      } else {
        celula += ch;
      }
      continue;
    }
    if (ch === '"') dentroAspas = true;
    else if (ch === separador) {
      linha.push(celula);
      celula = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && limpo[i + 1] === "\n") i++;
      linha.push(celula);
      linhas.push(linha);
      linha = [];
      celula = "";
    } else {
      celula += ch;
    }
  }
  if (celula !== "" || linha.length > 0) {
    linha.push(celula);
    linhas.push(linha);
  }
  return linhas.filter((l) => l.some((c) => c.trim() !== ""));
}

/** Lê um CSV com cabeçalho e devolve um objeto por linha. */
export function lerCsvComCabecalho(texto: string): {
  colunas: string[];
  linhas: Record<string, string>[];
} {
  const [cabecalho, ...resto] = lerCsv(texto);
  if (!cabecalho) return { colunas: [], linhas: [] };
  const colunas = cabecalho.map((c) => c.trim().toLowerCase());
  const linhas = resto.map((cells) => {
    const obj: Record<string, string> = {};
    colunas.forEach((col, i) => {
      obj[col] = (cells[i] ?? "").trim();
    });
    return obj;
  });
  return { colunas, linhas };
}

function escapar(valor: string, separador: Separador): string {
  if (valor.includes('"') || valor.includes(separador) || /[\r\n]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

/** Escreve linhas em CSV. */
export function escreverCsv(
  linhas: readonly (readonly string[])[],
  separador: Separador = ",",
): string {
  return linhas.map((l) => l.map((c) => escapar(c, separador)).join(separador)).join("\n") + "\n";
}
