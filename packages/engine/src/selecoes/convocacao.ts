/**
 * Convocação automática das seleções (etapa 11a): os melhores jogadores de cada nacionalidade, em
 * qualquer clube do mundo, com a quantidade de cada posição de uma lista de Copa (26). O técnico da
 * seleção escolhendo a lista à mão vem na Fase 15.
 */
import { gerarAtributos, type Jogador, type Posicao } from "@newbras/data";

/** Quantos de cada posição: 3 goleiros, 5 zagueiros, 4 laterais, 8 meias e 6 atacantes. */
export const VAGAS_DA_CONVOCACAO: Readonly<Record<Posicao, number>> = {
  G: 3,
  Z: 5,
  L: 4,
  M: 8,
  A: 6,
};
export const TAMANHO_DA_CONVOCACAO = 26;

/** Força dos que completam a lista quando o país não tem jogadores suficientes no banco. */
const FORCA_DO_COMPLEMENTO = 40;

/**
 * Os convocados, do mais forte para o mais fraco em cada posição. Sobrando vaga numa posição, entra
 * o melhor que ficou de fora (de linha); faltando gente no país, a lista se completa com jogadores
 * genéricos fracos (Liechtenstein tem 3 jogadores no banco).
 */
export function convocar(pais: string, jogadores: readonly Jogador[]): Jogador[] {
  const elegiveis = jogadores
    .filter((j) => j.nacionalidade === pais && !j.base)
    .sort((a, b) => b.forca - a.forca || a.id.localeCompare(b.id));
  const lista: Jogador[] = [];
  for (const [posicao, n] of Object.entries(VAGAS_DA_CONVOCACAO) as [Posicao, number][])
    lista.push(...elegiveis.filter((j) => j.posicao === posicao).slice(0, n));
  const usados = new Set(lista.map((j) => j.id));
  for (const j of elegiveis) {
    if (lista.length >= TAMANHO_DA_CONVOCACAO) break;
    if (!usados.has(j.id) && j.posicao !== "G") {
      lista.push(j);
      usados.add(j.id);
    }
  }
  const ordem: Posicao[] = ["G", "Z", "Z", "L", "M", "M", "A"];
  for (let i = 0; lista.length < TAMANHO_DA_CONVOCACAO; i++) {
    const posicao = ordem[i % ordem.length] as Posicao;
    const id = `${pais.toLowerCase()}-convocado-${i + 1}`;
    lista.push({
      id,
      nome: `${pais} ${i + 1}`,
      nascimento: "2000-01-01",
      nacionalidade: pais,
      posicao,
      lado: "C",
      forca: FORCA_DO_COMPLEMENTO,
      potencial: FORCA_DO_COMPLEMENTO,
      caracteristicas: [],
      atributos: gerarAtributos({ semente: id, posicao, forca: FORCA_DO_COMPLEMENTO }),
      estrela: false,
      base: false,
      aConferir: [],
    } as unknown as Jogador);
  }
  return lista;
}
