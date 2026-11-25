/**
 * Tela de partida (Fase 7): placar, mini-campo ao vivo ou modo clássico, controles de ritmo,
 * trocas e instruções do técnico durante o jogo, e o resumo no fim.
 */
import { useEffect, useMemo, useState } from "react";
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
  type TimePartida,
} from "@newbras/engine";
import { EditorFormacao } from "../components/EditorFormacao";
import { Escudo } from "../components/Escudo";
import { Botao, Campo, estiloCampo } from "../editor/ui";
import { MiniCampo, type CorTime } from "./MiniCampo";
import { Estatisticas, LanceALance, Notas } from "./Resumo";
import { NOME_VELOCIDADE, usePartidaAoVivo, type Velocidade } from "./usePartidaAoVivo";

const NOME_ESTILO: Record<Estilo, string> = {
  equilibrado: "Equilibrado",
  ataque: "Ataque total",
  "contra-ataque": "Contra-ataque",
  cadenciado: "Cadenciado (toque de bola)",
};
const NOME_MARCACAO: Record<Marcacao, string> = {
  leve: "Leve",
  pesada: "Pesada",
  "muito-pesada": "Muito pesada",
};
const NOME_CONCENTRACAO: Record<Concentracao, string> = {
  equilibrada: "Equilibrada",
  meio: "Pelo meio",
  laterais: "Pelas laterais",
};
const ROTULO_DESTAQUE: Partial<Record<Evento["tipo"], string>> = {
  gol: "GOL!",
  "gol-contra": "GOL CONTRA",
  penalti: "PÊNALTI!",
  "penalti-perdido": "PERDEU!",
  "chute-trave": "NA TRAVE!",
  defesa: "DEFENDEU!",
  "cartao-vermelho": "EXPULSO!",
  lesao: "LESÃO",
};

interface Props {
  opcoes: OpcoesPartida;
  clubes: Record<LadoCampo, Clube | undefined>;
  /** Lado comandado pelo humano (pode trocar e dar instruções); null = só assistir. */
  humano: LadoCampo | null;
  onNovo: () => void;
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

export function AoVivo({ opcoes, clubes, humano, onNovo }: Props) {
  const ao = usePartidaAoVivo(opcoes);
  const { controle: estado, partida } = ao;
  const [classico, setClassico] = useState(false);
  const [todos, setTodos] = useState(false);
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
  const exibicao = estado.exibicao();
  const acrescimo = partida.acrescimoDado;
  const relogio = fim
    ? "Fim de jogo"
    : estado.aviso
      ? "Intervalo"
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
            aria-label="Placar"
          >
            {partida.placar[0]} x {partida.placar[1]}
          </p>
          <p className="text-sm font-bold text-suave tabular-nums" aria-live="polite">
            {relogio}
            {fim?.penaltis ? ` (pênaltis ${fim.penaltis[0]} x ${fim.penaltis[1]})` : ""}
          </p>
          {!fim && !estado.aviso && acrescimo !== null && (
            <p className="mt-1 inline-block rounded bg-canarinho px-2 py-0.5 text-xs font-black text-placar">
              +{acrescimo} de acréscimo
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
                {opcoes.casa.nome} ataca para a{" "}
                {partida.relogio.periodo === 1 || partida.relogio.periodo === 3
                  ? "direita"
                  : "esquerda"}
                . Bola com contorno branco: quem está com ela.
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
          <LanceALance
            eventos={estado.eventos}
            contexto={contexto}
            todos={todos}
            onTodos={() => setTodos((t) => !t)}
            recentesPrimeiro={!fim}
            altura={classico ? "max-h-[36rem]" : "max-h-72"}
          />
        </div>

        <aside className="flex min-w-0 flex-col gap-3">
          <section className="flex flex-col gap-3 rounded-md border-2 border-placar-borda bg-placar p-4">
            <div className="flex flex-wrap gap-2">
              {fim ? (
                <Botao variante="primario" onClick={onNovo}>
                  Novo jogo
                </Botao>
              ) : ao.rodando ? (
                <Botao variante="primario" onClick={ao.pausar}>
                  Pausar (espaço)
                </Botao>
              ) : (
                <Botao variante="primario" onClick={ao.continuar}>
                  Continuar (espaço)
                </Botao>
              )}
              {!fim && <Botao onClick={ao.pular}>Pular para o fim</Botao>}
              <Botao onClick={() => setClassico((c) => !c)}>
                {classico ? "Mini-campo" : "Modo clássico"}
              </Botao>
            </div>
            {!fim && (
              <Campo rotulo="Velocidade">
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

          {humano && !fim && (
            <Comando
              lado={humano}
              time={times[humano]}
              partida={partida}
              porId={porId}
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
  onMudou,
}: {
  lado: LadoCampo;
  time: TimePartida;
  partida: ReturnType<typeof usePartidaAoVivo>["partida"];
  porId: Map<string, TimePartida["jogadores"][number]>;
  onMudou: () => void;
}) {
  const emCampo = partida.emCampo(lado);
  const condicoes = partida.condicoes(lado);
  const reservas = partida.reservas(lado);
  const restantes = partida.trocasRestantes(lado);
  const tatica = partida.tatica(lado);
  const vagas = partida.vagas(lado);
  const [sai, setSai] = useState("");
  const [entra, setEntra] = useState("");
  const [formacao, setFormacao] = useState<Formacao | "personalizada">(time.escalacao.formacao);

  const nome = (id: string | null) => (id ? (porId.get(id)?.nome ?? id) : "");
  const curto = (id: string | null) => nome(id).split(" ").at(-1) ?? "";

  return (
    <>
      <section className="flex flex-col gap-2 rounded-md border-2 border-placar-borda bg-placar p-4">
        <h2 className="font-placar text-2xl font-bold">Substituições</h2>
        <p className="text-xs text-suave">
          {restantes > 0
            ? `Pode fazer mais ${restantes} ${restantes === 1 ? "troca" : "trocas"}.`
            : "Sem trocas disponíveis."}{" "}
          Fôlego entre parênteses.
        </p>
        <Campo rotulo="Sai">
          <select className={estiloCampo} value={sai} onChange={(e) => setSai(e.target.value)}>
            <option value="">Escolha quem sai</option>
            {emCampo.map((id, i) =>
              id ? (
                <option key={id} value={id}>
                  {nome(id)} ({condicoes[i]}%)
                </option>
              ) : null,
            )}
          </select>
        </Campo>
        <Campo rotulo="Entra">
          <select className={estiloCampo} value={entra} onChange={(e) => setEntra(e.target.value)}>
            <option value="">Escolha quem entra</option>
            {reservas.map((id) => {
              const j = porId.get(id);
              return (
                <option key={id} value={id}>
                  {j?.nome} ({j ? NOME_POSICAO[j.posicao] : ""}, força {j?.forca})
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
          Fazer a troca
        </Botao>
      </section>

      <section className="flex flex-col gap-2 rounded-md border-2 border-placar-borda bg-placar p-4">
        <h2 className="font-placar text-2xl font-bold">Instruções</h2>
        <div className="grid grid-cols-2 gap-2">
          <Campo rotulo="Estilo">
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
          <Campo rotulo="Marcação">
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
          <Campo rotulo="Ataques" className="col-span-2">
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
          <Campo rotulo="Formação" className="col-span-2">
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
              <option value="personalizada">Personalizada</option>
            </select>
          </Campo>
        </div>
        <EditorFormacao
          vagas={vagas}
          nomes={emCampo.map(curto)}
          foraDePosicao={new Set()}
          onMudar={(novas) => {
            setFormacao("personalizada");
            if (partida.mudarFormacao(lado, novas)) onMudou();
          }}
        />
      </section>
    </>
  );
}
