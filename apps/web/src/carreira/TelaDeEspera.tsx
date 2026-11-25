import { Botao } from "../editor/ui";

/** Enquanto o banco mundial é montado (ou se falhar). */
export function TelaDeEspera({
  titulo,
  carga,
  onBack,
}: {
  titulo: string;
  carga: { status: string; mensagem?: string };
  onBack: () => void;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="max-w-md rounded-md border-2 border-placar-borda bg-placar p-8 text-center">
        <h1 className="font-placar text-5xl font-extrabold">{titulo}</h1>
        <p className="mt-4 text-suave" role="status">
          {carga.status === "erro"
            ? `Não foi possível montar o banco: ${carga.mensagem ?? "erro desconhecido"}`
            : "Montando o banco mundial: 3.711 times e 95 mil jogadores…"}
        </p>
        {carga.status === "erro" && (
          <Botao variante="primario" className="mt-6" onClick={onBack}>
            Voltar ao menu
          </Botao>
        )}
      </div>
    </div>
  );
}
