window.addEventListener("load", () => {
  if (!state || !state.players) {
    state = {
      step: -1,
      players: [
        { name: "Jan" },
        { name: "Piet" },
        { name: "Eva" },
        { name: "Klaas" }
      ],
      scores: {}
    };
    save();
    render();
  }
});

const categories = [
  { id: "fox", name: "🦊 Vossen" },
  { id: "bear", name: "🐻 Beren" },
  { id: "hawk", name: "🦅 Buizerds" },
  { id: "elk", name: "🦌 Wapiti" },
  { id: "salmon", name: "🐟 Zalmen" },

  { id: "mountain", name: "🏔 Bergen" },
  { id: "forest", name: "🌲 Bossen" },
  { id: "prairie", name: "🌾 Prairie" },
  { id: "wetland", name: "💧 Moeras" },
  { id: "river", name: "🌊 Rivieren" }
];

let state = load();

if (!state || !state.players) {
  state = {
    step: -1,
    players: [
      { name: "Jan" },
      { name: "Piet" },
      { name: "Eva" },
      { name: "Klaas" }
    ],
    scores: {}
  };
}

function save() {
  localStorage.setItem("cascadia_state", JSON.stringify(state));
}

function load() {
  return JSON.parse(localStorage.getItem("cascadia_state"));
}

function currentCat() {
  return categories[state.step];
}

function playerName(p) {
  return p.name || "Speler";
}

function getScore(player, cat) {
  return state.scores[player + "_" + cat] || 0;
}

function setScore(player, cat, value) {
  state.scores[player + "_" + cat] = parseInt(value) || 0;
  save();
  render();
}

function updateName(index, value) {
  state.players[index].name = value;
  save();
  render();
}

/* ---------------- START SCREEN ---------------- */

function render() {
  if (state.step === -1) return renderStart();

  if (state.step >= categories.length) return renderResult();

  if (!categories[state.step]) {
    state.step = -1;
    save();
    return renderStart();
  }

  app.innerHTML = `
    <div class="container">
      <h1>🏔 Cascadia Score</h1>

      <div class="card">
        <label>Aantal spelers</label>
        <select id="playerCount" onchange="setPlayers(this.value)">
          ${[2,3,4,5,6].map(n => `
            <option value="${n}" ${n === state.players.length ? "selected" : ""}>
              ${n} spelers
            </option>
          `).join("")}
        </select>
      </div>

      <div class="card">
        <h3>Spelers</h3>
        ${state.players.map((p, i) => `
          <input 
            type="text"
            value="${p.name}"
            oninput="updateName(${i}, this.value)"
          />
        `).join("")}
      </div>

      <button class="primary" onclick="startGame()">
        Start scoretelling
      </button>
    </div>
  `;
}

/* ---------------- GAME SETUP ---------------- */

function setPlayers(count) {
  const defaults = ["Jan","Piet","Eva","Klaas","Lisa","Tom"];

  state.players = Array.from({ length: count }, (_, i) => ({
    name: defaults[i] || `Speler ${i+1}`
  }));

  save();
  renderStart();
}

function startGame() {
  state.step = 0;
  save();
  render();
}

/* ---------------- CATEGORY SCREEN ---------------- */

function render() {
  if (state.step === -1) return renderStart();
  if (state.step >= categories.length) return renderResult();

  const cat = currentCat();
  const app = document.getElementById("app");

  app.innerHTML = `
    <div class="container">

      <h1>${cat.name}</h1>

      <div class="card">

        ${state.players.map((p, i) => `
          <div class="row">

            <div class="name">
              <input 
                type="text"
                value="${p.name}"
                oninput="updateName(${i}, this.value)"
              />
            </div>

            <div class="score">
              <input
                type="number"
                inputmode="numeric"
                pattern="[0-9]*"
                value="${getScore(p.name, cat.id)}"
                onfocus="this.select()"
                onchange="setScore('${p.name}', '${cat.id}', this.value)"
              />
            </div>

          </div>
        `).join("")}

      </div>

      <button class="secondary" onclick="prev()">← Vorige</button>
      <button class="primary" onclick="next()">Volgende →</button>

    </div>

    ${renderScoreboard()}
  `;
}

/* ---------------- SCOREBOARD ---------------- */

function renderScoreboard() {
  const totals = calcTotals();

  return `
    <div class="scoreboard">
      ${Object.entries(totals)
        .sort((a,b)=>b[1]-a[1])
        .map(([p,s])=>`
          <div class="player">
            ${p}<br><span class="score">${s}</span>
          </div>
        `).join("")}
    </div>
  `;
}

function calcTotals() {
  const totals = {};

  state.players.forEach(p => totals[p.name] = 0);

  Object.entries(state.scores).forEach(([key, value]) => {
    const player = key.split("_")[0];
    if (!totals[player]) totals[player] = 0;
    totals[player] += value;
  });

  return totals;
}

/* ---------------- NAVIGATION ---------------- */

function next() {
  state.step++;
  save();
  render();
}

function prev() {
  if (state.step > 0) {
    state.step--;
    save();
    render();
  }
}

/* ---------------- RESULT ---------------- */

function renderResult() {
  const totals = calcTotals();
  const sorted = Object.entries(totals).sort((a,b)=>b[1]-a[1]);

  document.getElementById("app").innerHTML = `
    <div class="container">

      <h1>🏆 Resultaat</h1>

      <div class="card">
        ${sorted.map(([p,s],i)=>`
          <h2>${i+1}. ${p} — ${s}</h2>
        `).join("")}
      </div>

      <button class="primary" onclick="reset()">Nieuw spel</button>

    </div>

    ${renderScoreboard()}
  `;
}

function reset() {
  localStorage.removeItem("cascadia_state");
  location.reload();
}

/* ---------------- INIT ---------------- */

render();  if (!cat) return renderResult();

  app.innerHTML = `
    <div class="container">

      <h1>${cat.name}</h1>

      <div class="card">
        ${state.players.map(p => `
          <div>
            <label>${p}</label>
            <input type="number"
              value="${getScore(p, cat.id)}"
              onchange="setScore('${p}', '${cat.id}', this.value)"
            />
          </div>
        `).join("")}
      </div>

      <button class="secondary" onclick="prev()">← Vorige</button>
      <button class="primary" onclick="next()">Volgende →</button>

    </div>

    ${renderScoreboard()}
  `;
}

function renderScoreboard() {
  const totals = calcTotals();

  return `
    <div class="scoreboard">
      ${Object.entries(totals)
        .sort((a,b)=>b[1]-a[1])
        .map(([p,s])=>`
          <div class="player">
            ${p}<br><span class="score">${s}</span>
          </div>
        `).join("")}
    </div>
  `;
}

function getScore(player, cat) {
  return state.scores[player + "_" + cat] || 0;
}

function setScore(player, cat, value) {
  state.scores[player + "_" + cat] = parseInt(value) || 0;
  save();
  render();
}

function calcTotals() {
  const totals = {};
  state.players.forEach(p => totals[p] = 0);

  Object.entries(state.scores).forEach(([k,v]) => {
    const player = k.split("_")[0];
    totals[player] += v;
  });

  return totals;
}

function next() {
  if (state.step < categories.length - 1) {
    state.step++;
    save();
    render();
  } else {
    state.step++;
    save();
    render();
  }
}

function prev() {
  if (state.step > 0) {
    state.step--;
    save();
    render();
  }
}

function renderResult() {
  const totals = calcTotals();

  const sorted = Object.entries(totals).sort((a,b)=>b[1]-a[1]);

  document.getElementById("app").innerHTML = `
    <div class="container">
      <h1>🏆 Resultaat</h1>

      <div class="card">
        ${sorted.map(([p,s],i)=>`
          <h2>${i+1}. ${p} — ${s}</h2>
        `).join("")}
      </div>

      <button class="primary" onclick="reset()">Nieuw spel</button>
    </div>

    ${renderScoreboard()}
  `;
}

function reset() {
  localStorage.removeItem("cascadia_state");
  location.reload();
}

render();
