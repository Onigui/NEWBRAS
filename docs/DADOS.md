# Formato dos dados

O banco do NewBras é aberto: um arquivo JSON com tudo, ou planilhas CSV para clubes e jogadores. Os esquemas ficam em `packages/data/src/schemas` e são a referência exata; este documento resume.

O banco oficial é montado pelo pacote `packages/banco`; o progresso e as fontes estão em `docs/fontes-banco.md`.

## Banco (JSON)

```json
{
  "formato": 1,
  "meta": {
    "id": "newbras/mundo-2026",
    "nome": "Mundo 2026",
    "versao": "1.0.0",
    "atualizadoEm": "2026-11-23"
  },
  "paises": [],
  "estados": [],
  "datasFifa": [],
  "clubes": [],
  "jogadores": [],
  "competicoes": [],
  "selecoes": [],
  "tecnicos": []
}
```

| Parte      | Campos principais                                                                                                                                                                                                                                         |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| País       | código FIFA (BRA), nome, confederação, nível (0 a 3), grupo de nomes, temporada, janelas de transferência, cores da seleção                                                                                                                               |
| Estado     | sigla, nome, país                                                                                                                                                                                                                                         |
| Data FIFA  | nome, período (MM-DD a MM-DD)                                                                                                                                                                                                                             |
| Clube      | id, nome, nome curto, abreviação (3 letras), país, estado, cidade, estádio e capacidade, cores, reputação (1 a 5), nível (1 a 100), rivais, técnico, fundação                                                                                             |
| Jogador    | id, nome de camisa, nome completo, nascimento, nacionalidade (e segunda), posição (G, L, Z, M, A), lado (D, E, C), força e potencial (1 a 100), 1 ou 2 características, estrela, clube, contrato (fim, salário e multa rescisória), número, força do auge |
| Competição | id, nome, tipo, categoria (clubes ou seleções), escopo (país, estado, confederação, mundial), divisão, periodicidade, calendário, participantes (fixos e vagas), fases, pontos, desempate, acesso e rebaixamento, vagas que distribui                     |
| Seleção    | país, reputação, ranking, técnico                                                                                                                                                                                                                         |
| Técnico    | id, nome, nacionalidade, reputação (0 a 5), clube, seleção, humano                                                                                                                                                                                        |

### Fases de competição

| Tipo           | Uso                                                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `grupos`       | Pontos corridos. Uma liga comum é 1 grupo com 2 turnos; a fase de grupos da Libertadores é 8 grupos com 2 classificados cada |
| `fase-de-liga` | Tabela única com adversários sorteados por potes, como a Champions League desde 2024                                         |
| `mata-mata`    | Jogo único ou ida e volta, com prorrogação, pênaltis e regra de mando configuráveis                                          |

Times podem entrar no meio da competição (`entramAqui`), como os classificados para a Libertadores que entram mais tarde na Copa do Brasil.

## Planilhas (CSV)

Aceitam vírgula ou ponto e vírgula (o padrão do Excel em português) e nomes em português: "Meia" vira `M`, "Defesa de pênalti" vira `penalti`, `31/12/2027` vira `2027-12-31`, "sim" marca estrela.

**Jogadores:** `id, nome, nome_completo, nascimento, nacionalidade, segunda_nacionalidade, posicao, lado, forca, potencial, caracteristica_1, caracteristica_2, estrela, clube, contrato_fim, salario, multa_rescisoria, numero`

**Clubes:** `id, nome, nome_curto, abreviacao, pais, estado, cidade, estadio, capacidade, cor_primaria, cor_secundaria, cor_terciaria, reputacao, nivel, rivais, tecnico, fundacao` (rivais separados por `|`)

Linhas com problema são apontadas pelo número da linha e não impedem a importação das outras.

## Patches

Um patch muda um banco sem copiá-lo: itens com o mesmo id substituem os do banco, itens novos são acrescentados e `remover` tira clubes, jogadores, competições ou técnicos. Jogadores de um clube removido ficam livres.

## Validação

- **Erros** (impedem o uso): campo inválido, id repetido, referência a país, estado, clube ou competição que não existe.
- **Avisos**: time inválido (menos de 1 goleiro e 11 de linha, a regra do Brasfoot), camisa repetida, rival inexistente, quantidade de participantes diferente da esperada.
