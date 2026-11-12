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
    const EXP = { first: 1, morning: 2, noon: 2, evening: 2, night: 2, late: 1, partial: 2, done: 2, back: 2, feed: 3, hungry: 1, lv2: 1, lv3: 1, s3: 1, s7: 1, s30: 1, b25: 1, b100: 1, b250: 1, goal: 1 };
    const FORBID = ['อิตาโดริ', 'ลูฟี่', 'โจรสลัด', 'วันพีซ', 'วันพืช', 'Luffy', 'One Piece', 'Itadori'];
    const tbad = [];
    if (TR.length !== 10) tbad.push('จำนวนนิสัย ' + TR.length);
    TR.forEach((t, i) => {
      if (!t.n || /แนว/.test(t.n)) tbad.push('ป้ายชื่อนิสัย ' + i + ' ห้ามอ้างอิงผลงาน/ตัวละครด้วยคำว่า "แนว...": ' + t.n);
      const got = Object.fromEntries(Object.entries(t.s).map(([k, v]) => [k, v.length]));
      if (JSON.stringify(got) !== JSON.stringify(EXP)) tbad.push('ช่อง/จำนวนประโยคนิสัย ' + i + ' ' + JSON.stringify(got));
      const all = [t.n, ...Object.values(t.s).flat()];
      all.forEach(l => { if (!l || !l.trim()) tbad.push('ประโยคว่าง ' + i); FORBID.forEach(w => { if (l.includes(w)) tbad.push('ห้ามใช้ชื่อเฉพาะ "' + w + '" ในนิสัย ' + i); }); });
      if (new Set(Object.values(t.s).flat()).size !== 29) tbad.push('ประโยคซ้ำในนิสัย ' + i);
    });
    const EMO = /[\u2600-\u27BF\u{1F300}-\u{1FAFF}\uFE0F]/u;
    TR.forEach((t, i) => { if (!P[t.i]) tbad.push('นิสัย ' + i + ' ไม่มีไอคอน ' + t.i); [t.n, ...Object.values(t.s).flat()].forEach(l => { if (EMO.test(l)) tbad.push('ห้ามมีอิโมจิในบทพูด (ใช้ไอคอนเส้นแทน) นิสัย ' + i + ': ' + l); }); });
    const gbad = [];
    G.forEach((g, i) => {
      const txt = [g.t, g.s, ...g.notes, ...g.ex.flat(), ...g.qs.flatMap(q => [q.q, q.why, ...q.opts])].join('');
      kj(txt).forEach(c => ok.has(c) || bad.push('G' + g.id + ':' + c));
      if (g.id !== i + 1 || g.notes.length < 3 || g.ex.length < 4 || g.qs.length < 4) gbad.push('โครงสร้างบท ' + g.id);
      if ((txt.match(/\{/g) || []).length !== (txt.match(/\}/g) || []).length) gbad.push('วงเล็บฟุริงะนะบท ' + g.id);
      g.ex.forEach(e => { if (!e[0] || !e[1]) gbad.push('ตัวอย่างว่าง ' + g.id); });
      g.qs.forEach(q => {
        if ((q.q.match(/___/g) || []).length !== 1) gbad.push('ช่องว่างโจทย์ ' + g.id + ' ' + q.q);
        if (q.opts.length < 2 || q.opts.length > 4 || new Set(q.opts).size !== q.opts.length || !q.why) gbad.push('ตัวเลือก/คำอธิบาย ' + g.id + ' ' + q.q);
      });
    });
    const noSV = K.filter(x => !SV[x.k]).map(x => x.k), noEX = K.filter(x => !EX[x.k]).map(x => x.k);
    const dupK = K.map(x => x.k).filter((k, i, a) => a.indexOf(k) !== i), badRow = K.filter(x => !x.o || !x.m || !x.c).length;
    const keys = [...W, ...V].map(x => x.k);
    return { tbad, gbad, g: G.length, noSV, noEX, dupK, badRow, bad, dup: keys.filter((k, i) => keys.indexOf(k) !== i), w: W.length, v: V.length, d: D.length, k: K.length,
      emptyV: V.filter(x => !x.m || !x.c).length, emptyW: W.filter(x => !x.o || !x.m || !x.c).length,
      unbalanced: D.filter(d => d.turns.some(t => (t[1].match(/\{/g) || []).length !== (t[1].match(/\}/g) || []).length)).length };
  });
  assert.deepStrictEqual(r.bad, []); assert.deepStrictEqual(r.dup, []);
  assert.deepStrictEqual(r.tbad, [], 'บทพูดสัตว์เลี้ยง'); assert.deepStrictEqual(r.gbad, [], 'เนื้อหาไวยากรณ์'); assert(r.g >= 10);
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

test('ทบทวนแบบเว้นระยะ: ขั้นบันได ตอบผิดลดครึ่ง ฝึกก่อนครบกำหนดไม่ขยับ และเกณฑ์จำได้แม่น', async (b, base) => {
  const p = await fresh(b, base);
  const r = await p.evaluate(() => {
    const DAY = 864e5, T = 1e12, mid = () => 0.5, o = {};
    // ข้อใหม่ตอบถูก -> ขั้น 1 นัดใน 10 นาที
    let s = srsNext(undefined, true, T, mid); o.first = [s.b, s.d - T];
    // ตอบถูกตอนครบกำหนดทุกครั้ง: ขั้นขึ้นทีละ 1 ช่วงห่างเพิ่มขึ้นเรื่อยๆ ถึงขั้นสูงสุดแล้วไม่เกิน
    const steps = []; let t = T; s = undefined;
    for (let i = 0; i < 12; i++) { s = srsNext(s, true, t, mid); steps.push([s.b, Math.round((s.d - t) / DAY * 100) / 100]); t = s.d; }
    o.steps = steps;
    // ช่วงห่างที่ขั้น >=3 สุ่มเยื้องได้ไม่เกิน ±10%
    const lo = srsNext({ b: 3, d: 0 }, true, T, () => 0), hi = srsNext({ b: 3, d: 0 }, true, T, () => 0.999999);
    o.jit = [(lo.d - T) / IV[4], (hi.d - T) / IV[4]];
    // ตอบผิด: ขั้นลดครึ่ง (ปัดลง) ผิดนับเพิ่ม นัดใน 30 วินาที
    o.wrong = [8, 5, 3, 1, 0].map(b => { const w = srsNext({ b, w: 1, d: T }, false, T, mid); return [w.b, w.w, w.d - T]; });
    // ตอบถูกตอนยังไม่ครบกำหนด (ฝึกสุ่ม): ไม่ขยับขั้นและนัดเดิม
    const early = srsNext({ b: 2, w: 0, d: T + 5 * DAY }, true, T, mid); o.early = [early.b, early.d - T];
    // ถึง MASTERY ล้างจำนวนผิด
    o.master = srsNext({ b: MASTERY - 1, w: 4, d: T }, true, T, mid).w;
    // ข้อมูลเดิมที่เก็บไว้ (b สูงสุด 5) ยังใช้ต่อได้ และ input ไม่ถูกแก้
    const old = { b: 5, w: 0, d: T }; const next = srsNext(old, true, T, mid); o.old = [old.b, next.b];
    o.cfg = [IV.length, MASTERY, IV.every((v, i) => i < 2 || v > IV[i - 1])];
    return o;
  });
  assert.deepStrictEqual(r.first, [1, 600000]);
  assert.deepStrictEqual(r.steps.map(x => x[0]), [1, 2, 3, 4, 5, 6, 7, 8, 8, 8, 8, 8]);
  assert.deepStrictEqual(r.steps.slice(0, 5).map(x => x[1]), [0.01, 1, 3, 7, 16]);
  assert(r.steps[7][1] === 150 && r.steps[11][1] === 150, 'ขั้นสูงสุดต้องคงที่ 150 วัน ' + JSON.stringify(r.steps));
  assert(r.jit[0] >= 0.9 - 1e-9 && r.jit[1] <= 1.1 + 1e-9 && r.jit[0] < r.jit[1], JSON.stringify(r.jit));
  assert.deepStrictEqual(r.wrong, [[4, 2, 30000], [2, 2, 30000], [1, 2, 30000], [0, 2, 30000], [0, 2, 30000]]);
  assert.deepStrictEqual(r.early, [2, 5 * 864e5]);
  assert.strictEqual(r.master, 0);
  assert.deepStrictEqual(r.old, [5, 6]);
  assert.deepStrictEqual(r.cfg, [9, 4, true]);
  // นำไปใช้จริงในหน้าเรียน: ตอบถูกในการ์ดแล้วบันทึกขั้น 1 และผิดแล้วลดขั้น
  await p.evaluate(() => { openDs('k'); cur = K[0]; fl = true; render(); });
  await p.locator('button:text-is("จำได้")').click();
  assert.strictEqual(await p.evaluate(() => JSON.parse(localStorage.getItem('kn5'))[K[0].k].b), 1);
  assert.deepStrictEqual(p.errors, []);
});

test('ไวยากรณ์: เปิดรายการ อ่านบท ทำแบบฝึกหัด ผ่าน/ไม่ผ่าน บันทึกและส่งออกความคืบหน้า', async (b, base) => {
  const p = await fresh(b, base);
  await p.evaluate(() => goTab('learn')); await p.evaluate(() => { tab = 'learn'; nv('n5'); });
  await p.locator('.pc:has-text("ไวยากรณ์")').click();
  assert.strictEqual(await p.locator('.pc .gp').count(), await p.evaluate(() => G.length));
  await p.locator('.pc').first().click();
  assert(await p.locator('.gn').count() >= 3 && await p.locator('.ge').count() >= 4 && await p.locator('ruby').count() > 0);
  await p.locator('button:text-is("ふりがな")').click(); assert.strictEqual(await p.locator('ruby').count(), 0);
  // ตอบผิดหมด -> ไม่ผ่าน ขั้นไม่ขึ้น
  await p.locator('button:has-text("ลองทำแบบฝึกหัด")').click();
  const n = await p.evaluate(() => gq.length);
  for (let i = 0; i < n; i++) {
    const wrong = await p.evaluate(() => gq[gqi].opts.findIndex(o => !o.ok));
    await p.locator('.ch button').nth(wrong).click();
    assert(await p.locator('.gw .no-i').count() === 1 && await p.locator('.gw .ok-i').count() === 0);
    await p.locator('.btns .nx').click();
  }
  assert((await p.locator('.card').innerText()).includes('0/' + n));
  let kg = await p.evaluate(() => JSON.parse(localStorage.getItem('kg1'))['1']);
  assert.strictEqual(kg.b, 0); assert.strictEqual(kg.w, 1); assert.strictEqual(kg.best, 0);
  // ตอบถูกหมด -> ผ่าน ขั้น 1
  await p.locator('button:text-is("ทำอีกครั้ง")').click();
  for (let i = 0; i < n; i++) {
    const right = await p.evaluate(() => gq[gqi].opts.findIndex(o => o.ok));
    await p.locator('.ch button').nth(right).click();
    assert(await p.locator('.gw .ok-i').count() === 1 && await p.locator('.gw .no-i').count() === 0);
    await p.locator('.btns .nx').click();
  }
  assert((await p.locator('.card').innerText()).includes('ผ่านแล้ว'));
  kg = await p.evaluate(() => JSON.parse(localStorage.getItem('kg1'))['1']);
  assert.strictEqual(kg.b, 1); assert.strictEqual(kg.best, n);
  // ผิดได้ 1 ข้อยังผ่าน
  await p.evaluate(() => { gi = 1; gstart(); });
  const m = await p.evaluate(() => gq.length);
  for (let i = 0; i < m; i++) {
    const idx = await p.evaluate(i => gq[gqi].opts.findIndex(o => i === 0 ? !o.ok : o.ok), i);
    await p.locator('.ch button').nth(idx).click(); await p.locator('.btns .nx').click();
  }
  assert((await p.locator('.card').innerText()).includes('ผ่านแล้ว'));
  // ไม่ล้นจอ iPad และส่งออกมี kg1
  assert(await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth) <= 0);
  await p.evaluate(() => goTab('stats'));
  assert(await p.locator('.mi:has-text("ไวยากรณ์")').count() === 1);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.locator('button:text-is("ส่งออก")').click()]);
  const f = path.join(require('os').tmpdir(), 'kanji-e2e-g-' + Date.now() + '.json'); await dl.saveAs(f);
  const o = JSON.parse(fs.readFileSync(f, 'utf8')); fs.unlinkSync(f);
  assert(o.data.kg1 && o.data.kg1['1'] && o.data.kg1['2']);
  assert.deepStrictEqual(p.errors, []);
});

test('สัตว์เลี้ยง: บทพูดตามช่วงเวลาคงที่ในชั่วโมงเดียว, เหตุการณ์ต่างๆ, ข้อความเด้งต่อคิว', async (b, base) => {
  const p = await fresh(b, base);
  const at = async (iso) => { await p.clock.setFixedTime(new Date(iso)); };
  const lines = await p.evaluate(() => TR[0].s);
  const say = (dn = 0) => p.evaluate(dn => { const q = M.pet; return psay(q, dn); }, dn);
  // นิสัย 0 เจอกันวันนี้: dn=0 และ rv=วันนี้ => first ; ปิดโดยตั้ง rv เป็นวันเก่า
  await p.evaluate(() => { M.pet.trait = 0; M.pet.rv = '2000-01-01'; M.pet.back = null; });
  const slots = [['2026-11-11T09:10:00', 'morning'], ['2026-11-11T13:00:00', 'noon'], ['2026-11-11T17:30:00', 'evening'], ['2026-11-11T22:00:00', 'night'], ['2026-11-11T02:00:00', 'late']];
  for (const [iso, key] of slots) {
    await at(iso);
    const a = await say(), b2 = await say(), c = await say();
    assert(lines[key].includes(a), key + ' ต้องอยู่ในรายการ: ' + a);
    assert(a === b2 && b2 === c, key + ' ต้องคงที่ภายในชั่วโมงเดียว');
  }
  // ต่างชั่วโมง/ต่างวัน อย่างน้อยหนึ่งช่วงที่มีสองประโยคต้องเลือกได้ครบทั้งสองประโยคในหลายวัน
  const seen = new Set();
  for (let d = 1; d <= 20; d++) { await at(`2026-11-${String(d).padStart(2, '0')}T09:10:00`); seen.add(await say()); }
  assert.strictEqual(seen.size, 2, 'ควรเห็นทั้งสองประโยคเช้าในหลายวัน');
  // ภารกิจ: บางส่วน / ครบ
  await at('2026-11-11T09:10:00');
  await p.evaluate(() => { pens(); M.pet.d.done = { rev: 1 }; });
  assert(lines.partial.includes(await say(1)));
  assert(lines.done.includes(await say(3)));
  // เจอกันครั้งแรก / กลับมาหลังหาย
  await p.evaluate(() => { M.pet.rv = dstr(new Date()); });
  assert(lines.first.includes(await say(0)));
  await p.evaluate(() => { M.pet.rv = '2000-01-01'; M.pet.last = '2026-11-01'; M.pet.lastTs = Date.now() - 5 * 864e5; });
  assert(lines.back.includes(await say(0)));
  // ให้อาหาร: Energy พอ -> ประโยค feed + ความสนิท +10 ; ไม่พอ -> ประโยค hungry
  const toastText = () => p.evaluate(() => { const e = document.querySelectorAll('.toast'); return e.length ? e[e.length - 1].innerText : ''; });
  await p.evaluate(() => { M.pet.energy = 100; M.pet.bond = 0; pfeed(); });
  let tx = await toastText(); assert(lines.feed.some(l => tx.includes(l)), 'feed: ' + tx);
  assert.deepStrictEqual(await p.evaluate(() => [M.pet.energy, M.pet.bond]), [70, 10]);
  await p.evaluate(() => { document.querySelectorAll('.toast').forEach(e => e.remove()); M.pet.energy = 5; pfeed(); });
  await p.waitForTimeout(2500); tx = await toastText();
  assert(lines.hungry.some(l => tx.includes(l)), 'hungry: ' + tx);
  // โตเป็นร่าง 2 และ 3 : เด้งเฉพาะตอนข้ามขั้น
  await p.evaluate(() => { document.querySelectorAll('.toast').forEach(e => e.remove()); toastFree = 0; M.pet.bond = 30; pbond(5); });
  assert.strictEqual(await p.locator('.toast').count(), 0, 'ยังไม่ข้ามขั้นต้องไม่เด้ง');
  await p.evaluate(() => pbond(10)); tx = await toastText(); assert(lines.lv2.some(l => tx.includes(l)), 'lv2: ' + tx);
  await p.evaluate(() => { document.querySelectorAll('.toast').forEach(e => e.remove()); toastFree = 0; M.pet.bond = 115; pbond(10); });
  tx = await toastText(); assert(lines.lv3.some(l => tx.includes(l)), 'lv3: ' + tx);
  // เหรียญ: ครั้งแรกจำระดับไว้เฉยๆ ; พอข้าม 25 ข้อค่อยเด้ง ; ไม่เด้งซ้ำ
  await p.evaluate(() => { document.querySelectorAll('.toast').forEach(e => e.remove()); toastFree = 0; delete M.pet.bd; pbadge(); });
  assert.strictEqual(await p.locator('.toast').count(), 0); assert.strictEqual(await p.evaluate(() => M.pet.bd), 0);
  await p.evaluate(() => { const o = {}; for (let i = 0; i < 25; i++) o['k' + i] = { b: MASTERY, w: 0, d: 1 }; localStorage.setItem('kw1', JSON.stringify(o)); pbadge(); });
  tx = await toastText(); assert(lines.b25.some(l => tx.includes(l)), 'b25: ' + tx);
  await p.evaluate(() => { document.querySelectorAll('.toast').forEach(e => e.remove()); pbadge(); });
  assert.strictEqual(await p.locator('.toast').count(), 0, 'ไม่ควรเด้งเหรียญซ้ำ');
  // ถึงเป้ารายวัน: streak 3 -> ประโยค s3 ; ไม่ใช่ milestone -> goal
  await p.evaluate(() => { document.querySelectorAll('.toast').forEach(e => e.remove()); toastFree = 0; const g = M.goal; M.days = {}; for (const n of [1, 2]) { const d = new Date(); d.setDate(d.getDate() - n); M.days[dstr(d)] = g; } M.days[dstr(new Date())] = g - 1; tick(); });
  tx = await toastText(); assert(lines.s3.some(l => tx.includes(l)), 's3: ' + tx);
  await p.evaluate(() => { document.querySelectorAll('.toast').forEach(e => e.remove()); toastFree = 0; M.days = {}; M.days[dstr(new Date())] = M.goal - 1; tick(); });
  tx = await toastText(); assert(lines.goal.some(l => tx.includes(l)), 'goal: ' + tx);
  // ข้อความเด้งหลายอันต่อคิว: แสดงอันแรกทันที อันสองรอจนอันแรกหาย
  await p.evaluate(() => { document.querySelectorAll('.toast').forEach(e => e.remove()); toastFree = 0; toast('คิว1'); toast('คิว2'); });
  assert.deepStrictEqual(await p.locator('.toast').allInnerTexts(), ['คิว1']);
  await p.waitForTimeout(2600);
  assert.deepStrictEqual(await p.locator('.toast').allInnerTexts(), ['คิว2']);
  assert.deepStrictEqual(p.errors, []);
});

test('ธีม A และไอคอนเส้น: ตัวแปรสีครบทั้งสองโหมด, สีตอบผิดแยกจากสีหลัก, ไม่มีอิโมจิในหน้าจอ (ยกเว้นตัวสัตว์เลี้ยงชั่วคราว)', async (b, base) => {
  const css = fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8');
  for (const v of ['--bg', '--fg', '--mut', '--card', '--ac', '--onac', '--ok', '--err', '--hl', '--bd']) assert((css.match(new RegExp(v + ':', 'g')) || []).length >= 3, 'ธีมต้องกำหนด ' + v + ' ทั้งสว่าง/มืด(2 แบบ)');
  assert(/--ac:#b45428/.test(css), 'สีหลักของธีม A');
  assert(!/\.ch \.w\{[^}]*var\(--ac\)/.test(css), 'สีตอบผิดต้องใช้ --err ไม่ใช่ --ac');
  const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
  const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + .05) / (y + .05); };
  const tok = (src, name) => (src.match(new RegExp(name + ':(#[0-9a-fA-F]{6})')) || [])[1];
  const light = css.split('\n')[0], dark = css.split('\n')[1];
  for (const [src, nm] of [[light, 'สว่าง'], [dark, 'มืด']]) {
    for (const [fg, bg, min] of [['--fg', '--bg', 7], ['--mut', '--bg', 4.5], ['--ac', '--bg', 4.5], ['--err', '--bg', 4.5], ['--ok', '--bg', 4.5], ['--onac', '--ac', 4.5], ['--onac', '--ok', 3.5], ['--onac', '--err', 3.5]]) {
      const f = tok(src, fg), g = tok(src, bg); assert(f && g, nm + ' ไม่พบ ' + fg + '/' + bg);
      assert(cr(f, g) >= min, `${nm}: ${fg} บน ${bg} คอนทราสต์ ${cr(f, g).toFixed(2)} < ${min}`);
    }
  }
  const p = await fresh(b, base);
  const emo = /[\u2600-\u27BF\u{1F300}-\u{1FAFF}\uFE0F]/u, bad = [];
  const scan = async (label) => { const t = (await p.evaluate(() => document.getElementById('app').innerText + document.getElementById('nav').innerText)).replace(/[\u{1F431}\u{1F430}\u{1F436}]/gu, ''); const m = t.match(new RegExp(emo.source, 'gu')) || []; if (m.length) bad.push(label + ': ' + m.join('')); };
  await p.evaluate(() => { M.pet.energy = 100; }); await scan('home');
  for (const t of ['learn', 'mis', 'stats']) { await p.evaluate(t => goTab(t), t); await scan(t); }
  await p.evaluate(() => { tab = 'learn'; nv('n5'); }); await scan('path');
  await p.evaluate(() => openDs('g')); await scan('grammar'); await p.evaluate(() => { gOpen(0); gstart(); gpick(0); }); await scan('quiz'); await p.evaluate(() => { gqi = gq.length; gfinish(); render(); }); await scan('result');
  await p.evaluate(() => { openDs('d'); dgo(0); }); await scan('dialogue');
  assert.deepStrictEqual(bad, [], 'อิโมจิหลงเหลือ');
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

// ---------- บัญชีและซิงก์คลาวด์ (จำลอง Supabase ไม่ต่อเน็ตจริง) ----------
// เซิร์ฟเวอร์จำลองใช้ร่วมกันหลายเครื่อง (หลาย browser context) เพื่อทดสอบการซิงก์ข้ามเครื่อง
function mockCloud() {
  const db = { row: null, calls: [], n: 0, ent: [], packs: {}, admin: false, uploads: 0, price: null, checkouts: [] };
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS' };
  const json = (route, status, body) => route.fulfill({ status, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const tok = () => ({ access_token: 'at' + (++db.n), refresh_token: 'rt' + db.n, expires_in: 3600, user: { id: 'u1', email: 'a@b.co' } });
  const handler = async route => {
    const q = route.request(), u = new URL(q.url()), m = q.method(), body = q.postData() ? JSON.parse(q.postData()) : null;
    if (m === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    db.calls.push(m + ' ' + u.pathname + u.search);
    if (u.pathname === '/auth/v1/otp') return json(route, 200, {});
    if (u.pathname === '/auth/v1/verify') return body.token === '123456' ? json(route, 200, tok()) : json(route, 403, { msg: 'Token has expired or is invalid' });
    if (u.pathname === '/auth/v1/token') return body.refresh_token ? json(route, 200, tok()) : json(route, 400, { msg: 'bad' });
    if (u.pathname === '/rest/v1/rpc/delete_my_account') {
      if (db.noRpc) return json(route, 404, { code: 'PGRST202', message: 'Could not find the function' });
      if (q.headers().authorization !== 'Bearer at' + db.n) return json(route, 401, { message: 'JWT expired' });
      db.row = null; db.deleted = true; return route.fulfill({ status: 204, headers: cors });
    }
    if (u.pathname === '/auth/v1/logout') return route.fulfill({ status: 204, headers: cors });
    // ----- Edge Function ชำระเงิน (จำลองพฤติกรรมของ supabase/functions/checkout) -----
    if (u.pathname === '/functions/v1/checkout') {
      if (!db.price) return json(route, 404, { error: 'not for sale' });
      if (body.action === 'price') return json(route, 200, { level: body.level, ...db.price });
      if (q.headers().authorization !== 'Bearer at' + db.n) return json(route, 401, { error: 'login' });
      if (db.ent.includes(body.level)) return json(route, 409, { error: 'owned' });
      db.checkouts.push(body.level); return json(route, 200, { url: 'https://checkout.stripe.com/c/pay/cs_test_1' });
    }
    // ----- เนื้อหาเสียเงิน -----
    const authed = q.headers().authorization === 'Bearer at' + db.n;
    if (u.pathname.startsWith('/rest/v1/') && u.pathname !== '/rest/v1/progress' && u.pathname !== '/rest/v1/rpc/delete_my_account' && !authed) return json(route, 401, { message: 'JWT expired' });
    if (u.pathname === '/rest/v1/rpc/is_admin') return json(route, 200, !!db.admin);
    if (u.pathname === '/rest/v1/entitlements') return json(route, 200, db.ent.map(level => ({ level })));
    if (u.pathname === '/rest/v1/content_packs') {
      const ok = l => db.admin || db.ent.includes(l);
      if (m === 'GET') {
        const lv = (u.searchParams.get('level') || '').replace('eq.', '');
        const rows = Object.entries(db.packs).filter(([l]) => ok(l) && (!lv || l === lv));
        return json(route, 200, rows.map(([level, p]) => u.searchParams.get('select').includes('data') ? { version: p.version, data: p } : { level, version: p.version }));
      }
      if (m === 'POST') { if (!db.admin) return json(route, 403, { message: 'new row violates row-level security policy' }); db.packs[body.level] = body.data; db.uploads++; return route.fulfill({ status: 201, headers: cors }); }
    }
    if (u.pathname === '/rest/v1/progress') {
      if (q.headers().authorization !== 'Bearer at' + db.n) return json(route, 401, { message: 'JWT expired' });
      if (m === 'GET') return json(route, 200, db.row ? [db.row] : []);
      if (m === 'POST') { if (db.row) return json(route, 409, { message: 'duplicate key' }); db.row = { ...body, updated_at: new Date().toISOString() }; return json(route, 201, [db.row]); }
      if (m === 'PATCH') {
        const rev = +u.searchParams.get('rev').replace('eq.', '');
        if (!db.row || db.row.rev !== rev) return json(route, 200, []);
        db.row = { ...db.row, ...body, updated_at: new Date().toISOString() }; return json(route, 200, [db.row]);
      }
    }
    return json(route, 404, { message: 'not mocked' });
  };
  db.attach = async p => {
    await p.context().route('**/js/data/cloud-config.js', r => r.fulfill({ contentType: 'text/javascript', body: "const CLOUD={url:'https://sb.test',key:'anon'};" }));
    await p.context().route('https://sb.test/**', handler);
  };
  return db;
}
async function cloudPage(browser, base, db, opts) {
  const ctx = await browser.newContext({ viewport: { width: 820, height: 1100 }, serviceWorkers: 'block' });
  const p = await ctx.newPage(); p.errors = [];
  p.on('pageerror', e => p.errors.push(e.message));
  await db.attach(p);
  if (!opts || opts.seed !== false) await p.addInitScript(s => { if (!localStorage.getItem('kn_meta')) localStorage.setItem('kn_meta', JSON.stringify(s)); }, SEED);
  await p.goto(base);
  return p;
}
async function login(p, code = '123456') {
  await p.fill('#cem', 'a@b.co'); await p.locator('button:text-is("ส่งรหัส")').click();
  await p.waitForSelector('#ccd'); await p.fill('#ccd', code); await p.locator('button:text-is("ยืนยัน")').click();
}

test('ซิงก์: ไม่ได้ตั้งค่าคลาวด์ ซ่อนส่วนบัญชีทั้งหมด และ sw ไม่แคชคำขอข้ามโดเมน', async (b, base) => {
  const ctx = await b.newContext({ viewport: { width: 820, height: 1100 }, serviceWorkers: 'block' });
  await ctx.route('**/js/data/cloud-config.js', r => r.fulfill({ contentType: 'text/javascript', body: "const CLOUD={url:'',key:''};" }));
  const p = await ctx.newPage(); p.errors = [];
  p.on('pageerror', e => p.errors.push(e.message));
  await p.addInitScript(s => localStorage.setItem('kn_meta', JSON.stringify(s)), SEED);
  await p.goto(base);
  await p.evaluate(() => goTab('stats'));
  assert.strictEqual(await p.locator('#cloud').count(), 0);
  assert(!(await p.locator('#app').innerText()).includes('บัญชีและซิงก์'));
  assert(fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8').includes('origin !== location.origin'));
  assert.deepStrictEqual(p.errors, []);
});

test('ซิงก์: เข้าสู่ระบบด้วยรหัสอีเมล ส่งขึ้นคลาวด์ แก้แล้วส่งรุ่นใหม่ และต่ออายุ token', async (b, base) => {
  const db = mockCloud(), p = await cloudPage(b, base, db);
  await p.evaluate(() => { localStorage.setItem('kw1', JSON.stringify({ 'テスト': { b: 4, w: 0, d: 1 } })); goTab('stats'); });
  await login(p, '000000');
  await p.waitForSelector('.cer');
  assert((await p.locator('.cer').innerText()).includes('รหัสไม่ถูกต้อง'));
  await p.fill('#ccd', '123456'); await p.locator('button:text-is("ยืนยัน")').click();
  await p.waitForSelector('button:text-is("ออกจากระบบ")');
  await p.waitForFunction(() => !cloudBusy);
  assert.strictEqual(db.row.rev, 1); assert.strictEqual(db.row.data.kw1['テスト'].b, 4); assert(db.row.data.kn_meta.pet.name);
  assert(!('kn_cloud' in db.row.data), 'สถานะการเข้าสู่ระบบต้องไม่ถูกซิงก์');
  // ไม่มีอะไรเปลี่ยน ไม่ต้องส่งซ้ำ
  assert.strictEqual(await p.evaluate(() => cloudSync(false)), 'clean');
  await p.evaluate(() => { localStorage.setItem('kw1', JSON.stringify({ 'テスト': { b: 5, w: 0, d: 1 } })); });
  assert.strictEqual(await p.evaluate(() => cloudSync(false)), 'pushed');
  assert.strictEqual(db.row.rev, 2); assert.strictEqual(db.row.data.kw1['テスト'].b, 5);
  // token หมดอายุ: ต่ออายุอัตโนมัติก่อนเรียก
  await p.evaluate(() => { CS.exp = 0; csave(); localStorage.setItem('kv1', '{"x":{"b":1,"w":0,"d":1}}'); });
  assert.strictEqual(await p.evaluate(() => cloudSync(true)), 'pushed');
  assert(db.calls.some(c => c.startsWith('POST /auth/v1/token')));
  // ลำดับ key สลับ (เหมือน jsonb) ต้องไม่นับว่ามีของใหม่
  await p.evaluate(() => { const m = JSON.parse(localStorage.getItem('kn_meta')); const r = {}; Object.keys(m).reverse().forEach(k => r[k] = m[k]); localStorage.setItem('kn_meta', JSON.stringify(r)); });
  assert.strictEqual(await p.evaluate(() => cloudSync(false)), 'clean');
  p.on('dialog', d => d.accept());
  await p.locator('button:text-is("ออกจากระบบ")').click();
  await p.waitForSelector('#cem');
  assert.strictEqual(await p.evaluate(() => localStorage.getItem('kn_cloud')), '{}');
  assert(await p.evaluate(() => localStorage.getItem('kw1')), 'ออกจากระบบแล้วความคืบหน้าต้องยังอยู่');
  assert.deepStrictEqual(p.errors, []);
});

test('ซิงก์: เครื่องใหม่เข้าสู่ระบบจากหน้าตั้งค่าครั้งแรก แล้วได้ความคืบหน้าและสัตว์เลี้ยงเดิม', async (b, base) => {
  const db = mockCloud();
  db.row = { user_id: 'u1', rev: 3, updated_at: new Date().toISOString(), data: { kn_meta: SEED, kn5: { '日': { b: 6, w: 0, d: 1 } } } };
  const p = await cloudPage(b, base, db, { seed: false });
  await p.locator('button:text-is("มีบัญชีอยู่แล้ว? เข้าสู่ระบบ")').click();
  await Promise.all([p.waitForNavigation(), login(p)]);
  await p.waitForSelector('.toast');
  assert((await p.locator('#app').innerText()).includes('เส้นทางเรียน'), 'ต้องเข้าหน้าแรกได้เลย ไม่ต้องตั้งค่าใหม่');
  assert.strictEqual(await p.evaluate(() => JSON.parse(localStorage.getItem('kn5'))['日'].b), 6);
  // ข้อมูลทดสอบเป็นสัตว์เลี้ยงที่ยังไม่เคยเปิดหน้าแรก แอปจึงเติมค่าเริ่มต้น (วันล่าสุด เหรียญ) แล้วส่งขึ้นได้ 1 ครั้ง หลังจากนั้นต้องนิ่ง
  await p.waitForFunction(() => !cloudBusy);
  const rev = db.row.rev; assert(rev <= 4, 'rev ' + rev);
  assert.strictEqual(await p.evaluate(() => cloudSync(true)), 'clean');
  await p.reload(); await p.waitForFunction(() => !cloudBusy);
  assert.strictEqual(db.row.rev, rev, 'เปิดแอปซ้ำต้องไม่ส่งรุ่นใหม่ขึ้นไปเรื่อยๆ');
  assert.strictEqual(db.row.data.kn5['日'].b, 6);
  assert.deepStrictEqual(p.errors, []);
});

test('ซิงก์: สองเครื่องแก้พร้อมกัน ถามให้เลือก ทั้ง "ใช้ของเครื่องนี้" และ "ใช้ของคลาวด์"', async (b, base) => {
  const db = mockCloud(), p = await cloudPage(b, base, db);
  await p.evaluate(() => goTab('stats')); await login(p);
  await p.waitForSelector('button:text-is("ออกจากระบบ")'); await p.waitForFunction(() => !cloudBusy);
  // เครื่องอื่นส่งรุ่นใหม่ขึ้นไป ขณะที่เครื่องนี้ก็เรียนเพิ่ม
  db.row = { ...db.row, rev: 2, data: { ...db.row.data, kv1: { 'cloud': { b: 9, w: 0, d: 1 } } } };
  await p.evaluate(() => localStorage.setItem('kv1', JSON.stringify({ 'local': { b: 1, w: 0, d: 1 } })));
  assert.strictEqual(await p.evaluate(() => cloudSync(false)), 'later', 'ส่งขึ้นเงียบๆ ต้องไม่ทับของเครื่องอื่น');
  assert.strictEqual(db.row.rev, 2);
  let r = p.evaluate(() => cloudSync(true));
  await p.waitForSelector('.cov');
  assert((await p.locator('.cov').innerText()).includes('ไม่ตรงกัน'));
  await p.locator('.cov button:text-is("ใช้ของเครื่องนี้")').click();
  assert.strictEqual(await r, 'pushed');
  assert.strictEqual(db.row.rev, 3); assert(db.row.data.kv1.local && !db.row.data.kv1.cloud);
  // รอบสอง: เลือกของคลาวด์
  db.row = { ...db.row, rev: 4, data: { ...db.row.data, kv1: { 'cloud2': { b: 2, w: 0, d: 1 } } } };
  await p.evaluate(() => localStorage.setItem('kv1', JSON.stringify({ 'local2': { b: 1, w: 0, d: 1 } })));
  r = p.evaluate(() => cloudSync(true)).catch(() => 'pulled');
  await p.waitForSelector('.cov');
  await Promise.all([p.waitForNavigation(), p.locator('.cov button:text-is("ใช้ของคลาวด์")').click()]);
  await p.waitForSelector('.toast');
  assert.deepStrictEqual(Object.keys(await p.evaluate(() => JSON.parse(localStorage.getItem('kv1')))), ['cloud2']);
  assert.strictEqual(await p.evaluate(() => CS.rev), 4);
  assert.deepStrictEqual(p.errors, []);
});

test('นโยบายความเป็นส่วนตัว: เปิดได้ มีลิงก์จากหน้าสถิติและฟอร์มเข้าสู่ระบบ แคชออฟไลน์ และไม่มีแถบเลื่อนแนวนอน', async (b, base) => {
  assert(fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8').includes("'privacy.html'"), 'sw.js ต้องแคช privacy.html');
  const db = mockCloud(), p = await cloudPage(b, base, db);
  await p.evaluate(() => goTab('stats'));
  assert.strictEqual(await p.locator('#cloud a[href="privacy.html"]').count(), 1);
  assert.strictEqual(await p.locator('#cloud a[href="terms.html"]').count(), 1);
  assert.strictEqual(await p.locator('#app a[href="privacy.html"]').count(), 2);
  assert.strictEqual(await p.locator('#app a[href="terms.html"]').count(), 2);
  await p.goto(base + 'privacy.html');
  const txt = await p.locator('main.doc').innerText();
  ['อีเมล', 'Supabase', 'Brevo', 'GitHub Pages', 'PDPA', 'ลบบัญชี'].forEach(k => assert(txt.includes(k), 'ขาดหัวข้อ ' + k));
  assert(await p.locator('a[href="./"]').count(), 'ต้องมีลิงก์กลับแอป');
  await p.goto(base + 'terms.html');
  const tx = await p.locator('main.doc').innerText();
  ['JLPT', 'KanjiVG', 'ข้อจำกัดความรับผิด', 'กฎหมายไทย', 'ลบบัญชี'].forEach(k => assert(tx.includes(k), 'terms ขาด ' + k));
  assert(await p.locator('a[href="privacy.html"]').count() && await p.locator('a[href="./"]').count());
  assert(fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8').includes("'terms.html'"), 'sw.js ต้องแคช terms.html');
  await p.goto(base + 'privacy.html');
  for (const w of [390, 820]) { await p.setViewportSize({ width: w, height: 900 }); assert(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, 'เกินจอ ' + w); }
});

test('ลบบัญชี: ยกเลิกไม่ลบ, เซิร์ฟเวอร์ยังไม่มีฟังก์ชันแจ้งชัด, ลบสำเร็จแล้วออกจากระบบแต่ข้อมูลในเครื่องอยู่', async (b, base) => {
  const db = mockCloud(), p = await cloudPage(b, base, db);
  await p.evaluate(() => { localStorage.setItem('kw1', JSON.stringify({ 'テスト': { b: 4, w: 0, d: 1 } })); goTab('stats'); });
  await login(p); await p.waitForSelector('button:text-is("ลบบัญชี")'); await p.waitForFunction(() => !cloudBusy);
  assert(db.row);
  await p.locator('button:text-is("ลบบัญชี")').click();
  await p.waitForSelector('.cov'); assert((await p.locator('.cov').innerText()).includes('กู้คืนไม่ได้'));
  await p.locator('.cov button:text-is("ยกเลิก")').click();
  assert.strictEqual(await p.locator('.cov').count(), 0); assert(db.row && !db.deleted);
  db.noRpc = true;
  await p.locator('button:text-is("ลบบัญชี")').click(); await p.locator('.cov button:text-is("ลบบัญชีถาวร")').click();
  await p.waitForFunction(() => !document.querySelector('.cov'));
  await p.waitForSelector('.toast:has-text("ยังไม่ได้ติดตั้งฟังก์ชัน")', { timeout: 8000 });
  assert(db.row && await p.evaluate(() => cloudIn()), 'ลบไม่สำเร็จต้องยังเข้าสู่ระบบอยู่');
  db.noRpc = false;
  await p.locator('button:text-is("ลบบัญชี")').click(); await p.locator('.cov button:text-is("ลบบัญชีถาวร")').click();
  await p.waitForSelector('#cem');
  assert(db.deleted && db.row === null);
  assert.strictEqual(await p.evaluate(() => localStorage.getItem('kn_cloud')), '{}');
  assert.strictEqual(await p.evaluate(() => JSON.parse(localStorage.getItem('kw1'))['テスト'].b), 4, 'ข้อมูลในเครื่องต้องอยู่');
  assert.strictEqual(await p.evaluate(() => cloudSync(true)), 'skip');
  assert.deepStrictEqual(p.errors, []);
});

test('เอกสารกฎหมาย: ใส่อีเมลติดต่อแล้ว ไม่มีช่องว่างค้าง และ schema.sql มีฟังก์ชันลบบัญชีที่จำกัดสิทธิ์', async () => {
  for (const f of ['privacy.html', 'terms.html']) {
    const h = fs.readFileSync(path.join(ROOT, f), 'utf8');
    assert(!h.includes('[ใส่'), f + ' ยังมีช่องที่ต้องกรอก'); assert(h.includes('mailto:tukdanainn@gmail.com'), f + ' ขออีเมลติดต่อ');
  }
  const sql = fs.readFileSync(path.join(ROOT, 'supabase/schema.sql'), 'utf8');
  assert(/function public\.delete_my_account\(\)[\s\S]*security definer[\s\S]*set search_path = ''/.test(sql));
  assert(sql.includes('revoke all on function public.delete_my_account() from public, anon') && sql.includes('grant execute on function public.delete_my_account() to authenticated'));
  assert(sql.includes("delete from auth.users where id = (select auth.uid())"));
});

test('หน้าแนะนำแอป: เปิดได้ รูปโหลดครบ ลิงก์ถูก ไม่ล้นจอ แคชออฟไลน์ และมีลิงก์จากแอป', async (b, base) => {
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  ['about.html', 'img/home.jpg', 'img/kanji.jpg', 'img/stats.jpg'].forEach(f => { assert(sw.includes("'" + f + "'"), 'sw.js ต้องแคช ' + f); assert(fs.existsSync(path.join(ROOT, f)), 'ไม่พบ ' + f); });
  const p = await fresh(b, base);
  await p.goto(base + 'about.html');
  const txt = await p.locator('.ab').textContent();
  ['เริ่มเรียนเลย', 'คันจิ N5 105 ตัว', 'คำศัพท์ 422 คำ', 'บทสนทนา 20 บท', 'ไวยากรณ์ 11 บท', 'เพิ่มไปยังหน้าจอโฮม', 'ไม่รับรอง', 'KanjiVG'].forEach(k => assert(txt.includes(k), 'ขาด ' + k));
  assert.strictEqual(await p.locator('a.cta[href="./"]').count(), 2);
  for (const l of ['privacy.html', 'terms.html']) assert(await p.locator(`a[href="${l}"]`).count(), 'ขาดลิงก์ ' + l);
  await p.waitForLoadState('load'); await p.evaluate(() => document.querySelectorAll('img').forEach(i => { i.loading = 'eager' })); await p.waitForTimeout(500);
  assert.deepStrictEqual(await p.evaluate(() => [...document.images].filter(i => !i.naturalWidth).map(i => i.src)), [], 'รูปโหลดไม่ขึ้น');
  for (const w of [360, 820, 1180]) { await p.setViewportSize({ width: w, height: 900 }); assert(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, 'เกินจอ ' + w); }
  // ตัวเลขที่อ้างบนหน้าต้องตรงกับข้อมูลจริงในแอป
  await p.goto(base);
  assert.deepStrictEqual(await p.evaluate(() => [K.length, W.length + V.length, D.length, G.length]), [105, 422, 20, 11]);
  await p.evaluate(() => goTab('stats'));
  assert.strictEqual(await p.locator('#app a[href="about.html"]').count(), 1);
});

// ---------- ระดับและแพ็กเนื้อหาเสียเงิน (ใช้แพ็กปลอมขนาดเล็ก ห้ามใส่เนื้อหา N4 จริงใน repo นี้) ----------
const FAKE_PACK = {
  format: 1, level: 'n4', version: 3, name: 'N4',
  kanji: '# ทดสอบ\n試,シ,ため(す),ทดสอบ,หมวดทดสอบ\n験,ケン,-,ตรวจ,หมวดทดสอบ',
  examples: '試:試す|ためす|ลอง|k', vocabW: '試す|ためす|ลอง|หมวดทดสอบ\n試合|しあい|แข่ง|หมวดทดสอบ', vocabV: 'テスト|ทดสอบ|หมวดทดสอบ',
  grammar: '@1::บททดสอบ::〜テスト\nT::ก\nT::ข\nT::ค\nE::あ::ก\nQ::あ___::い;う::เพราะ', dialogue: '@1|ทดสอบ (สุภาพ)\nA|こんにちは。\nB|こんにちは。',
  topics: { 1: 'หมวดทดสอบ' }, strokes: {}
};
async function home(p) { await p.evaluate(() => { tab = 'home'; render() }); return p.locator('#app').innerText() }

test('ระดับ N4: ยังไม่เข้าสู่ระบบ การ์ดล็อก กดแล้วพาไปเข้าสู่ระบบ ไม่ดาวน์โหลดอะไร', async (b, base) => {
  const db = mockCloud(), p = await cloudPage(b, base, db);
  const h0 = await home(p);
  assert(h0.includes('เข้าสู่ระบบเพื่อตรวจสิทธิ์') && h0.includes('กำลังเรียนระดับ N5'));
  await p.locator('.pc.lk0:has-text("N4")').click();
  assert.strictEqual(await p.evaluate(() => tab), 'stats');
  assert(!db.calls.some(c => c.includes('content_packs')));
  assert.strictEqual(await p.evaluate(() => LV), 'n5');
  assert.deepStrictEqual(p.errors, []);
});

test('ระดับ N4: เข้าสู่ระบบแต่ไม่มีสิทธิ์ → ยังล็อก ดาวน์โหลดไม่ได้', async (b, base) => {
  const db = mockCloud(); db.packs.n4 = FAKE_PACK; const p = await cloudPage(b, base, db);
  await p.evaluate(() => goTab('stats')); await login(p); await p.waitForFunction(() => PS.t && !cloudBusy);
  assert((await home(p)).includes('เปิดขายเร็วๆ นี้'));
  await p.evaluate(() => lvSwitch('n4'));
  await p.waitForSelector('.toast:has-text("ยังไม่ได้ปลดล็อก")', { timeout: 8000 });
  assert.strictEqual(await p.evaluate(() => [LV, localStorage.getItem('kn_pack_n4')].join()), 'n5,');
  assert.deepStrictEqual(p.errors, []);
});

test('ระดับ N4: มีสิทธิ์ → ดาวน์โหลด สลับระดับ ความคืบหน้าแยก key และกลับ N5 ได้', async (b, base) => {
  const db = mockCloud(); db.ent = ['n4']; db.packs.n4 = FAKE_PACK; const p = await cloudPage(b, base, db);
  await p.evaluate(() => { localStorage.setItem('kn5', JSON.stringify({ '日': { b: 2, w: 0, d: 1 } })); goTab('stats') });
  await login(p); await p.waitForFunction(() => PS.t && !cloudBusy);
  assert((await home(p)).includes('ปลดล็อกแล้ว'));
  await Promise.all([p.waitForNavigation(), p.locator('.pc:has-text("ปลดล็อกแล้ว")').click()]);
  const s = await p.evaluate(() => ({ LV, k: DS.k.d.length, key: DS.k.key, wk: DS.w.key, w: W.length, v: V.length, g: G.length, gk: GK, d: D.length, dt: DT[1], ex: !!EX['試'], cats: CATS }));
  assert.deepStrictEqual(s, { LV: 'n4', k: 2, key: 'kn4', wk: 'kw4', w: 2, v: 1, g: 1, gk: 'kg4', d: 1, dt: 'หมวดทดสอบ', ex: true, cats: ['ทั้งหมด', 'หมวดทดสอบ'] });
  const h = await home(p);
  assert(h.includes('กำลังเรียน') && h.includes('แตะเพื่อกลับไปเรียน N5') && h.includes('กำลังเรียนระดับ N4'));
  // เรียนคันจิในระดับ N4 แล้วความคืบหน้าไปอยู่ที่ kn4 ไม่แตะ kn5
  await p.evaluate(() => openDs('k')); await p.locator('#app .card').first().click(); await p.locator('button:text-is("จำได้")').click();
  assert.deepStrictEqual(await p.evaluate(() => [Object.keys(JSON.parse(localStorage.getItem('kn4'))), Object.keys(JSON.parse(localStorage.getItem('kn5')))]), [['試'], ['日']]);
  assert(await p.evaluate(() => PK.includes('kn4') && PK.includes('kg4') && PK.includes('kn5')));
  assert.strictEqual(await p.evaluate(() => cloudSync(false)), 'pushed');
  assert(db.row.data.kn4 && db.row.data.kn5, 'ซิงก์ความคืบหน้าทั้งสองระดับ');
  // เปิดแอปใหม่ยังอยู่ระดับ N4 โดยไม่ต้องดาวน์โหลดซ้ำ (แพ็กอยู่ในเครื่อง จึงใช้ออฟไลน์ได้ ส่วนเปลือกแอปออฟไลน์ตรวจในชุด PWA)
  const n = db.calls.filter(c => c.includes('select=version,data')).length;
  await p.reload(); await p.waitForFunction(() => PS.t && !cloudBusy);
  assert.strictEqual(await p.evaluate(() => LV), 'n4');
  assert.strictEqual(db.calls.filter(c => c.includes('select=version,data')).length, n, 'ไม่ควรดาวน์โหลดแพ็กซ้ำถ้าเวอร์ชันเท่าเดิม');
  // มีเวอร์ชันใหม่บนเซิร์ฟเวอร์ → ดาวน์โหลดเก็บไว้ ใช้เมื่อเปิดแอปครั้งถัดไป
  db.packs.n4 = { ...FAKE_PACK, version: 4, kanji: FAKE_PACK.kanji + '\n合,ゴウ,あ(う),รวม,หมวดทดสอบ' };
  await p.evaluate(() => packCheck());
  assert.strictEqual(await p.evaluate(() => JSON.parse(localStorage.getItem('kn_pack_n4')).version), 4);
  assert.strictEqual(await p.evaluate(() => DS.k.d.length), 2, 'ระหว่างใช้งานยังไม่สลับข้อมูลกลางคัน');
  await p.reload(); assert.strictEqual(await p.evaluate(() => DS.k.d.length), 3);
  await Promise.all([p.waitForNavigation(), p.evaluate(() => lvSwitch('n5'))]);
  assert.deepStrictEqual(await p.evaluate(() => [LV, K.length, DS.k.key, G.length >= 10]), ['n5', 105, 'kn5', true]);
  assert(await p.evaluate(() => localStorage.getItem('kn4')), 'กลับ N5 แล้วความคืบหน้า N4 ยังอยู่');
  assert.deepStrictEqual(p.errors, []);
});

test('ระดับ N4: ถูกถอนสิทธิ์ หรือออกจากระบบ → ลบแพ็กและกลับ N5', async (b, base) => {
  const db = mockCloud(); db.ent = ['n4']; db.packs.n4 = FAKE_PACK; const p = await cloudPage(b, base, db);
  await p.evaluate(() => goTab('stats')); await login(p); await p.waitForFunction(() => PS.t && !cloudBusy);
  await Promise.all([p.waitForNavigation(), p.evaluate(() => lvSwitch('n4'))]);
  assert.strictEqual(await p.evaluate(() => LV), 'n4');
  db.ent = [];
  await Promise.all([p.waitForNavigation(), p.reload()]); await p.waitForNavigation({ timeout: 8000 });
  await p.waitForSelector('.toast:has-text("ไม่มีสิทธิ์")', { timeout: 8000 });
  assert.deepStrictEqual(await p.evaluate(() => [LV, localStorage.getItem('kn_pack_n4')]), ['n5', null]);
  db.ent = ['n4']; await p.evaluate(() => packCheck());
  await Promise.all([p.waitForNavigation(), p.evaluate(() => lvSwitch('n4'))]);
  assert.strictEqual(await p.evaluate(() => LV), 'n4');
  p.on('dialog', d => d.accept());
  await p.evaluate(() => goTab('stats'));
  await Promise.all([p.waitForNavigation(), p.locator('button:text-is("ออกจากระบบ")').click()]);
  assert.deepStrictEqual(await p.evaluate(() => [LV, localStorage.getItem('kn_pack_n4'), localStorage.getItem('kn_packs')]), ['n5', null, null]);
  assert.deepStrictEqual(p.errors, []);
});

test('ระดับ N4: มีสิทธิ์แต่ยังไม่มีแพ็กบนเซิร์ฟเวอร์ → บอกว่าเนื้อหายังไม่พร้อม ไม่ใช่ยังไม่ปลดล็อก', async (b, base) => {
  const db = mockCloud(); db.ent = ['n4']; const p = await cloudPage(b, base, db);
  await p.evaluate(() => goTab('stats')); await login(p); await p.waitForFunction(() => PS.t && !cloudBusy);
  const h = await home(p);
  assert(h.includes('เนื้อหายังไม่พร้อม') && !h.includes('เปิดขายเร็วๆ นี้'), h.slice(-300));
  await p.evaluate(() => lvSwitch('n4'));
  await p.waitForSelector('.toast:has-text("เนื้อหายังไม่พร้อมบนเซิร์ฟเวอร์")', { timeout: 8000 });
  assert.strictEqual(await p.evaluate(() => LV), 'n5');
  // ผู้ดูแลอัปโหลดแล้ว → พร้อมเรียน
  db.packs.n4 = FAKE_PACK; await p.evaluate(() => packCheck());
  assert((await home(p)).includes('ปลดล็อกแล้ว'));
  assert.deepStrictEqual(p.errors, []);
});

test('ระดับ N4: แพ็กในเครื่องเสีย → เปิดแอปเป็น N5 ไม่มี error', async (b, base) => {
  const db = mockCloud(), ctx = await b.newContext({ serviceWorkers: 'block' }), p = await ctx.newPage(); p.errors = [];
  p.on('pageerror', e => p.errors.push(e.message)); await db.attach(p);
  await p.addInitScript(s => { localStorage.setItem('kn_meta', JSON.stringify(s)); localStorage.setItem('kn_level', 'n4'); localStorage.setItem('kn_pack_n4', '{"format":1,"level":"n4","version":1,"kanji":""}') }, SEED);
  await p.goto(base);
  assert.deepStrictEqual(await p.evaluate(() => [LV, K.length, localStorage.getItem('kn_level')]), ['n5', 105, 'n5']);
  assert.deepStrictEqual(p.errors, []);
});

test('ผู้ดูแล: เห็นส่วนอัปโหลด อัปโหลดแพ็กได้ ไฟล์ผิดถูกปฏิเสธ และผู้ใช้ทั่วไปไม่เห็น', async (b, base) => {
  const db = mockCloud(); db.admin = true; const p = await cloudPage(b, base, db);
  await p.evaluate(() => goTab('stats')); await login(p); await p.waitForFunction(() => PS.t && !cloudBusy);
  await p.evaluate(() => render());
  assert((await p.locator('#cloud').innerText()).includes('ผู้ดูแล'));
  p.on('dialog', d => d.accept());
  const f = path.join(require('os').tmpdir(), 'kn-pack-' + Date.now() + '.json'); fs.writeFileSync(f, JSON.stringify(FAKE_PACK));
  await p.setInputFiles('#pku', f);
  await p.waitForSelector('.toast:has-text("อัปโหลดแพ็ก N4 แล้ว")', { timeout: 8000 });
  assert.strictEqual(db.uploads, 1); assert.deepStrictEqual(db.packs.n4, FAKE_PACK);
  const bad = path.join(require('os').tmpdir(), 'kn-pack-bad.json'); fs.writeFileSync(bad, JSON.stringify({ ...FAKE_PACK, grammar: '' }));
  await p.setInputFiles('#pku', bad);
  await p.waitForSelector('.toast:has-text("ไฟล์แพ็กไม่ถูกต้อง")', { timeout: 8000 });
  assert.strictEqual(db.uploads, 1);
  fs.unlinkSync(f); fs.unlinkSync(bad);
  db.admin = false; await p.evaluate(() => packCheck().then(() => render()));
  assert(!(await p.locator('#cloud').innerText()).includes('ผู้ดูแล'));
  assert.deepStrictEqual(p.errors, []);
});

// ---------- ซื้อด้วย Stripe Checkout (จำลอง Edge Function และหน้า Stripe ไม่จ่ายเงินจริง) ----------
test('ซื้อ N4: เห็นราคา → หน้าต่างยืนยัน → ไปหน้า Stripe → กลับมา ?paid=n4 แล้วรอ webhook จนปลดล็อก', async (b, base) => {
  const db = mockCloud(); db.packs.n4 = FAKE_PACK; db.price = { amount: 39000, currency: 'thb' };
  const p = await cloudPage(b, base, db);
  await p.context().route('https://checkout.stripe.com/**', r => r.fulfill({ contentType: 'text/html', body: '<title>stripe</title>หน้าชำระเงินจำลอง' }));
  await p.evaluate(() => goTab('stats')); await login(p); await p.waitForFunction(() => PS.t && !cloudBusy);
  const h = await home(p);
  assert(h.includes('แตะเพื่อปลดล็อก') && h.includes('390') && !h.includes('เปิดขายเร็วๆ นี้'), h.slice(-300));
  await p.locator('.pc.lk0:has-text("N4")').click();
  const dlg = await p.locator('.cdl').innerText();
  assert(dlg.includes('ปลดล็อก N4') && dlg.includes('390') && dlg.includes('ซื้อครั้งเดียว') && dlg.includes('a@b.co'), dlg);
  await p.locator('button:text-is("ไว้ก่อน")').click();
  assert.strictEqual(await p.locator('.cov').count(), 0); assert.deepStrictEqual(db.checkouts, []);
  await p.locator('.pc.lk0:has-text("N4")').click();
  await Promise.all([p.waitForURL('https://checkout.stripe.com/**'), p.locator('button:text-is("ไปหน้าชำระเงิน")').click()]);
  assert.deepStrictEqual(db.checkouts, ['n4']);
  // จ่ายแล้วกลับมา: webhook มาช้ากว่าเล็กน้อย แอปต้องตรวจซ้ำจนเห็นสิทธิ์
  setTimeout(() => { db.ent = ['n4'] }, 2500);
  await p.goto(base + '?paid=n4');
  assert.strictEqual(new URL(p.url()).search, '', 'ลบ ?paid ออกจากแถบที่อยู่');
  await p.waitForSelector('.toast:has-text("ปลดล็อก N4 แล้ว")', { timeout: 12000 });
  assert.strictEqual(await p.evaluate(() => PS.buy), undefined);
  assert((await home(p)).includes('ปลดล็อกแล้ว'));
  await Promise.all([p.waitForNavigation(), p.locator('.pc:has-text("ปลดล็อกแล้ว")').click()]);
  assert.strictEqual(await p.evaluate(() => LV), 'n4');
  assert.deepStrictEqual(p.errors, []);
});

test('ซื้อ N4: ยกเลิกที่หน้า Stripe · มีสิทธิ์แล้วไม่ให้จ่ายซ้ำ · ยังไม่เปิดขายไม่แสดงราคา · ลบบัญชีเตือนว่าสิทธิ์จะหาย', async (b, base) => {
  const db = mockCloud(); db.packs.n4 = FAKE_PACK; db.price = { amount: 39000, currency: 'thb' };
  const p = await cloudPage(b, base, db);
  await p.evaluate(() => goTab('stats')); await login(p); await p.waitForFunction(() => PS.t && !cloudBusy);
  await p.goto(base + '?buy=cancel');
  await p.waitForSelector('.toast:has-text("ยกเลิกการชำระเงินแล้ว")');
  assert.strictEqual(new URL(p.url()).search, '');
  // ระหว่างนั้นได้สิทธิ์จากเครื่องอื่นแล้ว แต่เครื่องนี้ยังไม่รู้ → เซิร์ฟเวอร์ตอบ 409 แอปต้องไม่พาไปจ่าย
  await p.waitForFunction(() => PS.t && !cloudBusy); db.ent = ['n4'];
  await p.evaluate(() => lvLocked('n4')); await p.locator('button:text-is("ไปหน้าชำระเงิน")').click();
  await p.waitForSelector('.toast:has-text("ปลดล็อก N4 อยู่แล้ว")');
  assert.deepStrictEqual(db.checkouts, []);
  assert((await home(p)).includes('ปลดล็อกแล้ว'));
  await p.evaluate(() => { goTab('stats'); cloudDelAsk() });
  assert((await p.locator('.cdl').innerText()).includes('ระดับที่ปลดล็อกไว้ (N4)'));
  await p.locator('button:text-is("ยกเลิก")').click();
  // ยังไม่เปิดขาย (ไม่มีราคา) → ข้อความเดิม
  db.ent = []; db.price = null; await p.evaluate(() => packCheck());
  assert((await home(p)).includes('เปิดขายเร็วๆ นี้'));
  await p.evaluate(() => lvLocked('n4'));
  await p.waitForSelector('.toast:has-text("ระบบซื้อกำลังจะเปิด")');
  assert.strictEqual(await p.locator('.cov').count(), 0);
  assert.deepStrictEqual(p.errors, []);
});

test('ซื้อ: Edge Function และ schema ปลอดภัย (ไม่มีความลับในโค้ด purchases แอปเข้าไม่ได้ webhook ตรวจลายเซ็น)', async () => {
  const sql = fs.readFileSync(path.join(ROOT, 'supabase/schema.sql'), 'utf8');
  assert(/alter table public\.purchases enable row level security;/.test(sql) && /revoke all on public\.purchases from anon, authenticated;/.test(sql));
  assert(!/policy[^;]*on public\.purchases/.test(sql), 'ห้ามมี policy ให้แอปอ่าน/เขียน purchases');
  const wh = fs.readFileSync(path.join(ROOT, 'supabase/functions/stripe-webhook/index.ts'), 'utf8'), co = fs.readFileSync(path.join(ROOT, 'supabase/functions/checkout/index.ts'), 'utf8');
  assert(/verify\(body, req\.headers\.get\('stripe-signature'\)/.test(wh));
  for (const t of [wh, co, fs.readFileSync(path.join(ROOT, 'js/packs.js'), 'utf8'), fs.readFileSync(path.join(ROOT, 'js/data/cloud-config.js'), 'utf8')])
    assert(!/sk_(live|test)_[0-9A-Za-z]{10,}|whsec_[0-9A-Za-z]{10,}/.test(t), 'พบคีย์ลับในโค้ด');
});

test('schema.sql: แพ็กอ่านได้เฉพาะผู้มีสิทธิ์ เขียนได้เฉพาะผู้ดูแล และแอปเพิ่มสิทธิ์เองไม่ได้', async () => {
  const sql = fs.readFileSync(path.join(ROOT, 'supabase/schema.sql'), 'utf8');
  assert(/content_packs_select_entitled[\s\S]*is_admin\(\)\) or exists \([\s\S]*public\.entitlements e where e\.user_id = \(select auth\.uid\(\)\) and e\.level = content_packs\.level/.test(sql));
  ['insert', 'update', 'delete'].forEach(op => assert(new RegExp('content_packs_' + op + '_admin" on public.content_packs for ' + op + ' to authenticated').test(sql), op));
  assert(!/policy[^;]*on public\.entitlements for (insert|update|delete|all)/.test(sql), 'ห้ามมี policy ให้แอปเขียน entitlements');
  assert(/grant select on public\.entitlements to authenticated;/.test(sql) && /revoke all on public\.admins from anon, authenticated;/.test(sql));
  assert(/function public\.is_admin\(\)[\s\S]*security definer set search_path = ''/.test(sql));
});

test('บทสนทนา: ฟุริงะนะบนกรอบข้อความสีส้มมองเห็นได้ทั้งโหมดสว่างและมืด', async (b, base) => {
  for (const colorScheme of ['light', 'dark']) {
    const ctx = await b.newContext({ colorScheme, serviceWorkers: 'block' }), p = await ctx.newPage();
    await p.addInitScript(s => localStorage.setItem('kn_meta', JSON.stringify(s)), SEED);
    await p.goto(base); await p.evaluate(() => { tab = 'learn'; view = 'd'; fur = true; dgo(0) });
    const r = await p.evaluate(() => { const rt = document.querySelector('.dr.r .db rt'), db = rt.closest('.db'), cs = getComputedStyle;
      return { rt: cs(rt).color, txt: cs(db).color, bg: cs(db).backgroundColor, op: +cs(rt).opacity } });
    assert.strictEqual(r.rt, r.txt, colorScheme + ': สีฟุริงะนะต้องเหมือนตัวอักษรในกรอบ ' + JSON.stringify(r));
    assert(r.rt !== r.bg && r.op >= .8, colorScheme + JSON.stringify(r));
    await ctx.close();
  }
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
    catch (e) { fail++; console.log('  ✗', name, '\n     ', (e.stack || e.message || e).split("\n").slice(0, 4).join(" | ")); }
  }
  await browser.close(); server.close();
  console.log(fail ? `\nไม่ผ่าน ${fail}/${tests.length}` : `\nผ่านทั้งหมด ${tests.length} ข้อ`);
  process.exit(fail ? 1 : 0);
})();
