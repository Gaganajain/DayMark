<div align="center">

# ✅ DayMark

**Mark your day. Build habits, track streaks and keep a one-line mood journal, all in your browser.**

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![No build](https://img.shields.io/badge/build-none-success)
![Privacy](https://img.shields.io/badge/data-stays%20in%20your%20browser-blueviolet)

**[🚀 Live demo](https://gaganajain.github.io/DayMark/)**

</div>

---

## 📌 About

Most habit apps want an account, a subscription and your data. **DayMark** is a small, fast, private alternative: open the page, tick off your habits, pick a mood, write one line about your day. Everything is saved in your browser's local storage, and nothing is sent anywhere.

## ✨ Features

| | Feature | Details |
|---|---|---|
| ✅ | **Daily check-ins** | Tick habits off for today or any past day |
| 🔥 | **Streaks** | Current streak per habit, plus best-ever streak |
| 📊 | **Progress ring** | See how much of today is done at a glance |
| 🗓️ | **7-day strip** | Mini history next to every habit |
| 😄 | **Mood + note** | Pick a mood (😞 → 😄) and write one line; it autosaves |
| 📖 | **Journal** | Timeline of every day you logged a mood or note |
| 🟩 | **Activity heatmap** | 16-week calendar coloured by how many habits you completed |
| 📈 | **Habit stats** | 30-day completion rate and best streak per habit |
| 💾 | **Export / import** | Back up your data as JSON and restore it on another device |
| 🌙 | **Dark mode** | Follows your system setting, with a manual toggle |
| 📱 | **Responsive** | Works on phones and desktops |

## 🖼️ Preview

```
┌────────────────────────── DayMark ───── Today · Journal · Stats ──┐
│                     ‹   Today · October 29   ›                    │
│  ◔ 33%   You've got this · 1 of 3 habits done                     │
│  💧 Drink 8 glasses of water   🔥 1-day streak   ▫▫▫▫▫▫▪   ✓      │
│  📚 Read for 20 minutes        No streak yet     ▫▫▫▫▫▫▫   ○      │
│  🚶 Walk 30 minutes            No streak yet     ▫▫▫▫▫▫▫   ○      │
│  [💧] [ New habit…                                ] [Add]         │
│  How was your day?   😞  😕  😐  🙂  [😄]                          │
│  [ One line about today…                                  ]       │
└───────────────────────────────────────────────────────────────────┘
```

## 🚀 Run Locally

No install and no build step. Clone and serve the folder:

```bash
git clone https://github.com/Gaganajain/DayMark.git
cd DayMark
python -m http.server 8000
```

Then open http://localhost:8000. (You can also just double-click `index.html`.)

## 🌐 Deploy on GitHub Pages

1. Go to **Settings → Pages** in this repository.
2. Under **Build and deployment**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Save. The app will be live at `https://gaganajain.github.io/DayMark/`.

## 🧱 How It's Built

```
DayMark/
├── index.html   # Layout: Today, Journal and Stats views
├── style.css    # Design tokens, light/dark themes, responsive layout
└── app.js       # State, streak logic, rendering, import/export
```

Data is stored as one JSON object in `localStorage`:

```js
{
  habits: [{ id, name, emoji, created }],
  checks: { "2026-10-29": ["habitId", ...] },   // which habits were done each day
  days:   { "2026-10-29": { mood: 4, note: "Great run!" } }
}
```

**Streak logic:** count back day by day from today while the habit is checked. If today isn't ticked yet, counting starts from yesterday, so an unfinished day never breaks your streak early.

## 🔮 Roadmap

- Reminders with the Notifications API
- Weekly goals (e.g. "gym 3× a week") instead of only daily habits
- Installable PWA with offline support
- Optional cloud sync

## 👩‍💻 Author

**Gagana Jain A** · [GitHub](https://github.com/Gaganajain)

⭐ If DayMark helps you build a habit, give it a star!
