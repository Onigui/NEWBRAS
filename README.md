# NEWBRAS (protótipo)

Protótipo de manager de futebol inspirado na experiência clássica de jogos como Brasfoot, mas com arquitetura moderna, modular e expansível.

## O que já foi implementado

- Simulação de liga em turno e returno.
- Elencos com jogadores por posição (GOL/ZAG/LAT/MEI/ATA).
- Força de ataque/defesa derivada do elenco.
- Distribuição de gols para artilharia individual.
- Janela de transferências no meio da temporada.
- Evolução de jogadores ao fim da época (com regressão por idade).
- Aposentadoria de veteranos e promoção automática de jogadores da base.
- Fechamento financeiro simples (prêmios + folha salarial).
- Persistência básica de carreira (SQLite): campeão, artilheiro e tabela completa por temporada.
- Protótipo Web com temporadas sequenciais, estilo tático, criação de jogador próprio e histórico em localStorage.

## Executar demo

```bash
python3 src/newbras/simulate.py
```

## Rodar no navegador

```bash
cd web
python3 -m http.server 8080
```

Depois abra `http://localhost:8080` no navegador.

No Web você pode:
- escolher seu time;
- criar jogador próprio para seu time;
- escolher estilo tático (equilibrado/ofensivo/defensivo);
- disputar rodada por rodada (partida por partida da temporada);
- simular a próxima rodada quando quiser;
- avançar para próxima temporada;
- acompanhar evolução/regressão de jogadores por idade;
- ver aposentadorias e promoção automática da base ao fim da temporada;
- salvar histórico local no navegador.

## Testar só pelo navegador (sem instalar nada)

Sim, dá para testar sem baixar nada localmente.

### Opção 1: GitHub Pages (recomendado)
1. Suba commits no branch `work` com mudanças em `web/`.
2. O workflow `.github/workflows/pages.yml` publica automaticamente o conteúdo da pasta `web/`.
3. Abra a URL de Pages do repositório e jogue direto no navegador.

> Observação: GitHub Pages roda apenas frontend estático.
> Então o jogo Web funciona 100% lá, mas o backend Python/CLI não roda no Pages.

### Opção 2: GitHub Codespaces (também sem instalar local)
- Abra um Codespace no repositório.
- Rode `python3 -m http.server 8080 -d web`.
- Abra a porta 8080 no browser do próprio Codespaces.


## Passo a passo (GitHub, sem instalar nada)

1. Entre no repositório no GitHub.
2. Vá em **Settings → Pages**.
3. Em **Build and deployment**, selecione **Source: GitHub Actions**.
4. Garanta que o arquivo `.github/workflows/pages.yml` está no branch `work`.
5. Faça um commit qualquer na pasta `web/` (ou rode manualmente em **Actions → Deploy Web Prototype to GitHub Pages → Run workflow**).
6. Aguarde o workflow terminar (ícone verde em **Actions**).
7. Volte em **Settings → Pages** e abra a URL publicada.
8. Pronto: o jogo roda direto no navegador, sem instalação local.

### Se não publicar
- Confira se o branch usado é `work`.
- Confira se a aba **Actions** está habilitada para o repositório.
- Confira se o job de deploy está com permissão para Pages (já configurado no workflow).


### Erro comum do Actions: `Get Pages site failed (Not Found)`
Isso significa que o GitHub Pages ainda não está habilitado no repositório.

Como corrigir:
1. Abra **Settings → Pages**.
2. Em **Build and deployment**, selecione **Source: GitHub Actions** e salve.
3. Rode novamente o workflow de deploy.

Também atualizamos o workflow para:
- tentar habilitar Pages automaticamente (`enablement: true`);
- rodar ações JavaScript em Node 24 (`FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true`) para evitar o aviso de depreciação do Node 20.

## CLI de carreira

```bash
PYTHONPATH=src python3 -m newbras.cli season --db ./career.db
PYTHONPATH=src python3 -m newbras.cli history --db ./career.db
PYTHONPATH=src python3 -m newbras.cli history --db ./career.db --detailed
```

## Testar o estado atual

```bash
python3 -m pytest -q
```

## Estrutura atual

- `src/newbras/domain.py`: entidades de domínio (`Player`, `Team`).
- `src/newbras/engine.py`: motor de temporada, calendário e transferências.
- `src/newbras/demo.py`: fábrica da liga demo e saída de console.
- `src/newbras/career.py`: persistência SQLite de histórico e tabela por temporada.
- `src/newbras/cli.py`: comandos de demo, simulação de temporada e histórico detalhado.
- `src/newbras/simulate.py`: camada de compatibilidade para imports antigos.
- `tests/test_simulate.py`: testes automatizados da temporada e regras básicas.
- `tests/test_career.py`: testes automatizados de persistência de carreira.

## Próximos passos

1. Persistir tabela completa, elenco e finanças por temporada.
2. Expor API com FastAPI.
3. Interface moderna (React + TypeScript).
4. Implementar staff, tática detalhada, lesões e calendário com copas.
5. Adicionar divisões, promoção/rebaixamento e torneios mata-mata.

## Observações legais

A inspiração é de gameplay e gênero. Nomes, marcas, artes e bases de dados proprietárias devem ser substituídos por conteúdo original ou licenciado.
