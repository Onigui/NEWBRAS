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

| Parte      | Campos principais                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| País       | código FIFA (BRA), nome, confederação, nível (0 a 3), grupo de nomes, temporada, janelas de transferência, cores da seleção                                                                                                                                                                                                                                                                                                                      |
| Estado     | sigla, nome, país                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Data FIFA  | nome, período (MM-DD a MM-DD)                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Clube      | id, nome, nome curto, abreviação (3 letras), país, estado, cidade, estádio e capacidade, cores, reputação (1 a 5), nível (1 a 100), rivais, filial de (equipe B), técnico, fundação, escudo (forma e desenho) e até 3 camisas (desenho e duas cores), opcionais                                                                                                                                                                                  |
| Jogador    | id, nome de camisa, nome completo, nascimento, nacionalidade (e segunda), posição (G, L, Z, M, A), lado (D, E, C), atributos (12 de linha ou 5 de goleiro, 1 a 100), força (média ponderada dos atributos) e potencial, 1 ou 2 características (derivadas dos atributos), estrela, categoria de base (fora do limite de 30 profissionais por clube), clube, contrato (fim, salário e multa rescisória), número, força do auge, campos a conferir |
| Competição | id, nome, tipo, categoria (clubes ou seleções), escopo (país, estado, confederação, mundial), divisão, periodicidade, calendário, participantes (fixos e vagas), fases, pontos, desempate, acesso e rebaixamento, vagas que distribui                                                                                                                                                                                                            |
| Seleção    | país, reputação, ranking, técnico                                                                                                                                                                                                                                                                                                                                                                                                                |
| Técnico    | id, nome, nacionalidade, reputação (0 a 5), clube, seleção, humano                                                                                                                                                                                                                                                                                                                                                                               |

### Fases de competição

| Tipo           | Uso                                                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `grupos`       | Pontos corridos. Uma liga comum é 1 grupo com 2 turnos; a fase de grupos da Libertadores é 8 grupos com 2 classificados cada |
| `fase-de-liga` | Tabela única com adversários sorteados por potes, como a Champions League desde 2024                                         |
| `mata-mata`    | Jogo único ou ida e volta, com prorrogação, pênaltis e regra de mando configuráveis                                          |

Times podem entrar no meio da competição (`entramAqui`), como os classificados para a Libertadores que entram mais tarde na Copa do Brasil.

Ligas com playoffs têm a temporada regular seguida de fases de mata-mata. Os melhores colocados podem entrar direto numa fase adiante: na Championship, 5º a 8º jogam a eliminatória e 3º e 4º entram nas semifinais.

Acesso e rebaixamento (`movimentos`) usam as posições da tabela final. Em ligas divididas em grupos (Primera Federación, Serie C), `porGrupo` faz as posições valerem dentro de cada grupo. Repescagens entre divisões, como a da Bundesliga (16º contra o 3º da 2. Bundesliga), aparecem como `playoff-rebaixamento` na divisão de cima e `playoff-acesso` na de baixo.

Clubes que jogam o sistema de outro país mantêm o próprio país: Cardiff, Swansea, Wrexham e Newport (País de Gales) na Inglaterra, e o FC Andorra na Espanha. O AS Monaco fica com país França, porque Mônaco não é membro da FIFA.

## Planilhas (CSV)

Aceitam vírgula ou ponto e vírgula (o padrão do Excel em português) e nomes em português: "Meia" vira `M`, "Defesa de pênalti" vira `penalti`, `31/12/2027` vira `2027-12-31`, "sim" marca estrela.

**Jogadores:** `id, nome, nome_completo, nascimento, nacionalidade, segunda_nacionalidade, posicao, lado, forca, potencial, caracteristica_1, caracteristica_2, estrela, clube, contrato_fim, salario, multa_rescisoria, numero, forca_auge, base`, mais uma coluna por atributo: `velocidade, resistencia, forca_fisica, finalizacao, chute_longe, cabeceio, drible, passe, cruzamento, armacao, desarme, marcacao` (linha) e `reflexo, colocacao, saida, penalti, reposicao` (goleiro). Com todos os atributos da posição, a força e as características saem deles; com só alguns, o resto é gerado e os informados ficam por cima; sem nenhum, o jogo gera o perfil a partir da força e das características (sempre o mesmo para o mesmo id). As colunas `caracteristica_1` e `caracteristica_2` saem na exportação só como informação.

**Clubes:** `id, nome, nome_curto, abreviacao, pais, estado, cidade, estadio, capacidade, cor_primaria, cor_secundaria, cor_terciaria, reputacao, nivel, rivais, filial_de, tecnico, fundacao` (rivais separados por `|`; `filial_de` é o id do clube principal de uma equipe B ou sub-23)

Linhas com problema são apontadas pelo número da linha e não impedem a importação das outras.

## Patches

Um patch muda um banco sem copiá-lo: itens com o mesmo id substituem os do banco, itens novos são acrescentados e `remover` tira clubes, jogadores, competições ou técnicos. Jogadores de um clube removido ficam livres, e o clube sai das listas de participantes das competições.

O Editor de Equipes grava tudo o que o usuário muda num patch com id `usuario/minhas-edicoes`, guardado no navegador (IndexedDB). O banco oficial é montado de novo a cada abertura, num Web Worker, e o patch é aplicado por cima. O patch pode ser exportado e importado pela tela "Planilhas e patches"; um patch importado entra por cima das edições atuais.

## Validação

- **Erros** (impedem o uso): campo inválido, id repetido, referência a país, estado, clube ou competição que não existe, equipe B na mesma divisão do clube principal.
- **Avisos**: time inválido (menos de 1 goleiro e 11 de linha, a regra do Brasfoot), camisa repetida, rival inexistente, quantidade de participantes diferente da esperada, clube em mais de uma liga.
