import { useState, type FormEvent } from "react";
import {
  caracteristicasDaPosicao,
  Jogador,
  LADOS,
  NOME_CARACTERISTICA,
  NOME_POSICAO,
  POSICOES,
  problemasDoZod,
  type Caracteristica,
  type Jogador as JogadorT,
  type Posicao,
  type Problema,
} from "@newbras/data";
import { idade, nascimentoParaIdade } from "./datas";
import { Botao, Campo, Dialogo, ListaProblemas, estiloCampo } from "./ui";

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
  const validas = caracteristicasDaPosicao(j.posicao);

  const mudar = (parcial: Partial<JogadorT>) => setJ((atual) => ({ ...atual, ...parcial }));

  const mudarPosicao = (posicao: Posicao) => {
    const novas = caracteristicasDaPosicao(posicao);
    const mantidas = j.caracteristicas.filter((c) => novas.includes(c));
    mudar({
      posicao,
      caracteristicas: mantidas.length ? mantidas : [novas[0]!],
      ...(posicao !== "L" && j.lado !== "C" ? { lado: "C" as const } : {}),
    });
  };

  const mudarCaracteristica = (indice: 0 | 1, valor: string) => {
    const lista = [...j.caracteristicas] as string[];
    if (indice === 1 && !valor) lista.splice(1, 1);
    else lista[indice] = valor;
    mudar({ caracteristicas: lista as JogadorT["caracteristicas"] });
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

        <Campo rotulo="Força (1 a 100)">
          <input
            className={estiloCampo}
            type="number"
            min={1}
            max={100}
            value={j.forca}
            onChange={(e) => {
              const forca = Number(e.target.value);
              // O potencial nunca fica abaixo da força.
              mudar({ forca, potencial: Math.max(j.potencial, forca) });
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
        <Campo rotulo="Característica 1">
          <select
            className={estiloCampo}
            value={j.caracteristicas[0]}
            onChange={(e) => mudarCaracteristica(0, e.target.value)}
          >
            {validas.map((c) => (
              <option key={c} value={c}>
                {NOME_CARACTERISTICA[c]}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Característica 2">
          <select
            className={estiloCampo}
            value={j.caracteristicas[1] ?? ""}
            onChange={(e) => mudarCaracteristica(1, e.target.value)}
          >
            <option value="">Nenhuma</option>
            {validas
              .filter((c: Caracteristica) => c !== j.caracteristicas[0])
              .map((c) => (
                <option key={c} value={c}>
                  {NOME_CARACTERISTICA[c]}
                </option>
              ))}
          </select>
        </Campo>

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
