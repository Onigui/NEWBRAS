from __future__ import annotations

import argparse

from newbras.career import CareerStore
from newbras.demo import build_demo_league, run_demo


def main() -> None:
    parser = argparse.ArgumentParser(description="NEWBRAS CLI")
    parser.add_argument("command", choices=["demo", "season", "history"], help="Ação a executar")
    parser.add_argument("--db", default="newbras_career.db", help="Caminho do banco SQLite")
    args = parser.parse_args()

    if args.command == "demo":
        run_demo()
        return

    store = CareerStore(args.db)
    store.init_db()

    if args.command == "season":
        league = build_demo_league()
        league.play_season()
        record = store.save_season(league)
        print(
            f"Temporada {record.season} salva: campeão {record.champion} ({record.points} pts), "
            f"artilheiro {record.top_scorer} ({record.top_scorer_goals} gols)"
        )
        return

    if args.command == "history":
        rows = store.history()
        if not rows:
            print("Sem temporadas salvas.")
            return
        for row in rows:
            print(
                f"T{row.season}: campeão {row.champion} ({row.points} pts) | "
                f"artilheiro {row.top_scorer} ({row.top_scorer_goals} gols)"
            )


if __name__ == "__main__":
    main()
