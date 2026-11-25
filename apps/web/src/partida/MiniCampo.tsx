/**
 * Mini-campo: os 22 e a bola vistos de cima, deslizando entre um segundo de jogo e o seguinte.
 * O eixo y é invertido para desenhar (a esquerda de quem ataca para a direita fica em cima),
 * igual ao editor de formação.
 */
import type { Evento } from "@newbras/engine";
import { MarcacoesCampo } from "../components/Pitch";
import type { Instantaneo } from "./usePartidaAoVivo";

export interface CorTime {
  fundo: string;
  texto: string;
}

interface Props {
  anterior: Instantaneo;
  atual: Instantaneo;
  fracao: number;
  cores: { casa: CorTime; fora: CorTime };
  numeros: readonly (number | undefined)[];
  destaque: Evento | null;
  rotuloDestaque?: string;
}

const tela = (y: number) => 68 - y;
const entre = (a: number, b: number, f: number) =>
  Number.isNaN(a) ? b : Number.isNaN(b) ? b : a + (b - a) * f;

export function MiniCampo({
  anterior,
  atual,
  fracao,
  cores,
  numeros,
  destaque,
  rotuloDestaque,
}: Props) {
  const bx = entre(anterior.bola[0], atual.bola[0], fracao);
  const by = entre(anterior.bola[1], atual.bola[1], fracao);
  return (
    <svg
      viewBox="-6 -6 117 80"
      className="w-full rounded-md"
      role="img"
      aria-label="Mini-campo da partida"
    >
      <MarcacoesCampo />
      {Array.from({ length: 22 }, (_, i) => {
        const x = entre(anterior.posicoes[i * 2] ?? NaN, atual.posicoes[i * 2] ?? NaN, fracao);
        const y = entre(
          anterior.posicoes[i * 2 + 1] ?? NaN,
          atual.posicoes[i * 2 + 1] ?? NaN,
          fracao,
        );
        if (Number.isNaN(x) || Number.isNaN(y)) return null;
        const cor = i < 11 ? cores.casa : cores.fora;
        const comBola = atual.dono === i;
        return (
          <g key={i} transform={`translate(${x} ${tela(y)})`}>
            <circle
              r={comBola ? 2.2 : 1.9}
              fill={cor.fundo}
              stroke={comBola ? "#ffffff" : "var(--color-placar)"}
              strokeWidth={comBola ? 0.6 : 0.35}
            />
            <text y={0.75} textAnchor="middle" fontSize={1.9} fontWeight={800} fill={cor.texto}>
              {numeros[i] ?? ""}
            </text>
          </g>
        );
      })}
      <circle cx={bx} cy={tela(by)} r={0.85} fill="#ffffff" stroke="#1d2b3a" strokeWidth={0.25} />
      {destaque && rotuloDestaque && (
        <g>
          <rect
            x={22}
            y={26}
            width={61}
            height={16}
            rx={2}
            fill="var(--color-placar)"
            opacity={0.88}
          />
          <text
            x={52.5}
            y={37.5}
            textAnchor="middle"
            fontSize={8}
            fontWeight={900}
            fill="var(--color-canarinho)"
            fontFamily="var(--font-placar, inherit)"
          >
            {rotuloDestaque}
          </text>
        </g>
      )}
    </svg>
  );
}
