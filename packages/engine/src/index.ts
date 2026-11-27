export { Rng, seedFrom, type RngState } from "./rng";
export { fracaoDoPotencial, forcaEsperada, idadeEm } from "./evolucao";
export { gerarNome, gruposDeNomes } from "./gerador/nomes";
export { gerarJogador, salarioBase, type OpcoesJogador } from "./gerador/jogador";
export { gerarElenco, type OpcoesElenco } from "./gerador/elenco";
export * from "./partida";
export * from "./carreira";
export * from "./competicoes";
export { convocar, TAMANHO_DA_CONVOCACAO, VAGAS_DA_CONVOCACAO } from "./selecoes/convocacao";

/** Versão do motor. Muda quando o resultado de uma mesma semente pode mudar. */
export const ENGINE_VERSION = "0.26.0";
export {
  CHANCE_DE_AMISTOSO,
  diasDosAmistosos,
  janelaDaData,
  jogosDeSelecoes,
  marcarAmistosos,
  selecoesDoMundo,
  type AmistosoDeSelecao,
  type JogoDeSelecao,
} from "./selecoes/amistosos";
export {
  EvolucaoDoMundo,
  FORCA_DE_LENDA,
  forcaNaIdade,
  temporadasContadas,
  type EventoElenco,
} from "./elenco/evolucao";
export { evolucaoDe, forcasDaTemporadaAnterior, mundoDoBancoDe, mundoNaData } from "./elenco/mundo";
export {
  CHANCE_LESAO_TREINO,
  contratoDe,
  faixaDaMoral,
  lesionado,
  MORAL_NORMAL,
  moralDe,
  propostaDeRenovacao,
  renovarContrato,
  somarMeses,
  TIPOS_DE_LESAO,
  type Lesao,
  type PropostaDeRenovacao,
} from "./elenco/vida";
export {
  emFerias,
  fatorDeRecaida,
  fragilidade,
  LESOES_POR_JOGO_CPU,
  RISCO_DA_POSICAO,
  riscoDeLesao,
  type CausaDaLesao,
  type LesionadosDaCpu,
} from "./elenco/lesoes";
