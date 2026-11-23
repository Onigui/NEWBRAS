# NewBras: instruções para agentes

Manager de futebol que recria o Brasfoot e depois evolui. Leia `docs/PESQUISA.md`, `docs/DECISOES.md` e `docs/ROADMAP.md` antes de começar uma fase.

## Regras do projeto

- Paridade antes de inovação. Exceções aprovadas em `docs/DECISOES.md` (motor espacial, mercado aquecido, janelas reais, renascimento de lendas, futebol mundial).
- Nunca usar nome, marca, código, banco, escudos ou imagens do Brasfoot. Logotipos oficiais de clubes também não: escudos são gerados nas cores do clube.
- Textos da interface, comentários e documentação em português do Brasil.
- Cada fase termina com `pnpm check` passando, `docs/ROADMAP.md` atualizado e o documento do cronograma atualizado. A sessão envia o trabalho num branch `claude/...`; o dono do repositório faz o merge no `main` e cria a tag `fase-N`.
- Formato dos dados: `docs/DADOS.md`. Esquemas em `packages/data/src/schemas`.

## Motor (`packages/engine`)

- Determinístico: todo sorteio passa por `Rng` (`src/rng.ts`). `Math.random` e `Date.now` são proibidos pelo ESLint.
- Sem dependência de DOM ou React. Roda no Web Worker e em testes Node.
- Mudou o resultado de uma mesma semente? Suba `ENGINE_VERSION`.

## Comandos

```bash
pnpm install
pnpm dev      # jogo em http://localhost:5173
pnpm check    # formato, lint, tipos, testes e build (o mesmo que a CI)
```
