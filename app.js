// 전기기사 실기 문제은행 앱
(function () {
  "use strict";

  var PROGRESS_KEY = "electric-quiz-progress";
  var THEME_KEY = "electric-quiz-theme";
  var TYPES = ["전체", "단답", "서술", "계산"];

  var homeView = document.getElementById("homeView");
  var detailView = document.getElementById("detailView");
  var sessionList = document.getElementById("sessionList");
  var questionList = document.getElementById("questionList");
  var pageTitle = document.getElementById("pageTitle");
  var backBtn = document.getElementById("backBtn");
  var themeBtn = document.getElementById("themeBtn");
  var filterRow = document.getElementById("filterRow");
  var scoreText = document.getElementById("scoreText");
  var scorePct = document.getElementById("scorePct");
  var scoreBar = document.getElementById("scoreBar");
  var resetBtn = document.getElementById("resetBtn");
  var tabRow = document.getElementById("tabRow");
  var homeSubtitle = document.getElementById("homeSubtitle");

  var currentSession = null;
  var currentFilter = "전체";
  var currentTab = "mock"; // "mock" | "past" — 메모리만, 새로고침 시 모의회차로 복귀

  // ---------- 상태 ----------
  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
    } catch (e) {
      return {};
    }
  }
  function saveProgress(p) {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
    } catch (e) { /* 저장 실패 무시 */ }
  }
  var progress = loadProgress();

  function sessionStats(session) {
    var marks = progress[session.id] || {};
    var graded = 0, correct = 0;
    session.questions.forEach(function (q) {
      var m = marks[q.n];
      if (m === "correct" || m === "wrong") {
        graded++;
        if (m === "correct") correct++;
      }
    });
    return { graded: graded, correct: correct, total: session.questions.length };
  }

  // ---------- 테마 ----------
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    themeBtn.textContent = theme === "dark" ? "☀️" : "🌙";
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }
  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (saved === "dark" || saved === "light") { applyTheme(saved); return; }
    var dark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(dark ? "dark" : "light");
  }
  themeBtn.addEventListener("click", function () {
    var cur = document.documentElement.getAttribute("data-theme");
    applyTheme(cur === "dark" ? "light" : "dark");
  });

  // ---------- 홈 ----------
  function sortedSessions() {
    return QUIZ_SESSIONS.slice().sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return b.hour - a.hour;
    });
  }

  // ---------- 탭 ----------
  function sortedPastExams() {
    var list = (typeof PAST_EXAMS !== "undefined" && PAST_EXAMS) ? PAST_EXAMS : [];
    return list.slice().sort(function (a, b) {
      if (a.year !== b.year) return b.year - a.year;
      return b.round - a.round;
    });
  }

  function renderTabs() {
    var btns = tabRow.querySelectorAll(".tab-btn");
    btns.forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === currentTab);
      btn.onclick = function () {
        if (currentTab === btn.getAttribute("data-tab")) return;
        currentTab = btn.getAttribute("data-tab");
        renderHome();
        window.scrollTo(0, 0);
      };
    });
  }

  function appendSessionCard(s) {
    var st = sessionStats(s);
    var card = document.createElement("div");
    card.className = "session-card";
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");

    var title = document.createElement("div");
    title.className = "session-title";
    title.textContent = s.title;
    card.appendChild(title);

    var meta = document.createElement("div");
    meta.className = "session-meta";
    var typeCounts = {};
    s.questions.forEach(function (q) { typeCounts[q.type] = (typeCounts[q.type] || 0) + 1; });
    var metaParts = [s.questions.length + "문제"];
    ["단답", "서술", "계산"].forEach(function (t) {
      if (typeCounts[t]) metaParts.push(t + " " + typeCounts[t]);
    });
    meta.textContent = metaParts.join(" · ");
    card.appendChild(meta);

    var bar = document.createElement("div");
    bar.className = "progress-bar";
    var fill = document.createElement("div");
    fill.className = "progress-fill";
    fill.style.width = Math.round(st.graded / st.total * 100) + "%";
    bar.appendChild(fill);
    card.appendChild(bar);

    var note = document.createElement("div");
    note.className = "session-progress";
    note.textContent = st.graded === 0
      ? "아직 풀지 않음"
      : "채점 " + st.graded + "/" + st.total + " · 맞음 " + st.correct + "문제";
    card.appendChild(note);

    card.addEventListener("click", function () { openSession(s.id); });
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openSession(s.id); }
    });
    sessionList.appendChild(card);
  }

  function renderEmptyNote(text) {
    var p = document.createElement("p");
    p.className = "empty-note";
    p.textContent = text;
    sessionList.appendChild(p);
  }

  function renderMockList() {
    var sessions = sortedSessions();
    if (!sessions.length) { renderEmptyNote("아직 등록된 회차가 없습니다."); return; }
    sessions.forEach(appendSessionCard);
  }

  function renderPastList() {
    var exams = sortedPastExams();
    if (!exams.length) { renderEmptyNote("아직 등록된 기출문제가 없습니다."); return; }
    exams.forEach(appendSessionCard);
  }

  function renderHome() {
    pageTitle.textContent = "⚡ 전기기사 실기 문제은행";
    backBtn.hidden = true;
    homeView.hidden = false;
    detailView.hidden = true;
    currentSession = null;
    sessionList.innerHTML = "";
    renderTabs();
    if (currentTab === "past") {
      homeSubtitle.textContent = "2018~2026년 기출 단답 모음 · 회차별로 풀어보세요";
      renderPastList();
    } else {
      homeSubtitle.textContent = "2시간마다 출제되는 실기 문제 20문항씩 · 자가채점으로 복습하세요";
      renderMockList();
    }
  }

  // ---------- 회차 상세 ----------
  function openSession(id) {
    var s = QUIZ_SESSIONS.filter(function (x) { return x.id === id; })[0];
    if (!s && typeof PAST_EXAMS !== "undefined" && PAST_EXAMS) {
      s = PAST_EXAMS.filter(function (x) { return x.id === id; })[0];
    }
    if (!s) return;
    currentSession = s;
    currentFilter = "전체";
    pageTitle.textContent = "⚡ " + s.title;
    backBtn.hidden = false;
    homeView.hidden = true;
    detailView.hidden = false;
    renderFilters();
    renderQuestions();
    renderScore();
    window.scrollTo(0, 0);
  }

  function renderFilters() {
    var chips = filterRow.querySelectorAll(".filter-chip");
    chips.forEach(function (chip) {
      chip.classList.toggle("active", chip.getAttribute("data-type") === currentFilter);
      chip.onclick = function () {
        currentFilter = chip.getAttribute("data-type");
        renderFilters();
        renderQuestions();
      };
    });
  }

  function renderScore() {
    if (!currentSession) return;
    var st = sessionStats(currentSession);
    scoreText.textContent = "맞음 " + st.correct + " / " + st.total;
    scorePct.textContent = st.graded === 0
      ? "미채점"
      : "채점 " + st.graded + "/" + st.total + " · 정답률 " + Math.round(st.correct / st.total * 100) + "%";
    scoreBar.style.width = Math.round(st.correct / st.total * 100) + "%";
  }

  function renderQuestions() {
    questionList.innerHTML = "";
    var marks = progress[currentSession.id] || {};
    var shown = currentSession.questions.filter(function (q) {
      return currentFilter === "전체" || q.type === currentFilter;
    });
    if (!shown.length) {
      var p = document.createElement("p");
      p.className = "empty-note";
      p.textContent = "해당 유형의 문제가 없습니다.";
      questionList.appendChild(p);
      return;
    }
    shown.forEach(function (q) {
      var card = document.createElement("div");
      card.className = "q-card";

      var head = document.createElement("div");
      head.className = "q-head";
      var num = document.createElement("span");
      num.className = "q-num";
      num.textContent = q.n + "번";
      head.appendChild(num);
      var type = document.createElement("span");
      type.className = "q-type " + q.type;
      type.textContent = q.type;
      head.appendChild(type);
      card.appendChild(head);

      var text = document.createElement("p");
      text.className = "q-text";
      text.textContent = q.q;
      card.appendChild(text);

      var actions = document.createElement("div");
      actions.className = "q-actions";

      var ansBtn = document.createElement("button");
      ansBtn.className = "btn answer-btn";
      ansBtn.textContent = "답 보기";
      actions.appendChild(ansBtn);

      var okBtn = document.createElement("button");
      okBtn.className = "btn correct";
      okBtn.textContent = "맞았어요";
      actions.appendChild(okBtn);

      var noBtn = document.createElement("button");
      noBtn.className = "btn wrong";
      noBtn.textContent = "틀렸어요";
      actions.appendChild(noBtn);

      card.appendChild(actions);

      var ans = document.createElement("div");
      ans.className = "q-answer";
      var ansLabel = document.createElement("strong");
      ansLabel.textContent = "📝 모범답안  ";
      ans.appendChild(ansLabel);
      var ansBody = document.createElement("span");
      ansBody.textContent = q.a;
      ans.appendChild(ansBody);
      card.appendChild(ans);

      ansBtn.addEventListener("click", function () {
        var show = ans.classList.toggle("show");
        ansBtn.textContent = show ? "답 숨기기" : "답 보기";
      });

      function mark(kind) {
        if (!progress[currentSession.id]) progress[currentSession.id] = {};
        progress[currentSession.id][q.n] = kind;
        saveProgress(progress);
        okBtn.classList.toggle("selected-correct", kind === "correct");
        noBtn.classList.toggle("selected-wrong", kind === "wrong");
        renderScore();
      }
      okBtn.addEventListener("click", function () { mark("correct"); });
      noBtn.addEventListener("click", function () { mark("wrong"); });

      var existing = marks[q.n];
      if (existing === "correct") okBtn.classList.add("selected-correct");
      if (existing === "wrong") noBtn.classList.add("selected-wrong");

      questionList.appendChild(card);
    });
  }

  backBtn.addEventListener("click", renderHome);

  resetBtn.addEventListener("click", function () {
    if (!currentSession) return;
    if (!confirm("'" + currentSession.title + "'의 채점 기록을 모두 지울까요?")) return;
    delete progress[currentSession.id];
    saveProgress(progress);
    renderQuestions();
    renderScore();
  });

  // ---------- 시작 ----------
  initTheme();
  renderHome();
})();
