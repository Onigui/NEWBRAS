import {
  CARACTERISTICAS_GOLEIRO,
  FORCA_TETO,
  type CaracteristicaGoleiro,
  type CaracteristicaLinha,
  type JogadorEntrada,
  type Lado,
  type Posicao,
} from "@newbras/data";
import { forcaEsperada, fracaoDoPotencial } from "../evolucao";
import type { Rng } from "../rng";
import { gerarNome } from "./nomes";

/** Peso de cada característica por posição: o que é comum ver num zagueiro, num meia... */
const PESOS_LINHA: Record<Exclude<Posicao, "G">, Partial<Record<CaracteristicaLinha, number>>> = {
  L: { cruzamento: 5, velocidade: 5, marcacao: 3, resistencia: 3, desarme: 2, passe: 2, drible: 2 },
  Z: {
    desarme: 5,
    marcacao: 5,
    cabeceio: 5,
    forcaFisica: 3,
    resistencia: 2,
    passe: 1,
    velocidade: 1,
  },
  M: {
    passe: 5,
    armacao: 4,
    desarme: 3,
    resistencia: 3,
    drible: 2,
    marcacao: 2,
    chuteLonge: 2,
    finalizacao: 1,
    cruzamento: 1,
  },
  A: {
    finalizacao: 6,
    velocidade: 4,
    drible: 4,
    cabeceio: 3,
    forcaFisica: 2,
    chuteLonge: 2,
    armacao: 1,
    passe: 1,
  },
};

const PESOS_GOLEIRO: Record<CaracteristicaGoleiro, number> = {
  reflexo: 4,
  colocacao: 4,
  saida: 3,
  penalti: 1,
  reposicao: 1,
};

function sortearCaracteristicas(rng: Rng, posicao: Posicao): JogadorEntrada["caracteristicas"] {
  const pesos: Record<string, number> = posicao === "G" ? PESOS_GOLEIRO : PESOS_LINHA[posicao];
  const opcoes = posicao === "G" ? [...CARACTERISTICAS_GOLEIRO] : Object.keys(pesos);
  const primeira = rng.weighted(opcoes, (c) => pesos[c] ?? 0);
  // Como no Brasfoot: alguns jogadores mostram só uma característica (são mais limitados).
  if (rng.chance(0.12)) return [primeira] as JogadorEntrada["caracteristicas"];
  const segunda = rng.weighted(
    opcoes.filter((c) => c !== primeira),
    (c) => pesos[c] ?? 0,
  );
  return [primeira, segunda] as JogadorEntrada["caracteristicas"];
}

function sortearIdade(rng: Rng): number {
  // Concentra entre 22 e 30, com jovens e veteranos nas pontas.
  return Math.round(Math.min(37, Math.max(17, rng.normal(26, 4.2))));
}

function sortearLado(rng: Rng, posicao: Posicao): Lado {
  if (posicao === "L") return rng.chance(0.5) ? "D" : "E";
  if (posicao === "A" && rng.chance(0.35)) return rng.chance(0.5) ? "D" : "E";
  return "C";
}

/** Salário mensal na moeda do jogo; cresce exponencialmente com a força. Calibrado na Fase 14. */
export function salarioBase(forca: number): number {
  return Math.round((800 * 1.068 ** forca) / 100) * 100;
}

export interface OpcoesJogador {
  id: string;
  nacionalidade: string;
  grupoNomes: string;
  posicao: Posicao;
  /** Nível técnico do clube (1 a 100): a força dos titulares gira em torno dele. */
  nivel: number;
  /** "Hoje" no jogo (AAAA-MM-DD), para calcular nascimento e contrato. */
  hoje: string;
  clube?: string;
  lado?: Lado;
  idade?: number;
  /** Dia do ano (MM-DD) em que os contratos do país terminam; padrão 31/12. */
  fimDeContrato?: string;
}

/** Ninguém gerado passa do teto do jogo (só o CR7 tem 99). */
const limitar = (v: number) => Math.min(FORCA_TETO, Math.max(1, Math.round(v)));

/** Gera um jogador fictício coerente com o nível do clube e a curva de idade. */
export function gerarJogador(rng: Rng, o: OpcoesJogador): JogadorEntrada {
  const idade = o.idade ?? sortearIdade(rng);
  const { nome, nomeCompleto } = gerarNome(rng, o.grupoNomes);

  // Primeiro sorteia o teto do jogador, depois a força pela idade.
  const potencialBase = o.nivel + 6 + rng.normal(0, 7);
  const potencial = limitar(Math.max(potencialBase, o.nivel * 0.7));
  const variacao = rng.normal(0, 3);
  const forca = Math.min(potencial, limitar(forcaEsperada(potencial, idade, o.posicao) + variacao));

  const estrela = potencial >= 86 ? rng.chance(0.35) : potencial >= 80 ? rng.chance(0.06) : false;

  const [anoHoje, mesHoje, diaHoje] = o.hoje.split("-").map(Number) as [number, number, number];
  // Nasceu entre 1 e 365 dias antes de completar a idade sorteada, para a idade bater com "hoje".
  const aniversario = Date.UTC(anoHoje - idade, mesHoje - 1, diaHoje);
  const nascimento = new Date(aniversario - rng.int(0, 364) * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const jogador: JogadorEntrada = {
    id: o.id,
    nome,
    nomeCompleto,
    nascimento,
    nacionalidade: o.nacionalidade,
    posicao: o.posicao,
    lado: o.lado ?? sortearLado(rng, o.posicao),
    forca,
    potencial: Math.max(potencial, forca),
    caracteristicas: sortearCaracteristicas(rng, o.posicao),
    estrela,
  };
  if (o.clube) {
    jogador.clube = o.clube;
    jogador.contrato = {
      fim: `${anoHoje + rng.int(1, 4)}-${o.fimDeContrato ?? "12-31"}`,
      salario: salarioBase(forca),
    };
  }
  return jogador;
}

export { fracaoDoPotencial };
