/**
 * Avisos nas abas da carreira: o que chegou desde a última vez que o técnico abriu a aba (relatório
 * do olheiro, prêmios, notícias do elenco) e o que espera uma ação dele (propostas, convites,
 * escalado que não pode jogar, salários atrasados). Os urgentes aparecem em vermelho.
 */
import type { Carreira, Mundo } from "@newbras/engine";

export interface AvisoDaAba {
  n: number;
  urgente?: boolean;
}

/** Contagens que dependem da tela (o que a carreira sozinha não sabe). */
export interface ExtrasDosAvisos {
  /** Escalados para o próximo jogo que não podem jogar. */
  escalacao: number;
  /** Problemas na convocação da seleção do técnico. */
  selecao: number;
}

export function avisosDasAbas(
  c: Carreira,
  mundo: Pick<Mundo, "clube" | "competicao">,
  extras: ExtrasDosAvisos,
): Partial<Record<string, AvisoDaAba>> {
  const visto = (aba: string) => c.vistas?.[aba] ?? c.inicio;
  const novo = (aba: string, data: string) => data > visto(aba);
  const r: Partial<Record<string, AvisoDaAba>> = {};
  const por = (aba: string, n: number, urgente = false) => {
    if (n <= 0) return;
    const antes = r[aba];
    r[aba] = { n: (antes?.n ?? 0) + n, urgente: urgente || !!antes?.urgente };
  };
  por("base", (c.base?.relatorios ?? []).filter((x) => novo("base", x.data)).length);
  por("plantel", c.noticias.filter((x) => x.tipo === "elenco" && novo("plantel", x.data)).length);
  por("mercado", c.propostas?.length ?? 0, true);
  por(
    "mercado",
    (c.preContratos ?? []).filter((x) => x.de === c.clube && novo("mercado", x.assinatura)).length,
  );
  por("jogos", c.convitesAmistosos?.length ?? 0);
  por("financas", (c.estadio?.eventos?.length ?? 0) + (c.estadio?.ofertaDeNome ? 1 : 0));
  por("financas", c.crise?.salariosAtrasados ? 1 : 0, true);
  por("escalacao", extras.escalacao, true);
  por("selecoes", extras.selecao, true);
  const pais = mundo.clube(c.clube)?.pais;
  por(
    "premios",
    (c.premios?.ligas ?? []).filter((p) => {
      const comp = mundo.competicao(p.competicao);
      return novo("premios", p.data) && comp?.escopo.tipo === "pais" && comp.escopo.pais === pais;
    }).length + (c.premios?.mundo ?? []).filter((x) => novo("premios", x.data)).length,
  );
  return r;
}
