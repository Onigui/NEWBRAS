/** Acha as chamadas t("...") no código (o primeiro argumento é a chave). */
import ts from "typescript";
import fs from "node:fs";
import path from "node:path";

export const PASTAS = ["apps/web/src", "packages/engine/src"];
/** Funções cujo primeiro argumento é uma chave: t() traduz; chave() e marcar() guardam. */
const FUNCOES = new Set(["t", "chave", "marcar"]);

/** Textos fixos de um argumento (um texto, ou um condicional entre dois textos). */
function literais(a: ts.Expression): string[] | null {
  if (ts.isStringLiteral(a) || ts.isNoSubstitutionTemplateLiteral(a)) return [a.text];
  if (ts.isParenthesizedExpression(a)) return literais(a.expression);
  if (ts.isConditionalExpression(a)) {
    const x = literais(a.whenTrue);
    const y = literais(a.whenFalse);
    return x && y ? [...x, ...y] : null;
  }
  return null;
}

function arquivos(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return arquivos(p);
    return /\.(ts|tsx)$/.test(e.name) && !/\.test\./.test(e.name) ? [p] : [];
  });
}

export interface Ocorrencia {
  chave: string;
  arquivo: string;
  linha: number;
}

/** As chaves em ordem de aparição (raiz = pasta do repositório). */
export function chavesDoCodigo(raiz: string): { chaves: string[]; problemas: string[] } {
  const vistas = new Map<string, Ocorrencia>();
  const problemas: string[] = [];
  for (const pasta of PASTAS)
    for (const arquivo of arquivos(path.join(raiz, pasta))) {
      const src = fs.readFileSync(arquivo, "utf8");
      if (!src.includes("t(")) continue;
      const sf = ts.createSourceFile(arquivo, src, ts.ScriptTarget.Latest, true);
      const visitar = (n: ts.Node) => {
        if (
          ts.isCallExpression(n) &&
          ts.isIdentifier(n.expression) &&
          FUNCOES.has(n.expression.text)
        ) {
          const a = n.arguments[0];
          const linha = sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
          const onde = `${path.relative(raiz, arquivo)}:${linha}`;
          const textos = a ? literais(a) : null;
          if (textos)
            for (const x of textos)
              if (!vistas.has(x))
                vistas.set(x, { chave: x, arquivo: path.relative(raiz, arquivo), linha });
          // t(variavel) traduz uma chave marcada em outro lugar (com chave() ou marcar()).
          if (!textos && n.expression.text !== "t")
            problemas.push(`${onde}: ${n.expression.text}() precisa de um texto fixo`);
        }
        ts.forEachChild(n, visitar);
      };
      visitar(sf);
    }
  return { chaves: [...vistas.keys()], problemas };
}

const ATRIBUTOS_DE_TEXTO = new Set([
  "title",
  "placeholder",
  "aria-label",
  "alt",
  "rotulo",
  "titulo",
]);

/**
 * Textos da interface escritos direto no JSX, fora do t() (o que o teste não deixa entrar): texto
 * entre tags com letras e atributos de texto (title, placeholder, aria-label...) com letras.
 */
export function textosSoltos(raiz: string): string[] {
  const achados: string[] = [];
  for (const arquivo of arquivos(path.join(raiz, "apps/web/src"))) {
    if (!arquivo.endsWith(".tsx")) continue;
    const src = fs.readFileSync(arquivo, "utf8");
    const sf = ts.createSourceFile(arquivo, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const onde = (n: ts.Node) =>
      `${path.relative(raiz, arquivo)}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1}`;
    const visitar = (n: ts.Node) => {
      if (ts.isJsxText(n) && /[A-Za-zÀ-ú]{2,}/.test(n.text.replace(/&[a-z]+;/g, "")))
        achados.push(`${onde(n)}: ${n.text.trim()}`);
      if (
        ts.isJsxAttribute(n) &&
        ATRIBUTOS_DE_TEXTO.has(n.name.getText(sf)) &&
        n.initializer &&
        ts.isStringLiteral(n.initializer) &&
        /[A-Za-zÀ-ú]{2,}/.test(n.initializer.text)
      )
        achados.push(`${onde(n)}: ${n.initializer.text}`);
      ts.forEachChild(n, visitar);
    };
    visitar(sf);
  }
  return achados;
}
