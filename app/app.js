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

/* ---------------- RENDER ---------------- */

function render() {
  const app = document.getElementById("app");
  if (!app) return;

  if (state.step === -1) return renderStart();

  if (state.step >= categories.length) return renderResult();

  const cat = currentCat();
  if (!cat) {
    state.step = -1;
    save();
    return renderStart();
  }

  app.innerHTML = `
    <div class="container">
      <h1>${cat.name}</h1>

      <div class="card">
        ${state.players.map((p, i) => `
          <div class="row">
            <div class="name">
              <input type="text"
                value="${p.name}"
                oninput="updateName(${i}, this.value)"
              />
            </div>

            <div class="score">
              <input type="number"
                inputmode="numeric"
                value="${getScore(p.name, cat.id)}"
                onchange="setScore('${p.name}', '${cat.id}', this.value)"
              />
            </div>
          </div>
        `).join("")}
      </div>

      <button onclick="prev()">← Vorige</button>
      <button onclick="next()">Volgende →</button>
    </div>

    ${renderScoreboard()}
  `;
}

/* ---------------- START ---------------- */

function renderStart() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <div class="container">
      <h1>🏔 Cascadia</h1>

      <button onclick="state.step=0;save();render()">
        Start spel
      </button>
    </div>
  `;
}

/* ---------------- NAV ---------------- */

function next() {
  state.step++;
  save();
  render();
}

function prev() {
  if (state.step > 0) state.step--;
  save();
  render();
}

/* ---------------- SCORE ---------------- */

function calcTotals() {
  const totals = {};
  state.players.forEach(p => totals[p.name] = 0);

  Object.entries(state.scores).forEach(([k,v]) => {
    const player = k.split("_")[0];
    totals[player] += v;
  });

  return totals;
}

function renderScoreboard() {
  const totals = calcTotals();

  return `
    <div class="scoreboard">
      ${Object.entries(totals)
        .sort((a,b)=>b[1]-a[1])
        .map(([p,s])=>`
          <div>${p}: ${s}</div>
        `).join("")}
    </div>
  `;
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

      <button onclick="location.reload()">Nieuw spel</button>
    </div>
  `;
}
