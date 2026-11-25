export { Rng, seedFrom, type RngState } from "./rng";
export { fracaoDoPotencial, forcaEsperada, idadeEm } from "./evolucao";
export { gerarNome, gruposDeNomes } from "./gerador/nomes";
export { gerarJogador, salarioBase, type OpcoesJogador } from "./gerador/jogador";
export { gerarElenco, type OpcoesElenco } from "./gerador/elenco";

/** Versão do motor. Muda quando o resultado de uma mesma semente pode mudar. */
export const ENGINE_VERSION = "0.3.1";
