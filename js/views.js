/* Panda Passport: screens (home map, unit, passport, theater list, grown-ups) and router. */
(function () {
  'use strict';
  const App = window.App, C = App.C, esc = App.esc;
  App.ACTS = [
    { k: 'flash', ico: '🃏', name: 'Flashcards', zh: '闪卡', desc: 'Flip and learn the words', bg: '#fff0f0' },
    { k: 'tones', ico: '🎵', name: 'Tone Trainer', zh: '声调', desc: 'Hear or spot the four tones', bg: '#fff4e0' },
    { k: 'match', ico: '🧩', name: 'Matching', zh: '配对', desc: 'Pair characters with meanings', bg: '#fffbe0' },
    { k: 'write', ico: '🖌️', name: 'Stroke Order', zh: '写字', desc: 'Watch, trace, then write', bg: '#eafbea' },
    { k: 'build', ico: '🧱', name: 'Sentence Builder', zh: '造句', desc: 'Drag words into order', bg: '#e7f5ff' },
    { k: 'read', ico: '📖', name: 'Story Time', zh: '阅读', desc: 'Read a story, answer questions', bg: '#f3f0ff' },
    { k: 'roleplay', ico: '🎭', name: 'Role-Play', zh: '演一演', desc: 'Act a scene and record yourself', bg: '#fff0f6' },
    { k: 'challenge', ico: '🏆', name: 'City Challenge', zh: '挑战', desc: 'Score 6/8 to unlock the next city', bg: '' },
  ];
  // Display nudges so close cities don't overlap (pins stay within a few px of the real spot).
  const NUDGE = { food: [-15, -10], places: [13, 7], body: [-10, 13], feelings: [10, -4] };
  const LABEL = { greet: [26, 6, 'start'], numbers: [-26, 6, 'end'], animals: [-26, 6, 'end'], family: [0, 46, 'middle'], colors: [-26, 6, 'end'],
    food: [-26, 4, 'end'], places: [26, 10, 'start'], body: [26, 16, 'start'], feelings: [26, 0, 'start'], school: [-24, -12, 'end'],
    hobbies: [26, 6, 'start'], weather: [26, 6, 'start'] };

  function cityXY(id) { const [x, y] = window.MAPDATA.cities[id]; const n = NUDGE[id] || [0, 0]; return [x + n[0], y + n[1]]; }

  /* ---------- top bar ---------- */
  App.renderTop = () => {
    const p = App.profile(), bar = App.$('#topright');
    if (!p) { bar.innerHTML = ''; return; }
    bar.innerHTML =
      '<span class="pill" title="Stars">⭐ ' + p.stars + '</span>' +
      '<span class="pill" title="Days in a row">🔥 ' + (p.streak.last >= App.today() - 1 ? p.streak.count : 0) + '</span>' +
      '<button class="iconbtn" id="voiceBtn" aria-label="Voice settings" title="Voice: ' + esc((App.VOICE_MODES.find(m => m.k === App.voicePrefs().mode) || {}).name || '') + (App.voicePrefs().speed === 'slow' ? ', slow' : '') + '">' + (App.voicePrefs().speed === 'slow' ? '🐢' : '🔊') + '</button>' +
      '<button class="iconbtn" id="whoBtn" aria-label="Switch explorer" title="Switch explorer">' + esc(p.avatar) + '</button>';
    App.$('#whoBtn').onclick = () => { location.hash = '#/who'; };
    App.$('#voiceBtn').onclick = () => App.openVoicePanel();
  };

  /* ---------- home ---------- */
  App.views = {};
  App.views.home = root => {
    const p = App.profile(), M = window.MAPDATA, cur = App.currentUnit();
    const pts = C.units.map(u => cityXY(u.id));
    let route = '';
    for (let i = 1; i < pts.length; i++) {
      const done = p.passed[C.units[i - 1].id];
      const [x1, y1] = pts[i - 1], [x2, y2] = pts[i];
      const mx = (x1 + x2) / 2 + (y2 - y1) * 0.15, my = (y1 + y2) / 2 - (x2 - x1) * 0.15;
      route += '<path class="route' + (done ? ' done' : '') + '" d="M' + x1 + ' ' + y1 + ' Q' + mx + ' ' + my + ' ' + x2 + ' ' + y2 + '"/>';
    }
    const pins = C.units.map((u, i) => {
      const [x, y] = pts[i], un = App.isUnlocked(u.id), passed = p.passed[u.id], isCur = un && u.id === cur.id && !passed;
      const [lx, ly, anc] = LABEL[u.id];
      return '<g class="pin' + (un ? '' : ' locked') + (isCur ? ' current' : '') + '" data-unit="' + u.id + '" role="button" tabindex="0" aria-label="' + esc(u.city.en + ': ' + u.en + (un ? '' : ' (locked)')) + '">' +
        (isCur ? '<circle class="ring" cx="' + x + '" cy="' + y + '" r="20" fill="' + u.color + '"/>' : '') +
        '<circle class="base" cx="' + x + '" cy="' + y + '" r="20" fill="' + (un ? u.color : '#c7c3bc') + '"/>' +
        '<text x="' + x + '" y="' + (y + 7) + '" text-anchor="middle" font-size="20">' + (passed ? '✅' : un ? u.emoji : '🔒') + '</text>' +
        '<text class="lbl" x="' + (x + lx) + '" y="' + (y + ly) + '" text-anchor="' + anc + '">' + esc(u.city.hz) + '</text>' +
        '<text class="lbl2" x="' + (x + lx) + '" y="' + (y + ly + 18) + '" text-anchor="' + anc + '">' + (i + 1) + '. ' + esc(u.city.en) + '</text></g>';
    }).join('');
    const due = App.dueWords().length, newN = Math.min(4, App.newWords().length);
    const stamps = Object.keys(p.passed).length;
    root.innerHTML =
      '<div class="home"><div class="card mapwrap">' +
      '<h1 style="margin:4px 8px">' + esc(p.avatar) + ' ' + esc(p.name) + '’s Journey across China <span class="sub" style="font-size:1rem">中国之旅</span></h1>' +
      '<svg viewBox="0 0 ' + M.w + ' ' + M.h + '" role="img" aria-label="Map of China with 12 cities to visit">' +
      '<rect class="map-sea" width="' + M.w + '" height="' + M.h + '"/><path class="map-land" d="' + M.land + '"/>' + route + pins + '</svg>' +
      '<p class="sub" style="margin:8px">Tap a city to start. Pass its 🏆 City Challenge to earn a passport stamp and unlock the next city.</p></div>' +
      '<div class="side">' +
      '<button class="bigaction" data-go="#/unit/' + cur.id + '"><span class="ico" style="background:' + cur.color + '33">' + cur.emoji + '</span><span><b>Continue: ' + esc(cur.city.en) + '</b><small>' + esc(cur.en) + ' · ' + esc(cur.zh) + '</small></span></button>' +
      '<button class="bigaction" data-go="#/daily"><span class="ico" style="background:#e7f5ff">📅</span><span><b>Daily Mix</b><small>Review words at just the right time</small></span>' + (due + newN ? '<span class="badge-count">' + (due + newN) + '</span>' : '') + '</button>' +
      '<button class="bigaction" data-go="#/play/tones/all"><span class="ico" style="background:#fff4e0">🎵</span><span><b>Tone Gym</b><small>Train your ears for the 4 tones</small></span></button>' +
      '<button class="bigaction" data-go="#/theater"><span class="ico" style="background:#fff0f6">🎭</span><span><b>Role-Play Theater</b><small>7 scenes to act out and record</small></span></button>' +
      '<button class="bigaction" data-go="#/passport"><span class="ico" style="background:#fff3bf">🛂</span><span><b>Passport & Badges</b><small>' + stamps + '/12 stamps · ' + Object.keys(p.badges).length + '/' + App.BADGES.length + ' badges</small></span></button>' +
      '<div class="card"><b>📊 My numbers</b><table class="stats"><tr><td>Words learned</td><td><b>' + App.learnedCount() + '</b> / ' + C.words.length + '</td></tr>' +
      '<tr><td>Stars</td><td><b>' + p.stars + '</b></td></tr><tr><td>Day streak</td><td><b>' + (p.streak.last >= App.today() - 1 ? p.streak.count : 0) + '</b></td></tr></table></div>' +
      '<button class="btn secondary small" data-go="#/parent" style="width:100%">👪 Grown-ups</button></div></div>';
    App.$$('.pin', root).forEach(g => {
      const go = () => { const id = g.dataset.unit; if (App.isUnlocked(id)) location.hash = '#/unit/' + id; else { App.sfx('bad'); App.toast('🔒 Pass the City Challenge in ' + C.units[App.unitIndex(id) - 1].city.en + ' first!'); } };
      g.addEventListener('click', go); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
  };

  /* ---------- unit ---------- */
  App.views.unit = (root, id) => {
    const u = App.unitById[id]; if (!u) return App.go('#/');
    if (!App.isUnlocked(id)) { App.toast('🔒 This city is still locked.'); return App.go('#/'); }
    const p = App.profile(), words = App.unitWords(id);
    const hasScene = C.dialogues.some(d => d.unit === id);
    const acts = App.ACTS.map(a => {
      const best = p.best[id + ':' + a.k] || 0;
      const target = a.k === 'roleplay' && !hasScene ? '#/theater' : '#/play/' + a.k + '/' + id;
      const desc = a.k === 'roleplay' && !hasScene ? 'Open the Role-Play Theater' : a.desc;
      return '<button class="act' + (a.k === 'challenge' ? ' challenge' : '') + '" style="' + (a.bg ? 'background:' + a.bg : '') + '" data-go="' + target + '">' +
        '<span class="stars" aria-label="' + best + ' stars">' + (a.k === 'challenge' && p.passed[id] ? '🛂 ' : '') + App.starsText(best) + '</span>' +
        '<span class="ico">' + a.ico + '</span><b>' + a.name + ' <span class="sub">' + a.zh + '</span></b><small>' + desc + '</small></button>';
    }).join('');
    root.innerHTML =
      '<a class="back" href="#/">← Map</a>' +
      '<div class="unit-hero" style="background:linear-gradient(135deg,' + u.color + ',' + u.color + 'cc)"><span class="em">' + u.emoji + '</span><div>' +
      '<div class="zh">Stop ' + (App.unitIndex(id) + 1) + ': ' + esc(u.city.hz) + ' ' + esc(u.city.py) + ' · ' + esc(u.city.en) + '</div>' +
      '<h1>' + esc(u.en) + ' · ' + esc(u.zh) + '</h1><div class="zh">' + esc(u.py) + '</div></div></div>' +
      '<div class="fact">🗺️ <b>City fact:</b> ' + esc(u.city.fact) + '</div>' +
      '<div class="grid g3">' + acts + '</div>' +
      '<h2 class="mt">Words in this unit (' + words.length + ')</h2><div class="wordchips tc">' +
      words.map(w => '<button class="chip" data-say="' + esc(w.hz) + '" title="' + esc(w.en) + '"><span class="h">' + esc(w.hz) + '</span><span class="p">' + App.pyHTML(w.py) + '</span><span class="p sub">' + esc(w.en) + '</span></button>').join('') + '</div>';
  };

  /* ---------- theater ---------- */
  App.views.theater = root => {
    root.innerHTML = '<a class="back" href="#/">← Map</a><h1>🎭 Role-Play Theater <span class="sub">演一演</span></h1>' +
      '<p class="sub">Pick a scene, choose your part, and act it out! The app plays the other part. Record your lines and play the whole scene back. Recordings stay on this device.</p>' +
      '<div class="grid g3 scene-list">' + C.dialogues.map(d => {
        const best = App.profile().best['scene:' + d.id] || 0;
        return '<button class="act" data-go="#/scene/' + d.id + '"><span class="stars">' + App.starsText(best) + '</span><span class="ico">' + d.emoji + '</span><b>' + esc(d.en) + '</b><small>' + esc(d.title) + ' ' + esc(d.py) + ' · ' + d.lines.length + ' lines</small></button>';
      }).join('') + '</div>';
  };

  /* ---------- passport ---------- */
  App.views.passport = root => {
    const p = App.profile();
    root.innerHTML = '<a class="back" href="#/">← Map</a><h1>🛂 ' + esc(p.name) + '’s Passport <span class="sub">护照</span></h1>' +
      '<div class="stamps">' + C.units.map(u => {
        const got = p.passed[u.id];
        return '<div class="stamp' + (got ? ' got' : '') + '" style="' + (got ? 'background:' + u.color + ';border-color:' + u.color : '') + '"><span class="hz">' + esc(u.city.hz) + '</span><span>' + esc(u.city.en) + '</span><span>' + (got ? u.emoji + ' ✓' : '…') + '</span></div>';
      }).join('') + '</div><h2 class="mt">🏅 Badges</h2><div class="badges">' +
      App.BADGES.map(b => '<div class="badge' + (p.badges[b.id] ? ' got' : '') + '"><div class="e">' + b.e + '</div><b>' + esc(b.name) + '</b><div class="sub" style="font-size:.85rem">' + esc(b.desc) + '</div></div>').join('') + '</div>';
  };

  /* ---------- profiles ---------- */
  App.views.who = root => {
    const ps = Object.values(App.state.profiles);
    root.innerHTML = '<h1>Who is exploring today? 🧭</h1><div class="grid g3">' +
      ps.map(p => '<button class="act" data-pid="' + p.id + '"><span class="ico">' + esc(p.avatar) + '</span><b>' + esc(p.name) + '</b><small>⭐ ' + p.stars + ' · 🛂 ' + Object.keys(p.passed).length + '/12</small></button>').join('') +
      (ps.length < 4 ? '<button class="act" id="addP"><span class="ico">➕</span><b>New explorer</b><small>Up to 4 on this device</small></button>' : '') + '</div>';
    App.$$('[data-pid]', root).forEach(b => b.onclick = () => { App.state.current = b.dataset.pid; App.save(); App.go('#/'); });
    const add = App.$('#addP', root); if (add) add.onclick = () => App.go('#/welcome');
  };
  App.views.welcome = root => {
    let av = '🐼';
    root.innerHTML = '<div class="card stage center" style="max-width:620px"><div style="font-size:4rem">🐼🏮</div><h1>Welcome to Panda Passport!</h1><p>欢迎！Huānyíng! Travel across China, one city at a time, and learn Mandarin on the way.</p>' +
      '<label for="nm"><b>What should we call you?</b></label><input id="nm" type="text" maxlength="16" placeholder="Your nickname" autocomplete="off">' +
      '<p class="mt"><b>Pick your travel buddy:</b></p><div class="avatars" style="justify-content:center">' + App.AVATARS.map(a => '<button data-av="' + a + '" class="' + (a === av ? 'on' : '') + '">' + a + '</button>').join('') + '</div>' +
      '<button class="btn green mt" id="startBtn" style="width:100%">Start my journey 🚀</button><p class="sub" style="font-size:.85rem">Your progress is saved only in this browser. Nothing is sent anywhere.</p></div>';
    App.$$('[data-av]', root).forEach(b => b.onclick = () => { av = b.dataset.av; App.$$('[data-av]', root).forEach(x => x.classList.toggle('on', x === b)); });
    App.$('#startBtn', root).onclick = () => { const n = App.$('#nm', root).value.trim() || 'Explorer'; App.addProfile(n, av); App.go('#/'); };
  };

  /* ---------- grown-ups ---------- */
  let gateOK = false;
  App.views.parent = root => {
    if (!gateOK) {
      const a = 6 + Math.floor(Math.random() * 7), b = 6 + Math.floor(Math.random() * 7);
      root.innerHTML = '<a class="back" href="#/">← Map</a><div class="card stage center" style="max-width:480px"><h1>👪 Grown-ups only</h1><p>What is <b>' + a + ' × ' + b + '</b>?</p><input id="gate" type="number" inputmode="numeric"><button class="btn mt" id="gateBtn">Enter</button></div>';
      const chk = () => { if (+App.$('#gate', root).value === a * b) { gateOK = true; App.views.parent(root); } else { App.sfx('bad'); App.toast('Not quite!'); } };
      App.$('#gateBtn', root).onclick = chk; App.$('#gate', root).addEventListener('keydown', e => e.key === 'Enter' && chk());
      return;
    }
    const s = App.state.settings, p = App.profile();
    const deviceHelp = App.zhVoices.length ? '' : '<p class="sub" style="font-size:.85rem">No Chinese text-to-speech voice was found on this device (that’s fine: the recorded voice works everywhere). To add one for “Device voice”: <b>iPad/iPhone</b> Settings › Accessibility › Spoken Content › Voices › Chinese; <b>Android</b> Settings › Text-to-speech › install Chinese; <b>Windows</b> Settings › Time & Language › Speech › add Chinese; <b>Mac</b> System Settings › Accessibility › Spoken Content › System voice › Manage Voices.</p>';
    const ai = App.audioInfo;
    const audioInfo = ai ? '<p class="sub" style="font-size:.85rem">Recorded voice: ' + (ai.count || Object.keys(App.clips || {}).length) + ' clips' + (ai.bytes ? ' (' + (ai.bytes / 1048576).toFixed(1) + ' MB)' : '') + ', made with ' + esc(ai.engine || 'an open-source voice') + '. <span id="offAudio"></span></p>' : '';
    const rows = C.units.map(u => {
      const st = App.ACTS.reduce((n, a) => n + (p.best[u.id + ':' + a.k] || 0), 0);
      const learned = App.unitWords(u.id).filter(w => (p.srs[w.id] || {}).b >= 2).length;
      return '<tr><td>' + u.emoji + ' ' + esc(u.city.en) + ' · ' + esc(u.en) + '</td><td>' + (p.passed[u.id] ? '🛂' : App.isUnlocked(u.id) ? '🔓' : '🔒') + '</td><td>' + st + '</td><td>' + learned + '/' + u.words.length + '</td></tr>';
    }).join('');
    root.innerHTML = '<a class="back" href="#/">← Map</a><h1>👪 Grown-ups</h1>' +
      '<div class="grid g2"><div class="card"><h2>' + esc(p.avatar + ' ' + p.name) + '</h2><table class="stats"><tr><th>City · Unit</th><th></th><th>★ best</th><th>Learned</th></tr>' + rows + '</table>' +
      '<p class="sub">Words count as “learned” after being answered correctly at least twice in a row with spacing.</p></div>' +
      '<div><div class="card mb"><h2>Settings</h2>' +
      '<label class="row"><input type="checkbox" id="sSound" ' + (s.sound ? 'checked' : '') + '> Sound effects</label>' +
      '<label class="row"><input type="checkbox" id="sTone" ' + (s.toneColors ? 'checked' : '') + '> Color pinyin by tone (1 red · 2 green · 3 blue · 4 purple)</label>' +
      '<label class="row"><input type="checkbox" id="sUnlock" ' + (s.unlockAll ? 'checked' : '') + '> Unlock all cities</label>' +
      '<label class="row"><input type="checkbox" id="sKeep" ' + (s.keepRecordings ? 'checked' : '') + '> Keep role-play recordings on this device (IndexedDB) between visits</label>' +
      '</div><div class="card mb"><h2>🔊 Voice <small class="sub">(saved for ' + esc(p.name) + ')</small></h2><div id="voiceCard">' + App.voiceControlsHTML() + '</div>' +
      '<label class="mt" style="display:block">Device voice speed: <input type="range" id="sRate" min="0.5" max="1.1" step="0.1" value="' + s.rate + '"> <span id="rateV">' + s.rate + '</span></label>' + audioInfo + deviceHelp + '</div>' +
      '<div class="card mb"><h2>Progress file</h2><p class="sub">Save progress to a file, or move it to another device.</p><div class="row">' +
      '<button class="btn small" id="exp">⬇️ Export JSON</button><label class="btn secondary small" style="cursor:pointer">⬆️ Import JSON<input type="file" id="imp" accept="application/json,.json" class="hidden"></label></div></div>' +
      '<div class="card"><h2>Reset</h2><div class="row"><button class="btn red small" id="rst">Reset ' + esc(p.name) + '’s progress</button>' +
      '<button class="btn secondary small" id="delP">Delete this explorer</button><button class="btn secondary small" id="delRec">🗑️ Delete saved recordings <span id="recN"></span></button></div>' +
      '<p class="sub" style="font-size:.85rem">Privacy: everything stays in this browser. No accounts, no analytics, no network requests after the first load. Microphone audio is never uploaded.</p></div></div></div>';
    const set = (k, v) => { s[k] = v; App.save(); };
    App.$('#sSound', root).onchange = e => set('sound', e.target.checked);
    App.$('#sTone', root).onchange = e => { set('toneColors', e.target.checked); document.body.classList.toggle('tc', e.target.checked); };
    App.$('#sUnlock', root).onchange = e => set('unlockAll', e.target.checked);
    App.$('#sKeep', root).onchange = e => set('keepRecordings', e.target.checked);
    const drawVoice = () => { const vc = App.$('#voiceCard', root); if (!vc) return; vc.innerHTML = App.voiceControlsHTML(); App.bindVoiceControls(vc, drawVoice); App.renderTop(); };
    App.bindVoiceControls(App.$('#voiceCard', root), drawVoice);
    const onVoices = () => drawVoice(); document.addEventListener('voices', onVoices); App.cleanup.push(() => document.removeEventListener('voices', onVoices));
    if (window.caches && App.audioInfo) caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('panda-passport-')).map(k => caches.open(k).then(c => c.keys())))).then(lists => {
      const n = new Set(lists.flat().map(r => r.url).filter(u => /\/audio\/[^/]+\.mp3$/.test(u))).size, el = App.$('#offAudio', root);
      if (el) el.textContent = n >= (App.audioInfo.count || 1) ? '✅ All saved for offline use.' : n ? '⏳ ' + n + ' saved for offline so far (the rest download in the background).' : '';
    }).catch(() => {});
    App.$('#sRate', root).oninput = e => { set('rate', +e.target.value); App.$('#rateV', root).textContent = e.target.value; };
    App.$('#exp', root).onclick = () => {
      const blob = new Blob([App.exportJSON()], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'panda-passport-progress-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    };
    App.$('#imp', root).onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then(t => { try { App.importJSON(t); App.toast('✅ Progress imported'); App.go('#/'); } catch (err) { alert(err.message); } });
    };
    App.$('#rst', root).onclick = () => { if (confirm('Reset all progress for ' + p.name + '? This cannot be undone (export first if unsure).')) { App.resetProfile(p.id); App.toast('Progress reset'); App.views.parent(root); App.renderTop(); } };
    App.$('#delP', root).onclick = () => {
      if (!confirm('Delete explorer ' + p.name + ' and all their progress?')) return;
      delete App.state.profiles[p.id]; App.state.current = Object.keys(App.state.profiles)[0] || null; App.save(); App.go(App.state.current ? '#/' : '#/welcome');
    };
    App.$('#delRec', root).onclick = () => App.idb.clear().then(() => { App.toast('Recordings deleted'); App.$('#recN', root).textContent = '(0)'; });
    if (window.indexedDB) App.idb.count().then(n => { const el = App.$('#recN', root); if (el) el.textContent = '(' + n + ')'; }).catch(() => {});
  };

  /* ---------- router ---------- */
  App.go = h => { if (location.hash === h) App.route(); else location.hash = h; };
  App.cleanup = [];
  App.route = () => {
    App.cleanup.forEach(f => { try { f(); } catch (e) { } }); App.cleanup = [];
    App.stopSpeech();
    App.$$('.confetti, .popup').forEach(n => n.remove());
    const root = App.$('#app');
    const parts = (location.hash || '#/').replace(/^#\/?/, '').split('/').filter(Boolean);
    if (!App.profile() && parts[0] !== 'welcome') { location.replace('#/welcome'); return; }
    const [v, a, b] = parts;
    window.scrollTo(0, 0);
    try {
      if (!v) App.views.home(root);
      else if (v === 'unit') App.views.unit(root, a);
      else if (v === 'play' && App.acts[a]) { if (b !== 'all' && !App.isUnlocked(b)) return App.go('#/'); App.acts[a](root, b); }
      else if (v === 'daily') App.acts.daily(root);
      else if (v === 'scene') App.acts.scene(root, a);
      else if (App.views[v]) App.views[v](root, a);
      else App.views.home(root);
    } catch (e) { console.error(e); root.innerHTML = '<div class="card">Oops, something went wrong. <a href="#/">Back to the map</a></div>'; }
    App.renderTop();
  };
  document.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g) { App.sfx('tap'); App.go(g.dataset.go); } });

  /* ---------- boot ---------- */
  window.addEventListener('DOMContentLoaded', () => {
    App.load(); App.initVoices();
    document.body.classList.toggle('tc', App.state.settings.toneColors);
    window.addEventListener('hashchange', App.route);
    App.initAudio().then(() => App.route());
    const net = () => { const d = App.$('#netdot'); if (d) { d.style.background = navigator.onLine ? 'var(--green)' : 'var(--orange)'; d.title = navigator.onLine ? 'Online' : 'Offline mode: everything still works'; } };
    window.addEventListener('online', net); window.addEventListener('offline', net); net();
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('./sw.js').then(r => { App.swReady = true; window.__swScope = r.scope; }).catch(err => console.warn('SW registration failed', err));
    }
  });
})();
