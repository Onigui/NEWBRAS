from newbras.demo import build_demo_league


def test_season_generates_full_double_round_robin() -> None:
    league = build_demo_league()
    results, _ = league.play_season()

    teams = len(league.teams)
    expected_matches = teams * (teams - 1)
    assert len(results) == expected_matches


def test_standings_are_sorted_descending() -> None:
    league = build_demo_league()
    league.play_season()
    table = league.standings()

    ranking_keys = [(t.points, t.gd, t.gf, t.budget) for t in table]
    assert ranking_keys == sorted(ranking_keys, reverse=True)


def test_top_scorers_returns_limited_list() -> None:
    league = build_demo_league()
    league.play_season()

    top3 = league.top_scorers(top_n=3)
    assert len(top3) == 3
    assert top3[0].goals >= top3[-1].goals


def test_transfer_window_respects_max_deals() -> None:
    league = build_demo_league()
    _, transfer_logs = league.play_season()
    assert len(transfer_logs) <= 4
