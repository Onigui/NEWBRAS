/**
 * Valor de mercado e janelas de transferência (etapa 13a).
 *
 * O valor cresce com a força (cerca de 4 vezes a cada 10 pontos: força 90 vale uns 100 milhões),
 * sobe para o jovem com margem de crescer, cai com a idade a partir dos 28 e com o contrato perto
 * do fim; estrela vale mais.
 */
import type { Contrato, Jogador, Pais } from "@newbras/data";
import { diasEntre } from "../carreira/datas";
import { periodoEmDatas, proximoInicio } from "../carreira/calendario";
import { idadeEm } from "../evolucao";

/** Valor de um jogador de força 90 no auge. */
const VALOR_FORCA_90 = 100_000_000;
/** Quanto o valor multiplica a cada ponto de força. */
const FATOR_POR_PONTO = 1.149;

/** Arredonda para 2 algarismos (12.345.678 → 12.000.000). */
export function arredondarValor(v: number): number {
  if (v < 1000) return Math.max(0, Math.round(v / 100) * 100);
  const casas = 10 ** (Math.floor(Math.log10(v)) - 1);
  return Math.round(v / casas) * casas;
}

function fatorDaIdade(idade: number, margem: number): number {
  if (idade <= 21) return 1 + Math.min(1.5, margem * 0.04);
  if (idade <= 27) return 1 + Math.min(0.6, margem * 0.02);
  const tabela: Record<number, number> = { 28: 0.85, 29: 0.78, 30: 0.7, 31: 0.6, 32: 0.5 };
  return tabela[idade] ?? Math.max(0.12, 0.5 - (idade - 32) * 0.1);
}

/** Valor de mercado do jogador na data. */
export function valorDeMercado(j: Jogador, data: string, contrato = j.contrato): number {
  const idade = idadeEm(j.nascimento, data);
  let v = VALOR_FORCA_90 * FATOR_POR_PONTO ** (j.forca - 90);
  v *= fatorDaIdade(idade, Math.max(0, j.potencial - j.forca));
  if (j.estrela) v *= 1.15;
  if (contrato) {
    const faltam = diasEntre(data, contrato.fim);
    if (faltam < 0) v *= 0.3;
    else if (faltam < 180) v *= 0.5;
    else if (faltam < 365) v *= 0.75;
  }
  return arredondarValor(v);
}

/** Janelas padrão para país sem as dele no banco (as da Europa). */
const JANELAS_PADRAO: Pais["janelas"] = [
  { inicio: "06-15", fim: "09-01" },
  { inicio: "01-01", fim: "02-02" },
];

const janelasDe = (pais: Pick<Pais, "janelas"> | undefined) =>
  pais?.janelas?.length ? pais.janelas : JANELAS_PADRAO;

/** A janela aberta na data (com a data em que fecha), ou nada. */
export function janelaAberta(
  pais: Pick<Pais, "janelas"> | undefined,
  data: string,
): { inicio: string; fim: string } | undefined {
  for (const j of janelasDe(pais)) {
    const p = periodoEmDatas(j, data);
    if (data >= p.inicio && data <= p.fim) return p;
  }
  return undefined;
}

/** Quando abre a próxima janela. */
export function proximaJanela(pais: Pick<Pais, "janelas"> | undefined, data: string): string {
  return janelasDe(pais)
    .map((j) => proximoInicio(j, data))
    .sort()[0] as string;
}

/** Salário que o jogador pede para assinar (nunca menos que 15% acima do atual). */
export function salarioPedido(
  j: Jogador,
  atual: Contrato | undefined,
  base: (forca: number) => number,
): number {
  const pedido = Math.max(base(j.forca) * (j.estrela ? 1.25 : 1), (atual?.salario ?? 0) * 1.15);
  return Math.round(pedido / 100) * 100;
}
