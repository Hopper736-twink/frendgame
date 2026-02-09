import { taskPools, cardsCatalog } from './tasks.js?v=20260209';

const state = {
  players: [],
  currentIndex: 0,
  currentTask: null,
  currentDifficulty: 'easy',
  ultraEnabled: false,
  mode: null,
  globalStreak: 0,
  log: []
};

const $ = (id) => document.getElementById(id);

const ui = {
  modeGate: $('modeGate'),
  gameApp: $('gameApp'),
  modeButtons: Array.from(document.querySelectorAll('[data-gamemode]')),
  turnStatus: $('turnStatus'),
  modeBadge: $('modeBadge'),
  difficultyBadge: $('difficultyBadge'),
  streakBadge: $('streakBadge'),
  playerName: $('playerName'),
  addPlayerBtn: $('addPlayerBtn'),
  playersList: $('playersList'),
  taskType: $('taskType'),
  taskDiff: $('taskDiff'),
  taskText: $('taskText'),
  taskHint: $('taskHint'),
  randomBtn: $('randomBtn'),
  doneBtn: $('doneBtn'),
  failBtn: $('failBtn'),
  nextTurnBtn: $('nextTurnBtn'),
  playerCards: $('playerCards'),
  ultraEnabled: $('ultraEnabled'),
  difficultySelect: $('difficultySelect'),
  helpBtn: $('helpBtn'),
  clearLogBtn: $('clearLogBtn'),
  scoreBoard: $('scoreBoard'),
  gameLog: $('gameLog')
};

function currentPlayer() { return state.players[state.currentIndex]; }
function diffLabel(value) { return value === 'easy' ? 'Лёгкий' : value === 'hard' ? 'Сложный' : 'Офигевший'; }
function randomFrom(list) { return list[Math.floor(Math.random() * list.length)]; }

function logEvent(message) {
  state.log.unshift(message);
  state.log = state.log.slice(0, 20);
  ui.gameLog.innerHTML = state.log.map((item) => `<li>${item}</li>`).join('');
}

function syncBadges() {
  const modeName = state.mode === 'ai' ? 'ИИ' : 'Классика';
  ui.modeBadge.textContent = `🎲 Режим: ${modeName}`;
  ui.difficultyBadge.textContent = `⚡ Сложность: ${diffLabel(state.currentDifficulty)}`;
  ui.streakBadge.textContent = `🔥 Серия: ${state.globalStreak}`;
}

function renderPlayers() {
  ui.playersList.innerHTML = state.players
    .map((player, index) => `<li>${index === state.currentIndex ? '👉 ' : ''}${player.name} — ${player.points} pts, серия: ${player.streak}</li>`)
    .join('');
}

function renderTurn() {
  const player = currentPlayer();
  ui.turnStatus.textContent = player ? `Сейчас ходит: ${player.name}.` : 'Добавь игроков, чтобы начать игру.';
}

function renderScore() {
  const sorted = [...state.players].sort((a, b) => b.points - a.points);
  ui.scoreBoard.innerHTML = sorted.length
    ? sorted.map((player) => `<div class="score-item"><span>${player.name}</span><strong>${player.points}</strong></div>`).join('')
    : '<p class="hint">Пока без очков.</p>';
}

function renderTask() {
  if (!state.currentTask) {
    ui.taskType.textContent = 'Тип: —';
    ui.taskDiff.textContent = 'Сложность: —';
    ui.taskText.textContent = 'Нажми «Рандом», чтобы получить задание';
    ui.taskHint.textContent = 'Подсказка: карты могут заменить задание на своё.';
    return;
  }

  ui.taskType.textContent = `Тип: ${state.currentTask.type === 'truth' ? 'Правда' : 'Действие'}`;
  ui.taskDiff.textContent = `Сложность: ${diffLabel(state.currentTask.diff)}`;
  ui.taskText.textContent = state.currentTask.text;
  ui.taskHint.textContent = 'За длинную серию успешных ходов выпадают более редкие карты.';
}

function renderCards() {
  const player = currentPlayer();
  if (!player) return ui.playerCards.innerHTML = '<p class="hint">Нет игроков.</p>';
  if (!player.cards.length) return ui.playerCards.innerHTML = '<p class="hint">Пока нет карт.</p>';

  ui.playerCards.innerHTML = player.cards.map((card, index) => `
    <div class="card">
      <strong>${card.title}</strong>
      <p class="hint">${card.description}</p>
      <button class="secondary" data-card-index="${index}">Использовать</button>
    </div>
  `).join('');
}

function pickDifficulty() {
  const selected = ui.difficultySelect.value;
  if (selected === 'ultra' && !state.ultraEnabled) return 'hard';
  return selected;
}

function generateAiTask() {
  const topics = ['драма', 'юмор', 'романтика', 'безумие', 'лидерство', 'харизма'];
  const verbs = ['придумай', 'сыграй', 'покажи', 'докажи', 'озвучь'];
  const limits = ['за 30 секунд', 'без смеха', 'в стиле трейлера', 'шёпотом', 'на максимальном пафосе'];
  const type = Math.random() > 0.5 ? 'truth' : 'dare';
  const text = type === 'truth'
    ? `ИИ-вопрос: ${randomFrom(verbs)} свою историю про ${randomFrom(topics)} ${randomFrom(limits)}.`
    : `ИИ-вызов: ${randomFrom(verbs)} мини-перформанс на тему «${randomFrom(topics)}» ${randomFrom(limits)}.`;
  return { type, diff: state.currentDifficulty, text };
}

function grantCard(player) {
  const rarity = Math.min(3, Math.floor(player.streak / 2));
  const available = cardsCatalog.slice(0, 2 + rarity);
  const card = randomFrom(available);
  player.cards.push({ ...card });
  logEvent(`🎁 ${player.name} получает карту «${card.title}».`);
}

function generateTask() {
  const player = currentPlayer();
  if (!player) return alert('Сначала добавь хотя бы одного игрока.');
  state.currentDifficulty = pickDifficulty();

  if (state.mode === 'ai') state.currentTask = generateAiTask();
  else {
    const type = Math.random() > 0.5 ? 'truth' : 'dare';
    const text = randomFrom(taskPools[state.currentDifficulty][type]);
    state.currentTask = { type, diff: state.currentDifficulty, text };
  }

  renderTask();
  syncBadges();
  logEvent(`${player.name} получил ${state.currentTask.type === 'truth' ? 'правду' : 'действие'}: ${state.currentTask.text}`);
}

function applyTurnResult(isSuccess) {
  const player = currentPlayer();
  if (!player || !state.currentTask) return alert('Сначала сгенерируй задание.');

  if (isSuccess) {
    player.streak += 1;
    state.globalStreak += 1;
    let points = state.currentDifficulty === 'easy' ? 1 : state.currentDifficulty === 'hard' ? 2 : 4;
    if (player.doubleReward) { points *= 2; player.doubleReward = false; }
    player.points += points;
    logEvent(`✅ ${player.name} выполнил задание и получил ${points} очков.`);
    if (player.streak % 2 === 0) grantCard(player);
  } else {
    player.streak = 0;
    state.globalStreak = 0;
    player.doubleReward = false;
    logEvent(`❌ ${player.name} пропустил задание.`);
  }

  renderPlayers();
  renderScore();
  renderCards();
  syncBadges();
}

function nextTurn() {
  if (!state.players.length) return;
  state.currentIndex = (state.currentIndex + 1) % state.players.length;
  state.currentTask = null;
  renderTurn();
  renderPlayers();
  renderTask();
  renderCards();
}

function useCard(index) {
  const player = currentPlayer();
  if (!player) return;
  const card = player.cards[index];
  if (!card) return;

  player.cards.splice(index, 1);
  logEvent(`${player.name} использует карту «${card.title}».`);

  if (card.key === 'skip') state.currentTask = { type: 'dare', diff: state.currentDifficulty, text: 'Ход пропущен картой. Передай ход.' };
  if (card.key === 'reroll') return generateTask();
  if (card.key === 'custom') {
    const customText = prompt('Введи своё задание:');
    if (customText?.trim()) state.currentTask = { type: 'dare', diff: state.currentDifficulty, text: customText.trim() };
  }
  if (card.key === 'double') player.doubleReward = true;

  renderTask();
  renderCards();
}

function addPlayer() {
  const name = ui.playerName.value.trim();
  if (!name) return alert('Введите имя, чтобы продолжить.');

  state.players.push({ name, points: 0, streak: 0, cards: [], doubleReward: false });
  ui.playerName.value = '';
  renderPlayers();
  renderTurn();
  renderScore();
  renderCards();
  logEvent(`👤 В игру вошёл игрок ${name}.`);
}

function openGame(mode) {
  state.mode = mode;
  ui.modeGate.classList.add('hidden');
  ui.gameApp.classList.remove('hidden');
  syncBadges();
}

ui.modeButtons.forEach((btn) => btn.addEventListener('click', () => openGame(btn.dataset.gamemode)));
ui.addPlayerBtn.addEventListener('click', addPlayer);
ui.playerName.addEventListener('keydown', (e) => { if (e.key === 'Enter') addPlayer(); });
ui.randomBtn.addEventListener('click', generateTask);
ui.doneBtn.addEventListener('click', () => applyTurnResult(true));
ui.failBtn.addEventListener('click', () => applyTurnResult(false));
ui.nextTurnBtn.addEventListener('click', nextTurn);

ui.ultraEnabled.addEventListener('change', () => {
  state.ultraEnabled = ui.ultraEnabled.checked;
  if (!state.ultraEnabled && ui.difficultySelect.value === 'ultra') ui.difficultySelect.value = 'hard';
  state.currentDifficulty = pickDifficulty();
  syncBadges();
});

ui.difficultySelect.addEventListener('change', () => {
  if (ui.difficultySelect.value === 'ultra' && !state.ultraEnabled) {
    alert('Сначала включи «Офигевший» в настройках.');
    ui.difficultySelect.value = 'hard';
  }
  state.currentDifficulty = pickDifficulty();
  syncBadges();
});

ui.helpBtn.addEventListener('click', () => {
  alert('Правила:\n1) Игроки по очереди берут рандом.\n2) Выполнил — очки и серия.');
});

ui.clearLogBtn.addEventListener('click', () => { state.log = []; ui.gameLog.innerHTML = ''; });
ui.playerCards.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-card-index]');
  if (!button) return;
  useCard(Number(button.dataset.cardIndex));
});

renderPlayers(); renderTurn(); renderScore(); renderTask(); renderCards(); syncBadges();
