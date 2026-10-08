// Audio checks in headless Chrome. Usage (repo root served on 8811):
//   NODE_PATH=<dir with puppeteer-core> node tools/verify_audio.mjs http://127.0.0.1:8811/
import puppeteer from 'puppeteer-core';
const base = process.argv[2] || 'http://127.0.0.1:8811/';
const chrome = process.env.CHROME || '/usr/bin/google-chrome';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = []; const ok = (name, cond, info) => { results.push([name, !!cond]); console.log((cond ? 'PASS ' : 'FAIL ') + name + (info ? ' — ' + info : '')); };
const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const page = await (await browser.createBrowserContext()).newPage();
const errs = [];
page.on('console', m => { if (['error', 'warn', 'warning'].includes(m.type())) errs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', e => errs.push('pageerror: ' + e.message));
// Record every <audio> play() and its outcome.
await page.evaluateOnNewDocument(() => {
  window.__plays = [];
  const orig = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    const rec = { src: this.src || this.currentSrc, rate: this.playbackRate, ok: null, ended: false, err: null };
    window.__plays.push(rec);
    this.addEventListener('playing', () => { rec.ok = true; }, { once: true });
    this.addEventListener('ended', () => { rec.ended = true; }, { once: true });
    const p = orig.apply(this, arguments);
    if (p && p.catch) p.catch(e => { rec.ok = false; rec.err = e.name; });
    return p;
  };
});
await page.setViewport({ width: 1280, height: 800 });
await page.goto(base, { waitUntil: 'networkidle0' });
await page.type('#nm', 'AudioTester'); await page.click('#startBtn'); await sleep(600);

// 1) manifest + every clip: HTTP 200 and audio MIME type
const man = await page.evaluate(async () => (await fetch('audio/manifest.json', { cache: 'no-store' })).json());
const files = [...new Set(Object.values(man.clips))].concat(['silence.mp3']);
const bad = await page.evaluate(async files => {
  const out = [];
  for (let i = 0; i < files.length; i += 40) {
    await Promise.all(files.slice(i, i + 40).map(async f => {
      const r = await fetch('audio/' + f, { cache: 'no-store' });
      const ct = r.headers.get('content-type') || ''; const b = await r.arrayBuffer();
      if (r.status !== 200 || !/^audio\/(mpeg|mp3)/.test(ct) || b.byteLength < 300) out.push(f + ' ' + r.status + ' ' + ct + ' ' + b.byteLength);
    }));
  }
  return out;
}, files);
ok('all ' + files.length + ' clips load with HTTP 200 + audio/mpeg', bad.length === 0, bad.slice(0, 5).join(', '));
ok('manifest count matches', man.count === Object.keys(man.clips).length, man.count + ' clips, ' + (man.bytes / 1048576).toFixed(2) + ' MB');
// decode a sample to be sure the MP3s are valid
const dec = await page.evaluate(async fs => {
  const ac = new OfflineAudioContext(1, 24000, 24000); const out = [];
  for (const f of fs) { try { const b = await (await fetch('audio/' + f)).arrayBuffer(); const a = await ac.decodeAudioData(b); out.push(a.duration); } catch (e) { out.push(-1); } }
  return out;
}, files.filter((f, i) => i % 25 === 0));
ok('sample of clips decodes', dec.every(d => d > 0.15), dec.length + ' decoded, ' + Math.min(...dec).toFixed(2) + '–' + Math.max(...dec).toFixed(2) + ' s');

// 2) coverage: every string the app can speak has a clip
const missing = await page.evaluate(() => {
  const C = App.C, txt = t => t.map(x => x[0]).join(''), need = new Set();
  C.words.forEach(w => { need.add(w.hz); [...w.hz].forEach(c => need.add(c)); });
  C.toneDemo.forEach(d => need.add(d.hz)); C.toneItems.forEach(t => need.add(t.hz)); C.tonePairs.forEach(t => need.add(t.hz));
  C.sentences.forEach(s => need.add(txt(s.tokens)));
  C.readings.forEach(r => { need.add(txt(r.tokens)); r.tokens.forEach(t => t[1] && need.add(t[0])); });
  C.dialogues.forEach(d => d.lines.forEach(l => { need.add(txt(l.tokens)); l.tokens.forEach(t => t[1] && need.add(t[0])); }));
  need.add('你好！我们一起学中文吧！');
  return [...need].filter(t => !App.clipFor(t));
});
ok('every speakable text has a recording', missing.length === 0, missing.slice(0, 10).join(' '));
ok('default voice mode is "recorded"', await page.evaluate(() => App.voicePrefs().mode === 'recorded' && App.engine('你好') === 'clip'));

// 3) clicking speak buttons plays <audio> without errors
const playCheck = async (label, action, expectSrc) => {
  const n0 = await page.evaluate(() => window.__plays.length);
  await action(); await sleep(1500);
  const plays = await page.evaluate(n0 => window.__plays.slice(n0), n0);
  const good = plays.filter(p => /\/audio\/[^/]+\.mp3$/.test(p.src) && !/silence/.test(p.src) && p.ok === true);
  ok(label, good.length > 0 && !plays.some(p => p.ok === false), good.map(p => p.src.split('/').pop() + (p.ended ? ' ended' : '')).join(', ') || JSON.stringify(plays));
  return good;
};
const go = async h => { await page.evaluate(h => { location.hash = h; }, h); await sleep(400); };
await go('#/play/flash/greet');
const g1 = await playCheck('flashcard "Hear it" plays a clip', () => page.click('.say'));
const clipOk = g1[0] && await page.evaluate(src => { const f = src.split('/').pop(); return Object.entries(App.clips).find(([t, v]) => v === f); }, g1[0].src);
ok('the clip played matches the card', clipOk && await page.evaluate(t => document.querySelector('.say').dataset.say === t, clipOk[0]), clipOk && clipOk[0]);
await sleep(1500);
ok('clip plays to the end ("ended" fired)', await page.evaluate(() => window.__plays.some(p => p.ended)));
await go('#/play/tones/greet');
await page.evaluate(() => document.querySelector('details').open = true);
await playCheck('tone demo 妈 button plays', () => page.click('.demo'));
await playCheck('tone trainer "Play again" plays', () => page.click('#play'));
await go('#/play/read/greet');
await playCheck('story "Read to me" plays', () => page.click('#readAll'));
await playCheck('tapping a story word plays', () => page.click('#psg ruby'));
await go('#/scene/friend'); await page.click('[data-role="A"]'); await sleep(500);
await playCheck('role-play "Hear it" plays the line', () => page.click('#hear'));
ok('no "no Chinese voice" banner when recordings are available', !(await page.$('.banner')));

// 4) voice settings: top-bar quick panel, slow speed, device mode fallback
await go('#/play/flash/greet');
await page.click('#voiceBtn'); await sleep(300);
ok('top-bar 🔊 opens the voice panel with 3 modes', (await page.$$('input[name=vmode]')).length === 3);
await page.click('[data-vspeed="slow"]'); await sleep(200);
await page.click('#vClose'); await sleep(200);
const slow = await playCheck('slow speed still plays', () => page.click('.say'));
ok('slow speed uses playbackRate 0.7', slow.length && Math.abs(slow[0].rate - 0.7) < 0.01, slow[0] && String(slow[0].rate));
const zh = await page.evaluate(() => App.zhVoices.length);
await page.click('#voiceBtn'); await sleep(200);
await page.click('input[name=vmode][value=device]'); await sleep(300);
if (!zh) {
  ok('device mode without a Chinese voice shows a note', await page.evaluate(() => /no Chinese text-to-speech voice/.test(document.querySelector('.modal').textContent)));
  await page.click('#vClose'); await sleep(200);
  await playCheck('device mode with no zh voice falls back to recordings', () => page.click('.say'));
} else { ok('device voices listed', true, zh + ' zh voices'); await page.click('#vClose'); }
ok('voice settings saved per explorer', await page.evaluate(() => { const p = App.profile(); return p.voice && p.voice.mode === 'device' && p.voice.speed === 'slow'; }));
await page.evaluate(() => App.setVoicePrefs({ mode: 'auto', speed: 'normal' }));
await playCheck('auto mode plays recordings', () => page.click('.say'));
ok('no console errors/warnings', errs.length === 0, errs.join(' | '));
await browser.close();
const failed = results.filter(r => !r[1]);
console.log(`\n${results.length - failed.length}/${results.length} audio checks passed`);
process.exit(failed.length ? 1 : 0);
