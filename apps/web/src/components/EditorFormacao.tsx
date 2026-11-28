/**
 * Editor de escalação em campo: os 11 arrastáveis, cada um com a posição de campo (CA, VOL, PD...)
 * e a nota dele ali, que muda na hora conforme o lugar e a função. Clicar num jogador abre a
 * vaga: dá para escolher a posição e a função (o centroavante que joga de falso 9) e quem ocupa
 * a vaga. O goleiro fica no gol.
 */
import { useRef, useState } from "react";
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
  type PapelEmCampo,
  type Posicao,
} from "@newbras/data";
import { MarcacoesCampo } from "./Pitch";
import { t } from "@newbras/textos";

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
  /**
   * Soltar um jogador em cima de outro troca os dois de vaga (cada um assume a posição e a função
   * da vaga do outro). Recebe as duas vagas e o desenho de antes do arraste, para restaurar.
   */
  onTrocarVagas?: (a: number, b: number, vagas: Vaga[]) => void;
  /** Jogadores em campo machucados (cruz vermelha ao lado), na partida ao vivo. */
  machucados?: ReadonlySet<string>;
  /** Reservas, mostrados numa faixa abaixo do campo. */
  banco?: readonly JogadorPartida[];
  /**
   * Arrastar um jogador do campo para cima de um reserva (ou o contrário) faz a troca. Recebe a
   * vaga, o reserva que entra e o desenho de antes do arraste, para restaurar.
   */
  onBanco?: (vaga: number, reserva: string, vagas: Vaga[]) => void;
  /** Motivo de o banco não poder ser usado agora (sem trocas); null = pode. */
  bancoBloqueado?: string | null;
}

/** Distância (em metros) para o jogador solto contar como em cima de outro. */
const RAIO_DA_TROCA = 4;
/** Altura (no desenho) da faixa do banco, abaixo do campo. */
const BANCO_Y = 83;

/** Centro de cada reserva na faixa do banco. */
function lugaresDoBanco(n: number): number[] {
  if (!n) return [];
  const passo = Math.min(11, 101 / n);
  const inicio = 52.5 - (passo * (n - 1)) / 2;
  return Array.from({ length: n }, (_, k) => inicio + passo * k);
}

export function EditorFormacao({
  vagas,
  ocupantes,
  papeis = [],
  selecionada = null,
  onSelecionar,
  onMudar,
  onTrocarVagas,
  machucados,
  banco,
  onBanco,
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
  /** Reserva sob o jogador do campo arrastado (substituição ao soltar). */
  const [alvoBanco, setAlvoBanco] = useState<string | null>(null);
  /** Reserva sendo arrastado para o campo, com o ponto onde está (no desenho). */
  const [doBanco, setDoBanco] = useState<{ id: string; x: number; y: number } | null>(null);
  const problemas = validarFormacao(vagas);
  const comBanco = !!banco && !!onBanco;
  const lugares = lugaresDoBanco(banco?.length ?? 0);
  const bancoLivre = comBanco && !bancoBloqueado;

  /** Ponto do ponteiro no desenho (y da tela) e no campo (y do motor). */
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

  /** Reserva perto de um ponto do desenho. */
  const reservaSob = (x: number, y: number): string | null => {
    if (!bancoLivre || !banco || Math.abs(y - BANCO_Y) > RAIO_DA_TROCA) return null;
    let melhor: string | null = null;
    let menor = RAIO_DA_TROCA;
    lugares.forEach((bx, k) => {
      const d = Math.abs(bx - x);
      if (d < menor) {
        menor = d;
        melhor = banco[k]?.id ?? null;
      }
    });
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

  const soltar = () => {
    const ini = inicio.current;
    if (doBanco) {
      if (alvo !== null && onBanco)
        onBanco(
          alvo,
          doBanco.id,
          vagas.map((v) => ({ ...v })),
        );
      setDoBanco(null);
      setAlvo(null);
      return;
    }
    if (arrastando !== null && ini && !ini.moveu)
      onSelecionar?.(selecionada === arrastando ? null : arrastando);
    else if (arrastando !== null && ini && alvoBanco !== null && onBanco) {
      onBanco(arrastando, alvoBanco, ini.vagas);
    } else if (arrastando !== null && ini && alvo !== null && onTrocarVagas) {
      onTrocarVagas(arrastando, alvo, ini.vagas);
      if (selecionada === arrastando) onSelecionar?.(alvo);
    }
    setArrastando(null);
    setAlvo(null);
    setAlvoBanco(null);
    inicio.current = null;
  };

  return (
    <div className="flex flex-col gap-1.5">
      <svg
        ref={svg}
        viewBox={comBanco ? "-6 -6 117 97" : "-6 -6 117 80"}
        className="w-full touch-none rounded select-none"
        onPointerMove={(e) => {
          if (doBanco) {
            const d = noDesenho(e);
            if (!d) return;
            setDoBanco({ ...doBanco, x: d.x, y: d.y });
            setAlvo(vagaNoDesenho(d.x, d.y));
            return;
          }
          if (arrastando === null) return;
          const p = paraCampo(e);
          const d = noDesenho(e);
          if (!p || !d) return;
          const ini = inicio.current;
          if (ini && !ini.moveu && Math.hypot(p.x - ini.x, p.y - ini.y) < 1.2) return;
          if (ini) ini.moveu = true;
          const reserva = ocupantes[arrastando] ? reservaSob(d.x, d.y) : null;
          setAlvoBanco(reserva);
          // O goleiro não sai do gol: só pode ser arrastado até o banco.
          if (arrastando === 0) return;
          setAlvo(reserva ? null : vagaSob(arrastando, p.x, p.y));
          mover(arrastando, p.x, p.y);
        }}
        onPointerUp={soltar}
        onPointerLeave={() => {
          setArrastando(null);
          setAlvo(null);
          setAlvoBanco(null);
          setDoBanco(null);
          inicio.current = null;
        }}
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
              {alvo === i && (
                <circle
                  r={4.6}
                  fill="none"
                  stroke="#f4c430"
                  strokeWidth={0.6}
                  strokeDasharray="1.2 0.8"
                />
              )}
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
            <rect x={-4} y={75.5} width={113} height={15} rx={1.5} fill="#0f1922" opacity={0.85} />
            <text x={-2.5} y={78.4} fontSize={1.9} fontWeight={700} fill="var(--color-cal)">
              {bancoBloqueado
                ? t("Banco: {motivo}", { motivo: bancoBloqueado })
                : t("Banco: arraste um reserva para cima de quem sai, ou o contrário")}
            </text>
            {(banco ?? []).map((j, k) => {
              const x = lugares[k] ?? 0;
              const ativo = alvoBanco === j.id;
              const arrastado = doBanco?.id === j.id;
              return (
                <g
                  key={j.id}
                  transform={`translate(${x} ${BANCO_Y})`}
                  className={`group outline-none ${bancoLivre ? "cursor-grab" : "cursor-not-allowed"}`}
                  opacity={bancoLivre ? (arrastado ? 0.35 : 1) : 0.45}
                  tabIndex={-1}
                  onPointerDown={(e) => {
                    if (!bancoLivre) return;
                    (e.target as Element).setPointerCapture?.(e.pointerId);
                    const d = noDesenho(e);
                    if (d) setDoBanco({ id: j.id, x: d.x, y: d.y });
                  }}
                >
                  <title>
                    {t("{nome}, {posicao}, força {forca}", {
                      nome: j.nome,
                      posicao: j.posicoesCampo?.[0]
                        ? NOME_POSICAO_CAMPO[j.posicoesCampo[0]]
                        : NOME_POSICAO[j.posicao],
                      forca: j.forca,
                    })}
                  </title>
                  {ativo && (
                    <circle
                      r={4.2}
                      fill="none"
                      stroke="#f4c430"
                      strokeWidth={0.6}
                      strokeDasharray="1.2 0.8"
                    />
                  )}
                  <circle
                    r={2.6}
                    fill={COR[j.posicao]}
                    stroke="var(--color-placar)"
                    strokeWidth={0.5}
                  />
                  <text
                    y={0.75}
                    textAnchor="middle"
                    fontSize={1.9}
                    fontWeight={800}
                    fill="var(--color-placar)"
                  >
                    {j.forca}
                  </text>
                  <text
                    y={5}
                    textAnchor="middle"
                    fontSize={1.9}
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
        {doBanco &&
          (() => {
            const j = banco?.find((x) => x.id === doBanco.id);
            return j ? (
              <g transform={`translate(${doBanco.x} ${doBanco.y})`} pointerEvents="none">
                <circle r={2.8} fill={COR[j.posicao]} stroke="#ffffff" strokeWidth={0.5} />
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
      <p className="text-xs text-suave">
        {t(
          "Desenho {desenhoDaFormacao}. Arraste para mudar o lugar (solte em cima de outro jogador para trocar os dois de vaga, com posição e função); clique para escolher a posição, a função e quem joga ali. O número é a nota do jogador naquela vaga (verde: rende o que vale; amarelo e laranja: rende menos; vermelho: improvisado). Até 36 m do próprio gol é defesa e até {inicio} m é meio-campo. Na faixa clara, de {inicio} a {fim} m, o jogador mantém o setor de onde veio: o meia sobe até perto da área e o atacante recua sem mudar de setor. Depois de {fim} m é ataque. Campo útil de {xMin} a {xMax} m.",
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

/** Quem pode ocupar a vaga, com a nota de cada um ali. */
export interface Candidato {
  jogador: JogadorPartida;
  /** Onde ele está agora: outra vaga (índice) ou no banco. */
  origem: number | "banco";
  /** Não pode entrar (já saiu, expulso...). */
  bloqueado?: string;
}

/**
 * Painel da vaga escolhida: posição e função (com a nota do jogador em cada uma) e quem pode
 * jogar ali, do que rende mais ao que rende menos.
 */
export function PainelVaga({
  vaga,
  indice,
  ocupante,
  escolhido: pedido,
  candidatos,
  rotuloTroca,
  onPapel,
  onTrocar,
  onFechar,
}: {
  vaga: Vaga;
  indice: number;
  ocupante: JogadorPartida | null;
  escolhido: PapelEmCampo | null;
  candidatos: readonly Candidato[];
  /** Texto do botão de troca (ex.: "Escalar", "Substituir"). */
  rotuloTroca: (c: Candidato) => string;
  onPapel: (papel: PapelEmCampo | null) => void;
  onTrocar: (c: Candidato) => void;
  onFechar: () => void;
}) {
  const posicao = posicaoDaVaga(vaga);
  // Escolha feita para o lugar antigo da vaga não vale mais depois de arrastar.
  const escolhido = pedido && papelValido(posicao, pedido) ? pedido : null;
  const atual = ocupante ? papelENota(ocupante, vaga, escolhido) : null;
  const automatico = ocupante ? papelENota(ocupante, vaga, null) : null;
  const opcoes = papeisPossiveis(posicao);
  const lista = candidatos
    .map((c) => ({ c, ...papelENota(c.jogador, vaga, escolhido) }))
    .sort((a, b) => b.nota - a.nota);
  const mesmo = (a: PapelEmCampo | null, b: PapelEmCampo | null) =>
    !!a && !!b && a.posicao === b.posicao && a.funcao === b.funcao;

  return (
    <div className="flex flex-col gap-3 rounded border border-placar-borda bg-[#15212d] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-suave">
            {t("Vaga {indice}: {nomePosicaoCampo}", {
              indice: indice + 1,
              nomePosicaoCampo: NOME_POSICAO_CAMPO[posicao],
            })}
          </p>
          <p className="truncate font-bold">
            {ocupante?.nome ?? t("Vaga vazia")}
            {ocupante && atual && (
              <>
                {" "}
                <span style={{ color: corDaNotaNaVaga(atual.nota, ocupante.forca) }}>
                  {atual.nota}
                </span>
                <span className="text-xs font-normal text-suave">
                  {" "}
                  {t("(força {forca})", { forca: ocupante.forca })}
                </span>
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          className="rounded px-2 text-sm text-suave hover:bg-white/10"
          onClick={onFechar}
          aria-label={t("Fechar a vaga")}
        >
          {t("Fechar")}
        </button>
      </div>

      {ocupante && (
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-xs font-bold text-suave">{t("Posição e função")}</legend>
          <OpcaoPapel
            ativo={!escolhido}
            titulo={t("Automática{automatico}", {
              automatico: automatico ? `: ${nomeDoPapel(automatico.papel)}` : "",
            })}
            descricao={t("A melhor função para quem estiver na vaga.")}
            nota={automatico?.nota}
            forca={ocupante.forca}
            onClick={() => onPapel(null)}
          />
          {opcoes.map((p) => (
            <OpcaoPapel
              key={`${p.posicao}-${p.funcao}`}
              ativo={mesmo(escolhido, p)}
              titulo={nomeDoPapel(p)}
              descricao={DADOS_FUNCAO[p.funcao].descricao}
              nota={notaNoPapel(ocupante, p)}
              forca={ocupante.forca}
              onClick={() => onPapel(p)}
            />
          ))}
        </fieldset>
      )}

      {lista.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-bold text-suave">
            {t("Quem joga aqui{escolhido}", {
              escolhido: escolhido ? ` (${nomeDoPapel(escolhido)})` : "",
            })}
          </p>
          <ul className="flex max-h-64 flex-col overflow-y-auto">
            {lista.map(({ c, nota, papel }) => (
              <li
                key={c.jogador.id}
                className="flex items-center gap-2 border-b border-white/5 py-1 text-sm"
              >
                <span
                  className="w-7 text-right font-bold"
                  style={{ color: corDaNotaNaVaga(nota, c.jogador.forca) }}
                >
                  {nota}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {c.jogador.nome}{" "}
                  <span className="text-xs text-suave">
                    {t("força {forca}, {origem}{escolhido}", {
                      forca: c.jogador.forca,
                      origem: c.origem === "banco" ? "banco" : `vaga ${c.origem + 1}`,
                      escolhido: escolhido ? "" : `, ${nomeDoPapel(papel).toLowerCase()}`,
                    })}
                  </span>
                </span>
                <button
                  type="button"
                  disabled={!!c.bloqueado}
                  title={c.bloqueado}
                  className="rounded-sm bg-white/10 px-2 py-0.5 text-xs font-bold hover:bg-white/20 disabled:opacity-40"
                  onClick={() => onTrocar(c)}
                >
                  {c.bloqueado ?? rotuloTroca(c)}
                </button>
              </li>
            ))}
          </ul>
        </div>
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
  descricao: string;
  nota: number | undefined;
  forca: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={`flex items-start gap-2 rounded-sm px-2 py-1 text-left text-sm ${ativo ? "bg-canarinho/20 ring-1 ring-canarinho" : "hover:bg-white/5"}`}
    >
      <span
        className="w-7 shrink-0 text-right font-bold"
        style={{ color: nota !== undefined ? corDaNotaNaVaga(nota, forca) : undefined }}
      >
        {nota ?? ""}
      </span>
      <span className="min-w-0">
        <span className="font-bold">{titulo}</span>
        <span className="block text-xs text-suave">{descricao}</span>
      </span>
    </button>
  );
}
