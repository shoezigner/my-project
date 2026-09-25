/**
 * 두벌식(2-set) 표준 자판 기준 한글 분해 및 키 매핑 유틸리티.
 * 실제 한글 조합(초성+중성+종성)은 OS/브라우저의 IME가 처리하므로,
 * 여기서는 "이 글자를 치려면 어떤 물리 키를 몇 번 눌러야 하는가"만 계산한다.
 */
(function (global) {
  "use strict";

  var CHO = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
  var JUNG = ["ㅏ","ㅐ","ㅑ","ㅒ","ㅓ","ㅔ","ㅕ","ㅖ","ㅗ","ㅘ","ㅙ","ㅚ","ㅛ","ㅜ","ㅝ","ㅞ","ㅟ","ㅠ","ㅡ","ㅢ","ㅣ"];
  var JONG = ["","ㄱ","ㄲ","ㄳ","ㄴ","ㄵ","ㄶ","ㄷ","ㄹ","ㄺ","ㄻ","ㄼ","ㄽ","ㄾ","ㄿ","ㅀ","ㅁ","ㅂ","ㅄ","ㅅ","ㅆ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];

  // 기본 자모 -> 물리 키 (두벌식)
  var KEY_MAP = {
    // 자음 (기본)
    "ㅂ": { key: "q" }, "ㅈ": { key: "w" }, "ㄷ": { key: "e" }, "ㄱ": { key: "r" }, "ㅅ": { key: "t" },
    "ㅁ": { key: "a" }, "ㄴ": { key: "s" }, "ㅇ": { key: "d" }, "ㄹ": { key: "f" }, "ㅎ": { key: "g" },
    "ㅋ": { key: "z" }, "ㅌ": { key: "x" }, "ㅊ": { key: "c" }, "ㅍ": { key: "v" },
    // 쌍자음 (Shift)
    "ㅃ": { key: "q", shift: true }, "ㅉ": { key: "w", shift: true }, "ㄸ": { key: "e", shift: true },
    "ㄲ": { key: "r", shift: true }, "ㅆ": { key: "t", shift: true },
    // 모음 (기본)
    "ㅛ": { key: "y" }, "ㅕ": { key: "u" }, "ㅑ": { key: "i" }, "ㅐ": { key: "o" }, "ㅔ": { key: "p" },
    "ㅗ": { key: "h" }, "ㅓ": { key: "j" }, "ㅏ": { key: "k" }, "ㅣ": { key: "l" },
    "ㅠ": { key: "b" }, "ㅜ": { key: "n" }, "ㅡ": { key: "m" },
    // 이중 모음 (Shift)
    "ㅒ": { key: "o", shift: true }, "ㅖ": { key: "p", shift: true }
  };

  // 두 번의 키 입력으로 조합되는 복합 모음(중성)
  var COMPLEX_JUNG = {
    "ㅘ": ["ㅗ", "ㅏ"], "ㅙ": ["ㅗ", "ㅐ"], "ㅚ": ["ㅗ", "ㅣ"],
    "ㅝ": ["ㅜ", "ㅓ"], "ㅞ": ["ㅜ", "ㅔ"], "ㅟ": ["ㅜ", "ㅣ"],
    "ㅢ": ["ㅡ", "ㅣ"]
  };

  // 두 번의 키 입력으로 조합되는 복합 받침(종성)
  var COMPLEX_JONG = {
    "ㄳ": ["ㄱ", "ㅅ"], "ㄵ": ["ㄴ", "ㅈ"], "ㄶ": ["ㄴ", "ㅎ"],
    "ㄺ": ["ㄹ", "ㄱ"], "ㄻ": ["ㄹ", "ㅁ"], "ㄼ": ["ㄹ", "ㅂ"], "ㄽ": ["ㄹ", "ㅅ"],
    "ㄾ": ["ㄹ", "ㅌ"], "ㄿ": ["ㄹ", "ㅍ"], "ㅀ": ["ㄹ", "ㅎ"], "ㅄ": ["ㅂ", "ㅅ"]
  };

  // 한글 외 문자(공백, 문장부호, 숫자 등)
  var OTHER_MAP = {
    " ": { key: " " }, ".": { key: "." }, ",": { key: "," },
    "!": { key: "1", shift: true }, "?": { key: "/", shift: true },
    "-": { key: "-" }, "'": { key: "'" }, "\"": { key: "'", shift: true },
    "~": { key: "1", shift: true }, "(": { key: "9", shift: true }, ")": { key: "0", shift: true }
  };

  function getSyllableComponents(ch) {
    var code = ch.codePointAt(0);
    if (code < 0xac00 || code > 0xd7a3) return null;
    var offset = code - 0xac00;
    var choIdx = Math.floor(offset / (21 * 28));
    var jungIdx = Math.floor((offset % (21 * 28)) / 28);
    var jongIdx = offset % 28;
    return { cho: CHO[choIdx], jung: JUNG[jungIdx], jong: JONG[jongIdx] || null };
  }

  function keyOf(jamo) {
    return KEY_MAP[jamo] || null;
  }

  // 완성된 한글 글자 1개를 치기 위해 필요한 키 입력 순서를 반환한다.
  function keySequenceForChar(ch) {
    var comps = getSyllableComponents(ch);
    if (comps) {
      var seq = [keyOf(comps.cho)];
      if (COMPLEX_JUNG[comps.jung]) {
        COMPLEX_JUNG[comps.jung].forEach(function (j) { seq.push(keyOf(j)); });
      } else {
        seq.push(keyOf(comps.jung));
      }
      if (comps.jong) {
        if (COMPLEX_JONG[comps.jong]) {
          COMPLEX_JONG[comps.jong].forEach(function (j) { seq.push(keyOf(j)); });
        } else {
          seq.push(keyOf(comps.jong));
        }
      }
      return seq;
    }
    if (OTHER_MAP[ch]) return [OTHER_MAP[ch]];
    if (/[a-zA-Z0-9]/.test(ch)) {
      return [{ key: ch.toLowerCase(), shift: /[A-Z]/.test(ch) }];
    }
    return [{ key: ch }];
  }

  // 낱자(호환용 자모) 유니코드 범위
  function isCompatCho(ch) {
    var c = ch.codePointAt(0);
    return c >= 0x3131 && c <= 0x314e;
  }
  function isCompatJung(ch) {
    var c = ch.codePointAt(0);
    return c >= 0x314f && c <= 0x3163;
  }

  // IME 조합 중인 문자열(compositionupdate 값)을 보고, 현재 음절에서
  // 지금까지 몇 번의 키 입력이 반영되었는지 추정한다.
  function subProgressForComposing(str) {
    if (!str) return 0;
    var ch = str[str.length - 1];
    var comps = getSyllableComponents(ch);
    if (comps) {
      var n = 1; // 초성
      n += COMPLEX_JUNG[comps.jung] ? 2 : 1; // 중성
      if (comps.jong) n += COMPLEX_JONG[comps.jong] ? 2 : 1; // 종성
      return n;
    }
    if (isCompatCho(ch) || isCompatJung(ch)) return 1;
    return 0;
  }

  global.Hangul = {
    keySequenceForChar: keySequenceForChar,
    subProgressForComposing: subProgressForComposing,
    getSyllableComponents: getSyllableComponents
  };
})(window);
