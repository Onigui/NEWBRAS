/** Idade completa em anos numa data de referência (AAAA-MM-DD). */
export function idade(nascimento: string, referencia: string): number {
  const [an, mn, dn] = nascimento.split("-").map(Number) as [number, number, number];
  const [ar, mr, dr] = referencia.split("-").map(Number) as [number, number, number];
  return ar - an - (mr < mn || (mr === mn && dr < dn) ? 1 : 0);
}

/** Nascimento para uma idade, mantendo o dia e o mês. */
export function nascimentoParaIdade(nascimento: string, anos: number, referencia: string): string {
  const [, mm, dd] = nascimento.split("-");
  const ano = Number(referencia.slice(0, 4)) - anos;
  const candidato = `${ano}-${mm}-${dd}`;
  return idade(candidato, referencia) === anos ? candidato : `${ano - 1}-${mm}-${dd}`;
}
