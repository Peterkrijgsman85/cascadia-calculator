/* ---------------- CONFIGURATION ---------------- */

const categories = [
  { id: "fox", name: "Vossen", icon: "🦊", color: "#d97706", type: "animal" },
  { id: "bear", name: "Beren", icon: "🐻", color: "#854d0e", type: "animal" },
  { id: "hawk", name: "Buizerds", icon: "🦅", color: "#3f6212", type: "animal" },
  { id: "elk", name: "Wapiti's", icon: "🦌", color: "#9a3412", type: "animal" },
  { id: "salmon", name: "Zalmen", icon: "🐟", color: "#0369a1", type: "animal" },
  { id: "mountain", name: "Bergen", icon: "🏔", color: "#4b5563", type: "terrain" },
  { id: "forest", name: "Bossen", icon: "🌲", color: "#15803d", type: "terrain" },
  { id: "prairie", name: "Prairie", icon: "🌾", color: "#b45309", type: "terrain" },
  { id: "wetland", name: "Moeras", icon: "💧", color: "#0e7490", type: "terrain" },
  { id: "river", name: "Rivieren", icon: "🌊", color: "#1d4ed8", type: "terrain" },
  { id: "nature_tokens", name: "Natuurfiches", icon: "🌲✨", color: "#0d9488", type: "bonus" } // Belangrijke toevoeging voor de eindscore!
];

/* ---------------- STATE MANAGEMENT ---------------- */

let state = {
  mode: "setup", // setup | game | result
  step: 0,
  players: [
    { name: "Speler 1" },
    { name: "Speler 2" }
  ],
  scores: {}
};

// State herstellen uit LocalStorage indien aanwezig
try {
  const saved = localStorage.getItem("cascadia_state_v2");
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed && parsed.players) state = parsed;
  }
} catch (e) {
  console.error("State herstel mislukt", e);
}

function save() {
  localStorage.setItem("cascadia_state_v2", JSON.stringify(state));
}

function resetGame() {
  state.mode = "setup";
  state.step = 0;
  state.scores = {};
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
  // Voorkom negatieve scores
  state.scores[k] = Math.max(0, current + amount);
  save();
  
  // Update specifiek dit getal in de DOM direct voor instant feedback zonder volledige re-render
  const scoreEl = document.getElementById(`score-${playerName}-${categoryId}`);
  if (scoreEl) scoreEl.textContent = state.scores[k];
  
  // Update live scorebalk onderin
  updateMiniScoreboard();
}

function updateName(index, name) {
  state.players[index].name = name.trim() || `Speler ${index + 1}`;
  save();
}

function setPlayerCount(n) {
  const currentPlayers = [...state.players];
  state.players = Array.from({ length: n }, (_, i) => {
    return currentPlayers[i] || { name: `Speler ${i + 1}` };
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

  // Alleen swipen als de beweging voornamelijk horizontaal was en groot genoeg
  if (Math.abs(diffX) > 60 && Math.abs(diffY) < 40) {
    if (diffX < 0) {
      next();
    } else {
      prev();
    }
  }
}

/* ---------------- UI RENDERING ---------------- */

function render() {
  const app = document.getElementById("app");
  if (!app) return;

  // Reset swipe listeners om duplicaten te voorkomen
  app.ontouchstart = null;
  app.ontouchend = null;

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
        <p class="subtitle">Score Calculator</p>
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
                placeholder="Naam speler"
                value="${p.name.startsWith('Speler ') ? '' : p.name}"
                placeholder="${p.name}"
                oninput="updateName(${i}, this.value)"
              />
            </div>
          `).join("")}
        </div>
      </div>

      <button class="btn-primary" onclick="startGame()">
        Start Puntentelling <span class="icon-right">→</span>
      </button>
    </div>
  `;
}

function renderGame(app) {
  const c = categories[state.step];

  app.innerHTML = `
    <div class="game-screen core-container" style="--category-color: ${c.color}">
      
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
              <div class="player-info">
                <span class="player-name">${p.name}</span>
              </div>
              
              <div class="stepper-control">
                <button class="btn-step minus" onclick="adjustScore('${p.name}', '${c.id}', -1)">−</button>
                <div class="score-display-wrapper" onclick="adjustScore('${p.name}', '${c.id}', 5)">
                  <span class="score-value" id="score-${p.name}-${c.id}">${currentScore}</span>
                  <span class="tap-hint">+5</span>
                </div>
                <button class="btn-step plus" onclick="adjustScore('${p.name}', '${c.id}', 1)">+</button>
              </div>
            </div>
          `;
        }).join("")}
      </div>

      <footer class="game-footer">
        <div id="mini-scoreboard" class="mini-scoreboard">
          </div>
      </footer>
    </div>
  `;
  
  updateMiniScoreboard();
}

function renderResult(app) {
  const t = calculateTotals();
  const sorted = Object.entries(t).sort((a, b) => b[1] - a[1]);
  const winner = sorted[0];

  app.innerHTML = `
    <div class="result-screen core-container">
      <header class="hero-header animate-pop">
        <span class="hero-icon">👑</span>
        <h1>${winner[0]} wint!</h1>
        <p class="subtitle">Met een score van ${winner[1]} punten</p>
      </header>

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

      <div class="action-buttons">
        <button class="btn-secondary" onclick="state.mode='game'; state.step=0; render();">
          Bekijk details
        </button>
        <button class="btn-primary" onclick="resetGame()">
          Nieuw Spel
        </button>
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

// Initialisatie bij laden
window.addEventListener("DOMContentLoaded", () => {
  render();
});
