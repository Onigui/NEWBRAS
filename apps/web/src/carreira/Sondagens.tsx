/**
 * Jogadores sondados por outros clubes (pedido do dono, 27/11): fica no topo da carreira até o
 * técnico decidir. Primeiro o aviso da diretoria; depois da conversa, o jogador espera a renovação
 * até o prazo. Dá para renovar aqui mesmo ou liberar o jogador para acertar com o outro clube.
 */
import {
  contratoDe,
  dataCurta,
  liberarJogador,
  propostaDeRenovacao,
  renovarContrato,
  type Carreira,
} from "@newbras/engine";
import { locale, t } from "@newbras/textos";
import type { MundoMontado } from "./useCarreira";

const botao =
  "rounded border border-placar-borda px-2 py-0.5 text-xs hover:border-canarinho hover:text-canarinho";

export function Sondagens({
  c,
  montado,
  mudar,
}: {
  c: Carreira;
  montado: MundoMontado;
  mudar: (f: (c: Carreira) => Carreira) => void;
}) {
  const { mundo } = montado;
  const sondagens = (c.sondagens ?? []).filter((s) => !s.liberado);
  if (!sondagens.length) return null;
  const duracao = (m: number) =>
    m < 12 ? t("{n} meses", { n: m }) : m === 12 ? t("1 ano") : t("{n} anos", { n: m / 12 });
  return (
    <section className="flex flex-col gap-2 rounded-md border border-[#ffa64d]/40 bg-[#ffa64d]/10 px-3 py-2 text-sm">
      {sondagens.map((s) => {
        const j = mundo.jogador(s.jogador);
        const clube = mundo.clube(s.clube)?.nomeCurto ?? s.clube;
        if (!j) return null;
        const contrato = contratoDe(c, mundo, s.jogador);
        if (s.conversa > c.data)
          return (
            <p key={s.jogador} className="text-[#ffc38a]">
              {t(
                "A diretoria avisa: o {clube} está sondando {jogador} (contrato até {fim}). Renove pela ficha dele no Plantel para segurá-lo.",
                { clube, jogador: j.nome, fim: contrato ? dataCurta(contrato.fim) : "?" },
              )}
            </p>
          );
        const p = propostaDeRenovacao(c, mundo, s.jogador);
        return (
          <div key={s.jogador} className="flex flex-col gap-1">
            <p className="text-[#ffc38a]">
              <span className="font-bold">{j.nome}:</span>{" "}
              {t(
                "“Tenho uma proposta do {clube}. Quero saber se o clube conta comigo: espero a renovação até {prazo}.”",
                { clube, prazo: dataCurta(s.prazo) },
              )}
            </p>
            <div className="flex flex-wrap items-center gap-1">
              {p.recusa ? (
                <span className="text-xs text-suave">
                  {p.recusa === "insatisfeito"
                    ? t("Insatisfeito, ele não quer renovar: venda agora ou deixe sair.")
                    : p.recusa === "salarios-atrasados"
                      ? t("Com salários atrasados, ele não renova: pague os atrasados primeiro.")
                      : t("Ele não quer renovar.")}
                </span>
              ) : (
                <>
                  <span className="text-xs text-suave">
                    {t("Renovar por {salario} por mês:", {
                      salario: p.salario.toLocaleString(locale()),
                    })}
                  </span>
                  {p.meses.map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={botao}
                      onClick={() => mudar((x) => renovarContrato(x, mundo, s.jogador, m))}
                    >
                      {duracao(m)}
                    </button>
                  ))}
                </>
              )}
              <button
                type="button"
                className={botao}
                onClick={() => mudar((x) => liberarJogador(x, mundo, s.jogador))}
              >
                {t("Liberar para o {clube}", { clube })}
              </button>
            </div>
          </div>
        );
      })}
    </section>
  );
}
