/**
 * Editor de escalação em campo: os 11 arrastáveis, cada um com a posição de campo (CA, VOL, PD...)
 * e a nota dele ali, que muda na hora conforme o lugar e a função. Abaixo do campo ficam o banco e,
 * antes do jogo, quem está fora da partida. Arrastar troca (em campo, com o banco ou com quem está
 * fora); clicar e soltar abre o cartão do jogador, com a posição e a função quando ele está em campo.
 * O goleiro fica no gol.
 */
import { useEffect, useRef, useState } from "react";
import {
  desenhoDaFormacao,
  FAIXA_MEIO_ATAQUE,
  formacaoPersonalizada,
  LIMITES_VAGA,
  papelNaVaga,
  validarFormacao,
  type JogadorPartida,
  type Vaga,
} from "@newbras/engine";
import {
  DADOS_FUNCAO,
  NOME_POSICAO,
  NOME_POSICAO_CAMPO,
  notaNoPapel,
  papeisPossiveis,
  papelValido,
  posicaoDaVaga,
  posicoesNaturais,
  type PapelEmCampo,
  type Posicao,
} from "@newbras/data";
import { MarcacoesCampo } from "./Pitch";
import { HUMOR } from "../partida/Resumo";
import { t } from "@newbras/textos";

/** A melhor posição de campo do jogador (a sigla na bolinha do banco e de quem está fora do jogo). */
function melhorPosicao(j: JogadorPartida): string {
  return j.posicoesCampo?.[0] ?? posicoesNaturais(j)[0] ?? j.posicao;
}

const COR: Record<Posicao, string> = {
  G: "#f4c430",
  L: "#7cc4f5",
  Z: "#4a90d9",
  M: "#7ed37a",
  A: "#ff8a5c",
};

/**
 * O motor guarda a esquerda do time em y > 34. Na tela o time ataca para a direita, então a
 * esquerda dele fica em cima: o eixo y é invertido para desenhar (e desinvertido ao arrastar).
 */
const tela = (y: number) => 68 - y;

/** Cor da nota comparada com a força: verde rende o que vale; vermelho, bem menos. */
export function corDaNotaNaVaga(nota: number, forca: number): string {
  const d = nota - forca;
  if (d >= -1) return "#7ed37a";
  if (d >= -4) return "#f4e04d";
  if (d >= -9) return "#ffa64d";
  return "#ff6b5c";
}

/** Papel e nota de um jogador numa vaga, com a escolha do técnico (ou a melhor dele ali). */
export function papelENota(j: JogadorPartida, vaga: Vaga, escolhido?: PapelEmCampo | null) {
  const papel = papelNaVaga(j, vaga, escolhido);
  return { papel, nota: notaNoPapel(j, papel) };
}

/** Nome curto da função, para caber no campo e nas listas. */
export const nomeDoPapel = (p: PapelEmCampo) =>
  DADOS_FUNCAO[p.funcao].nome === NOME_POSICAO_CAMPO[p.posicao]
    ? NOME_POSICAO_CAMPO[p.posicao]
    : `${NOME_POSICAO_CAMPO[p.posicao]}, ${DADOS_FUNCAO[p.funcao].nome.toLowerCase()}`;

interface Props {
  vagas: readonly Vaga[];
  /** Quem ocupa cada vaga (mesma ordem das vagas; null = vaga vazia). */
  ocupantes: readonly (JogadorPartida | null)[];
  /** Posição e função pedidas em cada vaga (null = a melhor de quem estiver lá). */
  papeis?: readonly (PapelEmCampo | null)[];
  selecionada?: number | null;
  onSelecionar?: (vaga: number | null) => void;
  onMudar: (vagas: Vaga[]) => void;
  /** O técnico escolhe a posição e a função de quem está na vaga (null = automática). */
  onPapel?: (vaga: number, papel: PapelEmCampo | null) => void;
  /**
   * Soltar um jogador em cima de outro troca os dois de vaga (cada um assume a posição e a função
   * da vaga do outro). Recebe as duas vagas e o desenho de antes do arraste, para restaurar.
   */
  onTrocarVagas?: (a: number, b: number, vagas: Vaga[]) => void;
  /** Jogadores em campo machucados (cruz vermelha ao lado), na partida ao vivo. */
  machucados?: ReadonlySet<string>;
  /** Avisos por jogador (lesionado, suspenso, poupar), mostrados no cartão e com um ponto. */
  avisos?: ReadonlyMap<string, string> | undefined;
  /** Reservas, na primeira fileira abaixo do campo. */
  banco?: readonly JogadorPartida[];
  /** Quem fica fora da partida (antes do jogo), nas fileiras de baixo. */
  foraDoJogo?: readonly JogadorPartida[];
  /**
   * Arrastar um jogador do campo para cima de alguém do banco ou de fora (ou o contrário) faz a
   * troca. Recebe a vaga, quem entra e o desenho de antes do arraste, para restaurar.
   */
  onBanco?: (vaga: number, entra: string, vagas: Vaga[]) => void;
  /** Troca um reserva com alguém que estava fora da partida. */
  onTrocarReservas?: (reserva: string, fora: string) => void;
  /** Motivo de o banco não poder ser usado agora (sem trocas); null = pode. */
  bancoBloqueado?: string | null;
}

/** Distância (em metros) para o jogador solto contar como em cima de outro. */
const RAIO_DA_TROCA = 4;
/** Primeira fileira do banco (no desenho) e a distância entre as fileiras. */
const BANCO_Y = 85;
const ENTRE_FILEIRAS = 12;
/** Jogadores por fileira abaixo do campo. */
const POR_FILEIRA = 12;

interface LugarReserva {
  jogador: JogadorPartida;
  grupo: "banco" | "fora";
  x: number;
  y: number;
}

/** Lugar de cada um abaixo do campo: o banco numa fileira, quem está fora nas seguintes. */
function lugaresAbaixo(
  banco: readonly JogadorPartida[],
  fora: readonly JogadorPartida[],
): { lugares: LugarReserva[]; fileiras: { y: number; grupo: "banco" | "fora" }[] } {
  const lugares: LugarReserva[] = [];
  const fileiras: { y: number; grupo: "banco" | "fora" }[] = [];
  let y = BANCO_Y;
  for (const [grupo, lista] of [
    ["banco", banco],
    ["fora", fora],
  ] as const) {
    if (!lista.length && grupo === "fora") continue;
    // O título de cada grupo pede um respiro acima da primeira fileira dele.
    if (grupo === "fora" && fileiras.length) y += 4;
    for (let i = 0; i < Math.max(1, lista.length); i += POR_FILEIRA) {
      const fileira = lista.slice(i, i + POR_FILEIRA);
      const passo = Math.min(9, 101 / Math.max(1, fileira.length));
      const inicio = 52.5 - (passo * (fileira.length - 1)) / 2;
      fileira.forEach((jogador, k) => lugares.push({ jogador, grupo, x: inicio + passo * k, y }));
      fileiras.push({ y, grupo });
      y += ENTRE_FILEIRAS;
    }
  }
  return { lugares, fileiras };
}

export function EditorFormacao({
  vagas,
  ocupantes,
  papeis = [],
  selecionada = null,
  onSelecionar,
  onMudar,
  onPapel,
  onTrocarVagas,
  machucados,
  avisos,
  banco,
  foraDoJogo,
  onBanco,
  onTrocarReservas,
  bancoBloqueado = null,
}: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const [arrastando, setArrastando] = useState<number | null>(null);
  const inicio = useRef<{
    x: number;
    y: number;
    moveu: boolean;
    /** O desenho antes do arraste. */
    vagas: Vaga[];
  } | null>(null);
  /** Vaga sob o jogador arrastado (troca ao soltar). */
  const [alvo, setAlvo] = useState<number | null>(null);
  /** Reserva (ou de fora) sob o jogador arrastado. */
  const [alvoReserva, setAlvoReserva] = useState<string | null>(null);
  /** Reserva sendo arrastado, com o ponto onde está (no desenho) e se já se mexeu. */
  const [doBanco, setDoBanco] = useState<{
    id: string;
    grupo: "banco" | "fora";
    x: number;
    y: number;
    x0: number;
    y0: number;
    moveu: boolean;
  } | null>(null);
  /** Reserva com o cartão aberto. */
  const [reservaAberta, setReservaAberta] = useState<string | null>(null);
  const problemas = validarFormacao(vagas);
  const comBanco = !!banco && !!onBanco;
  const { lugares, fileiras } = comBanco
    ? lugaresAbaixo(banco ?? [], foraDoJogo ?? [])
    : { lugares: [], fileiras: [] };
  const bancoLivre = comBanco && !bancoBloqueado;
  const altura = comBanco ? (fileiras.at(-1)?.y ?? BANCO_Y) + 8 : 74;
  const livre = (grupo: "banco" | "fora") => (grupo === "banco" ? bancoLivre : comBanco);

  // Esc fecha o cartão.
  useEffect(() => {
    const fechar = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setReservaAberta(null);
      onSelecionar?.(null);
    };
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, [onSelecionar]);

  /** Ponto do ponteiro no desenho (y da tela). */
  const noDesenho = (e: React.PointerEvent): { x: number; y: number } | null => {
    const el = svg.current;
    const matriz = el?.getScreenCTM();
    if (!el || !matriz) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(matriz.inverse());
    return { x: p.x, y: p.y };
  };
  const paraCampo = (e: React.PointerEvent): { x: number; y: number } | null => {
    const p = noDesenho(e);
    return p ? { x: p.x, y: tela(p.y) } : null;
  };

  /** Alguém abaixo do campo perto de um ponto do desenho. */
  const reservaSob = (x: number, y: number, exceto?: string): LugarReserva | null => {
    let melhor: LugarReserva | null = null;
    let menor = RAIO_DA_TROCA;
    for (const l of lugares) {
      if (l.jogador.id === exceto || !livre(l.grupo)) continue;
      const d = Math.hypot(l.x - x, l.y - y);
      if (d < menor) {
        menor = d;
        melhor = l;
      }
    }
    return melhor;
  };

  /** Vaga do campo perto de um ponto do desenho (para o reserva arrastado). */
  const vagaNoDesenho = (x: number, y: number): number | null => {
    let melhor: number | null = null;
    let menor = RAIO_DA_TROCA;
    vagas.forEach((v, k) => {
      if (!ocupantes[k]) return;
      const d = Math.hypot(v.x - x, tela(v.y) - y);
      if (d < menor) {
        menor = d;
        melhor = k;
      }
    });
    return melhor;
  };

  const mover = (i: number, x: number, y: number) => {
    const pontos = vagas.map((v) => ({ x: v.x, y: v.y }));
    pontos[i] = { x, y };
    onMudar(formacaoPersonalizada(pontos, vagas));
  };

  /** Outra vaga (do desenho de antes do arraste) perto do ponto, se houver troca. */
  const vagaSob = (i: number, x: number, y: number): number | null => {
    const antes = inicio.current?.vagas;
    if (!onTrocarVagas || !antes || i === 0) return null;
    let melhor: number | null = null;
    let menor = RAIO_DA_TROCA;
    antes.forEach((v, k) => {
      if (k === i || k === 0) return;
      const d = Math.hypot(v.x - x, v.y - y);
      if (d < menor) {
        menor = d;
        melhor = k;
      }
    });
    return melhor;
  };

  const limpar = () => {
    setArrastando(null);
    setAlvo(null);
    setAlvoReserva(null);
    setDoBanco(null);
    inicio.current = null;
  };

  const soltar = () => {
    const ini = inicio.current;
    if (doBanco) {
      if (!doBanco.moveu) {
        // Clique: abre (ou fecha) o cartão do jogador de baixo do campo.
        setReservaAberta(reservaAberta === doBanco.id ? null : doBanco.id);
        onSelecionar?.(null);
      } else if (alvo !== null && onBanco) {
        onBanco(
          alvo,
          doBanco.id,
          vagas.map((v) => ({ ...v })),
        );
      } else if (alvoReserva && onTrocarReservas) {
        const outro = lugares.find((l) => l.jogador.id === alvoReserva);
        if (outro && outro.grupo !== doBanco.grupo)
          onTrocarReservas(
            doBanco.grupo === "banco" ? doBanco.id : alvoReserva,
            doBanco.grupo === "banco" ? alvoReserva : doBanco.id,
          );
      }
      limpar();
      return;
    }
    if (arrastando !== null && ini && !ini.moveu) {
      setReservaAberta(null);
      onSelecionar?.(selecionada === arrastando ? null : arrastando);
    } else if (arrastando !== null && ini && alvoReserva !== null && onBanco) {
      onBanco(arrastando, alvoReserva, ini.vagas);
    } else if (arrastando !== null && ini && alvo !== null && onTrocarVagas) {
      onTrocarVagas(arrastando, alvo, ini.vagas);
      if (selecionada === arrastando) onSelecionar?.(alvo);
    }
    limpar();
  };

  // Cartão aberto: um jogador em campo (com as funções) ou um de baixo do campo.
  const vagaAberta = selecionada !== null && ocupantes[selecionada] ? selecionada : null;
  const lugarAberto = reservaAberta
    ? (lugares.find((l) => l.jogador.id === reservaAberta) ?? null)
    : null;
  const jogadorAberto =
    vagaAberta !== null ? (ocupantes[vagaAberta] ?? null) : (lugarAberto?.jogador ?? null);
  const ancora =
    vagaAberta !== null && vagas[vagaAberta]
      ? { x: vagas[vagaAberta].x, y: tela(vagas[vagaAberta].y) }
      : lugarAberto
        ? { x: lugarAberto.x, y: lugarAberto.y }
        : null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <svg
          ref={svg}
          viewBox={`-6 -6 117 ${altura + 6}`}
          className="w-full touch-none rounded select-none"
          onPointerMove={(e) => {
            if (doBanco) {
              const d = noDesenho(e);
              if (!d) return;
              const moveu =
                doBanco.moveu ||
                (livre(doBanco.grupo) && Math.hypot(d.x - doBanco.x0, d.y - doBanco.y0) > 1.2);
              setDoBanco({ ...doBanco, x: d.x, y: d.y, moveu });
              if (!moveu) return;
              const vaga = vagaNoDesenho(d.x, d.y);
              setAlvo(vaga);
              setAlvoReserva(
                vaga === null ? (reservaSob(d.x, d.y, doBanco.id)?.jogador.id ?? null) : null,
              );
              return;
            }
            if (arrastando === null) return;
            const p = paraCampo(e);
            const d = noDesenho(e);
            if (!p || !d) return;
            const ini = inicio.current;
            if (ini && !ini.moveu && Math.hypot(p.x - ini.x, p.y - ini.y) < 1.2) return;
            if (ini) ini.moveu = true;
            const reserva = ocupantes[arrastando]
              ? (reservaSob(d.x, d.y)?.jogador.id ?? null)
              : null;
            setAlvoReserva(reserva);
            // O goleiro não sai do gol: só pode ser arrastado até o banco.
            if (arrastando === 0) return;
            setAlvo(reserva ? null : vagaSob(arrastando, p.x, p.y));
            mover(arrastando, p.x, p.y);
          }}
          onPointerUp={soltar}
          onPointerLeave={limpar}
          role="group"
          aria-label={t(
            "Posições do time em campo. Arraste os jogadores; clique para escolher a função. O time ataca para a direita.",
          )}
        >
          <MarcacoesCampo />
          {/* Faixas que decidem a família da vaga: defesa, meio-campo, ataque. */}
          <rect
            x={FAIXA_MEIO_ATAQUE.inicio}
            y={0}
            width={FAIXA_MEIO_ATAQUE.fim - FAIXA_MEIO_ATAQUE.inicio}
            height={68}
            fill="var(--color-cal)"
            opacity={0.05}
          />
          <g stroke="var(--color-cal)" strokeWidth={0.25} strokeDasharray="1 1.5" opacity={0.5}>
            <line x1={36} y1={0} x2={36} y2={68} />
            <line x1={FAIXA_MEIO_ATAQUE.inicio} y1={0} x2={FAIXA_MEIO_ATAQUE.inicio} y2={68} />
            <line x1={FAIXA_MEIO_ATAQUE.fim} y1={0} x2={FAIXA_MEIO_ATAQUE.fim} y2={68} />
          </g>
          {vagas.map((v, i) => {
            const j = ocupantes[i] ?? null;
            const info = j ? papelENota(j, v, papeis[i]) : null;
            const sigla = info?.papel.posicao ?? posicaoDaVaga(v);
            const familia = info ? DADOS_FUNCAO[info.papel.funcao].familia : v.posicao;
            const nomeCurto = j?.nome.split(" ").at(-1) ?? "";
            const ativo = selecionada === i;
            return (
              <g
                key={i}
                transform={`translate(${v.x} ${tela(v.y)})`}
                className={`group outline-none ${i === 0 ? "cursor-pointer" : "cursor-grab"}`}
                onPointerDown={(e) => {
                  (e.target as Element).setPointerCapture?.(e.pointerId);
                  const p = paraCampo(e);
                  inicio.current = p
                    ? { ...p, moveu: false, vagas: vagas.map((x) => ({ ...x })) }
                    : null;
                  setArrastando(i);
                }}
                tabIndex={0}
                role="button"
                aria-pressed={ativo}
                aria-label={t(
                  "{nome}, {info}{info2}. Enter escolhe a função; setas movem o jogador.",
                  {
                    nome: j?.nome ?? t("Vaga vazia"),
                    info: info ? nomeDoPapel(info.papel) : NOME_POSICAO_CAMPO[sigla],
                    info2: info ? t(", nota {nota}", { nota: info.nota }) : "",
                  },
                )}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setReservaAberta(null);
                    onSelecionar?.(ativo ? null : i);
                    return;
                  }
                  if (i === 0) return;
                  const passo = e.shiftKey ? 5 : 2;
                  const d: Record<string, [number, number]> = {
                    ArrowRight: [passo, 0],
                    ArrowLeft: [-passo, 0],
                    ArrowUp: [0, passo],
                    ArrowDown: [0, -passo],
                  };
                  const delta = d[e.key];
                  if (!delta) return;
                  e.preventDefault();
                  mover(i, v.x + delta[0], v.y + delta[1]);
                }}
              >
                {ativo && <circle r={4} fill="none" stroke="#ffffff" strokeWidth={0.45} />}
                {/* Foco pelo teclado: anel próprio no lugar do contorno quadrado do navegador. */}
                <circle
                  r={4.2}
                  fill="none"
                  stroke="#7cc4f5"
                  strokeWidth={0.45}
                  className="hidden group-focus-visible:block"
                />
                {alvo === i && <Anel />}
                <circle
                  r={2.8}
                  fill={COR[familia]}
                  stroke={arrastando === i ? "#ffffff" : "var(--color-placar)"}
                  strokeWidth={0.5}
                />
                <text
                  y={0.8}
                  textAnchor="middle"
                  fontSize={sigla.length > 2 ? 1.8 : 2.2}
                  fontWeight={800}
                  fill="var(--color-placar)"
                >
                  {sigla}
                </text>
                {j && machucados?.has(j.id) && (
                  <g transform="translate(-3.6 -3.6)">
                    <title>{t("Machucado")}</title>
                    <circle r={1.5} fill="#ffffff" />
                    <path d="M-0.9 0H0.9M0 -0.9V0.9" stroke="#e53935" strokeWidth={0.6} />
                  </g>
                )}
                {j && !machucados?.has(j.id) && avisos?.has(j.id) && <PontoDeAviso />}
                {info && j && (
                  <g transform="translate(3.4 -3.6)">
                    <rect
                      x={-0.2}
                      y={-1.9}
                      width={4.6}
                      height={2.6}
                      rx={0.6}
                      fill="var(--color-placar)"
                    />
                    <text
                      x={2.1}
                      y={0.1}
                      textAnchor="middle"
                      fontSize={2}
                      fontWeight={800}
                      fill={corDaNotaNaVaga(info.nota, j.forca)}
                    >
                      {info.nota}
                    </text>
                  </g>
                )}
                <text
                  y={5.5}
                  textAnchor="middle"
                  fontSize={2.3}
                  fontWeight={700}
                  fill="var(--color-cal)"
                  stroke="var(--color-placar)"
                  strokeWidth={0.5}
                  paintOrder="stroke"
                >
                  {nomeCurto}
                </text>
              </g>
            );
          })}
          {comBanco && (
            <g>
              <rect
                x={-4}
                y={BANCO_Y - 9.5}
                width={113}
                height={altura - BANCO_Y + 11}
                rx={1.5}
                fill="#0f1922"
                opacity={0.85}
              />
              {fileiras.map((f, k) =>
                k === 0 || fileiras[k - 1]?.grupo !== f.grupo ? (
                  <text
                    key={`r${f.y}`}
                    x={-2.5}
                    y={f.y - 6.6}
                    fontSize={1.8}
                    fontWeight={700}
                    fill="var(--color-cal)"
                    opacity={0.8}
                  >
                    {f.grupo === "banco"
                      ? bancoBloqueado
                        ? t("Banco: {motivo}", { motivo: bancoBloqueado })
                        : t("Banco: arraste para o campo para trocar; clique para ver o jogador")
                      : t("Fora do jogo: arraste para o banco ou para o campo")}
                  </text>
                ) : null,
              )}
              {lugares.map((l) => {
                const j = l.jogador;
                const pode = livre(l.grupo);
                const arrastado = doBanco?.id === j.id && doBanco.moveu;
                return (
                  <g
                    key={j.id}
                    transform={`translate(${l.x} ${l.y})`}
                    className={`outline-none ${pode ? "cursor-grab" : "cursor-pointer"}`}
                    opacity={pode ? (arrastado ? 0.35 : l.grupo === "fora" ? 0.8 : 1) : 0.5}
                    onPointerDown={(e) => {
                      (e.target as Element).setPointerCapture?.(e.pointerId);
                      const d = noDesenho(e);
                      if (d)
                        setDoBanco({
                          id: j.id,
                          grupo: l.grupo,
                          x: d.x,
                          y: d.y,
                          x0: d.x,
                          y0: d.y,
                          moveu: false,
                        });
                    }}
                  >
                    <title>{j.nome}</title>
                    {reservaAberta === j.id && (
                      <circle r={3.6} fill="none" stroke="#ffffff" strokeWidth={0.45} />
                    )}
                    {alvoReserva === j.id && <Anel r={4} />}
                    <circle
                      r={2.5}
                      fill={COR[j.posicao]}
                      stroke="var(--color-placar)"
                      strokeWidth={0.5}
                    />
                    <text
                      y={0.7}
                      textAnchor="middle"
                      fontSize={melhorPosicao(j).length > 2 ? 1.5 : 1.9}
                      fontWeight={800}
                      fill="var(--color-placar)"
                    >
                      {melhorPosicao(j)}
                    </text>
                    <g transform="translate(1.9 -3.5)">
                      <rect
                        x={-0.2}
                        y={-1.7}
                        width={3.9}
                        height={2.4}
                        rx={0.6}
                        fill="var(--color-placar)"
                      />
                      <text
                        x={1.75}
                        y={0.1}
                        textAnchor="middle"
                        fontSize={1.7}
                        fontWeight={800}
                        fill="var(--color-cal)"
                      >
                        {j.forca}
                      </text>
                    </g>
                    {avisos?.has(j.id) && <PontoDeAviso dx={-2.6} dy={-2.6} />}
                    <text
                      y={4.8}
                      textAnchor="middle"
                      fontSize={1.8}
                      fontWeight={700}
                      fill="var(--color-cal)"
                    >
                      {j.nome.split(" ").at(-1)}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
          {doBanco?.moveu &&
            (() => {
              const j = lugares.find((l) => l.jogador.id === doBanco.id)?.jogador;
              return j ? (
                <g transform={`translate(${doBanco.x} ${doBanco.y})`} pointerEvents="none">
                  <circle r={2.8} fill={COR[j.posicao]} stroke="#ffffff" strokeWidth={0.5} />
                  <text
                    y={0.8}
                    textAnchor="middle"
                    fontSize={melhorPosicao(j).length > 2 ? 1.8 : 2.2}
                    fontWeight={800}
                    fill="var(--color-placar)"
                  >
                    {melhorPosicao(j)}
                  </text>
                  <text
                    y={5.5}
                    textAnchor="middle"
                    fontSize={2.3}
                    fontWeight={700}
                    fill="var(--color-cal)"
                    stroke="var(--color-placar)"
                    strokeWidth={0.5}
                    paintOrder="stroke"
                  >
                    {j.nome.split(" ").at(-1)}
                  </text>
                </g>
              ) : null;
            })()}
        </svg>
        {ancora && jogadorAberto && (
          <CartaoDoJogador
            ancora={ancora}
            altura={altura + 6}
            jogador={jogadorAberto}
            vaga={vagaAberta !== null ? (vagas[vagaAberta] ?? null) : null}
            escolhido={vagaAberta !== null ? (papeis[vagaAberta] ?? null) : null}
            onde={
              vagaAberta !== null
                ? t("Em campo")
                : lugarAberto?.grupo === "banco"
                  ? t("No banco")
                  : t("Fora do jogo")
            }
            aviso={avisos?.get(jogadorAberto.id)}
            onPapel={
              vagaAberta !== null && onPapel ? (papel) => onPapel(vagaAberta, papel) : undefined
            }
            onFechar={() => {
              setReservaAberta(null);
              onSelecionar?.(null);
            }}
          />
        )}
      </div>
      <p className="text-xs text-suave">
        {t(
          "Desenho {desenhoDaFormacao}. Arraste para mudar o lugar; solte em cima de outro jogador (em campo, no banco ou fora do jogo) para trocar os dois. Clique e solte para ver o jogador e escolher a posição e a função. O número é a nota do jogador naquela vaga (verde: rende o que vale; amarelo e laranja: rende menos; vermelho: improvisado). Até 36 m do próprio gol é defesa e até {inicio} m é meio-campo. Na faixa clara, de {inicio} a {fim} m, o jogador mantém o setor de onde veio: o meia sobe até perto da área e o atacante recua sem mudar de setor. Depois de {fim} m é ataque. Campo útil de {xMin} a {xMax} m.",
          {
            desenhoDaFormacao: desenhoDaFormacao(vagas),
            inicio: FAIXA_MEIO_ATAQUE.inicio,
            fim: FAIXA_MEIO_ATAQUE.fim,
            xMin: LIMITES_VAGA.xMin,
            xMax: LIMITES_VAGA.xMax,
          },
        )}
      </p>
      {problemas.length > 0 && <p className="text-xs text-[#ff8a7e]">{problemas.join("; ")}.</p>}
    </div>
  );
}

function Anel({ r = 4.6 }: { r?: number }) {
  return <circle r={r} fill="none" stroke="#f4c430" strokeWidth={0.6} strokeDasharray="1.2 0.8" />;
}

function PontoDeAviso({ dx = -3.4, dy = -3.4 }: { dx?: number; dy?: number }) {
  return (
    <circle cx={dx} cy={dy} r={0.9} fill="#ff8a5c" stroke="var(--color-placar)" strokeWidth={0.3} />
  );
}

/**
 * Cartão flutuante do jogador, ao lado dele: força, condição, humor, aviso e, em campo, a posição e
 * a função (com a nota de cada uma ali).
 */
function CartaoDoJogador({
  ancora,
  altura,
  jogador: j,
  vaga,
  escolhido: pedido,
  onde,
  aviso,
  onPapel,
  onFechar,
}: {
  ancora: { x: number; y: number };
  altura: number;
  jogador: JogadorPartida;
  vaga: Vaga | null;
  escolhido: PapelEmCampo | null;
  onde: string;
  aviso: string | undefined;
  onPapel?: ((papel: PapelEmCampo | null) => void) | undefined;
  onFechar: () => void;
}) {
  const posicao = vaga ? posicaoDaVaga(vaga) : null;
  // Escolha feita para o lugar antigo da vaga não vale mais depois de arrastar.
  const escolhido = pedido && posicao && papelValido(posicao, pedido) ? pedido : null;
  const atual = vaga ? papelENota(j, vaga, escolhido) : null;
  const automatico = vaga ? papelENota(j, vaga, null) : null;
  const opcoes = posicao ? papeisPossiveis(posicao) : [];
  const mesmo = (a: PapelEmCampo | null, b: PapelEmCampo) =>
    !!a && a.posicao === b.posicao && a.funcao === b.funcao;
  const naturais = j.posicoesCampo?.length
    ? j.posicoesCampo.map((p) => NOME_POSICAO_CAMPO[p]).join(", ")
    : NOME_POSICAO[j.posicao];
  // À direita do jogador na metade de trás e à esquerda na da frente; para cima se estiver embaixo.
  const esquerda = ((ancora.x + 6) / 117) * 100;
  const topo = ((ancora.y + 6) / altura) * 100;
  const lado =
    ancora.x < 55
      ? { left: `calc(${esquerda}% + 2.75rem)` }
      : { right: `calc(${100 - esquerda}% + 2.75rem)` };
  const vertical =
    topo > 55
      ? { bottom: `${Math.max(0, 100 - topo - 6)}%` }
      : { top: `${Math.max(0, topo - 6)}%` };
  return (
    <div
      role="dialog"
      aria-label={j.nome}
      className="absolute z-10 flex max-h-[85%] w-72 flex-col gap-2 overflow-y-auto rounded-md border border-placar-borda bg-[#15212d] p-3 text-sm shadow-lg"
      style={{ ...lado, ...vertical }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-bold">
            {j.nome}{" "}
            {atual && (
              <span style={{ color: corDaNotaNaVaga(atual.nota, j.forca) }}>{atual.nota}</span>
            )}
          </p>
          <p className="text-xs text-suave">
            {t("{onde} · força {forca} · {posicoes}", {
              onde,
              forca: j.forca,
              posicoes: naturais,
            })}
          </p>
          <p className="text-xs text-suave">
            {t("Fôlego {condicao}% · humor {humor}", {
              condicao: Math.round(j.condicao ?? 100),
              humor: HUMOR[j.humor ?? "normal"].nome.toLowerCase(),
            })}
          </p>
          {aviso && <p className="text-xs text-[#ffb38a]">{aviso}</p>}
        </div>
        <button
          type="button"
          className="rounded px-2 text-suave hover:bg-white/10"
          onClick={onFechar}
          aria-label={t("Fechar")}
        >
          ×
        </button>
      </div>
      {vaga && onPapel && (
        <fieldset className="flex flex-col gap-0.5">
          <legend className="mb-1 text-xs font-bold text-suave">{t("Posição e função")}</legend>
          <OpcaoPapel
            ativo={!escolhido}
            titulo={t("Automática{automatico}", {
              automatico: automatico ? `: ${nomeDoPapel(automatico.papel)}` : "",
            })}
            nota={automatico?.nota}
            forca={j.forca}
            onClick={() => onPapel(null)}
          />
          {opcoes.map((p) => (
            <OpcaoPapel
              key={`${p.posicao}-${p.funcao}`}
              ativo={mesmo(escolhido, p)}
              titulo={nomeDoPapel(p)}
              descricao={DADOS_FUNCAO[p.funcao].descricao}
              nota={notaNoPapel(j, p)}
              forca={j.forca}
              onClick={() => onPapel(p)}
            />
          ))}
        </fieldset>
      )}
      {!vaga && (
        <p className="text-xs text-suave">
          {t("Arraste o jogador para cima de quem está em campo para fazer a troca.")}
        </p>
      )}
    </div>
  );
}

function OpcaoPapel({
  ativo,
  titulo,
  descricao,
  nota,
  forca,
  onClick,
}: {
  ativo: boolean;
  titulo: string;
  descricao?: string;
  nota: number | undefined;
  forca: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      title={descricao}
      className={`flex items-center gap-2 rounded-sm px-2 py-0.5 text-left ${ativo ? "bg-canarinho/20 ring-1 ring-canarinho" : "hover:bg-white/5"}`}
    >
      <span
        className="w-6 shrink-0 text-right font-bold"
        style={{ color: nota !== undefined ? corDaNotaNaVaga(nota, forca) : undefined }}
      >
        {nota ?? ""}
      </span>
      <span className="min-w-0 truncate">{titulo}</span>
    </button>
  );
}
