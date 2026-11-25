/** Baixa um texto como arquivo. */
export function baixarArquivo(nome: string, conteudo: string, tipo = "text/plain"): void {
  const url = URL.createObjectURL(new Blob([conteudo], { type: `${tipo};charset=utf-8` }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Lê um arquivo escolhido pelo usuário como texto. */
export function lerArquivo(arquivo: File): Promise<string> {
  return arquivo.text();
}
