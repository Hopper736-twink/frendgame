import { taskPools, cardsCatalog } from './tasks.js';

const state = {
  players: [],
  currentIndex: 0,
  currentTask: null,
  currentDifficulty: 'easy',
  ultraEnabled: false,
  mode: 'classic',
  specialAccess: false,
  globalStreak: 0,
  log: []
};

const $ = (id) => document.getElementById(id);

const ui = {
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
  modeSelect: $('modeSelect'),
  helpBtn: $('helpBtn'),
  clearLogBtn: $('clearLogBtn'),
  specialStatus: $('specialStatus'),
  scoreBoard: $('scoreBoard'),
  gameLog: $('gameLog'),
  targetPlayer: $('targetPlayer'),
  rewriteBtn: $('rewriteBtn'),
  rewriteText: $('rewriteText')
};

function currentPlayer() {
  return state.players[state.currentIndex];
}

function diffLabel(value) {
  return value === 'easy' ? 'Лёгкий' : value === 'hard' ? 'Сложный' : 'Офигевший';
}

function logEvent(message) {
  state.log.unshift(message);
  state.log = state.log.slice(0, 20);
  ui.gameLog.innerHTML = state.log.map((item) => `<li>${item}</li>`).join('');
}

function syncBadges() {
  ui.modeBadge.textContent = `🎲 Режим: ${state.mode === 'ai' ? 'ИИ' : 'Классика'}`;
  ui.difficultyBadge.textContent = `⚡ Сложность: ${diffLabel(state.currentDifficulty)}`;
  ui.streakBadge.textContent = `🔥 Серия: ${state.globalStreak}`;
}

function renderPlayers() {
  ui.playersList.innerHTML = state.players
    .map((player, index) => `<li>${index === state.currentIndex ? '👉 ' : ''}${player.name} — ${player.points} pts, серия: ${player.streak}</li>`)
    .join('');

  ui.targetPlayer.innerHTML = state.players
    .map((player, index) => `<option value="${index}">${player.name}</option>`)
    .join('');
}

function renderTurn() {
  const player = currentPlayer();
  ui.turnStatus.textContent = player
    ? `Сейчас ходит: ${player.name}.`
    : 'Добавь игроков, чтобы начать игру.';
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
  ui.taskHint.textContent = state.specialAccess
    ? 'Особый статус активен: ты можешь переписать задание другому игроку.'
    : 'За длинную серию успешных ходов выпадают более редкие карты.';
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

  ui.playerCards.innerHTML = player.cards
    .map((card, index) => `
      <div class="card">
        <strong>${card.title}</strong>
        <p class="hint">${card.description}</p>
        <button class="secondary" data-card-index="${index}">Использовать</button>
      </div>
    `)
    .join('');
}

function pickDifficulty() {
  const selected = ui.difficultySelect.value;
  if (selected === 'ultra' && !state.ultraEnabled) return 'hard';
  return selected;
}

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
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
  if (!player) {
    alert('Сначала добавь хотя бы одного игрока.');
    return;
  }

  state.currentDifficulty = pickDifficulty();

  if (state.mode === 'ai') {
    state.currentTask = generateAiTask();
  } else {
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
  if (!player || !state.currentTask) {
    alert('Сначала сгенерируй задание.');
    return;
  }

  if (isSuccess) {
    player.streak += 1;
    state.globalStreak += 1;

    let points = state.currentDifficulty === 'easy' ? 1 : state.currentDifficulty === 'hard' ? 2 : 4;
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
    state.currentTask = { type: 'dare', diff: state.currentDifficulty, text: 'Ход пропущен картой. Передай ход.' };
  }

  if (card.key === 'reroll') {
    generateTask();
    return;
  }

  if (card.key === 'custom') {
    const customText = prompt('Введи своё задание:');
    if (customText?.trim()) {
      state.currentTask = { type: 'dare', diff: state.currentDifficulty, text: customText.trim() };
    }
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
  logEvent(`Уровень «Офигевший» ${state.ultraEnabled ? 'включён' : 'выключен'}.`);
});

ui.difficultySelect.addEventListener('change', () => {
  if (ui.difficultySelect.value === 'ultra' && !state.ultraEnabled) {
    alert('Сначала включи «Офигевший» в настройках.');
    ui.difficultySelect.value = 'hard';
  }
  state.currentDifficulty = pickDifficulty();
  syncBadges();
});

ui.modeSelect.addEventListener('change', () => {
  state.mode = ui.modeSelect.value;
  syncBadges();
  logEvent(`Режим переключен: ${state.mode === 'ai' ? 'ИИ' : 'Классика'}.`);
});

ui.helpBtn.addEventListener('click', () => {
  const code = prompt('Если есть код доступа — введи его.');
  if (code === 'hop') {
    state.specialAccess = true;
    ui.specialStatus.textContent = 'Особый статус: активен';
    renderTask();
    logEvent('✨ Активирован особый статус.');
  } else if (code) {
    alert('Неверный код.');
  }
});

ui.rewriteBtn.addEventListener('click', () => {
  if (!state.specialAccess) {
    alert('Нужен особый статус.');
    return;
  }

  const text = ui.rewriteText.value.trim();
  if (!text) {
    alert('Введите текст задания.');
    return;
  }

  const target = state.players[Number(ui.targetPlayer.value)];
  if (!target) return;

  state.currentTask = {
    type: 'dare',
    diff: state.currentDifficulty,
    text: `Для ${target.name}: ${text}`
  };

  ui.rewriteText.value = '';
  renderTask();
  logEvent(`🛠 Переписано задание для ${target.name}.`);
});

ui.clearLogBtn.addEventListener('click', () => {
  state.log = [];
  ui.gameLog.innerHTML = '';
});

ui.playerCards.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-card-index]');
  if (!button) return;
  const index = Number(button.dataset.cardIndex);
  useCard(index);
});

renderPlayers();
renderTurn();
renderScore();
renderTask();
renderCards();
syncBadges();
