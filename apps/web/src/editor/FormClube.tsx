import { useMemo, useState, type FormEvent } from "react";
import {
  Clube,
  problemasDoZod,
  type Banco,
  type Clube as ClubeT,
  type Problema,
} from "@newbras/data";
import type { Indices } from "./indices";
import { normalizar } from "./indices";
import { Botao, Campo, ListaProblemas, estiloCampo } from "./ui";

export const NOME_REPUTACAO = [
  "Municipal",
  "Estadual",
  "Nacional",
  "Continental",
  "Mundial",
] as const;

interface Props {
  clube: ClubeT;
  ligaAtual: string | undefined;
  banco: Banco;
  indices: Indices;
  rotuloSalvar: string;
  onSalvar: (clube: ClubeT, liga: string | null) => void;
  onCancelar?: () => void;
}

/** Dados do time: nome, abreviação, técnico, estádio, reputação, nível, país, estado, cores, liga e clássicos. */
export function FormClube({
  clube,
  ligaAtual,
  banco,
  indices,
  rotuloSalvar,
  onSalvar,
  onCancelar,
}: Props) {
  const [c, setC] = useState<ClubeT>(clube);
  const [liga, setLiga] = useState<string>(ligaAtual ?? "");
  const [rival, setRival] = useState("");
  const [problemas, setProblemas] = useState<Problema[]>([]);
  const mudar = (parcial: Partial<ClubeT>) => setC((a) => ({ ...a, ...parcial }));

  const estados = banco.estados.filter((e) => e.pais === c.pais);
  const ligas = indices.ligasDoPais.get(c.pais) ?? [];
  const sugestoesRival = useMemo(() => {
    const t = normalizar(rival);
    if (t.length < 2) return [];
    return banco.clubes
      .filter((x) => x.id !== c.id && !c.rivais.includes(x.id) && normalizar(x.nome).includes(t))
      .slice(0, 8);
  }, [rival, banco.clubes, c.id, c.rivais]);

  const salvar = (e: FormEvent) => {
    e.preventDefault();
    const r = Clube.safeParse(c);
    if (!r.success) {
      setProblemas(problemasDoZod(r.error, c));
      return;
    }
    setProblemas([]);
    onSalvar({ ...r.data, aConferir: [] }, liga || null);
  };

  const opcional = <K extends "estado" | "tecnico" | "fundacao">(
    chave: K,
    valor: ClubeT[K] | undefined,
  ) => {
    setC((a) => {
      const { [chave]: _x, ...resto } = a;
      return (valor === undefined || valor === "" ? resto : { ...resto, [chave]: valor }) as ClubeT;
    });
  };

  return (
    <form noValidate onSubmit={salvar} className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-4">
      <Campo rotulo="Nome" className="col-span-2">
        <input
          className={estiloCampo}
          value={c.nome}
          required
          maxLength={80}
          onChange={(e) => mudar({ nome: e.target.value })}
        />
      </Campo>
      <Campo rotulo="Nome curto" dica="Em tabelas e placares">
        <input
          className={estiloCampo}
          value={c.nomeCurto}
          required
          maxLength={20}
          onChange={(e) => mudar({ nomeCurto: e.target.value })}
        />
      </Campo>
      <Campo rotulo="Abreviação" dica="3 letras">
        <input
          className={`${estiloCampo} uppercase`}
          value={c.abreviacao}
          required
          maxLength={3}
          onChange={(e) =>
            mudar({ abreviacao: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })
          }
        />
      </Campo>

      <Campo rotulo="País">
        <select
          className={estiloCampo}
          value={c.pais}
          onChange={(e) => {
            const { estado: _e, ...resto } = c;
            setC({ ...resto, pais: e.target.value });
            setLiga("");
          }}
        >
          {[...banco.paises]
            .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
            .map((p) => (
              <option key={p.codigo} value={p.codigo}>
                {p.nome}
              </option>
            ))}
        </select>
      </Campo>
      <Campo rotulo="Estado">
        <select
          className={estiloCampo}
          value={c.estado ?? ""}
          disabled={!estados.length}
          onChange={(e) => opcional("estado", e.target.value || undefined)}
        >
          <option value="">{estados.length ? "Nenhum" : "Sem estados"}</option>
          {estados.map((e) => (
            <option key={e.sigla} value={e.sigla}>
              {e.nome}
            </option>
          ))}
        </select>
      </Campo>
      <Campo rotulo="Cidade">
        <input
          className={estiloCampo}
          value={c.cidade}
          required
          onChange={(e) => mudar({ cidade: e.target.value })}
        />
      </Campo>
      <Campo rotulo="Técnico">
        <input
          className={estiloCampo}
          value={c.tecnico ?? ""}
          onChange={(e) => opcional("tecnico", e.target.value || undefined)}
        />
      </Campo>

      <Campo rotulo="Estádio" className="col-span-2">
        <input
          className={estiloCampo}
          value={c.estadio.nome}
          required
          onChange={(e) => mudar({ estadio: { ...c.estadio, nome: e.target.value } })}
        />
      </Campo>
      <Campo rotulo="Capacidade">
        <input
          className={estiloCampo}
          type="number"
          min={500}
          max={200000}
          value={c.estadio.capacidade}
          onChange={(e) => mudar({ estadio: { ...c.estadio, capacidade: Number(e.target.value) } })}
        />
      </Campo>
      <Campo rotulo="Fundação">
        <input
          className={estiloCampo}
          type="number"
          min={1850}
          max={2100}
          value={c.fundacao ?? ""}
          onChange={(e) =>
            opcional("fundacao", e.target.value ? Number(e.target.value) : undefined)
          }
        />
      </Campo>

      <Campo rotulo="Reputação">
        <select
          className={estiloCampo}
          value={c.reputacao}
          onChange={(e) => mudar({ reputacao: Number(e.target.value) })}
        >
          {NOME_REPUTACAO.map((nome, i) => (
            <option key={nome} value={i + 1}>
              {i + 1}: {nome}
            </option>
          ))}
        </select>
      </Campo>
      <Campo rotulo="Nível (1 a 100)" dica="Base para gerar jogadores">
        <input
          className={estiloCampo}
          type="number"
          min={1}
          max={100}
          value={c.nivel}
          onChange={(e) => mudar({ nivel: Number(e.target.value) })}
        />
      </Campo>
      <Campo rotulo="Liga" className="col-span-2">
        <select className={estiloCampo} value={liga} onChange={(e) => setLiga(e.target.value)}>
          <option value="">Nenhuma liga nacional</option>
          {ligas.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nome}
            </option>
          ))}
        </select>
      </Campo>

      <fieldset className="col-span-full flex flex-wrap items-end gap-4">
        <legend className="mb-1 text-sm font-bold text-suave">Cores</legend>
        {(["primaria", "secundaria"] as const).map((k) => (
          <label key={k} className="flex items-center gap-2 text-sm">
            <input
              type="color"
              value={c.cores[k]}
              onChange={(e) => mudar({ cores: { ...c.cores, [k]: e.target.value.toUpperCase() } })}
              className="h-8 w-10 cursor-pointer rounded-sm border border-placar-borda bg-transparent"
            />
            {k === "primaria" ? "Principal" : "Secundária"}
          </label>
        ))}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-canarinho"
            checked={!!c.cores.terciaria}
            onChange={(e) => {
              const { terciaria: _t, ...cores } = c.cores;
              mudar({ cores: e.target.checked ? { ...cores, terciaria: "#FFFFFF" } : cores });
            }}
          />
          Terceira cor
        </label>
        {c.cores.terciaria && (
          <input
            type="color"
            value={c.cores.terciaria}
            onChange={(e) =>
              mudar({ cores: { ...c.cores, terciaria: e.target.value.toUpperCase() } })
            }
            className="h-8 w-10 cursor-pointer rounded-sm border border-placar-borda bg-transparent"
          />
        )}
      </fieldset>

      <div className="col-span-full">
        <span className="text-sm font-bold text-suave">Clássicos</span>
        <div className="mt-1 flex flex-wrap gap-2">
          {c.rivais.map((r) => (
            <span
              key={r}
              className="flex items-center gap-1 rounded-sm bg-[#24364a] px-2 py-1 text-sm"
            >
              {indices.clubePorId.get(r)?.nome ?? r}
              <button
                type="button"
                aria-label={`Tirar ${indices.clubePorId.get(r)?.nome ?? r} dos clássicos`}
                className="text-suave hover:text-canarinho"
                onClick={() => mudar({ rivais: c.rivais.filter((x) => x !== r) })}
              >
                ×
              </button>
            </span>
          ))}
          <div className="relative">
            <input
              className={`${estiloCampo} w-56`}
              placeholder="Adicionar rival pelo nome"
              value={rival}
              onChange={(e) => setRival(e.target.value)}
            />
            {sugestoesRival.length > 0 && (
              <ul className="absolute z-10 mt-1 w-72 rounded-sm border border-placar-borda bg-[#15212d] shadow-lg">
                {sugestoesRival.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-1.5 text-left text-sm hover:bg-[#24364a]"
                      onClick={() => {
                        mudar({ rivais: [...c.rivais, s.id] });
                        setRival("");
                      }}
                    >
                      {s.nome} <span className="text-suave">({s.pais})</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="col-span-full">
        <ListaProblemas problemas={problemas} />
        {clube.aConferir.length > 0 && (
          <p className="mt-3 text-sm text-canarinho">
            Ainda a conferir na fonte: {clube.aConferir.join(", ")}. Salvar marca como conferido.
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          {onCancelar && <Botao onClick={onCancelar}>Cancelar</Botao>}
          <Botao type="submit" variante="primario">
            {rotuloSalvar}
          </Botao>
        </div>
      </div>
    </form>
  );
}
