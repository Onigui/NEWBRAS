class Player {
  constructor(name, position, rating, potential, value, wage, age = 20) {
    this.name = name;
    this.position = position;
    this.rating = rating;
    this.potential = potential;
    this.value = value;
    this.wage = wage;
    this.age = age;
    this.goals = 0;
    this.createdByUser = false;
  }
  evolve() {
    if (this.age <= 23) {
      if (this.rating < this.potential && Math.random() < 0.65) this.rating += 1;
    } else if (this.age <= 29) {
      if (this.rating < this.potential && Math.random() < 0.35) this.rating += 1;
    } else if (this.age <= 33) {
      if (Math.random() < 0.30) this.rating = Math.max(40, this.rating - 1);
    } else if (Math.random() < 0.55) {
      this.rating = Math.max(35, this.rating - 1);
    }
    this.age += 1;
  }
}

class Team {
  constructor(name, budget, squad) {
    this.name = name;
    this.budget = budget;
    this.squad = squad;
    this.reset();
  }
  reset() { this.points = 0; this.gf = 0; this.ga = 0; this.squad.forEach(p => p.goals = 0); }
  get gd() { return this.gf - this.ga; }
  get payroll() { return this.squad.reduce((a, p) => a + p.wage, 0); }
  strength(positions) {
    const vals = this.squad.filter(p => positions.includes(p.position)).map(p => p.rating);
    return vals.length ? vals.slice(0, 6).reduce((a, b) => a + b, 0) / Math.min(vals.length, 6) : 45;
  }
  attack() { return this.strength(["ATA", "MEI"]); }
  defense() { return this.strength(["GOL", "ZAG", "LAT"]); }
  refreshSquad(minSize = 8, retirementAge = 37) {
    const before = this.squad.length;
    this.squad = this.squad.filter(p => p.age < retirementAge);
    let slot = 1;
    while (this.squad.length < minSize) {
      const pos = ["GOL", "ZAG", "LAT", "MEI", "ATA"][slot % 5];
      const base = 52 + Math.floor(Math.random() * 8);
      this.squad.push(new Player(`${this.name.slice(0, 3).toUpperCase()} Base ${slot}`, pos, base, base + 10, 1.2, 0.08, 17));
      slot += 1;
    }
    return before - this.squad.length;
  }

}

class League {
  constructor(name, teams) { this.name = name; this.teams = teams; }
  expectedGoals(atk, def, home = 0) { return Math.max(0.2, 1.2 + (atk - 50) * 0.022 - (def - 50) * 0.016 + home); }
  sampleGoals(xg) {
    let g = 0;
    const p = Math.min(0.95, xg / 8);
    for (let i = 0; i < 8; i++) if (Math.random() < p) g++;
    return g;
  }
  schedule() {
    const arr = [...this.teams], rounds = [];
    for (let r = 0; r < arr.length - 1; r++) {
      const pairs = [];
      for (let i = 0; i < arr.length / 2; i++) pairs.push([arr[i], arr[arr.length - 1 - i]]);
      rounds.push(pairs);
      arr.splice(1, 0, arr.pop());
    }
    return rounds.concat(rounds.map(r => r.map(([a, b]) => [b, a])));
  }
  distribute(team, n) {
    const pool = team.squad.filter(p => ["ATA", "MEI"].includes(p.position));
    const use = pool.length ? pool : team.squad;
    for (let i = 0; i < n; i++) use[Math.floor(Math.random() * use.length)].goals++;
  }
  transferWindow() {
    const logs = [];
    let deals = 0;
    for (const buyer of [...this.teams].sort((a, b) => b.budget - a.budget)) {
      if (deals >= 4 || buyer.budget < 3) break;
      const seller = [...this.teams].filter(t => t !== buyer).sort((a, b) => a.budget - b.budget)[0];
      if (!seller?.squad.length) continue;
      const target = [...seller.squad].sort((a, b) => b.rating - a.rating)[0];
      const fee = +(target.value * 1.1).toFixed(2);
      if (fee > buyer.budget) continue;
      seller.squad = seller.squad.filter(p => p !== target);
      buyer.squad.push(target);
      buyer.budget -= fee;
      seller.budget += fee;
      deals++;
      logs.push(`${buyer.name} contratou ${target.name} de ${seller.name} por ${fee.toFixed(2)}M`);
    }
    return logs;
  }
  playSeason({ managerTeam, tactic }) {
    this.teams.forEach(t => t.reset());
    const transfers = [];
    const calendar = this.schedule();
    const isOff = tactic === "offensive";
    const isDef = tactic === "defensive";

    calendar.forEach((round, idx) => {
      round.forEach(([home, away]) => {
        let homeAtk = home.attack(), awayAtk = away.attack();
        let homeDef = home.defense(), awayDef = away.defense();

        if (home.name === managerTeam) {
          if (isOff) homeAtk += 3;
          if (isDef) homeDef += 3;
        }
        if (away.name === managerTeam) {
          if (isOff) awayAtk += 3;
          if (isDef) awayDef += 3;
        }

        const gh = this.sampleGoals(this.expectedGoals(homeAtk, awayDef, 0.22));
        const ga = this.sampleGoals(this.expectedGoals(awayAtk, homeDef));

        home.gf += gh; home.ga += ga; away.gf += ga; away.ga += gh;
        if (gh > ga) { home.points += 3; home.budget += 0.3; }
        else if (ga > gh) { away.points += 3; away.budget += 0.3; }
        else { home.points++; away.points++; home.budget += 0.08; away.budget += 0.08; }
        this.distribute(home, gh); this.distribute(away, ga);
      });
      if (idx + 1 === Math.floor(calendar.length / 2)) transfers.push(...this.transferWindow());
    });

    this.teams.forEach(t => {
      t.budget = +(t.budget - t.payroll * 0.2).toFixed(2);
      t.squad.forEach(p => p.evolve());
      const retired = t.refreshSquad();
      if (retired) transfers.push(`${t.name} teve ${retired} aposentadoria(s) e promoveu base`);
    });
    return transfers;
  }
  standings() { return [...this.teams].sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf || b.budget - a.budget); }
  scorers() { return this.teams.flatMap(t => t.squad).sort((a, b) => b.goals - a.goals || b.rating - a.rating).slice(0, 5); }
}

const squad = (p, b) => [
  new Player(`${p} Goleiro`, "GOL", b - 1, b + 2, 2.3, 0.22, 30),
  new Player(`${p} Zagueiro A`, "ZAG", b, b + 3, 2.7, 0.24, 27),
  new Player(`${p} Zagueiro B`, "ZAG", b - 2, b + 1, 2.2, 0.20, 22),
  new Player(`${p} Lateral`, "LAT", b - 1, b + 2, 2.0, 0.19, 24),
  new Player(`${p} Meia A`, "MEI", b + 1, b + 5, 3.5, 0.32, 25),
  new Player(`${p} Meia B`, "MEI", b - 1, b + 2, 2.1, 0.22, 21),
  new Player(`${p} Atacante A`, "ATA", b + 2, b + 5, 4.2, 0.38, 23),
  new Player(`${p} Atacante B`, "ATA", b, b + 3, 3.0, 0.27, 19),
];

let season = 1;
let league = new League("Liga Demo BR", [
  new Team("Atlântico FC", 15.0, squad("ATL", 69)),
  new Team("União Paulista", 12.5, squad("UNI", 67)),
  new Team("Serra Azul", 11.0, squad("SER", 64)),
  new Team("Porto Norte", 9.2, squad("POR", 62)),
  new Team("Vale Real", 8.8, squad("VAL", 60)),
  new Team("Capital SC", 8.0, squad("CAP", 58)),
]);

let current = null;

function managerTeamOptions() {
  const select = document.querySelector("#managerTeam");
  select.innerHTML = league.teams.map(t => `<option value="${t.name}">${t.name}</option>`).join("");
}

function render(snapshot) {
  document.querySelector("#seasonTitle").textContent = `Temporada ${season}`;
  document.querySelector("#champion").textContent = `Campeão: ${snapshot.champion}`;
  const table = document.querySelector("#table tbody");
  const transfers = document.querySelector("#transfers");
  const scorers = document.querySelector("#scorers");
  table.innerHTML = transfers.innerHTML = scorers.innerHTML = "";

  snapshot.transfers.forEach(t => { const li = document.createElement("li"); li.textContent = t; transfers.appendChild(li); });
  snapshot.standings.forEach((t, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i + 1}</td><td>${t.name}</td><td>${t.points}</td><td>${t.gd}</td><td>${t.gf}</td><td>${t.ga}</td><td>${t.budget.toFixed(2)}M</td>`;
    table.appendChild(tr);
  });
  snapshot.scorers.forEach(p => { const li = document.createElement("li"); li.textContent = `${p.name} - ${p.goals} gols (${p.rating}, ${p.age} anos)`; scorers.appendChild(li); });
}

function simulate() {
  const managerTeam = document.querySelector("#managerTeam").value;
  const tactic = document.querySelector("#tactic").value;
  const transfers = league.playSeason({ managerTeam, tactic });
  const standings = league.standings();
  current = {
    season,
    date: new Date().toISOString(),
    managerTeam,
    tactic,
    champion: standings[0].name,
    transfers,
    standings: standings.map(t => ({ name: t.name, points: t.points, gd: t.gd, gf: t.gf, ga: t.ga, budget: t.budget })),
    scorers: league.scorers().map(p => ({ name: p.name, goals: p.goals, rating: p.rating, age: p.age })),
  };
  render(current);
}

function saveHistory() {
  if (!current) return alert("Simule a temporada antes de salvar.");
  const data = JSON.parse(localStorage.getItem("newbras_history") || "[]");
  data.push(current);
  localStorage.setItem("newbras_history", JSON.stringify(data));
  showHistory();
}

function showHistory() {
  const data = JSON.parse(localStorage.getItem("newbras_history") || "[]");
  document.querySelector("#history").textContent = data.length ? JSON.stringify(data, null, 2) : "Sem histórico salvo.";
}


function createCustomPlayer() {
  const managerTeam = document.querySelector("#managerTeam").value;
  const team = league.teams.find(t => t.name === managerTeam);
  if (!team) return;

  const name = document.querySelector("#pName").value.trim() || "Jogador Criado";
  const position = document.querySelector("#pPos").value;
  const age = Number(document.querySelector("#pAge").value || 18);
  const rating = Number(document.querySelector("#pRating").value || 68);
  const potential = Number(document.querySelector("#pPotential").value || 84);

  const p = new Player(name, position, rating, potential, 3.0, 0.25, age);
  p.createdByUser = true;
  team.squad.push(p);
  alert(`${name} adicionado ao ${team.name}.`);
}

document.querySelector("#simulateBtn").addEventListener("click", simulate);
document.querySelector("#nextBtn").addEventListener("click", () => {
  if (!current) simulate();
  season += 1;
  simulate();
});
document.querySelector("#saveBtn").addEventListener("click", saveHistory);
document.querySelector("#historyBtn").addEventListener("click", showHistory);
document.querySelector("#createPlayerBtn").addEventListener("click", createCustomPlayer);
document.querySelector("#resetBtn").addEventListener("click", () => {
  localStorage.removeItem("newbras_history");
  showHistory();
});

managerTeamOptions();
simulate();
showHistory();
