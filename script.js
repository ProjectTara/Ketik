(() => {
  "use strict";

  const TEXT = {
    id: {
      duration: "Durasi", restart: "Ulangi", secLeft: "detik tersisa", wpm: "kata/menit",
      accuracy: "akurasi", typos: "typo",
      clickToFocus: "Klik di sini, lalu mulai mengetik. Waktu berjalan saat huruf pertama diketik.",
      score: "Skor akhir", netWpm: "Kecepatan bersih", rawWpm: "Kecepatan kotor",
      typosTotal: "Total typo", uncorrected: "Typo tidak diperbaiki", best: "Rekor kamu",
      formula: "Skor = kecepatan bersih × akurasi. Kecepatan bersih hanya menghitung huruf yang benar. Akurasi turun setiap kali kamu salah tekan, walau sudah dihapus.",
      tryAgain: "Coba lagi", footer: "Tekan Esc kapan saja untuk mengulang. Satu kata dihitung 5 huruf.",
      newBest: "Rekor baru!", inputLabel: "Ketik di sini",
      ranks: ["Pemula", "Lumayan", "Cepat", "Sangat cepat", "Luar biasa"]
    },
    en: {
      duration: "Duration", restart: "Restart", secLeft: "seconds left", wpm: "wpm",
      accuracy: "accuracy", typos: "typos",
      clickToFocus: "Click here, then start typing. The timer starts on your first letter.",
      score: "Final score", netWpm: "Net speed", rawWpm: "Raw speed",
      typosTotal: "Total typos", uncorrected: "Uncorrected typos", best: "Your best",
      formula: "Score = net speed × accuracy. Net speed only counts correct letters. Accuracy drops every time you press a wrong key, even if you delete it.",
      tryAgain: "Try again", footer: "Press Esc any time to restart. One word counts as 5 characters.",
      newBest: "New best!", inputLabel: "Type here",
      ranks: ["Beginner", "Decent", "Fast", "Very fast", "Outstanding"]
    }
  };

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage off */ } }
  };

  const el = {
    box: document.getElementById("box"),
    viewport: document.getElementById("viewport"),
    words: document.getElementById("words"),
    input: document.getElementById("input"),
    time: document.getElementById("time"),
    wpm: document.getElementById("live-wpm"),
    acc: document.getElementById("live-acc"),
    typo: document.getElementById("live-typo"),
    result: document.getElementById("result"),
    restart: document.getElementById("restart"),
    again: document.getElementById("again")
  };

  const s = {
    lang: store.get("ketik.lang", "id"),
    duration: store.get("ketik.duration", 30),
    target: "", typed: "", spans: [], caret: null,
    started: false, finished: false, startAt: 0, timer: null,
    keystrokes: 0, typos: 0
  };
  if (!TEXT[s.lang]) s.lang = "id";
  if (![15, 30, 60, 120].includes(s.duration)) s.duration = 30;

  /* ---------- Words ---------- */
  let lastWord = "";
  function randomWords(n) {
    const list = window.WORDS[s.lang];
    const out = [];
    while (out.length < n) {
      const w = list[Math.floor(Math.random() * list.length)];
      if (w !== lastWord) { out.push(w); lastWord = w; }
    }
    return out;
  }

  function appendText(text) {
    const frag = document.createDocumentFragment();
    for (const ch of text) {
      const sp = document.createElement("span");
      sp.className = "c";
      sp.textContent = ch;
      frag.appendChild(sp);
      s.spans.push(sp);
    }
    el.words.appendChild(frag);
    s.target += text;
  }

  function ensureLength() {
    if (s.target.length - s.typed.length < 120) appendText(" " + randomWords(25).join(" "));
  }

  /* ---------- Painting ---------- */
  function paint(i) {
    const sp = s.spans[i];
    if (!sp) return;
    if (i >= s.typed.length) sp.className = "c";
    else sp.className = s.typed[i] === s.target[i] ? "c ok" : "c bad";
  }

  function moveCaret() {
    const sp = s.spans[s.typed.length];
    if (!sp) return;
    const lh = sp.offsetHeight || 40;
    s.caret.style.left = sp.offsetLeft + "px";
    s.caret.style.top = (sp.offsetTop + (lh - s.caret.offsetHeight) / 2) + "px";
    const lineH = parseFloat(getComputedStyle(el.words).lineHeight) || lh;
    const line = Math.round(sp.offsetTop / lineH);
    const shift = Math.max(0, line - 1) * lineH;
    el.words.style.transform = `translateY(${-shift}px)`;
  }

  /* ---------- Stats ---------- */
  function countCorrect() {
    let ok = 0;
    for (let i = 0; i < s.typed.length; i++) if (s.typed[i] === s.target[i]) ok++;
    return ok;
  }
  function stats(elapsedSec) {
    // Floor of 3 s stops the live speed from spiking on the first keys.
    const min = Math.max(elapsedSec, 3) / 60;
    const correct = countCorrect();
    const net = Math.round((correct / 5) / min);
    const raw = Math.round((s.typed.length / 5) / min);
    const acc = s.keystrokes ? ((s.keystrokes - s.typos) / s.keystrokes) * 100 : 100;
    return { net, raw, acc, correct, left: s.typed.length - correct };
  }

  function updateLive() {
    const elapsed = s.started ? (performance.now() - s.startAt) / 1000 : 0;
    const left = Math.max(0, s.duration - elapsed);
    el.time.textContent = Math.ceil(left);
    document.body.classList.toggle("low", s.started && left <= 5);
    const st = stats(elapsed);
    el.wpm.textContent = s.started ? st.net : 0;
    el.acc.textContent = Math.round(st.acc) + "%";
    el.typo.textContent = s.typos;
    if (s.started && left <= 0) finish();
  }

  /* ---------- Flow ---------- */
  function start() {
    s.started = true;
    s.startAt = performance.now();
    el.box.classList.remove("idle");
    s.timer = setInterval(updateLive, 100);
  }

  function finish() {
    if (s.finished) return;
    s.finished = true;
    clearInterval(s.timer);
    el.input.blur();
    el.input.disabled = true;
    el.box.classList.add("done");

    const t = TEXT[s.lang];
    const st = stats(s.duration);
    const score = Math.round(st.net * st.acc);
    const key = `ketik.best.${s.lang}.${s.duration}`;
    const prevBest = store.get(key, 0);
    const isBest = score > prevBest;
    if (isBest) store.set(key, score);

    const rankIdx = score < 2000 ? 0 : score < 4000 ? 1 : score < 6000 ? 2 : score < 8000 ? 3 : 4;
    document.getElementById("r-score").textContent = score.toLocaleString(s.lang);
    document.getElementById("r-rank").textContent = t.ranks[rankIdx] + (isBest && score > 0 ? " · " + t.newBest : "");
    document.getElementById("r-wpm").textContent = st.net;
    document.getElementById("r-raw").textContent = st.raw;
    document.getElementById("r-acc").textContent = st.acc.toLocaleString(s.lang, { maximumFractionDigits: 1 }) + "%";
    document.getElementById("r-typo").textContent = s.typos;
    document.getElementById("r-left").textContent = st.left;
    document.getElementById("r-best").textContent = Math.max(score, prevBest).toLocaleString(s.lang);
    el.result.hidden = false;
    el.again.focus();
  }

  function reset(focus = true) {
    clearInterval(s.timer);
    Object.assign(s, { target: "", typed: "", spans: [], started: false, finished: false, keystrokes: 0, typos: 0 });
    lastWord = "";
    el.words.innerHTML = "";
    el.words.style.transform = "";
    s.caret = document.createElement("span");
    s.caret.className = "caret";
    el.words.appendChild(s.caret);
    appendText(randomWords(60).join(" "));
    el.input.value = "";
    el.input.disabled = false;
    el.box.classList.add("idle");
    el.box.classList.remove("done");
    document.body.classList.remove("low");
    el.result.hidden = true;
    updateLive();
    requestAnimationFrame(moveCaret);
    if (focus) el.input.focus();
  }

  /* ---------- Input ---------- */
  el.input.addEventListener("input", () => {
    if (s.finished) { el.input.value = s.typed; return; }
    const val = el.input.value;
    if (!s.started && val.length) start();
    const prev = s.typed;
    let p = 0;
    while (p < prev.length && p < val.length && prev[p] === val[p]) p++;
    for (let i = p; i < val.length; i++) {
      s.keystrokes++;
      if (val[i] !== s.target[i]) s.typos++;
    }
    s.typed = val;
    ensureLength();
    const to = Math.max(prev.length, val.length);
    for (let i = p; i < to; i++) paint(i);
    moveCaret();
    updateLive();
  });

  // Keep the cursor at the end: no arrow keys, no selecting, no pasting.
  el.input.addEventListener("keydown", (e) => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) e.preventDefault();
  });
  el.input.addEventListener("select", () => {
    const n = el.input.value.length;
    el.input.setSelectionRange(n, n);
  });
  el.input.addEventListener("paste", (e) => e.preventDefault());
  el.input.addEventListener("drop", (e) => e.preventDefault());

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { e.preventDefault(); reset(); return; }
    const typing = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
    if (typing && !s.finished && document.activeElement !== el.input && !(e.target instanceof HTMLButtonElement && e.key === " ")) {
      el.input.focus();
    }
  });

  /* ---------- Settings ---------- */
  function applyLang() {
    const t = TEXT[s.lang];
    document.documentElement.lang = s.lang;
    document.querySelectorAll("[data-i18n]").forEach((n) => { n.textContent = t[n.dataset.i18n]; });
    el.input.setAttribute("aria-label", t.inputLabel);
    document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.lang === s.lang));
  }
  function applyDuration() {
    document.querySelectorAll("[data-dur]").forEach((b) => b.setAttribute("aria-pressed", Number(b.dataset.dur) === s.duration));
  }

  document.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => {
    s.lang = b.dataset.lang; store.set("ketik.lang", s.lang); applyLang(); reset();
  }));
  document.querySelectorAll("[data-dur]").forEach((b) => b.addEventListener("click", () => {
    s.duration = Number(b.dataset.dur); store.set("ketik.duration", s.duration); applyDuration(); reset();
  }));
  el.restart.addEventListener("click", () => reset());
  el.again.addEventListener("click", () => reset());
  window.addEventListener("resize", moveCaret);

  applyLang();
  applyDuration();
  reset(false);
  if (document.fonts) document.fonts.ready.then(moveCaret);
})();
