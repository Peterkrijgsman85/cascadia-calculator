/* ---------------- STATE MANAGEMENT ---------------- */
const defaultNames = ["Hidde", "Jens", "Emma", "Peter", "Willemieke", "Pieter"];

let state = {
  mode: "setup", // setup, game, result, rules
  players: [
    { name: "Hidde" },
    { name: "Jens" }
  ],
  useLandmarks: true, 
  step: 0,
  scores: {} // Structuur: { "Speler Name": { "cat_id": score } }
};

let previousMode = "setup";

// Volledig gecorrigeerde Cascadia categorieën inclusief dynamische snel-ophoging (quickAdd)
const allCategories = [
  { id: "bear", name: "Beren", color: "#b45309", icon: "🐻", isLandmark: false, quickAdd: 5 },
  { id: "elk", name: "Wapiti's", color: "#15803d", icon: "🦌", isLandmark: false, quickAdd: 5 },
  { id: "salmon", name: "Zalmen", color: "#e11d48", icon: "🐟", isLandmark: false, quickAdd: 5 },
  { id: "hawk", name: "Buizerds", color: "#0369a1", icon: "🦅", isLandmark: false, quickAdd: 5 },
  { id: "fox", name: "Vossen", color: "#ea580c", icon: "🦊", isLandmark: false, quickAdd: 5 },
  
  // De 5 leefgebieden (leefgebiedscores liggen lager, dus quickAdd op +1 gezet)
  { id: "mountains", name: "Bergen", color: "#475569", icon: "🏔", isLandmark: false, quickAdd: 1 },
  { id: "forests", name: "Bossen", color: "#16a34a", icon: "🌲", isLandmark: false, quickAdd: 1 },
  { id: "prairies", name: "Prairies", color: "#ca8a04", icon: "🌾", isLandmark: false, quickAdd: 1 },
  { id: "swamps", name: "Moerassen", color: "#059669", icon: "🌿", isLandmark: false, quickAdd: 1 },
  { id: "rivers", name: "Rivieren", color: "#0284c7", icon: "💧", isLandmark: false, quickAdd: 1 },
  
  // 'bonus' is hier verwijderd omdat deze automatisch op de achtergrond berekend wordt!
  { id: "nature", name: "Natuurfiches", color: "#0d9488", icon: "🍃", isLandmark: false, quickAdd: 5 },
  { id: "landmarks_cards", name: "Landmark Kaarten", color: "#854d0e", icon: "📜", isLandmark: true, quickAdd: 5 },
  { id: "landmarks_tokens", name: "Landmark Fiches", color: "#a16207", icon: "🗿", isLandmark: true, quickAdd: 1 }
];

let categories = [];

/* ---------------- PWA INSTALLATION ---------------- */
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Optioneel: render() opnieuw aanroepen om de install-knop te tonen
  render(); 
});

function installApp() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('App geinstalleerd');
      }
      deferredPrompt = null;
      render(); // Verberg de knop na actie
    });
  }
}

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
      const nextName = defaultNames[i] || `Speler ${i + 1}`;
      currentPlayers.push({ name: nextName });
    }
  } else {
    currentPlayers.length = count;
  }
  state.players = currentPlayers;
  saveState();
  render();
}

function updateName(index, name) {
  state.players[index].name = name || defaultNames[index] || `Speler ${index + 1}`;
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
    calculateAreaBonuses(); // Automatische berekening triggeren voor de einduitslag
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

/* ---------------- AUTOMATIC AREA BONUSES ---------------- */
function calculateAreaBonuses() {
  const landIds = ["mountains", "forests", "prairies", "swamps", "rivers"];
  const isTwoPlayer = state.players.length === 2;

  // Reset eerst alle oude berekende bonussen naar 0
  state.players.forEach(p => {
    if (!state.scores[p.name]) state.scores[p.name] = {};
    state.scores[p.name]['bonus'] = 0;
  });

  // Bereken de bonus per specifiek leefgebied
  landIds.forEach(catId => {
    let list = state.players.map(p => ({
      name: p.name,
      score: getScore(p.name, catId)
    }));

    // Sorteer van hoogste naar laagste gebiedscore
    list.sort((a, b) => b.score - a.score);

    // Als niemand in dit gebied heeft gescoord, skippen we de bonus
    if (list.length === 0 || list[0].score === 0) return;

    if (isTwoPlayer) {
      // 2 Spelers: Alleen de grootste krijgt +2. Bij gelijkspel allebei +1.
      if (list[0].score === list[1].score) {
        state.scores[list[0].name]['bonus'] += 1;
        state.scores[list[1].name]['bonus'] += 1;
      } else {
        state.scores[list[0].name]['bonus'] += 2;
      }
    } else {
      // 3+ Spelers: Grootste krijgt +3, tweede krijgt +1.
      const maxScore = list[0].score;
      const winners = list.filter(p => p.score === maxScore);

      if (winners.length > 1) {
        // Gedeelde eerste plaats: tel 1e (+3) en 2e (+1) plek bij elkaar op en deel door aantal winnaars (afronden naar boven)
        const sharedFirstScore = Math.ceil((3 + 1) / winners.length);
        winners.forEach(w => {
          state.scores[w.name]['bonus'] += sharedFirstScore;
        });
      } else {
        // Unieke winnaar krijgt de volle +3
        state.scores[list[0].name]['bonus'] += 3;

        // Bepaal de tweede plaats (moet wel meer dan 0 punten zijn)
        const runnerUpScore = list[1].score;
        if (runnerUpScore > 0) {
          const runnersUp = list.filter(p => p.score === runnerUpScore);
          // Gedeelde 2e plaats: (1 punt / aantal spelers) naar boven afgerond blijft altijd 1 punt p.p.
          runnersUp.forEach(r => {
            state.scores[r.name]['bonus'] += 1;
          });
        }
      }
    }
  });
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
  // Tel hier de dynamisch berekende gebiedsbonus bij op
  total += (state.scores[playerName] ? state.scores[playerName]['bonus'] || 0 : 0);
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

  if (diff > 80) {
    next();
  }
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
  // Bepaal of we op iOS zitten
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  
  // Toon banner als installatie mogelijk is (Android) OF als het iOS is (voor instructie)
  const showBanner = deferredPrompt || isIOS;

  app.innerHTML = `
    <div class="setup-screen core-container">
      <button class="btn-info-floating" onclick="openRules()" title="Bekijk spelregels">⚙️</button>

      ${showBanner ? `
        <div class="card pwa-banner">
          <div class="pwa-icon">📱</div>
          <div class="pwa-text">
            <h3>Zet Cascadia Companion op je beginscherm</h3>
            <p>Installeer de app voor snelle toegang en een optimale schermervaring.</p>
            
            ${isIOS ? `
              <div class="ios-instruction">
                Tik op de <strong>Deel-knop</strong> (pijltje omhoog) onderin en kies <strong>"Zet op beginscherm"</strong>.
              </div>
            ` : `
              <button class="btn-primary" onclick="installApp()">Voeg toe aan beginscherm</button>
            `}
          </div>
        </div>
      ` : ''}

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

      <div class="card toggle-card">
        <div class="toggle-label-wrap">
          <label class="section-label" style="margin-bottom: 2px;">Landmarks Uitbreiding</label>
          <span class="toggle-desc">Voegt kaarten en fiches toe</span>
        </div>
        <label class="switch-container">
          <input type="checkbox" ${state.useLandmarks ? 'checked' : ''} onchange="toggleLandmarks()">
          <span class="slider-toggle"></span>
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
  const quickAmt = c.quickAdd || 5;

  app.innerHTML = `
    <div class="game-screen core-container">
      <header class="step-header">
        <button class="btn-back" onclick="prev()" ${state.step === 0 ? 'disabled' : ''}>←</button>
        <div class="step-title">
          <span class="cat-badge">${c.icon}</span>
          <h2>${c.name}</h2>
          <span class="step-counter">${state.step + 1} / ${categories.length}</span>
        </div>
        <div class="header-spacer"></div>
      </header>

      <div class="scoring-list">
        ${state.players.map(p => {
          const currentScore = getScore(p.name, c.id);
          return `
            <div class="player-score-card">
              <span class="player-name">${p.name}</span>
              <div class="stepper-control">
                <button class="btn-step" onclick="adjustScore('${p.name}', '${c.id}', -1)">−</button>
                <div class="score-display-wrapper" onclick="adjustScore('${p.name}', '${c.id}', ${quickAmt})">
                  <span class="score-value" id="score-${p.name}-${c.id}">${currentScore}</span>
                  <span class="tap-hint">+${quickAmt}</span>
                </div>
                <button class="btn-step" onclick="adjustScore('${p.name}', '${c.id}', 1)">+</button>
              </div>
            </div>
          `;
        }).join("")}
      </div>

      <div class="game-action-row">
        <button class="btn-primary btn-dynamic btn-dynamic-flex" onclick="next()">
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
    <div class="mini-badge">
      <span class="mini-badge-rank">#${index + 1}</span>
      <span class="mini-name">${p.name}</span>
      <span class="mini-badge-score">${calculateTotal(p.name)}</span>
    </div>
  `).join("");
}

function renderResult(app) {
  document.documentElement.style.setProperty('--category-color', '#14532d');

  // Sorteer op totale score. Bij gelijke stand geldt het aantal natuurfiches (nature) als tie-breaker!
  const winners = [...state.players].sort((a, b) => {
    const totalA = calculateTotal(a.name);
    const totalB = calculateTotal(b.name);
    if (totalB === totalA) {
      return getScore(b.name, "nature") - getScore(a.name, "nature");
    }
    return totalB - totalA;
  });

  app.innerHTML = `
    <div class="result-screen core-container">
      <header class="hero-header">
        <span class="hero-icon">👑</span>
        <h1>Einduitslag</h1>
        <p class="subtitle">Mooie pot gespeeld!</p>
      </header>

      <div class="leaderboard-stack">
        ${winners.map((p, index) => {
          if (index === 0) {
            return `
              <div class="winner-card">
                <div class="winner-info">
                  <div class="winner-icon">👑</div>
                  <div>
                    <h3 class="winner-name">${p.name}</h3>
                    <p class="winner-subtitle">Winnaar van Cascadia!</p>
                  </div>
                </div>
                <div class="winner-score">${calculateTotal(p.name)}<span>pt</span></div>
              </div>
            `;
          } else {
            return `
              <div class="leaderboard-card">
                <div class="leaderboard-info">
                  <div class="rank-badge">${index + 1}</div>
                  <div>
                    <h4 class="leaderboard-name">${p.name}</h4>
                  </div>
                </div>
                <div class="leaderboard-score">${calculateTotal(p.name)}<span>pt</span></div>
              </div>
            `;
          }
        }).join("")}
      </div>

      <div class="card result-details-card">
        <label class="section-label">Gedetailleerd overzicht</label>
        <div class="table-wrapper">
          <table class="result-table">
            <thead>
              <tr>
                <th>Onderdeel</th>
                ${state.players.map(p => `<th class="text-right">${p.name.substring(0,6)}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${categories.map(c => `
                <tr class="row-item">
                  <td>
                    <div class="td-icon-wrap"><span>${c.icon}</span> <span>${c.name}</span></div>
                  </td>
                  ${state.players.map(p => `<td class="text-right">${getScore(p.name, c.id)}</td>`).join("")}
                </tr>
              `).join("")}
              
              <tr class="row-bonus">
                <td>
                  <div class="td-icon-wrap"><span>👑</span> <span>Gebiedsbonussen</span></div>
                </td>
                ${state.players.map(p => `<td class="text-right">${state.scores[p.name] ? state.scores[p.name]['bonus'] || 0 : 0}</td>`).join("")}
              </tr>

              <tr class="row-total">
                <td>Totaal</td>
                ${state.players.map(p => `<td class="text-right total-score">${calculateTotal(p.name)}</td>`).join("")}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="action-buttons mt-24">
        <button class="btn-primary btn-dynamic" onclick="restartWithSamePlayers()">
          Speel nogmaals 🔄
        </button>
        <button class="btn-select btn-full-reset" onclick="resetGame()">
          Terug naar Setup
        </button>
      </div>
    </div>
  `;
}

function renderRulesScreen(app) {
  document.documentElement.style.setProperty('--category-color', '#14532d');

  app.innerHTML = `
    <div class="rules-screen core-container">
      
      <header class="step-header">
        <button class="btn-back" onclick="closeRules()">←</button>
        <div class="step-title">
          <span class="cat-badge">📖</span>
          <h2>Spelregels</h2>
          <span class="step-counter">Cascadia</span>
        </div>
        <div class="header-spacer"></div>
      </header>

      <div class="rules-scroll-area">
        <div class="card">
          <label class="section-label">⚙️ Setup: Tegels & Fiches</label>
          <ul class="rules-list">
            <li><strong>2 spelers:</strong> Verwijder 43 tegels (speel met 42). 2 landmark-fiches p.t.</li>
            <li><strong>3 spelers:</strong> Verwijder 22 tegels (speel met 63). 3 landmark-fiches p.t.</li>
            <li><strong>4 spelers:</strong> Gebruik alle 85 basistegels. 4 landmark-fiches p.t.</li>
            <li><strong>5-6 spelers:</strong> Alle tegels + landmarks uitbreiding. Alle fiches.</li>
          </ul>
        </div>

        <div class="card">
          <label class="section-label">🐻 Wildlife & Gebieden</label>
          <p class="rules-text">
            <strong>Dieren:</strong> Vul de behaalde punten per diersoort in volgens de actieve scorekaart.
          </p>
          <p class="rules-text mt-12">
            <strong>Grootste Gebied:</strong> Elke tegel in je grootste aaneengesloten terreintype = 1 punt.
          </p>
          <p class="rules-text mt-12">
            <strong>Gebiedsbonussen (Berekent de app automatisch!):</strong><br>
            • <em>3-6 spelers:</em> Grootste krijgt +3, tweede krijgt +1. Gedeelde 1e plaats = +2 p.p.<br>
            • <em>2 spelers:</em> Alleen grootste krijgt +2. Gedeelde 1e plaats = +1 p.p.
          </p>
        </div>

        <div class="card">
          <label class="section-label">🏛 Landmarks Uitbreiding</label>
          <p class="rules-text">
            <strong>Plaatsen:</strong> Zodra je een leefgebied van <strong>≥ 5 tegels</strong> groot maakt, mag je direct (vrijwillig) een landmark-fiche van dat type pakken en op de laatst gelegde tegel zetten. Er mag daarna <strong>geen dier</strong> meer op!
          </p>
          <p class="rules-text mt-12">
            <strong>Puntentelling:</strong> Tel de punten van je fysieke landmark-fiches én de behaalde bonuspunten van de landmark-kaarten bij elkaar op.
          </p>
        </div>

        <div class="card">
          <label class="section-label">🌲 Natuurfiches & Gelijkspel</label>
          <p class="rules-text">
            <strong>Natuurfiches:</strong> Elk ongebruikt natuurfiche aan het einde is <strong>1 punt</strong> waard.
          </p>
          <p class="rules-text mt-12">
            <strong>Tie-break:</strong> Bij een gelijkspel wint de speler met de meeste natuurfiches. Is het dan nog gelijk? Dan delen de spelers de winst.
          </p>
        </div>
      </div>

      <div class="rules-footer">
        <button class="btn-primary btn-dynamic" onclick="closeRules()">
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