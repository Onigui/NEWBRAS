/**
 * Editor de escalação em campo: os 11 arrastáveis, cada um com a posição de campo (CA, VOL, PD...)
 * e a nota dele ali, que muda na hora conforme o lugar e a função. Clicar num jogador abre a
 * vaga: dá para escolher a posição e a função (o centroavante que joga de falso 9) e quem ocupa
 * a vaga. O goleiro fica no gol.
 */
import { useRef, useState } from "react";
import {
  desenhoDaFormacao,
  formacaoPersonalizada,
  LIMITES_VAGA,
  papelNaVaga,
  validarFormacao,
  type JogadorPartida,
  type Vaga,
} from "@newbras/engine";
import {
  DADOS_FUNCAO,
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
}

export function EditorFormacao({
  vagas,
  ocupantes,
  papeis = [],
  selecionada = null,
  onSelecionar,
  onMudar,
}: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const [arrastando, setArrastando] = useState<number | null>(null);
  const inicio = useRef<{ x: number; y: number; moveu: boolean } | null>(null);
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

  const soltar = () => {
    if (arrastando !== null && inicio.current && !inicio.current.moveu)
      onSelecionar?.(selecionada === arrastando ? null : arrastando);
    setArrastando(null);
    inicio.current = null;
  };

  return (
    <div className="flex flex-col gap-1.5">
      <svg
        ref={svg}
        viewBox="-6 -6 117 80"
        className="w-full touch-none rounded select-none"
        onPointerMove={(e) => {
          if (arrastando === null || arrastando === 0) return;
          const p = paraCampo(e);
          if (!p) return;
          const ini = inicio.current;
          if (ini && !ini.moveu && Math.hypot(p.x - ini.x, p.y - ini.y) < 1.2) return;
          if (ini) ini.moveu = true;
          mover(arrastando, p.x, p.y);
        }}
        onPointerUp={soltar}
        onPointerLeave={() => {
          setArrastando(null);
          inicio.current = null;
        }}
        role="group"
        aria-label={t(
          "Posições do time em campo. Arraste os jogadores; clique para escolher a função. O time ataca para a direita.",
        )}
      >
        <MarcacoesCampo />
        {/* Faixas que decidem a família da vaga: defesa, meio-campo, ataque. */}
        <g stroke="var(--color-cal)" strokeWidth={0.25} strokeDasharray="1 1.5" opacity={0.5}>
          <line x1={36} y1={0} x2={36} y2={68} />
          <line x1={62} y1={0} x2={62} y2={68} />
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
              className={i === 0 ? "cursor-pointer" : "cursor-grab"}
              onPointerDown={(e) => {
                (e.target as Element).setPointerCapture?.(e.pointerId);
                const p = paraCampo(e);
                inicio.current = p ? { ...p, moveu: false } : null;
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
      </svg>
      <p className="text-xs text-suave">
        {t(
          "Desenho {desenhoDaFormacao}. Arraste para mudar o lugar; clique para escolher a posição, a função e quem joga ali. O número é a nota do jogador naquela vaga (verde: rende o que vale; amarelo e laranja: rende menos; vermelho: improvisado). Até 36 m do próprio gol é defesa, até 62 m é meio-campo, depois é ataque. Campo útil de {xMin} a {xMax} m.",
          {
            desenhoDaFormacao: desenhoDaFormacao(vagas),
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
