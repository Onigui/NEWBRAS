import {
  gerarAtributos,
  type Atributos,
  type ClubeEntrada,
  type JogadorEntrada,
} from "@newbras/data";
import { Rng, fracaoDoPotencial } from "@newbras/engine";
import { DATA_REFERENCIA } from "../referencia";

type Caracteristicas = NonNullable<JogadorEntrada["caracteristicas"]>;

/**
 * Ícones aposentados que começam o jogo como garotos de 15 ou 16 anos na base de um clube sorteado,
 * com o potencial do auge real. A lista é curta de propósito: nomes que marcaram o século XXI nas
 * listas de melhores da Goal, da FourFourTwo, da ESPN e da OneFootball, mais Gareth Bale.
 * [nome, nome completo, nacionalidade, posição, lado, força do auge, características]
 */
const ICONES: ReadonlyArray<
  readonly [
    string,
    string,
    string,
    JogadorEntrada["posicao"],
    JogadorEntrada["lado"],
    number,
    Caracteristicas,
  ]
> = [
  ["Gareth Bale", "Gareth Frank Bale", "WAL", "A", "D", 90, ["velocidade", "finalizacao"]],
  ["Zidane", "Zinedine Yazid Zidane", "FRA", "M", "C", 96, ["armacao", "drible"]],
  ["Ronaldinho", "Ronaldo de Assis Moreira", "BRA", "A", "E", 96, ["drible", "passe"]],
  ["Ronaldo", "Ronaldo Luís Nazário de Lima", "BRA", "A", "C", 97, ["finalizacao", "drible"]],
  ["Kaká", "Ricardo Izecson dos Santos Leite", "BRA", "M", "C", 93, ["armacao", "velocidade"]],
  ["Thierry Henry", "Thierry Daniel Henry", "FRA", "A", "C", 94, ["velocidade", "finalizacao"]],
  ["Andrea Pirlo", "Andrea Pirlo", "ITA", "M", "C", 91, ["passe", "armacao"]],
  ["Xavi", "Xavier Hernández Creus", "ESP", "M", "C", 93, ["passe", "armacao"]],
  ["Andrés Iniesta", "Andrés Iniesta Luján", "ESP", "M", "C", 93, ["drible", "passe"]],
  ["Paolo Maldini", "Paolo Cesare Maldini", "ITA", "Z", "C", 94, ["desarme", "marcacao"]],
  ["Gianluigi Buffon", "Gianluigi Buffon", "ITA", "G", "C", 94, ["reflexo", "colocacao"]],
  ["Iker Casillas", "Iker Casillas Fernández", "ESP", "G", "C", 92, ["reflexo", "penalti"]],
  [
    "Roberto Carlos",
    "Roberto Carlos da Silva Rocha",
    "BRA",
    "L",
    "E",
    91,
    ["velocidade", "cruzamento"],
  ],
  ["Cafu", "Marcos Evangelista de Morais", "BRA", "L", "D", 90, ["resistencia", "cruzamento"]],
  ["Wayne Rooney", "Wayne Mark Rooney", "ENG", "A", "C", 91, ["finalizacao", "passe"]],
  ["Zlatan Ibrahimović", "Zlatan Ibrahimović", "SWE", "A", "C", 92, ["finalizacao", "cabeceio"]],
  ["Didier Drogba", "Didier Yves Drogba Tébily", "CIV", "A", "C", 91, ["cabeceio", "finalizacao"]],
  ["Steven Gerrard", "Steven George Gerrard", "ENG", "M", "C", 91, ["passe", "finalizacao"]],
  ["Francesco Totti", "Francesco Totti", "ITA", "A", "C", 92, ["armacao", "finalizacao"]],
  ["Arjen Robben", "Arjen Robben", "NED", "A", "D", 91, ["drible", "velocidade"]],
  ["Eden Hazard", "Eden Michael Hazard", "BEL", "A", "E", 91, ["drible", "velocidade"]],
  ["Toni Kroos", "Toni Kroos", "GER", "M", "C", 91, ["passe", "armacao"]],
];

/**
 * O que fez cada ícone ser único, na escala do auge. Viram os atributos mais altos do perfil
 * e decidem as características (a velocidade do Bale, o chute do Roberto Carlos).
 */
export const DESTAQUES_ICONES: Readonly<Record<string, Atributos>> = {
  "Gareth Bale": { velocidade: 99, chuteLonge: 92 },
  Zidane: { armacao: 97, drible: 96, passe: 95 },
  Ronaldinho: { drible: 99, passe: 94 },
  Ronaldo: { finalizacao: 98, drible: 97, velocidade: 96 },
  Kaká: { velocidade: 94, armacao: 93 },
  "Thierry Henry": { velocidade: 97, finalizacao: 95 },
  "Andrea Pirlo": { passe: 98, chuteLonge: 93 },
  Xavi: { passe: 99, armacao: 95 },
  "Andrés Iniesta": { drible: 96, passe: 95 },
  "Paolo Maldini": { marcacao: 97, desarme: 96 },
  "Gianluigi Buffon": { reflexo: 96, colocacao: 96 },
  "Iker Casillas": { reflexo: 97, penalti: 92 },
  "Roberto Carlos": { chuteLonge: 97, velocidade: 95 },
  Cafu: { resistencia: 97, velocidade: 91 },
  "Wayne Rooney": { finalizacao: 92, chuteLonge: 91 },
  "Zlatan Ibrahimović": { finalizacao: 94, forcaFisica: 93 },
  "Didier Drogba": { forcaFisica: 95, cabeceio: 93 },
  "Steven Gerrard": { chuteLonge: 94, passe: 92 },
  "Francesco Totti": { armacao: 93, chuteLonge: 92 },
  "Arjen Robben": { drible: 95, chuteLonge: 92 },
  "Eden Hazard": { drible: 97, velocidade: 92 },
  "Toni Kroos": { passe: 97, chuteLonge: 91 },
};

/** Quantos ícones existem; útil para testes e para a tela de novo jogo. */
export const TOTAL_ICONES = ICONES.length;

const slug = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Coloca cada ícone na base de um clube sorteado (com a semente do mundo, então o mesmo jogo sempre
 * tem os mesmos ícones nos mesmos clubes). A força começa proporcional à idade, pela mesma curva de
 * evolução de todos; o potencial é a força do auge.
 */
export function iconesNaBase(clubes: readonly ClubeEntrada[], semente: string): JogadorEntrada[] {
  const rng = new Rng(`${semente}:icones`);
  const [ano, mes, dia] = DATA_REFERENCIA.split("-").map(Number) as [number, number, number];
  return ICONES.map(([nome, nomeCompleto, nacionalidade, posicao, lado, auge, caracteristicas]) => {
    const clube = rng.pick(clubes);
    const idade = rng.int(15, 16);
    const aniversario = Date.UTC(ano - idade, mes - 1, dia);
    const nascimento = new Date(aniversario - rng.int(0, 364) * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const forca = Math.max(1, Math.round(auge * fracaoDoPotencial(idade, posicao)));
    const id = `icone-${slug(nome)}`;
    const destaques = DESTAQUES_ICONES[nome];
    return {
      id,
      nome,
      nomeCompleto,
      nascimento,
      nacionalidade,
      posicao,
      lado,
      forca,
      potencial: auge,
      caracteristicas,
      ...(destaques
        ? {
            atributos: gerarAtributos({
              semente: id,
              posicao,
              forca,
              caracteristicas,
              destaques,
              forcaAuge: auge,
            }),
          }
        : {}),
      estrela: true,
      base: true,
      clube: clube.id,
      forcaAuge: auge,
    };
  });
}
