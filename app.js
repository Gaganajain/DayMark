// DayMark: daily habit tracker and mood journal. All data lives in localStorage.

const STORAGE_KEY = "daymark:v1";
const THEME_KEY = "daymark:theme";
const MOODS = { 1: "😞", 2: "😕", 3: "😐", 4: "🙂", 5: "😄" };

const $ = (sel) => document.querySelector(sel);

// ---------- dates ----------
const toKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const fromKey = (k) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (k, n) => {
  const d = fromKey(k);
  d.setDate(d.getDate() + n);
  return toKey(d);
};
const todayKey = () => toKey(new Date());

// ---------- state ----------
function defaultState() {
  return {
    habits: [
      { id: uid(), name: "Drink 8 glasses of water", emoji: "💧", created: todayKey() },
      { id: uid(), name: "Read for 20 minutes", emoji: "📚", created: todayKey() },
      { id: uid(), name: "Walk 30 minutes", emoji: "🚶", created: todayKey() },
    ],
    checks: {},
    days: {},
  };
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    /* storage unavailable or corrupted: start fresh */
  }
  return defaultState();
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    toast("Could not save: browser storage is unavailable");
  }
}

let state = load();
let currentDay = todayKey();

// ---------- habit helpers ----------
const isDone = (habitId, day) => (state.checks[day] || []).includes(habitId);

function toggle(habitId, day) {
  const list = new Set(state.checks[day] || []);
  list.has(habitId) ? list.delete(habitId) : list.add(habitId);
  state.checks[day] = [...list];
  if (!state.checks[day].length) delete state.checks[day];
  save();
}

function streak(habitId) {
  // Count back from today; if today isn't done yet, the streak can still continue from yesterday
  let day = todayKey();
  if (!isDone(habitId, day)) day = addDays(day, -1);
  let count = 0;
  while (isDone(habitId, day)) {
    count++;
    day = addDays(day, -1);
  }
  return count;
}

function bestStreak(habitId) {
  const days = Object.keys(state.checks).filter((d) => isDone(habitId, d)).sort();
  let best = 0, run = 0, prev = null;
  for (const d of days) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

function completionRate(habitId, lastDays = 30) {
  const habit = state.habits.find((h) => h.id === habitId);
  let total = 0, done = 0;
  for (let i = 0; i < lastDays; i++) {
    const d = addDays(todayKey(), -i);
    if (habit && d < habit.created) break;
    total++;
    if (isDone(habitId, d)) done++;
  }
  return total ? Math.round((done / total) * 100) : 0;
}

// ---------- rendering: today ----------
function renderToday() {
  const isToday = currentDay === todayKey();
  const date = fromKey(currentDay);
  $("#dayLabel").textContent = isToday ? "Today" : currentDay === addDays(todayKey(), -1) ? "Yesterday" : date.toLocaleDateString(undefined, { weekday: "long" });
  $("#dateLabel").textContent = date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  $("#nextDay").disabled = isToday;

  const list = $("#habitList");
  list.innerHTML = "";
  for (const h of state.habits) {
    const done = isDone(h.id, currentDay);
    const li = document.createElement("li");
    li.className = "habit" + (done ? " done" : "");

    const week = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(currentDay, i - 6);
      return `<i class="${isDone(h.id, d) ? "on" : ""}" title="${d}"></i>`;
    }).join("");

    const s = streak(h.id);
    li.innerHTML = `
      <span class="emoji">${escapeHtml(h.emoji)}</span>
      <div class="info">
        <div class="name">${escapeHtml(h.name)}</div>
        <div class="streak">${s ? `🔥 ${s}-day streak` : "No streak yet"}</div>
      </div>
      <div class="week" aria-hidden="true">${week}</div>
      <button class="check" aria-label="Mark ${escapeHtml(h.name)} as ${done ? "not done" : "done"}">${done ? "✓" : ""}</button>
      <button class="delete" aria-label="Delete ${escapeHtml(h.name)}" title="Delete habit">✕</button>`;

    li.querySelector(".check").addEventListener("click", () => {
      toggle(h.id, currentDay);
      renderToday();
      if (state.habits.every((x) => isDone(x.id, currentDay))) toast("🎉 All habits done. Great day!");
    });
    li.querySelector(".delete").addEventListener("click", () => {
      if (!confirm(`Delete "${h.name}" and its history?`)) return;
      state.habits = state.habits.filter((x) => x.id !== h.id);
      for (const d of Object.keys(state.checks)) {
        state.checks[d] = state.checks[d].filter((id) => id !== h.id);
        if (!state.checks[d].length) delete state.checks[d];
      }
      save();
      renderToday();
    });
    list.appendChild(li);
  }

  const total = state.habits.length;
  const done = state.habits.filter((h) => isDone(h.id, currentDay)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  $("#ring").style.setProperty("--p", pct);
  $("#ringText").textContent = `${pct}%`;
  $("#progressTitle").textContent = !total ? "Let's get started" : pct === 100 ? "Perfect day! 🎉" : pct >= 50 ? "Nice, keep going" : "You've got this";
  $("#progressSub").textContent = total ? `${done} of ${total} habits done` : "Add a habit below to begin.";

  const entry = state.days[currentDay] || {};
  document.querySelectorAll("#moods button").forEach((b) => b.classList.toggle("active", Number(b.dataset.mood) === entry.mood));
  $("#note").value = entry.note || "";
}

// ---------- rendering: journal ----------
function renderJournal() {
  const days = Object.keys(state.days).filter((d) => state.days[d].mood || state.days[d].note).sort().reverse();
  const list = $("#journalList");
  if (!days.length) {
    list.innerHTML = `<div class="card empty">📝 No entries yet. Pick a mood or write a note on the Today tab.</div>`;
    return;
  }
  list.innerHTML = days.map((d) => {
    const e = state.days[d];
    const done = (state.checks[d] || []).length;
    return `<div class="card entry">
      <div class="mood">${MOODS[e.mood] || "📝"}</div>
      <div>
        <div class="date">${fromKey(d).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</div>
        <div class="muted small">${done} habit${done === 1 ? "" : "s"} completed</div>
        ${e.note ? `<p>${escapeHtml(e.note)}</p>` : ""}
      </div>
    </div>`;
  }).join("");
}

// ---------- rendering: stats ----------
function renderStats() {
  const allDays = Object.keys(state.checks);
  const totalChecks = allDays.reduce((n, d) => n + state.checks[d].length, 0);
  const moods = Object.values(state.days).map((d) => d.mood).filter(Boolean);
  const avgMood = moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : 0;
  const best = Math.max(0, ...state.habits.map((h) => bestStreak(h.id)));

  $("#statGrid").innerHTML = [
    ["✅", totalChecks, "habits completed"],
    ["📅", allDays.length, "active days"],
    ["🔥", best, "best streak"],
    [avgMood ? MOODS[Math.round(avgMood)] : "–", avgMood ? avgMood.toFixed(1) : "–", "average mood"],
  ].map(([icon, value, label]) => `<div class="card stat"><span>${icon}</span><b>${value}</b><span class="muted small">${label}</span></div>`).join("");

  // Heatmap: 16 weeks, columns are weeks starting on Sunday
  const end = fromKey(todayKey());
  const start = new Date(end);
  start.setDate(start.getDate() - (16 * 7 - 1) - end.getDay());
  const habitsCount = Math.max(state.habits.length, 1);
  const cells = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const k = toKey(d);
    const n = (state.checks[k] || []).length;
    const level = n === 0 ? 0 : Math.min(4, Math.ceil((n / habitsCount) * 4));
    cells.push(`<i class="l${level}" title="${k}: ${n} done"></i>`);
  }
  $("#heatmap").innerHTML = cells.join("");

  $("#habitStats").innerHTML = state.habits.length
    ? state.habits.map((h) => {
        const rate = completionRate(h.id);
        return `<div class="habit-stat">
          <div class="row"><span>${escapeHtml(h.emoji)} ${escapeHtml(h.name)}</span><span class="muted">${rate}% · best ${bestStreak(h.id)}d</span></div>
          <div class="bar"><span style="width:${rate}%"></span></div>
        </div>`;
      }).join("")
    : `<p class="muted">No habits yet.</p>`;
}

// ---------- utilities ----------
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

function setDayEntry(patch) {
  const entry = { ...(state.days[currentDay] || {}), ...patch };
  if (!entry.mood && !entry.note) delete state.days[currentDay];
  else state.days[currentDay] = entry;
  save();
}

function showView(name) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.view === name));
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === `view-${name}`));
  ({ today: renderToday, journal: renderJournal, stats: renderStats })[name]();
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  $("#themeToggle").textContent = theme === "dark" ? "☀️" : "🌙";
}

// ---------- events ----------
document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => showView(t.dataset.view)));

$("#prevDay").addEventListener("click", () => { currentDay = addDays(currentDay, -1); renderToday(); });
$("#nextDay").addEventListener("click", () => {
  if (currentDay < todayKey()) currentDay = addDays(currentDay, 1);
  renderToday();
});

$("#habitForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("#habitName").value.trim();
  if (!name) return;
  state.habits.push({ id: uid(), name, emoji: $("#habitEmoji").value.trim() || "⭐", created: currentDay });
  save();
  $("#habitName").value = "";
  renderToday();
  toast(`Added "${name}"`);
});

document.querySelectorAll("#moods button").forEach((b) => b.addEventListener("click", () => {
  const mood = Number(b.dataset.mood);
  setDayEntry({ mood: state.days[currentDay]?.mood === mood ? undefined : mood });
  renderToday();
}));

let noteTimer;
$("#note").addEventListener("input", (e) => {
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => {
    setDayEntry({ note: e.target.value.trim() || undefined });
    const hint = $("#savedHint");
    hint.classList.add("show");
    setTimeout(() => hint.classList.remove("show"), 1200);
  }, 400);
});

$("#exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `daymark-backup-${todayKey()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

$("#importFile").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.habits) || typeof data.checks !== "object") throw new Error("bad file");
    state = { habits: data.habits, checks: data.checks || {}, days: data.days || {} };
    save();
    renderStats();
    toast("Backup imported");
  } catch {
    toast("That file isn't a DayMark backup");
  }
  e.target.value = "";
});

$("#resetBtn").addEventListener("click", () => {
  if (!confirm("Delete all habits, check-ins and journal entries?")) return;
  state = { habits: [], checks: {}, days: {} };
  save();
  renderStats();
  toast("All data cleared");
});

$("#themeToggle").addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
});

// ---------- init ----------
let savedTheme = null;
try { savedTheme = localStorage.getItem(THEME_KEY); } catch { /* ignore */ }
applyTheme(savedTheme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
renderToday();
