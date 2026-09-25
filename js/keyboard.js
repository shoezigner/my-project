/**
 * 가상 키보드 렌더링 및 "다음에 눌러야 할 키" 하이라이트.
 */
(function (global) {
  "use strict";

  var ROWS = [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-"],
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"],
    ["shiftL", "z", "x", "c", "v", "b", "n", "m", ",", ".", "/", "shiftR"],
    ["space"]
  ];

  var HANGUL_LABEL = {
    q: "ㅂ", w: "ㅈ", e: "ㄷ", r: "ㄱ", t: "ㅅ",
    a: "ㅁ", s: "ㄴ", d: "ㅇ", f: "ㄹ", g: "ㅎ",
    z: "ㅋ", x: "ㅌ", c: "ㅊ", v: "ㅍ",
    y: "ㅛ", u: "ㅕ", i: "ㅑ", o: "ㅐ", p: "ㅔ",
    h: "ㅗ", j: "ㅓ", k: "ㅏ", l: "ㅣ",
    b: "ㅠ", n: "ㅜ", m: "ㅡ"
  };

  var els = {};

  function renderKeyboard(container) {
    container.innerHTML = "";
    ROWS.forEach(function (row) {
      var rowEl = document.createElement("div");
      rowEl.className = "kb-row";
      row.forEach(function (k) {
        var keyEl = document.createElement("div");
        keyEl.className = "kb-key";
        var dataKey = k;
        if (k === "shiftL" || k === "shiftR") {
          keyEl.className += " kb-shift";
          dataKey = "shift";
          keyEl.innerHTML = "<span>Shift</span>";
        } else if (k === "space") {
          keyEl.className += " kb-space";
          dataKey = " ";
          keyEl.innerHTML = "<span>Space</span>";
        } else {
          keyEl.innerHTML = HANGUL_LABEL[k]
            ? "<span class='kb-sub'>" + HANGUL_LABEL[k] + "</span><span class='kb-main'>" + k.toUpperCase() + "</span>"
            : "<span class='kb-main'>" + k.toUpperCase() + "</span>";
        }
        keyEl.setAttribute("data-key", dataKey);
        rowEl.appendChild(keyEl);
        if (!els[dataKey]) els[dataKey] = [];
        els[dataKey].push(keyEl);
      });
      container.appendChild(rowEl);
    });
  }

  function clearHighlight() {
    Object.keys(els).forEach(function (k) {
      els[k].forEach(function (el) { el.classList.remove("active"); });
    });
  }

  // keySpec: { key, shift }
  function highlightKey(keySpec) {
    clearHighlight();
    if (!keySpec) return;
    var k = (keySpec.key || "").toLowerCase();
    if (els[k]) els[k].forEach(function (el) { el.classList.add("active"); });
    if (keySpec.shift && els["shift"]) {
      els["shift"].forEach(function (el) { el.classList.add("active"); });
    }
  }

  global.VirtualKeyboard = {
    render: renderKeyboard,
    highlightKey: highlightKey,
    clear: clearHighlight
  };
})(window);
