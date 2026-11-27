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
export const ENGINE_VERSION = "0.33.0";
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
export {
  BASE_MAXIMA,
  baseDe,
  contratarOlheiro,
  contratarProspecto,
  demitirOlheiro,
  descartarRelatorio,
  dispensarDaBase,
  enviarOlheiro,
  faixaDoOlheiro,
  IDADE_DISPENSA,
  IDADE_MINIMA_PROMOCAO,
  jogadorDaBaseNaData,
  MESES_DE_MISSAO,
  OLHEIROS_MAXIMO,
  olheirosDisponiveis,
  podePromover,
  promover,
  type EstadoDaBase,
  type JogadorDaBase,
  type Olheiro,
  type Relatorio,
} from "./elenco/base";
export {
  aceitaOClube,
  aceitarProposta,
  caixaDe,
  contratarLivre,
  custoDaDispensa,
  dispensarJogador,
  livresDe,
  pedidoDoClube,
  porAVenda,
  proporCompra,
  recusarProposta,
  emprestadoAoClube,
  emprestimoDe,
  presosEmNegocio,
  type Emprestimo,
  type Lance,
  type Leilao,
  type PreContrato,
  type PropostaRecebida,
  type Sondagem,
  type ResultadoProposta,
  type TipoTransferencia,
  type Transferencia,
} from "./mercado/mercado";
export {
  avaliarTroca,
  condicoesDoEmprestimo,
  darLance,
  DIAS_DO_LEILAO,
  DIAS_DO_PRE_CONTRATO,
  exercerOpcao,
  fimDaTemporada,
  fimParaPreContrato,
  lanceMinimo,
  leiloar,
  maiorLance,
  pegarEmprestado,
  porParaEmprestimo,
  proporPreContrato,
  proporTroca,
  salarioDoPreContrato,
  valorNaTroca,
  type CondicoesDeEmprestimo,
  type ResultadoLance,
  type ResultadoPreContrato,
  type ResultadoTroca,
} from "./mercado/negocios";
export {
  caixaDaCpu,
  FATOR_DO_PAIS,
  folhaSalarial,
  manutencaoMensal,
  orcamentoMensal,
  precisaDeDinheiro,
  precoDoIngresso,
  receitaAnual,
  rendaDoJogo,
  type CategoriaFinanceira,
  type MesFinanceiro,
} from "./financas/financas";
export {
  DIAS_DA_SONDAGEM,
  liberarJogador,
  sondagemDe,
  sondagensPendentes,
} from "./mercado/sondagens";
export {
  arredondarValor,
  contratoVigente,
  janelaAberta,
  proximaJanela,
  salarioPedido,
  valorDeMercado,
} from "./mercado/valor";
export { compactarTransferencias, mercadoDaCpu } from "./mercado/cpu";
export {
  ehProdigio,
  importanciaNoElenco,
  respostaDeVenda,
  situacaoDoClube,
  type Importancia,
  type RespostaDeVenda,
  type SituacaoDoClube,
} from "./mercado/situacao";
