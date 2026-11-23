/**
 * Campo visto de cima, desenhado em escala real (105 x 68 m).
 * Na tela inicial ele mostra dois times perfilados; na Fase 6 vira o mini-campo da partida.
 */

const L = 105;
const W = 68;
const CAL = "var(--color-cal)";

// Posições em metros (x ao longo do campo, y na largura).
const MANDANTE_442: ReadonlyArray<readonly [number, number]> = [
  [5, 34],
  [20, 8],
  [17, 26],
  [17, 42],
  [20, 60],
  [36, 10],
  [33, 27],
  [33, 41],
  [36, 58],
  [47, 28],
  [48, 41],
];

const VISITANTE_433: ReadonlyArray<readonly [number, number]> = [
  [100, 34],
  [85, 9],
  [88, 26],
  [88, 42],
  [85, 59],
  [72, 20],
  [74, 34],
  [72, 48],
  [60, 11],
  [57, 34],
  [60, 57],
];

export function Pitch({
  className = "",
  fit = "slice",
}: {
  className?: string;
  fit?: "slice" | "meet";
}) {
  const stripes = Array.from({ length: 10 }, (_, i) => i).filter((i) => i % 2 === 1);
  return (
    <svg
      className={className}
      viewBox={`-6 -6 ${L + 12} ${W + 12}`}
      preserveAspectRatio={`xMidYMid ${fit}`}
      aria-hidden="true"
    >
      <rect x={-6} y={-6} width={L + 12} height={W + 12} fill="var(--color-gramado)" />
      {stripes.map((i) => (
        <rect key={i} x={i * (L / 10)} y={0} width={L / 10} height={W} fill="var(--color-faixa)" />
      ))}

      <g fill="none" stroke={CAL} strokeWidth={0.35} opacity={0.85}>
        <rect x={0} y={0} width={L} height={W} />
        <line x1={L / 2} y1={0} x2={L / 2} y2={W} />
        <circle cx={L / 2} cy={W / 2} r={9.15} />
        {/* Grandes áreas */}
        <rect x={0} y={W / 2 - 20.16} width={16.5} height={40.32} />
        <rect x={L - 16.5} y={W / 2 - 20.16} width={16.5} height={40.32} />
        {/* Pequenas áreas */}
        <rect x={0} y={W / 2 - 9.16} width={5.5} height={18.32} />
        <rect x={L - 5.5} y={W / 2 - 9.16} width={5.5} height={18.32} />
        {/* Meias-luas */}
        <path d={`M16.5 ${W / 2 - 7.3} A9.15 9.15 0 0 1 16.5 ${W / 2 + 7.3}`} />
        <path d={`M${L - 16.5} ${W / 2 - 7.3} A9.15 9.15 0 0 0 ${L - 16.5} ${W / 2 + 7.3}`} />
        {/* Gols */}
        <rect x={-2} y={W / 2 - 3.66} width={2} height={7.32} />
        <rect x={L} y={W / 2 - 3.66} width={2} height={7.32} />
      </g>
      <g fill={CAL} opacity={0.85}>
        <circle cx={L / 2} cy={W / 2} r={0.4} />
        <circle cx={11} cy={W / 2} r={0.4} />
        <circle cx={L - 11} cy={W / 2} r={0.4} />
      </g>

      {MANDANTE_442.map(([x, y], i) => (
        <circle key={`m${i}`} cx={x} cy={y} r={1.5} fill="var(--color-canarinho)" />
      ))}
      {VISITANTE_433.map(([x, y], i) => (
        <circle
          key={`v${i}`}
          cx={x}
          cy={y}
          r={1.5}
          fill="var(--color-cal)"
          stroke="var(--color-placar)"
          strokeWidth={0.3}
        />
      ))}
      <circle
        cx={L / 2 + 1.6}
        cy={W / 2 + 0.6}
        r={0.7}
        fill="#ffffff"
        stroke="#1d2b3a"
        strokeWidth={0.2}
      />
    </svg>
  );
}
