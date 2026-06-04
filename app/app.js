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

let state = load() || {
  step: 0,
  players: ["Jan", "Piet", "Eva", "Klaas"],
  scores: {}
};

function save() {
  localStorage.setItem("cascadia_state", JSON.stringify(state));
}

function load() {
  return JSON.parse(localStorage.getItem("cascadia_state"));
}

function currentCat() {
  return categories[state.step];
}

function render() {
  const app = document.getElementById("app");
  const cat = currentCat();

  if (!cat) return renderResult();

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
