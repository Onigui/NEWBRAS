from __future__ import annotations

from typing import List

from newbras.domain import Player, Team
from newbras.engine import League


def _base_squad(prefix: str, base_rating: int) -> List[Player]:
    return [
        Player(f"{prefix} Goleiro", "GOL", base_rating - 1, base_rating + 2, 2.3, 0.22),
        Player(f"{prefix} Zagueiro A", "ZAG", base_rating, base_rating + 3, 2.7, 0.24),
        Player(f"{prefix} Zagueiro B", "ZAG", base_rating - 2, base_rating + 1, 2.2, 0.20),
        Player(f"{prefix} Lateral", "LAT", base_rating - 1, base_rating + 2, 2.0, 0.19),
        Player(f"{prefix} Meia A", "MEI", base_rating + 1, base_rating + 5, 3.5, 0.32),
        Player(f"{prefix} Meia B", "MEI", base_rating - 1, base_rating + 2, 2.1, 0.22),
        Player(f"{prefix} Atacante A", "ATA", base_rating + 2, base_rating + 5, 4.2, 0.38),
        Player(f"{prefix} Atacante B", "ATA", base_rating, base_rating + 3, 3.0, 0.27),
    ]


def build_demo_league() -> League:
    return League(
        name="Liga Demo BR",
        teams=[
            Team("Atlântico FC", budget=15.0, squad=_base_squad("ATL", 69)),
            Team("União Paulista", budget=12.5, squad=_base_squad("UNI", 67)),
            Team("Serra Azul", budget=11.0, squad=_base_squad("SER", 64)),
            Team("Porto Norte", budget=9.2, squad=_base_squad("POR", 62)),
            Team("Vale Real", budget=8.8, squad=_base_squad("VAL", 60)),
            Team("Capital SC", budget=8.0, squad=_base_squad("CAP", 58)),
        ],
    )


def run_demo() -> None:
    league = build_demo_league()
    _, transfer_logs = league.play_season()

    print(f"=== {league.name}: Temporada 1 ===")
    print("\nJanela de transferências:")
    if transfer_logs:
        for line in transfer_logs:
            print(f"- {line}")
    else:
        print("- Sem negociações")

    print("\nTabela final:")
    for pos, team in enumerate(league.standings(), start=1):
        print(
            f"{pos:>2}. {team.name:<16} {team.points:>2} pts | SG {team.gd:>3} | "
            f"GP {team.gf:>2} | GC {team.ga:>2} | Caixa {team.budget:.2f}M"
        )

    print("\nArtilheiros:")
    for player in league.top_scorers():
        print(f"- {player.name:<20} {player.goals} gols ({player.rating} overall)")
