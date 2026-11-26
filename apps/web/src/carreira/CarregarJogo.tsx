/**
 * Jogos salvos: continuar, baixar como arquivo, apagar, ou abrir um arquivo de outra máquina.
 */
import { useEffect, useState } from "react";
import { dataCurta, type Carreira } from "@newbras/engine";
import { Botao } from "../editor/ui";
import {
  apagarSalvamento,
  exportarCarreira,
  lerCarreira,
  listarSalvamentos,
  type Salvamento,
} from "./salvamentos";
import { t, locale } from "@newbras/textos";

export function CarregarJogo({
  onBack,
  onCarregar,
}: {
  onBack: () => void;
  onCarregar: (c: Carreira) => void;
}) {
  const [lista, setLista] = useState<Salvamento[] | null>(null);
  const [apagando, setApagando] = useState<string | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    void listarSalvamentos().then(setLista);
  }, []);

  const abrirArquivo = async (arquivo: File | undefined) => {
    if (!arquivo) return;
    try {
      const r = lerCarreira(JSON.parse(await arquivo.text()));
      if (r.ok) onCarregar(r.carreira);
      else setErro(r.erro);
    } catch {
      setErro(t("Não deu para ler o arquivo: ele não é um JSON válido."));
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-4 p-4 lg:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-md border-2 border-placar-borda bg-placar px-5 py-3">
        <div>
          <h1 className="font-placar text-4xl font-extrabold">{t("Carregar jogo")}</h1>
          <p className="text-sm text-suave">
            {t("As carreiras se salvam sozinhas a cada mudança. F2 salva na hora.")}
          </p>
        </div>
        <Botao onClick={onBack}>{t("Voltar ao menu")}</Botao>
      </header>

      <section className="flex flex-col gap-2 rounded-md border-2 border-placar-borda bg-placar p-4">
        {lista === null && <p className="text-suave">{t("Procurando jogos salvos…")}</p>}
        {lista?.length === 0 && (
          <p className="text-suave">
            {t(
              "Nenhuma carreira salva neste navegador ainda. Comece um novo jogo ou abra um arquivo.",
            )}
          </p>
        )}
        {lista?.map((s) => (
          <div
            key={s.carreira.id}
            className="flex flex-wrap items-center gap-3 border-b border-white/5 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">
                {t("{clube}, técnico {tecnico}", {
                  clube: s.resumo.clube,
                  tecnico: s.resumo.tecnico,
                })}
              </p>
              <p className="text-xs text-suave">
                {t("No jogo: {dataCurta}. Salvo em {data}.", {
                  dataCurta: dataCurta(s.resumo.data),
                  data: new Date(s.resumo.salvoEm).toLocaleString(locale()),
                })}
              </p>
            </div>
            {apagando === s.carreira.id ? (
              <>
                <span className="text-sm">{t("Apagar de vez?")}</span>
                <Botao
                  onClick={() => {
                    void apagarSalvamento(s.carreira.id).then(() => {
                      setApagando(null);
                      setLista((l) => l?.filter((x) => x.carreira.id !== s.carreira.id) ?? null);
                    });
                  }}
                >
                  {t("Apagar")}
                </Botao>
                <Botao onClick={() => setApagando(null)}>{t("Cancelar")}</Botao>
              </>
            ) : (
              <>
                <Botao onClick={() => exportarCarreira(s.carreira, s.resumo.clube)}>
                  {t("Baixar arquivo")}
                </Botao>
                <Botao onClick={() => setApagando(s.carreira.id)}>{t("Apagar")}</Botao>
                <Botao variante="primario" onClick={() => onCarregar(s.carreira)}>
                  {t("Continuar")}
                </Botao>
              </>
            )}
          </div>
        ))}
        <label className="mt-2 flex w-fit cursor-pointer items-center gap-2 rounded-sm bg-white/10 px-3 py-1.5 text-sm font-bold focus-within:ring-2 focus-within:ring-canarinho hover:bg-white/20">
          {t("Abrir um arquivo de carreira (.json)")}
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => void abrirArquivo(e.target.files?.[0])}
          />
        </label>
        {erro && <p className="text-sm text-[#ff8a7e]">{erro}</p>}
      </section>
    </div>
  );
}
