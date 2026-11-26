import { useRef, useState } from "react";
import {
  exportarClubesCsv,
  exportarJogadoresCsv,
  importarClubesCsv,
  importarJogadoresCsv,
  lerPatch,
  totalDeEdicoes,
  type Banco,
  type Clube,
  type Jogador,
  type Patch,
  type Problema,
} from "@newbras/data";
import { baixarArquivo, lerArquivo } from "./arquivos";
import type { Indices } from "./indices";
import { Botao, Dialogo, ListaProblemas } from "./ui";
import { t, locale } from "@newbras/textos";

interface Props {
  banco: Banco;
  indices: Indices;
  patch: Patch;
  pais: string;
  clube: Clube | undefined;
  onImportar: (itens: { clubes?: Clube[]; jogadores?: Jogador[] }) => void;
  onPatch: (p: Patch) => void;
  onDescartar: () => void;
  onFechar: () => void;
}

/** Planilhas (CSV) e patches: levar e trazer times e jogadores sem digitar um a um. */
export function Arquivos({
  banco,
  indices,
  patch,
  pais,
  clube,
  onImportar,
  onPatch,
  onDescartar,
  onFechar,
}: Props) {
  const entrada = useRef<HTMLInputElement>(null);
  const [aviso, setAviso] = useState<string>();
  const [problemas, setProblemas] = useState<Problema[]>([]);
  const [confirmar, setConfirmar] = useState(false);
  const nomePais = indices.paises.find((p) => p.codigo === pais)?.nome ?? pais;
  const clubesPais = indices.clubesDoPais.get(pais) ?? [];
  const edicoes = totalDeEdicoes(patch);

  const importar = async (arquivo: File) => {
    setAviso(undefined);
    setProblemas([]);
    const texto = await lerArquivo(arquivo);
    if (arquivo.name.toLowerCase().endsWith(".json")) {
      let dados: unknown;
      try {
        dados = JSON.parse(texto);
      } catch {
        setAviso(t("O arquivo não é um JSON válido."));
        return;
      }
      const r = lerPatch(dados);
      if (!r.ok) {
        setProblemas(r.problemas);
        setAviso(t("O patch tem erros e não foi aplicado."));
        return;
      }
      onPatch(r.valor);
      setAviso(
        t('Patch "{nome}" aplicado: {totalDeEdicoes} mudanças.', {
          nome: r.valor.meta.nome,
          totalDeEdicoes: totalDeEdicoes(r.valor),
        }),
      );
      return;
    }
    const cabecalho = texto.split(/\r?\n/, 1)[0]?.toLowerCase() ?? "";
    if (cabecalho.includes("abreviacao")) {
      const r = importarClubesCsv(texto);
      // Escudo e camisas não vão na planilha: quem já existe mantém os seus.
      const clubes = r.itens.map((c) => {
        const atual = indices.clubePorId.get(c.id);
        return atual
          ? {
              ...c,
              ...(atual.escudo ? { escudo: atual.escudo } : {}),
              ...(atual.camisas ? { camisas: atual.camisas } : {}),
            }
          : c;
      });
      onImportar({ clubes });
      setProblemas(r.problemas);
      setAviso(
        t("{clubes} times importados{problemas}.", {
          clubes: clubes.length,
          problemas: r.problemas.length
            ? t("; {problemas} problemas nas outras linhas", { problemas: r.problemas.length })
            : "",
        }),
      );
    } else if (cabecalho.includes("posicao")) {
      const r = importarJogadoresCsv(texto);
      onImportar({ jogadores: r.itens });
      setProblemas(r.problemas);
      setAviso(
        t("{itens} jogadores importados{problemas}.", {
          itens: r.itens.length,
          problemas: r.problemas.length
            ? t("; {problemas} problemas nas outras linhas", { problemas: r.problemas.length })
            : "",
        }),
      );
    } else {
      setAviso(
        t(
          "Não reconheci a planilha: a primeira linha precisa ter as colunas de times (com abreviacao) ou de jogadores (com posicao).",
        ),
      );
    }
  };

  const nomeArquivo = (texto: string) =>
    texto
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");

  return (
    <Dialogo titulo={t("Planilhas e patches")} onFechar={onFechar} largura="max-w-2xl">
      <section>
        <h3 className="font-placar text-xl font-bold text-canarinho">{t("Exportar planilha")}</h3>
        <p className="mt-1 text-sm text-suave">
          {t(
            "CSV que abre no Excel, no LibreOffice e no Google Planilhas. Edite e importe de volta.",
          )}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {clube && (
            <Botao
              onClick={() =>
                baixarArquivo(
                  `jogadores-${clube.id}.csv`,
                  exportarJogadoresCsv(indices.jogadoresDoClube.get(clube.id) ?? [], ";"),
                  "text/csv",
                )
              }
            >
              {t("Jogadores do {nomeCurto}", { nomeCurto: clube.nomeCurto })}
            </Botao>
          )}
          <Botao
            onClick={() =>
              baixarArquivo(
                `times-${nomeArquivo(nomePais)}.csv`,
                exportarClubesCsv(clubesPais, ";"),
                "text/csv",
              )
            }
          >
            {t("Times de {nomePais}", { nomePais })}
          </Botao>
          <Botao
            onClick={() =>
              baixarArquivo(
                `jogadores-${nomeArquivo(nomePais)}.csv`,
                exportarJogadoresCsv(
                  clubesPais.flatMap((c) => indices.jogadoresDoClube.get(c.id) ?? []),
                  ";",
                ),
                "text/csv",
              )
            }
          >
            {t("Jogadores de {nomePais}", { nomePais })}
          </Botao>
        </div>
      </section>

      <section className="mt-6">
        <h3 className="font-placar text-xl font-bold text-canarinho">{t("Patch")}</h3>
        <p className="mt-1 text-sm text-suave">
          {t(
            "O patch guarda só o que você mudou ({edicoes} {edicoes2}). Exporte para guardar ou compartilhar; importe o patch de outra pessoa para aplicar as mudanças dela por cima das suas.",
            { edicoes, edicoes2: edicoes === 1 ? t("mudança") : t("mudanças") },
          )}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Botao
            disabled={!edicoes}
            onClick={() =>
              baixarArquivo(
                "newbras-patch.json",
                JSON.stringify(patch, null, 1),
                "application/json",
              )
            }
          >
            {t("Exportar minhas edições")}
          </Botao>
          {!confirmar ? (
            <Botao variante="perigo" disabled={!edicoes} onClick={() => setConfirmar(true)}>
              {t("Descartar todas as edições")}
            </Botao>
          ) : (
            <span className="flex items-center gap-2 text-sm">
              {t("Volta ao banco oficial e não dá para desfazer.")}
              <Botao
                variante="perigo"
                onClick={() => {
                  onDescartar();
                  setConfirmar(false);
                  setAviso(t("Edições descartadas. O banco voltou ao oficial."));
                }}
              >
                {t("Confirmar")}
              </Botao>
              <Botao onClick={() => setConfirmar(false)}>{t("Cancelar")}</Botao>
            </span>
          )}
        </div>
      </section>

      <section className="mt-6">
        <h3 className="font-placar text-xl font-bold text-canarinho">{t("Importar")}</h3>
        <p className="mt-1 text-sm text-suave">
          {t(
            "Planilha de times ou de jogadores (.csv) ou patch (.json). Linhas com o mesmo id substituem; ids novos entram no banco.",
          )}
        </p>
        <input
          ref={entrada}
          type="file"
          accept=".csv,.json,text/csv,application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importar(f);
            e.target.value = "";
          }}
        />
        <Botao
          variante="primario"
          className="mt-3"
          onClick={() => entrada.current?.click()}
          data-foco
        >
          {t("Escolher arquivo")}
        </Botao>
        {aviso && (
          <p role="status" className="mt-3 text-sm text-cal">
            {aviso}
          </p>
        )}
        <ListaProblemas problemas={problemas} />
        <p className="mt-3 text-xs text-suave">
          {t("{clubes} times e {jogadores} jogadores no banco atual.", {
            clubes: banco.clubes.length.toLocaleString(locale()),
            jogadores: banco.jogadores.length.toLocaleString(locale()),
          })}
        </p>
      </section>
    </Dialogo>
  );
}
