/**
 * Tela de partida (Fase 7): placar, mini-campo ao vivo ou modo clássico, controles de ritmo,
 * trocas e instruções do técnico durante o jogo, e o resumo no fim.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { camisasDoClube, corDeTexto, NOME_POSICAO, type Clube } from "@newbras/data";
import {
  FORMACOES,
  NOMES_FORMACOES,
  rotuloMinuto,
  type Concentracao,
  type Estilo,
  type Evento,
  type Formacao,
  type LadoCampo,
  type Marcacao,
  type OpcoesPartida,
  type ResultadoPartida,
  type TimePartida,
} from "@newbras/engine";
import {
  EditorFormacao,
  PainelVaga,
  papelENota,
  type Candidato,
} from "../components/EditorFormacao";
import { Escudo } from "../components/Escudo";
import { Botao, Campo, estiloCampo } from "../editor/ui";
import { MiniCampo, type CorTime } from "./MiniCampo";
import { NotasAoVivo } from "./NotasAoVivo";
import { Estatisticas, HUMOR, LanceALance, Notas } from "./Resumo";
import { NOME_VELOCIDADE, usePartidaAoVivo, type Velocidade } from "./usePartidaAoVivo";
import { t } from "@newbras/textos";

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
const ROTULO_DESTAQUE: Partial<Record<Evento["tipo"], string>> = {
  gol: "GOL!",
  "gol-contra": t("GOL CONTRA"),
  penalti: t("PÊNALTI!"),
  "penalti-perdido": "PERDEU!",
  "chute-trave": t("NA TRAVE!"),
  defesa: "DEFENDEU!",
  "cartao-vermelho": "EXPULSO!",
  lesao: t("LESÃO"),
};

interface Props {
  opcoes: OpcoesPartida;
  clubes: Record<LadoCampo, Clube | undefined>;
  /** Lado comandado pelo humano (pode trocar e dar instruções); null = só assistir. */
  humano: LadoCampo | null;
  onNovo: () => void;
  /** Texto do botão do fim de jogo (padrão: "Novo jogo"). */
  rotuloNovo?: string;
  /** Chamado uma vez, quando o jogo termina (a carreira lança o resultado). */
  onTerminou?: (resultado: ResultadoPartida) => void;
  /** Painel ao lado do jogo que acompanha o relógio (o plantão de gols da carreira). */
  plantao?: (agora: { minuto: number; placar: [number, number]; fim: boolean }) => ReactNode;
}

/** Cores dos times no mini-campo; se as camisas titulares forem parecidas, o visitante usa a reserva. */
function coresDosTimes(
  casa: Clube | undefined,
  fora: Clube | undefined,
): Record<LadoCampo, CorTime> {
  const cor = (c: Clube | undefined, i: number) => {
    const camisa = c ? (camisasDoClube(c)[i] ?? camisasDoClube(c)[0]) : undefined;
    const fundo = camisa?.cor1 ?? (i ? "#f1f4ec" : "#f4c430");
    return { fundo, texto: corDeTexto(fundo) };
  };
  const a = cor(casa, 0);
  let b = cor(fora, 0);
  if (distanciaDeCor(a.fundo, b.fundo) < 120) b = cor(fora, 1);
  if (distanciaDeCor(a.fundo, b.fundo) < 120) b = { fundo: "#f1f4ec", texto: "#111111" };
  return { casa: a, fora: b };
}

function distanciaDeCor(a: string, b: string): number {
  const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) || 0);
  const [r1, g1, b1] = rgb(a) as [number, number, number];
  const [r2, g2, b2] = rgb(b) as [number, number, number];
  return Math.hypot(r1 - r2, g1 - g2, b1 - b2);
}

export function AoVivo({ opcoes, clubes, humano, onNovo, rotuloNovo, onTerminou, plantao }: Props) {
  const ao = usePartidaAoVivo(opcoes);
  const { controle: estado, partida } = ao;
  const [classico, setClassico] = useState(false);
  const [todos, setTodos] = useState(false);
  const [aba, setAba] = useState<"lances" | "estatisticas" | "notas">("lances");
  const times: Record<LadoCampo, TimePartida> = { casa: opcoes.casa, fora: opcoes.fora };
  const porId = useMemo(
    () => new Map([...opcoes.casa.jogadores, ...opcoes.fora.jogadores].map((j) => [j.id, j])),
    [opcoes],
  );
  const contexto = {
    nomes: new Map([...porId].map(([id, j]) => [id, j.nome])),
    times: { casa: opcoes.casa.nome, fora: opcoes.fora.nome },
  };
  const cores = useMemo(() => coresDosTimes(clubes.casa, clubes.fora), [clubes]);
  const emCampo = [...partida.emCampo("casa"), ...partida.emCampo("fora")];
  const numeros = emCampo.map((id, i) =>
    id ? (porId.get(id)?.numero ?? (i % 11) + 1) : undefined,
  );

  // Espaço pausa e continua.
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.code !== "Space" || (e.target as HTMLElement).closest("input, select, textarea"))
        return;
      e.preventDefault();
      if (ao.rodando) ao.pausar();
      else ao.continuar();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [ao, ao.rodando]);

  const fim = estado.resultado;
  const avisado = useRef(false);
  useEffect(() => {
    if (fim && !avisado.current) {
      avisado.current = true;
      onTerminou?.(fim);
    }
  }, [fim, onTerminou]);
  // Números de agora: só calculados quando alguém vai olhar (aba aberta ou painel de trocas).
  const parcial = !fim && (aba !== "lances" || humano) ? partida.parcial() : null;
  const notas = new Map(parcial?.jogadores.map((j) => [j.id, j.nota]) ?? []);
  const exibicao = estado.exibicao();
  const acrescimo = partida.acrescimoDado;
  const relogio = fim
    ? t("Fim de jogo")
    : estado.aviso
      ? t("Intervalo")
      : rotuloMinuto({ ...partida.relogio, minuto: partida.relogio.minuto });

  return (
    <div className="flex flex-col gap-4">
      <section className="flex items-center justify-center gap-4 rounded-md border-2 border-placar-borda bg-placar px-4 py-4 sm:gap-6">
        <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
          <span className="truncate text-right font-placar text-2xl font-bold sm:text-3xl">
            {opcoes.casa.nome}
          </span>
          {clubes.casa && <Escudo clube={clubes.casa} tamanho={48} />}
        </div>
        <div className="text-center">
          <p
            className="font-placar text-6xl font-black text-canarinho tabular-nums"
            aria-label={t("Placar")}
          >
            {partida.placar[0]} x {partida.placar[1]}
          </p>
          <p className="text-sm font-bold text-suave tabular-nums" aria-live="polite">
            {relogio}
            {fim?.penaltis
              ? t(" (pênaltis {penaltis} x {penaltis2})", {
                  penaltis: fim.penaltis[0],
                  penaltis2: fim.penaltis[1],
                })
              : ""}
          </p>
          {!fim && !estado.aviso && acrescimo !== null && (
            <p className="mt-1 inline-block rounded bg-canarinho px-2 py-0.5 text-xs font-black text-placar">
              {t("+{acrescimo} de acréscimo", { acrescimo })}
            </p>
          )}
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {clubes.fora && <Escudo clube={clubes.fora} tamanho={48} />}
          <span className="truncate font-placar text-2xl font-bold sm:text-3xl">
            {opcoes.fora.nome}
          </span>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex min-w-0 flex-col gap-3">
          {!classico && (
            <div className="rounded-md border-2 border-placar-borda bg-placar p-2">
              <MiniCampo
                anterior={exibicao.anterior}
                atual={exibicao.atual}
                fracao={exibicao.fracao}
                cores={cores}
                numeros={numeros}
                destaque={exibicao.destaque}
                {...(exibicao.destaque && ROTULO_DESTAQUE[exibicao.destaque.tipo]
                  ? { rotuloDestaque: ROTULO_DESTAQUE[exibicao.destaque.tipo] }
                  : {})}
              />
              <p className="px-1 pt-1 text-xs text-suave">
                {t("{nome} ataca para a {periodo}. Bola com contorno branco: quem está com ela.", {
                  nome: opcoes.casa.nome,
                  periodo:
                    partida.relogio.periodo === 1 || partida.relogio.periodo === 3
                      ? "direita"
                      : "esquerda",
                })}
              </p>
            </div>
          )}
          {estado.aviso && (
            <p
              className="rounded-md border-2 border-canarinho bg-placar px-4 py-3 font-bold"
              role="status"
            >
              {estado.aviso}
            </p>
          )}
          {!fim && (
            <div className="flex gap-1" role="tablist" aria-label={t("O que ver durante o jogo")}>
              {(
                [
                  ["lances", t("Lance a lance")],
                  ["estatisticas", t("Estatísticas")],
                  ["notas", t("Notas dos jogadores")],
                ] as const
              ).map(([id, rotulo]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={aba === id}
                  className={`rounded-t-md border-2 border-b-0 px-3 py-1.5 text-sm font-bold ${
                    aba === id
                      ? "border-placar-borda bg-placar text-cal"
                      : "border-transparent text-suave hover:text-cal"
                  }`}
                  onClick={() => setAba(id)}
                >
                  {rotulo}
                </button>
              ))}
            </div>
          )}
          {(fim || aba === "lances") && (
            <LanceALance
              eventos={estado.eventos}
              contexto={contexto}
              todos={todos}
              onTodos={() => setTodos((x) => !x)}
              recentesPrimeiro={!fim}
              altura={classico ? "max-h-[36rem]" : "max-h-72"}
            />
          )}
          {!fim && aba === "estatisticas" && parcial && (
            <Estatisticas estatisticas={parcial.estatisticas} />
          )}
          {!fim && aba === "notas" && parcial && (
            <section className="rounded-md border-2 border-placar-borda bg-placar p-4">
              <NotasAoVivo
                jogadores={parcial.jogadores}
                times={times}
                emCampo={{ casa: partida.emCampo("casa"), fora: partida.emCampo("fora") }}
                destacar={humano}
              />
              <p className="mt-2 text-xs text-suave">
                {t(
                  "Nota parcial, considerando o placar de agora: verde acima de 7, amarela de 6 a 7, vermelha abaixo de 6. Fôlego em vermelho: abaixo de 60%.",
                )}
              </p>
            </section>
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-3">
          <section className="flex flex-col gap-3 rounded-md border-2 border-placar-borda bg-placar p-4">
            <div className="flex flex-wrap gap-2">
              {fim ? (
                <Botao variante="primario" onClick={onNovo}>
                  {rotuloNovo ?? t("Novo jogo")}
                </Botao>
              ) : ao.rodando ? (
                <Botao variante="primario" onClick={ao.pausar}>
                  {t("Pausar (espaço)")}
                </Botao>
              ) : (
                <Botao variante="primario" onClick={ao.continuar}>
                  {t("Continuar (espaço)")}
                </Botao>
              )}
              {!fim && <Botao onClick={ao.pular}>{t("Pular para o fim")}</Botao>}
              <Botao onClick={() => setClassico((c) => !c)}>
                {classico ? t("Mini-campo") : t("Modo clássico")}
              </Botao>
            </div>
            {!fim && (
              <Campo rotulo={t("Velocidade")}>
                <select
                  className={estiloCampo}
                  value={ao.velocidade}
                  onChange={(e) => ao.setVelocidade(e.target.value as Velocidade)}
                >
                  {(Object.keys(NOME_VELOCIDADE) as Velocidade[]).map((v) => (
                    <option key={v} value={v}>
                      {NOME_VELOCIDADE[v]}
                    </option>
                  ))}
                </select>
              </Campo>
            )}
          </section>

          {plantao?.({
            minuto: partida.relogio.minuto,
            placar: [partida.placar[0], partida.placar[1]],
            fim: !!fim,
          })}

          {humano && !fim && (
            <Comando
              lado={humano}
              time={times[humano]}
              partida={partida}
              porId={porId}
              notas={notas}
              onMudou={ao.atualizar}
            />
          )}
        </aside>
      </div>

      {fim && (
        <>
          <Estatisticas estatisticas={fim.estatisticas} />
          <div className="grid gap-4 md:grid-cols-2">
            <Notas resultado={fim} time={opcoes.casa} lado="casa" />
            <Notas resultado={fim} time={opcoes.fora} lado="fora" />
          </div>
        </>
      )}
    </div>
  );
}

/** Painel do técnico: trocas, tática e formação durante o jogo. */
function Comando({
  lado,
  time,
  partida,
  porId,
  notas,
  onMudou,
}: {
  lado: LadoCampo;
  time: TimePartida;
  partida: ReturnType<typeof usePartidaAoVivo>["partida"];
  porId: Map<string, TimePartida["jogadores"][number]>;
  notas: ReadonlyMap<string, number>;
  onMudou: () => void;
}) {
  const emCampo = partida.emCampo(lado);
  const machucados = new Set(partida.machucadosEmCampo(lado));
  const condicoes = partida.condicoes(lado);
  const humores = partida.humor(lado);
  const reservas = partida.reservas(lado);
  const restantes = partida.trocasRestantes(lado);
  const tatica = partida.tatica(lado);
  const vagas = partida.vagas(lado);
  const [sai, setSai] = useState("");
  const [entra, setEntra] = useState("");
  const [selecionada, setSelecionada] = useState<number | null>(null);
  const escolhidos = partida.papeisEscolhidos(lado);
  const ocupantes = emCampo.map((id) => (id ? (porId.get(id) ?? null) : null));
  const vagaSai = sai ? emCampo.indexOf(sai) : -1;
  const candidatos: Candidato[] =
    selecionada === null
      ? []
      : [
          ...emCampo.flatMap((id, i) => {
            const j = id ? porId.get(id) : undefined;
            return j && i !== selecionada ? [{ jogador: j, origem: i }] : [];
          }),
          ...reservas.flatMap((id) => {
            const j = porId.get(id);
            return j
              ? [
                  {
                    jogador: j,
                    origem: "banco" as const,
                    ...(restantes > 0 && emCampo[selecionada] ? {} : { bloqueado: t("Sem troca") }),
                  },
                ]
              : [];
          }),
        ];
  const [formacao, setFormacao] = useState<Formacao | "personalizada">(time.escalacao.formacao);

  const nome = (id: string | null) => (id ? (porId.get(id)?.nome ?? id) : "");

  return (
    <>
      <section className="flex flex-col gap-2 rounded-md border-2 border-placar-borda bg-placar p-4">
        <h2 className="font-placar text-2xl font-bold">{t("Substituições")}</h2>
        <p className="text-xs text-suave">
          {t("{restantes} Fôlego e nota de agora entre parênteses.", {
            restantes:
              restantes > 0
                ? t("Pode fazer mais {restantes} {restantes2}.", {
                    restantes,
                    restantes2: restantes === 1 ? "troca" : "trocas",
                  })
                : t("Sem trocas disponíveis."),
          })}
        </p>
        <Campo rotulo={t("Sai")}>
          <select className={estiloCampo} value={sai} onChange={(e) => setSai(e.target.value)}>
            <option value="">{t("Escolha quem sai")}</option>
            {emCampo.map((id, i) =>
              id ? (
                <option key={id} value={id}>
                  {t("{nome} (fôlego {condicoes}%{has}, humor {nome2})", {
                    nome: machucados.has(id)
                      ? t("{nome}, machucado", { nome: nome(id) })
                      : nome(id),
                    condicoes: condicoes[i],
                    has: notas.has(id) ? t(", nota {get}", { get: notas.get(id)?.toFixed(1) }) : "",
                    nome2: HUMOR[humores.get(id) ?? "normal"].nome.toLowerCase(),
                  })}
                </option>
              ) : null,
            )}
          </select>
        </Campo>
        <Campo rotulo={t("Entra")}>
          <select className={estiloCampo} value={entra} onChange={(e) => setEntra(e.target.value)}>
            <option value="">{t("Escolha quem entra")}</option>
            {reservas.map((id) => {
              const j = porId.get(id);
              const vaga = vagaSai >= 0 ? vagas[vagaSai] : undefined;
              const nota = j && vaga ? papelENota(j, vaga, escolhidos[vagaSai]).nota : null;
              return (
                <option key={id} value={id}>
                  {t("{nome} ({j}, força {forca}{nota})", {
                    nome: j?.nome,
                    j: j ? NOME_POSICAO[j.posicao] : "",
                    forca: j?.forca,
                    nota: nota !== null ? t(", nota {nota} na vaga", { nota }) : "",
                  })}
                </option>
              );
            })}
          </select>
        </Campo>
        <Botao
          variante="primario"
          onClick={() => {
            if (sai && entra && partida.substituir(lado, sai, entra)) {
              setSai("");
              setEntra("");
              onMudou();
            }
          }}
        >
          {t("Fazer a troca")}
        </Botao>
      </section>

      <section className="flex flex-col gap-2 rounded-md border-2 border-placar-borda bg-placar p-4">
        <h2 className="font-placar text-2xl font-bold">{t("Instruções")}</h2>
        <div className="grid grid-cols-2 gap-2">
          <Campo rotulo={t("Estilo")}>
            <select
              className={estiloCampo}
              value={tatica.estilo}
              onChange={(e) => {
                partida.mudarTatica(lado, { estilo: e.target.value as Estilo });
                onMudou();
              }}
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
              value={tatica.marcacao}
              onChange={(e) => {
                partida.mudarTatica(lado, { marcacao: e.target.value as Marcacao });
                onMudou();
              }}
            >
              {(Object.keys(NOME_MARCACAO) as Marcacao[]).map((v) => (
                <option key={v} value={v}>
                  {NOME_MARCACAO[v]}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo={t("Ataques")} className="col-span-2">
            <select
              className={estiloCampo}
              value={tatica.concentracao}
              onChange={(e) => {
                partida.mudarTatica(lado, { concentracao: e.target.value as Concentracao });
                onMudou();
              }}
            >
              {(Object.keys(NOME_CONCENTRACAO) as Concentracao[]).map((v) => (
                <option key={v} value={v}>
                  {NOME_CONCENTRACAO[v]}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo={t("Formação")} className="col-span-2">
            <select
              className={estiloCampo}
              value={formacao}
              onChange={(e) => {
                const valor = e.target.value as Formacao | "personalizada";
                setFormacao(valor);
                if (valor !== "personalizada" && partida.mudarFormacao(lado, FORMACOES[valor]))
                  onMudou();
              }}
            >
              {NOMES_FORMACOES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
              <option value="personalizada">{t("Personalizada")}</option>
            </select>
          </Campo>
        </div>
        <EditorFormacao
          vagas={vagas}
          ocupantes={ocupantes}
          papeis={escolhidos}
          machucados={machucados}
          selecionada={selecionada}
          onSelecionar={setSelecionada}
          onMudar={(novas) => {
            setFormacao("personalizada");
            if (partida.mudarFormacao(lado, novas)) onMudou();
          }}
          onTrocarVagas={(a, b, antes) => {
            partida.mudarFormacao(lado, antes);
            if (partida.trocarVagas(lado, a, b)) onMudou();
          }}
        />
        {selecionada !== null && vagas[selecionada] && (
          <PainelVaga
            vaga={vagas[selecionada]}
            indice={selecionada}
            ocupante={ocupantes[selecionada] ?? null}
            escolhido={escolhidos[selecionada] ?? null}
            candidatos={candidatos}
            rotuloTroca={(c) => (c.origem === "banco" ? t("Substituir") : t("Trocar de vaga"))}
            onPapel={(papel) => {
              partida.mudarPapel(lado, selecionada, papel);
              onMudou();
            }}
            onTrocar={(c) => {
              const ok =
                c.origem === "banco"
                  ? partida.substituir(lado, emCampo[selecionada] ?? "", c.jogador.id)
                  : partida.trocarVagas(lado, selecionada, c.origem);
              if (ok) onMudou();
            }}
            onFechar={() => setSelecionada(null)}
          />
        )}
      </section>
    </>
  );
}
