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
  scores: {}, // Structuur: { "Speler Name": { "cat_id": score } }
  hideInstallBanner: false
};

let previousMode = "setup";

function applySystemTheme() {
  const colorSchemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
  const prefersDark = colorSchemeMedia.matches;
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  document.documentElement.dataset.theme = prefersDark ? 'dark' : 'light';
  document.documentElement.style.colorScheme = prefersDark ? 'dark' : 'light';

  if (themeMeta) {
    themeMeta.setAttribute('content', prefersDark ? '#020617' : '#f8fafc');
  }
}

applySystemTheme();

const colorSchemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
if (colorSchemeMedia.addEventListener) {
  colorSchemeMedia.addEventListener('change', applySystemTheme);
} else if (colorSchemeMedia.addListener) {
  colorSchemeMedia.addListener(applySystemTheme);
}

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

function dismissInstallBanner() {
  state.hideInstallBanner = true;
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
    if (state.mode === "game") updateGameUI(); // Schuif slider
    else render();
  }
}

function next() {
  if (state.step < categories.length - 1) {
    state.step++;
    saveState();
    if (state.mode === "game") updateGameUI(); // Schuif slider
    else render();
  } else {
    calculateAreaBonuses();
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
    state.scores[p.name]['bonusBreakdown'] = {};
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

    const awardBonus = (playerName, amount) => {
      if (!state.scores[playerName]) state.scores[playerName] = {};
      if (!state.scores[playerName]['bonusBreakdown']) state.scores[playerName]['bonusBreakdown'] = {};
      state.scores[playerName]['bonus'] += amount;
      state.scores[playerName]['bonusBreakdown'][catId] = (state.scores[playerName]['bonusBreakdown'][catId] || 0) + amount;
    };

    if (isTwoPlayer) {
      // 2 Spelers: Alleen de grootste krijgt +2. Bij gelijkspel allebei +1.
      if (list[0].score === list[1].score) {
        awardBonus(list[0].name, 1);
        awardBonus(list[1].name, 1);
      } else {
        awardBonus(list[0].name, 2);
      }
    } else {
      // 3+ Spelers: Grootste krijgt +3, tweede krijgt +1.
      const maxScore = list[0].score;
      const winners = list.filter(p => p.score === maxScore);

      if (winners.length > 1) {
        // Gedeelde eerste plaats: tel 1e (+3) en 2e (+1) plek bij elkaar op en deel door aantal winnaars (afronden naar boven)
        const sharedFirstScore = Math.ceil((3 + 1) / winners.length);
        winners.forEach(w => {
          awardBonus(w.name, sharedFirstScore);
        });
      } else {
        // Unieke winnaar krijgt de volle +3
        awardBonus(list[0].name, 3);

        // Bepaal de tweede plaats (moet wel meer dan 0 punten zijn)
        const runnerUpScore = list[1].score;
        if (runnerUpScore > 0) {
          const runnersUp = list.filter(p => p.score === runnerUpScore);
          // Gedeelde 2e plaats: (1 punt / aantal spelers) naar boven afgerond blijft altijd 1 punt p.p.
          runnersUp.forEach(r => {
            awardBonus(r.name, 1);
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
  if (!state.scores[playerName]) state.scores[playerName] = {};
  
  let current = state.scores[playerName][catId] || 0;
  let newScore = current + amount;
  if (newScore < 0) newScore = 0;

  state.scores[playerName][catId] = newScore;
  
  const element = document.getElementById(`score-${playerName}-${catId}`);
  if (element) element.innerText = newScore;

  // MICRO-INTERACTIE: Haptic Feedback (trillen) voor de echte app-ervaring op Android
  if (navigator.vibrate) navigator.vibrate(15); 

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

function getAreaBonus(playerName, catId) {
  if (!state.scores[playerName]) return 0;
  const breakdown = state.scores[playerName]['bonusBreakdown'];
  return breakdown && breakdown[catId] ? breakdown[catId] : 0;
}

/* ---------------- SWIPE GESTURES ---------------- */
/* ---------------- SWIPE GESTURES (NATIVE TRACKING) ---------------- */
let startX = 0;
let currentX = 0;
let startY = 0;
let isDragging = false;
let isVerticalScroll = false;

function handleTouchStart(e) {
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
  isDragging = true;
  isVerticalScroll = false;
  
  const track = document.getElementById('slider-track');
  if (track) track.style.transition = 'none'; // Koppel CSS animatie los zodat hij exact je vinger volgt
}

function handleTouchMove(e) {
  if (!isDragging) return;
  const x = e.touches[0].clientX;
  const y = e.touches[0].clientY;
  const diffX = x - startX;
  const diffY = y - startY;

  // Is de gebruiker eigenlijk gewoon naar beneden aan het scrollen in de lijst?
  if (!isVerticalScroll && Math.abs(diffY) > 5 && Math.abs(diffY) > Math.abs(diffX)) {
    isVerticalScroll = true; // Zo ja, negeer de horizontale swipe!
  }

  if (isVerticalScroll) return; // Laat de browser rustig verticaal scrollen

  // Als we hier zijn, is het een echte swipe: blokkeer pagina-bounce
  if (e.cancelable) e.preventDefault(); 
  currentX = diffX;

  const track = document.getElementById('slider-track');
  if (track) {
    // Schuif de baan mee met de vinger van de speler
    const baseOffset = -(state.step * track.clientWidth);
    track.style.transform = `translateX(${baseOffset + currentX}px)`;
  }
}

function handleTouchEnd(e) {
  if (!isDragging) return;
  isDragging = false;
  
  if (isVerticalScroll) {
    updateGameUI(); // Mocht de track iets verschoven zijn, klik hem terug
    return;
  }

  const swipeThreshold = 60; // Hoeveel pixels moet je vegen om te activeren?
  if (currentX < -swipeThreshold && state.step < categories.length - 1) {
    next();
  } else if (currentX > swipeThreshold && state.step > 0) {
    prev();
  } else {
    updateGameUI(); // Te kort geveegd? Snap terug naar huidig scherm
  }
  
  currentX = 0;
}

/* ---------------- UI RENDERING ---------------- */
function render() {
  const app = document.getElementById("app");
  if (!app) return;

  app.className = "";
  // Globale onTouch is hier weggehaald! Dat was foutgevoelig, zit nu in renderGame.

  switch (state.mode) {
    case "setup": renderSetup(app); break;
    case "game": renderGame(app); break;
    case "result": renderResult(app); break;
    case "rules": renderRulesScreen(app); break;
  }
}

function renderSetup(app) {
  // 1. Bepaal het device type
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  
  // 2. Check of de app al als 'App' draait (geen browser-balk zichtbaar)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  // 3. Toon de banner alleen als:
  // - We NIET in standalone modus draaien (want dan is de app al geïnstalleerd)
  // - EN we ofwel een install-prompt hebben (Android) OF we op iOS zitten
  // - EN de gebruiker hem niet heeft gesloten
  const showBanner = !isStandalone && !state.hideInstallBanner && (deferredPrompt || isIOS);

  app.innerHTML = `
    <div class="setup-screen core-container">
      <button class="btn-info-floating" onclick="openRules()" title="Bekijk spelregels">⚙️</button>

      ${showBanner ? `
        <div class="pwa-banner pwa-banner-overlay">
          <div class="pwa-banner-main">
            <div class="pwa-icon">📱</div>
            <div class="pwa-text">
              <h3>Voeg Cascadia Score Companion toe aan je beginscherm</h3>
              <p>Open de app sneller en gebruik hem alsof het een echte telefoon-app is.</p>
              ${isIOS ? `
                <div class="ios-instruction">
                  Tik op de <strong>Deel-knop</strong> en kies <strong>"Zet op beginscherm"</strong>.
                </div>
              ` : `
                <button class="btn-install" onclick="installApp()">Installeren</button>
              `}
            </div>
          </div>
          <button class="pwa-banner-close" onclick="dismissInstallBanner()" aria-label="Banner sluiten" title="Sluiten">✕</button>
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
  // Bouw in één keer alle categorie-kaarten naast elkaar (onzichtbaar behalve de eerste)
  const slidesHTML = categories.map(c => {
    const quickAmt = c.quickAdd || 5;
    return `
      <div class="slider-slide">
        <div class="scoring-list">
          ${state.players.map(p => {
            const currentScore = getScore(p.name, c.id);
            return `
              <div class="player-score-card" style="border-left-color: ${c.color}">
                <span class="player-name">${p.name}</span>
                <div class="stepper-control">
                  <button class="btn-step" onclick="adjustScore('${p.name}', '${c.id}', -1)">−</button>
                  <div class="score-display-wrapper" onclick="adjustScore('${p.name}', '${c.id}', ${quickAmt})">
                    <span class="score-value" id="score-${p.name}-${c.id}">${currentScore}</span>
                    <span class="tap-hint" style="color: ${c.color}">+${quickAmt}</span>
                  </div>
                  <button class="btn-step" onclick="adjustScore('${p.name}', '${c.id}', 1)">+</button>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }).join("");

  app.innerHTML = `
    <div class="game-screen core-container">
      <header class="step-header">
        <button class="btn-back" id="game-btn-prev" onclick="prev()">←</button>
        <div class="step-title">
          <span class="cat-badge" id="game-cat-icon"></span>
          <h2 id="game-cat-name"></h2>
          <span class="step-counter"><span id="game-step-counter"></span> / ${categories.length}</span>
        </div>
        <button class="btn-reset-inline btn-reset-header" onclick="resetGame()" title="Spel resetten">↺ Reset</button>
      </header>

      <div class="slider-viewport" id="slider-viewport">
        <div class="slider-track" id="slider-track">
          ${slidesHTML}
        </div>
      </div>

      <div class="game-action-row">
        <button class="btn-primary btn-dynamic btn-dynamic-flex" id="game-btn-next" onclick="next()"></button>
      </div>

      <footer class="game-footer">
        <div id="mini-scoreboard" class="mini-scoreboard"></div>
      </footer>
    </div>
  `;
  
  // Koppel de vinger-tracker specifiek en alleen aan het slider blok!
  const viewport = document.getElementById('slider-viewport');
  viewport.addEventListener('touchstart', handleTouchStart, {passive: true});
  viewport.addEventListener('touchmove', handleTouchMove, {passive: false});
  viewport.addEventListener('touchend', handleTouchEnd, {passive: true});

  // Positioneer de track direct goed
  updateGameUI(true);
  updateMiniScoreboard();
}

function updateGameUI(isInit = false) {
  if (state.mode !== "game") return;
  
  const c = categories[state.step];
  
  // Update knop & achtergrond kleuren
  document.documentElement.style.setProperty('--category-color', c.color);

  // Update de Header data zonder HTML te vernietigen
  document.getElementById('game-cat-icon').innerText = c.icon;
  document.getElementById('game-cat-name').innerText = c.name;
  document.getElementById('game-step-counter').innerText = state.step + 1;

  // Update de knoppen
  document.getElementById('game-btn-prev').disabled = (state.step === 0);
  const btnNext = document.getElementById('game-btn-next');
  if (state.step === categories.length - 1) {
    btnNext.innerText = 'Bekijk Einduitslag 🏆';
  } else {
    btnNext.innerText = 'Volgende Categorie →';
  }

  // Schuif de carrousel animatie
  const track = document.getElementById('slider-track');
  if (track) {
    if (!isInit) {
       // Maak de transitie boterzacht als we dit via een knop-klik doen
       track.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
    }
    track.style.transform = `translateX(-${state.step * 100}%)`;
  }
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

  const resultSections = [
    {
      title: 'Dieren',
      items: ['bear', 'elk', 'salmon', 'hawk', 'fox']
    },
    {
      title: 'Leefgebieden',
      items: ['mountains', 'forests', 'prairies', 'swamps', 'rivers']
    },
    {
      title: 'Bonuspunten leefgebieden',
      items: ['mountains', 'forests', 'prairies', 'swamps', 'rivers'],
      isBonus: true
    },
    {
      title: 'Natuurfiches',
      items: ['nature']
    },
    {
      title: 'Landmarks',
      items: ['landmarks_cards', 'landmarks_tokens']
    }
  ];

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
              ${resultSections.map(section => {
                const rows = section.items.map(catId => {
                  const category = allCategories.find(c => c.id === catId);
                  if (section.isBonus) {
                    return `
                      <tr class="row-bonus">
                        <td>
                          <div class="td-icon-wrap"><span>${category ? category.icon : '🏞️'}</span> <span>${category ? category.name : catId}</span></div>
                        </td>
                        ${state.players.map(p => `<td class="text-right">${getAreaBonus(p.name, catId)}</td>`).join("")}
                      </tr>
                    `;
                  }

                  return `
                    <tr class="row-item">
                      <td>
                        <div class="td-icon-wrap"><span>${category ? category.icon : '📌'}</span> <span>${category ? category.name : catId}</span></div>
                      </td>
                      ${state.players.map(p => `<td class="text-right">${getScore(p.name, catId)}</td>`).join("")}
                    </tr>
                  `;
                }).join("");

                return `
                  <tr class="row-group-header">
                    <td colspan="${state.players.length + 1}">${section.title}</td>
                  </tr>
                  ${rows}
                `;
              }).join("")}

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