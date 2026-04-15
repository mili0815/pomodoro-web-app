const timerDisplay = document.getElementById("timerDisplay");
const sessionLabel = document.getElementById("sessionLabel");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const timerHint = document.getElementById("timerHint");
const focusTarget = document.getElementById("focusTarget");
const focusTargetInput = document.getElementById("focusTargetInput");
const saveFocusTargetBtn = document.getElementById("saveFocusTargetBtn");
const focusMessage = document.getElementById("focusMessage");
const timerRing = document.querySelector(".timer-ring");

const studyMinutesInput = document.getElementById("studyMinutes");
const breakMinutesInput = document.getElementById("breakMinutes");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");

const todayPomodorosEl = document.getElementById("todayPomodoros");
const totalPomodorosEl = document.getElementById("totalPomodoros");
const todayStudyTimeEl = document.getElementById("todayStudyTime");
const totalStudyTimeEl = document.getElementById("totalStudyTime");

const todoInput = document.getElementById("todoInput");
const addTodoBtn = document.getElementById("addTodoBtn");
const clearCompletedBtn = document.getElementById("clearCompletedBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const todoList = document.getElementById("todoList");

const themeToggle = document.getElementById("themeToggle");

const STORAGE_KEYS = {
  theme: "pomodoro_theme",
  todos: "pomodoro_todos",
  stats: "pomodoro_stats",
  settings: "pomodoro_settings",
  todayDate: "pomodoro_today_date",
  focusTarget: "pomodoro_focus_target"
};

const MESSAGES = {
  study: "한 번에 한 가지 작업만 처리하세요.",
  break: "잠깐 쉬면서 다음 집중을 준비하세요."
};

let timer = null;
let isRunning = false;
let isStudySession = true;

let studyMinutes = 25;
let breakMinutes = 5;

let totalSeconds = studyMinutes * 60;
let remainingSeconds = totalSeconds;

let stats = {
  todayPomodoros: 0,
  totalPomodoros: 0,
  todayStudyTime: 0,
  totalStudyTime: 0
};

let todos = [];
let customFocusTarget = "";

function formatTime(seconds) {
  const min = String(Math.floor(seconds / 60)).padStart(2, "0");
  const sec = String(seconds % 60).padStart(2, "0");
  return `${min}:${sec}`;
}

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const date = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
}

function showNotification(message) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("포모도로 알림", { body: message });
    return;
  }

  alert(message);
}

function saveStats() {
  localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(stats));
}

function loadStats() {
  const savedStats = localStorage.getItem(STORAGE_KEYS.stats);
  const savedDate = localStorage.getItem(STORAGE_KEYS.todayDate);
  const today = getTodayString();

  if (savedStats) {
    stats = JSON.parse(savedStats);
  }

  if (savedDate !== today) {
    stats.todayPomodoros = 0;
    stats.todayStudyTime = 0;
    localStorage.setItem(STORAGE_KEYS.todayDate, today);
    saveStats();
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEYS.todos, JSON.stringify(todos));
}

function loadTodos() {
  const savedTodos = localStorage.getItem(STORAGE_KEYS.todos);
  if (savedTodos) {
    todos = JSON.parse(savedTodos);
  }
}

function saveSettings() {
  localStorage.setItem(
    STORAGE_KEYS.settings,
    JSON.stringify({
      studyMinutes,
      breakMinutes
    })
  );
}

function loadSettings() {
  const savedSettings = localStorage.getItem(STORAGE_KEYS.settings);
  if (savedSettings) {
    const parsed = JSON.parse(savedSettings);
    studyMinutes = parsed.studyMinutes || 25;
    breakMinutes = parsed.breakMinutes || 5;
  }

  studyMinutesInput.value = studyMinutes;
  breakMinutesInput.value = breakMinutes;
}

function getDefaultFocusTarget() {
  return `${Math.max(4, stats.todayPomodoros + 1)}회 집중`;
}

function saveFocusTarget() {
  localStorage.setItem(STORAGE_KEYS.focusTarget, customFocusTarget);
}

function loadFocusTarget() {
  customFocusTarget = localStorage.getItem(STORAGE_KEYS.focusTarget) || "";
  focusTarget.textContent = customFocusTarget || getDefaultFocusTarget();
  focusTargetInput.value = customFocusTarget;
}

function saveTheme(theme) {
  localStorage.setItem(STORAGE_KEYS.theme, theme);
}

function loadTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
  const isDark = savedTheme === "dark";

  document.body.classList.toggle("dark", isDark);
  themeToggle.textContent = isDark ? "주간 모드" : "야간 모드";
}

function updateTimerDisplay() {
  timerDisplay.textContent = formatTime(remainingSeconds);
  document.title = `${formatTime(remainingSeconds)} | Pomodoro`;
}

function updateSessionLabel() {
  if (isStudySession) {
    sessionLabel.textContent = "공부 시간";
    sessionLabel.classList.remove("break");
    sessionLabel.classList.add("study");
    timerHint.textContent = MESSAGES.study;
    focusMessage.textContent = "지금 25분의 집중이 오늘 하루의 밀도를 바꿉니다.";
    return;
  }

  sessionLabel.textContent = "휴식 시간";
  sessionLabel.classList.remove("study");
  sessionLabel.classList.add("break");
  timerHint.textContent = MESSAGES.break;
  focusMessage.textContent = "쉬는 시간은 보상이 아니라 다음 집중을 위한 회복 구간입니다.";
}

function updateProgressBar() {
  const passed = totalSeconds - remainingSeconds;
  const percent = totalSeconds === 0 ? 0 : Math.min(100, (passed / totalSeconds) * 100);
  const roundedPercent = Math.round(percent);

  progressBar.style.width = `${percent}%`;
  progressText.textContent = `${roundedPercent}%`;
  timerRing.style.background = `radial-gradient(circle at center, var(--surface-strong) 0 56%, transparent 56%), conic-gradient(from 270deg, var(--primary) ${roundedPercent * 3.6}deg, rgba(196, 90, 56, 0.18) ${roundedPercent * 3.6}deg)`;
}

function updateStatsUI() {
  todayPomodorosEl.textContent = `${stats.todayPomodoros}회`;
  totalPomodorosEl.textContent = `${stats.totalPomodoros}회`;
  todayStudyTimeEl.textContent = `${stats.todayStudyTime}분`;
  totalStudyTimeEl.textContent = `${stats.totalStudyTime}분`;
  focusTarget.textContent = customFocusTarget || getDefaultFocusTarget();
}

function setButtonStates() {
  startBtn.disabled = isRunning;
  pauseBtn.disabled = !isRunning;
}

function createTodoItem(todo) {
  const li = document.createElement("li");
  li.className = `todo-item ${todo.completed ? "completed" : ""}`;

  const left = document.createElement("div");
  left.className = "todo-left";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = todo.completed;
  checkbox.className = "checkbox";

  const text = document.createElement("span");
  text.className = "todo-text";
  text.textContent = todo.text;

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "삭제";

  checkbox.addEventListener("change", () => {
    todo.completed = checkbox.checked;
    saveTodos();
    renderTodos();
  });

  deleteBtn.addEventListener("click", () => {
    todos = todos.filter((item) => item.id !== todo.id);
    saveTodos();
    renderTodos();
  });

  left.appendChild(checkbox);
  left.appendChild(text);
  li.appendChild(left);
  li.appendChild(deleteBtn);

  return li;
}

function renderTodos() {
  todoList.innerHTML = "";

  if (todos.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "todo-item todo-empty";
    emptyItem.textContent = "아직 할 일이 없습니다. 가장 중요한 한 가지부터 추가하세요.";
    todoList.appendChild(emptyItem);
    return;
  }

  todos.forEach((todo) => {
    todoList.appendChild(createTodoItem(todo));
  });
}

function updateAllTimerUI() {
  updateTimerDisplay();
  updateSessionLabel();
  updateProgressBar();
  setButtonStates();
}

function setSession(mode) {
  isStudySession = mode === "study";
  totalSeconds = (isStudySession ? studyMinutes : breakMinutes) * 60;
  remainingSeconds = totalSeconds;
  updateAllTimerUI();
}

function finishAnimation() {
  timerDisplay.classList.add("timer-finished");
  setTimeout(() => {
    timerDisplay.classList.remove("timer-finished");
  }, 1800);
}

function completeSession() {
  finishAnimation();

  if (isStudySession) {
    stats.todayPomodoros += 1;
    stats.totalPomodoros += 1;
    stats.todayStudyTime += studyMinutes;
    stats.totalStudyTime += studyMinutes;

    saveStats();
    updateStatsUI();
    showNotification("공부 끝! 쉬는 시간입니다.");
    setSession("break");
    return;
  }

  showNotification("쉬는 시간 끝! 다시 공부 시작합니다.");
  setSession("study");
}

function syncSettingsFromInputs() {
  studyMinutes = Math.min(180, Math.max(1, parseInt(studyMinutesInput.value, 10) || 25));
  breakMinutes = Math.min(60, Math.max(1, parseInt(breakMinutesInput.value, 10) || 5));
  studyMinutesInput.value = studyMinutes;
  breakMinutesInput.value = breakMinutes;
  saveSettings();
}

function startTimer() {
  if (isRunning) {
    return;
  }

  syncSettingsFromInputs();

  if (remainingSeconds > totalSeconds) {
    remainingSeconds = totalSeconds;
  }

  isRunning = true;
  setButtonStates();

  timer = setInterval(() => {
    if (remainingSeconds > 0) {
      remainingSeconds -= 1;
      updateAllTimerUI();
      return;
    }

    completeSession();
  }, 1000);
}

function pauseTimer() {
  clearInterval(timer);
  timer = null;
  isRunning = false;
  setButtonStates();
}

function resetTimer() {
  pauseTimer();
  syncSettingsFromInputs();
  setSession("study");
}

function addTodo() {
  const text = todoInput.value.trim();

  if (!text) {
    todoInput.focus();
    return;
  }

  todos.push({
    id: Date.now(),
    text,
    completed: false
  });

  saveTodos();
  renderTodos();

  todoInput.value = "";
  todoInput.focus();
}

function clearCompletedTodos() {
  todos = todos.filter((todo) => !todo.completed);
  saveTodos();
  renderTodos();
}

function clearAllTodos() {
  if (!confirm("할 일 전체를 삭제할까요?")) {
    return;
  }

  todos = [];
  saveTodos();
  renderTodos();
}

function applyFocusTarget() {
  customFocusTarget = focusTargetInput.value.trim();
  saveFocusTarget();
  updateStatsUI();
}

function toggleTheme() {
  const isDark = document.body.classList.toggle("dark");
  themeToggle.textContent = isDark ? "주간 모드" : "야간 모드";
  saveTheme(isDark ? "dark" : "light");
  updateProgressBar();
}

startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);

addTodoBtn.addEventListener("click", addTodo);

todoInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    addTodo();
  }
});

clearCompletedBtn.addEventListener("click", clearCompletedTodos);
clearAllBtn.addEventListener("click", clearAllTodos);
themeToggle.addEventListener("click", toggleTheme);
saveFocusTargetBtn.addEventListener("click", applyFocusTarget);

focusTargetInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    applyFocusTarget();
  }
});

studyMinutesInput.addEventListener("change", () => {
  syncSettingsFromInputs();

  if (!isRunning && isStudySession) {
    totalSeconds = studyMinutes * 60;
    remainingSeconds = totalSeconds;
    updateAllTimerUI();
  }
});

breakMinutesInput.addEventListener("change", () => {
  syncSettingsFromInputs();

  if (!isRunning && !isStudySession) {
    totalSeconds = breakMinutes * 60;
    remainingSeconds = totalSeconds;
    updateAllTimerUI();
  }
});

function init() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }

  loadTheme();
  loadSettings();
  loadStats();
  loadTodos();
  loadFocusTarget();

  totalSeconds = studyMinutes * 60;
  remainingSeconds = totalSeconds;

  updateAllTimerUI();
  updateStatsUI();
  renderTodos();

  localStorage.setItem(STORAGE_KEYS.todayDate, getTodayString());
}

init();
