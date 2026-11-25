/**
 * Editor de formação: os 11 no campo, arrastáveis. Partindo de uma formação pronta, o técnico
 * leva cada jogador para onde quiser; a função da vaga (zagueiro, lateral, meia, atacante) vem do
 * lugar, e o motor respeita esse desenho na partida. O goleiro fica no gol.
 */
import { useRef, useState } from "react";
import {
  desenhoDaFormacao,
  formacaoPersonalizada,
  LIMITES_VAGA,
  validarFormacao,
  type Vaga,
} from "@newbras/engine";
import { NOME_POSICAO, type Posicao } from "@newbras/data";
import { MarcacoesCampo } from "./Pitch";

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

interface Props {
  vagas: readonly Vaga[];
  /** Nome curto de quem ocupa cada vaga (mesma ordem das vagas). */
  nomes: readonly string[];
  /** Vagas onde o jogador está fora de posição (nome em amarelo, como no Brasfoot). */
  foraDePosicao: ReadonlySet<number>;
  onMudar: (vagas: Vaga[]) => void;
}

export function EditorFormacao({ vagas, nomes, foraDePosicao, onMudar }: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const [arrastando, setArrastando] = useState<number | null>(null);
  const problemas = validarFormacao(vagas);

  const paraCampo = (e: React.PointerEvent): { x: number; y: number } | null => {
    const el = svg.current;
    const matriz = el?.getScreenCTM();
    if (!el || !matriz) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(matriz.inverse());
    return { x: p.x, y: tela(p.y) };
  };

  const mover = (i: number, x: number, y: number) => {
    const pontos = vagas.map((v) => ({ x: v.x, y: v.y }));
    pontos[i] = { x, y };
    onMudar(formacaoPersonalizada(pontos));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <svg
        ref={svg}
        viewBox="-6 -6 117 80"
        className="w-full touch-none rounded select-none"
        onPointerMove={(e) => {
          if (arrastando === null) return;
          const p = paraCampo(e);
          if (p) mover(arrastando, p.x, p.y);
        }}
        onPointerUp={() => setArrastando(null)}
        onPointerLeave={() => setArrastando(null)}
        role="group"
        aria-label="Posições do time em campo. Arraste os jogadores; o time ataca para a direita."
      >
        <MarcacoesCampo />
        {/* Faixas que decidem a função: defesa, meio-campo, ataque. */}
        <g stroke="var(--color-cal)" strokeWidth={0.25} strokeDasharray="1 1.5" opacity={0.5}>
          <line x1={36} y1={0} x2={36} y2={68} />
          <line x1={62} y1={0} x2={62} y2={68} />
        </g>
        {vagas.map((v, i) => (
          <g
            key={i}
            transform={`translate(${v.x} ${tela(v.y)})`}
            className={i === 0 ? "" : "cursor-grab"}
            onPointerDown={(e) => {
              if (i === 0) return;
              (e.target as Element).setPointerCapture?.(e.pointerId);
              setArrastando(i);
            }}
            tabIndex={i === 0 ? -1 : 0}
            role={i === 0 ? undefined : "button"}
            aria-label={
              i === 0
                ? undefined
                : `${nomes[i] ?? "Vaga"}, ${NOME_POSICAO[v.posicao]}. Setas movem o jogador.`
            }
            onKeyDown={(e) => {
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
            <circle
              r={2.6}
              fill={COR[v.posicao]}
              stroke={arrastando === i ? "#ffffff" : "var(--color-placar)"}
              strokeWidth={0.5}
            />
            <text
              y={0.9}
              textAnchor="middle"
              fontSize={2.6}
              fontWeight={800}
              fill="var(--color-placar)"
            >
              {v.posicao}
            </text>
            <text
              y={5.3}
              textAnchor="middle"
              fontSize={2.3}
              fontWeight={700}
              fill={foraDePosicao.has(i) ? "#f4e04d" : "var(--color-cal)"}
              stroke="var(--color-placar)"
              strokeWidth={0.5}
              paintOrder="stroke"
            >
              {nomes[i] ?? ""}
            </text>
          </g>
        ))}
      </svg>
      <p className="text-xs text-suave">
        Desenho {desenhoDaFormacao(vagas)}. Arraste os jogadores (ou use as setas): até {36} m do
        próprio gol é defesa, até 62 m é meio-campo, depois é ataque. Nome em amarelo = fora de
        posição. Campo útil de {LIMITES_VAGA.xMin} a {LIMITES_VAGA.xMax} m.
      </p>
      {problemas.length > 0 && <p className="text-xs text-[#ff8a7e]">{problemas.join("; ")}.</p>}
    </div>
  );
}
