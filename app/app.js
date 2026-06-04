/* ---------------- CONFIGURATION ---------------- */

const categories = [
  // WILDLIFE
  { id: "fox", name: "Vossen", icon: "🦊", color: "#d97706" },
  { id: "bear", name: "Beren", icon: "🐻", color: "#854d0e" },
  { id: "hawk", name: "Buizerds", icon: "🦅", color: "#4b5320" },
  { id: "elk", name: "Wapiti's", icon: "🦌", color: "#9a3412" },
  { id: "salmon", name: "Zalmen", icon: "🐟", color: "#0369a1" },
  // LEAFGEBIEDEN
  { id: "mountain", name: "Bergen (Tegels + Bonus)", icon: "🏔", color: "#64748b" },
  { id: "forest", name: "Bossen (Tegels + Bonus)", icon: "🌲", color: "#15803d" },
  { id: "prairie", name: "Prairie (Tegels + Bonus)", icon: "🌾", color: "#b45309" },
  { id: "wetland", name: "Moeras (Tegels + Bonus)", icon: "💧", color: "#0e7490" },
  { id: "river", name: "Rivieren (Tegels + Bonus)", icon: "🌊", color: "#1d4ed8" },
  // LANDMARKS UITBREIDING
  { id: "lm_points", name: "Landmarks (Fiches + Kaarten)", icon: "🏛", color: "#7c3aed" },
  // NATUURFICHES
  { id: "nature_tokens", name: "Natuurfiches", icon: "✨", color: "#0d9488" }
];

/* ---------------- STATE MANAGEMENT ---------------- */

let state = {
  mode: "setup",
  step: 0,
  players: [
    { name: "Jan" },
    { name: "Piet" }
  ],
  scores: {},
  showDetails: false
};

try {
  const saved = localStorage.getItem("cascadia_state_v4");
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed && parsed.players) {
      state = parsed;
      state.showDetails = false; // Reset viewstate bij herstart
    }
  }
} catch (e) {
  console.error("State herstel mislukt", e);
}

function save() {
  localStorage.setItem("cascadia_state_v4", JSON.stringify(state));
}

function resetGame() {
  state.mode = "setup";
  state.step = 0;
  state.scores = {};
  state.showDetails = false;
  save();
  render();
}

/* ---------------- DATA HELPERS ---------------- */

function key(playerName, categoryId) {
  return `${playerName}_${categoryId}`;
}

function getScore(playerName, categoryId) {
  return state.scores[key(playerName, categoryId)] || 0;
}

function adjustScore(playerName, categoryId, amount) {
  const k = key(playerName, categoryId);
  const current = state.scores[k] || 0;
  state.scores[k] = Math.max(0, current + amount);
  save();
  
  const scoreEl = document.getElementById(`score-${playerName}-${categoryId}`);
  if (scoreEl) scoreEl.textContent = state.scores[k];
  
  updateMiniScoreboard();
}

function updateName(index, name) {
  state.players[index].name = name.trim() || `Speler ${index + 1}`;
  save();
}

function setPlayerCount(n) {
  const defaults = ["Jan", "Piet", "Eva", "Klaas", "Lisa", "Tom"];
  const currentPlayers = [...state.players];
  
  state.players = Array.from({ length: n }, (_, i) => {
    if (currentPlayers[i] && !currentPlayers[i].name.startsWith("Speler ")) {
      return currentPlayers[i];
    }
    return { name: defaults[i] || `Speler ${i + 1}` };
  });
  save();
  render();
}

function calculateTotals() {
  const totals = {};
  state.players.forEach(p => totals[p.name] = 0);

  Object.entries(state.scores).forEach(([k, v]) => {
    const p = k.split("_")[0];
    if (totals[p] !== undefined) totals[p] += v;
  });

  return totals;
}

/* ---------------- FLOW CONTROLS ---------------- */

function startGame() {
  state.mode = "game";
  state.step = 0;
  save();
  render();
}

function next() {
  if (state.step < categories.length - 1) {
    state.step++;
    save();
    render();
  } else {
    state.mode = "result";
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

function toggleDetails() {
  state.showDetails = !state.showDetails;
  render();
}

/* ---------------- MODAL LOGIC ---------------- */

function openRules() {
  document.getElementById("rules-modal").classList.add("open");
}

function closeRules() {
  document.getElementById("rules-modal").classList.remove("open");
}

/* ---------------- SWIPE GESTURES ---------------- */

let touchStartX = 0;
let touchStartY = 0;

function handleTouchStart(e) {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}

function handleTouchEnd(e) {
  const diffX = e.changedTouches[0].clientX - touchStartX;
  const diffY = e.changedTouches[0].clientY - touchStartY;

  if (Math.abs(diffX) > 70 && Math.abs(diffY) < 40) {
    diffX < 0 ? next() : prev();
  }
}

/* ---------------- UI RENDERING ---------------- */

function render() {
  const app = document.getElementById("app");
  if (!app) return;

  app.ontouchstart = null;
  app.ontouchend = null;

  // Reset container breedte class
  app.className = "";

  if (state.mode === "setup") {
    renderSetup(app);
  } else if (state.mode === "result") {
    renderResult(app);
  } else {
    renderGame(app);
    app.ontouchstart = handleTouchStart;
    app.ontouchend = handleTouchEnd;
  }
}

function renderSetup(app) {
  app.innerHTML = `
    <div class="setup-screen core-container">
      <header class="hero-header">
        <span class="hero-icon">🏔</span>
        <h1>Cascadia</h1>
        <p class="subtitle">Score Companion</p>
      </header>

      <div class="card">
        <label class="section-label">Aantal spelers</label>
        <div class="player-selector-grid">
          ${[2, 3, 4, 5, 6].map(n => `
            <button 
              class="btn-select ${state.players.length === n ? 'active' : ''}" 
              onclick="setPlayerCount(${n})">${n}
            </button>
          `).join("")}
        </div>
      </div>

      <div class="card">
        <label class="section-label">Namen</label>
        <div class="inputs-stack">
          ${state.players.map((p, i) => `
            <div class="input-group">
              <span class="input-number">${i + 1}</span>
              <input
                type="text"
                value="${p.name}"
                oninput="updateName(${i}, this.value)"
              />
            </div>
          `).join("")}
        </div>
      </div>

      <button class="btn-primary" onclick="startGame()">
        Start Berekening →
      </button>
      
      <button class="btn-secondary" onclick="openRules()">
        ⚙️ Bekijk Spelopzet & Regels
      </button>
    </div>

    <div id="rules-modal" class="modal" onclick="if(event.target === this) closeRules()">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Cascadia Spelregels</h3>
          <button class="btn-close" onclick="closeRules()">×</button>
        </div>
        <div class="rules-body">
          <h4>⚙️ Setup: Tegels & Fiches</h4>
          <ul>
            <li><strong>2 spelers:</strong> Verwijder 43 tegels (speel met 42). 2 landmark-fiches p.t.</li>
            <li><strong>3 spelers:</strong> Verwijder 22 tegels (speel met 63). 3 landmark-fiches p.t.</li>
            <li><strong>4 spelers:</strong> Gebruik alle 85 basistegels. 4 landmark-fiches p.t.</li>
            <li><strong>5-6 spelers:</strong> Alle tegels + landmarks uitbreiding. Alle fiches.</li>
          </ul>

          <h4>🐻 Wildlife & Gebieden</h4>
          <p><strong>Dieren:</strong> Vul de behaalde punten per diersoort in volgens de actieve scorekaart.</p>
          <p><strong>Grootste Gebied:</strong> Elke tegel in je grootste aaneengesloten terreintype = 1 punt.</p>
          <p><strong>Gebiedsbonussen:</strong><br>
             • <em>3-6 spelers:</em> Grootste krijgt +3, tweede krijgt +1.<br>
             • <em>2 spelers:</em> Alleen grootste krijgt +2.
          </p>

          <h4>🏛 Landmarks Uitbreiding</h4>
          <p><strong>Plaatsen:</strong> Zodra je een leefgebied van <strong>≥ 5 tegels</strong> groot maakt, mag je direct (vrijwillig) een landmark-fiche van dat type pakken en op de laatst gelegde tegel zetten. Er mag daarna <strong>geen dier</strong> meer op!</p>
          <p><strong>Puntentelling:</strong> Tel de punten van je fysieke landmark-fiches én de behaalde bonuspunten van de landmark-kaarten bij elkaar op.</p>

          <h4>🌲 Natuurfiches & Gelijkspel</h4>
          <p><strong>Natuurfiches:</strong> Elk ongebruikt natuurfiche aan het einde is <strong>1 punt</strong> waard.</p>
          <p><strong>Tie-break:</strong> Bij een gelijkspel wint de speler met de meeste natuurfiches. Is het dan nog gelijk? Dan delen de spelers de winst.</p>
        </div>
      </div>
    </div>
  `;
}

function renderGame(app) {
  const c = categories[state.step];
  document.documentElement.style.setProperty('--category-color', c.color);

  app.innerHTML = `
    <div class="game-screen core-container">
      
      <header class="step-header">
        <button class="btn-back" onclick="prev()" ${state.step === 0 ? 'disabled' : ''}>←</button>
        <div class="step-title">
          <span class="cat-badge">${c.icon}</span>
          <h2>${c.name}</h2>
          <span class="step-counter">${state.step + 1} / ${categories.length}</span>
        </div>
        <button class="btn-next-step" onclick="next()">
          ${state.step === categories.length - 1 ? '🏆' : '→'}
        </button>
      </header>

      <div class="scoring-list">
        ${state.players.map(p => {
          const currentScore = getScore(p.name, c.id);
          return `
            <div class="player-score-card">
              <span class="player-name">${p.name}</span>
              
              <div class="stepper-control">
                <button class="btn-step" onclick="adjustScore('${p.name}', '${c.id}', -1)">−</button>
                <div class="score-display-wrapper" onclick="adjustScore('${p.name}', '${c.id}', 5)">
                  <span class="score-value" id="score-${p.name}-${c.id}">${currentScore}</span>
                  <span class="tap-hint">+5</span>
                </div>
                <button class="btn-step" onclick="adjustScore('${p.name}', '${c.id}', 1)">+</button>
              </div>
            </div>
          `;
        }).join("")}
      </div>

      <footer class="game-footer">
        <div id="mini-scoreboard" class="mini-scoreboard"></div>
      </footer>
    </div>
  `;
  
  updateMiniScoreboard();
}

function renderResult(app) {
  const t = calculateTotals();
  const sorted = Object.entries(t).sort((a, b) => b[1] - a[1]);
  const winner = sorted[0];

  if (state.showDetails) {
    app.classList.add("wide");
  }

  app.innerHTML = `
    <div class="result-screen core-container ${state.showDetails ? 'wide' : ''}">
      <header class="hero-header animate-pop">
        <span class="hero-icon">👑</span>
        <h1>${winner[0]} wint!</h1>
        <p class="subtitle">Met een score van ${winner[1]} punten</p>
      </header>

      ${!state.showDetails ? `
        <div class="card leaderboard">
          ${sorted.map(([name, score], i) => `
            <div class="leaderboard-row ${i === 0 ? 'winner-row' : ''}">
              <div class="rank-and-name">
                <span class="rank-badge">${i + 1}</span>
                <span class="player-name">${name}</span>
              </div>
              <span class="final-score">${score} pts</span>
            </div>
          `).join("")}
        </div>
      ` : renderMatrixTable()}

      <div class="action-buttons">
        <button class="btn-secondary" onclick="toggleDetails()">
          ${state.showDetails ? 'Verberg details' : '📊 Bekijk score-overzicht (Tabel)'}
        </button>
        <button class="btn-primary" onclick="resetGame()">
          Nieuw Spel
        </button>
      </div>
    </div>
  `;
}

function renderMatrixTable() {
  const totals = calculateTotals();
  
  return `
    <div class="card" style="padding: 10px; overflow: hidden;">
      <label class="section-label">Puntenmatrix</label>
      <div class="table-wrapper">
        <table class="matrix-table">
          <thead>
            <tr>
              <th>Onderdeel</th>
              ${state.players.map(p => `<th>${p.name}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${categories.map(c => `
              <tr>
                <td>${c.icon} ${c.name.split(" (")[0]}</td>
                ${state.players.map(p => `<td>${getScore(p.name, c.id)}</td>`).join("")}
              </tr>
            `).join("")}
              <tr class="row-total">
                <td><strong>Totaal</strong></td>
                ${state.players.map(p => `<td>${totals[p.name]}</td>`).join("")}
              </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function updateMiniScoreboard() {
  const el = document.getElementById("mini-scoreboard");
  if (!el) return;

  const t = calculateTotals();
  const sorted = Object.entries(t).sort((a, b) => b[1] - a[1]);

  el.innerHTML = sorted.map(([name, score], i) => `
    <div class="mini-player-pill ${i === 0 ? 'leading' : ''}">
      <span class="mini-name">${name}</span>
      <span class="mini-score">${score}</span>
    </div>
  `).join("");
}

window.addEventListener("DOMContentLoaded", () => render());
