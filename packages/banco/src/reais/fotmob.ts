import {
  escalarAtributos,
  gerarAtributos,
  type ClubeEntrada,
  type JogadorEntrada,
} from "@newbras/data";
import { Rng, fracaoDoPotencial, gerarJogador, idadeEm, salarioBase } from "@newbras/engine";
import { pais } from "../mundo/paises";
import { DATA_FONTE_ELENCOS, DATA_REFERENCIA } from "../referencia";
import { NOTAVEIS } from "./notaveis";
import { PAIS_POR_NOME_EN } from "./paises-en";

/** Uma linha da fonte: nome|posições|número|idade|país|valor. */
export interface LinhaFonte {
  nome: string;
  posicoes: string[];
  numero?: number;
  idade?: number;
  pais: string;
  /** Valor de mercado em milhares de euros. */
  valorMil?: number;
}

/** Lê o texto da fonte: blocos "## slug" seguidos das linhas dos jogadores. */
export function lerElencos(texto: string): Map<string, LinhaFonte[]> {
  const elencos = new Map<string, LinhaFonte[]>();
  let atual: LinhaFonte[] | undefined;
  for (const bruta of texto.split("\n")) {
    const linha = bruta.trim();
    if (linha.startsWith("## ")) {
      atual = [];
      elencos.set(linha.slice(3).trim(), atual);
      continue;
    }
    if (!linha || linha.startsWith("#") || !atual) continue;
    const [nome = "", posicoes = "", numero = "", idade = "", paisNome = "", valor = ""] =
      linha.split("|");
    const n = Number.parseInt(numero, 10);
    const i = Number.parseInt(idade, 10);
    const v = lerValor(valor);
    atual.push({
      nome: nome.trim(),
      posicoes: posicoes.split(",").map((p) => p.trim()),
      ...(Number.isFinite(n) && n >= 1 && n <= 99 ? { numero: n } : {}),
      ...(Number.isFinite(i) ? { idade: i } : {}),
      pais: paisNome.trim(),
      ...(v !== undefined ? { valorMil: v } : {}),
    });
  }
  return elencos;
}

/** "€1.8M" → 1800, "€170K" → 170, "€516.4k" → 516.4; vazio ou "-" → indefinido. */
export function lerValor(valor: string): number | undefined {
  const m = /([\d.]+)\s*([kKmM])/.exec(valor);
  if (!m) return undefined;
  const numero = Number.parseFloat(m[1] ?? "");
  return (m[2] ?? "").toLowerCase() === "m" ? numero * 1000 : numero;
}

type Posicao = JogadorEntrada["posicao"];
type Lado = JogadorEntrada["lado"];
type Caracteristica = NonNullable<JogadorEntrada["caracteristicas"]>[number];

/** Código de posição da fonte → posição e lado do jogo. Posição genérica fica para conferir. */
const POSICAO: Readonly<Record<string, readonly [Posicao, Lado]>> = {
  GK: ["G", "C"],
  RB: ["L", "D"],
  RWB: ["L", "D"],
  LB: ["L", "E"],
  LWB: ["L", "E"],
  CB: ["Z", "C"],
  Defender: ["Z", "C"],
  DM: ["M", "C"],
  CM: ["M", "C"],
  AM: ["M", "C"],
  Midfielder: ["M", "C"],
  RM: ["M", "D"],
  LM: ["M", "E"],
  RW: ["A", "D"],
  LW: ["A", "E"],
  ST: ["A", "C"],
  Attacker: ["A", "C"],
};
const GENERICAS = new Set(["Defender", "Midfielder", "Attacker"]);

/** O que costuma se destacar em cada função; a posição detalhada da fonte escolhe o perfil. */
const PERFIL: Readonly<Record<string, Partial<Record<Caracteristica, number>>>> = {
  GK: { reflexo: 4, colocacao: 4, saida: 3, penalti: 1, reposicao: 1 },
  LATERAL: { velocidade: 5, cruzamento: 5, marcacao: 3, resistencia: 3, desarme: 2 },
  CB: { desarme: 5, marcacao: 5, cabeceio: 5, forcaFisica: 3, passe: 1 },
  DM: { desarme: 5, marcacao: 4, passe: 3, resistencia: 3, forcaFisica: 1 },
  CM: { passe: 5, resistencia: 4, armacao: 3, desarme: 2, chuteLonge: 1 },
  AM: { armacao: 5, passe: 4, drible: 4, finalizacao: 3, chuteLonge: 2 },
  MEIA_ABERTO: { cruzamento: 4, velocidade: 4, drible: 3, passe: 2, resistencia: 2 },
  PONTA: { drible: 5, velocidade: 5, cruzamento: 3, finalizacao: 3 },
  ST: { finalizacao: 6, cabeceio: 4, velocidade: 3, drible: 2, forcaFisica: 2, chuteLonge: 1 },
};
const PERFIL_DO_CODIGO: Readonly<Record<string, string>> = {
  GK: "GK",
  RB: "LATERAL",
  RWB: "LATERAL",
  LB: "LATERAL",
  LWB: "LATERAL",
  CB: "CB",
  Defender: "CB",
  DM: "DM",
  CM: "CM",
  Midfielder: "CM",
  AM: "AM",
  RM: "MEIA_ABERTO",
  LM: "MEIA_ABERTO",
  RW: "PONTA",
  LW: "PONTA",
  ST: "ST",
  Attacker: "ST",
};

function caracteristicas(rng: Rng, codigo: string): NonNullable<JogadorEntrada["caracteristicas"]> {
  const pesos = PERFIL[PERFIL_DO_CODIGO[codigo] ?? "CM"] ?? {};
  const opcoes = Object.keys(pesos) as Caracteristica[];
  const primeira = rng.weighted(opcoes, (c) => pesos[c] ?? 0);
  if (rng.chance(0.12)) return [primeira];
  const segunda = rng.weighted(
    opcoes.filter((c) => c !== primeira),
    (c) => pesos[c] ?? 0,
  );
  return [primeira, segunda];
}

const limitar = (v: number, min: number, max: number) =>
  Math.round(Math.min(max, Math.max(min, v)));

/**
 * Força e potencial a partir do valor de mercado e da idade.
 * O valor mede bem a força de quem está no auge; nos jovens ele mede o potencial e nos veteranos
 * cai mais rápido que a força, então os dois lados são corrigidos. Sem valor, usa o nível do clube.
 */
export function forcaPeloValor(
  rng: Rng,
  valorMil: number | undefined,
  idade: number,
  nivelClube: number,
): { forca: number; potencial: number } {
  const juventude = Math.max(0, 23 - idade);
  if (valorMil === undefined || valorMil <= 0) {
    const forca = limitar(nivelClube - 8 + rng.normal(0, 4) - juventude * 1.5, 35, 85);
    return {
      forca,
      potencial: limitar(forca + juventude * 2.5 + Math.max(0, 27 - idade), forca, 92),
    };
  }
  const pelaValor = 54 + 12 * Math.log10(valorMil / 100);
  const veterano = idade >= 29 ? Math.min(12, 1.3 * (idade - 28)) : 0;
  const forca = limitar(pelaValor + veterano - juventude * 2.5, 35, 92);
  const potencial =
    idade <= 22 ? pelaValor + juventude * 1.5 : idade <= 26 ? forca + (27 - idade) : forca;
  // Promessa acima de 90 cresce pela metade: joia de verdade (Yamal, por exemplo) tem ajuste à mão.
  const comprimido = potencial > 90 ? 90 + (potencial - 90) / 2 : potencial;
  return { forca, potencial: limitar(comprimido, forca, 95) };
}

/** "Iñigo Martínez" → "inigo-martinez". */
export function slug(texto: string): string {
  return texto
    .replace(/[łŁ]/g, "l")
    .replace(/[øØ]/g, "o")
    .replace(/ß/g, "ss")
    .replace(/[đĐ]/g, "d")
    .replace(/ı/g, "i")
    .replace(/[æÆ]/g, "ae")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Ajuste à mão para o nome, se for o mesmo jogador: um homônimo com idade bem diferente
 * (o Luis Suárez colombiano do Sporting, por exemplo) não herda os dados do uruguaio.
 */
function notavelDaLinha(nome: string, idade: number | undefined) {
  const n = NOTAVEIS[nome];
  if (!n?.nascimento || idade === undefined) return n;
  const idadeNotavel = idadeEm(n.nascimento, DATA_FONTE_ELENCOS);
  return Math.abs(idadeNotavel - idade) <= 2 ? n : undefined;
}

/**
 * Auge estimado de quem já passou dele, pela mesma curva de idade do jogo. Limitado a 8 pontos
 * acima da força de hoje e a 92: auge acima disso só para quem tem ajuste à mão (as lendas).
 */
const AUGE_ESTIMADO_MAXIMO = 92;

export function picoPelaIdade(forca: number, idade: number, posicao: Posicao): number {
  const fracao = fracaoDoPotencial(Math.min(idade, 36), posicao);
  if (idade < 28 || fracao >= 1) return forca;
  return Math.max(forca, Math.min(Math.round(forca / fracao), forca + 8, AUGE_ESTIMADO_MAXIMO));
}

/** Nascimento aproximado a partir da idade na data da fonte. */
function nascimentoPelaIdade(rng: Rng, idade: number): string {
  const [ano, mes, dia] = DATA_FONTE_ELENCOS.split("-").map(Number) as [number, number, number];
  const aniversario = Date.UTC(ano - idade, mes - 1, dia);
  return new Date(aniversario - rng.int(0, 364) * 86_400_000).toISOString().slice(0, 10);
}

export interface OpcoesReais {
  /** Dia e mês (MM-DD) em que os contratos do país terminam. */
  fimDeContrato: string;
  /** Semente para o que a fonte não traz (dia do nascimento, características). */
  semente?: string;
}

/**
 * Converte os elencos da fonte em jogadores do jogo. Cada bloco "## slug" vai para o clube cujo id
 * termina com esse slug (ex.: "## al-nassr" → "ksa-al-nassr"). Clubes com menos de dois goleiros
 * recebem um goleiro jovem gerado, para o elenco ser jogável.
 */
export function jogadoresReais(
  texto: string,
  clubes: readonly ClubeEntrada[],
  o: OpcoesReais,
): JogadorEntrada[] {
  const porSlug = new Map(clubes.map((c) => [c.id.split("-").slice(1).join("-"), c]));
  const jogadores: JogadorEntrada[] = [];
  const ids = new Set<string>();
  const anoRef = Number(DATA_REFERENCIA.slice(0, 4));

  for (const [slugClube, linhas] of lerElencos(texto)) {
    const clube = porSlug.get(slugClube);
    if (!clube) throw new Error(`elenco "${slugClube}" sem clube correspondente`);
    const numeros = new Set<number>();
    let goleiros = 0;

    for (const l of linhas) {
      const rng = new Rng(`${o.semente ?? "reais"}:${clube.id}:${l.nome}`);
      // Sem país na fonte, o jogador fica com o país do clube e a nacionalidade vai "a conferir".
      const nacionalidade = l.pais ? PAIS_POR_NOME_EN[l.pais] : clube.pais;
      if (!nacionalidade) throw new Error(`país sem código: "${l.pais}" (${l.nome})`);
      const codigo = l.posicoes[0] ?? "Midfielder";
      const notavel = notavelDaLinha(l.nome, l.idade);
      const [posicaoFonte, ladoFonte] = POSICAO[codigo] ?? ["M", "C"];
      const posicao = notavel?.posicao ?? posicaoFonte;
      const aConferir: NonNullable<JogadorEntrada["aConferir"]> = [];
      if (!l.pais) aConferir.push("nacionalidade");
      if (GENERICAS.has(codigo) && !notavel?.posicao) aConferir.push("posicao");

      const idade = l.idade ?? 24;
      const modelo = forcaPeloValor(rng, l.valorMil, idade, clube.nivel);
      const forca = notavel?.forca ?? modelo.forca;
      // O potencial é o teto da carreira e não baixa com a idade: o veterano guarda o auge.
      // Com auge conhecido (ajuste à mão), ele manda; sem, o auge vem da curva de idade.
      const potencial =
        notavel?.forcaAuge !== undefined
          ? Math.max(forca, notavel.forcaAuge)
          : Math.max(forca, modelo.potencial, picoPelaIdade(forca, idade, posicao));
      const nascimento = notavel?.nascimento ?? nascimentoPelaIdade(rng, idade);
      if (!notavel?.nascimento) aConferir.push("nascimento");

      let id = `${clube.id}-${slug(l.nome)}`;
      for (let k = 2; ids.has(id); k++) id = `${clube.id}-${slug(l.nome)}-${k}`;
      ids.add(id);

      let numero = l.numero;
      if (numero !== undefined && numeros.has(numero)) {
        numero = undefined;
        aConferir.push("numero");
      }
      if (numero !== undefined) numeros.add(numero);
      if (posicao === "G") goleiros++;

      const forcaAuge = notavel?.forcaAuge;
      const fimContrato = notavel?.contratoFim ?? `${anoRef + rng.int(1, 4)}-${o.fimDeContrato}`;

      jogadores.push({
        id,
        nome: l.nome,
        nascimento,
        nacionalidade,
        posicao,
        lado: notavel?.lado ?? ladoFonte,
        forca,
        potencial,
        caracteristicas: notavel?.caracteristicas ?? caracteristicas(rng, codigo),
        ...(notavel?.atributosAuge
          ? { atributos: escalarAtributos(posicao, notavel.atributosAuge, forca) }
          : notavel?.destaques
            ? {
                atributos: gerarAtributos({
                  semente: id,
                  posicao,
                  forca,
                  ...(notavel.caracteristicas ? { caracteristicas: notavel.caracteristicas } : {}),
                  destaques: notavel.destaques,
                  ...(forcaAuge !== undefined ? { forcaAuge: Math.max(forcaAuge, forca) } : {}),
                }),
              }
            : {}),
        estrela: (forcaAuge ?? 0) >= 85 || forca >= 82,
        clube: clube.id,
        contrato: { fim: fimContrato, salario: salarioBase(forca) },
        ...(numero !== undefined ? { numero } : {}),
        ...(forcaAuge !== undefined ? { forcaAuge: Math.max(forcaAuge, forca) } : {}),
        aConferir,
      });
    }

    for (let g = goleiros; g < 2; g++) {
      const rng = new Rng(`${o.semente ?? "reais"}:${clube.id}:goleiro-${g}`);
      jogadores.push(
        gerarJogador(rng, {
          id: `${clube.id}-goleiro-gerado-${g + 1}`,
          nacionalidade: clube.pais,
          grupoNomes: pais(clube.pais).grupoNomes,
          posicao: "G",
          nivel: clube.nivel - 10,
          hoje: DATA_REFERENCIA,
          clube: clube.id,
          idade: 20,
          fimDeContrato: o.fimDeContrato,
        }),
      );
    }
  }
  return jogadores;
}
