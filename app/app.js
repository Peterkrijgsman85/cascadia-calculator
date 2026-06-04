/* ---------------- STATE MANAGEMENT ---------------- */
let state = {
  mode: "setup", // setup, game, result, rules
  players: [
    { name: "Speler 1" },
    { name: "Speler 2" }
  ],
  useLandmarks: true, // Nieuwe optie voor de startpagina
  step: 0,
  scores: {} // Structuur: { "Speler Name": { "cat_id": score } }
};

let previousMode = "setup";

// Definieer alle mogelijke categorieën
const allCategories = [
  { id: "bear", name: "Beren 🐻", color: "#b45309", icon: "🐻", isLandmark: false },
  { id: "elk", name: "Edelherten 🦌", color: "#15803d", icon: "🦌", isLandmark: false },
  { id: "salmon", name: "Zalmen 🐟", color: "#e11d48", icon: "🐟", isLandmark: false },
  { id: "hawk", name: "Haviken 🦅", color: "#0369a1", icon: "🦅", isLandmark: false },
  { id: "fox", name: "Vossen 🦊", color: "#ea580c", icon: "🦊", isLandmark: false },
  { id: "terrain", name: "Leefgebieden 🌲", color: "#16a34a", icon: "🌲", isLandmark: false },
  { id: "bonus", name: "Gebiedsbonussen 👑", color: "#d97706", icon: "👑", isLandmark: false },
  { id: "nature", name: "Natuurfiches 🌲", color: "#0d9488", icon: "💧", isLandmark: false },
  // De landmarks categorieën
  { id: "landmarks_cards", name: "Landmark Kaarten 🏛", color: "#7c3aed", icon: "📜", isLandmark: true },
  { id: "landmarks_tokens", name: "Landmark Fiches 🏛", color: "#6d28d9", icon: "🪙", isLandmark: true }
];

// Dynamische lijst op basis van de gekozen instelling
let categories = [];

/* ---------------- LOCAL STORAGE ---------------- */
function saveState() {
  localStorage.setItem("cascadia_score_state", JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem("cascadia_score_state");
  if (saved) {
    try {
      state = JSON.parse(saved);
    } catch (e) {
      console.error("Fout bij laden van cache", e);
    }
  }
  updateCategoriesList();
}

function updateCategoriesList() {
  if (state.useLandmarks) {
    categories = allCategories;
  } else {
    categories = allCategories.filter(c => !c.isLandmark);
  }
}

/* ---------------- FLOW CONTROLS ---------------- */
function setPlayerCount(count) {
  const currentPlayers = [...state.players];
  if (count > currentPlayers.length) {
    for (let i = currentPlayers.length; i < count; i++) {
      currentPlayers.push({ name: `Speler ${i + 1}` });
    }
  } else {
    currentPlayers.length = count;
  }
  state.players = currentPlayers;
  saveState();
  render();
}

function updateName(index, name) {
  state.players[index].name = name || `Speler ${index + 1}`;
  saveState();
}

function toggleLandmarks() {
  state.useLandmarks = !state.useLandmarks;
  updateCategoriesList();
  saveState();
  render();
}

function openRules() {
  previousMode = state.mode;
  state.mode = "rules";
  render();
}

function closeRules() {
  state.mode = previousMode;
  render();
}

function startGame() {
  updateCategoriesList();
  state.mode = "game";
  state.step = 0;
  saveState();
  render();
}

function prev() {
  if (state.step > 0) {
    state.step--;
    saveState();
    render();
  }
}

function next() {
  if (state.step < categories.length - 1) {
    state.step++;
    saveState();
    render();
  } else {
    state.mode = "result";
    saveState();
    render();
  }
}

function resetGame() {
  if (confirm("Weet je zeker dat je alle huidige scores wilt wissen en opnieuw wilt beginnen?")) {
    state.scores = {};
    state.step = 0;
    state.mode = "setup";
    saveState();
    render();
  }
}

function restartWithSamePlayers() {
  state.scores = {};
  state.step = 0;
  state.mode = "game";
  saveState();
  render();
}

/* ---------------- CORE SCORING LOGIC ---------------- */
function getScore(playerName, catId) {
  if (!state.scores[playerName]) return 0;
  return state.scores[playerName][catId] || 0;
}

function adjustScore(playerName, catId, amount) {
  if (!state.scores[playerName]) {
    state.scores[playerName] = {};
  }
  let current = state.scores[playerName][catId] || 0;
  let newScore = current + amount;
  if (newScore < 0) newScore = 0;

  state.scores[playerName][catId] = newScore;
  
  // Update de DOM direct voor vliegensvlugge responsiviteit
  const element = document.getElementById(`score-${playerName}-${catId}`);
  if (element) element.innerText = newScore;

  saveState();
  updateMiniScoreboard();
}

function calculateTotal(playerName) {
  let total = 0;
  categories.forEach(c => {
    total += getScore(playerName, c.id);
  });
  return total;
}

/* ---------------- SWIPE GESTURES ---------------- */
let touchStartX = 0;
let touchEndX = 0;

function handleTouchStart(e) {
  touchStartX = e.changedTouches[0].screenX;
}

function handleTouchEnd(e) {
  touchEndX = e.changedTouches[0].screenX;
  const diff = touchStartX - touchEndX;

  // Swipe naar links (Volgende)
  if (diff > 80) {
    next();
  }
  // Swipe naar rechts (Vorige)
  if (diff < -80) {
    prev();
  }
}

/* ---------------- UI RENDERING ---------------- */
function render() {
  const app = document.getElementById("app");
  if (!app) return;

  app.ontouchstart = null;
  app.ontouchend = null;
  app.className = "";

  switch (state.mode) {
    case "setup":
      renderSetup(app);
      break;
    case "game":
      renderGame(app);
      app.ontouchstart = handleTouchStart;
      app.ontouchend = handleTouchEnd;
      break;
    case "result":
      renderResult(app);
      break;
    case "rules":
      renderRulesScreen(app);
      break;
  }
}

function renderSetup(app) {
  app.innerHTML = `
    <div class="setup-screen core-container" style="position: relative;">
      <button class="btn-info-floating" onclick="openRules()" title="Bekijk spelregels">⚙️</button>

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

      <div class="card" style="display: flex; align-items: center; justify-content: space-between; padding: 16px;">
        <div>
          <label class="section-label" style="margin-bottom: 2px;">Landmarks Uitbreiding</label>
          <span style="font-size: 12px; color: var(--text-muted);">Voegt kaarten en fiches toe</span>
        </div>
        <label class="switch-container" style="position: relative; display: inline-block; width: 50px; height: 28px;">
          <input type="checkbox" ${state.useLandmarks ? 'checked' : ''} onchange="toggleLandmarks()" style="opacity: 0; width: 0; height: 0;">
          <span class="slider-toggle" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${state.useLandmarks ? '#7c3aed' : '#cbd5e1'}; transition: .3s; border-radius: 34px;"></span>
        </label>
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
        <div style="width: 44px;"></div>
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

      <div class="game-action-row" style="margin-top: 24px; display: flex; gap: 12px;">
        <button class="btn-primary" onclick="next()" style="background: var(--category-color); box-shadow: none; margin-bottom: 0; flex: 1;">
          ${state.step === categories.length - 1 ? 'Bekijk Einduitslag 🏆' : 'Volgende Categorie →'}
        </button>
        <button class="btn-reset-inline" onclick="resetGame()" title="Spel resetten">🗑️</button>
      </div>

      <footer class="game-footer">
        <div id="mini-scoreboard" class="mini-scoreboard"></div>
      </footer>
    </div>
  `;
  
  updateMiniScoreboard();
}

function updateMiniScoreboard() {
  const board = document.getElementById("mini-scoreboard");
  if (!board) return;

  const sorted = [...state.players].sort((a, b) => calculateTotal(b.name) - calculateTotal(a.name));

  board.innerHTML = sorted.map((p, index) => `
    <div class="mini-player-row">
      <span class="mini-rank">${index + 1}.</span>
      <span class="mini-name">${p.name}</span>
      <span class="mini-score">${calculateTotal(p.name)} pt</span>
    </div>
  `).join("");
}

function renderResult(app) {
  document.documentElement.style.setProperty('--category-color', '#22c55e');

  const winners = [...state.players].sort((a, b) => calculateTotal(b.name) - calculateTotal(a.name));

  app.innerHTML = `
    <div class="result-screen core-container">
      <header class="hero-header">
        <span class="hero-icon">🏆</span>
        <h1>Einduitslag</h1>
        <p class="subtitle">En de winnaar is ${winners[0].name}!</p>
      </header>

      <div class="leaderboard-stack">
        ${winners.map((p, index) => `
          <div class="leaderboard-card ${index === 0 ? 'winner' : ''}">
            <div class="leaderboard-rank">${index + 1}</div>
            <div class="leaderboard-details">
              <h3>${p.name}</h3>
              <p>Totaal gescoord</p>
            </div>
            <div class="leaderboard-score">${calculateTotal(p.name)}<span>pt</span></div>
          </div>
        `).join("")}
      </div>

      <div class="card" style="margin-top: 24px;">
        <label class="section-label">Gedetailleerd overzicht</label>
        <div style="overflow-x: auto;">
          <table class="result-table" style="width: 100%; border-collapse: collapse; font-size: 14px; text-align: left;">
            <thead>
              <tr style="border-bottom: 2px solid var(--border-color);">
                <th style="padding: 8px 4px;">Onderdeel</th>
                ${state.players.map(p => `<th style="padding: 8px 4px; text-align: right;">${p.name.substring(0,6)}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${categories.map(c => `
                <tr style="border-bottom: 1px solid var(--border-color);">
                  <td style="padding: 8px 4px;">${c.icon} ${c.name.split(" ")[0]}</td>
                  ${state.players.map(p => `<td style="padding: 8px 4px; text-align: right; font-weight: 500;">${getScore(p.name, c.id)}</td>`).join("")}
                </tr>
              `).join("")}
              <tr style="font-weight: bold; background: var(--bg-main);">
                <td style="padding: 10px 4px;">Totaal</td>
                ${state.players.map(p => `<td style="padding: 10px 4px; text-align: right; color: var(--primary-color);">${calculateTotal(p.name)}</td>`).join("")}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style="margin-top: 24px; display: flex; flex-direction: column; gap: 12px;">
        <button class="btn-primary" onclick="restartWithSamePlayers()">
          Speel nogmaals 🔄
        </button>
        <button class="btn-select" onclick="resetGame()" style="width: 100%; padding: 16px; border-radius: 12px;">
          Terug naar Setup
        </button>
      </div>
    </div>
  `;
}

function renderRulesScreen(app) {
  document.documentElement.style.setProperty('--category-color', '#7c3aed');

  app.innerHTML = `
    <div class="rules-screen core-container">
      
      <header class="step-header">
        <button class="btn-back" onclick="closeRules()">←</button>
        <div class="step-title">
          <span class="cat-badge">📖</span>
          <h2>Spelregels</h2>
          <span class="step-counter">Cascadia</span>
        </div>
        <div style="width: 44px;"></div>
      </header>

      <div class="rules-scroll-area">
        <div class="card">
          <label class="section-label">⚙️ Setup: Tegels & Fiches</label>
          <ul style="margin: 8px 0; padding-left: 20px; line-height: 1.5;">
            <li style="margin-bottom: 6px;"><strong>2 spelers:</strong> Verwijder 43 tegels (speel met 42). 2 landmark-fiches p.t.</li>
            <li style="margin-bottom: 6px;"><strong>3 spelers:</strong> Verwijder 22 tegels (speel met 63). 3 landmark-fiches p.t.</li>
            <li style="margin-bottom: 6px;"><strong>4 spelers:</strong> Gebruik alle 85 basistegels. 4 landmark-fiches p.t.</li>
            <li><strong>5-6 spelers:</strong> Alle tegels + landmarks uitbreiding. Alle fiches.</li>
          </ul>
        </div>

        <div class="card">
          <label class="section-label">🐻 Wildlife & Gebieden</label>
          <p style="margin: 6px 0 12px 0; line-height: 1.4; font-size: 14px;">
            <strong>Dieren:</strong> Vul de behaalde punten per diersoort in volgens de actieve scorekaart.
          </p>
          <p style="margin: 12px 0 12px 0; line-height: 1.4; font-size: 14px;">
            <strong>Grootste Gebied:</strong> Elke tegel in je grootste aaneengesloten terreintype = 1 punt.
          </p>
          <p style="margin: 12px 0 0 0; line-height: 1.4; font-size: 14px;">
            <strong>Gebiedsbonussen:</strong><br>
            • <em>3-6 spelers:</em> Grootste krijgt +3, tweede krijgt +1.<br>
            • <em>2 spelers:</em> Alleen grootste krijgt +2.
          </p>
        </div>

        <div class="card">
          <label class="section-label">🏛 Landmarks Uitbreiding</label>
          <p style="margin: 6px 0 12px 0; line-height: 1.4; font-size: 14px;">
            <strong>Plaatsen:</strong> Zodra je een leefgebied van <strong>≥ 5 tegels</strong> groot maakt, mag je direct (vrijwillig) een landmark-fiche van dat type pakken en op de laatst gelegde tegel zetten. Er mag daarna <strong>geen dier</strong> meer op!
          </p>
          <p style="margin: 12px 0 0 0; line-height: 1.4; font-size: 14px;">
            <strong>Puntentelling:</strong> Tel de punten van je fysieke landmark-fiches én de behaalde bonuspunten van de landmark-kaarten bij elkaar op.
          </p>
        </div>

        <div class="card">
          <label class="section-label">🌲 Natuurfiches & Gelijkspel</label>
          <p style="margin: 6px 0 12px 0; line-height: 1.4; font-size: 14px;">
            <strong>Natuurfiches:</strong> Elk ongebruikt natuurfiche aan het einde is <strong>1 punt</strong> waard.
          </p>
          <p style="margin: 12px 0 0 0; line-height: 1.4; font-size: 14px;">
            <strong>Tie-break:</strong> Bij een gelijkspel wint de speler met de meeste natuurfiches. Is het dan nog gelijk? Dan delen de spelers de winst.
          </p>
        </div>
      </div>

      <div style="margin-top: 20px;">
        <button class="btn-primary" onclick="closeRules()" style="background: var(--category-color); box-shadow: none;">
          Terug naar App ←
        </button>
      </div>
    </div>
  `;
}

/* ---------------- APP INITIALIZATION ---------------- */
window.onload = function() {
  loadState();
  render();
};
