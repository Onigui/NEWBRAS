import { useId } from "react";
import type { Camisa as CamisaT } from "@newbras/data";

const CORPO = "M30 8 L42 4 Q50 12 58 4 L70 8 L94 22 L84 40 L74 34 V94 H26 V34 L16 40 L6 22 Z";

/** Camisa desenhada com o padrão e as cores escolhidos. */
export function Camisa({
  camisa,
  numero,
  tamanho = 56,
  rotulo,
}: {
  camisa: CamisaT;
  numero?: number;
  tamanho?: number;
  rotulo?: string;
}) {
  const id = useId().replace(/:/g, "");
  const { padrao, cor1, cor2 } = camisa;
  return (
    <svg
      viewBox="0 0 100 100"
      width={tamanho}
      height={tamanho}
      role="img"
      aria-label={rotulo ?? "Camisa"}
    >
      <defs>
        <clipPath id={`c${id}`}>
          <path d={CORPO} />
        </clipPath>
      </defs>
      <g clipPath={`url(#c${id})`}>
        <rect width="100" height="100" fill={cor1} />
        {padrao === "listras-verticais" &&
          [30, 46, 62].map((x) => <rect key={x} x={x} width="8" height="100" fill={cor2} />)}
        {padrao === "listras-horizontais" &&
          [30, 50, 70].map((y) => <rect key={y} y={y} width="100" height="9" fill={cor2} />)}
        {padrao === "faixa-diagonal" && (
          <path
            d="M0 30 L30 0 H48 L0 48 Z M26 100 L100 26 V44 L44 100 Z"
            fill={cor2}
            transform="translate(0 0)"
          />
        )}
        {padrao === "metades" && <rect x="50" width="50" height="100" fill={cor2} />}
        {padrao === "gola-contraste" && (
          <>
            <rect y="0" width="100" height="16" fill={cor2} />
            <rect x="6" y="20" width="12" height="20" fill={cor2} />
            <rect x="82" y="20" width="12" height="20" fill={cor2} />
          </>
        )}
      </g>
      <path d="M42 4 Q50 12 58 4" fill="none" stroke={cor2} strokeWidth="3" />
      <path d={CORPO} fill="none" stroke="#0F1720" strokeOpacity="0.55" strokeWidth="2" />
      {numero !== undefined && (
        <text
          x="50"
          y="64"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="var(--font-placar)"
          fontWeight="800"
          fontSize="30"
          fill={padrao === "metades" ? "#FFFFFF" : cor2}
          stroke="#0F1720"
          strokeOpacity={padrao === "metades" ? 0.8 : 0}
          strokeWidth="1"
          paintOrder="stroke"
        >
          {numero}
        </text>
      )}
    </svg>
  );
}
