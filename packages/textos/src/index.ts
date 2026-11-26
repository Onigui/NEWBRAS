/**
 * Textos da interface. A chave de cada texto é ele mesmo, em português do Brasil (a língua de
 * referência): `t("Avançar um dia")`. As traduções ficam em `catalogos/<idioma>.json`, com as
 * mesmas chaves; texto sem tradução aparece em português. Partes variáveis vão entre chaves:
 * `t("Ir até o próximo jogo ({dias} dias)", { dias })`.
 *
 * `pnpm --filter @newbras/textos extrair` atualiza os catálogos com os textos que estão no código.
 */
import en from "./catalogos/en.json";
import es from "./catalogos/es.json";
import fr from "./catalogos/fr.json";
import de from "./catalogos/de.json";
import it from "./catalogos/it.json";
import nl from "./catalogos/nl.json";
import pl from "./catalogos/pl.json";
import tr from "./catalogos/tr.json";
import ru from "./catalogos/ru.json";
import ar from "./catalogos/ar.json";
import zhCN from "./catalogos/zh-CN.json";
import ja from "./catalogos/ja.json";
import ko from "./catalogos/ko.json";
import id from "./catalogos/id.json";

/**
 * Idiomas do lançamento (docs/DECISOES.md): os mercados que mais jogam futebol no PC. O árabe
 * ainda precisa da interface da direita para a esquerda (Fase 16).
 */
export const IDIOMAS = [
  { codigo: "pt-BR", nome: "Português (Brasil)" },
  { codigo: "en", nome: "English" },
  { codigo: "es", nome: "Español" },
  { codigo: "fr", nome: "Français" },
  { codigo: "de", nome: "Deutsch" },
  { codigo: "it", nome: "Italiano" },
  { codigo: "nl", nome: "Nederlands" },
  { codigo: "pl", nome: "Polski" },
  { codigo: "tr", nome: "Türkçe" },
  { codigo: "ru", nome: "Русский" },
  { codigo: "ar", nome: "العربية" },
  { codigo: "zh-CN", nome: "简体中文" },
  { codigo: "ja", nome: "日本語" },
  { codigo: "ko", nome: "한국어" },
  { codigo: "id", nome: "Bahasa Indonesia" },
] as const;
export type Idioma = (typeof IDIOMAS)[number]["codigo"];

export type Catalogo = Readonly<Record<string, string>>;
const CATALOGOS: Record<Idioma, Catalogo> = {
  "pt-BR": {},
  en,
  es,
  fr,
  de,
  it,
  nl,
  pl,
  tr,
  ru,
  ar,
  "zh-CN": zhCN,
  ja,
  ko,
  id,
};
const CHAVE_GUARDADA = "newbras:idioma";

/** O armazenamento do navegador, quando existe (no Web Worker e no Node não existe). */
interface Armazenamento {
  getItem(chave: string): string | null;
  setItem(chave: string, valor: string): void;
}
const armazenamento = (): Armazenamento | undefined =>
  (globalThis as { localStorage?: Armazenamento }).localStorage;

function idiomaValido(x: unknown): x is Idioma {
  return IDIOMAS.some((i) => i.codigo === x);
}

/** Idioma escolhido nas opções (guardado no navegador); português se não houver. */
function idiomaGuardado(): Idioma {
  try {
    const x = armazenamento()?.getItem(CHAVE_GUARDADA);
    return idiomaValido(x) ? x : "pt-BR";
  } catch {
    return "pt-BR";
  }
}

let atual: Idioma = idiomaGuardado();

export function idiomaAtual(): Idioma {
  return atual;
}

/** Locale para datas e números (Intl). */
export function locale(): string {
  return atual;
}

/**
 * Troca o idioma e guarda a escolha. A interface recarrega depois disso (os textos das listas
 * fixas, como os nomes das abas, são montados quando o módulo carrega).
 */
export function definirIdioma(idioma: Idioma): void {
  atual = idioma;
  try {
    armazenamento()?.setItem(CHAVE_GUARDADA, idioma);
  } catch {
    // Sem armazenamento (Web Worker, navegação privada): vale só nesta sessão.
  }
}

export type Parametros = Readonly<Record<string, string | number | undefined | null>>;

/** Troca {nome} pelos parâmetros. */
export function preencher(texto: string, params?: Parametros): string {
  if (!params) return texto;
  return texto.replace(/\{(\w+)\}/g, (inteiro, nome: string) =>
    nome in params ? String(params[nome] ?? "") : inteiro,
  );
}

/**
 * Marca um texto fixo como chave de tradução e devolve ele mesmo (em português): para textos que
 * o motor guarda e a interface traduz depois com t().
 */
export function chave(texto: string): string {
  return texto;
}

/** Texto guardado (notícias de um salvamento): a chave e os parâmetros, traduzidos ao mostrar. */
export interface TextoMarcado {
  texto: string;
  params?: Readonly<Record<string, string | number>>;
}

/**
 * Marca um texto para tradução sem traduzir agora (ele é guardado e traduzido ao aparecer, com
 * `t(texto, params)`): notícias, avisos e eventos que o motor gera.
 */
export function marcar(
  texto: string,
  params?: Readonly<Record<string, string | number>>,
): TextoMarcado {
  return params ? { texto, params } : { texto };
}

/** O texto no idioma atual (ou em português, se ainda não traduzido). */
export function t(texto: string, params?: Parametros): string {
  return preencher(CATALOGOS[atual][texto] || texto, params);
}

/** O mesmo, num idioma dado (para testes e para o relatório de traduções). */
export function traduzir(idioma: Idioma, texto: string, params?: Parametros): string {
  return preencher(CATALOGOS[idioma][texto] || texto, params);
}

/** Quantos textos de cada catálogo já estão traduzidos (o português é a referência). */
export function cobertura(): Record<Idioma, { traduzidos: number; total: number }> {
  const total = Object.keys(CATALOGOS.en).length;
  return Object.fromEntries(
    IDIOMAS.map(({ codigo }) => [
      codigo,
      {
        traduzidos:
          codigo === "pt-BR" ? total : Object.values(CATALOGOS[codigo]).filter(Boolean).length,
        total,
      },
    ]),
  ) as Record<Idioma, { traduzidos: number; total: number }>;
}

/** Catálogo de um idioma (para os testes e o relatório). */
export function catalogo(idioma: Idioma): Catalogo {
  return CATALOGOS[idioma];
}
