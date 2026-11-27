# NewBras: instruções para agentes

Manager de futebol que recria o Brasfoot e depois evolui. Leia `docs/PESQUISA.md`, `docs/DECISOES.md` e `docs/ROADMAP.md` antes de começar uma fase.

## Regras do projeto

- O Brasfoot é a referência de partida, não o teto: o NewBras quer ser uma evolução bem melhor, buscando ideias também em PES e FIFA/FC. A paridade guia a ordem das fases; as mudanças grandes ficam registradas em `docs/DECISOES.md` (motor espacial, mercado aquecido, janelas reais, renascimento de lendas, futebol mundial, atributos, humor e condição física, posições e funções, entre outras).
- Nunca usar nome, marca, código, banco, escudos ou imagens do Brasfoot. Logotipos oficiais de clubes também não: escudos são gerados nas cores do clube.
- Textos da interface, comentários e documentação em português do Brasil.
- Todo texto que o jogador vê passa por `t("...")` de `@newbras/textos` (a chave é o próprio texto em português; partes variáveis entre chaves: `t("{n} dias", { n })`). O que o motor guarda (notícias, avisos) usa `marcar()` ou `chave()` e é traduzido ao mostrar. Mudou um texto? Rode `pnpm --filter @newbras/textos extrair` para atualizar os catálogos (o teste confere).
- Cada fase termina com `pnpm check` passando, `docs/ROADMAP.md` atualizado e o documento do cronograma atualizado. A sessão envia o trabalho num branch `claude/...`, abre o PR e faz o merge depois da CI (permissão do dono). Ao fechar uma fase, acrescenta `fase-N <commit do merge>` em `docs/tags-das-fases.txt`; a CI cria a tag no GitHub.
- Pedido do dono que já está planejado para outra fase: não antecipar. Anote em `docs/DECISOES.md` (no item da fase em que ele cabe), junte com o que já estava planejado para chegar à melhor versão e faça na fase prevista. Só entra antes o que o dono pedir explicitamente para antes, ou o que corrige um problema do que já existe.
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
