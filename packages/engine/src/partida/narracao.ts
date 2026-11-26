/**
 * Textos dos eventos para o modo clássico (linha de minutos) e para o resumo do jogo.
 */
import type { Evento, LadoCampo } from "./tipos";
import { chave, t } from "@newbras/textos";

/** Nomes dos estilos na narração da mudança tática (chaves da tradução). */
const NOME_ESTILO: Record<string, string> = {
  ataque: chave("ataque total"),
  equilibrado: chave("equilibrado"),
  cadenciado: chave("cadenciado"),
  "contra-ataque": chave("contra-ataque"),
};

export interface ContextoNarracao {
  nomes: ReadonlyMap<string, string>;
  times: Readonly<Record<LadoCampo, string>>;
}

/** Minuto como aparece na tela: 23', 45+2', 90+4', 105+1'. */
export function rotuloMinuto(e: Pick<Evento, "minuto" | "acrescimo" | "periodo">): string {
  if (e.periodo === 5) return t("Pên.");
  return e.acrescimo ? `${e.minuto}+${e.acrescimo}'` : `${e.minuto}'`;
}

export function textoDoEvento(e: Evento, c: ContextoNarracao): string {
  const nome = (id?: string) => (id ? (c.nomes.get(id) ?? id) : "");
  const time = e.time ? c.times[e.time] : "";
  const quem = nome(e.jogador);
  const placar = e.placar ? ` ${e.placar[0]} x ${e.placar[1]}` : "";
  switch (e.tipo) {
    case "inicio":
      return t("Começa o jogo.");
    case "intervalo":
      return e.periodo === 3 ? t("Fim do 1º tempo da prorrogação.") : t("Fim do 1º tempo.");
    case "reinicio":
      return e.periodo === 4 ? t("Começa o 2º tempo da prorrogação.") : t("Começa o 2º tempo.");
    case "fim-tempo-normal":
      return t("Fim do tempo normal. Vai ter prorrogação.");
    case "inicio-prorrogacao":
      return t("Começa a prorrogação.");
    case "fim":
      return t("Fim de jogo.{placar}", { placar });
    case "gol":
      return t("GOL do {time}! {quem}{outro}.{placar}", {
        time,
        quem,
        outro: e.outro ? t(", com passe de {nome}", { nome: nome(e.outro) }) : "",
        placar,
      });
    case "gol-contra":
      return t("Gol contra de {quem}.{placar}", { quem, placar });
    case "chute-fora":
      return t("{quem} ({time}) chuta para fora.", { quem, time });
    case "chute-trave":
      return t("Na trave! {quem} ({time}) quase marca.", { quem, time });
    case "defesa":
      return t("{quem} ({time}) chuta e {outro} defende.", {
        quem,
        time,
        outro: e.outro ? nome(e.outro) : t("o goleiro"),
      });
    case "bloqueio":
      return t("Chute de {quem} ({time}) travado pela defesa.", { quem, time });
    case "falta":
      return t("Falta de {quem} ({time}) em {nome}.", { quem, time, nome: nome(e.outro) });
    case "cartao-amarelo":
      return t("Cartão amarelo para {quem} ({time}).", { quem, time });
    case "cartao-vermelho":
      return e.valor === 2
        ? t("Segundo amarelo: {quem} ({time}) é expulso.", { quem, time })
        : t("Cartão vermelho direto para {quem} ({time}).", { quem, time });
    case "escanteio":
      return t("Escanteio para o {time}.", { time });
    case "impedimento":
      return t("Impedimento de {quem} ({time}).", { quem, time });
    case "penalti":
      return t("Pênalti para o {time}!", { time });
    case "penalti-perdido":
      return t("{quem} perde o pênalti.", { quem });
    case "lesao":
      return t("{quem} ({time}) se machuca.", { quem, time });
    case "substituicao":
      return t("Substituição no {time}: sai {quem}, entra {nome}.", {
        time,
        quem,
        nome: nome(e.outro),
      });
    case "acrescimo":
      return e.valor
        ? e.valor === 1
          ? t("Placa no alto: mais 1 minuto de acréscimo.")
          : t("Placa no alto: mais {minutos} minutos de acréscimo.", { minutos: e.valor })
        : t("Sem acréscimo: o juiz vai apitar.");
    case "mudanca-tatica": {
      const motivo = e.detalhe ? t(e.detalhe) : t("muda a tática");
      const tat = e.tatica;
      if (!tat) return t("{time} {motivo}.", { time, motivo });
      const partes = [
        tat.formacao === "original" ? t("formação original") : (tat.formacao ?? ""),
        tat.estilo ? t(NOME_ESTILO[tat.estilo] ?? tat.estilo) : "",
      ].filter(Boolean);
      return tat.umAMenos
        ? t("{time} {motivo} com um a menos ({tatica}).", {
            time,
            motivo,
            tatica: partes.join(", "),
          })
        : t("{time} {motivo} ({tatica}).", { time, motivo, tatica: partes.join(", ") });
    }
    case "disputa-penaltis":
      return e.valor
        ? t("{quem} ({time}) converte.{placar}", { quem, time, placar })
        : t("{quem} ({time}) perde.{placar}", { quem, time, placar });
  }
}
