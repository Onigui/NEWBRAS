/**
 * Conversas (pedido do dono, 27/11): jogadores que querem sair, querem jogar ou estão cansados, e a
 * diretoria cobrando resultados. Ficam no topo da carreira até o técnico responder (prazo de 7
 * dias); a resposta mexe na moral e no humor e pode virar promessa. Também o quadro da diretoria
 * (confiança, meta e promessas) da aba Início.
 */
import {
  capitaoDe,
  DA_IMPRENSA,
  dataCurta,
  faixaDaTorcida,
  torcidaDe,
  diretoriaDe,
  faixaDaConfianca,
  OPCOES_DA_CONVERSA,
  posicaoAtualNaLiga,
  responderConversa,
  type Carreira,
  type Conversa,
  type OpcaoConversa,
} from "@newbras/engine";
import { locale, t } from "@newbras/textos";
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
  "dar-aumento": t("Dou o aumento"),
  "aumento-depois": t("Na renovação a gente conversa"),
  "negar-aumento": t("Não vou dar aumento"),
  "volta-posicao": t("Vai voltar para a sua posição"),
  "time-precisa": t("O time precisa de você aí"),
  "dar-bracadeira": t("A braçadeira é sua"),
  "manter-capitao": t("O capitão continua o mesmo"),
  "punir-primeiro": t("Punir {jogador}"),
  "punir-segundo": t("Punir {jogador}"),
  reunir: t("Reunir os dois e conversar"),
  "deixar-briga": t("Deixar para lá"),
  confiante: t("Confiante: vamos vencer"),
  cauteloso: t("Cauteloso: respeito o adversário"),
  provocador: t("Provocar o adversário"),
  "elogiar-time": t("Elogiar o time"),
  "pes-no-chao": t("Pés no chão, ainda não ganhamos nada"),
  "assumir-culpa": t("A culpa é minha"),
  "cobrar-elenco": t("Cobrar o elenco em público"),
  "culpar-arbitragem": t("Culpar a arbitragem"),
};

const DICA: Partial<Record<OpcaoConversa, string>> = {
  negociar: t("Vai para a lista de venda; tirar depois é quebrar a promessa."),
  fica: t("A moral cai."),
  "prometer-minutos": t("Ele precisa jogar 2 dos próximos 5 jogos oficiais."),
  esperar: t("A moral cai um pouco."),
  emprestar: t("Vai para a lista de empréstimo."),
  poupar: t("Ele não pode jogar mais de 45 minutos no próximo jogo oficial."),
  "precisa-jogar": t("A moral cai um pouco."),
  "dar-aumento": t("O salário vai ao de mercado até o fim do contrato. A moral sobe."),
  "aumento-depois": t("A moral cai um pouco."),
  "negar-aumento": t("A moral cai bastante; ele não volta a pedir tão cedo."),
  "volta-posicao": t("Ele precisa começar 2 jogos na posição dele; fora dela, a promessa quebra."),
  "time-precisa": t("A moral cai um pouco."),
  "dar-bracadeira": t("Ele vira capitão; o capitão atual perde moral."),
  "manter-capitao": t("A moral dele cai um pouco."),
  "punir-primeiro": t("O punido perde moral; o outro e o time ganham."),
  "punir-segundo": t("O punido perde moral; o outro e o time ganham."),
  reunir: t("Os dois perdem um pouco de moral; o time ganha um pouco."),
  "deixar-briga": t("A moral do time cai."),
  confiante: t("Moral do time +3. Vitória anima a torcida; derrota a irrita."),
  cauteloso: t("Moral do time +1, quase sem risco."),
  provocador: t("Moral do time +4. Vitória é festa; derrota irrita a torcida e a diretoria."),
  "elogiar-time": t("Moral do time +3."),
  "pes-no-chao": t("Moral +1, torcida e diretoria gostam."),
  "assumir-culpa": t("Moral do time +3, a torcida gosta; a diretoria, um pouco menos."),
  "cobrar-elenco": t("Moral do time −4; torcida e diretoria gostam."),
  "culpar-arbitragem": t("A torcida gosta; a diretoria não."),
};

const clube = (mundo: MundoMontado["mundo"], id?: string) =>
  id ? (mundo.clube(id)?.nomeCurto ?? id) : "";

/** Rótulo do botão: na briga, o nome de quem é punido. */
function rotulo(mundo: MundoMontado["mundo"], conv: Conversa, o: OpcaoConversa): string {
  if (o === "punir-primeiro" || o === "punir-segundo") {
    const id = o === "punir-primeiro" ? conv.jogador : conv.outro;
    return t("Punir {jogador}", { jogador: id ? (mundo.jogador(id)?.nome ?? id) : "" });
  }
  return ROTULO[o];
}

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
    case "pede-aumento":
      return t("{jogador}: “Ganho {salario} por mês, bem abaixo do que valho. Quero {pedido}.”", {
        jogador,
        salario: Number(p.salario ?? 0).toLocaleString(locale()),
        pedido: Number(p.pedido ?? 0).toLocaleString(locale()),
      });
    case "posicao":
      return t("{jogador}: “Já são {jogos} jogos como {posicao}. Essa não é a minha posição.”", {
        jogador,
        jogos: p.jogos ?? 0,
        posicao: p.posicao ?? "",
      });
    case "quer-ser-capitao":
      return t(
        "{jogador}: “Sou um dos líderes deste grupo. Quero ser o capitão no lugar de {capitao}.”",
        { jogador, capitao: conv.outro ? (mundo.jogador(conv.outro)?.nome ?? conv.outro) : "" },
      );
    case "briga":
      return t("{jogador} e {outro} brigaram no treino. O vestiário espera a sua decisão.", {
        jogador,
        outro: conv.outro ? (mundo.jogador(conv.outro)?.nome ?? conv.outro) : "",
      });
    case "imprensa-antes":
      return t("Imprensa: “Como chega o time para o jogo contra o {adversario}?”", {
        adversario: clube(mundo, conv.adversario),
      });
    case "imprensa-vitoria":
      return t(
        "Imprensa: “Grande vitória por {pro} a {contra} sobre o {adversario}. O que achou?”",
        {
          pro: p.pro ?? 0,
          contra: p.contra ?? 0,
          adversario: clube(mundo, conv.adversario),
        },
      );
    case "imprensa-derrota":
      return t("Imprensa: “Derrota por {contra} a {pro} para o {adversario}. O que deu errado?”", {
        pro: p.pro ?? 0,
        contra: p.contra ?? 0,
        adversario: clube(mundo, conv.adversario),
      });
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
        <div
          key={conv.id}
          className={`flex flex-col gap-1 ${DA_IMPRENSA.has(conv.tipo) ? "border-l-2 border-canarinho pl-2" : ""}`}
        >
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
                {rotulo(mundo, conv, o)}
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
      <Torcida c={c} />
      <p className="mt-2 text-xs">
        {t("Capitão: {jogador}", {
          jogador: (() => {
            const id = capitaoDe(c, mundo);
            return id ? (mundo.jogador(id)?.nome ?? id) : "—";
          })(),
        })}
      </p>
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
                      : p.tipo === "posicao"
                        ? t("{jogador}: jogar na posição dele ({jogou} de 2 jogos)", {
                            jogador: nome,
                            jogou: p.jogou,
                          })
                        : t("{jogador}: ser negociado (manter na lista de venda)", {
                            jogador: nome,
                          })}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

const NOME_DA_TORCIDA = {
  empolgada: t("empolgada"),
  apoia: t("apoia"),
  desconfiada: t("desconfiada"),
  revoltada: t("revoltada"),
} as const;

/** Apoio da torcida: sobe com vitórias e boas entrevistas e empurra o time em casa. */
function Torcida({ c }: { c: Carreira }) {
  const v = torcidaDe(c);
  const faixa = faixaDaTorcida(v);
  const cor =
    faixa === "empolgada"
      ? "bg-[#7ed37a]"
      : faixa === "apoia"
        ? "bg-canarinho"
        : faixa === "desconfiada"
          ? "bg-[#ffa64d]"
          : "bg-[#ff8a7a]";
  return (
    <>
      <p className="mt-2">
        {t("Torcida: {valor} ({faixa})", { valor: Math.round(v), faixa: NOME_DA_TORCIDA[faixa] })}
      </p>
      <div className="mt-1 h-1.5 w-full max-w-60 rounded bg-white/10">
        <div className={`h-1.5 rounded ${cor}`} style={{ width: `${v}%` }} />
      </div>
    </>
  );
}
