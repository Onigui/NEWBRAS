/**
 * Avanço dia a dia até o próximo jogo: o calendário vira uma folha por vez e as notícias chegam na
 * hora, como no modo carreira dos jogos grandes. O técnico pode parar a qualquer momento para agir
 * na data, ou pular tudo de uma vez (com confirmação). Para sozinho no dia do jogo e quando algo
 * novo pede resposta (proposta, conversa, sondagem, convite, decisão).
 */
import { useEffect, useState } from "react";
import {
  avancarAteJogo,
  avancarDia,
  compromissoDoDia,
  dataPorExtenso,
  diasEntre,
  proximoCompromisso,
  type Carreira,
  type Mundo,
  type Noticia,
} from "@newbras/engine";
import { t } from "@newbras/textos";
import { Botao } from "../editor/ui";

export type VelocidadeDoAvanco = "lenta" | "normal" | "rapida";
/** Quanto tempo cada dia fica na tela antes de virar a folha. */
export const ESPERA: Record<VelocidadeDoAvanco, number> = {
  lenta: 5000,
  normal: 3000,
  rapida: 1000,
};

/** O que pede a atenção do técnico: quando cresce, o avanço para. */
function pendencias(c: Carreira): number {
  return (
    (c.propostas?.length ?? 0) +
    (c.conversas?.length ?? 0) +
    (c.sondagens?.length ?? 0) +
    (c.perfil?.convites?.length ?? 0) +
    (c.convitesAmistosos?.length ?? 0)
  );
}

export function useAvanco(
  c: Carreira,
  mundo: Mundo,
  mudar: (f: (c: Carreira) => Carreira) => void,
) {
  const [ativo, setAtivo] = useState(false);
  const [velocidade, setVelocidade] = useState<VelocidadeDoAvanco>("normal");
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [motivo, setMotivo] = useState<string | null>(null);
  const [inicio, setInicio] = useState<string | null>(null);

  useEffect(() => {
    if (!ativo) return;
    const id = window.setTimeout(() => {
      if (compromissoDoDia(c)) {
        setAtivo(false);
        setMotivo(t("Chegou o dia do jogo."));
        return;
      }
      const antes = pendencias(c);
      const r = avancarDia(c, mundo);
      mudar(() => r.carreira);
      if (r.novidades.length) setNoticias((n) => [...r.novidades, ...n].slice(0, 40));
      const parar =
        r.parouPor === "decisao"
          ? t("Uma decisão espera por você.")
          : compromissoDoDia(r.carreira)
            ? t("Chegou o dia do jogo.")
            : pendencias(r.carreira) > antes
              ? t("Algo novo pede sua resposta: veja as novidades abaixo.")
              : null;
      if (parar) {
        setAtivo(false);
        setMotivo(parar);
      }
    }, ESPERA[velocidade]);
    return () => window.clearTimeout(id);
  }, [ativo, c, mundo, mudar, velocidade]);

  return {
    ativo,
    velocidade,
    setVelocidade,
    noticias,
    motivo,
    inicio,
    comecar: () => {
      setNoticias([]);
      setMotivo(null);
      setInicio(c.data);
      setAtivo(true);
    },
    parar: () => {
      setAtivo(false);
      setMotivo(t("Avanço parado: faça o que precisar e continue quando quiser."));
    },
    continuar: () => {
      setMotivo(null);
      setAtivo(true);
    },
    pularTudo: () => {
      setAtivo(false);
      const r = avancarAteJogo(c, mundo);
      mudar(() => r.carreira);
      setNoticias((n) => [...r.novidades, ...n].slice(0, 40));
      setMotivo(t("Pulou até o jogo."));
    },
    fechar: () => {
      setNoticias([]);
      setMotivo(null);
      setInicio(null);
    },
  };
}

export type Avanco = ReturnType<typeof useAvanco>;

/** Painel do avanço: a folha do calendário, as notícias que chegam e os controles. */
export function PainelDoAvanco({ c, avanco }: { c: Carreira; avanco: Avanco }) {
  const [confirmar, setConfirmar] = useState(false);
  if (!avanco.ativo && !avanco.inicio) return null;
  const proximo = proximoCompromisso(c);
  const faltam = proximo ? diasEntre(c.data, proximo.data) : null;
  const [semana, ...resto] = dataPorExtenso(c.data).split(", ");
  const dia = Number(c.data.slice(8, 10));
  return (
    <section
      className="flex flex-col gap-3 rounded-md border-2 border-canarinho/50 bg-placar p-4 sm:flex-row"
      aria-live="polite"
    >
      <div className="flex shrink-0 flex-col items-center gap-2 [perspective:400px]">
        <div
          key={c.data}
          className="folha-virando flex w-28 flex-col overflow-hidden rounded-md bg-cal text-center text-placar shadow-lg"
        >
          <span className="bg-[#c0392b] py-0.5 text-xs font-bold text-white">{semana}</span>
          <span className="font-placar text-5xl leading-tight font-extrabold">{dia}</span>
          <span className="pb-1 text-xs">{resto.join(", ").replace(/^\d+ de /, "")}</span>
        </div>
        {avanco.ativo && (
          <div className="h-1 w-28 overflow-hidden rounded bg-white/10" aria-hidden>
            <div
              key={`${c.data}:${avanco.velocidade}`}
              className="dia-passando h-1 bg-canarinho"
              style={{ animationDuration: `${ESPERA[avanco.velocidade]}ms` }}
            />
          </div>
        )}
        {faltam !== null && (
          <p className="text-xs text-suave">
            {faltam > 0 ? t("{n} dias para o próximo jogo", { n: faltam }) : t("Hoje tem jogo")}
          </p>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-placar text-2xl font-bold">
            {avanco.ativo ? t("Avançando o calendário…") : t("Avanço do calendário")}
          </h2>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <select
              aria-label={t("Velocidade do avanço")}
              className="rounded border border-placar-borda bg-placar px-2 py-1 text-sm"
              value={avanco.velocidade}
              onChange={(e) => avanco.setVelocidade(e.target.value as VelocidadeDoAvanco)}
            >
              <option value="lenta">{t("Lenta")}</option>
              <option value="normal">{t("Normal")}</option>
              <option value="rapida">{t("Rápida")}</option>
            </select>
            {avanco.ativo ? (
              <Botao variante="primario" onClick={avanco.parar}>
                {t("Parar aqui")}
              </Botao>
            ) : (
              !compromissoDoDia(c) &&
              proximo && (
                <Botao variante="primario" onClick={avanco.continuar}>
                  {t("Continuar avançando")}
                </Botao>
              )
            )}
            {!compromissoDoDia(c) && proximo && (
              <Botao onClick={() => setConfirmar(true)}>{t("Pular tudo até o jogo")}</Botao>
            )}
            {!avanco.ativo && <Botao onClick={avanco.fechar}>{t("Fechar")}</Botao>}
          </div>
        </div>
        {confirmar && (
          <div
            role="alertdialog"
            className="flex flex-wrap items-center gap-2 rounded border border-[#ffa64d]/50 bg-[#ffa64d]/10 px-3 py-2 text-sm"
          >
            <span className="flex-1">
              {t(
                "Pular tudo leva direto ao dia do jogo, sem parar nas notícias, propostas e conversas do caminho. Elas continuam valendo, mas você não terá a chance de agir em cada dia. Pular mesmo assim?",
              )}
            </span>
            <Botao
              variante="primario"
              onClick={() => {
                setConfirmar(false);
                avanco.pularTudo();
              }}
            >
              {t("Pular tudo")}
            </Botao>
            <Botao onClick={() => setConfirmar(false)}>{t("Cancelar")}</Botao>
          </div>
        )}
        {avanco.motivo && <p className="text-sm text-canarinho">{avanco.motivo}</p>}
        <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto text-sm">
          {avanco.noticias.length === 0 && (
            <li className="text-suave">{t("Nenhuma novidade por enquanto.")}</li>
          )}
          {avanco.noticias.map((n, i) => (
            <li
              key={`${n.data}-${i}-${n.texto}`}
              className="noticia-chegando border-b border-white/5 pb-1"
            >
              <span className="mr-2 text-xs text-suave">
                {n.data.slice(8, 10)}/{n.data.slice(5, 7)}
              </span>
              {t(n.texto, n.params)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
