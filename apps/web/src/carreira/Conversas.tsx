/**
 * Conversas (pedido do dono, 27/11): jogadores que querem sair, querem jogar ou estão cansados, e a
 * diretoria cobrando resultados. Ficam no topo da carreira até o técnico responder (prazo de 7
 * dias); a resposta mexe na moral e no humor e pode virar promessa. Também o quadro da diretoria
 * (confiança, meta e promessas) da aba Início.
 */
import {
  dataCurta,
  diretoriaDe,
  faixaDaConfianca,
  OPCOES_DA_CONVERSA,
  posicaoAtualNaLiga,
  responderConversa,
  type Carreira,
  type Conversa,
  type OpcaoConversa,
} from "@newbras/engine";
import { t } from "@newbras/textos";
import type { MundoMontado } from "./useCarreira";

const botao =
  "rounded border border-placar-borda px-2 py-0.5 text-xs hover:border-canarinho hover:text-canarinho";

const ROTULO: Record<OpcaoConversa, string> = {
  negociar: t("Vou te negociar"),
  fica: t("Você fica, conto com você"),
  "prometer-minutos": t("Prometo mais minutos"),
  esperar: t("Espere a sua vez"),
  emprestar: t("Vamos te emprestar para jogar"),
  poupar: t("Vou te poupar no próximo jogo"),
  "precisa-jogar": t("Preciso de você em campo"),
  entendido: t("Entendido"),
};

const DICA: Partial<Record<OpcaoConversa, string>> = {
  negociar: t("Vai para a lista de venda; tirar depois é quebrar a promessa."),
  fica: t("A moral cai."),
  "prometer-minutos": t("Ele precisa jogar 2 dos próximos 5 jogos oficiais."),
  esperar: t("A moral cai um pouco."),
  emprestar: t("Vai para a lista de empréstimo."),
  poupar: t("Ele não pode jogar mais de 45 minutos no próximo jogo oficial."),
  "precisa-jogar": t("A moral cai um pouco."),
};

function texto(c: Carreira, mundo: MundoMontado["mundo"], conv: Conversa): string {
  const jogador = conv.jogador ? (mundo.jogador(conv.jogador)?.nome ?? conv.jogador) : "";
  const p = conv.params ?? {};
  switch (conv.tipo) {
    case "quer-sair":
      return t("{jogador}: “Não estou feliz aqui. Quero ser negociado.”", { jogador });
    case "quer-jogar":
      return t(
        "{jogador}: “Já são {jogos} jogos sem entrar em campo. Quero uma chance de mostrar o meu futebol.”",
        { jogador, jogos: p.jogos ?? 0 },
      );
    case "cansado":
      return t(
        "{jogador}: “Joguei com {condicao}% de condição. Estou no limite e preciso descansar.”",
        { jogador, condicao: p.condicao ?? 0 },
      );
    case "diretoria-cobra":
      return Number(p.posicao) && Number(p.meta)
        ? t(
            "Diretoria: “Os resultados não estão bons. O time está em {posicao}º e a meta é até o {meta}º. Queremos reação.”",
            { posicao: p.posicao ?? 0, meta: p.meta ?? 0 },
          )
        : t("Diretoria: “Os resultados não estão bons. Queremos reação.”");
    case "diretoria-ultimato":
      return t(
        "Diretoria: “A paciência acabou. Ou o time reage nos próximos jogos, ou vamos repensar o comando.”",
      );
  }
  return c.tecnico;
}

export function Conversas({
  c,
  montado,
  mudar,
}: {
  c: Carreira;
  montado: MundoMontado;
  mudar: (f: (c: Carreira) => Carreira) => void;
}) {
  const { mundo } = montado;
  const conversas = c.conversas ?? [];
  if (!conversas.length) return null;
  return (
    <section className="flex flex-col gap-2 rounded-md border border-[#7cc4f5]/40 bg-[#7cc4f5]/10 px-3 py-2 text-sm">
      {conversas.map((conv) => (
        <div key={conv.id} className="flex flex-col gap-1">
          <p className="text-[#bfe3fb]">
            {texto(c, mundo, conv)}{" "}
            <span className="text-xs text-suave">
              {t("(responda até {data})", { data: dataCurta(conv.prazo) })}
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-1">
            {OPCOES_DA_CONVERSA[conv.tipo].map((o) => (
              <button
                key={o}
                type="button"
                className={botao}
                title={DICA[o]}
                onClick={() => mudar((x) => responderConversa(x, mundo, conv.id, o))}
              >
                {ROTULO[o]}
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

const NOME_DA_FAIXA = {
  prestigiado: t("prestigiado"),
  estavel: t("estável"),
  pressionado: t("pressionado"),
  ameacado: t("ameaçado"),
} as const;

/** Quadro da diretoria na aba Início: confiança, meta da liga e promessas em andamento. */
export function QuadroDaDiretoria({ c, montado }: { c: Carreira; montado: MundoMontado }) {
  const { mundo } = montado;
  const d = diretoriaDe(c);
  const faixa = faixaDaConfianca(d.confianca);
  const posicao = posicaoAtualNaLiga(c, mundo);
  const cor =
    faixa === "prestigiado"
      ? "bg-[#7ed37a]"
      : faixa === "estavel"
        ? "bg-canarinho"
        : faixa === "pressionado"
          ? "bg-[#ffa64d]"
          : "bg-[#ff8a7a]";
  const promessas = c.promessas ?? [];
  return (
    <div className="rounded border border-placar-borda p-3 text-sm">
      <p className="text-xs font-bold text-suave">{t("Diretoria")}</p>
      <p className="mt-1">
        {t("Confiança: {valor} ({faixa})", { valor: d.confianca, faixa: NOME_DA_FAIXA[faixa] })}
      </p>
      <div className="mt-1 h-1.5 w-full max-w-60 rounded bg-white/10">
        <div className={`h-1.5 rounded ${cor}`} style={{ width: `${d.confianca}%` }} />
      </div>
      {(c.crise?.mesesAtrasados ?? 0) > 0 && (
        <p className="mt-1 text-[#ff8a7a]">
          {t("Salários atrasados há {n} mês(es): a diretoria está furiosa.", {
            n: c.crise?.mesesAtrasados ?? 0,
          })}
        </p>
      )}
      {d.metas && (
        <p className="mt-2">
          {t("Meta na liga: até o {meta}º lugar.", { meta: d.metas.posicao })}{" "}
          {posicao && posicao.jogos > 0 && (
            <span
              className={posicao.posicao <= d.metas.posicao ? "text-[#7ed37a]" : "text-[#ffc38a]"}
            >
              {t("Agora: {posicao}º.", { posicao: posicao.posicao })}
            </span>
          )}
        </p>
      )}
      {promessas.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-bold text-suave">{t("Promessas")}</p>
          <ul className="text-xs">
            {promessas.map((p) => {
              const nome = mundo.jogador(p.jogador)?.nome ?? p.jogador;
              return (
                <li key={p.jogador}>
                  {p.tipo === "minutos"
                    ? t(
                        "{jogador}: mais minutos ({jogou} de 2 jogos, {jogos} de 5 já disputados)",
                        {
                          jogador: nome,
                          jogou: p.jogou,
                          jogos: p.jogos,
                        },
                      )
                    : p.tipo === "poupar"
                      ? t("{jogador}: descanso no próximo jogo oficial", { jogador: nome })
                      : t("{jogador}: ser negociado (manter na lista de venda)", { jogador: nome })}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
