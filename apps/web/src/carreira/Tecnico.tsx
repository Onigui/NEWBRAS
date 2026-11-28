/**
 * Carreira do técnico (etapa 15a): o painel de convites e de demissão no topo da carreira e o
 * quadro do técnico (reputação e passagens) na aba Início.
 */
import {
  aceitarConvite,
  clubeOuSelecao,
  dataCurta,
  faixaDaReputacao,
  nivelAlcancado,
  perfilDe,
  recusarConvite,
  type Carreira,
  type FaixaDeReputacao,
} from "@newbras/engine";
import { t } from "@newbras/textos";
import { Escudo } from "../components/Escudo";
import type { MundoMontado } from "./useCarreira";

const botao =
  "rounded border border-placar-borda px-2 py-0.5 text-xs hover:border-canarinho hover:text-canarinho";

const NOME_DA_FAIXA: Record<FaixaDeReputacao, string> = {
  municipal: t("municipal"),
  estadual: t("estadual"),
  nacional: t("nacional"),
  continental: t("continental"),
  mundial: t("mundial"),
  lenda: t("lenda"),
};

/** Convites de emprego e a escolha depois da demissão. */
export function PainelDeEmprego({
  c,
  montado,
  mudar,
}: {
  c: Carreira;
  montado: MundoMontado;
  mudar: (f: (c: Carreira) => Carreira) => void;
}) {
  const { mundo } = montado;
  const p = perfilDe(c, mundo);
  const convites = (p.convites ?? []).filter((x) => p.demitido || x.ate >= c.data);
  if (!convites.length && !p.demitido) return null;
  const cor = p.demitido
    ? "border-[#ff8a7a]/50 bg-[#ff8a7a]/10"
    : "border-[#7ed37a]/40 bg-[#7ed37a]/10";
  return (
    <section className={`flex flex-col gap-2 rounded-md border px-3 py-2 text-sm ${cor}`}>
      {p.demitido && (
        <p className="font-bold text-[#ffb3a8]">
          {t("Você foi demitido do {clube}. Escolha o próximo clube para seguir a carreira.", {
            clube: mundo.clube(p.demitido.clube)?.nomeCurto ?? p.demitido.clube,
          })}
        </p>
      )}
      {convites.map((x) => {
        const clube = clubeOuSelecao(mundo, x.clube);
        if (!clube) return null;
        if (x.tipo === "selecao") {
          if (p.demitido) return null;
          return (
            <div key={x.id} className="flex flex-wrap items-center gap-2">
              <Escudo clube={clube} tamanho={20} />
              <span className="flex-1">
                {t(
                  "Convite: a federação de {pais} (seleção de força {forca}) quer você como técnico, junto com o clube. Responda até {ate}.",
                  { pais: clube.nome, forca: clube.nivel, ate: dataCurta(x.ate) },
                )}
              </span>
              <button
                type="button"
                className={botao}
                disabled={!!c.selecao}
                title={c.selecao ? t("Deixe a seleção atual antes de assumir outra.") : undefined}
                onClick={() => mudar((y) => aceitarConvite(y, mundo, x.id))}
              >
                {t("Assumir a seleção")}
              </button>
              <button
                type="button"
                className={botao}
                onClick={() => mudar((y) => recusarConvite(y, mundo, x.id))}
              >
                {t("Recusar")}
              </button>
            </div>
          );
        }
        return (
          <div key={x.id} className="flex flex-wrap items-center gap-2">
            <Escudo clube={clube} tamanho={20} />
            <span className="flex-1">
              {p.demitido
                ? t("{clube} ({pais}, nível {nivel}) quer você.", {
                    clube: clube.nome,
                    pais: clube.pais,
                    nivel: clube.nivel,
                  })
                : t(
                    "Convite: o {clube} ({pais}, nível {nivel}) quer você como técnico. Responda até {ate}.",
                    {
                      clube: clube.nome,
                      pais: clube.pais,
                      nivel: clube.nivel,
                      ate: dataCurta(x.ate),
                    },
                  )}
            </span>
            <button
              type="button"
              className={botao}
              onClick={() => {
                if (
                  p.demitido ||
                  window.confirm(
                    t(
                      "Deixar o {atual} e assumir o {clube}? O trabalho no clube atual acaba aqui.",
                      {
                        atual: mundo.clube(c.clube)?.nomeCurto ?? c.clube,
                        clube: clube.nomeCurto,
                      },
                    ),
                  )
                )
                  mudar((y) => aceitarConvite(y, mundo, x.id));
              }}
            >
              {t("Assumir")}
            </button>
            {!p.demitido && (
              <button
                type="button"
                className={botao}
                onClick={() => mudar((y) => recusarConvite(y, mundo, x.id))}
              >
                {t("Recusar")}
              </button>
            )}
          </div>
        );
      })}
    </section>
  );
}

/** Reputação e passagens do técnico (aba Início). */
export function QuadroDoTecnico({ c, montado }: { c: Carreira; montado: MundoMontado }) {
  const { mundo } = montado;
  const p = perfilDe(c, mundo);
  const faixa = faixaDaReputacao(p.reputacao);
  return (
    <div className="rounded border border-placar-borda p-3 text-sm">
      <p className="text-xs font-bold text-suave">{t("Técnico")}</p>
      <p className="mt-1">
        {t("{tecnico}: reputação {valor} ({faixa}).", {
          tecnico: c.tecnico,
          valor: Math.round(p.reputacao),
          faixa: NOME_DA_FAIXA[faixa],
        })}
      </p>
      <div className="mt-1 h-1.5 w-full max-w-60 rounded bg-white/10">
        <div className="h-1.5 rounded bg-[#7cc4f5]" style={{ width: `${p.reputacao}%` }} />
      </div>
      <p className="mt-1 text-xs text-suave">
        {t("Convites chegam de clubes até o nível {nivel}.", {
          nivel: nivelAlcancado(p.reputacao),
        })}
      </p>
      {c.selecao && (
        <p className="mt-1 text-xs">
          {t("Também comanda a seleção de {pais} (confiança da federação {confianca}).", {
            pais: mundo.pais(c.selecao.pais)?.nome ?? c.selecao.pais,
            confianca: Math.round(c.selecao.confianca),
          })}
        </p>
      )}
      <ul className="mt-2 flex flex-col gap-0.5 text-xs">
        {[...p.passagens].reverse().map((x) => (
          <li key={`${x.clube}-${x.inicio}`}>
            {t("{clube} ({inicio} a {fim}): {jogos} jogos, {v}V {e}E {d}D", {
              clube: mundo.clube(x.clube)?.nomeCurto ?? x.clube,
              inicio: dataCurta(x.inicio),
              fim: x.fim ? dataCurta(x.fim) : t("hoje"),
              jogos: x.jogos,
              v: x.vitorias,
              e: x.empates,
              d: x.derrotas,
            })}
            {x.titulos.length > 0 && (
              <span className="text-canarinho"> · {x.titulos.join(", ")}</span>
            )}
            {x.motivo === "demitido" && <span className="text-[#ff8a7a]"> · {t("demitido")}</span>}
          </li>
        ))}
        {[...(c.selecoesAnteriores ?? [])].reverse().map((x) => (
          <li key={`${x.pais}-${x.inicio}`}>
            {t("Seleção de {pais} ({inicio} a {fim}): {jogos} jogos, {v}V {e}E {d}D", {
              pais: mundo.pais(x.pais)?.nome ?? x.pais,
              inicio: dataCurta(x.inicio),
              fim: dataCurta(x.fim),
              jogos: x.jogos,
              v: x.vitorias,
              e: x.empates,
              d: x.derrotas,
            })}
            {x.titulos.length > 0 && (
              <span className="text-canarinho"> · {x.titulos.join(", ")}</span>
            )}
            {x.motivo === "demitido" && <span className="text-[#ff8a7a]"> · {t("demitido")}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
