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

// ประโยคที่มีช่องตัวแปร {n} {kanji} → regex ไว้เทียบกับข้อความที่เติมค่าแล้ว
const tplRe = l => new RegExp('^' + l.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{n\}/g, '\\d+').replace(/\{kanji\}/g, '\\S+') + '$');
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
    const EXP = { first: 1, morning: 2, noon: 2, evening: 2, night: 2, late: 1, partial: 3, done: 3, back: 2, feed: 6, hungry: 3, lv2: 1, lv3: 1, s3: 1, s7: 1, s30: 1, b25: 1, b100: 1, b250: 1, goal: 1, wrong: 8, pat: 12, spring: 2, summer: 2, autumn: 2, winter: 2 };
    const FORBID = ['อิตาโดริ', 'ลูฟี่', 'โจรสลัด', 'วันพีซ', 'วันพืช', 'Luffy', 'One Piece', 'Itadori'];
    const tbad = [];
    if (TR.length !== 10) tbad.push('จำนวนนิสัย ' + TR.length);
    TR.forEach((t, i) => {
      if (!t.n || /แนว/.test(t.n)) tbad.push('ป้ายชื่อนิสัย ' + i + ' ห้ามอ้างอิงผลงาน/ตัวละครด้วยคำว่า "แนว...": ' + t.n);
      const got = Object.fromEntries(Object.entries(t.s).map(([k, v]) => [k, v.length]));
      if (JSON.stringify(got) !== JSON.stringify(EXP)) tbad.push('ช่อง/จำนวนประโยคนิสัย ' + i + ' ' + JSON.stringify(got));
      const all = [t.n, ...Object.values(t.s).flat()];
      all.forEach(l => { if (!l || !l.trim()) tbad.push('ประโยคว่าง ' + i); FORBID.forEach(w => { if (l.includes(w)) tbad.push('ห้ามใช้ชื่อเฉพาะ "' + w + '" ในนิสัย ' + i); }); });
      if (new Set(Object.values(t.s).flat()).size !== 64) tbad.push('ประโยคซ้ำในนิสัย ' + i);
      // ช่องตัวแปรมีแค่ {n} {kanji} และทุกช่องต้องมีประโยคที่ไม่มีช่องตัวแปร (ไม่งั้นตอนยังไม่มีค่าจะไม่มีประโยคให้เลือก)
      Object.entries(t.s).forEach(([k, v]) => { if (!v.some(l => !/\{/.test(l))) tbad.push('ทุกประโยคในช่อง ' + k + ' มีช่องตัวแปร นิสัย ' + i); v.forEach(l => { if (/\{(?!n\}|kanji\})|(?<!\{n|\{kanji)\}/.test(l)) tbad.push('ช่องตัวแปรผิด นิสัย ' + i + ': ' + l) }) });
      // กฎภาษา (รายงานบทพูดตามนิสัย v62): ไม่มี !! วงเล็บท่าทาง คำทักแปลตรง · "…" ไม่เกิน 1 (ยกเว้นขี้เซา) · ไม่เกิน 60 ตัว · นิสัยเงียบ/ขี้เซา/สุภาพ/นักวิชาการไม่มี ! · คันจิในประโยคต้องเป็น N5
      Object.values(t.s).flat().forEach(l => {
        if (/!!|\(|อรุณสวัสดิ์|ราตรีสวัสดิ์|ยินดีต้อนรับ|ขอบคุณสำหรับ/.test(l)) tbad.push('บทพูดแข็ง/แปลตรง นิสัย ' + i + ': ' + l);
        if ((l.match(/…/g) || []).length > 1 && i !== 4) tbad.push('"…" เกิน 1 ครั้ง นิสัย ' + i + ': ' + l);
        if ([...l].length > 60) tbad.push('ยาวเกิน 60 ตัว นิสัย ' + i + ': ' + l);
        if ([1, 4, 7, 8].includes(i) && /!/.test(l)) tbad.push('นิสัยนี้ไม่ใช้ ! นิสัย ' + i + ': ' + l);
        kj(l).forEach(c => ok.has(c) || tbad.push('คันจิเกิน N5 ในบทพูด นิสัย ' + i + ': ' + c));
      });
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
  await p.evaluate(() => { obn('🐱 แมว'); document.getElementById('nm').value = 'มะลิ'; obt(); });
  // ขั้นชื่อเจ้าของ (v77): ช่องกรอก + ปุ่มข้าม · ตัดอักขระ HTML
  assert(await p.locator('button:text-is("ข้ามไปก่อน")').count() === 1 && await p.locator('#nm[placeholder="ชื่อของเธอ"]').count() === 1);
  await p.evaluate(() => { document.getElementById('nm').value = 'พ<อ>'; obt(); obn('N5'); obn('เพื่อไปสอบวัดระดับ JLPT'); obn('10'); });
  assert(await p.locator('nav#nav button').count() === 5);
  assert.deepStrictEqual(await p.evaluate(() => [M.me.name, M.pet.name, M.pet.owner, M.pet.lv, M.pet.min]), ['พอ', 'มะลิ', undefined, 'N5', 10]);
  assert((await p.locator('.hi').innerText()).includes('สวัสดีค่ะ พอ'), 'ทักทายด้วยชื่อเจ้าของ');
  assert.deepStrictEqual(p.errors, []);
});

test('เปิดแอปครั้งแรก: ข้ามชื่อเจ้าของได้ แล้วตั้งทีหลังจากบัตรโปรไฟล์', async (b, base) => {
  const p = await fresh(b, base, { seed: false });
  await p.evaluate(() => { obn('🐱 แมว'); document.getElementById('nm').value = 'มะลิ'; obt(); });
  await p.locator('button:text-is("ข้ามไปก่อน")').click();
  await p.evaluate(() => { obn('N5'); obn('เพื่อไปสอบวัดระดับ JLPT'); obn('10'); });
  assert.deepStrictEqual(await p.evaluate(() => [M.me.name, M.pet.name]), ['', 'มะลิ']);
  assert.strictEqual((await p.locator('.hi').innerText()).trim(), 'สวัสดีค่ะ');
  await p.evaluate(() => goMe());
  await p.locator('.idr .mnl:text-is("ตั้งชื่อของเธอ")').click();
  await p.fill('#pfow', 'พอ'); await p.locator('.cov button:text-is("บันทึก")').click();
  assert.deepStrictEqual(await p.evaluate(() => [M.me.name, M.pet.name, JSON.parse(localStorage.getItem('kn_meta')).me.name]), ['พอ', 'มะลิ', 'พอ']);
  assert(/เจ้าของ\s*พอ/.test(await p.locator('.idr').first().innerText()));
  await p.evaluate(() => goMe('menu'));
  assert((await p.locator('.mnh').innerText()).includes('พอ') && (await p.locator('.mnh').innerText()).includes('เจ้าของมะลิ'));
  assert.deepStrictEqual(p.errors, []);
});

test('นำทางครบ 5 หมวด (และหน้าผิดบ่อยในความคืบหน้า) ไม่มี error', async (b, base) => {
  const p = await fresh(b, base);
  for (const t of ['learn', 'mis', 'stats', 'shop', 'me', 'home']) { await p.evaluate(t => goTab(t), t); assert((await p.locator('#app').innerText()).length > 10, t); }
  assert.deepStrictEqual(p.errors, []);
});

test('สถานที่: เริ่มที่ห้อง ไปสวน/คาเฟ่ได้ทันที สถานีล็อกจนจำคำหมวดสถานที่ได้แม่น 10 คำ แล้วทบทวนคำหมวดของที่นั้นก่อน', async (b, base) => {
  const p = await fresh(b, base);
  let h = await home(p);
  assert(h.includes('ห้องอ่านหนังสือ'), 'เริ่มที่ห้อง');
  assert.strictEqual(await p.locator('.scgo:has-text("ไปเที่ยว") svg').count(), 1, 'ปุ่มตั๋ว "ไปเที่ยว" มีไอคอนตั๋ว');
  assert.strictEqual(await p.locator('.scn.px[data-place="room"] > canvas#petcv').count(), 1, 'แมวใช้ฉากพิกเซล');
  assert.strictEqual(await p.evaluate(() => JSON.parse(localStorage.getItem('kn_meta')).place), undefined, 'แค่เปิดหน้าแรกต้องไม่เขียนค่าสถานที่ (ไม่ให้ซิงก์ส่งรุ่นใหม่เปล่าๆ)');
  await p.locator('.scgo').click();
  const dlg = await p.locator('.cdl').innerText();
  assert(dlg.includes('สวนญี่ปุ่น') && dlg.includes('คาเฟ่') && dlg.includes('สถานีรถไฟ') && dlg.includes('0/10 คำ'), dlg);
  assert(await p.locator('.plr[data-p="station"]').isDisabled(), 'สถานียังล็อก');
  await p.locator('.plr[data-p="garden"]').click();
  assert.strictEqual(await p.locator('.cov').count(), 0);
  assert.strictEqual(await p.locator('.scn[data-place="garden"]').count(), 1);
  assert.strictEqual(await p.evaluate(() => JSON.parse(localStorage.getItem('kn_meta')).place.at), 'garden', 'จำที่ที่เลือก');
  // จำคำหมวดสถานที่/ทิศทางได้แม่น 10 คำ → ปลดล็อกสถานีพร้อมข้อความเด้ง
  await p.evaluate(() => { const L = [...W, ...V].filter(x => ['สถานที่', 'ทิศทางและขนาด'].includes(x.c)).slice(0, 10), sw = {}, sv = {};
    L.forEach(x => { (W.includes(x) ? sw : sv)[x.k] = { b: 5, w: 0, d: Date.now() + 864e5 } }); localStorage.setItem('kw1', JSON.stringify(sw)); localStorage.setItem('kv1', JSON.stringify(sv)) });
  await home(p);
  await p.waitForSelector('.toast:has-text("ได้ตั๋วไปสถานีรถไฟแล้ว")');
  assert.deepStrictEqual(await p.evaluate(() => JSON.parse(localStorage.getItem('kn_meta')).place.got), ['station']);
  await p.locator('.scgo').click(); await p.locator('.plr[data-p="station"]').click();
  h = await home(p); assert(h.includes('สถานีรถไฟ') && h.includes('ทบทวนคำหมวดสถานที่'), h.slice(0, 400));
  // อยู่สถานี: ข้อที่ถึงเวลาทบทวนพร้อมกัน หมวดสถานที่ต้องขึ้นก่อน แม้ครบกำหนดทีหลัง
  const first = await p.evaluate(() => { const t = Date.now() - 1000, s = {}; const a = V.find(x => x.c === 'อาหารและของกิน'), b = V.find(x => x.c === 'สถานที่');
    s[a.k] = { b: 1, w: 0, d: t - 50000 }; s[b.k] = { b: 1, w: 0, d: t }; localStorage.setItem('kv1', JSON.stringify(s)); tab = 'learn'; nv('v'); cat = 'ทั้งหมด'; S = load(); return pick1().c });
  assert.strictEqual(first, 'สถานที่');
  await p.evaluate(() => { const st = JSON.parse(localStorage.getItem('kn_meta')); st.place.at = 'room'; localStorage.setItem('kn_meta', JSON.stringify(st)); M = st });
  assert.strictEqual(await p.evaluate(() => pick1().c), 'อาหารและของกิน', 'อยู่ห้อง: ทบทวนตามกำหนดเดิม');
  assert.deepStrictEqual(p.errors, []);
});

test('สถานที่: ทุกฉากใช้สีจาก token (มีครบทั้งโหมดสว่างและมืด) และประโยคประจำที่ใช้เฉพาะคันจิ N5', async () => {
  const css = fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8'), js = fs.readFileSync(path.join(ROOT, 'js/data/places.js'), 'utf8');
  const used = new Set([...js.matchAll(/\bf-([rgkt]-[a-z0-9]+)/g)].map(m => m[1]));
  [...new Set([...js.matchAll(/\b(s-[rgkt]-[a-z0-9]+)/g)].map(m => m[1]))].forEach(c => assert(css.includes('.' + c + '{'), 'ไม่มีสไตล์เส้น ' + c));
  const blk = re => (css.match(re) || [, ''])[1];
  const lt = blk(/ฉากสถานที่[\s\S]*?\n:root\{([^}]*)\}/), dk = blk(/ฉากสถานที่[\s\S]*?:root\[data-theme="dark"\]\{([^}]*)\}/);
  used.forEach(t => { assert(lt.includes('--' + t + ':'), 'ไม่มีสีโหมดสว่าง ' + t); assert(dk.includes('--' + t + ':'), 'ไม่มีสีโหมดมืด ' + t) });
  assert(!/(fill|stroke)="#/.test(js), 'ห้ามใส่สีตรงๆ ในฉาก ต้องใช้ class/token');
  const ctx = {}; new Function('ctx', js.replace(/^const (\w+)/gm, 'ctx.$1') )(ctx);
  const k5 = fs.readFileSync(path.join(ROOT, 'js/data/kanji-n5.js'), 'utf8');
  Object.values(ctx.PLACE_LINES).flat().forEach(l => [...l.replace(/\{([^|}]*)\|[^}]*\}/g, '$1')].filter(c => /\p{Script=Han}/u.test(c)).forEach(c => assert(new RegExp('^' + c + ',', 'm').test(k5), 'คันจิเกิน N5 ในประโยคประจำที่: ' + c)));
  ctx.PLACES.forEach(p => { assert(p.free || (p.unlock && p.unlock.n > 0), p.id); assert(p.pet.length === 2) });
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

test('เครดิต KanjiVG: มีในหน้าโปรไฟล์พร้อมลิงก์และสัญญาอนุญาต และอยู่ในหัวไฟล์ strokes.js', async (b, base) => {
  const hd = fs.readFileSync(path.join(ROOT, 'js/data/strokes.js'), 'utf8').slice(0, 1500);
  assert(hd.includes('kanjivg.tagaini.net') && hd.includes('CC BY-SA 3.0') && hd.includes('Ulrich Apel'));
  const notice = fs.readFileSync(path.join(ROOT, 'NOTICE.md'), 'utf8');
  assert(notice.includes('KanjiVG') && notice.includes('KANJIDIC2'));
  const p = await fresh(b, base);
  await p.evaluate(() => goMe('credits'));
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
  await p.evaluate(() => goMe('backup'));
  const [dl] = await Promise.all([p.waitForEvent('download'), p.locator('button:text-is("ส่งออก")').click()]);
  const f = path.join(require('os').tmpdir(), 'kanji-e2e-g-' + Date.now() + '.json'); await dl.saveAs(f);
  const o = JSON.parse(fs.readFileSync(f, 'utf8')); fs.unlinkSync(f);
  assert(o.data.kg1 && o.data.kg1['1'] && o.data.kg1['2']);
  assert.deepStrictEqual(p.errors, []);
});

test('สัตว์เลี้ยง: บทพูดตามช่วงเวลาและฤดูคงที่ในชั่วโมงเดียว, เหตุการณ์ต่างๆ, ข้อความเด้งต่อคิว', async (b, base) => {
  const p = await fresh(b, base);
  const at = async (iso) => { await p.clock.setFixedTime(new Date(iso)); };
  const lines = await p.evaluate(() => TR[0].s);
  const say = (dn = 0) => p.evaluate(dn => { const q = M.pet; return psay(q, dn); }, dn);
  // นิสัย 0 เจอกันวันนี้: dn=0 และ rv=วันนี้ => first ; ปิดโดยตั้ง rv เป็นวันเก่า
  await p.evaluate(() => { M.pet.trait = 0; M.pet.rv = '2000-01-01'; M.pet.back = null; });
  const slots = [['2026-11-11T10:10:00', 'morning'], ['2026-11-11T14:00:00', 'noon'], ['2026-11-11T18:30:00', 'evening'], ['2026-11-11T22:00:00', 'night'], ['2026-11-11T02:00:00', 'late'],
    // v116 ตามฤดูแบบญี่ปุ่น: ชั่วโมง 05 09 13 17 21 · เดือนเดียวกับฉาก (พ.ย. = ใบไม้ร่วง)
    ['2026-11-11T09:10:00', 'autumn'], ['2027-01-11T13:00:00', 'winter'], ['2026-04-11T17:30:00', 'spring'], ['2026-07-11T21:05:00', 'summer'], ['2026-07-11T05:20:00', 'summer']];
  for (const [iso, key] of slots) {
    await at(iso); await p.evaluate(() => { M.pet.lastTs = Date.now(); M.pet.back = null; }); // ข้ามเดือนแล้วไม่นับเป็นกลับมาหลังหาย
    const a = await say(), b2 = await say(), c = await say();
    assert(lines[key].includes(a), key + ' ต้องอยู่ในรายการ: ' + a);
    assert(a === b2 && b2 === c, key + ' ต้องคงที่ภายในชั่วโมงเดียว');
  }
  // ต่างชั่วโมง/ต่างวัน อย่างน้อยหนึ่งช่วงที่มีสองประโยคต้องเลือกได้ครบทั้งสองประโยคในหลายวัน
  const seen = new Set();
  for (let d = 1; d <= 20; d++) { await at(`2026-11-${String(d).padStart(2, '0')}T10:10:00`); if (d === 1) await p.evaluate(() => { M.pet.lastTs = Date.now(); M.pet.back = null; }); seen.add(await say()); }
  assert.strictEqual(seen.size, 2, 'ควรเห็นทั้งสองประโยคเช้าในหลายวัน');
  // ประโยคตามฤดูไม่ถูกประโยคประจำสถานที่ทับ (psayG = false) · ประโยคตามช่วงเวลายังให้สถานที่ทับได้
  await at('2026-11-11T09:10:00'); assert.strictEqual(await p.evaluate(() => (psay(M.pet, 0), psayG)), false, 'ฤดู: ไม่ใช่ประโยคทั่วไป');
  await at('2026-11-11T10:10:00'); assert.strictEqual(await p.evaluate(() => (psay(M.pet, 0), psayG)), true, 'ช่วงเวลา: ประโยคทั่วไป');
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
  for (const t of ['learn', 'mis', 'stats', 'shop', 'me']) { await p.evaluate(t => goTab(t), t); await scan(t); }
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
  await p.evaluate(() => goMe('backup'));
  const [dl] = await Promise.all([p.waitForEvent('download'), p.locator('button:text-is("ส่งออก")').click()]);
  const f = path.join(require('os').tmpdir(), 'kanji-e2e-' + Date.now() + '.json');
  await dl.saveAs(f);
  const o = JSON.parse(fs.readFileSync(f, 'utf8'));
  assert(o.app === 'kanji-app' && o.data.kw1 && o.data.kn_meta);
  await p.evaluate(() => localStorage.removeItem('kw1')); p.on('dialog', d => d.accept());
  await Promise.all([p.waitForNavigation(), p.setInputFiles('#imp', f)]);
  assert.strictEqual(await p.evaluate(() => JSON.parse(localStorage.getItem('kw1'))['テスト'].b), 3);
  const bad = path.join(require('os').tmpdir(), 'kanji-e2e-bad.json'); fs.writeFileSync(bad, '{"hello":1}');
  await p.evaluate(() => goMe('backup')); await p.setInputFiles('#imp', bad);
  await p.waitForSelector('.toast');
  assert((await p.locator('.toast').innerText()).includes('ไม่ใช่ไฟล์'));
  fs.unlinkSync(f); fs.unlinkSync(bad);
});

// ---------- บัญชีและซิงก์คลาวด์ (จำลอง Supabase ไม่ต่อเน็ตจริง) ----------
// เซิร์ฟเวอร์จำลองใช้ร่วมกันหลายเครื่อง (หลาย browser context) เพื่อทดสอบการซิงก์ข้ามเครื่อง
function mockCloud() {
  const db = { row: null, calls: [], n: 0, ent: [], src: {}, rr: [], packs: {}, admin: false, uploads: 0, price: null, checkouts: [], codes: 0 };
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS' };
  const json = (route, status, body) => route.fulfill({ status, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const tok = () => ({ access_token: 'at' + (++db.n), refresh_token: 'rt' + db.n, expires_in: 3600, user: { id: 'u1', email: 'a@b.co' } });
  const handler = async route => {
    const q = route.request(), u = new URL(q.url()), m = q.method(), body = q.postData() ? JSON.parse(q.postData()) : null;
    if (m === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    db.calls.push(m + ' ' + u.pathname + u.search);
    if (u.pathname === '/auth/v1/otp') return json(route, 200, {});
    // ----- Google OAuth (PKCE) · db.google = เปิด Google ใน Supabase แล้ว -----
    if (u.pathname === '/auth/v1/settings') return db.google ? json(route, 200, { external: { email: true, google: true, apple: false } }) : json(route, 404, { message: 'not mocked' });
    if (u.pathname === '/auth/v1/authorize') { db.auth = Object.fromEntries(u.searchParams); return route.fulfill({ status: 302, headers: { ...cors, Location: db.auth.redirect_to + '?code=gc' + (++db.codes) } }); }
    if (u.pathname === '/auth/v1/token' && u.searchParams.get('grant_type') === 'pkce') {
      const ch = require('crypto').createHash('sha256').update(body.code_verifier || '').digest('base64url');
      if (!db.auth || ch !== db.auth.code_challenge || body.auth_code !== 'gc' + db.codes) return json(route, 400, { msg: 'invalid flow state' });
      db.pkceOk = true; const t = tok(); t.user.user_metadata = { full_name: 'พอใจ <ทดสอบ>' }; return json(route, 200, t);
    }
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
    if (u.pathname === '/rest/v1/entitlements') return json(route, 200, db.ent.map(level => ({ level, ...(db.src[level] || {}) })));
    // คำขอคืนเงิน: จำลอง RLS ใน schema.sql (ส่งได้เฉพาะระดับที่ซื้อผ่าน Stripe ภายใน 7 วัน · คำขอที่รออยู่ซ้ำไม่ได้ · ผู้ใช้เห็นเฉพาะของตัวเอง)
    if (u.pathname === '/rest/v1/refund_requests') {
      if (db.noRefundTable) return json(route, 404, { code: '42P01', message: 'relation does not exist' });
      if (m === 'GET') return json(route, 200, db.rr.filter(r => db.admin || r.user_id === 'u1'));
      if (m === 'POST') {
        const e = db.src[body.level];
        if (!db.ent.includes(body.level) || !e || e.source !== 'stripe' || Date.now() - Date.parse(e.created_at) > 7 * 864e5) return json(route, 403, { code: '42501', message: 'new row violates row-level security policy' });
        if (db.rr.some(r => r.user_id === 'u1' && r.level === body.level && r.status === 'pending')) return json(route, 409, { code: '23505', message: 'duplicate key' });
        if (Object.keys(body).some(k => !['level', 'reason', 'detail'].includes(k))) return json(route, 403, { message: 'permission denied' });
        db.rr.unshift({ id: db.rr.length + 1, user_id: 'u1', email: 'a@b.co', status: 'pending', created_at: new Date().toISOString(), ...body });
        return route.fulfill({ status: 201, headers: cors });
      }
    }
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
  await p.evaluate(() => goTab('me'));
  assert.strictEqual(await p.locator('#cloud').count(), 0);
  assert(!(await p.locator('#app').innerText()).includes('บัญชีและซิงก์'));
  assert(fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8').includes('origin !== location.origin'));
  assert.deepStrictEqual(p.errors, []);
});

test('ซิงก์: เข้าสู่ระบบด้วยรหัสอีเมล ส่งขึ้นคลาวด์ แก้แล้วส่งรุ่นใหม่ และต่ออายุ token', async (b, base) => {
  const db = mockCloud(), p = await cloudPage(b, base, db);
  await p.evaluate(() => { localStorage.setItem('kw1', JSON.stringify({ 'テスト': { b: 4, w: 0, d: 1 } })); goMe('acct'); });
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
  assert((await p.locator('#app').innerText()).includes('ภารกิจวันนี้'), 'ต้องเข้าหน้าแรกได้เลย ไม่ต้องตั้งค่าใหม่');
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
  await p.evaluate(() => goMe('acct')); await login(p);
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

test('นโยบายความเป็นส่วนตัว: เปิดได้ มีลิงก์จากหน้าโปรไฟล์และฟอร์มเข้าสู่ระบบ แคชออฟไลน์ และไม่มีแถบเลื่อนแนวนอน', async (b, base) => {
  assert(fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8').includes("'privacy.html'"), 'sw.js ต้องแคช privacy.html');
  const db = mockCloud(), p = await cloudPage(b, base, db);
  await p.evaluate(() => goMe('acct'));
  assert.strictEqual(await p.locator('#cloud a[href="privacy.html"]').count(), 1);
  assert.strictEqual(await p.locator('#cloud a[href="terms.html"]').count(), 1);
  assert.strictEqual(await p.locator('#app a[href="privacy.html"]').count(), 1);
  assert.strictEqual(await p.locator('#app a[href="terms.html"]').count(), 1);
  await p.evaluate(() => goMe('menu')); // เมนูมีแถวลิงก์นโยบายและข้อกำหนด
  assert.strictEqual(await p.locator('#app a[href="privacy.html"]').count(), 1);
  assert.strictEqual(await p.locator('#app a[href="terms.html"]').count(), 1);
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
  await p.evaluate(() => { localStorage.setItem('kw1', JSON.stringify({ 'テスト': { b: 4, w: 0, d: 1 } })); goMe('acct'); });
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
  await p.evaluate(() => goMe('menu'));
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
// แพ็ก N3 ปลอม: คันจิตัวแรกเป็น 込 ซึ่งไม่มีอ่านแบบออน ('-') เหมือนของจริง
const FAKE_PACK_N3 = { ...FAKE_PACK, level: 'n3', version: 5, name: 'N3',
  kanji: '込,-,こ(む)・こ(める),แน่น,หมวดทดสอบ\n験,ケン,-,ตรวจ,หมวดทดสอบ', examples: '込:込む|こむ|แออัด|k' };
async function home(p) { await p.evaluate(() => { tab = 'home'; render() }); return p.locator('#app').innerText() }
async function learnHub(p) { await p.evaluate(() => goTab('learn')); return p.locator('#app').innerText() } // การ์ดระดับอยู่ในหน้ารวมของแท็บเรียน (v73)

test('ระดับ N4: ยังไม่เข้าสู่ระบบ การ์ดล็อก กดแล้วพาไปเข้าสู่ระบบ ไม่ดาวน์โหลดอะไร', async (b, base) => {
  const db = mockCloud(), p = await cloudPage(b, base, db);
  const h0 = await learnHub(p);
  assert(h0.includes('เข้าสู่ระบบเพื่อตรวจสิทธิ์') && h0.includes('กำลังเรียนระดับ N5'));
  await p.locator('.pc.lk0:has-text("N4")').click();
  assert.deepStrictEqual(await p.evaluate(() => [tab, meView]), ['me', 'acct'], 'การ์ดล็อกพาไปหน้าบัญชีและซิงก์');
  assert(!db.calls.some(c => c.includes('content_packs')));
  assert.strictEqual(await p.evaluate(() => LV), 'n5');
  assert.deepStrictEqual(p.errors, []);
});

test('ระดับ N4: เข้าสู่ระบบแต่ไม่มีสิทธิ์ → ยังล็อก ดาวน์โหลดไม่ได้', async (b, base) => {
  const db = mockCloud(); db.packs.n4 = FAKE_PACK; const p = await cloudPage(b, base, db);
  await p.evaluate(() => goMe('acct')); await login(p); await p.waitForFunction(() => PS.t && !cloudBusy);
  assert((await learnHub(p)).includes('เปิดขายเร็วๆ นี้'));
  await p.evaluate(() => lvSwitch('n4'));
  await p.waitForSelector('.toast:has-text("ยังไม่ได้ปลดล็อก")', { timeout: 8000 });
  assert.strictEqual(await p.evaluate(() => [LV, localStorage.getItem('kn_pack_n4')].join()), 'n5,');
  assert.deepStrictEqual(p.errors, []);
});

test('ระดับ N4: มีสิทธิ์ → ดาวน์โหลด สลับระดับ ความคืบหน้าแยก key และกลับ N5 ได้', async (b, base) => {
  const db = mockCloud(); db.ent = ['n4']; db.packs.n4 = FAKE_PACK; const p = await cloudPage(b, base, db);
  await p.evaluate(() => { localStorage.setItem('kn5', JSON.stringify({ '日': { b: 2, w: 0, d: 1 } })); goMe('acct') });
  await login(p); await p.waitForFunction(() => PS.t && !cloudBusy);
  assert((await learnHub(p)).includes('ปลดล็อกแล้ว'));
  await Promise.all([p.waitForNavigation(), p.locator('.pc:has-text("ปลดล็อกแล้ว")').click()]);
  const s = await p.evaluate(() => ({ LV, k: DS.k.d.length, key: DS.k.key, wk: DS.w.key, w: W.length, v: V.length, g: G.length, gk: GK, d: D.length, dt: DT[1], ex: !!EX['試'], cats: CATS }));
  assert.deepStrictEqual(s, { LV: 'n4', k: 2, key: 'kn4', wk: 'kw4', w: 2, v: 1, g: 1, gk: 'kg4', d: 1, dt: 'หมวดทดสอบ', ex: true, cats: ['ทั้งหมด', 'หมวดทดสอบ'] });
  const h = await learnHub(p);
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
  await p.evaluate(() => goMe('acct')); await login(p); await p.waitForFunction(() => PS.t && !cloudBusy);
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
  await p.evaluate(() => goMe('acct'));
  await Promise.all([p.waitForNavigation(), p.locator('button:text-is("ออกจากระบบ")').click()]);
  assert.deepStrictEqual(await p.evaluate(() => [LV, localStorage.getItem('kn_pack_n4'), localStorage.getItem('kn_packs')]), ['n5', null, null]);
  assert.deepStrictEqual(p.errors, []);
});

test('ระดับ N4: มีสิทธิ์แต่ยังไม่มีแพ็กบนเซิร์ฟเวอร์ → บอกว่าเนื้อหายังไม่พร้อม ไม่ใช่ยังไม่ปลดล็อก', async (b, base) => {
  const db = mockCloud(); db.ent = ['n4']; const p = await cloudPage(b, base, db);
  await p.evaluate(() => goMe('acct')); await login(p); await p.waitForFunction(() => PS.t && !cloudBusy);
  await learnHub(p); const c4 = await p.locator('.pc:has-text("N4")').first().innerText();
  assert(c4.includes('เนื้อหายังไม่พร้อม') && !c4.includes('เปิดขายเร็วๆ นี้'), c4);
  await p.evaluate(() => lvSwitch('n4'));
  await p.waitForSelector('.toast:has-text("เนื้อหายังไม่พร้อมบนเซิร์ฟเวอร์")', { timeout: 8000 });
  assert.strictEqual(await p.evaluate(() => LV), 'n5');
  // ผู้ดูแลอัปโหลดแล้ว → พร้อมเรียน
  db.packs.n4 = FAKE_PACK; await p.evaluate(() => packCheck());
  assert((await learnHub(p)).includes('ปลดล็อกแล้ว'));
  assert.deepStrictEqual(p.errors, []);
});

test('ระดับ N3: มีสิทธิ์ → สลับระดับ ความคืบหน้าแยก key (kn3 kw3 kv3 kg3) และคันจิที่ไม่มีอ่านแบบออนไม่แสดง "-"', async (b, base) => {
  const db = mockCloud(); db.ent = ['n3']; db.packs.n3 = FAKE_PACK_N3; db.packs.n4 = FAKE_PACK; const p = await cloudPage(b, base, db);
  await p.evaluate(() => goMe('acct')); await login(p); await p.waitForFunction(() => PS.t && !cloudBusy);
  await learnHub(p);
  assert((await p.locator('.pc:has-text("N3")').first().innerText()).includes('ปลดล็อกแล้ว'));
  assert((await p.locator('.pc:has-text("N4")').first().innerText()).includes('เปิดขายเร็วๆ นี้'), 'ไม่มีสิทธิ์ N4 ต้องยังล็อก');
  await Promise.all([p.waitForNavigation(), p.evaluate(() => lvSwitch('n3'))]);
  assert.deepStrictEqual(await p.evaluate(() => [LV, DS.k.key, DS.w.key, DS.v.key, GK, K.length]), ['n3', 'kn3', 'kw3', 'kv3', 'kg3', 2]);
  assert(await p.evaluate(() => ['kn3', 'kw3', 'kv3', 'kg3', 'kn4', 'kn5'].every(k => PK.includes(k))), 'key ความคืบหน้า N3 ต้องอยู่ใน PK เพื่อส่งออกและซิงก์');
  // คำอ่าน: ข้ามช่องออนที่เป็น '-' ทั้งในตัวเลือกข้อสอบ/รายการผิดบ่อย (rd) บัตรคำ และหน้าฝึกเขียน
  assert.deepStrictEqual(await p.evaluate(() => K.map(rd)), ['こ(む)・こ(める)', 'ケン']);
  await p.evaluate(() => { openDs('k'); cur = K[0]; fl = true; mode = 'card'; render() });
  const d = await p.locator('#app .d').first().innerText();
  assert(d.startsWith('こ(む)') && !/^-$/m.test(d), d);
  await p.evaluate(() => { mode = 'write'; wi = 0; render() });
  const wtx = await p.locator('#app .wi .d').first().innerText();
  assert(!wtx.startsWith('-') && wtx.includes('こ(む)'), wtx);
  // เรียนในระดับ N3 แล้วความคืบหน้าไปอยู่ที่ kn3
  await p.evaluate(() => { mode = 'card'; cur = null; fl = false; go() }); await p.locator('#app .card').first().click(); await p.locator('button:text-is("จำได้")').click();
  assert(await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('kn3') || '{}')).length === 1 && !localStorage.getItem('kn4')));
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
  await p.evaluate(() => goMe('acct')); await login(p); await p.waitForFunction(() => PS.t && !cloudBusy);
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
  await p.evaluate(() => goMe('acct')); await login(p); await p.waitForFunction(() => PS.t && !cloudBusy);
  const h = await learnHub(p);
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
  assert((await learnHub(p)).includes('ปลดล็อกแล้ว'));
  await Promise.all([p.waitForNavigation(), p.locator('.pc:has-text("ปลดล็อกแล้ว")').click()]);
  assert.strictEqual(await p.evaluate(() => LV), 'n4');
  assert.deepStrictEqual(p.errors, []);
});

test('ซื้อ N4: ยกเลิกที่หน้า Stripe · มีสิทธิ์แล้วไม่ให้จ่ายซ้ำ · ยังไม่เปิดขายไม่แสดงราคา · ลบบัญชีเตือนว่าสิทธิ์จะหาย', async (b, base) => {
  const db = mockCloud(); db.packs.n4 = FAKE_PACK; db.price = { amount: 39000, currency: 'thb' };
  const p = await cloudPage(b, base, db);
  await p.evaluate(() => goMe('acct')); await login(p); await p.waitForFunction(() => PS.t && !cloudBusy);
  await p.goto(base + '?buy=cancel');
  await p.waitForSelector('.toast:has-text("ยกเลิกการชำระเงินแล้ว")');
  assert.strictEqual(new URL(p.url()).search, '');
  // ระหว่างนั้นได้สิทธิ์จากเครื่องอื่นแล้ว แต่เครื่องนี้ยังไม่รู้ → เซิร์ฟเวอร์ตอบ 409 แอปต้องไม่พาไปจ่าย
  await p.waitForFunction(() => PS.t && !cloudBusy); db.ent = ['n4'];
  await p.evaluate(() => lvLocked('n4')); await p.locator('button:text-is("ไปหน้าชำระเงิน")').click();
  await p.waitForSelector('.toast:has-text("ปลดล็อก N4 อยู่แล้ว")');
  assert.deepStrictEqual(db.checkouts, []);
  assert((await learnHub(p)).includes('ปลดล็อกแล้ว'));
  await p.evaluate(() => { goMe('acct'); cloudDelAsk() });
  assert((await p.locator('.cdl').innerText()).includes('ระดับที่ปลดล็อกไว้ (N4)'));
  await p.locator('button:text-is("ยกเลิก")').click();
  // ยังไม่เปิดขาย (ไม่มีราคา) → ข้อความเดิม
  db.ent = []; db.price = null; await p.evaluate(() => packCheck());
  assert((await learnHub(p)).includes('เปิดขายเร็วๆ นี้'));
  await p.evaluate(() => lvLocked('n4'));
  await p.waitForSelector('.toast:has-text("ระบบซื้อกำลังจะเปิด")');
  assert.strictEqual(await p.locator('.cov').count(), 0);
  assert.deepStrictEqual(p.errors, []);
});

test('ขอคืนเงิน: ภายใน 7 วันต้องเลือกเหตุผลก่อนส่ง · ส่งแล้วขึ้นรอดำเนินการ · เกิน 7 วันหรือได้สิทธิ์แบบ manual ไม่มีปุ่ม', async (b, base) => {
  const db = mockCloud(); db.packs.n4 = FAKE_PACK; db.packs.n3 = FAKE_PACK;
  db.ent = ['n4', 'n3']; db.src = { n4: { source: 'stripe', created_at: new Date(Date.now() - 2 * 864e5).toISOString() }, n3: { source: 'manual', created_at: new Date().toISOString() } };
  const p = await cloudPage(b, base, db);
  await p.evaluate(() => goMe('acct')); await login(p); await p.waitForFunction(() => PS.t && !cloudBusy);
  const acct = () => p.locator('#cloud').innerText();
  let t = await acct();
  assert(t.includes('ขอคืนเงิน N4 (เหลืออีก 5 วัน)') && !t.includes('ขอคืนเงิน N3'), t);
  await p.locator('button:has-text("ขอคืนเงิน N4")').click();
  const dlg = await p.locator('.cdl').innerText();
  assert(dlg.includes('เหตุผลไม่มีผลต่อการคืนเงิน') && dlg.includes('เนื้อหาไม่ตรงกับที่คาดไว้') && dlg.includes('อื่นๆ'), dlg);
  await p.locator('button:text-is("ส่งคำขอคืนเงิน")').click();
  assert((await p.locator('.rfe').innerText()).includes('เลือกเหตุผลก่อน')); assert.strictEqual(db.rr.length, 0);
  await p.locator('input[value=other]').check(); await p.locator('button:text-is("ส่งคำขอคืนเงิน")').click();
  assert((await p.locator('.rfe').innerText()).includes('ช่วยเล่าสั้นๆ')); assert.strictEqual(db.rr.length, 0);
  await p.locator('input[value=content]').check(); await p.fill('#rfd', 'อยากได้แบบฝึกฟังมากกว่านี้');
  await p.locator('button:text-is("ส่งคำขอคืนเงิน")').click();
  await p.waitForSelector('.toast:has-text("ส่งคำขอคืนเงิน N4 แล้ว")');
  assert.strictEqual(db.rr.length, 1);
  assert.deepStrictEqual([db.rr[0].level, db.rr[0].reason, db.rr[0].detail], ['n4', 'content', 'อยากได้แบบฝึกฟังมากกว่านี้']);
  t = await acct(); assert(t.includes('ส่งคำขอคืนเงิน N4 แล้ว รอดำเนินการ') && !t.includes('ขอคืนเงิน N4 (เหลือ'), t);
  assert.strictEqual(await p.evaluate(() => localStorage.getItem('kn_packs').includes('refund')), false, 'คำขอคืนเงินไม่ลง localStorage');
  // ส่งซ้ำ (เช่น จากอีกเครื่อง) → 409
  await p.evaluate(() => { RR = []; render(); refundAsk('n4') }); await p.locator('input[value=price]').check();
  await p.locator('button:text-is("ส่งคำขอคืนเงิน")').click(); await p.waitForSelector('.toast:has-text("ไว้แล้ว รอดำเนินการ")');
  assert.strictEqual(db.rr.length, 1);
  // ซื้อมาเกิน 7 วัน → ไม่มีปุ่ม
  db.rr = []; db.src.n4.created_at = new Date(Date.now() - 8 * 864e5).toISOString(); await p.evaluate(() => packCheck());
  t = await acct(); assert(!t.includes('ขอคืนเงิน'), t);
  assert.deepStrictEqual(p.errors, []);
});

test('ขอคืนเงิน: ผู้ดูแลเห็นคำขอที่รอคืน (ข้อความผู้ใช้ถูก escape) และสรุปเหตุผล · ยังไม่มีตารางก็ไม่พัง', async (b, base) => {
  const db = mockCloud(); db.admin = true; db.packs.n4 = FAKE_PACK;
  const d = new Date().toISOString();
  db.rr = [
    { id: 3, user_id: 'u9', email: 'x@y.co', level: 'n4', reason: 'error', detail: '<img src=x onerror=alert(1)>คำผิด', status: 'pending', created_at: d },
    { id: 2, user_id: 'u8', email: 'z@y.co', level: 'n3', reason: 'error', detail: null, status: 'refunded', created_at: d },
    { id: 1, user_id: 'u7', email: 'w@y.co', level: 'n4', reason: 'price', detail: null, status: 'refunded', created_at: d }];
  const p = await cloudPage(b, base, db);
  await p.evaluate(() => goMe('acct')); await login(p); await p.waitForFunction(() => PS.t && !cloudBusy);
  const t = await p.locator('#cloud').innerText();
  assert(t.includes('คำขอคืนเงินที่รอดำเนินการ (1)') && t.includes('x@y.co') && t.includes('เจอเนื้อหาผิด หรือแอปมีปัญหา') && !t.includes('z@y.co'), t);
  assert(t.includes('<img src=x onerror=alert(1)>คำผิด'), 'แสดงเป็นข้อความ');
  assert.strictEqual(await p.locator('#cloud img').count(), 0, 'ต้องไม่สร้าง element จากข้อความผู้ใช้');
  assert(/สรุปเหตุผลทั้งหมด \(3 คำขอ\)[\s\S]*เจอเนื้อหาผิด หรือแอปมีปัญหา 2[\s\S]*ไม่คุ้มกับราคา 1/.test(t), t);
  db.noRefundTable = true; await p.evaluate(() => packCheck());
  assert((await p.locator('#cloud').innerText()).includes('ยังไม่มีตาราง refund_requests'));
  assert.deepStrictEqual(p.errors, []);
});

test('ซื้อ: Edge Function และ schema ปลอดภัย (ไม่มีความลับในโค้ด purchases แอปเข้าไม่ได้ webhook ตรวจลายเซ็น)', async () => {
  const sql = fs.readFileSync(path.join(ROOT, 'supabase/schema.sql'), 'utf8');
  assert(/alter table public\.purchases enable row level security;/.test(sql) && /revoke all on public\.purchases from anon, authenticated;/.test(sql));
  assert(!/policy[^;]*on public\.purchases/.test(sql), 'ห้ามมี policy ให้แอปอ่าน/เขียน purchases');
  // คำขอคืนเงิน: แอปใส่ได้เฉพาะ level/reason/detail (user_id email status มาจากฐานข้อมูล) ส่งได้เฉพาะของที่ซื้อผ่าน Stripe ภายใน 7 วัน แก้สถานะได้เฉพาะผู้ดูแล
  assert(/grant insert \(level, reason, detail\) on public\.refund_requests to authenticated;/.test(sql));
  assert(/refund_requests_insert_own[\s\S]*auth\.uid\(\)\) = user_id and status = 'pending'[\s\S]*e\.source = 'stripe' and e\.created_at > now\(\) - interval '7 days'/.test(sql));
  assert(/refund_requests_update_admin" on public\.refund_requests for update to authenticated\s+using \(\(select public\.is_admin\(\)\)\)/.test(sql));
  assert(!/policy[^;]*on public\.refund_requests for (delete|all)/.test(sql));
  // Edge Functions ใช้ service_role: ต้องให้สิทธิ์ตารางชัดเจน (โปรเจกต์ใหม่ไม่ให้อัตโนมัติ → 403)
  assert(/grant select, insert, update, delete on public\.entitlements to service_role;/.test(sql) && /grant select, insert, update, delete on public\.purchases to service_role;/.test(sql) && /grant select, update on public\.refund_requests to service_role;/.test(sql));
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

test('ภารกิจรายวัน: ทำครบแล้วกด "รับ" ถึงได้ Energy · ป้ายบนแท็บหน้าแรก · หลอด Energy · วันเก่าที่ได้ Energy ไปแล้วไม่รับซ้ำ', async (b, base) => {
  const p = await fresh(b, base);
  // ทำภารกิจทบทวนครบ: ยังไม่ได้ Energy แต่ขึ้นปุ่มรับ และป้าย 1 บนแท็บหน้าแรก
  await p.evaluate(() => { M.pet.energy = 0; M.pet.bond = 0; pens(); for (let i = 0; i < M.pet.min; i++) ptrack('rev'); goTab('learn'); });
  assert.deepStrictEqual(await p.evaluate(() => [M.pet.energy, !!M.pet.d.done.rev, punclaimed()]), [0, true, 1], 'ทำครบแล้วยังไม่ให้ Energy จนกว่าจะกดรับ');
  assert.strictEqual(await p.locator('#nav .nb').innerText(), '1');
  await p.evaluate(() => goTab('home'));
  assert.strictEqual(await p.locator('.pzm.cl .pcl').count(), 1, 'ต้องมีปุ่มรับหนึ่งปุ่ม');
  await p.evaluate(() => document.querySelectorAll('.toast').forEach(e => e.remove()));
  await p.locator('.pcl').click();
  const r = await p.evaluate(() => [M.pet.energy, M.pet.bond, M.pet.d.cl.rev, punclaimed(), document.querySelectorAll('.pzm.got').length, document.querySelectorAll('#nav .nb').length]);
  assert.deepStrictEqual(r, [20, 2, 1, 0, 1, 0], 'รับแล้ว: Energy +20 ความสนิท +2 การ์ดเป็นรับแล้ว ป้ายหาย');
  assert(/\+20 Energy · ทดสอบ/.test(await p.locator('.toast').last().innerText()), 'ข้อความเด้งบอกความรู้สึกของสัตว์เลี้ยง');
  await p.evaluate(() => pclaim('rev')); assert.strictEqual(await p.evaluate(() => M.pet.energy), 20, 'รับซ้ำไม่ได้');
  await p.evaluate(() => pclaim('dlg')); assert.strictEqual(await p.evaluate(() => M.pet.energy), 20, 'ยังไม่ครบรับไม่ได้');
  // หลอด Energy ถึงมื้อถัดไป
  assert.deepStrictEqual(await p.evaluate(() => [document.querySelector('.ebar').getAttribute('aria-valuenow'), document.querySelector('.pel span').textContent]), ['20', 'อีก 10 ถึงมื้อถัดไป']);
  // ข้อมูลวันเดิมจากเวอร์ชันก่อน (ไม่มี cl): ภารกิจที่ครบแล้วได้ Energy ไปแล้ว นับว่ารับแล้ว
  assert.deepStrictEqual(await p.evaluate(() => { M.pet.d = { date: dstr(new Date()), rev: 10, neu: 5, dlg: 0, done: { rev: 1, neu: 1 }, r: [] }; pens(); return [M.pet.d.cl, punclaimed()] }), [{ rev: 1, neu: 1 }, 0]);
  assert.deepStrictEqual(p.errors, []);
});

test('แท็บโปรไฟล์ = บัตรสัตว์เลี้ยง: เปิดจากปุ่มบนการ์ดหน้าแรก · อายุ วันเกิด ระดับความสนิท เรียนเพื่อ · แท็บนิสัย · แก้ชื่อ · คลังสะสมล็อกไว้ก่อน · กลับหน้าแรก', async (b, base) => {
  const p = await fresh(b, base, { viewport: { width: 375, height: 812 } });
  // อยู่ด้วยกัน 10 วัน · ถึงเป้า 3 วันติด · ความสนิท 57 = เพื่อนกัน (ร่าง 2) อีก 23 ถึงเพื่อนสนิท
  await p.evaluate(() => { const ds = i => { const d = new Date(); d.setDate(d.getDate() - i); return dstr(d) };
    M.pet.rv = ds(9); M.pet.bond = 57; M.pet.trait = 3; M.pet.goal = 'เพื่อไปสอบวัดระดับ JLPT'; M.days = {}; [0, 1, 2, 6, 7, 8, 9].forEach(i => M.days[ds(i)] = M.goal); saveM(); render() });
  await p.locator('.ppf').click();
  assert.deepStrictEqual(await p.evaluate(() => [tab, meView]), ['me', 'card']);
  assert.strictEqual(await p.locator('#nav .on').innerText(), 'โปรไฟล์');
  const rows = await p.locator('.idr').allInnerTexts();
  const R = Object.fromEntries(rows.map(r => { const [k, ...v] = r.split('\n').map(x => x.trim()).filter(Boolean); return [k, v.join(' ')] }));
  assert.strictEqual(R['อายุ'], '10 วัน');
  assert(/2569|2026/.test(R['วันเกิด']), R['วันเกิด']);
  assert(/^เพื่อนกัน/.test(R['ความสนิท']) && /ร่าง 2 · อีก 23 แต้มถึงเพื่อนสนิท/.test(R['ความสนิท']), R['ความสนิท']);
  assert.strictEqual(R['เรียนเพื่อ'], 'สอบวัดระดับ JLPT');
  assert(/เรียนด้วยกัน 7 วัน/.test(await p.locator('.idnm').innerText()));
  assert(/3\s*วันติด/.test(await p.locator('.ids').innerText()));
  // แท็บนิสัย: ชื่อนิสัย คำอธิบาย และประโยคตัวอย่าง
  await p.locator('.idtb button:text-is("นิสัย")').click();
  const tr = await p.locator('.idbd').innerText();
  assert(tr.includes('ปากแข็งแต่ใจดี') && tr.includes('แอบดีใจ') && tr.includes('ชอบพูดว่า'), tr);
  await p.locator('.idtb button:text-is("เกี่ยวกับ")').click();
  // แก้ชื่อ: ตัดอักขระ HTML · ชื่อว่างไม่บันทึก · ยกเลิกไม่เปลี่ยน
  await p.locator('.ida[aria-label="แก้ชื่อ"]').click();
  await p.fill('#pfnm', '   '); await p.locator('.cov button:text-is("บันทึก")').click();
  assert.strictEqual(await p.evaluate(() => M.pet.name), 'ทดสอบ'); await p.locator('.cov button:text-is("ยกเลิก")').click();
  await p.locator('.ida[aria-label="แก้ชื่อ"]').click();
  await p.fill('#pfnm', 'โม<b>จิ'); await p.locator('.cov button:text-is("บันทึก")').click();
  assert.deepStrictEqual(await p.evaluate(() => [M.pet.name, JSON.parse(localStorage.getItem('kn_meta')).pet.name, document.querySelector('.idnm b').textContent]), ['โมbจิ', 'โมbจิ', 'โมbจิ']);
  // คลังสะสม: ลายครีมแต้มส้มใส่อยู่ ที่เหลือ 8 ลาย + เครื่องประดับ 2 ชิ้นล็อก · ภาพแมววาดแล้ว (ไม่ใช่ผืนผ้าใบว่าง)
  const k = await p.evaluate(() => ({ on: [...document.querySelectorAll('.pfi.on b')].map(e => e.textContent), lock: document.querySelectorAll('.pfi.pfo .pfth').length,
    medal: document.querySelectorAll('.pfi.pfo>.ic2').length, drawn: [...document.querySelectorAll('#pfcv,.pfth')].every(c => c.getContext('2d').getImageData(0, 0, 48, 48).data.some(v => v)) }));
  assert.deepStrictEqual(k, { on: ['ครีมแต้มส้ม'], lock: 10, medal: 3, drawn: true });
  // ไม่มีเลื่อนแนวนอนบนจอแคบ · ชื่อไม่ทับปุ่ม · ปุ่มกลับไปหน้าแรก
  await p.setViewportSize({ width: 320, height: 640 }); await p.evaluate(() => { M.pet.name = 'เจ้าเหมียวน้อยจ๋า'; render() });
  assert(!(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)), 'หน้าโปรไฟล์ล้นจอแนวนอน');
  assert(await p.evaluate(() => { const a = document.querySelector('.idact').getBoundingClientRect(), n = document.querySelector('.idnm b').getBoundingClientRect(); return n.top >= a.bottom - 1 }), 'ชื่อทับปุ่ม');
  await p.locator('#nav button:has-text("หน้าแรก")').click();
  assert.strictEqual(await p.evaluate(() => tab), 'home');
  assert.strictEqual(await p.locator('#petcv').count(), 1, 'กลับหน้าแรกแล้วแมวกลับมา');
  // สัตว์เลี้ยงรุ่นเก่าที่ไม่มี rv: นับอายุจากวันแรกที่มีใน M.days · กระต่ายไม่มีช่องลายขน
  await p.evaluate(() => { delete M.pet.rv; M.pet.sp = 1; goProf() });
  assert(/อายุ\s*10 วัน/.test(await p.locator('.idr:has-text("อายุ")').innerText()));
  assert.deepStrictEqual(await p.evaluate(() => [document.querySelectorAll('.pfth').length, document.querySelectorAll('.pfe').length]), [0, 1]);
  assert.deepStrictEqual(p.errors, []);
});

test('เข้าสู่ระบบด้วย Google (PKCE): ปุ่มขึ้นเมื่อเปิดใน Supabase · ไปหน้า Google แล้วกลับมาแลก code · ชื่อจาก Google เป็นชื่อเจ้าของ · ใช้อีเมลแทนได้ · ขากลับผิดปกติไม่พัง', async (b, base) => {
  // ยังไม่เปิด Google: ฟอร์มอีเมลแบบเดิม ไม่มีปุ่ม Google
  const d0 = mockCloud(), p0 = await cloudPage(b, base, d0);
  await p0.evaluate(() => goMe('acct')); for (let i = 0; i < 50 && !d0.calls.some(c => c.startsWith('GET /auth/v1/settings')); i++) await p0.waitForTimeout(50);
  assert.strictEqual(await p0.locator('.sgg').count(), 0); assert.strictEqual(await p0.locator('#cem').count(), 1);
  await p0.context().close();
  const db = mockCloud(); db.google = true;
  const p = await cloudPage(b, base, db);
  await p.evaluate(() => goMe('acct'));
  await p.waitForSelector('.sgg');
  assert((await p.locator('.sgg').innerText()).includes('ลงชื่อเข้าใช้ด้วย Google'));
  // ลิงก์ "ใช้อีเมลแทน" → ฟอร์มอีเมล → "เลือกวิธีอื่น" กลับมา
  await p.locator('.sgm').click(); assert.strictEqual(await p.locator('#cem').count(), 1);
  await p.locator('button:text-is("‹ เลือกวิธีอื่น")').click(); assert.strictEqual(await p.locator('.sgg').count(), 1);
  // กด Google → (จำลอง) หน้า Google ส่งกลับมาพร้อม ?code → แลกเป็น session ด้วย code_verifier ที่ตรงกับ code_challenge
  await Promise.all([p.waitForURL(u => /\?code=gc1$/.test(u)), p.locator('.sgg').click()]);
  await p.waitForSelector('.toast:has-text("เข้าสู่ระบบแล้วค่ะ")');
  await p.waitForFunction(() => !cloudBusy && M.me && M.me.name);
  assert.deepStrictEqual({ pv: db.auth.provider, m: db.auth.code_challenge_method, back: db.auth.redirect_to, ok: db.pkceOk }, { pv: 'google', m: 's256', back: base, ok: true });
  const st = await p.evaluate(() => ({ in: cloudIn(), via: CS.via, email: CS.email, pk: localStorage.getItem('kn_pkce'), url: location.search, me: M.me.name }));
  assert.deepStrictEqual(st, { in: true, via: 'google', email: 'a@b.co', pk: null, url: '', me: 'พอใจ ทดสอบ' }, 'ชื่อจาก Google ตัดอักขระ HTML แล้วใช้เป็นชื่อเจ้าของ');
  assert(db.row, 'ซิงก์ขึ้นคลาวด์หลังเข้าสู่ระบบ');
  // ขากลับที่ไม่มี code_verifier (เช่น เปิดกลับมาในหน้าต่างอื่น) หรือผู้ใช้กดยกเลิกที่หน้า Google: แจ้งเตือน ลบพารามิเตอร์ ไม่พัง
  await p.evaluate(() => { cloudForget(); });
  await p.goto(base + '?code=zzz');
  await p.waitForSelector('.toast:has-text("ลองกดเข้าสู่ระบบจากในแอปอีกครั้ง")');
  assert.deepStrictEqual(await p.evaluate(() => [location.search, cloudIn()]), ['', false]);
  await p.goto(base + '?error=access_denied&error_description=%3Cb%3Ecancelled%3C%2Fb%3E');
  await p.waitForSelector('.toast:has-text("เข้าสู่ระบบไม่สำเร็จ")');
  assert.strictEqual(await p.locator('.toast b').count(), 0, 'ข้อความ error ต้อง escape');
  assert.strictEqual(await p.evaluate(() => location.search), '');
  assert.deepStrictEqual(p.errors, []);
});

test('แท็บเรียน: หน้ารวมมีเส้นทางเรียน (ย้ายจากหน้าแรก) · ปุ่มเรียนต่อ · ปุ่มกลับในหมวดย่อยกลับหน้ารวม · แตะแท็บเรียนซ้ำกลับหน้ารวม', async (b, base) => {
  const p = await fresh(b, base, { viewport: { width: 390, height: 844 } });
  assert(!(await p.locator('#app').innerText()).includes('เส้นทางเรียน'), 'หน้าแรกไม่มีเส้นทางเรียนแล้ว');
  assert.strictEqual(await p.locator('#app .path').count(), 0);
  await p.locator('#nav button:has-text("เรียน")').first().click();
  assert.deepStrictEqual(await p.evaluate(() => [tab, view]), ['learn', 'path']);
  assert.strictEqual(await p.locator('#nav .on').innerText(), 'เรียน');
  const t = await p.locator('#app').innerText();
  assert(t.includes('เส้นทางเรียน') && t.includes('กำลังเรียนระดับ N5'), t.slice(0, 200));
  assert.strictEqual(await p.locator('#app .path .pc').count(), 4, 'คานะ N5 N4 N3');
  // ปุ่มเรียนต่อ → หมวดล่าสุด (ค่าเริ่มต้นคันจิ) · ปุ่มกลับ → หน้ารวม (ไม่ใช่หน้าแรก)
  await p.locator('#app .big').click();
  assert.deepStrictEqual(await p.evaluate(() => [tab, view, ds]), ['learn', 's', 'k']);
  await p.locator('.top .bk').click();
  assert.deepStrictEqual(await p.evaluate(() => [tab, view]), ['learn', 'path']);
  // การ์ดคานะ → ตารางคานะ · แตะแท็บเรียนซ้ำ → หน้ารวม
  await p.locator('.pc.big1').click();
  assert.deepStrictEqual(await p.evaluate(() => [view, ds]), ['s', 'a']);
  await p.locator('#nav button:has-text("เรียน")').first().click();
  assert.strictEqual(await p.evaluate(() => view), 'path');
  // การ์ด N5 → หน้าหมวดของระดับ → ปุ่มกลับ → หน้ารวม
  await p.locator('.path .pc:has-text("N5")').first().click();
  assert.strictEqual(await p.evaluate(() => view), 'n5');
  await p.locator('.top .bk').click();
  assert.strictEqual(await p.evaluate(() => view), 'path');
  // ปุ่มทบทวนบนหน้าแรกยังพาเข้าหมวดล่าสุดได้ตรงๆ
  await p.locator('#nav button:has-text("หน้าแรก")').click();
  await p.locator('#app .big').click();
  assert.deepStrictEqual(await p.evaluate(() => [tab, view, ds]), ['learn', 's', 'a']);
  assert(!(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)));
  assert.deepStrictEqual(p.errors, []);
});

test('แถบล่าง 5 หมวด: หน้าแรก เรียน ความคืบหน้า (ภาพรวม/ผิดบ่อย) ร้านค้า (เร็วๆ นี้) โปรไฟล์ (บัตร + เมนู: บัญชี สำรองข้อมูล เครดิต)', async (b, base) => {
  const p = await fresh(b, base, { viewport: { width: 375, height: 812 } });
  assert.deepStrictEqual(await p.locator('#nav button').allInnerTexts(), ['หน้าแรก', 'เรียน', 'ความคืบหน้า', 'ร้านค้า', 'โปรไฟล์']);
  // ป้ายทุกปุ่มอยู่บรรทัดเดียว ไม่ล้นปุ่มบนจอมือถือแคบ
  assert(await p.evaluate(() => [...document.querySelectorAll('#nav button')].every(x => x.scrollWidth <= x.clientWidth + 1)), 'ป้ายแถบล่างล้น');
  // ความคืบหน้า: ภาพรวม ↔ ผิดบ่อย แถบล่างเน้นความคืบหน้าทั้งสองหน้า · ไม่มีส่วนบัญชี/สำรองข้อมูลแล้ว
  await p.locator('#nav button:has-text("ความคืบหน้า")').click();
  let t = await p.locator('#app').innerText();
  assert(t.includes('14 วันล่าสุด') && t.includes('เป้าหมายต่อวัน') && !t.includes('สำรองข้อมูล') && !t.includes('เกี่ยวกับและเครดิต'), t.slice(0, 300));
  await p.locator('.pgs button:text-is("ผิดบ่อย")').click();
  assert.deepStrictEqual(await p.evaluate(() => [tab, document.querySelector('#nav .on').textContent, document.querySelector('.pgs .on').textContent]), ['mis', 'ความคืบหน้า', 'ผิดบ่อย']);
  assert((await p.locator('#app').innerText()).includes('ผิดตั้งแต่ 2 ครั้ง'));
  await p.locator('.pgs button:text-is("ภาพรวม")').click();
  assert.strictEqual(await p.evaluate(() => tab), 'stats');
  // ร้านค้า: ยังไม่เปิด ไม่มีราคาเงินจริง · ลิงก์ไปคลังสะสม
  await p.locator('#nav button:has-text("ร้านค้า")').click();
  t = await p.locator('#app').innerText();
  assert(t.includes('เร็วๆ นี้') && t.includes('ตู้สุ่ม') && t.includes('แลกของ') && t.includes('ไม่ใช้เงินจริง') && !/฿|บาท|THB/.test(t), t);
  // โปรไฟล์: บัตรสัตว์เลี้ยง → ปุ่มเมนู → หน้ารวมรายการ → หน้าย่อย (สำรองข้อมูล เครดิต) → กลับเมนู → กลับบัตร · แตะแท็บซ้ำกลับบัตร
  await p.locator('#nav button:has-text("โปรไฟล์")').click();
  assert.strictEqual(await p.locator('.idc').count(), 1, 'แท็บโปรไฟล์เปิดมาเป็นบัตรสัตว์เลี้ยง');
  await p.locator('.mnb').click();
  t = await p.locator('#app').innerText();
  ['ดูโปรไฟล์', 'แก้ไข', 'บัญชีและข้อมูล', 'สำรองข้อมูล', 'ระดับที่เรียน', 'ช่วยเหลือและข้อมูล', 'แนะนำแอป', 'ลิขสิทธิ์และเครดิต', 'นโยบายความเป็นส่วนตัว', 'ข้อกำหนดการใช้งาน'].forEach(k => assert(t.includes(k), 'เมนูขาด ' + k));
  assert.strictEqual(await p.locator('.mnr[href="privacy.html"][target=_blank][rel~=noopener]').count(), 1);
  await p.locator('.mnr:has-text("สำรองข้อมูล")').click();
  assert.deepStrictEqual(await p.evaluate(() => [meView, !!document.querySelector('#imp'), document.querySelector('.top b').textContent]), ['backup', true, 'สำรองข้อมูล']);
  await p.locator('.top .bk').click(); assert.strictEqual(await p.evaluate(() => meView), 'menu');
  await p.locator('.mnr:has-text("ลิขสิทธิ์และเครดิต")').click();
  assert(await p.locator('#credits[open]').count() === 1 && (await p.locator('#credits').innerText()).includes('KanjiVG'));
  await p.locator('.top .bk').click(); await p.locator('.mnq:has-text("คลังสะสม")').click();
  assert.strictEqual(await p.evaluate(() => meView), 'card');
  await p.locator('.mnb').click(); await p.locator('#nav button:has-text("โปรไฟล์")').click();
  assert.strictEqual(await p.evaluate(() => meView), 'card', 'แตะแท็บโปรไฟล์ซ้ำกลับหน้าบัตร');
  for (const n of ['หน้าแรก', 'เรียน', 'ความคืบหน้า', 'ร้านค้า', 'โปรไฟล์']) { await p.locator(`#nav button:has-text("${n}")`).click(); assert(!(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)), n + ' ล้นจอแนวนอน'); }
  assert.deepStrictEqual(p.errors, []);
});

test('สัตว์เลี้ยงปลอบหลังตอบผิด (ควิซ + ไวยากรณ์) · ช่องตัวแปร {n} {kanji} · สุ่มไม่ซ้ำประโยคล่าสุด', async (b, base) => {
  const p = await fresh(b, base);
  // ช่องตัวแปร: ยังไม่มีค่า → ไม่เลือกประโยคที่มีช่องตัวแปร · มีค่าแล้ว → เติมค่าลงไป ไม่มี { เหลือ
  const v = await p.evaluate(() => { pens(); M.pet.trait = 0; M.pet.d.rev = 0; delete M.pet.d.lk; const raw = TR[0].s.pat, a = [];
    for (let i = 0; i < 60; i++) a.push(pline(M.pet, 'pat', false));
    M.pet.d.rev = 7; M.pet.d.lk = '山'; const b2 = []; for (let i = 0; i < 80; i++) b2.push(pline(M.pet, 'pat', false));
    return { noVar: a.every(l => raw.includes(l) && !/\{/.test(l)), filled: b2.every(l => !/\{/.test(l)), n: b2.some(l => /(^|\s)7 ข้อ/.test(l)), k: b2.some(l => l.startsWith('山 ')) } });
  assert.deepStrictEqual(v, { noVar: true, filled: true, n: true, k: true }, 'ช่องตัวแปร');
  // ไม่ซ้ำครึ่งคลังล่าสุด: ลูบหัว 12 ประโยค → 7 ครั้งติดกันไม่ซ้ำเลย
  const rep = await p.evaluate(() => { let worst = 99; for (let t = 0; t < 20; t++) { const a = []; for (let i = 0; i < 7; i++) a.push(pline(M.pet, 'pat', false)); worst = Math.min(worst, new Set(a).size) } return worst });
  assert(rep >= 6, 'ประโยคลูบหัวซ้ำเร็วเกินไป: ไม่ซ้ำแค่ ' + rep + '/7');
  // ควิซคันจิ: ตอบผิดครั้งแรกขึ้นประโยคปลอบของนิสัย (ชื่อสัตว์เลี้ยง + ประโยค · {kanji} = ข้อที่เพิ่งตอบ) · ตอบถูกไม่ขึ้น
  await p.evaluate(() => { M.pet.trait = 3; openDs('k'); mode = 'quiz'; go() });
  const k0 = await p.evaluate(() => cur.k), wrongs = await p.evaluate(() => TR[3].s.wrong);
  await p.evaluate(() => pick(ch.findIndex(c => !c.ok)));
  let t = (await p.locator('.card .pcm').innerText()).trim();
  assert(t.startsWith('ทดสอบ'), t); t = t.replace(/^ทดสอบ\s*/, '');
  assert(wrongs.some(l => tplRe(l).test(t)) && !/\{/.test(t), 'ประโยคปลอบต้องมาจากช่อง wrong: ' + t);
  if (!wrongs.includes(t)) assert(t.includes(k0), '{kanji} ต้องเป็นข้อที่เพิ่งตอบผิด ' + k0 + ': ' + t);
  assert.strictEqual(await p.locator('.card .btns .nx').count(), 1, 'ยังมีปุ่มข้อต่อไป');
  await p.evaluate(() => { go(); pick(ch.findIndex(c => c.ok)) }); assert.strictEqual(await p.locator('.pcm').count(), 0, 'ตอบถูกไม่ขึ้นประโยคปลอบ');
  // ไวยากรณ์: ผิดติดกัน 2 ข้อขึ้นแน่นอน · ไม่มีข้อให้ใส่ {kanji} จึงต้องเป็นประโยคที่ไม่มีช่องตัวแปร
  await p.evaluate(() => { pwr = 1; gOpen(0); gstart(); gpick(gq[0].opts.findIndex(o => !o.ok)) });
  t = (await p.locator('.pcm').innerText()).trim().replace(/^ทดสอบ\s*/, '');
  assert(wrongs.includes(t), 'ไวยากรณ์: ' + t);
  // ไม่มีสัตว์เลี้ยง (ยังไม่ตั้งค่า) ไม่ขึ้น
  assert.strictEqual(await p.evaluate(() => { const q = M.pet; M.pet = {}; const r = pcomfort('x', false); M.pet = q; return r }), '');
  assert.deepStrictEqual(p.errors, []);
});

test('แมวพิกเซล: หน้าหลักวาดฉากห้อง, เหตุการณ์เรียกท่าอารมณ์, แตะแยกโซนและมาตรวัดความทน, เปลี่ยนท่าไม่ค้าง, กระต่ายยังเป็นอิโมจิ', async (b, base) => {
  const p = await fresh(b, base);
  await p.waitForTimeout(300);
  const info = await p.evaluate(() => { const c = document.getElementById('petcv'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return [c.width, c.height, n, getComputedStyle(c).imageRendering]; });
  assert.deepStrictEqual(info.slice(0, 2), [160, 90]); assert(info[2] > 160 * 90 * .9, 'ฉากต้องถูกวาด'); assert.strictEqual(info[3], 'pixelated');
  assert.strictEqual(await p.locator('.pet').count(), 0, 'แมวต้องไม่เป็นอิโมจิแล้ว');
  const T = () => p.evaluate(() => { const c = PixelCat._t.cat; return [c.mode, c.pose || null]; });
  // ให้อาหาร = ท่ากินข้าวปั้น (ถ้ากำลังเดินอยู่ รอจนนั่งพักก่อน)
  await p.evaluate(() => { const c = PixelCat._t.cat; Object.assign(c, { mode: 'sit', t: 0, dur: 1e9 }); M.pet.energy = 100; pfeed(); });
  assert.deepStrictEqual(await T(), ['pose', 'eat']);
  // Energy ไม่พอ → ขออาหาร (รายงานพฤติกรรมข้อ 12): เดินหางตั้งมากลางฉาก เงยหน้ามอง ニャー แล้วถูหัวคราง (ไม่ใช่ท่าเศร้า) · หลับอยู่ตื่นก่อน
  const begSim = (o) => p.evaluate(o => { const { step, cat } = PixelCat._t; Object.assign(cat, { mode: 'sit', x: 5, t: 0, dur: 1e9, then: null, pend: null, pose: null, tol: 0, cool: 0, lv: 0, after: null }, o); M.pet.energy = 5; pfeed();
    const r = { first: cat.mode, up: false }; for (let i = 0; i < 800 && !(cat.mode === 'pose' && cat.pose === 'curious'); i++) { step(50); if (cat.mode === 'walk' && cat.then === 'beg') r.up = true }
    r.pose = [cat.mode, cat.pose]; r.x = Math.round(cat.x); r.say = document.querySelector('.scn.px .scb').textContent; for (let j = 0; j < 40 && cat.mode !== 'pet'; j++) step(50); r.after = cat.mode; return r }, o);
  let bg = await begSim({});
  assert(bg.up, 'ต้องเดินหางตั้งมาหา'); assert.deepStrictEqual(bg.pose, ['pose', 'curious'], 'มาถึงแล้วเงยหน้ามอง'); assert(bg.say.includes('ニャー'), 'ฟองขออาหาร: ' + bg.say);
  assert(bg.x > 40 && bg.x < 75, 'ขอกลางฉาก x=' + bg.x); assert.strictEqual(bg.after, 'pet', 'มองเสร็จแล้วถูหัว');
  bg = await begSim({ mode: 'curl' }); assert.strictEqual(bg.first, 'wake', 'หลับอยู่ต้องตื่นก่อน'); assert(bg.up && bg.after === 'pet', JSON.stringify(bg));
  await p.evaluate(() => { const c = PixelCat._t.cat; Object.assign(c, { mode: 'walk', target: c.x + 30, pend: null }); PixelCat.cue('happy', 1000); });
  assert.strictEqual((await T())[0], 'walk', 'กำลังเดินต้องไม่ถูกตัดกลางคัน');
  await p.evaluate(() => { const c = PixelCat._t.cat; Object.assign(c, { mode: 'sit', t: 0, dur: 1e9 }); });
  await p.waitForTimeout(150); assert.deepStrictEqual(await T(), ['pose', 'happy']);
  // เหตุการณ์ตอนอยู่แท็บอื่น: เล่นให้ดูตอนกลับหน้าหลัก
  await p.evaluate(() => goTab('learn')); await p.evaluate(() => { PixelCat.cue('sad', 1500); Object.assign(PixelCat._t.cat, { mode: 'sit', t: 0, dur: 1e9 }); goTab('home'); });
  assert.deepStrictEqual(await T(), ['pose', 'sad']);
  // แตะแมวแยกโซน (รายงานพฤติกรรมข้อ 4): หัว = ถูกลูบ + หัวใจ + ゴロゴロ · ตัว = หันมอง ニャ？ · หาง = รำคาญ · ตอนหลับ = ตื่น
  // ร่าง 3 (สนิทมาก) ไม่สุ่มเขิน ผลจึงแน่นอน · ตั้งเป็นกลางวันให้สีหัวใจไม่ถูกย้อม
  await p.evaluate(() => { M.pet.bond = 200; PixelCat._t.setTod('day'); render() });
  const reset = (o = {}) => p.evaluate(o => Object.assign(PixelCat._t.cat, { mode: 'sit', x: 52, t: 0, dur: 1e9, pose: null, tol: 0, cool: 0, lv: 0, then: null, pend: null }, o), o);
  await reset(); await p.waitForTimeout(80);
  const box = await p.locator('#petcv').boundingBox(), sc = box.width / 160, tap = (x, y) => p.mouse.click(box.x + (52 + x) * sc, box.y + (41 + y) * sc);
  const st = () => p.evaluate(() => { const c = PixelCat._t.cat; return { m: c.mode, then: c.then, lv: c.lv, tol: c.tol, cool: c.cool, fx: PixelCat._t.fxs().map(e => e.type), say: document.querySelector('.scn.px .scb').textContent } });
  assert.deepStrictEqual(await p.evaluate(() => { const { zoneAt, cat } = PixelCat._t, z = []; z.push(zoneAt(52 + 24, 41 + 20), zoneAt(52 + 24, 41 + 38), zoneAt(52 + 42, 41 + 32));
    cat.mode = 'walk'; z.push(zoneAt(52 + 24, 41 + 20)); cat.mode = 'curl'; z.push(zoneAt(52 + 24, 41 + 20)); cat.mode = 'sit'; return z }), ['head', 'body', 'tail', 'move', 'sleep']);
  await tap(24, 20); let s = await st();
  assert.strictEqual(s.m, 'pet', 'แตะหัว = ถูกลูบ'); assert(s.fx.includes('heart') && s.fx.includes('tap'), 'ต้องมีหัวใจและประกายตรงที่แตะ ' + s.fx); assert(s.say.includes('ゴロゴロ'), s.say);
  const HEARTPX = () => p.evaluate(() => { const d = document.getElementById('petcv').getContext('2d').getImageData(0, 0, 160, 90).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] === 0xef && d[i + 1] === 0x7d && d[i + 2] === 0x92) n++; return n });
  await p.waitForTimeout(250); assert(await HEARTPX() > 0, 'หัวใจพิกเซลต้องถูกวาดลงฉาก');
  await p.waitForTimeout(1500); assert.strictEqual(await HEARTPX(), 0, 'เอฟเฟกต์ต้องหายเองและฉากถูกวาดใหม่'); assert.strictEqual((await st()).fx.length, 0);
  await reset(); await tap(24, 38); s = await st(); assert.strictEqual(s.m, 'notice', 'แตะตัว = หันมอง'); assert(s.say.includes('ニャ'), s.say);
  await reset(); await tap(42, 32); s = await st(); assert.deepStrictEqual([s.m, s.lv], ['annoy', 1], 'แตะหาง = รำคาญขั้น 1 ทันที');
  // แตะหัวรัวๆ: ลูบ → ขั้น 1 ปลายหางสะบัด → ขั้น 2 หางฟาด + 💢 ムッ → ขั้น 3 ぷいっ เดินหนี
  await reset(); const seq = [];
  for (let i = 0; i < 12 && !seq.includes('leave'); i++) { await tap(24, 20); s = await st(); seq.push(s.then === 'leave' ? 'leave' : s.m === 'annoy' ? 'annoy' + s.lv : s.m); if (s.m === 'annoy' && s.lv === 2) assert(s.fx.includes('vein'), 'ขั้น 2 ต้องมี 💢') }
  const at = k => seq.indexOf(k);
  assert(seq[0] === 'pet' && at('annoy1') > 0 && at('annoy2') > at('annoy1') && at('leave') > at('annoy2'), 'ลำดับขั้น: ' + seq.join(' '));
  assert(at('leave') >= 5 && at('leave') <= 9, 'แตะรัวราว 6–10 ครั้งถึงเดินหนี: ' + seq.join(' '));
  assert(s.say.includes('ぷいっ'), s.say);
  // เดินหนีไปอีกฝั่ง → เลียขน → พัก 15–20 วิ ระหว่างพักแตะแล้วแค่ … ไม่เพิ่มมาตรวัด · พักครบ มาตรวัดกลับเป็น 0
  const lv3 = await p.evaluate(() => { const { step, cat } = PixelCat._t, x0 = cat.x; let i = 0; for (; i < 600 && !(cat.mode === 'groom' && cat.cool > 0); i++) step(50); return { x0, x: cat.x, m: cat.mode, cool: cat.cool, tol: cat.tol } });
  assert.strictEqual(lv3.m, 'groom', 'เดินหนีแล้วต้องเลียขน'); assert(lv3.x - lv3.x0 > 40, 'ต้องเดินไปอีกฝั่ง ' + JSON.stringify(lv3)); assert(lv3.cool >= 14000 && lv3.cool <= 20000);
  const box2 = await p.locator('#petcv').boundingBox(); await p.mouse.click(box2.x + (Math.round(lv3.x) + 24) * sc, box2.y + (41 + 20) * sc);
  s = await st(); assert.strictEqual(s.m, 'groom', 'ระหว่างพักแตะแล้วไม่เปลี่ยนท่า'); assert(s.fx.includes('dots')); assert(s.tol <= lv3.tol, 'ระหว่างพักไม่เพิ่มมาตรวัด');
  s = await p.evaluate(() => { const { step, cat } = PixelCat._t; for (let i = 0; i < 420; i++) step(50); return { cool: cat.cool, tol: cat.tol } });
  assert.deepStrictEqual(s, { cool: 0, tol: 0 });
  // มาตรวัดลดเองตามเวลา (0.2 ต่อวิ): ลูบช้าๆ ไม่ทำให้แมวรำคาญ
  s = await p.evaluate(() => { const { step, cat } = PixelCat._t; Object.assign(cat, { mode: 'sit', t: 0, dur: 1e9, tol: 5 }); for (let i = 0; i < 200; i++) step(50); return cat.tol });
  assert(Math.abs(s - 3) < .05, 'มาตรวัดหลัง 10 วิ ' + s);
  // ปิดแอนิเมชันในระบบ: ไม่มีเอฟเฟกต์ แต่ท่าถูกลูบยังจบกลับไปนั่งได้
  s = await p.evaluate(() => { const { step, cat, setPlaying, fxs } = PixelCat._t; setPlaying(false); Object.assign(cat, { mode: 'sit', t: 0, dur: 1e9, tol: 0, cool: 0 }); const n0 = fxs().length; PixelCat.poke('head'); const r = [cat.mode, fxs().length - n0]; for (let i = 0; i < 60; i++) step(50); r.push(cat.mode); setPlaying(true); return r });
  assert.deepStrictEqual(s, ['pet', 0, 'sit']);
  // กดค้างที่หัว ~0.65 วิ = กะพริบตาช้าตอบ (Humphrey 2020) ใจเย็นลง · ระหว่างกดมีวงแหวน · ยกนิ้วหลังจากนั้นไม่กลายเป็นลูบหัว · ลูบครบ 3 ครั้งมีคำแนะนำครั้งเดียว
  await reset({ tol: 3 }); await p.mouse.move(box.x + 76 * sc, box.y + 61 * sc); await p.mouse.down(); await p.waitForTimeout(250);
  s = await st(); assert(s.fx.includes('hold'), 'กดค้างต้องมีวงแหวน'); assert.strictEqual(s.m, 'sit', 'ยังไม่ครบเวลากดค้าง ต้องยังไม่ลูบ');
  await p.waitForTimeout(650); s = await st(); await p.mouse.up();
  assert.strictEqual(s.m, 'sblink', 'กดค้าง = กะพริบตาช้า'); assert(s.tol < 2, 'กะพริบตาช้าแล้วมาตรวัดต้องลด ' + s.tol); assert(!s.fx.includes('hold'));
  assert.strictEqual((await st()).m, 'sblink', 'ยกนิ้วหลังกดค้างต้องไม่กลายเป็นลูบหัว');
  assert(await p.evaluate(() => M.pet.tip && M.pet.tip.blink === 1), 'ลูบหัวครบ 3 ครั้งต้องมีคำแนะนำกดค้าง');
  await reset({ mode: 'curl' });
  await tap(24, 26);
  assert.strictEqual((await T())[0], 'wake');
  await p.evaluate(() => { PixelCat._t.setTod(null); render() });
  // จำลอง 30 นาทีในแอป: ไม่ออกนอกขอบ ผ่านทุกสถานะ ทุกท่าวาดได้ทั้งสองโหมด
  const sim = await p.evaluate(() => { const { step, cat, XMIN, XMAX, frame, KEYS, setPart } = PixelCat._t, seen = new Set(); let out = 0, legFirst = 0; setPart('tw'); Object.assign(cat, { mode: 'sit', t: 0, dur: 100 });
    let prev = ''; for (let i = 0; i < 36000; i++) { step(50); seen.add(cat.mode); if (cat.x < XMIN || cat.x > XMAX) out++; const g = cat.mode === 'groom' ? cat.gk : ''; if (g === 'groomLeg' && prev !== 'groomLeg' && prev !== 'groom') legFirst++; prev = g || (cat.mode === 'groom' ? prev : ''); } setPart(null); if (legFirst) seen.add('LEG-FIRST');
    let bad = []; for (const tm of ['light', 'dark']) for (const k of KEYS) { const g = frame(k, 0, tm); if (!g.some(r => r.some(Boolean))) bad.push(tm + k) } return { seen: [...seen], out, bad }; });
  assert.strictEqual(sim.out, 0); assert.deepStrictEqual(sim.bad, []);
  for (const m of ['sit', 'walk', 'run', 'skid', 'groom', 'loaf', 'curl', 'wake', 'nap', 'pose', 'sblink']) assert(sim.seen.includes(m), 'ไม่ผ่านสถานะ ' + m); // sblink = กะพริบตาช้าเอง (ร่าง 3)
  assert(!sim.seen.includes('LEG-FIRST'), 'เลียขาต้องต่อจากเลียแขนเสมอ (ไล่จากหัวลงหาง)');
  // ที่นอนมีเฉพาะห้อง: ไปเที่ยวที่อื่นแมวไม่เดินไปขดหลับ แต่งีบหมอบตรงที่อยู่ (กลางคืนก็เช่นกัน)
  const away = await p.evaluate(() => { const { step, cat, setPart } = PixelCat._t, seen = new Set(); M.place = { at: 'garden', got: [] }; render(); setPart('night'); Object.assign(cat, { mode: 'sit', t: 0, dur: 100, x: 80 });
    for (let i = 0; i < 24000; i++) { step(50); seen.add(cat.mode) } setPart(null); M.place = { at: 'room', got: [] }; render(); Object.assign(cat, { mode: 'sit', t: 0, dur: 1e9 }); return [...seen] });
  assert(away.includes('nap') && !away.includes('curl') && !away.includes('loaf'), 'นอกห้องต้องงีบอยู่กับที่ ไม่ขดนอน: ' + away.join(' '));
  // น้ำหนักตามช่วงเวลา: เช้า/เย็นวิ่งดีดบ่อยกว่าเที่ยง กลางคืนเข้านอนบ่อยกว่ากลางวัน
  const freq = await p.evaluate(() => { const { step, cat, setPart } = PixelCat._t, out = {}; for (const part of ['tw', 'noon', 'night', 'day']) { setPart(part); let run = 0, bed = 0, last = ''; Object.assign(cat, { mode: 'sit', t: 0, dur: 100, x: 52 }); for (let i = 0; i < 72000; i++) { step(50); if (cat.mode !== last) { if (cat.mode === 'run' && last !== 'skid') run++; if (cat.mode === 'curl') bed++; last = cat.mode } } out[part] = { run, bed } } setPart(null); Object.assign(cat, { mode: 'sit', t: 0, dur: 1e9 }); return out });
  assert(freq.tw.run > freq.noon.run, 'เช้า/เย็นต้องวิ่งดีดบ่อยกว่าเที่ยง ' + JSON.stringify(freq));
  assert(freq.night.bed > freq.day.bed, 'กลางคืนต้องเข้านอนบ่อยกว่ากลางวัน ' + JSON.stringify(freq));
  // นิสัยกำหนดพฤติกรรม (v63 · Feline Five): จำลองนิสัยละ 6 ชม. ตอนกลางวัน
  // พลังล้นวิ่งพล่านบ่อยกว่าขี้เซา · ขี้เซางีบนานกว่าพลังล้น · ปากแข็งเดินมานั่งใกล้ๆ เองบ่อยกว่าขี้อาย · ขี้อายไปแอบหลังของฝั่งขวาบ่อยกว่า · ทนลูบ: ปากแข็ง < พลังล้น < ขี้เซา
  const per = await p.evaluate(() => { const { step, cat, setTrait, setPart, setTod, XMAX } = PixelCat._t, out = {}; setPart('day'); setTod('day');
    for (const i of [0, 2, 3, 4]) { setTrait(i); const o = out[i] = { zoom: 0, nap: 0, come: 0, hide: 0, pets: 0 }; let last = ''; Object.assign(cat, { mode: 'sit', t: 0, dur: 100, x: 52, then: null, tol: 0, cool: 0, pend: null });
      for (let k = 0; k < 432000; k++) { step(50); if (cat.mode !== last) { if (cat.mode === 'run' && last !== 'skid') o.zoom++; if (cat.mode === 'turnOut' && cat.then === 'come') o.come++; last = cat.mode } if (cat.mode === 'nap') o.nap += 50; if (cat.mode === 'sit' && cat.x >= XMAX - 6) o.hide += 50 }
      Object.assign(cat, { mode: 'sit', t: 0, dur: 1e9, x: 52, tol: 0, cool: 0, then: null, lv: 0 }); while (cat.then !== 'leave' && o.pets < 40) { PixelCat.poke('head'); o.pets++ } }
    setPart(null); setTod(null); setTrait(M.pet.trait); Object.assign(cat, { mode: 'sit', t: 0, dur: 1e9, x: 52, tol: 0, cool: 0, then: null, lv: 0 }); return out });
  const PJ = JSON.stringify(per);
  // v104: จำลองนิสัยละ 6 ชม. และตรึงช่วงเวลาเป็นกลางวัน (เดิม 1 ชม. ตามนาฬิกาจริง ตั้งแต่มีอาบแดด v97 ผลแกว่งตามเวลาที่รันจนข้อขี้เซาตกเป็นบางรอบ)
  // วัด 40 รอบ: งีบ (nap อย่างเดียว) ต่ำสุด 1.69 มัธยฐาน 2.2 · ถ้านับอาบแดดรวมด้วยกลับแกว่งกว่า (ต่ำสุด 1.4) เพราะพลังล้นก็อาบแดดนาน
  // เกณฑ์อัตราส่วนตั้งต่ำกว่าค่าต่ำสุดที่วัดได้ (จำลอง 30 รอบบน main 2026-11-19: งีบ มัธยฐาน 2.2 ต่ำสุด 1.72 · เดินมาหา ต่ำสุด 2.0 · แอบ ต่ำสุด 1.5)
  // เดิมใช้ 2 เท่าทุกข้อ ซึ่งอยู่กลางการกระจายของการสุ่ม ชุดทดสอบจึงตกราว 1 ใน 4 รอบโดยที่โค้ดไม่ผิด · ทิศทางของนิสัยยังตรวจเหมือนเดิม
  assert(per[0].zoom > per[4].zoom * 2, 'พลังล้นต้องวิ่งพล่านบ่อยกว่าขี้เซา ' + PJ); assert(per[4].nap > per[0].nap * 1.4, 'ขี้เซาต้องงีบนานกว่า ' + PJ);
  assert(per[3].come > per[2].come * 1.5, 'ปากแข็งต้องเดินมาหาเองบ่อยกว่าขี้อาย ' + PJ); assert(per[2].hide > per[0].hide * 1.3, 'ขี้อายต้องไปแอบหลังของบ่อยกว่า ' + PJ);
  assert(per[3].pets < per[0].pets && per[0].pets < per[4].pets, 'ความทนลูบต้องต่างกันตามนิสัย ' + PJ);
  // ทักทายตามเวลาที่หายไป: ไม่ถึง 30 นาทีไม่ทำอะไร · 30 นาที–4 ชม. หลับอยู่ปล่อยหลับ · 4 ชม.ขึ้นไป ตื่นแล้วเดินหางตั้งมา ดีใจ + ฟอง ニャー
  const gr = await p.evaluate(() => { const { step, cat } = PixelCat._t, r = {};
    Object.assign(cat, { mode: 'sit', x: 10, t: 0, dur: 1e9, then: null }); PixelCat.greet(10 * 60e3); r.short = cat.mode;
    Object.assign(cat, { mode: 'curl', t: 0, dur: 1e9 }); PixelCat.greet(2 * 3600e3); r.midAsleep = cat.mode;
    Object.assign(cat, { mode: 'curl', x: 10, t: 0, dur: 1e9 }); PixelCat.greet(6 * 3600e3); r.longAsleep = cat.mode; let up = false, i = 0;
    for (; i < 2000 && !(cat.mode === 'pose' && cat.pose === 'happy'); i++) { step(50); if (cat.mode === 'walk' && cat.then === 'greet') up = true }
    r.up = up; r.end = [cat.mode, cat.pose]; r.bubble = document.querySelector('.scn.px .scb').textContent; r.x = Math.round(cat.x); return r });
  assert.strictEqual(gr.short, 'sit'); assert.strictEqual(gr.midAsleep, 'curl', 'หายไม่ถึง 4 ชม. แมวหลับอยู่ให้หลับต่อ');
  assert.strictEqual(gr.longAsleep, 'wake'); assert(gr.up, 'ต้องเดินหางตั้งมาทักทาย'); assert.deepStrictEqual(gr.end, ['pose', 'happy']);
  assert(gr.bubble.includes('ニャー'), 'ฟองทักทาย: ' + gr.bubble); assert(gr.x > 40 && gr.x < 75, 'ทักทายกลางห้อง x=' + gr.x);
  await p.waitForTimeout(3300); assert(!(await p.evaluate(() => document.querySelector('.scn.px .scb').textContent)).includes('ゴロゴロ'), 'ฟองทักทายต้องคืนประโยคเดิม');
  // ฉากพิกเซลครบทุกสถานที่ใน PLACES วาดได้สองโหมด ต่างกันทุกที่ และเปลี่ยนตามที่ที่เลือก
  const pl = await p.evaluate(() => { const { sceneBg, sceneFg } = PixelCat._t, sig = {}, miss = PLACES.map(x => x.id).filter(id => !PixelCat.places.includes(id));
    for (const x of PLACES) { M.place = { at: x.id, got: PLACES.map(q => q.id) }; render(); for (const tm of ['light', 'dark']) { const b = sceneBg(tm).toDataURL(), f = sceneFg(tm).getContext('2d').getImageData(0, 0, 160, 90).data; let n = 0; for (let i = 3; i < f.length; i += 4) if (f[i]) n++; sig[x.id + tm] = [b.length, n] } }
    return { miss, sig } });
  assert.deepStrictEqual(pl.miss, [], 'สถานที่ที่ยังไม่มีฉากพิกเซล');
  Object.entries(pl.sig).forEach(([k, [b, n]]) => assert(b > 1000 && n > 50, 'ฉากว่าง ' + k));
  assert.strictEqual(new Set(Object.values(pl.sig).map(v => v[0])).size, Object.keys(pl.sig).length, 'ทุกฉาก/โหมดต้องต่างกัน');
  // กล่องคำพูดลอยเหนือหัวและเลื่อนตามแมว · นาฬิกาในห้องมีหน้าปัด · ฟอนต์ของแอปโหลดได้
  await p.evaluate(() => { M.place = { at: 'room', got: [] }; PixelCat._t.seen.at = 0; render(); Object.assign(PixelCat._t.cat, { mode: 'sit', x: 0, t: 0, dur: 1e9, pend: null }) });
  await p.waitForTimeout(900);
  const bxA = await p.evaluate(() => +/translate\((-?\d+)px/.exec(PixelCat._t.bubblePos())[1]);
  await p.evaluate(() => { PixelCat._t.cat.x = 100 }); await p.waitForTimeout(900);
  const bxB = await p.evaluate(() => +/translate\((-?\d+)px/.exec(PixelCat._t.bubblePos())[1]);
  assert(bxB > bxA + 40, `กล่องคำพูดต้องเลื่อนตามแมว ${bxA} → ${bxB}`);
  const bub = await p.evaluate(() => { const b = document.querySelector('.scn.px .scb').getBoundingClientRect(), c = document.getElementById('petcv').getBoundingClientRect(); return [b.left >= c.left - 1, b.right <= c.right + 1, b.top >= c.top - 1, getComputedStyle(document.querySelector('.scn.px .scb')).visibility] });
  assert.deepStrictEqual(bub, [true, true, true, 'visible'], 'กล่องคำพูดต้องอยู่ในฉาก');
  // กล่องคำพูดขึ้นตอนพูดแล้วจางหายเอง (เจ้าของขอ 2026-11-19): ประโยคหลักขึ้นตอนวาดหน้า → หายตามเวลา → วาดหน้าซ้ำภายใน 2 นาทีไม่ขึ้นซ้ำ → แตะตัวพูดอีกครั้ง
  const BUB = () => p.evaluate(() => { const e = document.querySelector('.scn.px .scb'), c = getComputedStyle(e); return { on: e.classList.contains('on'), vis: c.visibility, op: +c.opacity, txt: e.textContent } });
  const calm = () => p.evaluate(() => Object.assign(PixelCat._t.cat, { mode: 'sit', x: 100, t: 0, dur: 1e9, pend: null, pose: null, tol: 0, cool: 0, lv: 0, then: null }));
  await p.evaluate(() => { PixelCat._t.setReadMs(400); PixelCat._t.seen.at = 0; render() }); await calm();
  await p.waitForTimeout(150); let bb = await BUB(); assert(bb.on && bb.vis === 'visible', 'ประโยคหลักต้องขึ้นตอนวาดหน้า ' + JSON.stringify(bb)); const main = bb.txt;
  await p.waitForTimeout(1000); bb = await BUB(); assert(!bb.on && bb.vis === 'hidden' && bb.op === 0, 'กล่องคำพูดต้องจางหายเอง ' + JSON.stringify(bb));
  await p.evaluate(() => render()); await calm(); await p.waitForTimeout(150); assert(!(await BUB()).on, 'วาดหน้าซ้ำภายใน 2 นาทีต้องไม่ขึ้นประโยคเดิมซ้ำ');
  await p.evaluate(() => PixelCat.poke('body')); bb = await BUB(); assert(bb.on && bb.txt.includes('ニャ'), 'แตะตัว ' + bb.txt);
  await p.waitForTimeout(1100); bb = await BUB(); assert(bb.on && bb.txt === main, 'แตะตัวแล้วพูดประโยคหลักอีกครั้ง ' + bb.txt);
  await p.waitForTimeout(900); assert(!(await BUB()).on, 'พูดจบแล้วต้องหายอีก');
  // ลูบหัว: ゴロゴロ… แล้วพูดประโยคลูบหัวตามนิสัย (Math.random = 0 ให้พูดแน่นอน · ร่าง 3 ไม่เขิน)
  await calm(); await p.evaluate(() => { const r = Math.random; Math.random = () => 0; try { PixelCat.poke('head') } finally { Math.random = r } });
  bb = await BUB(); assert(bb.on && bb.txt.includes('ゴロゴロ'), bb.txt);
  await p.waitForTimeout(1450); bb = await BUB(); const pats = await p.evaluate(() => TR[M.pet.trait].s.pat);
  assert(bb.on && pats.some(l => tplRe(l).test(bb.txt)), 'ลูบหัวแล้วพูดประโยค pat ของนิสัย: ' + bb.txt);
  // แมวร้องเองไม่ทับตอนกำลังพูด
  assert.strictEqual(await p.evaluate(() => PixelCat._t.talking()), true);
  await p.evaluate(() => PixelCat._t.setReadMs(0)); await calm(); // ให้แมวนั่งนิ่งที่เดิม (ไม่เดินไปบังนาฬิกาที่ตรวจด้านล่าง)
  // กลางวัน/กลางคืนของฉากตามเวลาจริง ไม่ใช่ตามโหมดมืดของแอป (06:00–17:59 = กลางวัน)
  assert.deepStrictEqual(await p.evaluate(() => [4, 5, 6, 7, 12, 16, 17, 18, 19, 23].map(h => PixelCat.tod(new Date(2026, 10, 19, h)))), ['night', 'dawn', 'dawn', 'day', 'day', 'day', 'dusk', 'dusk', 'night', 'night']);
  // รุ่งเช้า/พลบค่ำ: ฟ้าในหน้าต่างไม่ใช่สีกลางวัน ภาพทั้งห้องอุ่นขึ้น และโคมไฟติด (กลางวันโคมดับ)
  const tw = {};
  for (const t of ['day', 'dusk', 'dawn', 'night']) { await p.evaluate(t => { PixelCat._t.setTod(t); render() }, t); await p.waitForTimeout(150);
    tw[t] = await p.evaluate(() => { const g = (x, y) => [...document.getElementById('petcv').getContext('2d').getImageData(x, y, 1, 1).data].slice(0, 3); return { sky: g(100, 30), lamp: g(72, 58), wall: g(5, 5) } }); }
  assert.notDeepStrictEqual(tw.dusk.sky, tw.day.sky); assert.notDeepStrictEqual(tw.dawn.sky, tw.day.sky); assert.notDeepStrictEqual(tw.dusk.sky, tw.dawn.sky);
  assert(tw.dusk.sky[0] > tw.dusk.sky[2], 'พลบค่ำฟ้าต้องอมส้ม ' + tw.dusk.sky);
  assert(tw.dusk.wall[2] < tw.day.wall[2], 'พลบค่ำผนังต้องอุ่นขึ้น (ฟ้าลดลง)');
  const lum = c => c[0] + c[1] + c[2];
  assert(lum(tw.night.lamp) > lum(tw.night.wall) + 200, 'กลางคืนโคมไฟต้องสว่างกว่าผนังชัดเจน ' + tw.night.lamp + ' / ' + tw.night.wall);
  assert(tw.dusk.lamp[2] < tw.day.lamp[2], 'พลบค่ำโคมติด (กระดาษเป็นสีไฟเหลือง)');
  const px = (x, y) => p.evaluate(([x, y]) => [...document.getElementById('petcv').getContext('2d').getImageData(x, y, 1, 1).data].slice(0, 3).join(','), [x, y]);
  await p.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); PixelCat._t.setTod('day'); render() }); await p.waitForTimeout(200);
  assert.strictEqual(await px(5, 5), '255,243,227', 'แอปโหมดมืด + กลางวัน: ผนังห้องต้องสว่าง');
  assert.strictEqual(await p.locator('.scn[data-tod]').count(), 1);
  await p.evaluate(() => { document.documentElement.setAttribute('data-theme', 'light'); PixelCat._t.setTod('night'); render() }); await p.waitForTimeout(200);
  assert.strictEqual(await px(5, 5), '44,37,32', 'แอปโหมดสว่าง + กลางคืน: ผนังห้องต้องมืด');
  await p.evaluate(() => { document.documentElement.removeAttribute('data-theme'); PixelCat._t.setTod('day'); render() }); await p.waitForTimeout(200);
  // หน้าปัดกลาง (39,17): เข็มเดินตามเวลาจริงจึงทับจุดใดก็ได้บนหน้าปัด (เช่น 08:00–09:30 เข็มชั่วโมงทับ (36,17)) ตรวจ 4 จุดรอบกลาง เข็มสองเข็มทับได้ไม่เกิน 2 จุด
  const face = await p.evaluate(() => [[36, 17], [42, 17], [39, 14], [39, 20]].map(([x, y]) => [...document.getElementById('petcv').getContext('2d').getImageData(x, y, 1, 1).data].slice(0, 3).join(',')));
  assert(face.filter(c => c === '255,250,240').length >= 2, 'หน้าปัดนาฬิกาในห้อง ' + face.join(' '));
  assert(await p.evaluate(async () => { await document.fonts.ready; await Promise.all([document.fonts.load("700 20px Mali", "สวัสดี"), document.fonts.load("16px Anuphan", "สวัสดี")]); const ok = n => [...document.fonts].some(f => f.family.replace(/["']/g, '') === n && f.status === 'loaded'); return ok('Mali') && ok('Anuphan') }), 'ฟอนต์ Mali/Anuphan');
  await p.evaluate(() => { M.pet.sp = 1; render(); });
  assert.strictEqual(await p.locator('#petcv').count(), 0); assert.strictEqual(await p.locator('.pet').count(), 1); assert.strictEqual(await p.locator('.scn > svg').count(), 1);
  // ฉาก SVG ของกระต่ายก็ตามเวลาจริง: กลางวันในแอปโหมดมืด ต้องเห็นชิ้นกลางวัน ไม่เห็นชิ้นกลางคืน
  const svgTod = await p.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); PixelCat._t.setTod('day'); render(); const n = document.querySelector('.scn .night'), d = document.querySelector('.scn .day'); const r = [document.querySelector('.scn').dataset.tod, n ? getComputedStyle(n).display : 'none', d ? getComputedStyle(d).display : 'inline']; document.documentElement.removeAttribute('data-theme'); PixelCat._t.setTod(null); return r });
  assert.deepStrictEqual(svgTod, ['day', 'none', 'inline']);
  assert.deepStrictEqual(p.errors, []);
});

// ---------- iPad / PWA ----------
test('แมวพิกเซล: ตื่นแล้วหาว/ยืดตัว · นวดก่อนนอนบนเบาะ · น้ำหนักตามสถานที่และช่วงปรับตัวในที่ใหม่', async (b, base) => {
  const p = await fresh(b, base);
  await p.waitForTimeout(200);
  // ท่าใหม่ (v83) วาดได้ทุกลายขน × เครื่องประดับ ทั้งสองโหมด และผ้าพันคอ/โบว์ต้องเห็นทุกเฟรม (ตกลงกันว่าเครื่องประดับต้องใส่ได้ทุกท่า)
  const bad = await p.evaluate(() => { const { frame, COATS } = PixelCat._t, out = [], n = { yawn: 4, stretchR: 6, stretchL: 6, knead: 4, doze: 8 };
    for (const k in n) for (const co of Object.keys(COATS)) for (const tm of ['light', 'dark']) for (let f = 0; f < n[k]; f++) { const g0 = JSON.stringify(frame(k, f, tm, co, 'none'));
      if (!JSON.parse(g0).some(r => r.some(Boolean))) out.push('ว่าง ' + [k, co, tm, f]);
      for (const acc of ['scarf', 'bow']) if (JSON.stringify(frame(k, f, tm, co, acc)) === g0) out.push('ไม่เห็น' + acc + ' ' + [k, co, tm, f]) }
    // ยืดตัวเริ่มและจบที่ท่ายืนหันข้าง (ภาพต้องเท่ากันเป๊ะ ไม่กระตุกตอนสลับท่า) และลายไม่สลับข้างเมื่อหันซ้าย (เคยพลาดในร่างแรก: สามสีหันซ้ายกลายเป็นแต้มดำ)
    for (const co of ['calico', 'cream', 'tuxedo']) for (const d of ['R', 'L']) if (JSON.stringify(frame('stretch' + d, 0, 'light', co, 'bow')) !== JSON.stringify(frame('stand' + d, 2, 'light', co, 'bow'))) out.push('ยืดตัวเฟรมแรกไม่ตรงท่ายืน ' + co + d);
    return out });
  assert.deepStrictEqual(bad, []);
  // ตื่นนอน 200 รอบ: หาวราวครึ่งหนึ่ง ยืดตัวราว 60% ยืดตัวต้องหันข้างก่อน (turnOut) และจบด้วยเดิน/วิ่ง/หันกลับมานั่ง ไม่ออกนอกขอบ
  const wk = await p.evaluate(() => { const { step, cat, setPart, XMIN, XMAX } = PixelCat._t; setPart('day'); const r = { yawn: 0, stretch: 0, out: 0, badIn: [], badOut: [] };
    for (let i = 0; i < 200; i++) { Object.assign(cat, { mode: 'wake', t: 0, dur: 10, x: 30 + (i % 5) * 20, then: null, after: null, pend: null, str: 0, wk: 0, tol: 0, cool: 0, lv: 0 }); const seen = [];
      for (let k = 0; k < 400; k++) { step(50); if (seen[seen.length - 1] !== cat.mode) seen.push(cat.mode); if (cat.x < XMIN || cat.x > XMAX) r.out++ }
      if (seen.includes('yawn')) r.yawn++; const j = seen.indexOf('stretch'); if (j >= 0) { r.stretch++; if (seen[j - 1] !== 'turnOut') r.badIn.push(seen.join(' ')); if (!['walk', 'run', 'turnIn', 'hind'].includes(seen[j + 1])) r.badOut.push(seen.join(' ')) } }
    setPart(null); Object.assign(cat, { mode: 'sit', t: 0, dur: 1e9, x: 52, then: null, str: 0 }); return r });
  assert.strictEqual(wk.out, 0); assert.deepStrictEqual([wk.badIn, wk.badOut], [[], []], 'ลำดับยืดตัวผิด');
  assert(wk.yawn > 60 && wk.yawn < 140, 'ตื่นแล้วหาวราวครึ่งหนึ่ง ' + JSON.stringify(wk)); assert(wk.stretch > 85 && wk.stretch < 155, 'ตื่นแล้วยืดตัวราว 60% ' + JSON.stringify(wk));
  // หายไปนาน 4 ชม.ขึ้นไป แมวหลับอยู่: ตื่น → ยืดตัว → เดินหางตั้งมาทัก (Eriksson 2017 แมวยืดตัวมากขึ้นตอนเจ้าของกลับมาหลังหายไปนาน)
  const gs = await p.evaluate(() => { const { step, cat } = PixelCat._t; Object.assign(cat, { mode: 'curl', x: 12, t: 0, dur: 1e9, then: null, str: 0 }); PixelCat.greet(6 * 3600e3); const seen = [];
    for (let i = 0; i < 400 && cat.mode !== 'walk'; i++) { step(50); if (seen[seen.length - 1] !== cat.mode) seen.push(cat.mode) } return [seen.join(' '), cat.then] });
  assert(/^wake turnOut stretch (hind )?walk$/.test(gs[0]) && gs[1] === 'greet', 'ตื่นแล้วยืดตัว (บางทียืดขาหลังต่อ) แล้วเดินมาทัก ' + gs);
  // ถึงเบาะในห้อง: นวด ふみふみ ราว 30% (ร่าง 1) → หมอบ → ขด · ที่อื่นไม่มีเบาะจึงไม่นวด
  const kn = await p.evaluate(() => { const { step, cat } = PixelCat._t; let n = 0, chain = true, say = '';
    for (let i = 0; i < 300; i++) { Object.assign(cat, { mode: 'turnIn', t: 0, dur: 10, x: 12, then: 'sleep', pend: null }); if (!n) document.querySelector('.scn.px .scb').classList.remove('on'); step(50); // ฟองนวดขึ้นเมื่อไม่ได้พูดอยู่
      if (cat.mode === 'knead') { n++; if (!say) say = document.querySelector('.scn.px .scb').textContent; step(4000); if (cat.mode !== 'loaf') chain = false } else if (cat.mode !== 'loaf') chain = false }
    Object.assign(cat, { mode: 'sit', t: 0, dur: 1e9, x: 52, then: null }); return { n, chain, say } });
  assert(kn.n > 45 && kn.n < 140, 'นวดก่อนนอนราว 30% ' + JSON.stringify(kn));
  // ง่วงเคลิ้ม = นั่งสัปหงก (v86 แทนท่าหมอบ): ช่วงหมอบก่อนนอน งีบ และตอนตื่น วาดด้วยท่า doze
  const dz = []; for (const m of ['loaf', 'nap', 'wake']) { await p.evaluate(m => Object.assign(PixelCat._t.cat, { mode: m, t: 0, dur: 1e9, after: null }), m); await p.waitForTimeout(80); dz.push(await p.evaluate(() => PixelCat._t.cat.k)) }
  await p.evaluate(() => Object.assign(PixelCat._t.cat, { mode: 'sit', t: 0, dur: 1e9 })); assert.deepStrictEqual(dz, ['doze', 'doze', 'doze'], 'ง่วง/งีบ/ตื่นต้องใช้ท่านั่งสัปหงก');
  // ช่วงปรับตัว: วันแรกระวังตัวเต็มที่ ลดลงวันละหนึ่งในสาม วันที่ 4 ปกติ · อยู่บนจอนานขึ้นก็ผ่อนคลาย · ห้อง/สวนไม่มีช่วงปรับตัว
  const wy = await p.evaluate(() => { const { setFam, wary } = PixelCat._t, r = []; M.place = { at: 'cafe', got: PLACES.map(q => q.id), fam: {} }; render();
    for (const [n, ms] of [[1, 0], [2, 0], [4, 0], [1, 6e5]]) { setFam(n, ms); r.push(+wary().toFixed(2)) } M.place = { at: 'garden', got: PLACES.map(q => q.id), fam: {} }; render(); setFam(1); r.push(wary()); return r });
  assert.deepStrictEqual(wy, [1, 0.67, 0, 0.3, 0]);
  // น้ำหนักตามสถานที่ (จำลองกลางวัน/เช้าเย็นที่ละ 1 ชม.): คาเฟ่/สถานีไม่วิ่งดีด สวนเดินไกลกว่าห้อง · ช่วงปรับตัวในคาเฟ่ แอบหลังของมากขึ้น เลียขนน้อยลง
  // ใช้ตัวสุ่มแบบกำหนด seed (mulberry32) ในช่วงจำลองนี้ ผลจึงเหมือนเดิมทุกรอบ ไม่สุ่มตก (จำลอง 1 ชม. แบบสุ่มจริง สวน/ห้องแกว่ง 0.9–1.4 เท่า) · seed 1–20: ครั้งที่ออกเดิน สวน/ห้อง 1.09–1.6 สถานี/ห้อง 0.57–0.9 เกณฑ์จึงตั้งที่ 1.05 และ 0.95 (ทุก seed ผ่าน)
  // นาฬิกาของฉากตรึงไว้ (setNow/setTod) ไม่ให้นก รถไฟ ผีเสื้อ แดด ตามเวลาจริงของเครื่องมาทำให้ผลจำลองเปลี่ยนไปตามเวลาที่รันชุดทดสอบ
  const pw = await p.evaluate(seed => { const { step, cat, setPart, setFam, setTrait, XMAX, setNow, setTod, setSeason } = PixelCat._t, out = {}, R0 = Math.random; let a = seed >>> 0; setNow(0); setTod('dawn'); setSeason('summer'); // ปี 1970 = มกราคม (หน้าหนาว) ตรึงฤดูให้ผลเหมือนก่อนมีฤดู
    Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296 }; setTrait(-1); setPart('tw');
    for (const [id, fam] of [['room', 99], ['garden', 99], ['cafe', 99], ['station', 99], ['cafe', 1]]) { M.place = { at: id, got: PLACES.map(q => q.id), fam: {} }; render(); const o = out[id + fam] = { zoom: 0, walk: 0, hide: 0, groom: 0 }; let last = '';
      Object.assign(cat, { mode: 'sit', t: 0, dur: 100, x: 52, then: null, tol: 0, cool: 0, pend: null, str: 0 });
      for (let k = 0; k < 72000; k++) { setFam(fam, 0); step(50); if (cat.mode !== last) { if (cat.mode === 'run' && last !== 'skid') o.zoom++; if (cat.mode === 'groom') o.groom++; if (cat.mode === 'turnOut' && cat.then === 'sit' && cat.target !== Math.round(cat.x)) o.walk++; last = cat.mode } if (cat.mode === 'sit' && cat.x >= XMAX - 6) o.hide += 50 } }
    Math.random = R0; setPart(null); setNow(null); setTod(null); setSeason(null); setTrait(M.pet.trait); M.place = { at: 'room', got: [] }; render(); Object.assign(cat, { mode: 'sit', t: 0, dur: 1e9, x: 52, then: null }); return out }, +(process.env.KN_SEED || 7));
  const PW = JSON.stringify(pw);
  assert.strictEqual(pw.cafe99.zoom + pw.station99.zoom + pw.cafe1.zoom, 0, 'คาเฟ่/สถานีต้องไม่วิ่งดีด ' + PW); assert(pw.room99.zoom > 0, PW);
  assert(pw.garden99.walk > pw.room99.walk * 1.05, 'สวนต้องออกเดินบ่อยกว่าห้อง ' + PW); assert(pw.station99.walk < pw.room99.walk * .95, 'สถานีต้องออกเดินน้อยกว่าห้อง ' + PW);
  assert(pw.cafe1.hide > pw.cafe99.hide * 1.5, 'วันแรกในคาเฟ่ต้องแอบหลังของบ่อยกว่า ' + PW); assert(pw.cafe1.groom < pw.cafe99.groom, 'วันแรกในคาเฟ่ต้องเลียขนน้อยกว่า ' + PW);
  // นับวันที่อยู่ในแต่ละที่ (M.place.fam): ผู้ใช้เดิมที่อยู่คาเฟ่ก่อนอัปเดตถือว่าคุ้นแล้ว · ไปที่ใหม่เริ่มวันที่ 1 · วันเดียวกันไม่นับซ้ำ · วันถัดไปนับเพิ่ม · อยู่บ้านไม่เขียนลง M
  const fm = await p.evaluate(() => { const r = []; M.place = { at: 'cafe', got: ['cafe'] }; r.push(plVisit());
    M.place = { at: 'room', got: [] }; r.push(plVisit(), 'fam' in M.place);
    M.place = { at: 'station', got: ['station'], fam: {} }; r.push(plVisit(), plVisit()); M.place.fam.station[1] = '2000-01-01'; r.push(plVisit()); return r });
  assert.deepStrictEqual(fm, [4, 99, false, 1, 1, 2]);
  assert.deepStrictEqual(p.errors, []);
});

test('แมวพิกเซล: ท่าที่ใช้ของในฉาก · มองนก สะดุ้งรถไฟ ซุ่มผีเสื้อ นอนอาบแดด', async (b, base) => {
  const p = await fresh(b, base);
  await p.waitForTimeout(200);
  // ท่าใหม่ (v97) วาดได้ทุกลายขน × โหมด เห็นผ้าพันคอ/โบว์ทุกเฟรม · หันซ้ายไม่ใช่ภาพเดียวกับหันขวา
  const bad = await p.evaluate(() => { const { frame, COATS, DUR } = PixelCat._t, out = [];
    for (const k of ['birdwatch', 'startle', 'bask', 'crouchR', 'crouchL', 'pounceR', 'pounceL', 'pinR', 'pinL']) for (const co of Object.keys(COATS)) for (const tm of ['light', 'dark']) DUR[k].forEach((_, f) => {
      const g0 = JSON.stringify(frame(k, f, tm, co, 'none')); if (!JSON.parse(g0).some(r => r.some(Boolean))) out.push('ว่าง ' + [k, co, tm, f]);
      for (const acc of ['scarf', 'bow']) if (JSON.stringify(frame(k, f, tm, co, acc)) === g0) out.push('ไม่เห็น' + acc + ' ' + [k, co, tm, f]) });
    for (const k of ['crouch', 'pounce', 'pin']) if (JSON.stringify(frame(k + 'R', 0, 'light', 'cream', 'none')) === JSON.stringify(frame(k + 'L', 0, 'light', 'cream', 'none'))) out.push('หันซ้ายเหมือนหันขวา ' + k);
    return out });
  assert.deepStrictEqual(bad, []);
  // ตัวช่วย: ตรึงนาฬิกาของฉาก ตั้งสถานที่ แมวนั่งว่างที่ x แล้วเดินเวลาทีละ 50 ms เก็บลำดับโหมด · Math.random คงที่ให้ผลแน่นอน
  // v109: นาฬิกาฉากในข้อนี้อยู่ปี 1970 (เดือนมกราคม = หน้าหนาว ไม่มีผีเสื้อ) จึงตรึงฤดูเป็นหน้าร้อนทั้งข้อ (ทุกอย่างในฉากมีครบ) · ข้อ "ฉากตามฤดู" ตรวจผลของฤดูแยก
  await p.evaluate(() => PixelCat._t.setSeason('summer'));
  const run = (o) => p.evaluate(o => { const T = PixelCat._t, { step, cat } = T, R0 = Math.random; Math.random = () => o.rnd;
    try { T.setTod(o.tod); T.setNow(o.ms); M.place = { at: o.at, got: PLACES.map(q => q.id), fam: {} }; render(); T.setFam(o.fam || 99, 0); // render() ติดตั้งแมวใหม่และนับวันที่อยู่ที่นั้น จึงตั้งช่วงปรับตัวทีหลัง
      document.querySelector('.scn.px .scb').classList.remove('on'); Object.assign(cat, { mode: 'sit', t: 0, dur: 1e9, x: o.x, dir: 1, then: null, after: null, pend: null, str: 0, wk: 0, hunt: 0, tol: 0, cool: 0, lv: 0, pose: null });
      if (o.call) T[o.call](...(o.args || []));
      const seen = [], ks = []; let out = 0, x0 = null, x1 = null;
      for (let i = 0; i < (o.n || 400); i++) { step(50); if (seen[seen.length - 1] !== cat.mode) seen.push(cat.mode); const k = cat.mode === 'pose' ? cat.pose : cat.mode; if (ks[ks.length - 1] !== k) ks.push(k);
        if (cat.mode === 'pounce' && x0 == null) x0 = cat.x; if (cat.mode === 'pin' && x1 == null) x1 = cat.x; if (cat.x < T.XMIN || cat.x > T.XMAX) out++; if (o.until && ks.includes(o.until)) break }
      return { seen: seen.join(' '), ks: ks.join(' '), x: Math.round(cat.x), out, jump: x0 == null || x1 == null ? null : Math.round(x1 - x0), say: document.querySelector('.scn.px .scb').textContent, w: T.sceneW() }
    } finally { Math.random = R0 } }, o);
  const B = 170000, TR = 120000;
  // ห้อง: นกมาเกาะหน้าต่าง → แมวที่ว่างเดินไปใต้หน้าต่าง (x 72–80) แล้วมองนก ปากสั่น「カカカッ」 · กลางคืนไม่มีนก
  const bw = await run({ at: 'room', tod: 'day', ms: B * 3 + 1000, x: 20, rnd: .5, until: 'birdwatch' });
  assert(bw.ks.endsWith('birdwatch') && bw.x >= 72 && bw.x <= 80 && bw.out === 0, 'มองนก ' + JSON.stringify(bw)); assert(bw.say.includes('カカカ'), bw.say);
  const bn = await run({ at: 'room', tod: 'night', ms: B * 4 + 1000, x: 20, rnd: .5, n: 60 });
  assert.strictEqual(bn.seen, 'sit', 'กลางคืนไม่มีนก ' + bn.seen);
  // หลับลึก (ขดนอน) ไม่สนใจนก
  const bs = await p.evaluate(B => { const T = PixelCat._t; T.setNow(B * 5 + 1000); Object.assign(T.cat, { mode: 'curl', t: 0, dur: 1e9 }); for (let i = 0; i < 40; i++) T.step(50); return T.cat.mode }, B);
  assert.strictEqual(bs, 'curl');
  // สถานี: รถไฟเข้าจอ · วันแรก (ระวังตัว) สะดุ้ง「ビクッ！」 · ชินแล้วส่วนใหญ่แค่หันมอง
  const tw = await run({ at: 'station', tod: 'day', ms: TR * 3 + 200, x: 50, fam: 1, rnd: .5, n: 6 });
  assert(tw.ks.includes('startle') && tw.say.includes('ビクッ'), 'วันแรกต้องสะดุ้ง ' + JSON.stringify(tw));
  const tc = await run({ at: 'station', tod: 'day', ms: TR * 4 + 200, x: 50, fam: 99, rnd: .5, n: 6 });
  assert(tc.ks.includes('curious') && !tc.ks.includes('startle'), 'ชินแล้วแค่หันมอง ' + JSON.stringify(tc));
  // สวน: ผีเสื้ออยู่ในจอกลางวัน = มีตัวเลือกซุ่ม · ซุ่ม → หมอบ → กระโจนไปข้างหน้า 12–20 px → ตะปบ → หันกลับมามองตาม ไม่ออกนอกขอบ
  const bm = await p.evaluate(() => { const T = PixelCat._t; for (let m = 0; m < 9e5; m += 50) { const b = T.bflyAt({ ms: m, P: true, td: 'day' }); if (b.x > 90 && b.x < 120) return m } return 0 });
  const hu = await run({ at: 'garden', tod: 'day', ms: bm, x: 10, rnd: .5, call: 'hunt', until: 'curious' });
  assert(/crouch pounce pin turnIn pose/.test(hu.seen) && hu.out === 0, 'ลำดับซุ่ม ' + JSON.stringify(hu)); assert(hu.jump >= 12 && hu.jump <= 20, 'กระโจนไปข้างหน้า ' + hu.jump);
  assert(hu.w.hunt > 0, 'สวนมีผีเสื้อต้องมีตัวเลือกซุ่ม');
  // ทุกจุดเริ่มในสวน: ตอนหมอบต้องหันเข้าหาผีเสื้อเสมอ (เคยพลาด: แมวอยู่ใกล้เกินแล้วหมอบหันหลังให้ผีเสื้อ)
  const face = await p.evaluate(bm => { const T = PixelCat._t, c = T.cat, bad = []; T.setNow(bm);
    for (let x = T.XMIN; x <= T.XMAX; x += 4) { Object.assign(c, { mode: 'sit', t: 0, dur: 1e9, x, dir: 1, then: null, hunt: 0, str: 0, pend: null }); T.hunt();
      for (let i = 0; i < 400 && c.mode !== 'crouch'; i++) T.step(50); const b = T.bflyAt({ ms: bm, P: true, td: 'day' }); if (c.mode !== 'crouch' || (b.x > c.x + 24 ? 1 : -1) !== c.dir) bad.push([x, c.mode, c.dir, Math.round(c.x), b.x]) }
    return bad }, bm);
  assert.deepStrictEqual(face, [], 'หมอบต้องหันเข้าหาผีเสื้อ'); const hn = await run({ at: 'garden', tod: 'night', ms: bm, x: 10, rnd: .5, n: 1 }); assert(!('hunt' in hn.w), 'กลางคืนไม่มีผีเสื้อ');
  // ห้อง: กลางวันมีตัวเลือกอาบแดด กลางคืนไม่มี · เดินไปนอนกลางแดด (baskX) ท่านอนตะแคงไม่มีหัวใจ · ครบเวลาแล้วตื่น (หาว/ยืดตัว/นั่ง)
  const bk = await run({ at: 'room', tod: 'day', ms: 0, x: 10, rnd: .5, call: 'goTo', args: [80, 'bask'], until: 'bask' });
  assert(bk.ks.endsWith('bask') && Math.abs(bk.x - 80) <= 1 && bk.w.bask > 0, 'อาบแดด ' + JSON.stringify(bk));
  const bkn = await run({ at: 'room', tod: 'night', ms: 0, x: 10, rnd: .5, n: 1 }); assert(!('bask' in bkn.w), 'กลางคืนไม่อาบแดด');
  await p.evaluate(() => Object.assign(PixelCat._t.cat, { mode: 'bask', t: 0, dur: 1e9, x: 80 })); await p.waitForTimeout(150); // ท่าของเฟรมถูกเลือกตอนวาด (paint) จึงรอให้วาดก่อน
  const k = await p.evaluate(() => { const T = PixelCat._t, a = T.cat.k; Object.assign(T.cat, { t: 0, dur: 100 }); T.step(150); return [a, T.cat.mode] });
  assert.strictEqual(k[0], 'bask'); assert(['yawn', 'turnOut', 'groom', 'sit', 'stretch'].includes(k[1]), 'ตื่นจากอาบแดด ' + k[1]);
  const heart = await p.evaluate(() => JSON.stringify(PixelCat._t.frame('bask', 1, 'light', 'cream', 'none')).includes('#ef7d92')); assert(!heart, 'นอนอาบแดดไม่มีหัวใจลอย');
  await p.evaluate(() => { const T = PixelCat._t; T.setNow(null); T.setTod(null); T.setSeason(null); T.setFam(99, 0); M.place = { at: 'room', got: [] }; render(); Object.assign(T.cat, { mode: 'sit', t: 0, dur: 1e9, x: 52, then: null }) });
  assert.deepStrictEqual(p.errors, []);
});

test('แมวพิกเซล: ยืดขาหลังต่อจากยืดตัว · เดินไปดมของในฉาก · ดมเบาะแล้วหมุนตัวก่อนนอน (v117)', async (b, base) => {
  const p = await fresh(b, base);
  await p.waitForTimeout(200);
  // ท่าใหม่วาดได้ทุกลายขน ทั้งสองโหมด ผ้าพันคอ/โบว์เห็นทุกเฟรม · ยืดขาหลังเริ่มใกล้ท่ายืน (ไม่กระตุก) · หันซ้ายไม่ใช่ภาพกลับด้านของหันขวา (ลายไม่สลับข้าง)
  const bad = await p.evaluate(() => { const { frame, COATS, DUR } = PixelCat._t, out = [];
    for (const k of ['hindR', 'hindL', 'sniffR', 'sniffL']) for (const co of Object.keys(COATS)) for (const tm of ['light', 'dark']) for (let f = 0; f < DUR[k].length; f++) { const g0 = JSON.stringify(frame(k, f, tm, co, 'none'));
      if (!JSON.parse(g0).some(r => r.some(Boolean))) out.push('ว่าง ' + [k, co, tm, f]);
      for (const acc of ['scarf', 'bow']) if (JSON.stringify(frame(k, f, tm, co, acc)) === g0) out.push('ไม่เห็น' + acc + ' ' + [k, co, tm, f]) }
    const g = frame('sniffR', 0, 'light', 'calico', 'none'), m = frame('sniffL', 0, 'light', 'calico', 'none');
    if (JSON.stringify(g.map(r => [...r].reverse())) === JSON.stringify(m)) out.push('สามสีหันซ้ายลายสลับข้าง');
    // ยืดขาหลังสุด: มีพิกเซลของขาเหยียดออกไปด้านหลังตัว (ซ้ายของท่ายืน) ใต้ระดับหาง
    const px = F => { let n = 0; for (let y = 34; y < 44; y++) for (let x = 0; x < 9; x++) if (F[y][x]) n++; return n }, st = frame('standR', 2, 'light', 'cream', 'none');
    if (!(px(frame('hindR', 2, 'light', 'cream', 'none')) > px(st) + 6)) out.push('ไม่เห็นขาหลังเหยียด ' + [px(frame('hindR', 2, 'light', 'cream', 'none')), px(st)]);
    // ดม: หัวต่ำกว่าท่ายืน (ขอบบนของภาพต่ำลง)
    const top = F => F.findIndex(r => r.some(Boolean)); if (!(top(frame('sniffR', 0, 'light', 'cream', 'none')) > top(st) + 5)) out.push('ดมแล้วหัวไม่ต่ำลง');
    return out });
  assert.deepStrictEqual(bad, []);
  // ยืดตัวจบแล้วยืดขาหลังต่อราวครึ่งหนึ่ง แล้วเดิน/วิ่ง/หันกลับมานั่ง
  const hd = await p.evaluate(() => { const { step, cat } = PixelCat._t; let n = 0; const after = new Set();
    for (let i = 0; i < 200; i++) { Object.assign(cat, { mode: 'stretch', t: 0, dur: 10, x: 50, target: 50, then: 'sit', run: false, dir: 1 }); step(50);
      if (cat.mode === 'hind') { n++; step(4000); after.add(cat.mode) } }
    Object.assign(cat, { mode: 'sit', t: 0, dur: 1e9, x: 52, then: null }); return { n, after: [...after] } });
  assert(hd.n > 65 && hd.n < 135, 'ยืดขาหลังราวครึ่งหนึ่ง ' + JSON.stringify(hd)); assert(hd.after.every(m => ['turnIn', 'walk', 'run', 'sit', 'pose', 'groom'].includes(m)), 'หลังยืดขาหลัง ' + hd.after);
  // เดินไปดมของ: ทุกสถานที่ จมูกแตะของใน poi (ห่างไม่เกิน 2 px) และหันหน้าเข้าหาของ · ไม่ออกนอกขอบ · ดมแล้วกลับมานั่ง (บางทีเอียงคอสงสัย)
  const sn = await p.evaluate(() => { const T = PixelCat._t, { step, cat, XMIN, XMAX } = T, cv = document.createElement('canvas'), out = { bad: [], n: 0, out: 0, end: new Set() }, R0 = Math.random; let a = 11;
    Math.random = () => (a = (a * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (const pl of ['room', 'garden', 'cafe', 'station']) { PixelCat.mount(cv, { place: pl, coat: 'cream' }); const P = T.scenes[pl].poi;
      for (let i = 0; i < 25; i++) { Object.assign(cat, { mode: 'sit', t: 0, dur: 1e9, x: XMIN + (i * 37) % (XMAX - XMIN), then: null, str: 0, hunt: 0, sniff: 0, bs: 0 }); T.sniffGo(); let hit = false;
        for (let k = 0; k < 600; k++) { step(50); if (cat.x < XMIN || cat.x > XMAX) out.out++;
          if (cat.mode === 'sniff' && !hit) { hit = true; out.n++; const nose = cat.dir > 0 ? cat.x + 46.5 : cat.x + 1.5; if (!P.some(x => Math.abs(x - nose) <= 2)) out.bad.push(pl + ' จมูก ' + nose) }
          if (hit && cat.mode !== 'sniff' && cat.mode !== 'turnIn') { out.end.add(cat.mode); break } } } }
    Math.random = R0; M.place = { at: 'room', got: [] }; render(); Object.assign(cat, { mode: 'sit', t: 0, dur: 1e9, x: 52, then: null }); return { ...out, end: [...out.end] } });
  assert.deepStrictEqual(sn.bad, []); assert.strictEqual(sn.out, 0); assert(sn.n >= 95, 'ไปดมครบเกือบทุกครั้ง ' + sn.n);
  assert(sn.end.every(m => m === 'sit' || m === 'pose') && sn.end.includes('pose'), 'ดมแล้วนั่ง/สงสัย ' + sn.end);
  // ถึงเบาะ: ดมเบาะราว 40% → หมุนตัว 1–2 รอบ (สลับทิศ) → หันหน้า → นวด/หมอบ → ขด
  const bd = await p.evaluate(() => { const { step, cat } = PixelCat._t; const r = { sniff: 0, circle: 0, bad: [] };
    for (let i = 0; i < 300; i++) { Object.assign(cat, { mode: 'halt', t: 0, dur: 10, x: 12, dir: i % 2 ? 1 : -1, then: 'sleep', bs: 0, pend: null }); const seen = [], dirs = new Set();
      for (let k = 0; k < 200 && !['loaf', 'knead'].includes(cat.mode); k++) { step(50); if (seen[seen.length - 1] !== cat.mode) seen.push(cat.mode); if (cat.mode === 'circle') dirs.add(PixelCat._t.catPose()[0].slice(-1)) }
      const j = seen.join(' ');
      if (seen.includes('sniff')) { r.sniff++; if (!/^sniff circle turnIn (knead|loaf)$/.test(j)) r.bad.push(j); if (dirs.size < 2) r.bad.push('หมุนตัวไม่สลับทิศ') } else if (!/^turnIn (knead|loaf)$/.test(j)) r.bad.push(j) }
    Object.assign(cat, { mode: 'sit', t: 0, dur: 1e9, x: 52, then: null, bs: 0 }); return r });
  assert.deepStrictEqual(bd.bad, []); assert(bd.sniff > 85 && bd.sniff < 160, 'ดมเบาะราว 40% ' + bd.sniff);
  // ที่ใหม่ดมบ่อยกว่าที่คุ้น · ขี้สงสัยดมบ่อยกว่าขี้อาย (จำลองการตัดสินใจ 4,000 ครั้ง ตรึงการสุ่ม)
  const nv = await p.evaluate(() => { const T = PixelCat._t, { cat } = T, cv = document.createElement('canvas'), R0 = Math.random; let a = 5;
    const cnt = (pl, fam, tr) => { Math.random = () => (a = (a * 1103515245 + 12345) % 2147483648) / 2147483648; PixelCat.mount(cv, { place: pl, coat: 'cream' }); T.setFam(fam, 9e5); T.setTrait(tr); T.setPart('day'); let n = 0;
      for (let i = 0; i < 4000; i++) { Object.assign(cat, { mode: 'sit', t: 0, dur: 0, x: 50, then: null, str: 0 }); T.decide(); if (cat.then === 'sniff' || cat.then === 'sniffed') n++ } return n };
    const o = { gNew: cnt('garden', 1, 0), gOld: cnt('garden', 99, 0), cur: cnt('room', 99, 6), shy: cnt('room', 99, 2), nov: [1, 2, 3, 4].map(f => (PixelCat.mount(cv, { place: 'garden', coat: 'cream' }), T.setFam(f, 0), T.novel())) };
    Math.random = R0; T.setPart(null); T.setFam(99, 0); T.setTrait(M.pet.trait); M.place = { at: 'room', got: [] }; render(); Object.assign(cat, { mode: 'sit', t: 0, dur: 1e9, x: 52, then: null }); return o });
  assert(nv.gNew > nv.gOld * 1.8, 'ที่ใหม่ดมบ่อยกว่า ' + JSON.stringify(nv)); assert(nv.cur > nv.shy * 2.5, 'ขี้สงสัยดมบ่อยกว่าขี้อาย ' + JSON.stringify(nv));
  assert.deepStrictEqual(nv.nov.map(x => Math.round(x * 100) / 100), [1, .67, .33, 0], 'ความใหม่ลดลงทุกวัน');
  assert.deepStrictEqual(p.errors, []);
});

test('ฉากตามฤดู: ซากุระ เมเปิลเขียว เมเปิลแดง กิ่งโล่งหิมะ · ของตกตามฤดู · หิมะตกบางวัน · หน้าต่างคาเฟ่มีเมฆ', async (b, base) => {
  const p = await fresh(b, base);
  await p.waitForTimeout(200);
  const r = await p.evaluate(() => { const T = PixelCat._t, cv = document.createElement('canvas'), at = s => new Date(s).getTime(), out = {};
    // ฤดูตามญี่ปุ่นจริง (เจ้าของเลือก 2026-11-20): มี.ค.–พ.ค. ใบไม้ผลิ · มิ.ย.–ส.ค. ร้อน · ก.ย.–พ.ย. ใบไม้ร่วง · ธ.ค.–ก.พ. หนาว
    out.map = ['2026-03-01', '2026-05-31', '2026-06-01', '2026-08-31', '2026-09-01', '2026-11-30', '2026-12-01', '2027-02-28'].map(d => T.season(at(d + 'T12:00:00')));
    const img = (pl, se, tm = 'light', fg) => { T.setSeason(se); PixelCat.mount(cv, { place: pl, coat: 'cream' }); return (fg ? T.sceneFg(tm) : T.sceneBg(tm)).toDataURL() };
    T.setNow(at('2026-11-20T10:00:00'));
    for (const pl of ['room', 'garden', 'cafe', 'station']) { const I = ['spring', 'summer', 'autumn', 'winter'].map(se => img(pl, se)); out[pl] = I; out[pl + 'N'] = img(pl, 'winter', 'dark') !== img(pl, 'summer', 'dark') }
    out.gfg = img('garden', 'winter', 'light', 1) !== img('garden', 'summer', 'light', 1);
    // ผีเสื้อไม่มีหน้าหนาว (จึงไม่มีซุ่ม) · มีในฤดูอื่นตอนกลางวัน
    const A = (se, td = 'day') => ({ ms: { spring: at('2026-04-10T10:00:00'), summer: at('2026-07-10T10:00:00'), autumn: at('2026-10-10T10:00:00'), winter: at('2027-01-10T10:00:00') }[se], P: true, td, sk: td === 'night' ? 'dark' : 'light', t: 0 });
    T.setSeason(null); out.bfly = ['spring', 'summer', 'autumn', 'winter'].map(se => !!T.bflyAt(A(se)));
    // ของตก: นับพิกเซลที่วาด (ใบไม้ผลิ ใบไม้ร่วง หนาว มี · ร้อนไม่มี · ปิดแอนิเมชันไม่มี)
    const n = (se, P = true, ms) => { const c = document.createElement('canvas'); c.width = 160; c.height = 90; const x = c.getContext('2d'); T.fall(x, { ...A(se), P, ...(ms ? { ms } : {}) }, se, [0, 0, 160, 90], 20); const d = x.getImageData(0, 0, 160, 90).data; let k = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) k++; return k };
    T.setSnow(true); out.fall = ['spring', 'summer', 'autumn', 'winter'].map(se => n(se)); out.fallOff = n('winter', false); T.setSnow(null);
    // v114 หิมะตกเฉพาะบางวัน: นับวันที่ตกตลอดหน้าหนาว · วันไม่ตกไม่มีหิมะตก (แต่ใบไม้ผลิ/ใบไม้ร่วงยังตกทุกวัน) · วันเดียวกันได้ผลเดิมทุกเวลา
    const days = []; for (let d = at('2026-12-01T12:00:00'); d < at('2027-03-01T00:00:00'); d += 864e5) days.push(d);
    const sd = days.filter(d => T.snowDay(d)); out.snowN = [sd.length, days.length];
    out.noSnow = days.filter(d => !T.snowDay(d)).slice(0, 3).map(d => n('winter', true, d)); out.yesSnow = sd.slice(0, 3).map(d => n('winter', true, d));
    out.sameDay = days.every(d => T.snowDay(d) === T.snowDay(d - 5 * 36e5) && T.snowDay(d) === T.snowDay(d + 11 * 36e5));
    out.notWinter = [at('2026-07-10T10:00:00'), at('2026-10-10T10:00:00')].map(d => T.snowDay(d));
    // ห้องในวันไม่ตก: ฉากไม่ต้องวาดใหม่ทุก 120 ms
    T.setSeason('winter'); M.place = { at: 'room', got: [] }; PixelCat.mount(cv, { place: 'room', coat: 'cream' }); const tk = d => T.scenes.room.tick({ ms: d, d: new Date(d), P: true, t: 0, td: 'day', sk: 'light' });
    const nd = days.find(d => !T.snowDay(d)), yd = sd[0]; out.tickStill = tk(nd) === tk(nd + 240); out.tickMove = tk(yd) !== tk(yd + 240); T.setSeason(null);
    // หน้าต่างคาเฟ่กลางวันมีเมฆ (v109 แก้บั๊ก v104: คอมเมนต์ทับ else ทำให้เมฆหาย)
    T.setSeason('autumn'); PixelCat.mount(cv, { place: 'cafe', coat: 'cream' }); const k = T.palOf('cafe', 'light'), d = T.sceneBg('light').getContext('2d').getImageData(5, 8, 36, 18).data, h = parseInt(k.cloud.slice(1), 16);
    out.cloud = 0; for (let i = 0; i < d.length; i += 4) if (((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]) === h) out.cloud++;
    T.setSeason(null); T.setNow(null); M.place = { at: 'room', got: [] }; render(); return out });
  assert.deepStrictEqual(r.map, ['spring', 'spring', 'summer', 'summer', 'autumn', 'autumn', 'winter', 'winter'], 'แบ่งฤดู');
  for (const pl of ['room', 'garden', 'cafe', 'station']) { assert.notStrictEqual(r[pl][1], r[pl][3], 'หนาวต่างจากร้อน ' + pl); assert(r[pl + 'N'], 'กลางคืนหนาวต่างจากร้อน ' + pl) }
  assert.strictEqual(new Set(r.garden).size, 4, 'สวนต่างกันทั้ง 4 ฤดู'); assert.notStrictEqual(r.room[0], r.room[1], 'ห้อง: ใบไม้ผลิมีต้นซากุระบนเนิน');
  assert(r.gfg, 'พุ่มอาซาเลียตามฤดู');
  assert.deepStrictEqual(r.bfly, [true, true, true, false], 'ผีเสื้อ ' + r.bfly);
  assert(r.fall[0] > 0 && r.fall[1] === 0 && r.fall[2] > 0 && r.fall[3] > 0 && r.fallOff === 0, 'ของตก ' + JSON.stringify([r.fall, r.fallOff]));
  assert(r.cloud > 10, 'หน้าต่างคาเฟ่มีเมฆ ' + r.cloud);
  assert(r.snowN[0] > r.snowN[1] * .25 && r.snowN[0] < r.snowN[1] * .65, 'หิมะตกบางวัน ' + r.snowN);
  assert(r.noSnow.length === 3 && r.noSnow.every(x => x === 0) && r.yesSnow.every(x => x > 0), 'วันไม่ตกไม่มีหิมะ ' + JSON.stringify([r.noSnow, r.yesSnow]));
  assert(r.sameDay, 'ทั้งวันตกหรือไม่ตกเหมือนกัน'); assert.deepStrictEqual(r.notWinter, [false, false], 'นอกหน้าหนาวไม่มีวันหิมะ');
  assert(r.tickStill && r.tickMove, 'วันไม่ตกไม่วาดใหม่ทุก 120 ms ' + [r.tickStill, r.tickMove]);
  assert.deepStrictEqual(p.errors, []);
});

test('ฉากกลางคืน: พระจันทร์เฟสและเวลาขึ้นตกตามโลกจริง · ทิศเสี้ยวตามเขตเวลา', async (b, base) => {
  const p = await fresh(b, base);
  await p.waitForTimeout(200);
  // เฟสเทียบวันจริง (เวลาท้องถิ่นของเครื่อง เหมือนในแอป): เต็มดวง 24 พ.ย. 2026 · ดับ 9 ธ.ค. 2026 · ครึ่งดวงข้างขึ้น 17 ธ.ค. · ครึ่งดวงข้างแรม 1 ธ.ค.
  const ph = await p.evaluate(() => { const { moonAt, moonIdx } = PixelCat._t, at = s => moonAt(new Date(s).getTime());
    return { full: at('2026-11-24T21:00:00'), nw: at('2026-12-09T21:00:00'), q1: at('2026-12-17T21:00:00'), q3: at('2026-12-01T21:00:00'),
      idx: [0, .07, .15, .25, .33, .42, .5, .58, .67, .75, .85, .93, .99].map(moonIdx) } });
  assert(Math.abs(ph.full.p - .5) < .04 && ph.full.lit > .98, 'เต็มดวง ' + JSON.stringify(ph.full));
  assert(ph.nw.p < .04 || ph.nw.p > .96, 'จันทร์ดับ ' + JSON.stringify(ph.nw));
  assert(Math.abs(ph.q1.p - .25) < .05 && Math.abs(ph.q3.p - .75) < .05, 'ครึ่งดวง ' + JSON.stringify([ph.q1.p, ph.q3.p]));
  assert.deepStrictEqual(ph.idx, [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1, 0], 'ลำดับภาพเฟส');
  // ขึ้น-ตก: เต็มดวงอยู่บนฟ้าตอนเที่ยงคืน ไม่อยู่ตอนเที่ยงวัน · ข้างขึ้นครึ่งดวงเห็นหัวค่ำ ตกราวเที่ยงคืน · ข้างแรมครึ่งดวงขึ้นราวเที่ยงคืน
  const up = await p.evaluate(() => { const { moonAt } = PixelCat._t, u = s => moonAt(new Date(s).getTime()).up;
    return [u('2026-11-24T23:30:00'), u('2026-11-24T12:00:00'), u('2026-12-17T20:00:00'), u('2026-12-18T02:30:00'), u('2026-12-01T21:00:00'), u('2026-12-02T04:00:00')] });
  assert.deepStrictEqual(up, [true, false, true, false, false, true], 'ขึ้น-ตก ' + up);
  // v105 ทิศด้านสว่าง (ละติจูดกรุงเทพฯ): เสี้ยวหัวค่ำ/เสี้ยวก่อนรุ่งหงายเป็นเรือ (ด้านสว่างหันลง k 1–3) · ครึ่งดวงข้างขึ้นตอนอยู่กลางฟ้าหัวค่ำ ด้านสว่างหันขวา (ตะวันตก k 7/0/1)
  // ภาพเรือ: เสี้ยวบางหันลง แถวล่างสุดสว่าง แถวบนมืด · แสงจันทร์บนพื้น: เต็มดวงสว่างกว่าเสี้ยว จันทร์ดับ/ยังไม่ขึ้นไม่มีแสง
  const tl = await p.evaluate(() => { const { moonAt, moonBmp, moonGlow } = PixelCat._t, k = s => moonAt(new Date(s).getTime()).k, g = s => moonGlow(new Date(s).getTime());
    return { eve: ['2026-12-12T19:00:00', '2026-12-13T19:30:00', '2026-12-14T20:00:00', '2026-06-20T19:30:00', '2026-03-22T19:30:00'].map(k), morn: ['2026-12-06T05:00:00', '2026-12-07T05:30:00'].map(k), q1: k('2026-12-17T18:30:00'),
      boat: moonBmp(1, 2), full: g('2026-11-24T23:30:00'), cres: g('2026-12-13T19:30:00'), nw: g('2026-12-09T12:00:00'), down: g('2026-11-24T12:00:00') } });
  assert(tl.eve.concat(tl.morn).every(k => k >= 1 && k <= 3), 'เสี้ยวหงายเป็นเรือ ' + JSON.stringify(tl));
  assert([7, 0, 1].includes(tl.q1), 'ครึ่งดวงหัวค่ำ ' + tl.q1);
  assert(tl.boat[6].includes('L') && !tl.boat[0].includes('L') && !tl.boat[1].includes('L'), 'ภาพเรือ ' + tl.boat.join('|'));
  // v115 ละติจูดตามเขตเวลาเครื่อง: ญี่ปุ่น/ไทย/ออสเตรเลียได้ละติจูดของตัวเอง ไม่รู้จัก = 14°N · ยิ่งไกลเส้นศูนย์สูตรเสี้ยวหัวค่ำยิ่งเอียงตะแคง (ลอนดอนฤดูใบไม้ร่วงนอนข้าง k 0)
  // ซีกโลกใต้: ฉากยังขึ้นซ้ายตกขวา จึงเป็นภาพสะท้อนของฟ้าจริง เสี้ยวหัวค่ำยังหันลง (k 1–3) ไม่กลับหัว
  const la = await p.evaluate(() => { const T = PixelCat._t, ev = ['2026-12-13T19:30:00', '2026-06-20T19:30:00', '2026-03-22T19:30:00', '2026-09-15T19:30:00'], o = { def: T.lat() };
    for (const L of [13.75, 51.5, -33.9]) { T.setLat(L); o[L] = ev.map(d => T.moonAt(new Date(d).getTime()).k) } T.setLat(o.def);
    o.map = ['Asia/Tokyo', 'Asia/Bangkok', 'Australia/Sydney', 'Europe/Oslo', 'Etc/UTC', undefined].map(T.latOf); return o });
  assert.deepStrictEqual(la.map, [35.7, 13.75, -33.9, 50, 14, 14], 'ละติจูดตามเขตเวลา');
  // ดวงอาทิตย์ตกทางขวาของฉาก เสี้ยวหัวค่ำจึงหันด้านสว่างไปขวา/ลง (k 0–2) ทั้งสองซีกโลก (ไม่สะท้อนซีกโลกใต้จะได้ k 3 หันซ้าย)
  assert(la['13.75'].every(k => k >= 1 && k <= 2) && la['-33.9'].every(k => k >= 0 && k <= 2), 'เสี้ยวหัวค่ำไทย/ซีกโลกใต้ ' + JSON.stringify(la));
  assert(la['51.5'].every(k => k === 0 || k === 1) && la['51.5'].includes(0) && la['51.5'].join() !== la['13.75'].join(), 'ลอนดอนเสี้ยวตะแคง ' + JSON.stringify(la));
  assert(tl.full && tl.cres && tl.full.al > tl.cres.al * 2 && tl.nw === null && tl.down === null, 'แสงจันทร์บนพื้น ' + JSON.stringify([tl.full, tl.cres, tl.nw, tl.down]));
  // วาดในทุกสถานที่: ฉากกลางคืนตอนพระจันทร์ขึ้นต่างจากตอนจันทร์ดับ · เปลี่ยนเฟสแล้วชั้นภาพแคชใหม่ (ไม่ค้างดวงเก่า) · กลางวันไม่มีพระจันทร์
  const draw = await p.evaluate(() => { const T = PixelCat._t, cv = document.createElement('canvas'), out = {};
    const img = (pl, s) => { T.setNow(new Date(s).getTime()); PixelCat.mount(cv, { place: pl, coat: 'cream' }); return T.sceneBg('dark').toDataURL() };
    const scenes = { room: ['2026-11-24T23:00:00', '2026-12-17T19:30:00'], garden: ['2026-11-25T00:00:00', '2026-12-17T19:30:00'], cafe: ['2026-11-25T00:00:00', '2026-12-14T19:30:00'], station: ['2026-11-25T00:00:00', '2026-12-17T19:30:00'] };
    T.setTod('night');
    for (const [pl, [a, c]] of Object.entries(scenes)) { const none = img(pl, '2026-12-09T23:00:00'); out[pl] = [img(pl, a) !== none, img(pl, c) !== none, img(pl, a) !== img(pl, c)] }
    T.setTod('day'); T.setSeason('autumn'); T.setNow(new Date('2026-11-24T23:00:00').getTime()); PixelCat.mount(cv, { place: 'garden', coat: 'cream' }); out.day = T.sceneBg('light').toDataURL() === (T.setNow(new Date('2026-12-09T23:00:00').getTime()), T.sceneBg('light').toDataURL()); T.setSeason(null); // คนละเดือน คนละฤดู จึงตรึงฤดูไว้
    T.setNow(null); T.setTod(null); M.place = { at: 'room', got: [] }; render(); return out });
  for (const pl of ['room', 'garden', 'cafe', 'station']) assert.deepStrictEqual(draw[pl], [true, true, true], 'พระจันทร์ในฉาก ' + pl);
  assert(draw.day, 'กลางวันไม่มีพระจันทร์');
  assert.deepStrictEqual(p.errors, []);
});

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
  const only = process.argv[2], run = only ? tests.filter(([n]) => n.includes(only)) : tests; // node tests/e2e.js <คำในชื่อข้อ> = รันเฉพาะข้อที่ชื่อมีคำนั้น
  for (const [name, fn] of run) {
    try { await Promise.race([fn(browser, base), new Promise((_, j) => setTimeout(() => j(new Error('หมดเวลา 30 วินาที')), 30000))]); console.log('  ✓', name); }
    catch (e) { fail++; console.log('  ✗', name, '\n     ', (e.stack || e.message || e).split("\n").slice(0, 4).join(" | ")); }
  }
  await browser.close(); server.close();
  console.log(fail ? `\nไม่ผ่าน ${fail}/${run.length}` : `\nผ่านทั้งหมด ${run.length} ข้อ`);
  process.exit(fail ? 1 : 0);
})();
