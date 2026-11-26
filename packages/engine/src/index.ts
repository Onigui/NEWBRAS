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
export const ENGINE_VERSION = "0.20.0";
