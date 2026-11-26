import { useEffect, useState } from "react";
import { gerarAtributos, novoId, type Clube, type Jogador } from "@newbras/data";
import { Arquivos } from "../editor/Arquivos";
import { FichaClube } from "../editor/FichaClube";
import { FormClube } from "../editor/FormClube";
import { FormJogador } from "../editor/FormJogador";
import { gruposDoPais } from "../editor/indices";
import { ListaClubes } from "../editor/ListaClubes";
import { Transferir } from "../editor/Transferir";
import { Botao, Dialogo } from "../editor/ui";
import { useEditor } from "../editor/useEditor";
import { t } from "@newbras/textos";

type Janela =
  | { tipo: "jogador"; jogador: Jogador; novo: boolean }
  | { tipo: "transferir"; jogador: Jogador }
  | { tipo: "deletar-jogador"; jogador: Jogador }
  | { tipo: "novo-clube" }
  | { tipo: "arquivos" };

/** Editor de Equipes: times e jogadores do banco, antes de começar o jogo. */
export function Editor({ onBack }: { onBack: () => void }) {
  const ed = useEditor();
  const [pais, setPais] = useState("BRA");
  const [selecionado, setSelecionado] = useState<string>();
  const [busca, setBusca] = useState("");
  const [janela, setJanela] = useState<Janela>();

  useEffect(() => {
    if (janela) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !(e.target instanceof HTMLInputElement && e.target.value)) onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [janela, onBack]);

  if (ed.carga.status !== "pronto" || !ed.banco || !ed.indices || !ed.patch) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <div className="max-w-md rounded-md border-2 border-placar-borda bg-placar p-8 text-center">
          <h1 className="font-placar text-5xl font-extrabold">{t("Editor de equipes")}</h1>
          {ed.carga.status === "erro" ? (
            <>
              <p className="mt-4 text-[#ff8a7e]">
                {t("Não foi possível montar o banco: {mensagem}", { mensagem: ed.carga.mensagem })}
              </p>
              <Botao variante="primario" className="mt-6" onClick={onBack}>
                {t("Voltar ao menu")}
              </Botao>
            </>
          ) : (
            <p className="mt-4 text-suave" role="status">
              {t("Montando o banco mundial: 3.711 times e 95 mil jogadores…")}
            </p>
          )}
        </div>
      </div>
    );
  }

  const { banco, indices, acoes, dataReferencia } = ed;
  // Sem escolha, abre o primeiro time da divisão principal do país.
  const clube = selecionado
    ? indices.clubePorId.get(selecionado)
    : gruposDoPais(banco, indices, pais)[0]?.clubes[0];
  const paisesNome = [...banco.paises].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const fechar = () => setJanela(undefined);

  const novoJogador = (c: Clube): Jogador => {
    const elenco = indices.jogadoresDoClube.get(c.id) ?? [];
    const ano = Number(dataReferencia.slice(0, 4));
    const fimContrato = elenco.find((j) => j.contrato)?.contrato?.fim.slice(5) ?? "06-30";
    const salarios = elenco
      .flatMap((j) => (j.contrato ? [j.contrato.salario] : []))
      .sort((a, b) => a - b);
    return {
      id: "novo-jogador",
      nome: t("Novo Jogador"),
      nascimento: `${ano - 22}-01-15`,
      nacionalidade: c.pais,
      posicao: "M",
      lado: "C",
      forca: Math.max(1, Math.min(100, c.nivel)),
      potencial: Math.max(1, Math.min(100, c.nivel + 8)),
      caracteristicas: ["passe"],
      atributos: gerarAtributos({
        semente: `${c.id}-novo`,
        posicao: "M",
        forca: Math.max(1, Math.min(100, c.nivel)),
        caracteristicas: ["passe"],
      }),
      estrela: false,
      base: false,
      clube: c.id,
      contrato: {
        fim: `${ano + 2}-${fimContrato}`,
        salario: salarios[Math.floor(salarios.length / 2)] ?? 10_000,
      },
      aConferir: [],
    };
  };

  const novoClube = (): Clube => ({
    id: "novo-time",
    nome: t("Novo Time"),
    nomeCurto: t("Novo Time"),
    abreviacao: "NOV",
    pais,
    cidade: t("Cidade"),
    estadio: { nome: t("Estádio Municipal"), capacidade: 10_000 },
    cores: { primaria: "#1F5FAF", secundaria: "#FFFFFF" },
    reputacao: 1,
    nivel: 40,
    rivais: [],
    aConferir: [],
  });

  return (
    <div className="flex min-h-dvh flex-col gap-3 p-3 sm:p-4 lg:h-dvh">
      <header className="flex flex-wrap items-center gap-3 rounded-md border-2 border-placar-borda bg-placar px-4 py-2.5">
        <h1 className="font-placar text-3xl font-extrabold text-cal">{t("Editor de equipes")}</h1>
        <span className="text-sm text-suave">
          {ed.edicoes
            ? t("{edicoes} {edicoes2} neste navegador", {
                edicoes: ed.edicoes,
                edicoes2: ed.edicoes === 1 ? t("mudança salva") : t("mudanças salvas"),
              })
            : t("Banco oficial, sem mudanças")}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Botao onClick={() => setJanela({ tipo: "novo-clube" })}>{t("Adicionar time")}</Botao>
          <Botao onClick={() => setJanela({ tipo: "arquivos" })}>{t("Planilhas e patches")}</Botao>
          <Botao variante="primario" onClick={onBack}>
            {t("Voltar ao menu")}
          </Botao>
        </div>
      </header>

      <div className="grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[21rem_1fr]">
        <ListaClubes
          banco={banco}
          indices={indices}
          pais={pais}
          onPais={(p) => {
            setPais(p);
            setSelecionado(undefined);
          }}
          busca={busca}
          onBusca={setBusca}
          selecionado={clube?.id}
          onClube={(id) => {
            setSelecionado(id);
            // No celular a ficha fica abaixo da lista: leva até ela.
            if (window.innerWidth < 1024)
              requestAnimationFrame(() =>
                document.getElementById("ficha-clube")?.scrollIntoView({ behavior: "smooth" }),
              );
          }}
          onJogador={(j) => {
            if (j.clube) setSelecionado(j.clube);
            setJanela({ tipo: "jogador", jogador: j, novo: false });
          }}
        />
        {clube ? (
          <FichaClube
            key={clube.id}
            clube={clube}
            banco={banco}
            indices={indices}
            dataReferencia={dataReferencia}
            onSalvarClube={(c, liga) => acoes.salvarClube(c, liga)}
            onRemoverClube={() => {
              acoes.removerClube(clube.id);
              setSelecionado(undefined);
            }}
            onNovoJogador={() =>
              setJanela({ tipo: "jogador", jogador: novoJogador(clube), novo: true })
            }
            onEditarJogador={(j) => setJanela({ tipo: "jogador", jogador: j, novo: false })}
            onTransferir={(j) => setJanela({ tipo: "transferir", jogador: j })}
            onRemoverJogador={(j) => setJanela({ tipo: "deletar-jogador", jogador: j })}
          />
        ) : (
          <section className="flex items-center justify-center rounded-md border-2 border-placar-borda bg-placar p-8 text-suave">
            {t("Este país não tem times. Adicione um.")}
          </section>
        )}
      </div>

      {janela?.tipo === "jogador" && (
        <FormJogador
          jogador={janela.jogador}
          novo={janela.novo}
          paises={paisesNome}
          dataReferencia={dataReferencia}
          onFechar={fechar}
          onSalvar={(j) => {
            const id = janela.novo
              ? novoId(j.clube ?? j.nacionalidade, j.nome, (x) =>
                  banco.jogadores.some((y) => y.id === x),
                )
              : j.id;
            acoes.salvarJogador({ ...j, id });
            fechar();
          }}
        />
      )}

      {janela?.tipo === "transferir" && (
        <Transferir
          jogador={janela.jogador}
          banco={banco}
          indices={indices}
          onFechar={fechar}
          onTransferir={(destino) => {
            acoes.transferir(janela.jogador, destino);
            fechar();
          }}
        />
      )}

      {janela?.tipo === "deletar-jogador" && (
        <Dialogo titulo={t("Deletar jogador")} onFechar={fechar} largura="max-w-md">
          <p>
            {t("Deletar {nome} do banco? Para só tirar do time, use Transferir e deixe livre.", {
              nome: janela.jogador.nome,
            })}
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Botao onClick={fechar}>{t("Cancelar")}</Botao>
            <Botao
              variante="perigo"
              data-foco
              onClick={() => {
                acoes.removerJogador(janela.jogador.id);
                fechar();
              }}
            >
              {t("Deletar")}
            </Botao>
          </div>
        </Dialogo>
      )}

      {janela?.tipo === "novo-clube" && (
        <Dialogo titulo={t("Novo time")} onFechar={fechar} largura="max-w-3xl">
          <FormClube
            clube={novoClube()}
            ligaAtual={undefined}
            banco={banco}
            indices={indices}
            rotuloSalvar={t("Criar time")}
            onCancelar={fechar}
            onSalvar={(c, liga) => {
              const id = novoId(c.pais.toLowerCase(), c.nome, (x) => indices.clubePorId.has(x));
              acoes.salvarClube({ ...c, id }, liga);
              setPais(c.pais);
              setSelecionado(id);
              setBusca("");
              fechar();
            }}
          />
        </Dialogo>
      )}

      {janela?.tipo === "arquivos" && (
        <Arquivos
          banco={banco}
          indices={indices}
          patch={ed.patch}
          pais={clube?.pais ?? pais}
          clube={clube}
          onImportar={acoes.importar}
          onPatch={acoes.aplicarPatchDeTerceiros}
          onDescartar={acoes.descartarTudo}
          onFechar={fechar}
        />
      )}
    </div>
  );
}
