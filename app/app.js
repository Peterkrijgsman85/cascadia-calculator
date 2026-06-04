/* =========================
   CASCADIA SCORE V4
   Premium UX Edition
   ========================= */

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

/* ---------------- UTIL ---------------- */

function cat() {
  return categories[state.step];
}

function scoreKey(player, catId) {
  return `${player}_${catId}`;
}

function getScore(player, catId) {
  return state.scores[scoreKey(player, catId)] || 0;
}

function setScore(player, catId, value) {
  state.scores[scoreKey(player, catId)] = parseInt(value) || 0;
  save();
  render(false);
}

function updateName(i, value) {
  state.players[i].name = value;
  save();
}

/* ---------------- HAPTIC ---------------- */

function vibrate() {
  if (navigator.vibrate) navigator.vibrate(10);
}

/* ---------------- SWIPE ---------------- */

let startX = 0;

function setupSwipe() {
  const el = document.getElementById("app");
  if (!el) return;

  el.ontouchstart = (e) => startX = e.touches[0].clientX;

  el.ontouchend = (e) => {
    const diff = e.changedTouches[0].clientX - startX;

    if (Math.abs(diff) < 60) return;

    if (diff < 0) next();
    else prev();
  };
}

/* ---------------- NAV ---------------- */

function next() {
  vibrate();

  if (state.step < categories.length) state.step++;

  save();
  render();
}

function prev() {
  vibrate();

  if (state.step > 0) state.step--;

  save();
  render();
}

/* ---------------- FLOW ---------------- */

function startGame() {
  state.step = 0;
  save();
  render();
}

/* ---------------- RENDER ---------------- */

function render(attachSwipe = true) {
  const app = document.getElementById("app");
  if (!app) return;

  /* START SCREEN */
  if (state.step === -1) {
    app.innerHTML = renderStart();
    return;
  }

  /* RESULT */
  if (state.step >= categories.length) {
    app.innerHTML = renderResult();
    return;
  }

  const c = cat();

  if (!c) {
    state.step = -1;
    save();
    return render();
  }

  app.innerHTML = `
    <div class="container">

      <div class="progress">
        ${state.step + 1} / ${categories.length}
      </div>

      <h1>${c.name}</h1>

      <p class="hint">Swipe ← → of tik knoppen</p>

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
                value="${getScore(p.name, c.id)}"
                onfocus="this.select()"
                onchange="setScore('${p.name}', '${c.id}', this.value)"
              />
            </div>

          </div>
        `).join("")}

      </div>

      <div class="nav">
        <button onclick="prev()">←</button>
        <button onclick="next()">→</button>
      </div>

    </div>

    ${renderScoreboard()}
  `;

  if (attachSwipe) setTimeout(setupSwipe, 0);
}

/* ---------------- START SCREEN ---------------- */

function renderStart() {
  return `
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

      <button onclick="startGame()">Start spel</button>

    </div>
  `;
}

/* ---------------- SCOREBOARD ---------------- */

function calcTotals() {
  const totals = {};

  state.players.forEach(p => totals[p.name] = 0);

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
            <div>${p}</div>
            <div>${s}</div>
          </div>
        `).join("")}
    </div>
  `;
}

/* ---------------- RESULT ---------------- */

function renderResult() {
  const totals = calcTotals();
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);

  return `
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
