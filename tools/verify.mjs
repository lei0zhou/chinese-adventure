// End-to-end check in headless Chrome. Usage:
//   python3 -m http.server 8811 &   (from the repo root)
//   NODE_PATH=<dir with puppeteer-core> node tools/verify.mjs http://127.0.0.1:8811/ [screenshotDir] [--offline-cmd "kill ..."]
import puppeteer from 'puppeteer-core';
import { execSync } from 'child_process';
const base = process.argv[2] || 'http://127.0.0.1:8811/';
const shots = process.argv[3] || '';
const offlineCmd = process.argv.includes('--offline-cmd') ? process.argv[process.argv.indexOf('--offline-cmd') + 1] : '';
const chrome = process.env.CHROME || '/usr/bin/google-chrome';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = []; const ok = (name, cond, info) => { results.push([name, !!cond, info || '']); console.log((cond ? 'PASS ' : 'FAIL ') + name + (info ? ' — ' + info : '')); };
const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new',
  args: ['--no-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.createBrowserContext();
const page = await ctx.newPage();
const errs = [];
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warn' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', e => errs.push('pageerror: ' + e.message));
page.on('requestfailed', r => { if (!offlineCmd || !r.url().includes('favicon')) errs.push('requestfailed: ' + r.url() + ' ' + (r.failure() || {}).errorText); });
const external = []; page.on('request', r => { const u = new URL(r.url()); if (!['127.0.0.1', 'localhost', new URL(base).hostname].includes(u.hostname) && !u.protocol.startsWith('data') && !u.protocol.startsWith('blob')) external.push(r.url()); });
await page.setViewport({ width: 1280, height: 800 });
const shot = async name => { if (shots) await page.screenshot({ path: shots + '/' + name + '.png' }); };
const go = async h => { await page.evaluate(h => { location.hash = h; }, h); await sleep(350); };
const answerQuiz = async (correctAll = true) => {
  for (let n = 0; n < 30; n++) {
    const has = await page.$('.opt'); if (!has) return n;
    await page.evaluate(c => { const q = App._q; const k = q.options.findIndex(o => o.correct === c); document.querySelectorAll('.opt')[k < 0 ? 0 : k].click(); }, correctAll);
    await sleep(80);
    await page.click('#nextQ'); await sleep(120);
  }
  return 30;
};

await page.goto(base, { waitUntil: 'networkidle0' });
ok('welcome screen', await page.$('#nm'));
await page.type('#nm', 'Explorer'); await page.click('[data-av="🐯"]'); await page.click('#startBtn'); await sleep(500);
ok('home map renders 12 city pins', (await page.$$('.pin')).length === 12);
ok('service worker registers', await page.evaluate(async () => { const r = await navigator.serviceWorker.ready; return !!r.active; }), await page.evaluate(() => window.__swScope || ''));
await shot('01-home-map-1280');

// unit page
await go('#/unit/greet'); ok('unit page shows 8 activities', (await page.$$('.act')).length === 8);
// flashcards
await go('#/play/flash/greet');
await page.click('#card'); await sleep(600);
ok('flashcard flips', await page.$('.flash.flipped'));
await shot('02-flashcards-1280');
for (let n = 0; n < 40 && await page.$('#gotB'); n++) { await page.click('#gotB'); await sleep(30); }
ok('flashcards finish with stars', await page.$('.done-box'), await page.$eval('.big-stars', e => e.textContent));
// tones single + pairs
await go('#/play/tones/all');
for (let n = 0; n < 10; n++) { await page.evaluate(() => { const b = document.querySelectorAll('.tonebtn')[0]; b.click(); }); await sleep(50); await page.click('#nextQ'); await sleep(80); }
ok('tone trainer (single) finishes', await page.$('.done-box'));
await page.evaluate(() => { App.acts.tones.mode = 'pairs'; }); await go('#/play/tones/greet'); await go('#/play/tones/all');
ok('tone pairs render 9 buttons', (await page.$$('.tonebtn')).length === 9);
await page.evaluate(() => { document.querySelectorAll('[data-s="0"] .tonebtn')[0].click(); document.querySelectorAll('[data-s="1"] .tonebtn')[1].click(); });
await page.click('#chk'); ok('tone pair check gives feedback', await page.$eval('.feedback', e => e.textContent.length > 3));
await page.evaluate(() => { App.acts.tones.mode = 'single'; });
// matching
await go('#/play/match/greet');
const ids = await page.$$eval('#L .mcard', els => els.map(e => e.dataset.id));
for (const id of ids) { await page.click(`#L .mcard[data-id="${id}"]`); await page.click(`#R .mcard[data-id="${id}"]`); await sleep(60); }
await sleep(900); ok('matching game completes', await page.$('.done-box'));
// stroke order
await go('#/play/write/greet'); await sleep(1500);
ok('stroke order: hanzi-writer draws SVG', await page.$('#hw svg'));
ok('stroke data bundled for all vocab chars', await page.evaluate(() => { const cs = new Set(App.C.words.map(w => w.hz).join('')); return [...cs].every(c => window.STROKES[c]); }));
await page.click('#test'); await sleep(300);
// draw the first stroke of 你 along its median to check the quiz accepts input
const sbox = await (await page.$('#hw svg')).boundingBox();
const med = await page.evaluate(() => window.STROKES['你'].medians[0]);
const spad = 18, ssc = (294 - 2 * spad) / 1024, sxy = ([x, y]) => [sbox.x + spad + x * ssc, sbox.y + spad + (900 - y) * ssc];
await page.mouse.move(...sxy(med[0])); await page.mouse.down();
for (const p of med.slice(1)) await page.mouse.move(...sxy(p), { steps: 5 });
await page.mouse.up(); await sleep(600);
const drew = await page.evaluate(() => App._strokes || 0);
ok('stroke quiz accepts a correctly drawn stroke', drew > 0, 'correct strokes=' + drew);
await shot('03-stroke-order-1280');
// sentence builder (solve via correct order)
await go('#/play/build/greet');
for (let s = 0; s < 5 && await page.$('#chk'); s++) {
  const n = await page.$$eval('#bank .tile', e => e.length);
  for (let k = 0; k < n; k++) { await page.click(`#bank .tile[data-k="${k}"]`); await sleep(20); }
  await page.click('#chk'); await sleep(100);
  if (await page.$('#nextQ:not(.hidden)')) { await page.click('#nextQ'); await sleep(120); } else break;
}
ok('sentence builder completes', await page.$('.done-box'));
// drag test
await go('#/'); await go('#/play/build/greet');
const t = await page.$('#bank .tile'); const tb = await t.boundingBox(); const ab = await (await page.$('#ans')).boundingBox();
await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2); await page.mouse.down(); await page.mouse.move(ab.x + 40, ab.y + ab.height / 2, { steps: 8 }); await page.mouse.up(); await sleep(100);
ok('drag a tile into the answer box', (await page.$$('#ans .tile')).length === 1);
// reading
await go('#/play/read/greet');
ok('reading shows ruby pinyin', (await page.$$('#psg ruby')).length > 20);
await page.click('#psg ruby'); await sleep(200); ok('tap word shows gloss popup', await page.$('.popup'));
await answerQuiz(true); ok('reading questions complete', await page.$('.done-box'));
// role-play with fake microphone
await go('#/scene/restaurant');
await page.click('[data-role="B"]'); await sleep(400);
await shot('04-roleplay-1280');
let recorded = false;
for (let n = 0; n < 12; n++) {
  if (await page.$('#rec') && !recorded) { await page.click('#rec'); await sleep(700); await page.click('#rec'); await sleep(500); recorded = await page.$eval('#mine', b => !b.disabled); }
  if (!await page.$('#nx')) break; await page.click('#nx'); await sleep(150);
}
ok('role-play: fake-mic recording kept in memory', recorded);
ok('role-play reaches the bow screen', await page.$('#playAll'));
// city challenge passes and unlocks next city
await go('#/play/challenge/greet'); const nq = await answerQuiz(true);
ok('city challenge passes (8 questions)', nq === 8 && await page.evaluate(() => !!App.profile().passed.greet));
ok('next city unlocked', await page.evaluate(() => App.isUnlocked('numbers')));
// daily mix
await go('#/daily'); if (await page.$('#ext')) await page.click('#ext'); await sleep(200);
const dn = await answerQuiz(true); ok('daily mix runs', dn > 0 && await page.$('.done-box'), dn + ' questions');
// passport + parent
await go('#/passport'); ok('passport has a stamp', (await page.$$('.stamp.got')).length >= 1);
await go('#/parent');
const prod = await page.$eval('.card b', e => e.textContent.split('×').map(s => +s.trim()).reduce((a, b) => a * b));
await page.type('#gate', String(prod)); await page.click('#gateBtn'); await sleep(200);
ok('grown-ups gate opens', await page.$('#exp'));
const exported = await page.evaluate(() => JSON.parse(App.exportJSON()));
ok('export JSON contains progress', exported.state && Object.keys(exported.state.profiles).length === 1);
await page.evaluate(j => App.importJSON(j), JSON.stringify(exported)); ok('import JSON round-trips', await page.evaluate(() => !!App.profile().passed.greet));
ok('no external network requests', external.length === 0, external.join(', '));

// tablet screenshots
await page.setViewport({ width: 820, height: 1180, isMobile: true, hasTouch: true });
await go('#/'); await sleep(300); await shot('05-home-tablet-820x1180');
await go('#/play/build/numbers'); await sleep(300); await shot('06-sentence-builder-tablet-820x1180');
await go('#/play/read/numbers'); await sleep(300); await shot('07-story-tablet-820x1180');
await page.setViewport({ width: 1280, height: 800 });

// offline check: stop the server, then reload
if (offlineCmd) {
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: 'networkidle0' }); await sleep(500);
  execSync(offlineCmd); await sleep(800);
  const before = errs.length;
  await page.reload({ waitUntil: 'networkidle0' }).catch(e => errs.push('reload failed ' + e.message)); await sleep(800);
  ok('offline reload renders the app (served by the service worker)', await page.$('#app .stage, #app .card'));
  await go('#/'); ok('works offline after server stopped (home map)', (await page.$$('.pin')).length === 12);
  await go('#/play/write/numbers'); await sleep(1200); ok('offline: stroke data still loads', await page.$('#hw svg'));
  await go('#/unit/numbers'); ok('offline: unit page', (await page.$$('.act')).length === 8);
  errs.splice(before, errs.length - before, ...errs.slice(before).filter(e => !/requestfailed|ERR_CONNECTION_REFUSED/.test(e)));
}
ok('no console errors/warnings', errs.length === 0, errs.join(' | '));
await browser.close();
const failed = results.filter(r => !r[1]);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
