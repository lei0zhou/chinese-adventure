/* Panda Passport: activities. Every activity is scripted and runs fully offline. */
(function () {
  'use strict';
  const App = window.App, C = App.C, esc = App.esc, $ = App.$, $$ = App.$$;
  const acts = (App.acts = {});

  /* ---------- shared helpers ---------- */
  const scopeWords = scope => scope && scope !== 'all' ? App.unitWords(scope) : App.unlockedUnits().flatMap(u => App.unitWords(u.id));
  const backLink = scope => '<a class="back" href="' + (scope && scope !== 'all' ? '#/unit/' + scope : '#/') + '">← ' + (scope && scope !== 'all' ? App.unitById[scope].city.en : 'Map') + '</a>';
  const header = (scope, ico, title, zh) => backLink(scope) + '<h1>' + ico + ' ' + title + ' <span class="sub">' + zh + '</span></h1>';
  const progress = (i, n) => '<div class="progress" aria-label="Progress"><i style="width:' + Math.round(100 * i / n) + '%"></i></div>';
  const voiceBanner = () => App.canSpeak() ? '' : '<div class="banner">🔇 Chinese audio isn’t available right now (the recordings didn’t load and this device has no Chinese voice). You can still play using pinyin. Try reloading the page, or see 👪 Grown-ups › Voice.</div>';

  function distractors(w, n, field, pool) {
    pool = (pool && pool.length > 8 ? pool : C.words).filter(x => x.id !== w.id && x[field] !== w[field] && x.hz !== w.hz);
    const same = App.shuffle(pool.filter(x => x.unit === w.unit)), other = App.shuffle(pool.filter(x => x.unit !== w.unit));
    const out = [], seen = new Set([w[field]]);
    for (const x of same.concat(other)) { if (!seen.has(x[field])) { seen.add(x[field]); out.push(x); } if (out.length >= n) break; }
    return out;
  }
  /** Build a multiple-choice question about word w. type: hz2en | en2hz | py2hz | listen | tone */
  function makeQ(w, type, pool, opts) {
    opts = opts || {};
    if (type === 'listen' && !App.canSpeak(w.hz)) type = 'py2hz';
    if (type === 'tone' && !(w.hz.length === 1 && App.toneOf(w.py))) type = 'hz2en';
    const q = { word: w, type };
    if (type === 'tone') {
      const t = App.toneOf(w.py);
      q.prompt = '<div class="hz">' + esc(w.hz) + '</div><div class="big">' + esc(App.stripTone(w.py)) + ' = ?</div><div class="sub">' + esc(w.en) + ' · Which tone?</div>';
      q.speak = w.hz;
      q.options = [1, 2, 3, 4].map(n => ({ html: App.toneSVG(n) + '<div>' + App.TONES[n - 1].name + ' tone</div>', correct: n === t }));
      q.reveal = App.pyHTML(w.py);
      return q;
    }
    const field = type === 'hz2en' ? 'en' : 'hz';
    const ds = distractors(w, 3, field, pool);
    const all = App.shuffle([w].concat(ds));
    if (type === 'hz2en') {
      q.prompt = '<div class="hz">' + esc(w.hz) + '</div>' + (opts.showPy ? '<div class="big tc">' + App.pyHTML(w.py) + '</div>' : '') + '<div class="sub">What does it mean?</div>';
      q.options = all.map(x => ({ html: esc(x.en), correct: x.id === w.id }));
      q.speak = w.hz;
    } else if (type === 'en2hz') {
      q.prompt = '<div style="font-size:3rem">' + w.emoji + '</div><div class="big">“' + esc(w.en) + '”</div><div class="sub">Which one is it in Chinese?</div>';
      q.options = all.map(x => ({ html: '<span class="hz">' + esc(x.hz) + '</span>', correct: x.id === w.id }));
    } else if (type === 'py2hz') {
      q.prompt = '<div class="big tc" style="font-size:2.6rem">' + App.pyHTML(w.py) + '</div><div class="sub">Which characters match this pinyin?</div>';
      q.options = all.map(x => ({ html: '<span class="hz">' + esc(x.hz) + '</span>', correct: x.id === w.id }));
    } else if (type === 'listen') {
      q.prompt = '<button class="btn orange" data-say="' + esc(w.hz) + '" style="font-size:1.6rem;min-height:90px;padding:0 40px">🔊 Listen</button><div class="sub mt">Tap what you hear</div>';
      q.options = all.map(x => ({ html: '<span class="hz">' + esc(x.hz) + '</span>', correct: x.id === w.id }));
      q.autoSpeak = w.hz;
    }
    q.reveal = esc(w.hz) + ' · ' + App.pyHTML(w.py) + ' · ' + esc(w.en);
    return q;
  }

  /** Generic multiple-choice runner. */
  function runQuiz(root, cfg) {
    const qs = cfg.questions; let i = 0, score = 0;
    const box = document.createElement('div'); root.appendChild(box);
    function show() {
      const q = qs[i]; let answered = false; App._q = q; /* exposed for tools/verify.mjs */
      box.innerHTML = progress(i, qs.length) + '<div class="q-prompt tc">' + q.prompt + '</div>' +
        '<div class="options ' + (q.type === 'tone' ? 'tone-btns' : '') + '">' + q.options.map((o, k) => '<button class="opt" data-k="' + k + '">' + o.html + '</button>').join('') + '</div>' +
        '<div class="feedback" aria-live="polite"></div><div class="center"><button class="btn hidden" id="nextQ">Next ▶</button></div>';
      if (q.autoSpeak) setTimeout(() => App.say(q.autoSpeak, { quiet: true }), 250);
      $$('.opt', box).forEach(b => b.onclick = () => {
        if (answered) return; answered = true;
        const o = q.options[+b.dataset.k], fb = $('.feedback', box);
        $$('.opt', box).forEach((x, k) => { if (q.options[k].correct) x.classList.add('right'); });
        if (o.correct) { score++; App.sfx('good'); b.classList.add('right'); fb.className = 'feedback good tc'; fb.innerHTML = App.pick(['好棒！Great!', '对了！Correct!', '真厉害！Awesome!', '太好了！'], 1)[0] + ' ' + (q.reveal ? '· ' + q.reveal : ''); }
        else { App.sfx('bad'); b.classList.add('wrong'); fb.className = 'feedback bad tc'; fb.innerHTML = 'Not quite. ' + (q.reveal ? 'Answer: ' + q.reveal : ''); }
        if (q.word && !cfg.noSrs) App.srsGrade(q.word.id, o.correct);
        if (q.speak && App.canSpeak()) App.say(q.speak, { quiet: true });
        if (cfg.onAnswer) cfg.onAnswer(q, o.correct);
        const nb = $('#nextQ', box); nb.classList.remove('hidden'); nb.focus();
        nb.onclick = () => { i++; if (i < qs.length) show(); else cfg.onDone(score, qs.length); };
      });
    }
    show();
  }
  App.runQuiz = runQuiz;

  function doneScreen(root, o) {
    if (o.stars >= 2) { App.confetti(); App.sfx('win'); }
    root.innerHTML = (o.back || '') + '<div class="card done-box stage"><div style="font-size:3.5rem">' + (o.emoji || (o.stars >= 3 ? '🏆' : o.stars >= 2 ? '🎉' : '💪')) + '</div>' +
      '<h1>' + (o.title || (o.stars >= 3 ? '太棒了！Amazing!' : o.stars >= 2 ? '很好！Great job!' : '加油！Keep going!')) + '</h1>' +
      (o.total ? '<p style="font-size:1.3rem">You got <b>' + o.score + ' / ' + o.total + '</b></p>' : '') +
      '<div class="big-stars" aria-label="' + o.stars + ' stars">' + App.starsText(o.stars) + '</div>' + (o.extra || '') +
      '<div class="row mt" style="justify-content:center"><button class="btn" id="againBtn">🔁 Play again</button><button class="btn secondary" data-go="' + (o.backHash || '#/') + '">Done</button></div></div>';
    $('#againBtn', root).onclick = o.again;
    App.renderTop();
  }

  /* ---------- 🃏 flashcards ---------- */
  acts.flash = (root, scope) => {
    const deck = App.shuffle(scopeWords(scope)).slice(0, scope === 'all' ? 15 : 30);
    let i = 0, known = 0, front = acts.flash.front || 'hz';
    const again = [];
    root.innerHTML = header(scope, '🃏', 'Flashcards', '闪卡') + voiceBanner() +
      '<div class="stage"><div class="row" style="justify-content:space-between"><div class="seg" role="group" aria-label="Card front">' +
      [['hz', '汉字 first'], ['py', 'Pinyin first'], ['en', 'English first']].map(([k, l]) => '<button data-front="' + k + '" class="' + (k === front ? 'on' : '') + '">' + l + '</button>').join('') +
      '</div><span class="sub" id="cnt"></span></div><div id="fc"></div></div>';
    $$('[data-front]', root).forEach(b => b.onclick = () => { front = acts.flash.front = b.dataset.front; $$('[data-front]', root).forEach(x => x.classList.toggle('on', x === b)); draw(); });
    function faceHTML(w, kind) {
      if (kind === 'hz') return '<div class="hz">' + esc(w.hz) + '</div>';
      if (kind === 'py') return '<div class="pyl tc">' + App.pyHTML(w.py) + '</div>';
      return '<div class="emo">' + w.emoji + '</div><div class="en">' + esc(w.en) + '</div>';
    }
    function draw() {
      const w = deck[i];
      $('#cnt', root).textContent = (i + 1) + ' / ' + deck.length;
      $('#fc', root).innerHTML = progress(i, deck.length) +
        '<div class="flash" id="card" tabindex="0" role="button" aria-label="Flip card"><div class="inner">' +
        '<div class="face">' + faceHTML(w, front) + '<div class="hint">Tap to flip</div></div>' +
        '<div class="face rear tc"><div class="hz" style="font-size:3.6rem">' + esc(w.hz) + '</div><div class="pyl">' + App.pyHTML(w.py) + '</div><div class="en">' + w.emoji + ' ' + esc(w.en) + '</div></div></div></div>' +
        '<div class="row" style="justify-content:center">' + App.speakBtn(w.hz) +
        '<button class="btn orange" id="againB">🔁 Still learning</button><button class="btn green" id="gotB">✅ I know it</button></div>';
      const card = $('#card', root);
      const flip = () => { card.classList.toggle('flipped'); if (card.classList.contains('flipped') && App.canSpeak()) App.say(w.hz, { quiet: true }); };
      card.onclick = flip; card.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } };
      $('#againB', root).onclick = () => { App.srsGrade(w.id, false); again.push(w); next(); };
      $('#gotB', root).onclick = () => { App.srsGrade(w.id, true); known++; next(); };
    }
    function next() {
      i++;
      if (i < deck.length) return draw();
      const total = deck.length;
      const stars = App.finish((scope || 'all') + ':flash', known, total);
      doneScreen(root, { stars, score: known, total, back: backLink(scope), backHash: scope !== 'all' ? '#/unit/' + scope : '#/', title: 'Deck finished!',
        extra: again.length ? '<p>Words to practice: ' + again.map(w => '<b>' + esc(w.hz) + '</b>').join('、') + '</p>' : '<p>You knew every card! 🌟</p>',
        again: () => acts.flash(root, scope) });
    }
    draw();
  };

  /* ---------- 🎵 tone trainer ---------- */
  acts.tones = (root, scope) => {
    let mode = acts.tones.mode || 'single';
    const listen = App.canSpeak();
    root.innerHTML = header(scope, '🎵', scope === 'all' ? 'Tone Gym' : 'Tone Trainer', '声调') + voiceBanner() +
      '<div class="stage"><details class="card mb"><summary><b>How do the 4 tones sound?</b> (tap to open)</summary><div class="demo-row mt">' +
      C.toneDemo.map((d, k) => '<button class="demo tc" data-say="' + esc(d.hz) + '">' + App.toneSVG(k + 1) + '<div class="hz">' + esc(d.hz) + '</div><div>' + App.pyHTML(d.py) + '</div><small class="sub">' + esc(d.en) + '</small></button>').join('') +
      '</div><p class="sub">1st: high and flat, like singing “laaa”. 2nd: rising, like asking “huh?”. 3rd: dips down then up (often just low). 4th: falling sharply, like saying “No!”. Neutral: short and light (the second “ba” in bàba).</p></details>' +
      '<div class="row mb"><div class="seg" role="group"><button data-mode="single" class="' + (mode === 'single' ? 'on' : '') + '">One syllable</button><button data-mode="pairs" class="' + (mode === 'pairs' ? 'on' : '') + '">Two-syllable words</button></div>' +
      '<span class="sub">' + (listen ? '🔊 Listen and pick the tone' : '👀 Look at the character and pick its tone') + '</span></div><div id="tq"></div></div>';
    $$('[data-mode]', root).forEach(b => b.onclick = () => { acts.tones.mode = b.dataset.mode; acts.tones(root, scope); });
    const inScope = it => scope === 'all' || it.id.split(':')[0] === scope;
    const box = $('#tq', root);
    if (mode === 'single') {
      let pool = C.toneItems.filter(inScope); if (pool.length < 6) pool = C.toneItems.filter(it => App.isUnlocked(it.id.split(':')[0]));
      if (pool.length < 6) pool = C.toneItems;
      const items = App.pick(pool, 10);
      // balance: make sure items are unique characters
      runTones(items);
    } else {
      let pool = C.tonePairs.filter(inScope); if (pool.length < 5) pool = C.tonePairs;
      runPairs(App.pick(pool, 8));
    }
    function finishTones(score, total) {
      const stars = App.finish((scope || 'all') + ':tones', score, total, p => { if (score === total && total >= 10) App.count('tonePerfect'); });
      doneScreen(root, { stars, score, total, back: backLink(scope), backHash: scope !== 'all' ? '#/unit/' + scope : '#/', again: () => acts.tones(root, scope) });
    }
    function toneButtons(withNeutral) {
      return '<div class="tone-btns' + (withNeutral ? ' five' : '') + '">' + App.TONES.filter(t => withNeutral || t.n).map(t =>
        '<button class="tonebtn" data-t="' + t.n + '">' + App.toneSVG(t.n) + '<span>' + t.name + '</span><small>' + t.desc + '</small></button>').join('') + '</div>';
    }
    function runTones(items) {
      let i = 0, score = 0;
      const show = () => {
        const it = items[i];
        box.innerHTML = progress(i, items.length) + '<div class="q-prompt">' +
          (listen ? '<button class="btn orange" id="play" style="min-height:80px;font-size:1.4rem">🔊 Play again</button><div class="hz mt" id="hz" style="visibility:hidden">' + esc(it.hz) + '</div>'
            : '<div class="hz">' + esc(it.hz) + '</div>') +
          '<div class="big" id="pyl">' + esc(App.stripTone(it.py)) + '</div><div class="sub">' + esc(it.en) + '</div></div>' + toneButtons(false) +
          '<div class="feedback" aria-live="polite"></div><div class="center"><button class="btn hidden" id="nextQ">Next ▶</button></div>';
        if (listen) { const play = () => App.say(it.hz, { quiet: true, rate: Math.min(0.8, App.state.settings.rate) }); $('#play', box).onclick = play; setTimeout(play, 200); }
        let done = false;
        $$('.tonebtn', box).forEach(b => b.onclick = () => {
          if (done) return; done = true;
          const ok = +b.dataset.t === it.tone; if (ok) score++;
          App.sfx(ok ? 'good' : 'bad'); b.classList.add(ok ? 'right' : 'wrong');
          $$('.tonebtn', box).forEach(x => { if (+x.dataset.t === it.tone) x.classList.add('right'); });
          if (listen) $('#hz', box).style.visibility = 'visible';
          $('#pyl', box).innerHTML = '<span class="tc">' + App.pyHTML(it.py) + '</span>';
          const fb = $('.feedback', box); fb.className = 'feedback ' + (ok ? 'good' : 'bad');
          fb.textContent = ok ? '对了！That’s the ' + App.TONES[it.tone - 1].name + ' tone.' : 'It’s the ' + App.TONES[it.tone - 1].name + ' tone: ' + it.py;
          App.srsGrade(it.id, ok);
          const nb = $('#nextQ', box); nb.classList.remove('hidden');
          nb.onclick = () => { i++; i < items.length ? show() : finishTones(score, items.length); };
        });
      };
      show();
    }
    function runPairs(items) {
      let i = 0, score = 0;
      const show = () => {
        const it = items[i], pick = [null, null];
        box.innerHTML = progress(i, items.length) + '<div class="q-prompt">' + (listen ? '<button class="btn orange" id="play">🔊 Play again</button>' : '') +
          '<div class="hz">' + esc(it.hz) + '</div><div class="sub">' + esc(it.en) + '</div></div>' +
          [0, 1].map(s => '<div class="card mb"><b>Syllable ' + (s + 1) + ': <span class="big" id="syl' + s + '">' + esc(App.stripTone(it.sylls[s])) + '</span></b><div class="mt" data-s="' + s + '">' + toneButtons(s === 1) + '</div></div>').join('') +
          '<div class="feedback" aria-live="polite"></div><div class="center"><button class="btn green" id="chk" disabled>Check ✔</button> <button class="btn hidden" id="nextQ">Next ▶</button></div>';
        if (listen) { const play = () => App.say(it.hz, { quiet: true }); $('#play', box).onclick = play; setTimeout(play, 200); }
        $$('[data-s]', box).forEach(row => $$('.tonebtn', row).forEach(b => b.onclick = () => {
          const s = +row.dataset.s; pick[s] = +b.dataset.t; $$('.tonebtn', row).forEach(x => x.classList.toggle('sel', x === b));
          $('#chk', box).disabled = pick.includes(null);
        }));
        $('#chk', box).onclick = () => {
          const ok = pick[0] === it.tones[0] && pick[1] === it.tones[1]; if (ok) score++;
          App.sfx(ok ? 'good' : 'bad');
          $$('[data-s]', box).forEach(row => { const s = +row.dataset.s; $$('.tonebtn', row).forEach(x => { x.classList.remove('sel'); if (+x.dataset.t === it.tones[s]) x.classList.add('right'); else if (+x.dataset.t === pick[s]) x.classList.add('wrong'); x.onclick = null; }); });
          [0, 1].forEach(s => $('#syl' + s, box).innerHTML = '<span class="tc">' + App.pyHTML(it.sylls[s]) + '</span>');
          const fb = $('.feedback', box); fb.className = 'feedback ' + (ok ? 'good' : 'bad');
          fb.innerHTML = (ok ? '好棒！' : 'Answer: ') + '<span class="tc">' + App.pyHTML(it.py) + '</span> (' + it.tones.map(t => t || 'neutral').join(' + ') + ')';
          App.srsGrade(it.id, ok);
          $('#chk', box).classList.add('hidden'); const nb = $('#nextQ', box); nb.classList.remove('hidden');
          nb.onclick = () => { i++; i < items.length ? show() : finishTones(score, items.length); };
        };
      };
      show();
    }
  };

  /* ---------- 🧩 matching ---------- */
  acts.match = (root, scope) => {
    let mode = acts.match.mode || 'en';
    const words = []; const seenEn = new Set();
    for (const w of App.shuffle(scopeWords(scope))) { if (!seenEn.has(w.en) && !words.some(x => x.hz === w.hz)) { seenEn.add(w.en); words.push(w); } if (words.length === 6) break; }
    root.innerHTML = header(scope, '🧩', 'Matching', '配对') +
      '<div class="stage"><div class="row mb" style="justify-content:space-between"><div class="seg"><button data-m="en" class="' + (mode === 'en' ? 'on' : '') + '">汉字 ↔ English</button><button data-m="py" class="' + (mode === 'py' ? 'on' : '') + '">汉字 ↔ pinyin</button></div><span class="pill">⏱️ <span id="tm">0</span>s · ❌ <span id="ms">0</span></span></div>' +
      '<div class="match"><div class="col" id="L"></div><div class="col" id="R"></div></div></div>';
    $$('[data-m]', root).forEach(b => b.onclick = () => { acts.match.mode = b.dataset.m; acts.match(root, scope); });
    const L = $('#L', root), R = $('#R', root);
    L.innerHTML = App.shuffle(words).map(w => '<button class="mcard hzc" data-id="' + w.id + '">' + esc(w.hz) + '</button>').join('');
    R.innerHTML = App.shuffle(words).map(w => '<button class="mcard tc" data-id="' + w.id + '">' + (mode === 'en' ? w.emoji + ' ' + esc(w.en) : App.pyHTML(w.py)) + '</button>').join('');
    let selL = null, selR = null, mistakes = 0, matched = 0; const t0 = Date.now();
    const timer = setInterval(() => { const el = $('#tm', root); if (el) el.textContent = Math.round((Date.now() - t0) / 1000); }, 500);
    App.cleanup.push(() => clearInterval(timer));
    const tryPair = () => {
      if (!selL || !selR) return;
      const a = selL, b = selR; selL = selR = null;
      if (a.dataset.id === b.dataset.id) {
        App.sfx('good'); a.classList.add('done'); b.classList.add('done'); a.classList.remove('sel'); b.classList.remove('sel');
        App.srsGrade(a.dataset.id, true); matched++;
        if (App.canSpeak()) App.say(App.wordById[a.dataset.id].hz, { quiet: true });
        if (matched === words.length) {
          clearInterval(timer);
          const secs = Math.round((Date.now() - t0) / 1000);
          setTimeout(() => {
            const stars = App.finish((scope || 'all') + ':match', Math.max(0, words.length - mistakes), words.length);
            doneScreen(root, { stars, back: backLink(scope), backHash: scope !== 'all' ? '#/unit/' + scope : '#/', extra: '<p>⏱️ ' + secs + ' seconds · ❌ ' + mistakes + ' mistakes</p>', again: () => acts.match(root, scope) });
          }, 600);
        }
      } else {
        App.sfx('bad'); mistakes++; $('#ms', root).textContent = mistakes;
        App.srsGrade(a.dataset.id, false);
        [a, b].forEach(x => { x.classList.add('wrong'); setTimeout(() => x.classList.remove('wrong', 'sel'), 400); });
      }
    };
    $$('#L .mcard', root).forEach(b => b.onclick = () => { $$('#L .mcard', root).forEach(x => x.classList.remove('sel')); b.classList.add('sel'); selL = b; if (App.canSpeak()) App.say(App.wordById[b.dataset.id].hz, { quiet: true }); tryPair(); });
    $$('#R .mcard', root).forEach(b => b.onclick = () => { $$('#R .mcard', root).forEach(x => x.classList.remove('sel')); b.classList.add('sel'); selR = b; tryPair(); });
  };

  /* ---------- 🖌️ stroke order (hanzi-writer + bundled stroke data) ---------- */
  function loadStrokes() {
    if (window.STROKES) return Promise.resolve();
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'data/strokes.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }
  acts.write = (root, scope) => {
    const unit = scope !== 'all' ? scope : App.currentUnit().id;
    const words = App.unitWords(unit);
    const chars = [...new Set(words.map(w => w.hz).join(''))];
    let cur = chars[0], writer = null; const doneSet = new Set();
    root.innerHTML = header(scope, '🖌️', 'Stroke Order', '写字') +
      '<div class="stage"><div class="charpick" id="cp">' + chars.map(c => '<button data-c="' + esc(c) + '">' + esc(c) + '</button>').join('') + '</div>' +
      '<div class="grid g2" style="align-items:center"><div><div class="writer-box"><svg class="grid" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0 0L100 100M100 0L0 100M50 0V100M0 50H100" stroke="#f3caca" stroke-width=".6" stroke-dasharray="2 2" fill="none"/></svg><div id="hw"></div></div></div>' +
      '<div class="card"><div id="info" class="tc"></div><div class="row mt"><button class="btn purple" id="watch">▶ Watch</button><button class="btn orange" id="trace">✏️ Trace</button><button class="btn green" id="test">🧠 From memory</button></div><div class="feedback" id="wfb" aria-live="polite"></div></div></div></div>';
    const fb = $('#wfb', root);
    function info() {
      const ws = words.filter(w => w.hz.includes(cur));
      const sp = window.STROKES && window.STROKES[cur] ? window.STROKES[cur].strokes.length : '?';
      $('#info', root).innerHTML = '<div style="font-size:3rem;font-weight:700">' + esc(cur) + '</div><div><b>' + sp + '</b> strokes</div>' +
        ws.map(w => '<div class="mt">' + esc(w.hz) + ' · ' + App.pyHTML(w.py) + ' · ' + esc(w.en) + ' ' + App.speakBtn(w.hz, '') + '</div>').join('');
    }
    function make(outline) {
      $('#hw', root).innerHTML = '';
      writer = HanziWriter.create($('#hw', root), cur, {
        width: 294, height: 294, padding: 18, showOutline: outline, showCharacter: false,
        strokeColor: '#2b2d42', radicalColor: '#e8505b', outlineColor: '#e9e2d8', drawingColor: '#3a86ff', highlightColor: '#ffd23f',
        strokeAnimationSpeed: 1.1, delayBetweenStrokes: 250, drawingWidth: 26,
        charDataLoader: (c, ok, err) => window.STROKES[c] ? ok(window.STROKES[c]) : err(new Error('no data')),
      });
    }
    function select(c) {
      cur = c; $$('#cp button', root).forEach(b => b.classList.toggle('on', b.dataset.c === c)); fb.textContent = '';
      make(true); info(); setTimeout(() => writer && writer.animateCharacter(), 300);
    }
    function quiz(outline) {
      make(outline); fb.className = 'feedback'; fb.textContent = outline ? 'Trace each stroke in order ✏️' : 'Write it from memory! (Hints after 2 misses)';
      writer.quiz({
        showHintAfterMisses: outline ? 1 : 2, leniency: 1.2,
        onMistake: () => App.sfx('bad'),
        onCorrectStroke: () => { App._strokes = (App._strokes || 0) + 1; App.sfx('tap'); },
        onComplete: d => {
          const n = window.STROKES[cur].strokes.length, mist = d.totalMistakes;
          App.count('written');
          const stars = App.finish(unit + ':write', Math.max(0, n - mist), n);
          fb.className = 'feedback good'; fb.textContent = (mist === 0 ? '完美！Perfect! ' : 'Done! ' + mist + ' oops. ') + App.starsText(stars);
          if (stars >= 2) App.sfx('win');
          if (!outline || mist === 0) { doneSet.add(cur); const b = $$('#cp button', root).find(x => x.dataset.c === cur); if (b) b.classList.add('ok'); }
          if (App.canSpeak()) App.say(cur, { quiet: true });
          App.renderTop();
        },
      });
    }
    $$('#cp button', root).forEach(b => b.onclick = () => select(b.dataset.c));
    $('#watch', root).onclick = () => { make(true); writer.animateCharacter(); };
    $('#trace', root).onclick = () => quiz(true);
    $('#test', root).onclick = () => quiz(false);
    $('#info', root).textContent = 'Loading strokes…';
    loadStrokes().then(() => select(cur)).catch(() => { $('#info', root).textContent = 'Stroke data could not be loaded.'; });
  };

  /* ---------- 🧱 sentence builder (tap or drag) ---------- */
  acts.build = (root, scope) => {
    let pool = scope !== 'all' ? C.sentences.filter(s => s.unit === scope) : C.sentences.filter(s => App.isUnlocked(s.unit));
    const items = App.shuffle(pool).slice(0, 5);
    let i = 0, score = 0;
    root.innerHTML = header(scope, '🧱', 'Sentence Builder', '造句') + '<div class="stage" id="sb"></div>';
    const box = $('#sb', root);
    function show() {
      const s = items[i]; let tries = 0;
      let order = App.shuffle(s.tokens.map((t, k) => k));
      if (order.every((k, j) => k === j) && order.length > 1) order.reverse();
      box.innerHTML = progress(i, items.length) + '<div class="card mb center"><div class="sub">Build this sentence in Chinese:</div><div style="font-size:1.4rem;font-weight:700">“' + esc(s.en) + '”</div></div>' +
        '<div class="row" style="justify-content:center;align-items:center"><div class="tiles answer tc" id="ans" aria-label="Your sentence"></div><span class="endp">' + esc(s.end) + '</span></div>' +
        '<p class="sub center">Tap or drag the words into the box ⬆️</p><div class="tiles tc" id="bank">' +
        order.map(k => '<div class="tile" data-k="' + k + '" tabindex="0" role="button"><span class="h">' + esc(s.tokens[k][0]) + '</span><span class="p">' + App.pyHTML(s.tokens[k][1]) + '</span></div>').join('') + '</div>' +
        '<div class="feedback" aria-live="polite"></div><div class="row" style="justify-content:center"><button class="btn secondary" id="clr">↩️ Reset</button><button class="btn green" id="chk">Check ✔</button><button class="btn hidden" id="nextQ">Next ▶</button></div>';
      const ans = $('#ans', box), bank = $('#bank', box), fb = $('.feedback', box);
      $$('.tile', box).forEach(t => enableDrag(t, ans, bank));
      $('#clr', box).onclick = () => { $$('.tile', ans).forEach(t => bank.appendChild(t)); ans.classList.remove('bad', 'ok'); };
      $('#chk', box).onclick = () => {
        const got = $$('.tile', ans).map(t => +t.dataset.k);
        if (got.length !== s.tokens.length) { fb.className = 'feedback bad'; fb.textContent = 'Use all the words!'; App.sfx('bad'); return; }
        const text = got.map(k => s.tokens[k][0]).join('');
        const target = s.tokens.map(t => t[0]).join('');
        if (text === target || s.alts.includes(text)) {
          if (tries === 0) score++;
          App.count('built'); App.sfx('good'); ans.classList.add('ok'); fb.className = 'feedback good';
          fb.innerHTML = '好棒！' + esc(target + s.end) + ' <span class="tc">' + App.pyHTML(s.tokens.map(t => t[1]).join(' ')) + '</span>';
          App.say(target, { quiet: true });
          s.tokens.forEach(t => { const w = App.wordByHz[t[0]]; if (w) App.srsGrade(w.id, tries === 0); });
          $('#chk', box).classList.add('hidden'); $('#clr', box).classList.add('hidden'); const nb = $('#nextQ', box); nb.classList.remove('hidden');
          nb.onclick = () => { i++; i < items.length ? show() : end(); };
        } else {
          tries++; App.sfx('bad'); ans.classList.remove('bad'); void ans.offsetWidth; ans.classList.add('bad');
          // mark the first tile that is in the wrong spot
          const firstBad = got.findIndex((k, j) => s.tokens[k][0] !== s.tokens[j][0]);
          $$('.tile', ans).forEach((t, j) => t.classList.toggle('wrongpos', j === firstBad));
          fb.className = 'feedback bad'; fb.textContent = tries >= 2 ? 'Hint: the sentence starts with “' + s.tokens[0][0] + '”.' : 'Almost! Look at the red word.';
        }
      };
    }
    function end() {
      const stars = App.finish((scope || 'all') + ':build', score, items.length);
      doneScreen(root, { stars, score, total: items.length, back: backLink(scope), backHash: scope !== 'all' ? '#/unit/' + scope : '#/', again: () => acts.build(root, scope) });
    }
    show();
  };
  /** Pointer-based drag for tiles between two containers; a plain tap moves the tile across. */
  function enableDrag(tile, ans, bank) {
    let sx, sy, ghost = null, moved = false, pid = null;
    const other = () => (tile.parentNode === ans ? bank : ans);
    const insertAt = (cont, x, y) => {
      const kids = $$('.tile', cont).filter(k => k !== tile);
      let before = null;
      for (const k of kids) { const r = k.getBoundingClientRect(); if (y < r.top - 4) { before = k; break; } if (y <= r.bottom + 4 && x < r.left + r.width / 2) { before = k; break; } }
      cont.insertBefore(tile, before);
    };
    tile.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; moved = false; pid = e.pointerId; tile.setPointerCapture(pid); });
    tile.addEventListener('pointermove', e => {
      if (pid !== e.pointerId) return;
      if (!moved && Math.hypot(e.clientX - sx, e.clientY - sy) > 8) {
        moved = true; ghost = tile.cloneNode(true); ghost.classList.add('ghost'); document.body.appendChild(ghost); tile.classList.add('dragging');
      }
      if (ghost) { ghost.style.left = e.clientX - ghost.offsetWidth / 2 + 'px'; ghost.style.top = e.clientY - ghost.offsetHeight / 2 + 'px'; }
    });
    const up = e => {
      if (pid !== e.pointerId) return; pid = null;
      tile.classList.remove('wrongpos');
      if (!moved) { other().appendChild(tile); App.sfx('tap'); return; }
      if (ghost) ghost.remove(); ghost = null; tile.classList.remove('dragging');
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const cont = el && el.closest('#ans, #bank');
      if (cont) insertAt(cont, e.clientX, e.clientY);
    };
    tile.addEventListener('pointerup', up);
    tile.addEventListener('pointercancel', e => { pid = null; if (ghost) ghost.remove(); ghost = null; tile.classList.remove('dragging'); });
    tile.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); other().appendChild(tile); } });
  }

  /* ---------- 📖 story time ---------- */
  acts.read = (root, scope, idx) => {
    const list = scope !== 'all' ? C.readings.filter(r => r.unit === scope) : C.readings.filter(r => App.isUnlocked(r.unit));
    if (scope === 'all' && idx === undefined) {
      root.innerHTML = header(scope, '📖', 'Story Time', '阅读') + '<div class="grid g3">' + list.map((r, k) => '<button class="act" data-k="' + k + '"><span class="ico">📖</span><b>' + esc(r.title) + '</b><small>' + esc(r.en) + '</small></button>').join('') + '</div>';
      $$('[data-k]', root).forEach(b => b.onclick = () => acts.read(root, scope, +b.dataset.k)); return;
    }
    const r = list[idx || 0];
    let showPy = App.state.settings.pinyin;
    root.innerHTML = header(scope, '📖', 'Story Time', '阅读') +
      '<div class="stage" style="max-width:860px"><h2>' + esc(r.title) + ' <span class="sub tc">' + App.pyHTML(r.py) + '</span> · ' + esc(r.en) + '</h2>' +
      '<div class="row mb"><button class="btn secondary small" id="pyT">' + (showPy ? 'Hide' : 'Show') + ' pinyin</button><button class="btn secondary small" id="enT">Show English</button>' +
      '<button class="btn orange small" id="readAll">🔊 Read to me</button><span class="sub">Tap any word to see what it means.</span></div>' +
      '<div class="passage tc' + (showPy ? '' : ' nopy') + '" id="psg">' + App.ruby(r.tokens) + '</div><div class="trans hidden" id="tr">' + esc(r.trans) + '</div>' +
      '<h2 class="mt">Questions 🤔</h2><div id="qz"></div></div>';
    $('#pyT', root).onclick = e => { showPy = !showPy; App.state.settings.pinyin = showPy; App.save(); $('#psg', root).classList.toggle('nopy', !showPy); e.target.textContent = (showPy ? 'Hide' : 'Show') + ' pinyin'; };
    $('#enT', root).onclick = e => { const t = $('#tr', root); t.classList.toggle('hidden'); e.target.textContent = t.classList.contains('hidden') ? 'Show English' : 'Hide English'; };
    $('#readAll', root).onclick = () => App.say(r.tokens.map(t => t[0]).join(''));
    let pop = null;
    $$('#psg ruby', root).forEach(rb => rb.onclick = () => {
      $$('#psg ruby', root).forEach(x => x.classList.remove('on')); rb.classList.add('on');
      if (pop) pop.remove();
      pop = document.createElement('div'); pop.className = 'popup tc';
      pop.innerHTML = '<span class="h">' + esc(rb.dataset.hz) + '</span><span><b>' + App.pyHTML(rb.dataset.py) + '</b><br>' + esc(App.gloss(rb.dataset.hz)) + '</span><button class="iconbtn" aria-label="Close">✕</button>';
      document.body.appendChild(pop); pop.querySelector('button').onclick = () => { pop.remove(); pop = null; };
      App.say(rb.dataset.hz, { quiet: true });
    });
    const outside = e => { if (pop && !e.target.closest('.popup, #psg ruby')) { pop.remove(); pop = null; $$('#psg ruby', root).forEach(x => x.classList.remove('on')); } };
    document.addEventListener('click', outside);
    App.cleanup.push(() => { if (pop) pop.remove(); document.removeEventListener('click', outside); });
    const qs = r.qs.map(q => ({ prompt: '<div class="big" style="font-size:1.4rem">' + esc(q.q) + '</div>', options: App.shuffle(q.options).map(o => ({ html: esc(o), correct: o === q.answer })), reveal: esc(q.answer) }));
    runQuiz($('#qz', root), { questions: qs, noSrs: true, onDone: (score, total) => {
      const stars = App.finish(r.unit + ':read', score, total);
      if (pop) pop.remove();
      doneScreen(root, { stars, score, total, back: backLink(scope), backHash: scope !== 'all' ? '#/unit/' + scope : '#/', again: () => acts.read(root, scope, idx) });
    } });
  };

  /* ---------- 🎭 role-play ---------- */
  acts.roleplay = (root, scope) => {
    const ds = C.dialogues.filter(d => scope === 'all' || d.unit === scope);
    if (ds.length === 1) return App.go('#/scene/' + ds[0].id);
    if (!ds.length) return App.go('#/theater');
    root.innerHTML = header(scope, '🎭', 'Role-Play', '演一演') + '<div class="grid g3 scene-list">' + ds.map(d => '<button class="act" data-go="#/scene/' + d.id + '"><span class="ico">' + d.emoji + '</span><b>' + esc(d.en) + '</b><small>' + esc(d.title) + '</small></button>').join('') + '</div>';
  };
  const TWISTS = ['Say every line like a robot 🤖', 'Everyone is VERY sleepy 😴', 'Whisper the whole scene 🤫', 'Act it like opera singers 🎶', 'You are both in a big hurry ⏱️',
    'Pretend it is super windy outside 💨', 'One of you is a giant, one is tiny 🐘🐭', 'Do it in slow motion 🐢', 'You are secret agents 🕶️', 'Everything is SO exciting 🤩'];
  App.takes = App.takes || {};
  acts.scene = (root, id) => {
    const d = C.dialogues.find(x => x.id === id); if (!d) return App.go('#/theater');
    const twist = App.pick(TWISTS, 1)[0];
    root.innerHTML = '<a class="back" href="#/theater">← Theater</a><h1>' + d.emoji + ' ' + esc(d.en) + ' <span class="sub">' + esc(d.title) + ' · ' + esc(d.py) + '</span></h1>' +
      '<div class="card stage center"><p style="font-size:1.15rem">🎬 <b>Scene:</b> ' + esc(d.setting) + '</p><h2>Which part do you want to play?</h2><div class="row" style="justify-content:center">' +
      ['A', 'B'].map(r => '<button class="btn ' + (r === 'A' ? 'purple' : 'orange') + '" data-role="' + r + '">' + (r === 'A' ? '🅰️ ' : '🅱️ ') + esc(d.roles[r]) + '</button>').join('') + '</div>' +
      '<div class="twist mt">🎲 Bonus acting twist (optional): ' + esc(twist) + '</div>' +
      (App.rec.supported() ? '<p class="sub">🎙️ You can record your lines. Recordings stay on this device and are never uploaded.</p>' : '<p class="sub">🎙️ Recording isn’t available in this browser, but you can still act it out loud!</p>') + '</div>';
    $$('[data-role]', root).forEach(b => b.onclick = () => perform(root, d, b.dataset.role, twist));
  };
  async function perform(root, d, me, twist) {
    const keyOf = j => d.id + ':' + me + ':' + j;
    let idx = 0, recording = false, stopRec = null;
    const icons = { A: me === 'A' ? '🧒' : '🙂', B: me === 'B' ? '🧒' : '🙂' };
    if (App.state.settings.keepRecordings && window.indexedDB) {
      for (let j = 0; j < d.lines.length; j++) if (d.lines[j].who === me && !App.takes[keyOf(j)]) { try { const b = await App.idb.get(keyOf(j)); if (b) App.takes[keyOf(j)] = b; } catch (e) { } }
    }
    root.innerHTML = '<a class="back" href="#/theater">← Theater</a><h1>' + d.emoji + ' ' + esc(d.en) + '</h1><p class="sub">You are <b>' + esc(d.roles[me]) + '</b>. ' + esc(d.setting) + '</p>' + voiceBanner() +
      '<div class="stage"><div class="script tc" id="script">' + d.lines.map((l, j) => '<div class="line' + (l.who === me ? ' me' : '') + '" data-j="' + j + '"><div class="who" title="' + esc(d.roles[l.who]) + '">' + icons[l.who] + '</div><div class="bubble">' +
        '<div class="sub" style="font-size:.85rem">' + esc(d.roles[l.who]) + '</div><div class="zh">' + App.ruby(l.tokens) + '</div><div>' + esc(l.en) + '</div>' + (l.who === me ? '<div class="tip">🎭 ' + esc(l.tip) + '</div>' : '') + '</div></div>').join('') +
      '</div><div class="card mt" id="ctl" style="position:sticky;bottom:10px"></div></div>';
    App.cleanup.push(() => { if (stopRec) stopRec(); App.rec.release(); });
    const lineText = l => l.tokens.map(t => t[0]).join('');
    const playBlob = b => new Promise(res => { const a = new Audio(URL.createObjectURL(b)); a.onended = res; a.onerror = res; a.play().catch(res); });
    function mark() {
      $$('.line', root).forEach((el, j) => { el.classList.toggle('active', j === idx); el.classList.toggle('past', j < idx); });
      const el = $$('.line', root)[idx]; if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    function step() {
      mark();
      const ctl = $('#ctl', root);
      if (idx >= d.lines.length) return finale();
      const l = d.lines[idx];
      if (l.who !== me) {
        ctl.innerHTML = '<div class="row" style="justify-content:center"><span>🙂 <b>' + esc(d.roles[l.who]) + '</b> is talking…</span><button class="btn secondary" id="hear">🔊 Hear again</button><button class="btn" id="nx">Next ▶</button></div>';
        $('#hear', ctl).onclick = () => App.say(lineText(l));
        $('#nx', ctl).onclick = () => { idx++; step(); };
        App.say(lineText(l), { quiet: true });
      } else {
        const has = !!App.takes[keyOf(idx)];
        ctl.innerHTML = '<div class="center"><b>Your line!</b> 🎭 ' + esc(l.tip) + '</div><div class="row mt" style="justify-content:center">' +
          '<button class="btn secondary" id="hear">🔊 Hear it</button>' + (App.rec.supported() ? '<button class="btn rec" id="rec">🎙️ Record</button><button class="btn purple" id="mine" ' + (has ? '' : 'disabled') + '>▶ My take</button>' : '') +
          '<button class="btn green" id="nx">Next ▶</button></div>';
        $('#hear', ctl).onclick = () => App.say(lineText(l));
        const rb = $('#rec', ctl);
        if (rb) rb.onclick = async () => {
          if (recording) { App.rec.stop(); return; }
          try {
            const p = App.rec.start(); recording = true; rb.classList.add('on'); rb.textContent = '⏹️ Stop';
            stopRec = () => App.rec.stop();
            const timeout = setTimeout(() => App.rec.stop(), 15000);
            const blob = await p; clearTimeout(timeout); recording = false; stopRec = null;
            App.takes[keyOf(idx)] = blob;
            if (App.state.settings.keepRecordings && window.indexedDB) App.idb.put(keyOf(idx), blob).catch(() => {});
            rb.classList.remove('on'); rb.textContent = '🎙️ Record again'; $('#mine', ctl).disabled = false; App.sfx('good');
          } catch (e) { recording = false; stopRec = null; rb.classList.remove('on'); rb.textContent = '🎙️ Record'; App.toast('🎙️ Microphone not available. You can still say it out loud!'); }
        };
        const mb = $('#mine', ctl); if (mb) mb.onclick = () => App.takes[keyOf(idx)] && playBlob(App.takes[keyOf(idx)]);
        $('#nx', ctl).onclick = () => { if (recording) App.rec.stop(); idx++; step(); };
      }
    }
    function finale() {
      App.rec.release();
      const stars = App.finish(d.unit + ':roleplay', 1, 1, p => { p.best['scene:' + d.id] = 3; });
      App.confetti(); App.sfx('win');
      const nTakes = d.lines.filter((l, j) => l.who === me && App.takes[keyOf(j)]).length;
      $('#ctl', root).innerHTML = '<div class="center"><div style="font-size:2.5rem">👏🎭👏</div><h2>Take a bow! 鞠躬！</h2><div class="big-stars">' + App.starsText(stars) + '</div>' +
        '<div class="row" style="justify-content:center"><button class="btn orange" id="playAll">🎬 Play the whole scene' + (nTakes ? ' (with my voice)' : '') + '</button>' +
        '<button class="btn purple" id="swap">🔄 Swap parts</button><button class="btn secondary" id="tw">🎲 New twist</button><button class="btn secondary" data-go="#/theater">Done</button></div><div class="twist mt" id="twTxt">' + esc(twist) + '</div></div>';
      App.renderTop();
      $('#playAll', root).onclick = async () => {
        for (let j = 0; j < d.lines.length; j++) {
          idx = j; mark();
          const l = d.lines[j], take = l.who === me && App.takes[keyOf(j)];
          if (take) await playBlob(take); else if ((await App.say(lineText(l), { quiet: true })) === null) break;
          await new Promise(r => setTimeout(r, 250));
        }
        idx = d.lines.length; mark();
      };
      $('#swap', root).onclick = () => perform(root, d, me === 'A' ? 'B' : 'A', twist);
      $('#tw', root).onclick = () => { $('#twTxt', root).textContent = App.pick(TWISTS, 1)[0]; };
    }
    step();
  }

  /* ---------- 🏆 city challenge ---------- */
  acts.challenge = (root, scope) => {
    const unit = scope !== 'all' ? scope : App.currentUnit().id, u = App.unitById[unit];
    const words = App.pick(App.unitWords(unit), 8);
    const types = App.shuffle(['hz2en', 'hz2en', 'en2hz', 'en2hz', 'py2hz', 'listen', 'tone', 'py2hz']);
    const qs = words.map((w, k) => makeQ(w, types[k], App.unitWords(unit)));
    root.innerHTML = header(scope, '🏆', 'City Challenge: ' + esc(u.city.en), esc(u.city.hz)) + '<div class="stage"><p class="sub center">Get <b>6 of 8</b> right to earn the ' + esc(u.city.en) + ' stamp!</p><div id="cq"></div></div>';
    runQuiz($('#cq', root), { questions: qs, onDone: (score, total) => {
      const pass = score >= 6, wasPassed = !!App.profile().passed[unit];
      const stars = App.finish(unit + ':challenge', score, total, p => { if (pass) p.passed[unit] = p.passed[unit] || Date.now(); });
      const i = App.unitIndex(unit), next = C.units[i + 1];
      doneScreen(root, { stars, score, total, back: backLink(scope), backHash: pass ? '#/' : '#/unit/' + unit,
        emoji: pass ? '🛂' : '💪', title: pass ? (wasPassed ? 'Stamp renewed! 盖章！' : 'You earned the ' + u.city.en + ' stamp!') : 'So close! Practice and try again',
        extra: pass ? '<div class="stamp got" style="width:150px;margin:10px auto;background:' + u.color + ';border-color:' + u.color + '"><span class="hz">' + esc(u.city.hz) + '</span><span>' + esc(u.city.en) + '</span><span>' + u.emoji + ' ✓</span></div>' +
          (next ? '<p>🚄 Next stop unlocked: <b>' + esc(next.city.hz) + ' ' + esc(next.city.en) + '</b>!</p>' : '<p>🏔️ You finished the whole journey across China! 你真棒！</p>') : '<p>Try Flashcards and Matching first, then come back.</p>',
        again: () => acts.challenge(root, scope) });
    } });
  };

  /* ---------- 📅 daily mix (spaced repetition) ---------- */
  acts.daily = (root, extra) => {
    const due = App.dueWords().slice(0, 10);
    const fresh = App.shuffle(App.newWords()).slice(0, due.length ? Math.max(0, Math.min(4, 12 - due.length)) : 8);
    let list = due.concat(fresh).map(w => ({ w, isNew: !App.profile().srs[w.id] }));
    if (!list.length && !extra) {
      root.innerHTML = '<a class="back" href="#/">← Map</a><div class="card stage done-box"><div style="font-size:3.5rem">🎉</div><h1>All caught up!</h1><p>No words are due today. Come back tomorrow, or unlock a new city for new words.</p><button class="btn" id="ext">💪 Extra practice anyway</button></div>';
      $('#ext', root).onclick = () => acts.daily(root, true); return;
    }
    if (!list.length) list = App.pick(scopeWords('all'), 10).map(w => ({ w, isNew: false }));
    list = App.shuffle(list);
    const pool = scopeWords('all');
    const qs = list.map(({ w, isNew }) => makeQ(w, isNew ? 'hz2en' : App.pick(['hz2en', 'en2hz', 'py2hz', 'listen', 'tone', 'listen'], 1)[0], pool, { showPy: isNew }));
    root.innerHTML = '<a class="back" href="#/">← Map</a><h1>📅 Daily Mix <span class="sub">每日复习</span></h1><p class="sub">' + due.length + ' review · ' + fresh.length + ' new · words you miss come back sooner.</p><div class="stage" id="dq"></div>';
    runQuiz($('#dq', root), { questions: qs, onDone: (score, total) => {
      const stars = App.finish('daily', score, total);
      doneScreen(root, { stars, score, total, back: '<a class="back" href="#/">← Map</a>', backHash: '#/', extra: '<p>🧠 Words learned so far: <b>' + App.learnedCount() + '</b></p>', again: () => acts.daily(root, true) });
    } });
  };
})();
