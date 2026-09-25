/**
 * 자격증 학습자료 관리 (단답형 / 서술형 / 핵심이론).
 * 실제 문제·정답 내용은 정확성을 위해 사용자가 직접 입력하며,
 * 이 파일은 저장/조회 로직만 담당한다. localStorage에 영구 저장된다.
 */
(function (global) {
  "use strict";

  var STORAGE_KEY = "typingStudySets_v1";

  var CATEGORIES = [
    { id: "fire-elec", label: "소방설비기사(전기)" },
    { id: "fire-mech", label: "소방설비기사(기계)" },
    { id: "fire-manager", label: "소방시설관리사" },
    { id: "fire-pe", label: "소방기술사" }
  ];

  var TYPES = [
    { id: "short", label: "단답형" },
    { id: "essay", label: "서술형" },
    { id: "theory", label: "핵심이론" }
  ];

  function loadAll() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveAll(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function getItems(categoryId) {
    var all = loadAll();
    return all[categoryId] || [];
  }

  function addItem(categoryId, item) {
    var all = loadAll();
    if (!all[categoryId]) all[categoryId] = [];
    item.id = "s" + Date.now() + Math.floor(Math.random() * 1000);
    item.createdAt = Date.now();
    all[categoryId].push(item);
    saveAll(all);
    return item;
  }

  function deleteItem(categoryId, itemId) {
    var all = loadAll();
    if (!all[categoryId]) return;
    all[categoryId] = all[categoryId].filter(function (it) { return it.id !== itemId; });
    saveAll(all);
  }

  // 연습 화면에 표시할 "질문/제목" 텍스트
  function getPrompt(item) {
    if (item.type === "theory") return item.title || "";
    return item.q || "";
  }

  // 실제로 타이핑해야 할 목표 텍스트
  function getPracticeText(item) {
    if (item.type === "theory") return item.content || "";
    return item.a || "";
  }

  global.StudySets = {
    CATEGORIES: CATEGORIES,
    TYPES: TYPES,
    getItems: getItems,
    addItem: addItem,
    deleteItem: deleteItem,
    getPrompt: getPrompt,
    getPracticeText: getPracticeText
  };
})(window);
