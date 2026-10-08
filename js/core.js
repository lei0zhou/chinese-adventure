/* Panda Passport: core (state, storage, SRS, rewards, speech, recorder, helpers). No network calls. */
(function () {
  'use strict';
  const C = window.CONTENT;
  const App = (window.App = {});
  App.C = C;
  App.wordById = Object.fromEntries(C.words.map(w => [w.id, w]));
  App.wordByHz = Object.fromEntries(C.words.map(w => [w.hz, w]));
  App.unitById = Object.fromEntries(C.units.map(u => [u.id, u]));
  App.unitWords = id => App.unitById[id].words.map(w => App.wordById[w]);

  /* ---------- helpers ---------- */
  App.$ = (sel, root) => (root || document).querySelector(sel);
  App.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  App.esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  App.shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  App.pick = (a, n) => App.shuffle(a).slice(0, n);
  App.today = () => { const d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); };

  /* ---------- pinyin ---------- */
  const MARKS = { 'ā': 1, 'á': 2, 'ǎ': 3, 'à': 4, 'ē': 1, 'é': 2, 'ě': 3, 'è': 4, 'ī': 1, 'í': 2, 'ǐ': 3, 'ì': 4, 'ō': 1, 'ó': 2, 'ǒ': 3, 'ò': 4, 'ū': 1, 'ú': 2, 'ǔ': 3, 'ù': 4, 'ǖ': 1, 'ǘ': 2, 'ǚ': 3, 'ǜ': 4 };
  const BASE = { 'ā': 'a', 'á': 'a', 'ǎ': 'a', 'à': 'a', 'ē': 'e', 'é': 'e', 'ě': 'e', 'è': 'e', 'ī': 'i', 'í': 'i', 'ǐ': 'i', 'ì': 'i', 'ō': 'o', 'ó': 'o', 'ǒ': 'o', 'ò': 'o', 'ū': 'u', 'ú': 'u', 'ǔ': 'u', 'ù': 'u', 'ǖ': 'ü', 'ǘ': 'ü', 'ǚ': 'ü', 'ǜ': 'ü' };
  const V = 'aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜAEIOUĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙ';
  const SYL = new RegExp('(?:zh|ch|sh|[bpmfdtnlgkhjqxrzcsywBPMFDTNLGKHJQXRZCSYW])?[' + V + ']+(?:ng(?![' + V + '])|n(?![' + V + '])|r(?![' + V + ']))?', 'g');
  App.toneOf = s => { for (const ch of s.toLowerCase()) if (MARKS[ch]) return MARKS[ch]; return 0; };
  App.stripTone = s => s.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, c => BASE[c]).replace(/[ĀÁǍÀ]/g, 'A').replace(/[ĒÉĚÈ]/g, 'E').replace(/[ĪÍǏÌ]/g, 'I').replace(/[ŌÓǑÒ]/g, 'O').replace(/[ŪÚǓÙ]/g, 'U');
  App.syllables = py => (py.match(SYL) || []);
  /** Pinyin as HTML with each syllable colored by tone (when tone colors are on). */
  App.pyHTML = py => {
    const out = []; let last = 0;
    py.replace(SYL, (m, off) => {
      out.push(App.esc(py.slice(last, off)));
      out.push('<span class="t' + App.toneOf(m) + '">' + App.esc(m) + '</span>');
      last = off + m.length; return m;
    });
    out.push(App.esc(py.slice(last)));
    return '<span class="pyw">' + out.join('') + '</span>';
  };
  App.ruby = (tokens) => tokens.map(([hz, py]) => py
    ? '<ruby data-hz="' + App.esc(hz) + '" data-py="' + App.esc(py) + '">' + App.esc(hz) + '<rt>' + App.pyHTML(py) + '</rt></ruby>'
    : '<span class="punct">' + App.esc(hz) + '</span>').join('');
  App.gloss = hz => (App.wordByHz[hz] ? App.wordByHz[hz].en : C.gloss[hz] || '');

  /* ---------- state ---------- */
  const KEY = 'pandaPassport.v1';
  const AVATARS = ['🐼', '🐯', '🐉', '🐵', '🦊', '🐰', '🐱', '🐶', '🦄', '🐧', '🦁', '🐨'];
  App.AVATARS = AVATARS;
  function newProfile(name, avatar) {
    return { id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name: name || 'Explorer', avatar: avatar || '🐼',
      created: Date.now(), stars: 0, best: {}, passed: {}, srs: {}, badges: {}, streak: { last: 0, count: 0 },
      counts: {}, log: [] };
  }
  function defaults() {
    return { version: 1, current: null, profiles: {}, settings: { sound: true, unlockAll: false, rate: 0.8, toneColors: true, pinyin: true, keepRecordings: false } };
  }
  App.load = () => {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { s = null; }
    const d = defaults();
    if (!s || typeof s !== 'object' || !s.profiles) s = d;
    s.settings = Object.assign(d.settings, s.settings || {});
    App.state = s;
    return s;
  };
  App.save = () => { try { localStorage.setItem(KEY, JSON.stringify(App.state)); } catch (e) { console.warn('save failed', e); } };
  App.profile = () => App.state.profiles[App.state.current] || null;
  App.addProfile = (name, avatar) => { const p = newProfile(name, avatar); App.state.profiles[p.id] = p; App.state.current = p.id; App.save(); return p; };
  App.resetProfile = id => { const p = App.state.profiles[id]; if (!p) return; const n = newProfile(p.name, p.avatar); n.id = p.id; if (p.voice) n.voice = p.voice; App.state.profiles[id] = n; App.save(); };
  App.exportJSON = () => JSON.stringify({ app: 'panda-passport', exported: new Date().toISOString(), state: App.state }, null, 2);
  App.importJSON = text => {
    const obj = JSON.parse(text);
    const st = obj && obj.state ? obj.state : obj;
    if (!st || typeof st !== 'object' || typeof st.profiles !== 'object') throw new Error('This file does not look like a Panda Passport progress file.');
    for (const p of Object.values(st.profiles)) {
      if (!p || typeof p !== 'object' || typeof p.name !== 'string') throw new Error('A profile in the file is damaged.');
      const d = newProfile(p.name, p.avatar);
      for (const k of Object.keys(d)) if (p[k] === undefined) p[k] = d[k];
    }
    if (!st.profiles[st.current]) st.current = Object.keys(st.profiles)[0] || null;
    const d = defaults(); st.settings = Object.assign(d.settings, st.settings || {}); st.version = 1;
    App.state = st; App.save();
  };

  /* ---------- unlocks ---------- */
  App.unitIndex = id => C.units.findIndex(u => u.id === id);
  App.isUnlocked = id => {
    const i = App.unitIndex(id); const p = App.profile();
    return i === 0 || App.state.settings.unlockAll || !!(p && p.passed[C.units[i - 1].id]);
  };
  App.unlockedUnits = () => C.units.filter(u => App.isUnlocked(u.id));
  App.currentUnit = () => { const p = App.profile(); return C.units.find(u => !p.passed[u.id] && App.isUnlocked(u.id)) || C.units[C.units.length - 1]; };

  /* ---------- spaced repetition (Leitner boxes) ---------- */
  const INTERVALS = [0, 1, 2, 4, 8, 16, 32];
  App.srsGrade = (wordId, correct) => {
    const p = App.profile(); if (!p || !App.wordById[wordId]) return;
    const r = p.srs[wordId] || (p.srs[wordId] = { b: 0, due: App.today(), n: 0, ok: 0 });
    r.n++;
    if (correct) { r.ok++; r.b = Math.min(r.b + 1, INTERVALS.length - 1); } else { r.b = 0; }
    r.due = App.today() + INTERVALS[r.b];
  };
  App.dueWords = () => { const p = App.profile(), t = App.today(); return Object.entries(p.srs).filter(([id, r]) => r.due <= t && App.wordById[id]).sort((a, b) => a[1].due - b[1].due || a[1].b - b[1].b).map(([id]) => App.wordById[id]); };
  App.newWords = () => { const p = App.profile(); return App.unlockedUnits().flatMap(u => App.unitWords(u.id)).filter(w => !p.srs[w.id]); };
  App.learnedCount = () => Object.values(App.profile().srs).filter(r => r.b >= 2).length;

  /* ---------- rewards ---------- */
  App.BADGES = [
    { id: 'first', e: '🌱', name: 'First Step', desc: 'Finish your first activity' },
    { id: 'stamp1', e: '🛂', name: 'First Stamp', desc: 'Pass your first City Challenge' },
    { id: 'stamp6', e: '🚄', name: 'Halfway There', desc: 'Collect 6 city stamps' },
    { id: 'stamp12', e: '🏔️', name: 'Grand Tour', desc: 'Collect all 12 city stamps' },
    { id: 'stars50', e: '⭐', name: 'Star Catcher', desc: 'Earn 50 stars' },
    { id: 'stars200', e: '🌟', name: 'Star Shower', desc: 'Earn 200 stars' },
    { id: 'stars500', e: '💫', name: 'Galaxy', desc: 'Earn 500 stars' },
    { id: 'streak3', e: '🔥', name: 'On Fire', desc: 'Practice 3 days in a row' },
    { id: 'streak7', e: '🏅', name: 'Week Warrior', desc: 'Practice 7 days in a row' },
    { id: 'tone10', e: '👂', name: 'Golden Ear', desc: 'Get 10/10 in the Tone Gym' },
    { id: 'brush20', e: '🖌️', name: 'Little Calligrapher', desc: 'Write 20 characters' },
    { id: 'actor3', e: '🎭', name: 'Star Actor', desc: 'Perform 3 role-play scenes' },
    { id: 'reader6', e: '📚', name: 'Bookworm', desc: 'Finish 6 reading stories' },
    { id: 'builder20', e: '🧱', name: 'Sentence Builder', desc: 'Build 20 sentences' },
    { id: 'words50', e: '🧠', name: 'Word Collector', desc: 'Learn 50 words (seen correctly twice)' },
    { id: 'words150', e: '🐲', name: 'Word Dragon', desc: 'Learn 150 words' },
    { id: 'daily5', e: '📅', name: 'Daily Hero', desc: 'Finish 5 Daily Mixes' },
  ];
  App.count = (k, n) => { const p = App.profile(); p.counts[k] = (p.counts[k] || 0) + (n || 1); };
  App.touchStreak = () => {
    const p = App.profile(), t = App.today();
    if (p.streak.last === t) return;
    p.streak.count = p.streak.last === t - 1 ? p.streak.count + 1 : 1; p.streak.last = t;
  };
  /** Record an activity result. key like "greet:flash". Returns stars (0-3). */
  App.finish = (key, score, total, extra) => {
    const p = App.profile();
    const frac = total ? score / total : 1;
    const stars = frac >= 0.95 ? 3 : frac >= 0.7 ? 2 : frac > 0 || !total ? 1 : 0;
    p.stars += stars;
    p.best[key] = Math.max(p.best[key] || 0, stars);
    const kind = key.split(':')[1] || key;
    App.count('act:' + kind);
    p.log.unshift({ t: Date.now(), key, score, total }); p.log = p.log.slice(0, 60);
    App.touchStreak();
    if (extra) extra(p);
    App.checkBadges();
    App.save();
    return stars;
  };
  App.checkBadges = () => {
    const p = App.profile(), c = p.counts, got = [];
    const stamps = Object.keys(p.passed).length;
    const cond = {
      first: p.log.length >= 1, stamp1: stamps >= 1, stamp6: stamps >= 6, stamp12: stamps >= 12,
      stars50: p.stars >= 50, stars200: p.stars >= 200, stars500: p.stars >= 500,
      streak3: p.streak.count >= 3, streak7: p.streak.count >= 7, tone10: (c.tonePerfect || 0) >= 1,
      brush20: (c.written || 0) >= 20, actor3: (c['act:roleplay'] || 0) >= 3, reader6: (c['act:read'] || 0) >= 6,
      builder20: (c.built || 0) >= 20, words50: App.learnedCount() >= 50, words150: App.learnedCount() >= 150,
      daily5: (c['act:daily'] || 0) >= 5,
    };
    for (const b of App.BADGES) if (cond[b.id] && !p.badges[b.id]) { p.badges[b.id] = Date.now(); got.push(b); }
    got.forEach((b, i) => setTimeout(() => App.toast(b.e + ' New badge: ' + b.name + '!', 2600), 900 + i * 2700));
    return got;
  };

  /* ---------- UI bits ---------- */
  App.toast = (msg, ms) => {
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
    setTimeout(() => t.remove(), ms || 1800);
  };
  App.confetti = (n) => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const em = ['🎉', '⭐', '🐼', '🏮', '✨', '🧧', '🎊'];
    for (let i = 0; i < (n || 26); i++) {
      const s = document.createElement('div'); s.className = 'confetti'; s.textContent = em[i % em.length];
      s.style.left = Math.random() * 100 + 'vw'; s.style.animationDuration = 1.6 + Math.random() * 1.6 + 's'; s.style.animationDelay = Math.random() * 0.4 + 's';
      document.body.appendChild(s); setTimeout(() => s.remove(), 4000);
    }
  };
  App.modal = (html, onMount) => {
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = '<div class="modal" role="dialog" aria-modal="true">' + html + '</div>';
    document.body.appendChild(bg);
    const close = () => bg.remove();
    bg.addEventListener('click', e => { if (e.target === bg) close(); });
    if (onMount) onMount(bg.firstChild, close);
    return close;
  };
  App.starsText = n => '★'.repeat(n) + '☆'.repeat(Math.max(0, 3 - n));

  /* ---------- sound effects (WebAudio, generated) ---------- */
  let actx = null;
  App.sfx = type => {
    if (!App.state.settings.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const seq = { good: [[660, 0, .09], [880, .09, .14]], bad: [[220, 0, .18]], win: [[523, 0, .1], [659, .1, .1], [784, .2, .1], [1047, .3, .25]], tap: [[500, 0, .04]] }[type] || [];
      const t0 = actx.currentTime;
      for (const [f, at, dur] of seq) {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = type === 'bad' ? 'sawtooth' : 'triangle'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0 + at); g.gain.exponentialRampToValueAtTime(0.18, t0 + at + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
        o.connect(g).connect(actx.destination); o.start(t0 + at); o.stop(t0 + at + dur + 0.02);
      }
    } catch (e) { /* audio not available */ }
  };

  /* ---------- speech: bundled recordings (audio/*.mp3) + optional on-device Web Speech voice ---------- */
  // Voice modes (saved per explorer): 'recorded' = bundled clips only (default),
  // 'device' = the device's Chinese text-to-speech voice (falls back to clips if there is none),
  // 'auto' = bundled clips, falling back to the device voice when a clip is missing or fails.
  App.VOICE_MODES = [
    { k: 'recorded', name: 'Recorded voice', desc: 'Built-in recordings. Works on every device, even offline.' },
    { k: 'device', name: 'Device voice', desc: 'Your device’s own Chinese text-to-speech voice.' },
    { k: 'auto', name: 'Auto', desc: 'Recordings first; the device voice fills any gaps.' },
  ];
  App.voice = null; App.zhVoices = [];
  App.clips = null; App.audioInfo = null;
  const isZh = v => /^(zh|cmn)([-_](CN|Hans|SG|TW|Hant)|$)/i.test(v.lang) && !/HK|yue/i.test(v.lang);
  function listVoices() {
    if (!('speechSynthesis' in window)) return [];
    const zh = speechSynthesis.getVoices().filter(isZh);
    // Prefer on-device voices, then mainland Mandarin.
    zh.sort((a, b) => (b.localService - a.localService) || (/CN|Hans/i.test(b.lang) - /CN|Hans/i.test(a.lang)) || a.name.localeCompare(b.name));
    return zh;
  }
  function pickVoice() {
    App.zhVoices = listVoices();
    const want = App.voicePrefs().uri;
    App.voice = App.zhVoices.find(v => v.voiceURI === want) || App.zhVoices[0] || null;
    return App.voice;
  }
  App.pickVoice = pickVoice;
  App.voicePrefs = () => {
    const p = App.profile && App.profile(), v = (p && p.voice) || {};
    return { mode: ['recorded', 'device', 'auto'].includes(v.mode) ? v.mode : 'recorded', uri: v.uri || null, speed: v.speed === 'slow' ? 'slow' : 'normal' };
  };
  App.setVoicePrefs = patch => {
    const p = App.profile(); if (!p) return;
    p.voice = Object.assign(App.voicePrefs(), p.voice || {}, patch); App.save(); pickVoice();
    document.dispatchEvent(new Event('voices'));
  };
  App.initVoices = () => {
    pickVoice();
    if ('speechSynthesis' in window) speechSynthesis.addEventListener('voiceschanged', () => { pickVoice(); document.dispatchEvent(new Event('voices')); });
  };
  /** Load audio/manifest.json (maps Chinese text -> clip file). Resolves either way. */
  App.initAudio = () => {
    const ctl = window.AbortController ? new AbortController() : null;
    const t = setTimeout(() => ctl && ctl.abort(), 6000);
    return fetch('audio/manifest.json', ctl ? { signal: ctl.signal } : {}).then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(m => { App.audioInfo = m; App.clips = m.clips || {}; })
      .catch(e => { console.warn('audio manifest unavailable', e); App.clips = null; })
      .finally(() => clearTimeout(t));
  };
  App.clipFor = text => (App.clips && text ? App.clips[text] || App.clips[String(text).replace(/[。！？，、：；…—“”\s]+$/g, '')] || null : null);
  App.hasRecordings = () => !!(App.clips && Object.keys(App.clips).length);
  /** Which engine will actually be used: 'clip' | 'device' | null */
  App.engine = text => {
    const m = App.voicePrefs().mode, clip = text === undefined ? App.hasRecordings() : !!App.clipFor(text);
    if (m === 'device') return App.voice ? 'device' : (clip ? 'clip' : null);
    if (m === 'auto') return clip ? 'clip' : (App.voice ? 'device' : null);
    return clip ? 'clip' : null;
  };
  App.canSpeak = text => !!App.engine(text);
  App.deviceVoiceMissing = () => App.voicePrefs().mode === 'device' && !App.voice;

  const player = (App.player = new Audio());
  player.preload = 'auto';
  let playToken = 0, curFin = null;
  App.stopSpeech = () => {
    playToken++;
    if (curFin) curFin(null);
    try { player.pause(); } catch (e) { }
    if ('speechSynthesis' in window) try { speechSynthesis.cancel(); } catch (e) { }
  };
  // iOS/Safari only lets audio start from a tap; "unlock" the shared player on the first touch.
  let unlocked = false;
  const unlock = () => {
    if (unlocked) return; unlocked = true;
    if (!App.clips) return;
    try { if (player.paused) { player.src = 'audio/silence.mp3'; player.muted = true; const pr = player.play(); const done = () => { if (/silence\.mp3$/.test(player.src)) { player.pause(); player.muted = false; } }; if (pr) pr.then(done, done); else done(); } } catch (e) { player.muted = false; }
  };
  document.addEventListener('pointerdown', unlock, { capture: true, once: true });
  document.addEventListener('keydown', unlock, { capture: true, once: true });

  function playClip(file, opts) {
    return new Promise(resolve => {
      if (curFin) curFin(null);
      const my = ++playToken;
      if ('speechSynthesis' in window) try { speechSynthesis.cancel(); } catch (e) { }
      let done = false;
      const fin = ok => { if (done) return; done = true; if (curFin === fin) { curFin = null; player.onended = player.onerror = null; } resolve(ok); };
      curFin = fin;
      try {
        player.pause(); player.muted = false;
        player.src = 'audio/' + file;
        const slow = opts.slow !== undefined ? opts.slow : App.voicePrefs().speed === 'slow';
        const rate = slow ? 0.7 : 1;
        if ('preservesPitch' in player) player.preservesPitch = true; else if ('webkitPreservesPitch' in player) player.webkitPreservesPitch = true;
        player.defaultPlaybackRate = rate; player.playbackRate = rate;
        player.onended = () => fin(true);
        player.onerror = () => fin(false);
        const pr = player.play();
        if (pr && pr.catch) pr.catch(err => { if (my === playToken) { console.warn('clip play failed', err && err.name); fin(false); } });
        setTimeout(() => fin(true), 90000);
      } catch (e) { fin(false); }
    });
  }
  function speakDevice(text, opts) {
    return new Promise(resolve => {
      if (!App.voice) return resolve(false);
      try {
        App.stopSpeech();
        const u = new SpeechSynthesisUtterance(text);
        const base = opts.rate || App.state.settings.rate || 0.8;
        u.voice = App.voice; u.lang = App.voice.lang || 'zh-CN'; u.rate = App.voicePrefs().speed === 'slow' ? Math.max(0.4, base * 0.7) : base; u.pitch = opts.pitch || 1;
        let done = false; const fin = () => { if (!done) { done = true; resolve(true); } };
        u.onend = fin; u.onerror = fin;
        setTimeout(fin, 1500 + text.length * 900);
        speechSynthesis.speak(u);
      } catch (e) { resolve(false); }
    });
  }
  /** Speak Chinese text. Resolves when done: true = played, false = no audio, null = interrupted by another sound. */
  App.say = (text, opts) => {
    opts = opts || {};
    const eng = App.engine(text);
    if (eng === 'clip') {
      const file = App.clipFor(text);
      return playClip(file, opts).then(ok => {
        if (ok === false && App.voicePrefs().mode === 'auto' && App.voice) return speakDevice(text, opts);
        return ok;
      });
    }
    if (eng === 'device') return speakDevice(text, opts);
    if (App.clips && !App.clipFor(text)) console.warn('no recording for', text);
    if (!opts.quiet) App.toast(App.voicePrefs().mode === 'recorded' && App.voice ? '🔇 No recording for this one. Try “Auto” in 🔊 voice settings.' : '🔇 No Chinese audio available. Read the pinyin instead!');
    return Promise.resolve(false);
  };
  App.speakBtn = (text, label) => '<button class="btn secondary small say" data-say="' + App.esc(text) + '" aria-label="Hear it">🔊 ' + (label || 'Hear it') + '</button>';
  document.addEventListener('click', e => { const b = e.target.closest('[data-say]'); if (b) { e.stopPropagation(); App.say(b.dataset.say); } }, true);

  /** Small voice picker used by the top-bar 🔊 button and the Grown-ups page. */
  App.voiceControlsHTML = () => {
    const vp = App.voicePrefs();
    const modes = App.VOICE_MODES.map(m => '<label class="vopt' + (vp.mode === m.k ? ' on' : '') + '"><input type="radio" name="vmode" value="' + m.k + '"' + (vp.mode === m.k ? ' checked' : '') + '> <b>' + m.name + '</b>' + (m.k === 'recorded' ? ' <small>(default)</small>' : '') + '<br><small class="sub">' + m.desc + '</small></label>').join('');
    let dev = '';
    if (App.zhVoices.length > 1) dev = '<label class="row mt">Device voice: <select id="vUri">' + App.zhVoices.map(v => '<option value="' + App.esc(v.voiceURI) + '"' + (App.voice && v.voiceURI === App.voice.voiceURI ? ' selected' : '') + '>' + App.esc(v.name + ' (' + v.lang + (v.localService ? '' : ', online') + ')') + '</option>').join('') + '</select></label>';
    else if (App.zhVoices.length === 1) dev = '<p class="sub mt">Device voice: <b>' + App.esc(App.voice.name) + '</b> (' + App.esc(App.voice.lang) + (App.voice.localService ? ', on-device' : ', may need internet') + ')</p>';
    const note = App.deviceVoiceMissing()
      ? '<p class="banner mt">⚠️ This device has no Chinese text-to-speech voice, so the <b>recorded voice</b> is used instead.' + (App.hasRecordings() ? '' : ' (Recordings could not be loaded either.)') + '</p>'
      : (!App.hasRecordings() && vp.mode !== 'device' ? '<p class="banner mt">⚠️ The recordings could not be loaded.' + (App.voice ? ' The device voice will be used.' : '') + '</p>' : '');
    return '<div class="vctl"><div class="vmodes">' + modes + '</div>' + dev + note +
      '<div class="row mt"><span>Speed:</span><div class="seg" role="group" aria-label="Speech speed"><button data-vspeed="normal" class="' + (vp.speed === 'normal' ? 'on' : '') + '">🐇 Normal</button><button data-vspeed="slow" class="' + (vp.speed === 'slow' ? 'on' : '') + '">🐢 Slow</button></div>' +
      '<button class="btn secondary small" data-say="你好！我们一起学中文吧！">🔊 Test</button></div></div>';
  };
  App.bindVoiceControls = (root, rerender) => {
    App.$$('input[name=vmode]', root).forEach(r => r.onchange = () => { App.setVoicePrefs({ mode: r.value }); rerender(); });
    const sel = App.$('#vUri', root); if (sel) sel.onchange = () => { App.setVoicePrefs({ uri: sel.value }); };
    App.$$('[data-vspeed]', root).forEach(b => b.onclick = () => { App.setVoicePrefs({ speed: b.dataset.vspeed }); rerender(); });
  };
  App.openVoicePanel = () => {
    App.modal('<h2>🔊 Voice</h2><div id="vpanel"></div><div class="center mt"><button class="btn" id="vClose">Done</button></div>', (m, close) => {
      const draw = () => { App.$('#vpanel', m).innerHTML = App.voiceControlsHTML(); App.bindVoiceControls(m, draw); };
      draw(); App.$('#vClose', m).onclick = close;
    });
  };

  /* ---------- recorder (stays on this device) ---------- */
  App.rec = {
    supported: () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder),
    stream: null, mr: null,
    async start() {
      if (!this.stream) this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks = []; this.mr = new MediaRecorder(this.stream);
      this.mr.ondataavailable = e => e.data.size && chunks.push(e.data);
      const done = new Promise(res => { this.mr.onstop = () => res(new Blob(chunks, { type: this.mr.mimeType || 'audio/webm' })); });
      this.mr.start(); return done;
    },
    stop() { if (this.mr && this.mr.state !== 'inactive') this.mr.stop(); },
    release() { if (this.stream) { this.stream.getTracks().forEach(t => t.stop()); this.stream = null; } },
  };
  /* Tiny IndexedDB store for recordings the kid chooses to keep (never uploaded). */
  App.idb = {
    db: null,
    open() {
      if (this.db) return Promise.resolve(this.db);
      return new Promise((res, rej) => {
        const r = indexedDB.open('panda-passport-recordings', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('takes');
        r.onsuccess = () => { this.db = r.result; res(this.db); }; r.onerror = () => rej(r.error);
      });
    },
    async put(key, blob) { const db = await this.open(); return new Promise((res, rej) => { const tx = db.transaction('takes', 'readwrite'); tx.objectStore('takes').put(blob, key); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); },
    async get(key) { const db = await this.open(); return new Promise((res) => { const r = db.transaction('takes').objectStore('takes').get(key); r.onsuccess = () => res(r.result || null); r.onerror = () => res(null); }); },
    async count() { const db = await this.open(); return new Promise((res) => { const r = db.transaction('takes').objectStore('takes').count(); r.onsuccess = () => res(r.result); r.onerror = () => res(0); }); },
    async clear() { const db = await this.open(); return new Promise((res) => { const tx = db.transaction('takes', 'readwrite'); tx.objectStore('takes').clear(); tx.oncomplete = res; tx.onerror = res; }); },
  };

  /* ---------- tone contour icons ---------- */
  App.TONES = [
    { n: 1, name: '1st', desc: 'high & flat', mark: 'ā', path: 'M6 8 L54 8' },
    { n: 2, name: '2nd', desc: 'rising', mark: 'á', path: 'M6 30 L54 6' },
    { n: 3, name: '3rd', desc: 'dip down & up', mark: 'ǎ', path: 'M6 16 Q24 40 34 30 T54 10' },
    { n: 4, name: '4th', desc: 'falling', mark: 'à', path: 'M6 6 L54 32' },
    { n: 0, name: 'neutral', desc: 'light & short', mark: 'a', path: 'M26 20 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0' },
  ];
  App.toneSVG = n => { const t = App.TONES.find(x => x.n === n); const col = ['--t0', '--t1', '--t2', '--t3', '--t4'][n];
    return '<svg viewBox="0 0 60 38" aria-hidden="true"><path d="' + t.path + '" fill="' + (n ? 'none' : 'var(' + col + ')') + '" stroke="var(' + col + ')" stroke-width="5" stroke-linecap="round"/></svg>'; };
})();
