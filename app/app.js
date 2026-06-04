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

/* ---------------- STATE ---------------- */

let state;

try {
  state = JSON.parse(localStorage.getItem("cascadia_state"));
} catch {
  state = null;
}

if (!state || !state.players) {
  state = {
    mode: "setup",   // setup | game | result
    step: 0,
    players: [
      { name: "Jan" },
      { name: "Piet" }
    ],
    scores: {}
  };
}

function save() {
  localStorage.setItem("cascadia_state", JSON.stringify(state));
}

/* ---------------- INIT ---------------- */

window.addEventListener("load", () => render());

/* ---------------- HELPERS ---------------- */

function key(p, c) {
  return `${p}_${c}`;
}

function getScore(p, c) {
  return state.scores[key(p, c)] || 0;
}

function setScore(p, c, v) {
  state.scores[key(p, c)] = parseInt(v) || 0;
  save();
}

function updateName(i, v) {
  state.players[i].name = v;
  save();
}

/* ---------------- PLAYER CONTROL ---------------- */

function setPlayerCount(n) {
  const defaults = ["Jan", "Piet", "Eva", "Klaas", "Lisa", "Tom"];

  state.players = Array.from({ length: n }, (_, i) => ({
    name: defaults[i] || `Speler ${i + 1}`
  }));

  save();
  render();
}

/* ---------------- FLOW ---------------- */

function startGame() {
  state.mode = "game";
  state.step = 0;
  save();
  render();
}

function next() {
  if (state.step < categories.length - 1) {
    state.step++;
  } else {
    state.mode = "result";
  }
  save();
  render();
}

function prev() {
  if (state.step > 0) state.step--;
  save();
  render();
}

/* ---------------- SWIPE ---------------- */

let sx = 0;

function bindSwipe() {
  const el = document.getElementById("app");
  if (!el) return;

  el.ontouchstart = e => sx = e.touches[0].clientX;

  el.ontouchend = e => {
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) < 70) return;
    dx < 0 ? next() : prev();
  };
}

/* ---------------- CALC ---------------- */

function totals() {
  const t = {};
  state.players.forEach(p => t[p.name] = 0);

  Object.entries(state.scores).forEach(([k, v]) => {
    const p = k.split("_")[0];
    if (!t[p]) t[p] = 0;
    t[p] += v;
  });

  return t;
}

/* ---------------- RENDER ---------------- */

function render() {
  const app = document.getElementById("app");
  if (!app) return;

  if (state.mode === "setup") return renderSetup(app);
  if (state.mode === "result") return renderResult(app);

  renderGame(app);
  setTimeout(bindSwipe, 0);
}

/* ---------------- SETUP UI ---------------- */

function renderSetup(app) {
  app.innerHTML = `
    <div class="container">

      <h1>🏔 Cascadia</h1>

      <div class="card">

        <label>Spelers (2–6)</label>

        <div class="grid">
          ${[2,3,4,5,6].map(n => `
            <button onclick="setPlayerCount(${n})">${n}</button>
          `).join("")}
        </div>

      </div>

      <div class="card">
        <h3>Naam spelers</h3>

        ${state.players.map((p, i) => `
          <input
            type="text"
            value="${p.name}"
            oninput="updateName(${i}, this.value)"
          />
        `).join("")}
      </div>

      <button onclick="startGame()">Start spel</button>

    </div>
  `;
}

/* ---------------- GAME UI ---------------- */

function renderGame(app) {
  const c = categories[state.step];

  app.innerHTML = `
    <div class="container">

      <div class="topbar">
        <div>${state.step + 1}/${categories.length}</div>
        <div>${c.name}</div>
      </div>

      <div class="card">

        ${state.players.map(p => `
          <div class="row">

            <div class="name">${p.name}</div>

            <input
              class="score"
              type="number"
              inputmode="numeric"
              value="${getScore(p.name, c.id)}"
              onfocus="this.select()"
              onchange="setScore('${p.name}', '${c.id}', this.value)"
            />

          </div>
        `).join("")}

      </div>

      <div class="nav">
        <button onclick="prev()">←</button>
        <button onclick="next()">→</button>
      </div>

    </div>

    ${renderScores()}
  `;
}

/* ---------------- RESULT ---------------- */

function renderResult(app) {
  const t = totals();

  app.innerHTML = `
    <div class="container">

      <h1>🏆 Resultaat</h1>

      <div class="card">
        ${Object.entries(t)
          .sort((a,b)=>b[1]-a[1])
          .map(([p,s],i)=>`
            <div class="row">
              <strong>${i+1}. ${p}</strong>
              <span>${s}</span>
            </div>
          `).join("")}
      </div>

      <button onclick="location.reload()">Nieuw spel</button>

    </div>

    ${renderScores()}
  `;
}

/* ---------------- MINI SCOREBOARD ---------------- */

function renderScores() {
  const t = totals();

  return `
    <div class="bar">
      ${Object.entries(t)
        .sort((a,b)=>b[1]-a[1])
        .map(([p,s])=>`
          <div>${p}: ${s}</div>
        `).join("")}
    </div>
  `;
}
