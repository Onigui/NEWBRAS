/**
 * Textos dos eventos para o modo clássico (linha de minutos) e para o resumo do jogo.
 */
import type { Evento, LadoCampo } from "./tipos";

export interface ContextoNarracao {
  nomes: ReadonlyMap<string, string>;
  times: Readonly<Record<LadoCampo, string>>;
}

/** Minuto como aparece na tela: 23', 45+2', 90+4', 105+1'. */
export function rotuloMinuto(e: Pick<Evento, "minuto" | "acrescimo" | "periodo">): string {
  if (e.periodo === 5) return "Pên.";
  return e.acrescimo ? `${e.minuto}+${e.acrescimo}'` : `${e.minuto}'`;
}

export function textoDoEvento(e: Evento, c: ContextoNarracao): string {
  const nome = (id?: string) => (id ? (c.nomes.get(id) ?? id) : "");
  const time = e.time ? c.times[e.time] : "";
  const quem = nome(e.jogador);
  const placar = e.placar ? ` ${e.placar[0]} x ${e.placar[1]}` : "";
  switch (e.tipo) {
    case "inicio":
      return "Começa o jogo.";
    case "intervalo":
      return e.periodo === 3 ? "Fim do 1º tempo da prorrogação." : "Fim do 1º tempo.";
    case "reinicio":
      return e.periodo === 4 ? "Começa o 2º tempo da prorrogação." : "Começa o 2º tempo.";
    case "fim-tempo-normal":
      return "Fim do tempo normal. Vai ter prorrogação.";
    case "inicio-prorrogacao":
      return "Começa a prorrogação.";
    case "fim":
      return `Fim de jogo.${placar}`;
    case "gol":
      return `GOL do ${time}! ${quem}${e.outro ? `, com passe de ${nome(e.outro)}` : ""}.${placar}`;
    case "gol-contra":
      return `Gol contra de ${quem}.${placar}`;
    case "chute-fora":
      return `${quem} (${time}) chuta para fora.`;
    case "chute-trave":
      return `Na trave! ${quem} (${time}) quase marca.`;
    case "defesa":
      return `${quem} (${time}) chuta e ${e.outro ? nome(e.outro) : "o goleiro"} defende.`;
    case "bloqueio":
      return `Chute de ${quem} (${time}) travado pela defesa.`;
    case "falta":
      return `Falta de ${quem} (${time}) em ${nome(e.outro)}.`;
    case "cartao-amarelo":
      return `Cartão amarelo para ${quem} (${time}).`;
    case "cartao-vermelho":
      return e.valor === 2
        ? `Segundo amarelo: ${quem} (${time}) é expulso.`
        : `Cartão vermelho direto para ${quem} (${time}).`;
    case "escanteio":
      return `Escanteio para o ${time}.`;
    case "impedimento":
      return `Impedimento de ${quem} (${time}).`;
    case "penalti":
      return `Pênalti para o ${time}!`;
    case "penalti-perdido":
      return `${quem} perde o pênalti.`;
    case "lesao":
      return `${quem} (${time}) se machuca.`;
    case "substituicao":
      return `Substituição no ${time}: sai ${quem}, entra ${nome(e.outro)}.`;
    case "disputa-penaltis":
      return `${quem} (${time}) ${e.valor ? "converte" : "perde"}.${placar}`;
  }
}
