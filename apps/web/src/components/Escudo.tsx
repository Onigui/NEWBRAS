import { useId } from "react";
import { corDeTexto, escudoDoClube, type Clube } from "@newbras/data";
import { t } from "@newbras/textos";

/** Contorno de cada forma num quadro de 100 × 120. */
const FORMAS = {
  classico: "M10 8 H90 V60 C90 92 50 112 50 112 C50 112 10 92 10 60 Z",
  redondo: "M50 13 A47 47 0 1 1 49.9 13 Z",
  diamante: "M50 6 L94 60 L50 114 L6 60 Z",
  flamula: "M12 8 H88 V80 L50 112 L12 80 Z",
  moderno: "M16 8 H84 Q92 8 92 16 V68 Q92 96 50 112 Q8 96 8 68 V16 Q8 8 16 8 Z",
} as const;

type ClubeEscudo = Pick<Clube, "id" | "cores" | "escudo" | "abreviacao">;

/** Escudo desenhado nas cores do clube. Nunca usa logotipo oficial. */
export function Escudo({
  clube,
  tamanho = 48,
  className = "",
}: {
  clube: ClubeEscudo;
  tamanho?: number;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const { forma, padrao } = escudoDoClube(clube);
  const { primaria, secundaria } = clube.cores;
  const borda =
    clube.cores.terciaria ?? (corDeTexto(primaria) === "#FFFFFF" ? "#0F1720" : "#F1F4EC");
  const d = FORMAS[forma];
  // O texto fica sobre a cor que domina o centro do escudo.
  const fundoTexto =
    padrao === "metades" || padrao === "liso" || padrao === "chevron"
      ? primaria
      : padrao === "cruz" || padrao === "faixa"
        ? secundaria
        : primaria;

  return (
    <svg
      viewBox="0 0 100 120"
      width={tamanho}
      height={tamanho * 1.2}
      className={className}
      role="img"
      aria-label={t("Escudo {abreviacao}", { abreviacao: clube.abreviacao })}
    >
      <defs>
        <clipPath id={`e${id}`}>
          <path d={d} />
        </clipPath>
      </defs>
      <g clipPath={`url(#e${id})`}>
        <rect width="100" height="120" fill={primaria} />
        {padrao === "faixa" && <rect y="46" width="100" height="28" fill={secundaria} />}
        {padrao === "listras" &&
          [16, 40, 64].map((x) => <rect key={x} x={x} width="12" height="120" fill={secundaria} />)}
        {padrao === "metades" && <rect x="50" width="50" height="120" fill={secundaria} />}
        {padrao === "cruz" && (
          <>
            <rect x="38" width="24" height="120" fill={secundaria} />
            <rect y="46" width="100" height="24" fill={secundaria} />
          </>
        )}
        {padrao === "chevron" && (
          <path d="M0 24 L50 64 L100 24 V48 L50 88 L0 48 Z" fill={secundaria} />
        )}
      </g>
      <path d={d} fill="none" stroke={borda} strokeWidth="5" />
      <text
        x="50"
        y="66"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="var(--font-placar)"
        fontWeight="800"
        fontSize="30"
        fill={corDeTexto(fundoTexto)}
        stroke={corDeTexto(fundoTexto) === "#FFFFFF" ? "#0F1720" : "#FFFFFF"}
        strokeWidth="1.2"
        paintOrder="stroke"
      >
        {clube.abreviacao}
      </text>
    </svg>
  );
}
