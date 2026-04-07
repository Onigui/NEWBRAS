class Player {
  constructor(name, position, rating, potential, value, wage, age = 20) {
    Object.assign(this, { name, position, rating, potential, value, wage, age });
    this.goals = 0;
    this.createdByUser = false;
  }
  evolve() {
    if (this.age <= 23 && this.rating < this.potential && Math.random() < 0.65) this.rating += 1;
    else if (this.age <= 29 && this.rating < this.potential && Math.random() < 0.35) this.rating += 1;
    else if (this.age <= 33 && Math.random() < 0.30) this.rating = Math.max(40, this.rating - 1);
    else if (this.age > 33 && Math.random() < 0.55) this.rating = Math.max(35, this.rating - 1);
    this.age += 1;
  }
}

class Team {
  constructor(name, budget, squad) {
    this.name = name;
    this.budget = budget;
    this.squad = squad;
    this.resetStats();
  }
  resetStats() { this.points = 0; this.gf = 0; this.ga = 0; this.squad.forEach(p => p.goals = 0); }
  get gd() { return this.gf - this.ga; }
  get payroll() { return this.squad.reduce((a, p) => a + p.wage, 0); }
  attack() { return this._strength(["ATA", "MEI"]); }
  defense() { return this._strength(["GOL", "ZAG", "LAT"]); }
  _strength(pos) {
    const vals = this.squad.filter(p => pos.includes(p.position)).map(p => p.rating);
    return vals.length ? vals.slice(0, 6).reduce((a, b) => a + b, 0) / Math.min(vals.length, 6) : 45;
  }
  refreshSquad() {
    const before = this.squad.length;
    this.squad = this.squad.filter(p => p.age < 37);
    let slot = 1;
    while (this.squad.length < 8) {
      const pos = ["GOL", "ZAG", "LAT", "MEI", "ATA"][slot % 5];
      const base = 52 + Math.floor(Math.random() * 8);
      this.squad.push(new Player(`${this.name.slice(0, 3).toUpperCase()} Base ${slot}`, pos, base, base + 10, 1.2, 0.08, 17));
      slot++;
    }
    return before - this.squad.length;
  }
}

class League {
  constructor(name, teams) {
    this.name = name;
    this.teams = teams;
    this.schedule = [];
    this.currentRound = 0;
    this.events = [];
  }
  startSeason() {
    this.teams.forEach(t => t.resetStats());
    this.schedule = this._generateSchedule();
    this.currentRound = 0;
    this.events = [];
  }
  playNextRound({ managerTeam, tactic }) {
    if (this.currentRound >= this.schedule.length) return null;
    const fixtures = this.schedule[this.currentRound];
    let managerResult = null;
    for (const [home, away] of fixtures) {
      const result = this._playMatch(home, away, managerTeam, tactic);
      if (home.name === managerTeam || away.name === managerTeam) managerResult = result;
    }

    this.currentRound += 1;

    if (this.currentRound === Math.floor(this.schedule.length / 2)) {
      this.events.push(...this._transferWindow());
    }

    if (this.currentRound === this.schedule.length) {
      this._endSeason();
    }

    return managerResult;
  }
  _endSeason() {
    for (const t of this.teams) {
      t.budget = +(t.budget - t.payroll * 0.2).toFixed(2);
      t.squad.forEach(p => p.evolve());
      const retired = t.refreshSquad();
      if (retired) this.events.push(`${t.name}: ${retired} aposentadoria(s), base promovida.`);
    }
  }
  _playMatch(home, away, managerTeam, tactic) {
    let homeAtk = home.attack(), awayAtk = away.attack();
    let homeDef = home.defense(), awayDef = away.defense();
    const off = tactic === "offensive", def = tactic === "defensive";

    if (home.name === managerTeam) { if (off) homeAtk += 3; if (def) homeDef += 3; }
    if (away.name === managerTeam) { if (off) awayAtk += 3; if (def) awayDef += 3; }

    const gh = this._sampleGoals(this._xg(homeAtk, awayDef, 0.22));
    const ga = this._sampleGoals(this._xg(awayAtk, homeDef));

    home.gf += gh; home.ga += ga; away.gf += ga; away.ga += gh;
    if (gh > ga) { home.points += 3; home.budget += 0.3; }
    else if (ga > gh) { away.points += 3; away.budget += 0.3; }
    else { home.points++; away.points++; home.budget += 0.08; away.budget += 0.08; }

    this._distributeGoals(home, gh); this._distributeGoals(away, ga);
    return `${home.name} ${gh} x ${ga} ${away.name}`;
  }
  _transferWindow() {
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
      logs.push(`${buyer.name} contratou ${target.name} por ${fee.toFixed(2)}M`);
      deals++;
    }
    return logs;
  }
  _xg(atk, def, home = 0) { return Math.max(0.2, 1.2 + (atk - 50) * 0.022 - (def - 50) * 0.016 + home); }
  _sampleGoals(xg) {
    let g = 0, p = Math.min(0.95, xg / 8);
    for (let i = 0; i < 8; i++) if (Math.random() < p) g++;
    return g;
  }
  _distributeGoals(team, n) {
    const pool = team.squad.filter(p => ["ATA", "MEI"].includes(p.position));
    const arr = pool.length ? pool : team.squad;
    for (let i = 0; i < n; i++) arr[Math.floor(Math.random() * arr.length)].goals++;
  }
  _generateSchedule() {
    const arr = [...this.teams], rounds = [];
    for (let r = 0; r < arr.length - 1; r++) {
      const pairs = [];
      for (let i = 0; i < arr.length / 2; i++) pairs.push([arr[i], arr[arr.length - 1 - i]]);
      rounds.push(pairs);
      arr.splice(1, 0, arr.pop());
    }
    return rounds.concat(rounds.map(r => r.map(([a, b]) => [b, a])));
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
const league = new League("Liga Demo BR", [
  new Team("Atlântico FC", 15.0, squad("ATL", 69)),
  new Team("União Paulista", 12.5, squad("UNI", 67)),
  new Team("Serra Azul", 11.0, squad("SER", 64)),
  new Team("Porto Norte", 9.2, squad("POR", 62)),
  new Team("Vale Real", 8.8, squad("VAL", 60)),
  new Team("Capital SC", 8.0, squad("CAP", 58)),
]);

function setupManagerOptions() {
  document.querySelector("#managerTeam").innerHTML = league.teams.map(t => `<option value="${t.name}">${t.name}</option>`).join("");
}

function render() {
  const standings = league.standings();
  document.querySelector("#seasonTitle").textContent = `Temporada ${season} - Rodada ${league.currentRound}/${league.schedule.length || 0}`;
  document.querySelector("#status").textContent = standings.length ? `Líder atual: ${standings[0].name}` : "-";

  const table = document.querySelector("#table tbody");
  table.innerHTML = "";
  standings.forEach((t, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i + 1}</td><td>${t.name}</td><td>${t.points}</td><td>${t.gd}</td><td>${t.gf}</td><td>${t.ga}</td><td>${t.budget.toFixed(2)}M</td>`;
    table.appendChild(tr);
  });

  const scorers = document.querySelector("#scorers");
  scorers.innerHTML = "";
  league.scorers().forEach(p => {
    const li = document.createElement("li");
    li.textContent = `${p.name} - ${p.goals} gols (${p.rating}, ${p.age} anos)`;
    scorers.appendChild(li);
  });

  const events = document.querySelector("#events");
  events.innerHTML = "";
  league.events.slice(-8).forEach(ev => { const li = document.createElement("li"); li.textContent = ev; events.appendChild(li); });

  const fixtures = document.querySelector("#fixtures");
  fixtures.innerHTML = "";
  const next = league.schedule[league.currentRound] || [];
  next.forEach(([h, a]) => { const li = document.createElement("li"); li.textContent = `${h.name} x ${a.name}`; fixtures.appendChild(li); });
}

function startSeason() {
  league.startSeason();
  document.querySelector("#managerMatch").textContent = "Temporada iniciada.";
  render();
}

function playNextRound() {
  if (!league.schedule.length) return startSeason();
  if (league.currentRound >= league.schedule.length) {
    season += 1;
    startSeason();
    return;
  }
  const managerTeam = document.querySelector("#managerTeam").value;
  const tactic = document.querySelector("#tactic").value;
  const result = league.playNextRound({ managerTeam, tactic });
  document.querySelector("#managerMatch").textContent = result ? `Seu jogo: ${result}` : "Rodada processada.";
  if (league.currentRound >= league.schedule.length) {
    league.events.push(`Temporada ${season} encerrada. Campeão: ${league.standings()[0].name}`);
  }
  render();
}

function createPlayer() {
  const t = league.teams.find(x => x.name === document.querySelector("#managerTeam").value);
  if (!t) return;
  const p = new Player(
    document.querySelector("#pName").value.trim() || "Jogador Criado",
    document.querySelector("#pPos").value,
    Number(document.querySelector("#pRating").value || 68),
    Number(document.querySelector("#pPotential").value || 84),
    3.0,
    0.25,
    Number(document.querySelector("#pAge").value || 18)
  );
  p.createdByUser = true;
  t.squad.push(p);
  league.events.push(`${p.name} criado no ${t.name}.`);
  render();
}

function saveHistory() {
  const data = JSON.parse(localStorage.getItem("newbras_history") || "[]");
  data.push({
    season,
    champion: league.standings()[0]?.name,
    standings: league.standings().map(t => ({ name: t.name, points: t.points })),
    events: league.events.slice(-12),
  });
  localStorage.setItem("newbras_history", JSON.stringify(data));
  document.querySelector("#history").textContent = JSON.stringify(data, null, 2);
}

document.querySelector("#startSeasonBtn").addEventListener("click", startSeason);
document.querySelector("#playRoundBtn").addEventListener("click", playNextRound);
document.querySelector("#createPlayerBtn").addEventListener("click", createPlayer);
document.querySelector("#saveBtn").addEventListener("click", saveHistory);

setupManagerOptions();
startSeason();
