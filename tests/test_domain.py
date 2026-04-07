from newbras.domain import Player, Team


class AlwaysZeroRandom:
    def random(self) -> float:
        return 0.0


def test_can_create_custom_player() -> None:
    team = Team(name="Teste FC", budget=10.0, squad=[])
    p = team.add_custom_player(
        name="Meu Craque",
        position="ATA",
        rating=70,
        potential=84,
        age=18,
        value=6.5,
        wage=0.4,
    )

    assert p.created_by_user is True
    assert p in team.squad
    assert p.name == "Meu Craque"


def test_player_regression_after_33() -> None:
    player = Player(
        name="Veterano",
        position="MEI",
        rating=78,
        potential=78,
        value=3.0,
        wage=0.2,
        age=34,
    )
    player.evolve(AlwaysZeroRandom())

    assert player.rating == 77
    assert player.age == 35


def test_team_refresh_squad_retires_and_promotes() -> None:
    team = Team(
        name="Veteranos FC",
        budget=7.0,
        squad=[
            Player("A", "ATA", 60, 65, 1.0, 0.1, age=38),
            Player("B", "MEI", 61, 66, 1.0, 0.1, age=39),
        ],
    )

    retired = team.refresh_squad(AlwaysZeroRandom(), min_size=4, retirement_age=37)

    assert retired == 2
    assert len(team.squad) == 4
    assert all(p.age <= 17 for p in team.squad)
