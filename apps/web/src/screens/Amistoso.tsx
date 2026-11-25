import { useMemo, useState } from "react";
import type { Banco, Clube, Jogador } from "@newbras/data";
import {
  encaixe,
  escalacaoAutomatica,
  FORMACOES,
  NOMES_FORMACOES,
  type Estilo,
  type Formacao,
  type JogadorPartida,
  type LadoCampo,
  type OpcoesPartida,
  type TimePartida,
  type Vaga,
} from "@newbras/engine";
import { AoVivo } from "../partida/AoVivo";
import { EditorFormacao } from "../components/EditorFormacao";
import { Escudo } from "../components/Escudo";
import { procurar, type Indices } from "../editor/indices";
import { Botao, Campo, estiloCampo } from "../editor/ui";
import { useEditor } from "../editor/useEditor";

const NOME_ESTILO: Record<Estilo, string> = {
  equilibrado: "Equilibrado",
  ataque: "Ataque total",
  "contra-ataque": "Contra-ataque",
};

interface Escolha {
  clubeId: string;
  formacao: Formacao | "personalizada";
  /** Vagas em uso: as da formação pronta ou as arrastadas pelo técnico. */
  vagas: Vaga[];
  estilo: Estilo;
}

interface FormacaoSalva {
  nome: string;
  vagas: Vaga[];
}

const CHAVE_FORMACOES = "newbras:formacoes";

/** Formações personalizadas guardadas neste navegador (a carreira guarda as suas na Fase 8). */
function lerFormacoes(): FormacaoSalva[] {
  try {
    const bruto = localStorage.getItem(CHAVE_FORMACOES);
    const lista: unknown = bruto ? JSON.parse(bruto) : [];
    return Array.isArray(lista)
      ? (lista as FormacaoSalva[]).filter((f) => f?.vagas?.length === 11)
      : [];
  } catch {
    return [];
  }
}

function gravarFormacoes(lista: FormacaoSalva[]): void {
  try {
    localStorage.setItem(CHAVE_FORMACOES, JSON.stringify(lista));
  } catch {
    // Sem armazenamento (navegação privada): a formação vale só nesta sessão.
  }
}

const pronta = (formacao: Formacao) => FORMACOES[formacao].map((v) => ({ ...v }));

const paraPartida = (j: Jogador): JogadorPartida => ({
  id: j.id,
  nome: j.nome,
  posicao: j.posicao,
  lado: j.lado,
  forca: j.forca,
  atributos: j.atributos,
  ...(j.numero !== undefined ? { numero: j.numero } : {}),
});

function montarTime(indices: Indices, escolha: Escolha): TimePartida | null {
  const clube = indices.clubePorId.get(escolha.clubeId);
  if (!clube) return null;
  // A base não joga: só o elenco profissional.
  const jogadores = (indices.jogadoresDoClube.get(clube.id) ?? [])
    .filter((j) => !j.base)
    .map(paraPartida);
  if (jogadores.length < 11) return null;
  return {
    id: clube.id,
    nome: clube.nomeCurto,
    jogadores,
    escalacao: escalacaoAutomatica(
      jogadores,
      escolha.formacao === "personalizada" ? escolha.vagas : escolha.formacao,
    ),
    tatica: { estilo: escolha.estilo, marcacao: "leve", concentracao: "equilibrada" },
    cpu: true,
  };
}

export function Amistoso({ onBack }: { onBack: () => void }) {
  const ed = useEditor();
  const [casa, setCasa] = useState<Escolha>({
    clubeId: "bra-flamengo",
    formacao: "4-4-2",
    vagas: pronta("4-4-2"),
    estilo: "equilibrado",
  });
  const [fora, setFora] = useState<Escolha>({
    clubeId: "bra-palmeiras",
    formacao: "4-3-3",
    vagas: pronta("4-3-3"),
    estilo: "equilibrado",
  });
  const [rodada, setRodada] = useState(1);
  const [humano, setHumano] = useState<LadoCampo | "nenhum">("casa");
  const [jogo, setJogo] = useState<{ opcoes: OpcoesPartida; id: number } | null>(null);
  const [erro, setErro] = useState("");

  if (ed.carga.status !== "pronto" || !ed.banco || !ed.indices) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <div className="max-w-md rounded-md border-2 border-placar-borda bg-placar p-8 text-center">
          <h1 className="font-placar text-5xl font-extrabold">Amistoso</h1>
          <p className="mt-4 text-suave" role="status">
            {ed.carga.status === "erro"
              ? `Não foi possível montar o banco: ${ed.carga.mensagem}`
              : "Montando o banco mundial: 3.711 times e 95 mil jogadores…"}
          </p>
          {ed.carga.status === "erro" && (
            <Botao variante="primario" className="mt-6" onClick={onBack}>
              Voltar ao menu
            </Botao>
          )}
        </div>
      </div>
    );
  }
  const banco = ed.banco;
  const indices = ed.indices;

  const jogar = () => {
    const tCasa = montarTime(indices, casa);
    const tFora = montarTime(indices, fora);
    if (!tCasa || !tFora) {
      setErro("Escolha dois times com pelo menos 11 jogadores profissionais.");
      return;
    }
    if (tCasa.id === tFora.id) {
      setErro("Escolha dois times diferentes.");
      return;
    }
    setErro("");
    // O time do humano não troca sozinho por cansaço: quem decide é o técnico.
    const opcoes: OpcoesPartida = {
      semente: `amistoso:${tCasa.id}:${tFora.id}:${rodada}`,
      casa: { ...tCasa, cpu: humano !== "casa" },
      fora: { ...tFora, cpu: humano !== "fora" },
    };
    setJogo({ opcoes, id: rodada });
    setRodada((n) => n + 1);
  };

  if (jogo) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-7xl flex-col gap-4 p-4 lg:p-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-md border-2 border-placar-borda bg-placar px-5 py-3">
          <h1 className="font-placar text-4xl font-extrabold">Amistoso</h1>
          <div className="flex gap-2">
            <Botao onClick={() => setJogo(null)}>Trocar os times</Botao>
            <Botao variante="primario" onClick={onBack}>
              Voltar ao menu
            </Botao>
          </div>
        </header>
        <AoVivo
          key={jogo.id}
          opcoes={jogo.opcoes}
          clubes={{
            casa: indices.clubePorId.get(jogo.opcoes.casa.id),
            fora: indices.clubePorId.get(jogo.opcoes.fora.id),
          }}
          humano={humano === "nenhum" ? null : humano}
          onNovo={() => setJogo(null)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-4 p-4 lg:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-md border-2 border-placar-borda bg-placar px-5 py-3">
        <div>
          <h1 className="font-placar text-4xl font-extrabold">Amistoso</h1>
          <p className="text-sm text-suave">
            Escolha os times, a formação e o estilo, e acompanhe o jogo no mini-campo. Pause para
            trocar jogadores e dar instruções.
          </p>
        </div>
        <Botao variante="primario" onClick={onBack}>
          Voltar ao menu
        </Botao>
      </header>

      <section className="grid gap-4 rounded-md border-2 border-placar-borda bg-placar p-4 md:grid-cols-[1fr_auto_1fr]">
        <EscolhaTime
          titulo="Mandante"
          escolha={casa}
          onMudar={setCasa}
          banco={banco}
          indices={indices}
        />
        <div className="flex flex-col items-center justify-center gap-2">
          <Campo rotulo="Você comanda">
            <select
              className={estiloCampo}
              value={humano}
              onChange={(e) => setHumano(e.target.value as LadoCampo | "nenhum")}
            >
              <option value="casa">O mandante</option>
              <option value="fora">O visitante</option>
              <option value="nenhum">Ninguém (só assistir)</option>
            </select>
          </Campo>
          <Botao variante="primario" onClick={jogar}>
            Começar o jogo
          </Botao>
          {erro && <p className="max-w-48 text-center text-sm text-[#ff8a7e]">{erro}</p>}
        </div>
        <EscolhaTime
          titulo="Visitante"
          escolha={fora}
          onMudar={setFora}
          banco={banco}
          indices={indices}
        />
      </section>
    </div>
  );
}

function EscolhaTime({
  titulo,
  escolha,
  onMudar,
  banco,
  indices,
}: {
  titulo: string;
  escolha: Escolha;
  onMudar: (e: Escolha) => void;
  banco: Banco;
  indices: Indices;
}) {
  const [busca, setBusca] = useState("");
  const [salvas, setSalvas] = useState<FormacaoSalva[]>(lerFormacoes);
  const [nomeSalvar, setNomeSalvar] = useState("");
  const clube = indices.clubePorId.get(escolha.clubeId);
  const achados = useMemo(() => procurar(banco, busca, 8).clubes, [banco, busca]);
  // Quem a escalação automática põe em cada vaga, para mostrar os nomes no campo.
  const time = useMemo(() => montarTime(indices, escolha), [indices, escolha]);
  const porId = new Map(time?.jogadores.map((j) => [j.id, j]) ?? []);
  const titulares = time?.escalacao.titulares ?? [];
  const nomes = titulares.map((id) => porId.get(id)?.nome.split(" ").at(-1) ?? "");
  const foraDePosicao = new Set(
    titulares.flatMap((id, i) => {
      const j = porId.get(id);
      const vaga = escolha.vagas[i];
      return j && vaga && encaixe(j, vaga) < 1 ? [i] : [];
    }),
  );
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className="text-xs font-bold text-suave">{titulo}</p>
      <div className="flex items-center gap-3">
        {clube && <Escudo clube={clube} tamanho={40} />}
        <p className="truncate font-placar text-2xl font-bold">
          {clube?.nome ?? "Escolha um time"}
        </p>
      </div>
      <Campo rotulo="Trocar de time">
        <input
          className={estiloCampo}
          value={busca}
          placeholder="Ex.: Corinthians, Real Madrid"
          onChange={(e) => setBusca(e.target.value)}
        />
      </Campo>
      {achados.length > 0 && (
        <ul className="flex flex-col rounded border border-placar-borda">
          {achados.map((c: Clube) => (
            <li key={c.id}>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-white/5"
                onClick={() => {
                  onMudar({ ...escolha, clubeId: c.id });
                  setBusca("");
                }}
              >
                <Escudo clube={c} tamanho={20} />
                <span className="truncate">{c.nome}</span>
                <span className="ml-auto text-xs text-suave">{c.pais}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Campo rotulo="Formação">
          <select
            className={estiloCampo}
            value={escolha.formacao === "personalizada" ? "personalizada" : escolha.formacao}
            onChange={(e) => {
              const valor = e.target.value;
              if (valor === "personalizada") onMudar({ ...escolha, formacao: "personalizada" });
              else if (valor.startsWith("salva:")) {
                const salva = salvas.find((f) => `salva:${f.nome}` === valor);
                if (salva)
                  onMudar({
                    ...escolha,
                    formacao: "personalizada",
                    vagas: salva.vagas.map((v) => ({ ...v })),
                  });
              } else
                onMudar({
                  ...escolha,
                  formacao: valor as Formacao,
                  vagas: pronta(valor as Formacao),
                });
            }}
          >
            {NOMES_FORMACOES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
            <option value="personalizada">Personalizada</option>
            {salvas.map((f) => (
              <option key={f.nome} value={`salva:${f.nome}`}>
                Minha: {f.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Estilo">
          <select
            className={estiloCampo}
            value={escolha.estilo}
            onChange={(e) => onMudar({ ...escolha, estilo: e.target.value as Estilo })}
          >
            {(Object.keys(NOME_ESTILO) as Estilo[]).map((s) => (
              <option key={s} value={s}>
                {NOME_ESTILO[s]}
              </option>
            ))}
          </select>
        </Campo>
      </div>
      {time && (
        <EditorFormacao
          vagas={escolha.vagas}
          nomes={nomes}
          foraDePosicao={foraDePosicao}
          onMudar={(vagas) => onMudar({ ...escolha, formacao: "personalizada", vagas })}
        />
      )}
      {escolha.formacao === "personalizada" && (
        <div className="flex gap-2">
          <input
            className={estiloCampo}
            value={nomeSalvar}
            placeholder="Nome para guardar esta formação"
            onChange={(e) => setNomeSalvar(e.target.value)}
          />
          <Botao
            onClick={() => {
              const nome = nomeSalvar.trim();
              if (!nome) return;
              const lista = [
                ...salvas.filter((f) => f.nome !== nome),
                { nome, vagas: escolha.vagas },
              ];
              gravarFormacoes(lista);
              setSalvas(lista);
              setNomeSalvar("");
            }}
          >
            Guardar
          </Botao>
        </div>
      )}
    </div>
  );
}
