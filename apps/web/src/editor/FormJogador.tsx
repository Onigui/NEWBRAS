import { useState, type FormEvent } from "react";
import {
  FAMILIA_POSICAO,
  NOME_POSICAO_CAMPO,
  POSICOES_CAMPO,
  atributosDaPosicao,
  caracteristicasDosAtributos,
  escalarAtributos,
  forcaDosAtributos,
  gerarAtributos,
  Jogador,
  PESOS,
  LADOS,
  NOME_CARACTERISTICA,
  NOME_POSICAO,
  POSICOES,
  problemasDoZod,
  type Atributo,
  type Atributos,
  type Jogador as JogadorT,
  type Posicao,
  type Problema,
} from "@newbras/data";
import { idade, nascimentoParaIdade } from "./datas";
import { Botao, Campo, Dialogo, ListaProblemas, estiloCampo } from "./ui";

const estiloAtributo = `${estiloCampo.replace("w-full", "w-[4.5rem]")} shrink-0 py-1 text-right`;

const NOME_LADO = { D: "Direito", E: "Esquerdo", C: "Centro" } as const;

interface Props {
  jogador: JogadorT;
  novo: boolean;
  paises: { codigo: string; nome: string }[];
  dataReferencia: string;
  onSalvar: (j: JogadorT) => void;
  onFechar: () => void;
}

export function FormJogador({ jogador, novo, paises, dataReferencia, onSalvar, onFechar }: Props) {
  const [j, setJ] = useState<JogadorT>(jogador);
  const [problemas, setProblemas] = useState<Problema[]>([]);
  // A força digitada só vale ao sair do campo: escalar a cada tecla (4, depois 40) achataria o perfil.
  const [forcaDigitada, setForcaDigitada] = useState<string>();

  const mudar = (parcial: Partial<JogadorT>) => setJ((atual) => ({ ...atual, ...parcial }));

  /** Atributos mandam: força e características são recalculadas a cada mudança. */
  const comAtributos = (atual: JogadorT, posicao: Posicao, atributos: Atributos): JogadorT => {
    const forca = forcaDosAtributos(posicao, atributos);
    return {
      ...atual,
      posicao,
      atributos,
      forca,
      potencial: Math.max(atual.potencial, forca),
      caracteristicas: caracteristicasDosAtributos(posicao, atributos),
    };
  };

  const mudarPosicao = (posicao: Posicao) =>
    setJ((atual) => {
      const lado = posicao !== "L" && atual.lado !== "C" ? ("C" as const) : atual.lado;
      // Goleiro e linha têm atributos diferentes: ao trocar entre eles, o perfil é gerado de novo.
      const trocouGrupo = (posicao === "G") !== (atual.posicao === "G");
      const atributos = trocouGrupo
        ? gerarAtributos({ semente: atual.id, posicao, forca: atual.forca })
        : atual.atributos;
      // As posições de campo da família antiga deixam de valer.
      const { posicoesCampo, ...resto } = atual;
      const campo = posicoesCampo?.filter((p) => FAMILIA_POSICAO[p] === posicao);
      return comAtributos(
        { ...resto, lado, ...(campo?.length ? { posicoesCampo: campo } : {}) },
        posicao,
        atributos,
      );
    });

  const alternarPosicaoCampo = (p: (typeof POSICOES_CAMPO)[number]) =>
    setJ((atual) => {
      const { posicoesCampo, ...resto } = atual;
      const lista = posicoesCampo?.includes(p)
        ? posicoesCampo.filter((x) => x !== p)
        : [...(posicoesCampo ?? []), p].slice(0, 5);
      return lista.length ? { ...resto, posicoesCampo: lista } : resto;
    });

  const mudarAtributo = (a: Atributo, texto: string) => {
    const valor = Math.max(1, Math.min(100, Math.round(Number(texto) || 1)));
    setJ((atual) => comAtributos(atual, atual.posicao, { ...atual.atributos, [a]: valor }));
  };

  const mudarForca = (texto: string) => {
    const forca = Math.max(1, Math.min(100, Math.round(Number(texto) || 1)));
    setJ((atual) =>
      comAtributos(atual, atual.posicao, escalarAtributos(atual.posicao, atual.atributos, forca)),
    );
  };

  const numero = (texto: string) => (texto === "" ? undefined : Number(texto));

  const salvar = (e: FormEvent) => {
    e.preventDefault();
    const r = Jogador.safeParse(j);
    if (!r.success) {
      setProblemas(problemasDoZod(r.error, j));
      return;
    }
    // Campo corrigido à mão deixa de estar "a conferir".
    onSalvar({ ...r.data, aConferir: [] });
  };

  const anos = idade(j.nascimento, dataReferencia);

  return (
    <Dialogo
      titulo={novo ? "Novo jogador" : `Editar ${jogador.nome}`}
      onFechar={onFechar}
      largura="max-w-2xl"
    >
      <form
        noValidate
        onSubmit={salvar}
        className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4"
      >
        <Campo rotulo="Nome de camisa" className="col-span-2">
          <input
            className={estiloCampo}
            value={j.nome}
            maxLength={80}
            required
            onChange={(e) => mudar({ nome: e.target.value })}
          />
        </Campo>
        <Campo rotulo="Nome completo" className="col-span-2">
          <input
            className={estiloCampo}
            value={j.nomeCompleto ?? ""}
            maxLength={80}
            onChange={(e) => {
              const { nomeCompleto: _n, ...resto } = j;
              setJ(e.target.value ? { ...resto, nomeCompleto: e.target.value } : resto);
            }}
          />
        </Campo>

        <Campo rotulo="Posição">
          <select
            className={estiloCampo}
            value={j.posicao}
            onChange={(e) => mudarPosicao(e.target.value as Posicao)}
          >
            {POSICOES.map((p) => (
              <option key={p} value={p}>
                {NOME_POSICAO[p]}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Lado">
          <select
            className={estiloCampo}
            value={j.lado}
            onChange={(e) => mudar({ lado: e.target.value as JogadorT["lado"] })}
          >
            {LADOS.map((l) => (
              <option key={l} value={l}>
                {NOME_LADO[l]}
              </option>
            ))}
          </select>
        </Campo>
        <fieldset className="col-span-full flex flex-col gap-1 text-sm">
          <legend className="mb-1">
            Posições em campo{" "}
            <span className="text-xs text-suave">
              (onde ele joga de verdade; a primeira é a principal, até 5)
            </span>
          </legend>
          <div className="flex flex-wrap gap-1">
            {POSICOES_CAMPO.map((p) => {
              const ordem = j.posicoesCampo?.indexOf(p) ?? -1;
              return (
                <button
                  key={p}
                  type="button"
                  aria-pressed={ordem >= 0}
                  title={NOME_POSICAO_CAMPO[p]}
                  onClick={() => alternarPosicaoCampo(p)}
                  className={`rounded-sm px-2 py-0.5 text-xs font-bold ${ordem >= 0 ? "bg-canarinho text-placar" : "bg-white/10 hover:bg-white/20"}`}
                >
                  {p}
                  {ordem >= 0 ? ` ${ordem + 1}` : ""}
                </button>
              );
            })}
          </div>
        </fieldset>
        <Campo rotulo="Idade">
          <input
            className={estiloCampo}
            type="number"
            min={14}
            max={50}
            value={anos}
            onChange={(e) =>
              e.target.value &&
              mudar({
                nascimento: nascimentoParaIdade(
                  j.nascimento,
                  Number(e.target.value),
                  dataReferencia,
                ),
              })
            }
          />
        </Campo>
        <Campo rotulo="Nascimento">
          <input
            className={estiloCampo}
            type="date"
            value={j.nascimento}
            required
            onChange={(e) => e.target.value && mudar({ nascimento: e.target.value })}
          />
        </Campo>

        <Campo rotulo="Força (média dos atributos)">
          <input
            className={estiloCampo}
            type="number"
            min={1}
            max={100}
            value={forcaDigitada ?? j.forca}
            title="Mudar a força sobe ou desce todos os atributos na mesma proporção"
            onChange={(e) => setForcaDigitada(e.target.value)}
            onBlur={() => {
              if (forcaDigitada !== undefined && forcaDigitada !== "") mudarForca(forcaDigitada);
              setForcaDigitada(undefined);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
          />
        </Campo>
        <Campo rotulo="Potencial">
          <input
            className={estiloCampo}
            type="number"
            min={1}
            max={100}
            value={j.potencial}
            onChange={(e) => mudar({ potencial: Number(e.target.value) })}
          />
        </Campo>
        <Campo rotulo="Características" className="col-span-2">
          <p className="py-2 text-sm text-cal">
            {j.caracteristicas.map((c) => NOME_CARACTERISTICA[c]).join(" e ")}
            <span className="text-suave/70"> (os atributos mais altos)</span>
          </p>
        </Campo>

        <fieldset className="col-span-full rounded-lg border border-placar-borda p-3">
          <legend className="px-1 text-sm text-suave">
            Atributos (1 a 100). Os marcados com ● pesam na força desta posição.
          </legend>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
            {atributosDaPosicao(j.posicao).map((a) => {
              const valor = j.atributos[a] ?? 1;
              const pesa = (PESOS[j.posicao][a] ?? 0) > 0;
              return (
                <label key={a} className="flex items-center gap-2 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">
                      {pesa ? "● " : ""}
                      {NOME_CARACTERISTICA[a]}
                    </span>
                    <span className="mt-1 block h-1 rounded bg-placar-borda">
                      <span
                        className="block h-full rounded bg-canarinho"
                        style={{ width: `${valor}%` }}
                      />
                    </span>
                  </span>
                  <input
                    className={estiloAtributo}
                    type="number"
                    min={1}
                    max={100}
                    value={valor}
                    aria-label={NOME_CARACTERISTICA[a]}
                    onChange={(e) => mudarAtributo(a, e.target.value)}
                  />
                </label>
              );
            })}
          </div>
        </fieldset>

        <Campo rotulo="Nacionalidade" className="col-span-2">
          <select
            className={estiloCampo}
            value={j.nacionalidade}
            onChange={(e) => mudar({ nacionalidade: e.target.value })}
          >
            {paises.map((p) => (
              <option key={p.codigo} value={p.codigo}>
                {p.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Número">
          <input
            className={estiloCampo}
            type="number"
            min={1}
            max={99}
            value={j.numero ?? ""}
            onChange={(e) => {
              const { numero: _n, ...resto } = j;
              const n = numero(e.target.value);
              setJ(n === undefined ? resto : { ...resto, numero: n });
            }}
          />
        </Campo>
        <div className="flex flex-col justify-end gap-1.5 pb-1 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={j.estrela}
              onChange={(e) => mudar({ estrela: e.target.checked })}
              className="accent-canarinho"
            />
            Estrela (craque)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={j.base}
              onChange={(e) => mudar({ base: e.target.checked })}
              className="accent-canarinho"
            />
            Categoria de base
          </label>
        </div>

        {j.clube && (
          <>
            <Campo rotulo="Contrato até" className="col-span-2">
              <input
                className={estiloCampo}
                type="date"
                value={j.contrato?.fim ?? ""}
                onChange={(e) =>
                  e.target.value &&
                  mudar({
                    contrato: {
                      salario: j.contrato?.salario ?? 0,
                      ...j.contrato,
                      fim: e.target.value,
                    },
                  })
                }
              />
            </Campo>
            <Campo rotulo="Salário mensal" className="col-span-2">
              <input
                className={estiloCampo}
                type="number"
                min={0}
                value={j.contrato?.salario ?? ""}
                onChange={(e) =>
                  mudar({
                    contrato: {
                      fim: j.contrato?.fim ?? `${Number(dataReferencia.slice(0, 4)) + 2}-06-30`,
                      ...j.contrato,
                      salario: Number(e.target.value || 0),
                    },
                  })
                }
              />
            </Campo>
          </>
        )}

        <div className="col-span-full">
          <ListaProblemas problemas={problemas} />
          {jogador.aConferir.length > 0 && (
            <p className="mt-3 text-sm text-canarinho">
              A fonte não trouxe com precisão: {jogador.aConferir.join(", ")}. Salvar marca como
              conferido.
            </p>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <Botao onClick={onFechar}>Cancelar</Botao>
            <Botao type="submit" variante="primario">
              Salvar jogador
            </Botao>
          </div>
        </div>
      </form>
    </Dialogo>
  );
}
