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
} catch (e) {
  state = null;
}

if (!state || !Array.isArray(state.players)) {
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

/* ---------------- INIT ---------------- */

window.addEventListener("load", () => {
  render();
});

/* ---------------- SWIPE ---------------- */

let touchStartX = 0;
let touchEndX = 0;

function setupSwipe() {
  const el = document.getElementById("app");
  if (!el) return;

  el.ontouchstart = (e) => {
    touchStartX = e.changedTouches[0].screenX;
  };

  el.ontouchend = (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  };
}

function handleSwipe() {
  const diff = touchEndX - touchStartX;

  if (Math.abs(diff) < 60) return;

  if (diff < 0) next();
  else prev();
}

/* ---------------- CORE ---------------- */

function currentCat() {
  return categories[state.step];
}

function getScore(player, cat) {
  return state.scores[player + "_" + cat] || 0;
}

function setScore(player, cat, value) {
  state.scores[player + "_" + cat] = parseInt(value) || 0;
  save();
  render();
}

function updateName(i, value) {
  state.players[i].name = value;
  save();
}

/* ---------------- START SCREEN ---------------- */

function renderStart() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <div class="container">
      <h1>🏔 Cascadia Score</h1>

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

      <button onclick="startGame()">
        Start spel
      </button>
    </div>
  `;
}

function startGame() {
  state.step = 0;
  save();
  render();
}

/* ---------------- CATEGORY VIEW ---------------- */

function renderCategory(cat) {
  return `
    <div class="container">

      <h1>${cat.name}</h1>
      <p class="hint">👆 Swipe om te navigeren</p>

      <div class="card">

        ${state.players.map((p, i) => `
          <div class="row">

            <div class="name">
              ${p.name}
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

    </div>

    ${renderScoreboard()}
  `;
}

/* ---------------- MAIN RENDER ---------------- */

function render() {
  const app = document.getElementById("app");
  if (!app) return;

  if (state.step === -1) {
    renderStart();
    return;
  }

  if (state.step >= categories.length) {
    renderResult();
    return;
  }

  const cat = currentCat();
  if (!cat) {
    state.step = -1;
    save();
    renderStart();
    return;
  }

  app.innerHTML = renderCategory(cat);

  setTimeout(setupSwipe, 0);
}

/* ---------------- NAVIGATION ---------------- */

function next() {
  state.step++;

  if (state.step > categories.length) {
    state.step = categories.length;
  }

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

/* ---------------- SCOREBOARD ---------------- */

function calcTotals() {
  const totals = {};

  state.players.forEach(p => {
    totals[p.name] = 0;
  });

  Object.entries(state.scores).forEach(([k, v]) => {
    const player = k.split("_")[0];
    if (!totals[player]) totals[player] = 0;
    totals[player] += v;
  });

  return totals;
}

function renderScoreboard() {
  const totals = calcTotals();

  return `
    <div class="scoreboard">
      ${Object.entries(totals)
        .sort((a, b) => b[1] - a[1])
        .map(([p, s]) => `
          <div class="player">
            ${p}<br><span>${s}</span>
          </div>
        `).join("")}
    </div>
  `;
}

/* ---------------- RESULT ---------------- */

function renderResult() {
  const totals = calcTotals();
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);

  const app = document.getElementById("app");

  app.innerHTML = `
    <div class="container">
      <h1>🏆 Resultaat</h1>

      <div class="card">
        ${sorted.map(([p, s], i) => `
          <h2>${i + 1}. ${p} — ${s}</h2>
        `).join("")}
      </div>

      <button onclick="reset()">Nieuw spel</button>
    </div>

    ${renderScoreboard()}
  `;
}

/* ---------------- RESET ---------------- */

function reset() {
  localStorage.removeItem("cascadia_state");
  location.reload();
}
