/**
 * Escalação completa: formação (pronta, personalizada ou guardada), o campo com as notas na vaga,
 * o painel da vaga (posição, função e quem joga ali) e as listas de titulares e reservas, com
 * condição física, humor e o aviso de "melhor poupar".
 */
import { useState } from "react";
import {
  escalacaoAutomatica,
  FORMACOES,
  NOMES_FORMACOES,
  type Formacao,
  type Humor,
  type JogadorPartida,
  type Vaga,
} from "@newbras/engine";
import type { PapelEmCampo } from "@newbras/data";
import { Botao, Campo, estiloCampo } from "../editor/ui";
import { IconeHumor } from "../partida/Resumo";
import { corDaNotaNaVaga, EditorFormacao, nomeDoPapel, papelENota } from "./EditorFormacao";
import { t } from "@newbras/textos";

export interface EscalacaoEditavel {
  formacao: Formacao | "personalizada";
  vagas: Vaga[];
  titulares: string[];
  reservas: string[];
  papeis: (PapelEmCampo | null)[];
}

export interface FormacaoGuardada {
  nome: string;
  vagas: Vaga[];
}

/** Tamanho do banco de reservas. */
export const TAMANHO_BANCO = 9;

/** Escalação automática no formato editável (a CPU escala assim). */
export function escalacaoSugerida(
  jogadores: readonly JogadorPartida[],
  formacao: Formacao | "personalizada",
  vagas: readonly Vaga[],
  indisponiveis?: ReadonlySet<string>,
): EscalacaoEditavel {
  const e = escalacaoAutomatica(jogadores, vagas, indisponiveis ? { indisponiveis } : {});
  return {
    formacao,
    vagas: vagas.map((v) => ({ ...v })),
    titulares: [...e.titulares],
    reservas: [...e.reservas],
    papeis: vagas.map(() => null),
  };
}

interface Props {
  jogadores: readonly JogadorPartida[];
  valor: EscalacaoEditavel;
  onMudar: (e: EscalacaoEditavel) => void;
  /** Aviso de "melhor poupar" por jogador (cansado, humor ruim). */
  avisos?: ReadonlyMap<string, string>;
  /** Quem não pode jogar (lesionados, suspensos, convocados): a escalação automática pula. */
  indisponiveis?: ReadonlySet<string>;
  guardadas?: readonly FormacaoGuardada[];
  onGuardar?: (f: FormacaoGuardada) => void;
}

export function EditorEscalacao({
  jogadores,
  valor,
  onMudar,
  avisos,
  indisponiveis,
  guardadas = [],
  onGuardar,
}: Props) {
  const [selecionada, setSelecionada] = useState<number | null>(null);
  const [nomeGuardar, setNomeGuardar] = useState("");
  const porId = new Map(jogadores.map((j) => [j.id, j]));
  const ocupantes = valor.titulares.map((id) => porId.get(id) ?? null);
  const naLista = new Set([...valor.titulares, ...valor.reservas]);

  /** Põe o jogador na vaga escolhida: troca com quem estava (outra vaga, o banco ou fora da lista). */
  const escalar = (id: string, vaga: number, vagas: Vaga[] = valor.vagas) => {
    const titulares = [...valor.titulares];
    let reservas = [...valor.reservas];
    const saiu = titulares[vaga] ?? "";
    const outra = titulares.indexOf(id);
    titulares[vaga] = id;
    if (outra >= 0) titulares[outra] = saiu;
    else if (reservas.includes(id))
      // Do banco: quem sai fica no lugar dele no banco.
      reservas = reservas.map((r) => (r === id ? saiu : r)).filter(Boolean);
    else
      reservas = [saiu, ...reservas.filter((r) => r !== id)]
        .filter(Boolean)
        .slice(0, TAMANHO_BANCO);
    onMudar({ ...valor, vagas, titulares, reservas });
  };

  const alternarReserva = (id: string) => {
    const reservas = valor.reservas.includes(id)
      ? valor.reservas.filter((r) => r !== id)
      : [...valor.reservas, id].slice(0, TAMANHO_BANCO);
    onMudar({ ...valor, reservas });
  };

  const linha = (j: JogadorPartida, vaga: number | null) => {
    const v = vaga !== null ? valor.vagas[vaga] : undefined;
    const info = v ? papelENota(j, v, valor.papeis[vaga ?? 0]) : null;
    const aviso = avisos?.get(j.id);
    return (
      <>
        <td className="py-1 pr-2 text-xs font-bold text-suave">
          {info ? info.papel.posicao : j.posicao}
        </td>
        <td className="max-w-0 truncate py-1 pr-2">
          {j.humor && <IconeHumor humor={j.humor as Humor} />}
          {j.nome}
          {aviso && (
            <span className="ml-1 rounded-sm bg-[#ffa64d]/20 px-1 text-xs text-[#ffc38a]">
              {aviso}
            </span>
          )}
        </td>
        <td className="py-1 pr-2 text-right">
          <span
            className="font-bold"
            style={info ? { color: corDaNotaNaVaga(info.nota, j.forca) } : undefined}
            title={info ? nomeDoPapel(info.papel) : t("força {forca}", { forca: j.forca })}
          >
            {info?.nota ?? j.forca}
          </span>
        </td>
        <td className="w-24 py-1">
          <Folego valor={j.condicao ?? 100} />
        </td>
      </>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <Campo rotulo={t("Formação")} className="min-w-40 flex-1">
          <select
            className={estiloCampo}
            value={valor.formacao}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "personalizada") onMudar({ ...valor, formacao: "personalizada" });
              else if (v.startsWith("guardada:")) {
                const g = guardadas.find((f) => `guardada:${f.nome}` === v);
                if (g)
                  onMudar({
                    ...valor,
                    formacao: "personalizada",
                    vagas: g.vagas.map((x) => ({ ...x })),
                  });
              } else
                onMudar({
                  ...valor,
                  formacao: v as Formacao,
                  vagas: FORMACOES[v as Formacao].map((x) => ({ ...x })),
                });
            }}
          >
            {NOMES_FORMACOES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
            <option value="personalizada">{t("Personalizada")}</option>
            {guardadas.map((f) => (
              <option key={f.nome} value={`guardada:${f.nome}`}>
                {t("Minha: {nome}", { nome: f.nome })}
              </option>
            ))}
          </select>
        </Campo>
        <Botao
          onClick={() => {
            setSelecionada(null);
            onMudar(escalacaoSugerida(jogadores, valor.formacao, valor.vagas, indisponiveis));
          }}
          title={t("Os melhores para cada vaga, já descontando cansaço e humor")}
        >
          {t("Escalação automática")}
        </Botao>
      </div>

      <EditorFormacao
        vagas={valor.vagas}
        ocupantes={ocupantes}
        papeis={valor.papeis}
        selecionada={selecionada}
        onSelecionar={setSelecionada}
        onMudar={(vagas) => onMudar({ ...valor, formacao: "personalizada", vagas })}
        onTrocarVagas={(a, b, vagas) => {
          const titulares = [...valor.titulares];
          [titulares[a], titulares[b]] = [titulares[b] ?? "", titulares[a] ?? ""];
          onMudar({ ...valor, vagas, titulares });
        }}
        banco={valor.reservas.flatMap((id) => {
          const j = porId.get(id);
          return j ? [j] : [];
        })}
        foraDoJogo={jogadores.filter((j) => !naLista.has(j.id))}
        onBanco={(vaga, entra, vagas) => escalar(entra, vaga, vagas)}
        onTrocarReservas={(reserva, fora) =>
          onMudar({ ...valor, reservas: valor.reservas.map((r) => (r === reserva ? fora : r)) })
        }
        avisos={avisos}
        onPapel={(vaga, papel) => {
          const papeis = valor.vagas.map((_, i) => valor.papeis[i] ?? null);
          papeis[vaga] = papel;
          onMudar({ ...valor, papeis });
        }}
      />

      {onGuardar && valor.formacao === "personalizada" && (
        <div className="flex gap-2">
          <input
            className={estiloCampo}
            value={nomeGuardar}
            placeholder={t("Nome para guardar esta formação")}
            onChange={(e) => setNomeGuardar(e.target.value)}
          />
          <Botao
            onClick={() => {
              const nome = nomeGuardar.trim();
              if (!nome) return;
              onGuardar({ nome, vagas: valor.vagas.map((v) => ({ ...v })) });
              setNomeGuardar("");
            }}
          >
            {t("Guardar")}
          </Botao>
        </div>
      )}

      <details className="text-sm">
        <summary className="cursor-pointer text-suave">
          {t("Lista do elenco: titulares, banco e quem está fora, com fôlego e humor")}
        </summary>
        <div className="mt-2 grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="mb-1 text-sm font-bold">{t("Titulares")}</h3>
            <table className="w-full table-fixed text-sm">
              <tbody>
                {valor.titulares.map((id, i) => {
                  const j = porId.get(id);
                  return (
                    <tr
                      key={`${i}-${id}`}
                      className={`cursor-pointer border-b border-white/5 hover:bg-white/5 ${selecionada === i ? "bg-canarinho/10" : ""}`}
                      onClick={() => setSelecionada(selecionada === i ? null : i)}
                    >
                      {j ? (
                        linha(j, i)
                      ) : (
                        <td colSpan={4} className="py-1 text-suave">
                          {t("Vaga vazia")}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-1 text-xs text-suave">
              {t("Clique num titular para abrir o cartão dele no campo.")}
            </p>
          </div>
          <div>
            <h3 className="mb-1 text-sm font-bold">
              {t("Reservas ({reservas} de {tamanhoBanco})", {
                reservas: valor.reservas.length,
                tamanhoBanco: TAMANHO_BANCO,
              })}
            </h3>
            <table className="w-full table-fixed text-sm">
              <tbody>
                {valor.reservas.map((id) => {
                  const j = porId.get(id);
                  return j ? (
                    <tr key={id} className="border-b border-white/5">
                      {linha(j, null)}
                      <td className="w-8 py-1 text-right">
                        <button
                          type="button"
                          className="rounded px-1 text-xs text-suave hover:bg-white/10"
                          onClick={() => alternarReserva(id)}
                          aria-label={t("Tirar {nome} do banco", { nome: j.nome })}
                        >
                          {t("tirar")}
                        </button>
                      </td>
                    </tr>
                  ) : null;
                })}
              </tbody>
            </table>
            {jogadores.some((j) => !naLista.has(j.id)) && (
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer text-suave">
                  {t("Fora da lista ({jogadores})", {
                    jogadores: jogadores.filter((j) => !naLista.has(j.id)).length,
                  })}
                </summary>
                <table className="mt-1 w-full table-fixed">
                  <tbody>
                    {jogadores
                      .filter((j) => !naLista.has(j.id))
                      .map((j) => (
                        <tr key={j.id} className="border-b border-white/5">
                          {linha(j, null)}
                          <td className="w-12 py-1 text-right">
                            <button
                              type="button"
                              disabled={valor.reservas.length >= TAMANHO_BANCO}
                              className="rounded px-1 text-xs text-suave hover:bg-white/10 disabled:opacity-40"
                              onClick={() => alternarReserva(j.id)}
                            >
                              {t("ao banco")}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </details>
            )}
          </div>
        </div>
      </details>
    </div>
  );
}

/** Barra de condição física (verde descansado, amarelo cansado, vermelho esgotado). */
export function Folego({ valor }: { valor: number }) {
  const cor =
    valor >= 85 ? "#7ed37a" : valor >= 70 ? "#f4e04d" : valor >= 55 ? "#ffa64d" : "#ff6b5c";
  return (
    <div
      className="flex items-center gap-1"
      title={t("Condição física {valor}%", { valor: Math.round(valor) })}
    >
      <div className="h-1.5 flex-1 rounded-full bg-white/10">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.max(3, valor)}%`, background: cor }}
        />
      </div>
      <span className="w-8 text-right text-xs text-suave">{Math.round(valor)}%</span>
    </div>
  );
}
