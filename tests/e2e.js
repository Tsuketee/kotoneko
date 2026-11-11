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
    assert((await p.locator('.gw').innerText()).includes('❌'));
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
    assert((await p.locator('.gw').innerText()).includes('✅'));
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
    catch (e) { fail++; console.log('  ✗', name, '\n     ', (e.stack || e.message || e).split("\n").slice(0, 4).join(" | ")); }
  }
  await browser.close(); server.close();
  console.log(fail ? `\nไม่ผ่าน ${fail}/${tests.length}` : `\nผ่านทั้งหมด ${tests.length} ข้อ`);
  process.exit(fail ? 1 : 0);
})();
