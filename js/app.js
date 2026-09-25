(function () {
  "use strict";

  var RANKING_KEY = "typingRankings_v1";
  var MODE_LABELS = {
    position: "자리연습",
    word: "낱말연습",
    shortText: "짧은글연습",
    longText: "긴글연습",
    study: "자격증 학습"
  };

  var $ = function (id) { return document.getElementById(id); };

  var el = {};
  var session = null; // { mode, items:[{prompt,target}], index, totalKeystrokes, totalTargetChars, totalCorrectChars, startTime, timerHandle, stageIndex }

  window.App = { showHome: showHome, showStudySelect: showStudySelect };

  // ---------- 화면 전환 ----------
  function showScreen(id) {
    document.querySelectorAll(".screen").forEach(function (s) { s.classList.add("hidden"); });
    $(id).classList.remove("hidden");
  }

  function showHome() { stopSessionTimer(); showScreen("screen-home"); }

  // ---------- 초기화 ----------
  function init() {
    cacheEls();
    VirtualKeyboard.render(el.keyboard);
    bindHome();
    bindStageSelect();
    bindStudySelect();
    bindStudyManage();
    bindPractice();
    bindResult();
    bindRanking();
    showHome();
  }

  function cacheEls() {
    el.keyboard = $("keyboard");
    el.stageList = $("stage-list");
    el.studyCategory = $("study-category");
    el.studyType = $("study-type");
    el.studyItemCount = $("study-item-count");
    el.manageCategory = $("manage-category");
    el.manageType = $("manage-type");
    el.manageFieldsQA = $("manage-fields-qa");
    el.manageFieldsTheory = $("manage-fields-theory");
    el.manageQ = $("manage-q");
    el.manageA = $("manage-a");
    el.manageTitle = $("manage-title");
    el.manageContent = $("manage-content");
    el.manageItemList = $("manage-item-list");
    el.promptBox = $("prompt-box");
    el.targetDisplay = $("target-display");
    el.typingInput = $("typing-input");
    el.statProgress = $("stat-progress");
    el.statTime = $("stat-time");
    el.statCpm = $("stat-cpm");
    el.statAcc = $("stat-acc");
    el.resultCpm = $("result-cpm");
    el.resultAcc = $("result-acc");
    el.resultTime = $("result-time");
    el.resultNickname = $("result-nickname");
    el.rankingTabs = $("ranking-tabs");
    el.rankingList = $("ranking-list");
  }

  // ---------- 홈 ----------
  function bindHome() {
    document.querySelectorAll(".mode-card").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var mode = btn.getAttribute("data-mode");
        if (mode === "position") { renderStageList(); showScreen("screen-stage-select"); }
        else if (mode === "study") { showStudySelect(); }
        else if (mode === "ranking") { showRankingScreen(); }
        else { startSession(mode); }
      });
    });
  }

  // ---------- 자리연습 단계 선택 ----------
  function bindStageSelect() {}

  function renderStageList() {
    el.stageList.innerHTML = "";
    PRACTICE_DATA.position.stages.forEach(function (stage, idx) {
      var item = document.createElement("div");
      item.className = "list-item";
      item.innerHTML =
        "<div class='titles'><strong>" + stage.title + "</strong><small>" + stage.lines.length + "개 문장</small></div>" +
        "<button class='primary-btn'>시작</button>";
      item.querySelector("button").addEventListener("click", function () {
        startSession("position", { stageIndex: idx });
      });
      el.stageList.appendChild(item);
    });
  }

  // ---------- 자격증 학습 선택 ----------
  function showStudySelect() {
    fillSelect(el.studyCategory, StudySets.CATEGORIES);
    fillSelect(el.studyType, StudySets.TYPES);
    updateStudyItemCount();
    showScreen("screen-study-select");
  }

  function fillSelect(selectEl, options) {
    var prevValue = selectEl.value;
    selectEl.innerHTML = "";
    options.forEach(function (opt) {
      var o = document.createElement("option");
      o.value = opt.id; o.textContent = opt.label;
      selectEl.appendChild(o);
    });
    if (prevValue) selectEl.value = prevValue;
  }

  function updateStudyItemCount() {
    var cat = el.studyCategory.value, type = el.studyType.value;
    var items = StudySets.getItems(cat).filter(function (it) { return it.type === type; });
    el.studyItemCount.textContent = items.length + "개의 자료가 등록되어 있습니다.";
  }

  function bindStudySelect() {
    el.studyCategory.addEventListener("change", updateStudyItemCount);
    el.studyType.addEventListener("change", updateStudyItemCount);
    $("btn-study-start").addEventListener("click", function () {
      var cat = el.studyCategory.value, type = el.studyType.value;
      var items = StudySets.getItems(cat).filter(function (it) { return it.type === type; });
      if (!items.length) { alert("등록된 학습자료가 없습니다. 먼저 자료를 추가해 주세요."); return; }
      startSession("study", { items: items });
    });
    $("btn-study-manage").addEventListener("click", showStudyManage);
  }

  // ---------- 학습자료 관리 ----------
  function showStudyManage() {
    fillSelect(el.manageCategory, StudySets.CATEGORIES);
    fillSelect(el.manageType, StudySets.TYPES);
    el.manageCategory.value = el.studyCategory.value;
    el.manageType.value = el.studyType.value;
    toggleManageFields();
    renderManageList();
    showScreen("screen-study-manage");
  }
  function toggleManageFields() {
    var isTheory = el.manageType.value === "theory";
    el.manageFieldsQA.classList.toggle("hidden", isTheory);
    el.manageFieldsTheory.classList.toggle("hidden", !isTheory);
  }

  function renderManageList() {
    var cat = el.manageCategory.value, type = el.manageType.value;
    var items = StudySets.getItems(cat).filter(function (it) { return it.type === type; });
    el.manageItemList.innerHTML = "";
    if (!items.length) {
      el.manageItemList.innerHTML = "<p class='muted'>등록된 자료가 없습니다.</p>";
      return;
    }
    items.forEach(function (it) {
      var card = document.createElement("div");
      card.className = "item-card";
      var qText = type === "theory" ? it.title : it.q;
      var aText = type === "theory" ? it.content : it.a;
      card.innerHTML =
        "<div class='content'><div class='q'>" + escapeHtml(qText || "") + "</div><div class='a'>" + escapeHtml(aText || "") + "</div></div>" +
        "<button>삭제</button>";
      card.querySelector("button").addEventListener("click", function () {
        if (confirm("이 자료를 삭제할까요?")) {
          StudySets.deleteItem(cat, it.id);
          renderManageList();
        }
      });
      el.manageItemList.appendChild(card);
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c];
    });
  }

  function bindStudyManage() {
    el.manageCategory.addEventListener("change", renderManageList);
    el.manageType.addEventListener("change", function () { toggleManageFields(); renderManageList(); });
    $("btn-manage-add").addEventListener("click", function () {
      var cat = el.manageCategory.value, type = el.manageType.value;
      var item = { type: type };
      if (type === "theory") {
        item.title = el.manageTitle.value.trim();
        item.content = el.manageContent.value.trim();
        if (!item.title || !item.content) { alert("제목과 내용을 모두 입력해 주세요."); return; }
        el.manageTitle.value = ""; el.manageContent.value = "";
      } else {
        item.q = el.manageQ.value.trim();
        item.a = el.manageA.value.trim();
        if (!item.q || !item.a) { alert("문제와 정답을 모두 입력해 주세요."); return; }
        el.manageQ.value = ""; el.manageA.value = "";
      }
      StudySets.addItem(cat, item);
      renderManageList();
    });
  }

  // ---------- 세션 엔진 ----------
  function buildItems(mode, opts) {
    if (mode === "position") {
      var stage = PRACTICE_DATA.position.stages[opts.stageIndex];
      return stage.lines.map(function (line) { return { target: line }; });
    }
    if (mode === "word") return sample(PRACTICE_DATA.word.items, 10).map(function (w) { return { target: w }; });
    if (mode === "shortText") return sample(PRACTICE_DATA.shortText.items, 8).map(function (s) { return { target: s }; });
    if (mode === "longText") return sample(PRACTICE_DATA.longText.items, 1).map(function (t) { return { target: t }; });
    if (mode === "study") {
      return opts.items.map(function (it) {
        return { target: StudySets.getPracticeText(it), prompt: StudySets.getPrompt(it) };
      });
    }
    return [];
  }

  function sample(arr, n) {
    var copy = arr.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp;
    }
    return copy.slice(0, Math.min(n, copy.length));
  }

  function startSession(mode, opts) {
    opts = opts || {};
    var items = buildItems(mode, opts);
    if (!items.length) { alert("연습할 내용이 없습니다."); return; }
    session = {
      mode: mode,
      opts: opts,
      items: items,
      index: 0,
      totalKeystrokes: 0,
      totalTargetChars: 0,
      totalCorrectChars: 0,
      startTime: Date.now(),
      timerHandle: null
    };
    showScreen("screen-practice");
    startSessionTimer();
    loadItem();
  }

  function startSessionTimer() {
    stopSessionTimer();
    session.timerHandle = setInterval(function () {
      el.statTime.textContent = formatTime((Date.now() - session.startTime) / 1000);
    }, 250);
  }
  function stopSessionTimer() {
    if (session && session.timerHandle) clearInterval(session.timerHandle);
  }

  function formatTime(sec) {
    sec = Math.max(0, Math.floor(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
  }

  function loadItem() {
    var item = session.items[session.index];
    session.currentTarget = item.target;
    session.currentPrompt = item.prompt || null;

    el.promptBox.classList.toggle("hidden", !session.currentPrompt);
    if (session.currentPrompt) el.promptBox.textContent = "Q. " + session.currentPrompt;

    renderTargetDisplay("");
    el.typingInput.value = "";
    el.statProgress.textContent = (session.index + 1) + "/" + session.items.length;
    el.typingInput.focus();

    var seq = Hangul.keySequenceForChar(session.currentTarget[0]);
    VirtualKeyboard.highlightKey(seq[0]);
  }

  function renderTargetDisplay(value) {
    var target = session.currentTarget;
    var html = "";
    for (var i = 0; i < target.length; i++) {
      var cls = "ch";
      if (i < value.length) cls += value[i] === target[i] ? " correct" : " wrong";
      else if (i === value.length) cls += " current";
      html += "<span class='" + cls + "'>" + escapeHtml(target[i]) + "</span>";
    }
    el.targetDisplay.innerHTML = html;
  }

  function computeLiveStats(value) {
    var target = session.currentTarget;
    var correct = 0;
    var len = Math.min(value.length, target.length);
    for (var i = 0; i < len; i++) if (value[i] === target[i]) correct++;
    var typedKeystrokes = 0;
    for (i = 0; i < len; i++) typedKeystrokes += Hangul.keySequenceForChar(target[i]).length;
    var elapsedSec = (Date.now() - session.startTime) / 1000;
    var pastKeystrokes = session.totalKeystrokes; // 이전 항목까지 누적
    var pastChars = session.totalTargetChars;
    var pastCorrect = session.totalCorrectChars;
    var cpm = elapsedSec > 0 ? Math.round((pastKeystrokes + typedKeystrokes) / (elapsedSec / 60)) : 0;
    var accDenom = pastChars + len;
    var acc = accDenom > 0 ? Math.round(((pastCorrect + correct) / accDenom) * 100) : 100;
    el.statCpm.textContent = cpm + " 타/분";
    el.statAcc.textContent = "정확도 " + acc + "%";
  }

  function finalizeStep(value, isComposing) {
    renderTargetDisplay(value);
    computeLiveStats(value);
    if (isComposing) return;

    var target = session.currentTarget;
    if (value.length >= target.length) {
      finishItem(value);
      return;
    }
    var seq = Hangul.keySequenceForChar(target[value.length]);
    VirtualKeyboard.highlightKey(seq[0]);
  }

  function finishItem(value) {
    var target = session.currentTarget;
    var correct = 0;
    for (var i = 0; i < target.length; i++) if (value[i] === target[i]) correct++;
    var keystrokes = 0;
    for (i = 0; i < target.length; i++) keystrokes += Hangul.keySequenceForChar(target[i]).length;

    session.totalKeystrokes += keystrokes;
    session.totalTargetChars += target.length;
    session.totalCorrectChars += correct;
    session.index++;

    if (session.index >= session.items.length) {
      finishSession();
    } else {
      loadItem();
    }
  }

  function finishSession() {
    stopSessionTimer();
    var elapsedSec = (Date.now() - session.startTime) / 1000;
    var cpm = elapsedSec > 0 ? Math.round(session.totalKeystrokes / (elapsedSec / 60)) : 0;
    var acc = session.totalTargetChars > 0 ? Math.round((session.totalCorrectChars / session.totalTargetChars) * 100) : 100;

    el.resultCpm.textContent = cpm;
    el.resultAcc.textContent = acc + "%";
    el.resultTime.textContent = formatTime(elapsedSec);
    el.resultNickname.value = localStorage.getItem("typingNickname") || "";
    showScreen("screen-result");

    session.lastResult = { cpm: cpm, accuracy: acc, timeSec: Math.round(elapsedSec) };
  }

  function bindPractice() {
    el.typingInput.addEventListener("compositionupdate", function (e) {
      var idx = el.typingInput.value.length;
      var target = session.currentTarget;
      if (idx >= target.length) return;
      var seq = Hangul.keySequenceForChar(target[idx]);
      var sub = Hangul.subProgressForComposing(e.data);
      VirtualKeyboard.highlightKey(seq[Math.min(sub, seq.length - 1)]);
      renderTargetDisplay(el.typingInput.value);
    });
    el.typingInput.addEventListener("compositionend", function () {
      finalizeStep(el.typingInput.value, false);
    });
    el.typingInput.addEventListener("input", function (e) {
      finalizeStep(el.typingInput.value, !!e.isComposing);
    });
    $("btn-quit").addEventListener("click", function () {
      if (confirm("연습을 그만하고 홈으로 갈까요?")) { stopSessionTimer(); showHome(); }
    });
  }

  // ---------- 결과 / 랭킹 ----------
  function bindResult() {
    $("btn-retry").addEventListener("click", function () {
      startSession(session.mode, session.opts);
    });
    $("btn-save-ranking").addEventListener("click", function () {
      var name = el.resultNickname.value.trim() || "익명";
      localStorage.setItem("typingNickname", name);
      saveRanking(session.mode, name, session.lastResult);
      alert("랭킹에 저장되었습니다!");
      showRankingScreen(session.mode);
    });
  }

  function loadRankings() {
    try { return JSON.parse(localStorage.getItem(RANKING_KEY) || "{}"); }
    catch (e) { return {}; }
  }
  function saveRanking(mode, name, result) {
    var all = loadRankings();
    if (!all[mode]) all[mode] = [];
    all[mode].push({ name: name, cpm: result.cpm, accuracy: result.accuracy, timeSec: result.timeSec, date: new Date().toISOString().slice(0, 10) });
    all[mode].sort(function (a, b) { return b.cpm - a.cpm; });
    all[mode] = all[mode].slice(0, 20);
    localStorage.setItem(RANKING_KEY, JSON.stringify(all));
  }

  function bindRanking() {}

  function showRankingScreen(activeMode) {
    var modes = Object.keys(MODE_LABELS);
    el.rankingTabs.innerHTML = "";
    modes.forEach(function (m) {
      var b = document.createElement("button");
      b.textContent = MODE_LABELS[m];
      if (m === (activeMode || modes[0])) b.classList.add("active");
      b.addEventListener("click", function () { showRankingScreen(m); });
      el.rankingTabs.appendChild(b);
    });
    renderRankingList(activeMode || modes[0]);
    showScreen("screen-ranking");
  }

  function renderRankingList(mode) {
    var all = loadRankings();
    var list = all[mode] || [];
    el.rankingList.innerHTML = "";
    if (!list.length) {
      el.rankingList.innerHTML = "<p class='muted'>아직 기록이 없습니다.</p>";
      return;
    }
    list.forEach(function (r, idx) {
      var row = document.createElement("div");
      row.className = "rank-row";
      row.innerHTML =
        "<span><span class='rank-no'>" + (idx + 1) + "</span>" + escapeHtml(r.name) + "</span>" +
        "<span>" + r.cpm + " 타/분 · 정확도 " + r.accuracy + "% · " + r.date + "</span>";
      el.rankingList.appendChild(row);
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
