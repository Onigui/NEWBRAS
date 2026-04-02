# NEWBRAS (protótipo)

Protótipo de manager de futebol inspirado na experiência clássica de jogos como Brasfoot, mas com arquitetura moderna, modular e expansível.

## O que já foi implementado

- Simulação de liga em turno e returno.
- Elencos com jogadores por posição (GOL/ZAG/LAT/MEI/ATA).
- Força de ataque/defesa derivada do elenco.
- Distribuição de gols para artilharia individual.
- Janela de transferências no meio da temporada.
- Evolução de jogadores ao fim da época.
- Fechamento financeiro simples (prêmios + folha salarial).
- Persistência básica de carreira (SQLite): campeão, artilheiro e tabela completa por temporada.

## Executar demo

```bash
python3 src/newbras/simulate.py
```

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
