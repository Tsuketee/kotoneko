// ชุดทดสอบอัตโนมัติ: node tests/e2e.js  (ต้องติดตั้ง playwright ก่อน: npm install)
// ไม่ต้อง build แอป สคริปต์นี้เปิด http server เล็กๆ เองแล้วรันทดสอบด้วย Chromium
const http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };

const server = http.createServer((q, r) => {
  let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (f.endsWith(path.sep)) f += 'index.html';
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
});

const tests = [];
const test = (name, fn) => tests.push([name, fn]);
const SEED = { goal: 20, days: {}, pet: { name: 'ทดสอบ', sp: 0, energy: 0, bond: 0, d: null, trait: 0, min: 10, lv: 'N5', goal: 'x' } };

async function fresh(browser, base, { seed = true, viewport } = {}) {
  const ctx = await browser.newContext({ viewport: viewport || { width: 820, height: 1100 }, acceptDownloads: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', e => page.errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') page.errors.push(m.text()); });
  if (seed) await page.addInitScript(s => { if (!localStorage.getItem('kn_meta')) localStorage.setItem('kn_meta', JSON.stringify(s)); }, SEED);
  await page.goto(base);
  return page;
}

// ---------- ข้อมูล ----------
test('ข้อมูล: คำคันจิใช้เฉพาะคันจิ N5 ที่มีในแอป ไม่มีคำซ้ำ และบทสนทนาครบ', async (b, base) => {
  const p = await fresh(b, base);
  const r = await p.evaluate(() => {
    const ok = new Set(RAW.trim().split('\n').map(l => l.split(',')[0]));
    const kj = s => [...s].filter(c => /[一-鿿]/.test(c));
    const bad = [];
    W.forEach(x => kj(x.k).forEach(c => ok.has(c) || bad.push(x.k + ':' + c)));
    D.forEach(d => d.turns.forEach(t => kj(t[1]).forEach(c => ok.has(c) || bad.push(t[1] + ':' + c))));
    const noSV = K.filter(x => !SV[x.k]).map(x => x.k), noEX = K.filter(x => !EX[x.k]).map(x => x.k);
    const dupK = K.map(x => x.k).filter((k, i, a) => a.indexOf(k) !== i), badRow = K.filter(x => !x.o || !x.m || !x.c).length;
    const keys = [...W, ...V].map(x => x.k);
    return { noSV, noEX, dupK, badRow, bad, dup: keys.filter((k, i) => keys.indexOf(k) !== i), w: W.length, v: V.length, d: D.length, k: K.length,
      emptyV: V.filter(x => !x.m || !x.c).length, emptyW: W.filter(x => !x.o || !x.m || !x.c).length,
      unbalanced: D.filter(d => d.turns.some(t => (t[1].match(/\{/g) || []).length !== (t[1].match(/\}/g) || []).length)).length };
  });
  assert.deepStrictEqual(r.bad, []); assert.deepStrictEqual(r.dup, []);
  assert.deepStrictEqual([r.noSV, r.noEX, r.dupK, r.badRow], [[], [], [], 0], 'คันจิทุกตัวต้องมีลำดับขีดและตัวอย่างคำ และไม่ซ้ำ');
  assert.strictEqual(r.emptyV + r.emptyW + r.unbalanced, 0);
  assert(r.w >= 100 && r.v >= 100 && r.d >= 10 && r.k === 105, JSON.stringify(r));
});

test('ข้อมูล: ไฟล์ที่ index.html โหลดและ sw.js แคชตรงกัน และ VERSION ถูกรูปแบบ', async () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const srcs = [...html.matchAll(/(?:src|href)="((?:js|css|icons)\/[^"]+|manifest\.webmanifest)"/g)].map(m => m[1]);
  srcs.forEach(s => { assert(fs.existsSync(path.join(ROOT, s)), 'ไม่พบไฟล์ ' + s); assert(sw.includes(`'${s}'`), 'sw.js ไม่ได้แคช ' + s); });
  assert(/const VERSION = 'v\d+'/.test(sw));
  const order = [...html.matchAll(/<script src="(js\/[^"]+)"/g)].map(m => m[1]);
  assert.strictEqual(order[order.length - 1], 'js/main.js', 'main.js ต้องโหลดท้ายสุด');
  assert(order.indexOf('js/core.js') > order.indexOf('js/data/content.js'), 'core.js ต้องโหลดหลังไฟล์ข้อมูล');
  assert(order.indexOf('js/core.js') < order.indexOf('js/learn.js'), 'core.js ต้องโหลดก่อนไฟล์ตรรกะ');
  assert(!fs.existsSync(path.join(ROOT, 'js/app.js')), 'js/app.js ถูกแยกแล้ว ไม่ควรมีอีก');
  fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js')).forEach(f => assert(order.includes('js/' + f), 'index.html ไม่ได้โหลด js/' + f));
});

// ---------- การใช้งานหลัก ----------
test('เปิดแอปครั้งแรก: เข้าหน้าตั้งค่า และตั้งค่าครบแล้วเข้าหน้าแรกได้', async (b, base) => {
  const p = await fresh(b, base, { seed: false });
  assert(await p.locator('text=ยินดีต้อนรับ').count());
  await p.evaluate(() => { obn('🐱 แมว'); document.getElementById('nm').value = 'มะลิ'; obt(); obn('N5'); obn('เพื่อไปสอบวัดระดับ JLPT'); obn('10'); });
  assert(await p.locator('nav#nav button').count() === 4);
  assert.deepStrictEqual(p.errors, []);
});

test('นำทางครบ 4 แท็บ ไม่มี error', async (b, base) => {
  const p = await fresh(b, base);
  for (const t of ['learn', 'mis', 'stats', 'home']) { await p.evaluate(t => goTab(t), t); assert((await p.locator('#app').innerText()).length > 10, t); }
  assert.deepStrictEqual(p.errors, []);
});

test('คันจิ: เปิดการ์ด พลิก ตอบ "จำได้" แล้วบันทึกความคืบหน้า', async (b, base) => {
  const p = await fresh(b, base);
  await p.evaluate(() => openDs('k'));
  await p.locator('#app .card').first().click();
  await p.locator('button:text-is("จำได้")').click();
  const saved = await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('kn5') || '{}')).length);
  assert(saved >= 1);
  assert.deepStrictEqual(p.errors, []);
});

test('ทุกชุดข้อมูล (คานะ/คันจิ/คำคันจิ/คำศัพท์) เปิดได้และทำควิซได้', async (b, base) => {
  const p = await fresh(b, base);
  for (const k of ['a', 'k', 'w', 'v']) {
    await p.evaluate(k => { openDs(k); mode = 'quiz'; go(); }, k);
    assert(await p.locator('.ch button').count() >= 2, 'ควิซ ' + k);
    await p.locator('.ch button').first().click();
  }
  assert.deepStrictEqual(p.errors, []);
});

test('บทสนทนา: ไล่ทุกบทได้ สลับฟุริงะนะได้ และกด "อ่านจบ" บันทึกภารกิจ', async (b, base) => {
  const p = await fresh(b, base);
  await p.evaluate(() => openDs('d'));
  const n = await p.evaluate(() => D.length);
  for (let i = 0; i < n; i++) { await p.evaluate(i => dgo(i), i); assert(await p.locator('.dr').count() >= 3, 'บทที่ ' + i); }
  await p.evaluate(() => dgo(0));
  assert(await p.locator('ruby').count() > 0);
  await p.locator('button:text-is("ふりがな")').click();
  assert.strictEqual(await p.locator('ruby').count(), 0);
  await p.locator('button:has-text("อ่านจบแล้ว")').click();
  assert(await p.evaluate(() => M.pet.d.r.length) === 1);
  assert.deepStrictEqual(p.errors, []);
});

test('เครดิต KanjiVG: มีในหน้าสถิติพร้อมลิงก์และสัญญาอนุญาต และอยู่ในหัวไฟล์ strokes.js', async (b, base) => {
  const hd = fs.readFileSync(path.join(ROOT, 'js/data/strokes.js'), 'utf8').slice(0, 1500);
  assert(hd.includes('kanjivg.tagaini.net') && hd.includes('CC BY-SA 3.0') && hd.includes('Ulrich Apel'));
  const notice = fs.readFileSync(path.join(ROOT, 'NOTICE.md'), 'utf8');
  assert(notice.includes('KanjiVG') && notice.includes('KANJIDIC2'));
  const p = await fresh(b, base);
  await p.evaluate(() => goTab('stats'));
  const links = await p.locator('#credits a').evaluateAll(a => a.map(x => x.href));
  assert(links.includes('https://kanjivg.tagaini.net/') && links.some(l => l.includes('creativecommons.org/licenses/by-sa/3.0')), links.join());
  assert(links.some(l => l.includes('edrdg.org/wiki') && l.includes('KANJIDIC')) && links.some(l => l.includes('edrdg.org/edrdg/licence')), 'ขาดเครดิต KANJIDIC2');
  assert.strictEqual(await p.locator('#credits a[target=_blank][rel~=noopener]').count(), links.length, 'ลิงก์ภายนอกทุกลิงก์ต้องมี target=_blank rel=noopener');
  assert.deepStrictEqual(p.errors, []);
});

test('สถิติ: เปลี่ยนเป้าหมายต่อวันแล้วค่าถูกจำ', async (b, base) => {
  const p = await fresh(b, base);
  await p.evaluate(() => goTab('stats'));
  await p.locator('.seg button:text-is("50")').click();
  assert.strictEqual(await p.evaluate(() => JSON.parse(localStorage.getItem('kn_meta')).goal), 50);
});

test('ส่งออก/นำเข้า: ข้อมูลกลับมาครบ และไฟล์ผิดรูปแบบถูกปฏิเสธ', async (b, base) => {
  const p = await fresh(b, base);
  await p.evaluate(() => localStorage.setItem('kw1', JSON.stringify({ 'テスト': { b: 3, w: 0, d: 1 } })));
  await p.evaluate(() => goTab('stats'));
  const [dl] = await Promise.all([p.waitForEvent('download'), p.locator('button:text-is("ส่งออก")').click()]);
  const f = path.join(require('os').tmpdir(), 'kanji-e2e-' + Date.now() + '.json');
  await dl.saveAs(f);
  const o = JSON.parse(fs.readFileSync(f, 'utf8'));
  assert(o.app === 'kanji-app' && o.data.kw1 && o.data.kn_meta);
  await p.evaluate(() => localStorage.removeItem('kw1')); p.on('dialog', d => d.accept());
  await Promise.all([p.waitForNavigation(), p.setInputFiles('#imp', f)]);
  assert.strictEqual(await p.evaluate(() => JSON.parse(localStorage.getItem('kw1'))['テスト'].b), 3);
  const bad = path.join(require('os').tmpdir(), 'kanji-e2e-bad.json'); fs.writeFileSync(bad, '{"hello":1}');
  await p.evaluate(() => goTab('stats')); await p.setInputFiles('#imp', bad);
  await p.waitForSelector('.toast');
  assert((await p.locator('.toast').innerText()).includes('ไม่ใช่ไฟล์'));
  fs.unlinkSync(f); fs.unlinkSync(bad);
});

// ---------- iPad / PWA ----------
test('iPad แนวตั้งและแนวนอน: หน้าหลักไม่มีแถบเลื่อนแนวนอน', async (b, base) => {
  for (const vp of [{ width: 820, height: 1180 }, { width: 1180, height: 820 }]) {
    const p = await fresh(b, base, { viewport: vp });
    for (const t of ['home', 'learn', 'stats']) {
      await p.evaluate(t => goTab(t), t);
      const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert(over <= 0, `${t} ${vp.width}px เกิน ${over}px`);
    }
  }
});

test('PWA: manifest ถูกต้องและ service worker ติดตั้งแล้วแอปเปิดออฟไลน์ได้', async (b, base) => {
  const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
  assert(m.name && m.start_url && m.display && m.icons.length >= 2);
  m.icons.forEach(i => assert(fs.existsSync(path.join(ROOT, i.src)), 'ไม่พบไอคอน ' + i.src));
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  await p.addInitScript(s => { if (!localStorage.getItem('kn_meta')) localStorage.setItem('kn_meta', JSON.stringify(s)); }, SEED);
  await p.goto(base);
  await Promise.race([p.evaluate(() => navigator.serviceWorker.ready), new Promise((_, j) => setTimeout(() => j(new Error('service worker ติดตั้งไม่สำเร็จ (ดูว่า sw.js แคชไฟล์ที่ไม่มีอยู่หรือเปล่า)')), 8000))]);
  await p.reload(); // ให้ SW คุมหน้า
  await ctx.setOffline(true);
  await p.reload();
  assert((await p.locator('#app').innerText()).length > 10, 'ออฟไลน์แล้วหน้าว่าง');
  await ctx.setOffline(false);
});

(async () => {
  await new Promise(r => server.listen(0, r));
  const base = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch();
  let fail = 0;
  for (const [name, fn] of tests) {
    try { await Promise.race([fn(browser, base), new Promise((_, j) => setTimeout(() => j(new Error('หมดเวลา 30 วินาที')), 30000))]); console.log('  ✓', name); }
    catch (e) { fail++; console.log('  ✗', name, '\n     ', (e.message || e).split('\n')[0]); }
  }
  await browser.close(); server.close();
  console.log(fail ? `\nไม่ผ่าน ${fail}/${tests.length}` : `\nผ่านทั้งหมด ${tests.length} ข้อ`);
  process.exit(fail ? 1 : 0);
})();
