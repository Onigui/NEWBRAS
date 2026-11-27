/**
 * Tela da carreira (Fases 8 e 9): data e próximo jogo no topo, abas de início, plantel, escalação,
 * calendário e jogos, e o dia de jogo (escalação e partida ao vivo).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  avancarAteJogo,
  avancarDia,
  avisoPoupar,
  compromissoDoDia,
  dataCurta,
  dataPorExtenso,
  diasEntre,
  elencoParaPartida,
  escalacaoDoTecnico,
  estadoDe,
  FORMACOES,
  FORMATO_CARREIRA,
  nomeTemporada,
  partidaDoCompromisso,
  plantaoDoCompromisso,
  proximoCompromisso,
  registrarJogo,
  agendaCompleta,
  atualizarCarreira,
  nomeDoCompromisso,
  suspensosNaCompeticao,
  foraPelaSelecao,
  mundoNaData,
  type Carreira as CarreiraT,
  type Compromisso,
  type Concentracao,
  type Estilo,
  type JogoSimulado,
  type Marcacao,
  type OpcoesPartida,
} from "@newbras/engine";
import { EditorEscalacao, type EscalacaoEditavel } from "../components/EditorEscalacao";
import { Escudo } from "../components/Escudo";
import { Botao, Campo, estiloCampo } from "../editor/ui";
import { AoVivo } from "../partida/AoVivo";
import { Calendario } from "./Calendario";
import { Competicoes } from "./Competicoes";
import { Jogos } from "./Jogos";
import { Plantao } from "./Plantao";
import { Plantel } from "./Plantel";
import { Selecoes } from "./Selecoes";
import { Base } from "./Base";
import { Mercado } from "./Mercado";
import { Financas } from "./Financas";
import { Sondagens } from "./Sondagens";
import { Conversas, QuadroDaDiretoria } from "./Conversas";
import { PainelDeEmprego, QuadroDoTecnico } from "./Tecnico";
import { exportarCarreira } from "./salvamentos";
import { TelaDeEspera } from "./TelaDeEspera";
import { useCarreira, type MundoMontado } from "./useCarreira";
import { t, locale } from "@newbras/textos";

type Aba =
  | "inicio"
  | "plantel"
  | "escalacao"
  | "calendario"
  | "jogos"
  | "competicoes"
  | "selecoes"
  | "base"
  | "mercado"
  | "financas";
const ABAS: { id: Aba; nome: string; tecla: string }[] = [
  { id: "inicio", nome: t("Início"), tecla: "1" },
  { id: "plantel", nome: t("Plantel"), tecla: "2" },
  { id: "escalacao", nome: t("Escalação"), tecla: "3" },
  { id: "calendario", nome: t("Calendário"), tecla: "4" },
  { id: "jogos", nome: t("Jogos"), tecla: "5" },
  { id: "competicoes", nome: t("Competições"), tecla: "6" },
  { id: "selecoes", nome: t("Seleções"), tecla: "7" },
  { id: "base", nome: t("Base"), tecla: "8" },
  { id: "mercado", nome: t("Mercado"), tecla: "9" },
  { id: "financas", nome: t("Finanças"), tecla: "0" },
];

const NOME_ESTILO: Record<Estilo, string> = {
  equilibrado: t("Equilibrado"),
  ataque: t("Ataque total"),
  "contra-ataque": t("Contra-ataque"),
  cadenciado: t("Cadenciado (toque de bola)"),
};
const NOME_MARCACAO: Record<Marcacao, string> = {
  leve: t("Leve"),
  pesada: t("Pesada"),
  "muito-pesada": t("Muito pesada"),
};
const NOME_CONCENTRACAO: Record<Concentracao, string> = {
  equilibrada: t("Equilibrada"),
  meio: t("Pelo meio"),
  laterais: t("Pelas laterais"),
};

export function Carreira({ inicial, onSair }: { inicial: CarreiraT; onSair: () => void }) {
  const cr = useCarreira(inicial);
  if (!cr.montado) return <TelaDeEspera titulo={t("Carreira")} carga={cr.carga} onBack={onSair} />;
  return <TelaCarreira cr={{ ...cr, montado: cr.montado }} onSair={onSair} />;
}

type Cr = ReturnType<typeof useCarreira> & { montado: MundoMontado };

function TelaCarreira({ cr, onSair }: { cr: Cr; onSair: () => void }) {
  const { carreira: c, mudar } = cr;
  // O mundo como está na data da carreira: jogadores evoluídos, aposentados fora, juniores dentro,
  // sem quem saiu do clube e com o ajuste dos minutos jogados.
  const montado = useMemo(
    () => ({ ...cr.montado, mundo: mundoNaData(cr.montado.mundo, c, c.data) }),
    [cr.montado, c],
  );
  const { mundo } = montado;
  const [aba, setAba] = useState<Aba>("inicio");
  const [dia, setDia] = useState<"hub" | "pre-jogo" | "jogo">("hub");
  const [jogo, setJogo] = useState<{
    opcoes: OpcoesPartida;
    x: Compromisso;
    /** A carreira e os outros jogos do dia no começo da partida, para o plantão. */
    antes: CarreiraT;
    plantao: JogoSimulado[];
  } | null>(null);

  const clube = mundo.clube(c.clube);
  const pais = clube ? mundo.pais(clube.pais) : undefined;
  const hoje = compromissoDoDia(c);
  const proximo = proximoCompromisso(c);
  const jogadores = useMemo(() => elencoParaPartida(c, mundo, c.clube), [c, mundo]);
  // Suspensos e convocados para o próximo jogo entram nos avisos (e ficam fora do jogo).
  const suspensos = useMemo(() => suspensosNaCompeticao(c, proximo?.competicao), [c, proximo]);
  const comASelecao = useMemo(
    () => foraPelaSelecao(c, mundo, proximo?.data ?? c.data),
    [c, mundo, proximo],
  );
  const avisos = useMemo(() => {
    const m = new Map<string, string>();
    for (const j of jogadores) {
      const selecao = comASelecao.get(j.id);
      const poupar = avisoPoupar(estadoDe(c, j.id));
      const lesao = estadoDe(c, j.id).lesao;
      const a = suspensos.has(j.id)
        ? t("suspenso")
        : lesao && lesao.ate > (proximo?.data ?? c.data)
          ? t("lesionado até {data}", { data: dataCurta(lesao.ate) })
          : selecao
            ? t("com a seleção ({selecao})", { selecao: mundo.pais(selecao)?.nome ?? selecao })
            : poupar
              ? t("poupar: {aviso}", { aviso: poupar })
              : null;
      if (a) m.set(j.id, a);
    }
    return m;
  }, [c, jogadores, suspensos, comASelecao, mundo, proximo?.data]);

  // Salvamento de uma versão anterior: ganha as competições ao abrir.
  useEffect(() => {
    if (c.formato !== FORMATO_CARREIRA || !c.competicoes) mudar((x) => atualizarCarreira(x, mundo));
  }, [c.formato, c.competicoes, mudar, mundo]);

  const escalacao: EscalacaoEditavel = useMemo(() => {
    const e = escalacaoDoTecnico(c, jogadores);
    const vagas = (e.vagas ?? FORMACOES[e.formacao === "personalizada" ? "4-4-2" : e.formacao]).map(
      (v) => ({ ...v }),
    );
    return {
      formacao: e.formacao,
      vagas,
      titulares: [...e.titulares],
      reservas: [...e.reservas],
      papeis: vagas.map((_, i) => e.papeis?.[i] ?? null),
    };
  }, [c, jogadores]);
  const mudarEscalacao = (v: EscalacaoEditavel) => mudar((x) => ({ ...x, escalacao: v }));

  // F2 salva na hora; 1 a 9 e 0 trocam de aba (fora de campos de texto).
  const salvarAgora = cr.salvarAgora;
  const tecla = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        void salvarAgora();
        return;
      }
      if (dia !== "hub" || (e.target as HTMLElement).closest("input, select, textarea")) return;
      const a = ABAS.find((x) => x.tecla === e.key);
      if (a) setAba(a.id);
    },
    [salvarAgora, dia],
  );
  useEffect(() => {
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [tecla]);

  if (dia === "jogo" && jogo) {
    const lado = jogo.x.mando === "casa" ? "casa" : "fora";
    return (
      <div className="mx-auto flex min-h-dvh max-w-7xl flex-col gap-4 p-4 lg:p-6">
        <AoVivo
          opcoes={jogo.opcoes}
          clubes={{
            casa: mundo.clube(jogo.opcoes.casa.id),
            fora: mundo.clube(jogo.opcoes.fora.id),
          }}
          humano={lado}
          rotuloNovo={t("Voltar à carreira")}
          onTerminou={(r) => mudar((x) => registrarJogo(x, mundo, jogo.x.id, r))}
          plantao={(agora) => (
            <Plantao c={jogo.antes} mundo={mundo} x={jogo.x} jogos={jogo.plantao} agora={agora} />
          )}
          onNovo={() => {
            setJogo(null);
            setDia("hub");
            setAba("inicio");
          }}
        />
      </div>
    );
  }

  const adversarioHoje = hoje ? mundo.clube(hoje.adversario) : undefined;

  return (
    <div className="mx-auto flex min-h-dvh max-w-7xl flex-col gap-4 p-4 lg:p-6">
      <header className="flex flex-wrap items-center gap-4 rounded-md border-2 border-placar-borda bg-placar px-5 py-3">
        {clube && <Escudo clube={clube} tamanho={52} />}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-placar text-4xl leading-none font-extrabold">
            {clube?.nomeCurto}
          </h1>
          <p className="text-sm text-suave">
            {c.tecnico}, {dataPorExtenso(c.data)}
            {pais
              ? t(", temporada {nomeTemporada}", { nomeTemporada: nomeTemporada(pais, c.data) })
              : ""}
          </p>
        </div>
        <Moral valor={c.moral} />
        <div className="flex flex-wrap gap-2">
          {hoje ? (
            <Botao variante="primario" onClick={() => setDia("pre-jogo")}>
              {t("Dia de jogo: {nomeCurto}", {
                nomeCurto: adversarioHoje?.nomeCurto ?? hoje.adversario,
              })}
            </Botao>
          ) : (
            <>
              <Botao onClick={() => mudar((x) => avancarDia(x, mundo).carreira)}>
                {t("Avançar um dia")}
              </Botao>
              <Botao
                variante="primario"
                disabled={!proximo}
                title={
                  proximo ? undefined : t("Nenhum jogo marcado: marque um amistoso na aba Jogos")
                }
                onClick={() => mudar((x) => avancarAteJogo(x, mundo).carreira)}
              >
                {proximo
                  ? t("Ir até o próximo jogo ({diasEntre} dias)", {
                      diasEntre: diasEntre(c.data, proximo.data),
                    })
                  : t("Sem jogos marcados")}
              </Botao>
            </>
          )}
        </div>
      </header>

      <PainelDeEmprego c={c} montado={montado} mudar={mudar} />
      <Sondagens c={c} montado={montado} mudar={mudar} />
      <Conversas c={c} montado={montado} mudar={mudar} />
      {c.versaoBanco !== montado.banco.meta.versao && (
        <p className="rounded border border-[#ffa64d]/40 bg-[#ffa64d]/10 px-3 py-2 text-sm text-[#ffc38a]">
          {t(
            "O banco do jogo foi atualizado ({versaoBanco} para {versao}) depois que esta carreira começou. Ela continua, mas jogadores que mudaram no banco podem aparecer diferentes.",
            { versaoBanco: c.versaoBanco, versao: montado.banco.meta.versao },
          )}
        </p>
      )}
      {dia === "pre-jogo" && hoje ? (
        <section className="flex flex-col gap-3 rounded-md border-2 border-placar-borda bg-placar p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-placar text-3xl font-bold">
              {nomeDoCompromisso(c, mundo, hoje)}:{" "}
              {hoje.mando === "casa" ? t("contra o") : t("na casa do")} {adversarioHoje?.nomeCurto}
            </h2>
            <div className="flex gap-2">
              <Botao onClick={() => setDia("hub")}>{t("Voltar")}</Botao>
              <Botao
                variante="primario"
                onClick={() => {
                  setJogo({
                    opcoes: partidaDoCompromisso(c, mundo, hoje),
                    x: hoje,
                    antes: c,
                    plantao: plantaoDoCompromisso(c, mundo, hoje),
                  });
                  setDia("jogo");
                }}
              >
                {t("Começar o jogo")}
              </Botao>
            </div>
          </div>
          <Tatica c={c} mudar={mudar} />
          <EditorEscalacao
            jogadores={jogadores}
            valor={escalacao}
            onMudar={mudarEscalacao}
            avisos={avisos}
            guardadas={c.formacoesSalvas}
            onGuardar={(f) =>
              mudar((x) => ({
                ...x,
                formacoesSalvas: [...x.formacoesSalvas.filter((g) => g.nome !== f.nome), f],
              }))
            }
          />
        </section>
      ) : (
        <>
          <nav className="flex flex-wrap gap-1" aria-label={t("Seções da carreira")}>
            {ABAS.map((a) => (
              <button
                key={a.id}
                type="button"
                aria-current={aba === a.id ? "page" : undefined}
                onClick={() => setAba(a.id)}
                className={`rounded-t-md px-4 py-2 text-sm font-bold ${aba === a.id ? "bg-placar text-cal" : "text-suave hover:text-cal"}`}
              >
                {a.nome} <span className="text-xs font-normal opacity-60">{a.tecla}</span>
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2 text-xs text-suave">
              <span role="status">
                {cr.erroSalvar
                  ? t("Não salvou: {erroSalvar}", { erroSalvar: cr.erroSalvar })
                  : cr.salvoEm
                    ? t("Salvo às {hora}", {
                        hora: new Date(cr.salvoEm).toLocaleTimeString(locale(), {
                          hour: "2-digit",
                          minute: "2-digit",
                        }),
                      })
                    : t("Salvando…")}
              </span>
              <Botao onClick={() => void cr.salvarAgora()}>{t("Salvar (F2)")}</Botao>
              <Botao onClick={() => exportarCarreira(c, cr.nomeClube)}>{t("Baixar arquivo")}</Botao>
              <Botao onClick={onSair}>{t("Menu")}</Botao>
            </div>
          </nav>
          <section className="-mt-4 rounded-md rounded-tl-none border-2 border-placar-borda bg-placar p-4">
            {aba === "inicio" && (
              <Inicio
                c={c}
                montado={montado}
                avisos={avisos}
                onJogos={() => setAba("jogos")}
                onEscalacao={() => setAba("escalacao")}
              />
            )}
            {aba === "plantel" && <Plantel c={c} montado={montado} mudar={mudar} />}
            {aba === "selecoes" && <Selecoes c={c} montado={montado} />}
            {aba === "base" && <Base c={c} montado={montado} mudar={mudar} />}
            {aba === "mercado" && <Mercado c={c} montado={montado} mudar={mudar} />}
            {aba === "financas" && <Financas c={c} montado={montado} mudar={mudar} />}
            {aba === "escalacao" && (
              <div className="flex flex-col gap-3">
                <Tatica c={c} mudar={mudar} />
                <EditorEscalacao
                  jogadores={jogadores}
                  valor={escalacao}
                  onMudar={mudarEscalacao}
                  avisos={avisos}
                  guardadas={c.formacoesSalvas}
                  onGuardar={(f) =>
                    mudar((x) => ({
                      ...x,
                      formacoesSalvas: [...x.formacoesSalvas.filter((g) => g.nome !== f.nome), f],
                    }))
                  }
                />
              </div>
            )}
            {aba === "calendario" && <Calendario c={c} montado={montado} mudar={mudar} />}
            {aba === "jogos" && <Jogos c={c} montado={montado} mudar={mudar} />}
            {aba === "competicoes" && <Competicoes c={c} montado={montado} />}
          </section>
        </>
      )}
    </div>
  );
}

function Moral({ valor }: { valor: number }) {
  const texto =
    valor >= 75
      ? t("Empolgado")
      : valor >= 58
        ? t("Confiante")
        : valor >= 42
          ? t("Tranquilo")
          : valor >= 25
            ? t("Abalado")
            : t("Em crise");
  return (
    <div
      className="w-32 text-sm"
      title={t("Moral do time: {valor} de 100", { valor: Math.round(valor) })}
    >
      <p className="text-xs text-suave">{t("Moral do time")}</p>
      <p className="font-bold">{texto}</p>
      <div className="mt-0.5 h-1.5 rounded-full bg-white/10">
        <div className="h-full rounded-full bg-canarinho" style={{ width: `${valor}%` }} />
      </div>
    </div>
  );
}

function Tatica({ c, mudar }: { c: CarreiraT; mudar: (f: (x: CarreiraT) => CarreiraT) => void }) {
  const tat = c.tatica;
  const set = (parte: Partial<CarreiraT["tatica"]>) =>
    mudar((x) => ({ ...x, tatica: { ...x.tatica, ...parte } }));
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <Campo rotulo={t("Estilo")}>
        <select
          className={estiloCampo}
          value={tat.estilo}
          onChange={(e) => set({ estilo: e.target.value as Estilo })}
        >
          {(Object.keys(NOME_ESTILO) as Estilo[]).map((v) => (
            <option key={v} value={v}>
              {NOME_ESTILO[v]}
            </option>
          ))}
        </select>
      </Campo>
      <Campo rotulo={t("Marcação")}>
        <select
          className={estiloCampo}
          value={tat.marcacao}
          onChange={(e) => set({ marcacao: e.target.value as Marcacao })}
        >
          {(Object.keys(NOME_MARCACAO) as Marcacao[]).map((v) => (
            <option key={v} value={v}>
              {NOME_MARCACAO[v]}
            </option>
          ))}
        </select>
      </Campo>
      <Campo rotulo={t("Ataques")}>
        <select
          className={estiloCampo}
          value={tat.concentracao}
          onChange={(e) => set({ concentracao: e.target.value as Concentracao })}
        >
          {(Object.keys(NOME_CONCENTRACAO) as Concentracao[]).map((v) => (
            <option key={v} value={v}>
              {NOME_CONCENTRACAO[v]}
            </option>
          ))}
        </select>
      </Campo>
    </div>
  );
}

function Inicio({
  c,
  montado,
  avisos,
  onJogos,
  onEscalacao,
}: {
  c: CarreiraT;
  montado: MundoMontado;
  avisos: ReadonlyMap<string, string>;
  onJogos: () => void;
  onEscalacao: () => void;
}) {
  const { mundo } = montado;
  const proximo = proximoCompromisso(c);
  const adv = proximo ? mundo.clube(proximo.adversario) : undefined;
  const ultimos = agendaCompleta(c)
    .filter((x) => x.resultado)
    .slice(-5)
    .reverse();
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <div className="flex flex-col gap-4">
        <QuadroDoTecnico c={c} montado={montado} />
        <QuadroDaDiretoria c={c} montado={montado} />
        <div className="rounded border border-placar-borda p-3">
          <p className="text-xs font-bold text-suave">{t("Próximo jogo")}</p>
          {proximo && adv ? (
            <div className="mt-2 flex items-center gap-3">
              <Escudo clube={adv} tamanho={44} />
              <div>
                <p className="font-placar text-2xl font-bold">{adv.nomeCurto}</p>
                <p className="text-sm text-suave">
                  {nomeDoCompromisso(c, montado.mundo, proximo)},{" "}
                  {proximo.mando === "casa" ? t("em casa") : "fora"}, {dataCurta(proximo.data)}
                  {proximo.data === c.data
                    ? t(" (hoje)")
                    : t(" (em {diasEntre} dias)", { diasEntre: diasEntre(c.data, proximo.data) })}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-suave">
              {t("Nenhum jogo marcado.")}
              <button type="button" className="underline" onClick={onJogos}>
                {t("Marque um amistoso")}
              </button>
              .
            </p>
          )}
        </div>
        <div className="rounded border border-placar-borda p-3">
          <p className="text-xs font-bold text-suave">{t("Melhor poupar")}</p>
          {avisos.size === 0 ? (
            <p className="mt-1 text-sm text-suave">{t("Todo mundo descansado e de bem.")}</p>
          ) : (
            <ul className="mt-1 text-sm">
              {[...avisos].map(([id, aviso]) => (
                <li key={id} className="flex justify-between border-b border-white/5 py-0.5">
                  <span>{mundo.jogador(id)?.nome}</span>
                  <span className="text-[#ffc38a]">{aviso}</span>
                </li>
              ))}
            </ul>
          )}
          {avisos.size > 0 && (
            <button type="button" className="mt-1 text-xs underline" onClick={onEscalacao}>
              {t("Revisar a escalação")}
            </button>
          )}
        </div>
        {ultimos.length > 0 && (
          <div className="rounded border border-placar-borda p-3">
            <p className="text-xs font-bold text-suave">{t("Últimos resultados")}</p>
            <ul className="mt-1 text-sm">
              {ultimos.map((x) => {
                const r = x.resultado!;
                const pro = x.mando === "casa" ? r.placar[0] : r.placar[1];
                const contra = x.mando === "casa" ? r.placar[1] : r.placar[0];
                const letra = pro > contra ? "V" : pro < contra ? "D" : "E";
                return (
                  <li key={x.id} className="flex gap-2 border-b border-white/5 py-0.5">
                    <span
                      className={`w-5 text-center font-bold ${letra === "V" ? "text-[#7ed37a]" : letra === "D" ? "text-[#ff6b5c]" : "text-suave"}`}
                    >
                      {letra}
                    </span>
                    <span className="flex-1">
                      {mundo.clube(x.adversario)?.nomeCurto} ({x.mando === "casa" ? "casa" : "fora"}
                      )
                    </span>
                    <span className="font-bold">
                      {pro} x {contra}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
      <div className="rounded border border-placar-borda p-3">
        <p className="text-xs font-bold text-suave">{t("Notícias")}</p>
        <ul className="mt-1 flex max-h-[32rem] flex-col overflow-y-auto text-sm">
          {c.noticias.slice(0, 40).map((n, i) => (
            <li key={`${n.data}-${i}`} className="flex gap-3 border-b border-white/5 py-1.5">
              <span className="w-20 shrink-0 text-xs text-suave">{dataCurta(n.data)}</span>
              <span>{t(n.texto, n.params)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
