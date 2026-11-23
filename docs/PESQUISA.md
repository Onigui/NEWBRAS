# Pesquisa: como o Brasfoot funcionava

Levantamento feito em 23/11/2026 a partir de manuais e análises públicas. É a referência de paridade para a v1.0 do NewBras. Os pontos que vêm de leituras de terceiros sobre o código descompilado estão marcados e servem como calibração, não como cópia.

## Contexto

Manager leve, inspirado no Elifoot, lançado em 2003. O registro no PC ficou gratuito em novembro de 2025 e as atualizações oficiais pararam em 2023. A comunidade mantém patches, mods e o Brasfoot Next, que converteu o banco para formato aberto.

## Telas e atalhos

| Tecla                        | Função                     |
| ---------------------------- | -------------------------- |
| F2                           | Salvar jogo                |
| F3                           | Opções                     |
| F4                           | Jogos do seu time          |
| F5                           | Tabela de classificação    |
| F6                           | Administração do estádio   |
| F7                           | Notícias do time (e-mails) |
| F8                           | Ver todos os times         |
| F9                           | Amistosos                  |
| Ctrl+F                       | Finanças                   |
| Ctrl+T                       | Tabela de jogos            |
| Enter ou Espaço (na partida) | Substituições              |
| F1 a F5 (na partida)         | Velocidade do jogo         |

Tela inicial: Novo jogo, Jogos salvos e, logo abaixo, o Editor de Equipes. Enter confirma e Esc cancela em todas as janelas.

## Novo jogo

- Liga brasileira, internacional (país com pelo menos 22 times) ou personalizada, misturando países.
- 4 divisões de 10 times ou divisões de 20 times.
- Vários técnicos humanos no mesmo jogo.

## Jogadores

- Posições: goleiro, lateral, zagueiro, meia (volante = meia defensivo), atacante. Lado importa para laterais.
- Força de 1 a 100 (média ponderada das habilidades). 100 vale cerca de 10 vezes 1, mas é só um pouco melhor que 95.
- Características (mostra as 2 principais; só uma = jogador limitado). Goleiro: colocação, saída do gol, reflexo, defesa de pênalti. Linha: armação, cabeceio, cruzamento, desarme, drible, finalização, marcação, passe, resistência, velocidade.
- Estrela: craque; não vai a leilão automático; aposentado tem mais chance de gerar júnior estrela.
- Nota da partida de meia a 10 estrelas.
- Evolução: jovens crescem mais rápido, crescimento desacelera com força alta, declínio a partir dos 32 anos. Moral, resultados, falta de jogos e lesões pesam menos.
- Moral individual: cai com falta de jogos, excesso de esforço, salário baixo, desentendimentos, atacante sem marcar e pênalti perdido.

## Escalação e tática

- Arrastar jogadores para as camisas: verde = titular, amarela = reserva. Nome em amarelo = fora de posição.
- Suspensos, lesionados, sem contrato e recém-comprados de outro humano não jogam.
- Formações são sugestões; o técnico monta a sua.
- Estilo: equilibrado, ataque total, contra-ataque.
- Concentrar ataques: meio ou laterais (cerca de 70% no setor).
- Marcação: leve, pesada, muito pesada (até 20% menos ataques do adversário, mais faltas e cartões).

## Partida

- Todas as partidas da rodada ao mesmo tempo, com linha de minutos e eventos.
- Substituições e mudanças táticas com o jogo pausado.
- O motor do Brasfoot não é documentado. Referência do gênero: engenharia reversa do Elifoot 98 (força por setor, sorteio de lance de perigo por minuto com cerca de 16,7% de vantagem ao mandante, duelo atacante contra defensor, tabela de desfechos). Lá, o 5-0-5 quebra o jogo porque o meio vazio não é punido.

## Contratos e mercado

- Contratos de 6 meses, 1 ano ou 2 anos. Sem contrato não joga e perde moral.
- Salário amarelo a 3 semanas do fim; vermelho quando venceu.
- Venda a qualquer momento com multa proporcional; empréstimos.
- Renovação: salário ligado ao passe, até 25% a mais. Recusada: leilão regulamentar ou passe livre (terceiros).
- Leilões: 1 a 4 por rodada, de CPUs com 21+ jogadores, só excedentes (goleiros > 2, laterais > 3, zagueiros > 3, meias > 5, atacantes > 3), estrelas e titulares protegidos, lance inicial de 50% do passe (terceiros).
- Travas da CPU: caixa por divisão (15M, 12M, 10M, 3,5M), elenco do comprador abaixo de 35, teto por posição 3/5/5/10/5 (terceiros).
- Propostas: +20% a +50% em elenco normal, +150% a +200% se for o único na posição; contraproposta; atleta recusa clube menor (terceiros).

## Finanças e estádio

- Receitas: venda de jogadores, ingressos, patrocínio (fixo por divisão), amistosos.
- Renda do mandante, dividida em jogos de Copa.
- Salários pagos após jogos nacionais e estaduais.
- Ingresso sugerido; ampliação do estádio na tela F6.

## Aposentadoria e juniores

- Aposentadoria opcional a partir dos 32 anos; entra um júnior de 17 a 20 anos, força 1 a 20, mesma posição, raramente estrela.
- No original, veteranos muito velhos podem morrer. No NewBras isso foi trocado pelo renascimento de lendas (ver DECISOES.md).

## Competições

| Competição          | Formato documentado                                                               |
| ------------------- | --------------------------------------------------------------------------------- |
| Liga nacional       | Pontos corridos, acesso e rebaixamento                                            |
| Estaduais           | 6+ times, 1 a 4 divisões, final em 2 jogos, último cai e primeiro sobe            |
| Copa nacional       | Mata-mata (formato não documentado)                                               |
| Libertadores        | Top 3 + campeão da Copa (ou 4º); 8 grupos de 4; mata-mata em 2 jogos com pênaltis |
| Sul-Americana       | 4º ao 6º (7º se sobrar vaga)                                                      |
| Recopa              | Campeões da Libertadores e da Sul-Americana, 2 jogos                              |
| Mundial de Clubes   | Campeões continentais                                                             |
| Copa do Mundo       | A cada 4 anos, convites ao técnico humano conforme ranking                        |
| Copa América e Euro | A cada 2 anos                                                                     |
| Amistosos           | Calendário ou F9, pré-temporada                                                   |

## Carreira do técnico (terceiros)

- Confiança: diretoria 95 e torcida 85 ao assumir; +50 na virada de temporada.
- Variação por competição, mando, resultado e faixa na tabela; saldo negativo e torcida abaixo de 20 punem a diretoria.
- Demissão com diretoria abaixo de 10.
- Reputação 0 a 5 (Municipal a Mundial) com prestígio e decaimento anual.
- Propostas: desempregado recebe de clubes nas 6 últimas posições; empregado, de clubes entre o 3º e o 6º. Central de Empregos filtrada pela reputação.

## Rankings e prêmios

- Técnicos: resultados + bônus por título (Mundial 35, Libertadores 30, Sul-Americana 25, Nacional 25, Copa 20, Estadual 15).
- Times por pontos (3/1, saldo, gols pró) e por títulos (Nacional 12 a 1 do 1º ao 10º, Libertadores 20, Copa 10, Sul-Americana 12, Mundial de Clubes 10, Estadual 5).
- Bola de Prata (por posição) e Bola de Ouro, mínimo de 16 jogos (divisões de 20) ou 9 (divisões de 10).

## Editor de Equipes

- Lista por nome ou país; Adicionar, Editar, Deletar, Procurar.
- Time: nome, abreviação, técnico, estádio, reputação e nível, país, estado, cores, clássicos.
- Jogador: nome, posição, lado, idade, força, características, estrela, nacionalidade, potencial.
- Botão direito transfere o jogador.
- Time válido: 1+ goleiro e 11+ de linha; inválido em vermelho.
- Escudo PNG, mini-escudo 18×18, até 3 camisas.
- Banco original binário (Java serializado); o NewBras usa formato texto aberto.

## Fontes

- [Manual Brasfoot 2011 (Tudo de Brasfoot)](https://tudo-de-brasfoot.blogspot.com/p/manual-brasfoot-2011.html)
- [Manual de Brasfoot 2012 (fórum GameZer Fun)](https://gz-fun.forumeiros.com/t2449-manual-de-brasfoot)
- [Brasfoot Next: banco de dados aberto](https://github.com/Brasfoot-Next/database)
- [Champs Manager, issue 18: confiança, reputação e demissão](https://github.com/alexchagas/champs-manager/issues/18)
- [Champs Manager, issue 23: leilões, transferências e contratos](https://github.com/alexchagas/champs-manager/issues/23)
- [Engenharia reversa do motor do Elifoot 98 (TabNews)](https://www.tabnews.com.br/trsthales/engenharia-reversa-como-o-motor-do-elifoot-98-decide-os-gols-e-por-que-o-5-0-5-quebra-o-jogo)
