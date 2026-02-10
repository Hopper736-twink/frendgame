import { taskPools, cardsCatalog, aiGameTemplates } from './tasks.js?v=20260210';

const state = {
  players: [],
  currentIndex: 0,
  currentTask: null,
  currentDifficulty: 'easy',
  ultraEnabled: false,
  game: null,
  globalStreak: 0,
  log: []
};

const $ = (id) => document.getElementById(id);

const ui = {
  gameGate: $('gameGate'),
  gameApp: $('gameApp'),
  gameButtons: Array.from(document.querySelectorAll('[data-game]')),
  gameSubtitle: $('gameSubtitle'),
  gameBadge: $('gameBadge'),
  turnStatus: $('turnStatus'),
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
  difficultyBlock: $('difficultyBlock'),
  helpBtn: $('helpBtn'),
  clearLogBtn: $('clearLogBtn'),
  scoreBoard: $('scoreBoard'),
  gameLog: $('gameLog')
};

function currentPlayer() {
  return state.players[state.currentIndex];
}

function diffLabel(value) {
  return value === 'easy' ? 'Лёгкий' : value === 'hard' ? 'Сложный' : 'Офигевший';
}

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function logEvent(message) {
  state.log.unshift(message);
  state.log = state.log.slice(0, 20);
  ui.gameLog.innerHTML = state.log.map((item) => `<li>${item}</li>`).join('');
}

function syncBadges() {
  const gameName = state.game === 'ai' ? 'ИИ Игра' : 'Правда или Действие';
  ui.gameBadge.textContent = `🎮 Игра: ${gameName}`;
  ui.gameSubtitle.innerHTML = `Игра: <strong>${gameName}</strong>.`;
  ui.difficultyBadge.textContent = `⚡ Сложность: ${state.game === 'ai' ? 'Адаптивная' : diffLabel(state.currentDifficulty)}`;
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
    ui.taskHint.textContent = state.game === 'ai'
      ? 'ИИ игра: в этом режиме нет формата «правда/действие».'
      : 'Подсказка: карты помогают в сложных моментах.';
    return;
  }

  ui.taskType.textContent = `Тип: ${state.currentTask.typeLabel}`;
  ui.taskDiff.textContent = `Сложность: ${state.currentTask.diffLabel}`;
  ui.taskText.textContent = state.currentTask.text;
  ui.taskHint.textContent = 'За длинную серию успешных ходов выпадают более редкие карты.';
}

function renderCards() {
  const player = currentPlayer();
  if (!player) {
    ui.playerCards.innerHTML = '<p class="hint">Нет игроков.</p>';
    return;
  }
  if (!player.cards.length) {
    ui.playerCards.innerHTML = '<p class="hint">Пока нет карт.</p>';
    return;
  }

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

function generateAiGameTask() {
  const goal = randomFrom(aiGameTemplates.goals);
  const style = randomFrom(aiGameTemplates.styles);
  const limit = randomFrom(aiGameTemplates.limits);
  return {
    typeLabel: 'ИИ миссия',
    diffLabel: 'Адаптивная',
    text: `Задание: ${goal} ${style}, ${limit}.`
  };
}

function generateTruthOrDareTask() {
  state.currentDifficulty = pickDifficulty();
  const type = Math.random() > 0.5 ? 'truth' : 'dare';
  const text = randomFrom(taskPools[state.currentDifficulty][type]);
  return {
    typeLabel: type === 'truth' ? 'Правда' : 'Действие',
    diffLabel: diffLabel(state.currentDifficulty),
    text
  };
}

function grantCard(player) {
  const rarity = Math.min(2, Math.floor(player.streak / 2));
  const available = cardsCatalog.slice(0, 2 + rarity);
  const card = randomFrom(available);
  player.cards.push({ ...card });
  logEvent(`🎁 ${player.name} получает карту «${card.title}».`);
}

function generateTask() {
  const player = currentPlayer();
  if (!player) {
    alert('Сначала добавь хотя бы одного игрока.');
    return;
  }

  state.currentTask = state.game === 'ai' ? generateAiGameTask() : generateTruthOrDareTask();
  renderTask();
  syncBadges();
  logEvent(`${player.name} получил задание: ${state.currentTask.text}`);
}

function pointsForCurrentGame() {
  if (state.game === 'ai') return 2;
  return state.currentDifficulty === 'easy' ? 1 : state.currentDifficulty === 'hard' ? 2 : 4;
}

function applyTurnResult(isSuccess) {
  const player = currentPlayer();
  if (!player || !state.currentTask) {
    alert('Сначала сгенерируй задание.');
    return;
  }

  if (isSuccess) {
    player.streak += 1;
    state.globalStreak += 1;
    let points = pointsForCurrentGame();
    if (player.doubleReward) {
      points *= 2;
      player.doubleReward = false;
    }
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

  if (card.key === 'skip') {
    state.currentTask = {
      typeLabel: 'Сервис',
      diffLabel: state.game === 'ai' ? 'Адаптивная' : diffLabel(state.currentDifficulty),
      text: 'Ход пропущен картой. Передай ход.'
    };
  }
  if (card.key === 'reroll') {
    generateTask();
    return;
  }
  if (card.key === 'double') {
    player.doubleReward = true;
  }

  renderTask();
  renderCards();
}

function addPlayer() {
  const name = ui.playerName.value.trim();
  if (!name) {
    alert('Введите имя, чтобы продолжить.');
    return;
  }

  state.players.push({ name, points: 0, streak: 0, cards: [], doubleReward: false });
  ui.playerName.value = '';
  renderPlayers();
  renderTurn();
  renderScore();
  renderCards();
  logEvent(`👤 В игру вошёл игрок ${name}.`);
}

function openGame(game) {
  if (game === 'spy') {
    alert('Режим «Шпион» скоро добавлю.');
    return;
  }
  state.game = game;
  ui.gameGate.classList.add('hidden');
  ui.gameApp.classList.remove('hidden');
  ui.difficultyBlock.classList.toggle('hidden', game === 'ai');
  syncBadges();
  renderTask();
}

ui.gameButtons.forEach((btn) => {
  btn.addEventListener('click', () => openGame(btn.dataset.game));
});
ui.addPlayerBtn.addEventListener('click', addPlayer);
ui.playerName.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') addPlayer();
});
ui.randomBtn.addEventListener('click', generateTask);
ui.doneBtn.addEventListener('click', () => applyTurnResult(true));
ui.failBtn.addEventListener('click', () => applyTurnResult(false));
ui.nextTurnBtn.addEventListener('click', nextTurn);

ui.ultraEnabled.addEventListener('change', () => {
  state.ultraEnabled = ui.ultraEnabled.checked;
  if (!state.ultraEnabled && ui.difficultySelect.value === 'ultra') {
    ui.difficultySelect.value = 'hard';
  }
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
  alert('Правила:\n1) Выбери игру.\n2) Игроки ходят по очереди.\n3) Выполнил задание — получил очки и серию.');
});

ui.clearLogBtn.addEventListener('click', () => {
  state.log = [];
  ui.gameLog.innerHTML = '';
});

ui.playerCards.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-card-index]');
  if (!button) return;
  useCard(Number(button.dataset.cardIndex));
});

renderPlayers();
renderTurn();
renderScore();
renderTask();
renderCards();
syncBadges();
