from pathlib import Path

from newbras.career import CareerStore
from newbras.demo import build_demo_league


def test_save_season_and_read_history(tmp_path: Path) -> None:
    db_path = tmp_path / "career.db"
    store = CareerStore(str(db_path))
    store.init_db()

    league = build_demo_league()
    league.play_season()
    saved = store.save_season(league)

    history = store.history()
    assert len(history) == 1
    assert history[0].season == 1
    assert history[0].champion == saved.champion


def test_next_season_increments(tmp_path: Path) -> None:
    db_path = tmp_path / "career.db"
    store = CareerStore(str(db_path))
    store.init_db()

    league = build_demo_league()
    league.play_season()
    store.save_season(league)

    league2 = build_demo_league()
    league2.play_season()
    store.save_season(league2)

    assert store.next_season_number() == 3
