// e2e: สถานที่ แผนที่เมือง ฉากตามฤดูและกลางคืน · รันผ่าน node tests/e2e.js [คำในชื่อข้อ]
const { assert, fs, path, ROOT, test, fresh, travel, home } = require('./harness');

test('สถานที่: เริ่มที่ห้อง ไปสวน/คาเฟ่ได้ทันที สถานีล็อกจนจำคำหมวดสถานที่ได้แม่น 10 คำ แล้วทบทวนคำหมวดของที่นั้นก่อน', async (b, base) => {
  const p = await fresh(b, base);
  let h = await home(p);
  assert(h.includes('ห้องอ่านหนังสือ'), 'เริ่มที่ห้อง');
  assert.strictEqual(await p.locator('.scgo:has-text("ไปเที่ยว") svg').count(), 1, 'ปุ่มตั๋ว "ไปเที่ยว" มีไอคอนตั๋ว');
  assert.strictEqual(await p.locator('.scn.px[data-place="room"] > canvas#petcv').count(), 1, 'แมวใช้ฉากพิกเซล');
  assert.strictEqual(await p.evaluate(() => JSON.parse(localStorage.getItem('kn_meta')).place), undefined, 'แค่เปิดหน้าแรกต้องไม่เขียนค่าสถานที่ (ไม่ให้ซิงก์ส่งรุ่นใหม่เปล่าๆ)');
  await p.locator('.scgo').click();
  const dlg = await p.locator('.cdl').innerText();
  assert(dlg.includes('สวนญี่ปุ่น') && dlg.includes('คาเฟ่') && dlg.includes('สถานี'), dlg);
  assert.strictEqual(await p.locator('.tmp[data-p="station"].tlk svg').count(), 1, 'ป้ายสถานีมีกุญแจ');
  await p.locator('.tmp[data-p="station"]').click();
  assert((await p.locator('.tmi').innerText()).includes('0/10 คำ'), 'กล่องข้อมูลบอกความคืบหน้าปลดล็อก');
  assert(await p.locator('.tmi .go').isDisabled(), 'สถานียังล็อก ไปไม่ได้');
  await p.locator('.tmp[data-p="garden"]').click();
  assert.strictEqual(await p.locator('.tmi').count(), 1, 'แตะป้ายใหม่ กล่องข้อมูลเปลี่ยนเป็นที่ใหม่ (มีกล่องเดียว)');
  await p.locator('.tmi .go').click(); await p.waitForSelector('.tmd.trip .tmv');
  // เดินทาง: ป้ายที่หมายเด่น แถบความคืบหน้าขยับ แผนที่ยังเปิดอยู่จนกว่าจะถึง · แตะเพื่อข้ามแล้วถึงทันที
  assert.strictEqual(await p.locator('.tmp.dest[data-p="garden"]').count(), 1); assert((await p.locator('.tmv').innerText()).includes('กำลังเดินไปสวนญี่ปุ่น'));
  await p.waitForTimeout(700); assert(parseFloat(await p.locator('.tmv .bar i').evaluate(e => e.style.width)) > 0, 'แถบเดินทางขยับ'); assert.strictEqual(await p.locator('.cov').count(), 1, 'ยังไม่ถึงต้องยังไม่ปิด');
  await p.locator('.tmd h2').click(); await p.waitForSelector('.tmv:has-text("ถึงสวนญี่ปุ่นแล้ว")'); await p.waitForSelector('.cov', { state: 'detached', timeout: 5000 });
  await p.waitForSelector('.toast:has-text("ถึงสวนญี่ปุ่นแล้ว")');
  assert.strictEqual(await p.locator('.scn[data-place="garden"]').count(), 1);
  assert.strictEqual(await p.evaluate(() => JSON.parse(localStorage.getItem('kn_meta')).place.at), 'garden', 'จำที่ที่เลือก');
  // จำคำหมวดสถานที่/ทิศทางได้แม่น 10 คำ → ปลดล็อกสถานีพร้อมข้อความเด้ง
  await p.evaluate(() => { const L = [...W, ...V].filter(x => ['สถานที่', 'ทิศทางและขนาด'].includes(x.c)).slice(0, 10), sw = {}, sv = {};
    L.forEach(x => { (W.includes(x) ? sw : sv)[x.k] = { b: 5, w: 0, d: Date.now() + 864e5 } }); localStorage.setItem('kw1', JSON.stringify(sw)); localStorage.setItem('kv1', JSON.stringify(sv)) });
  await home(p);
  await p.waitForSelector('.toast:has-text("ได้ตั๋วไปสถานีรถไฟแล้ว")');
  assert.deepStrictEqual(await p.evaluate(() => JSON.parse(localStorage.getItem('kn_meta')).place.got), ['station']);
  await p.locator('.scgo').click(); await p.locator('.tmp[data-p="station"]').click(); await travel(p, 'สถานี');
  h = await home(p); assert(h.includes('สถานีรถไฟ') && h.includes('ทบทวนคำหมวดสถานที่'), h.slice(0, 400));
  // อยู่สถานี: ข้อที่ถึงเวลาทบทวนพร้อมกัน หมวดสถานที่ต้องขึ้นก่อน แม้ครบกำหนดทีหลัง
  const first = await p.evaluate(() => { const t = Date.now() - 1000, s = {}; const a = V.find(x => x.c === 'อาหารและของกิน'), b = V.find(x => x.c === 'สถานที่');
    s[a.k] = { b: 1, w: 0, d: t - 50000 }; s[b.k] = { b: 1, w: 0, d: t }; localStorage.setItem('kv1', JSON.stringify(s)); tab = 'learn'; nv('v'); cat = 'ทั้งหมด'; S = load(); return pick1().c });
  assert.strictEqual(first, 'สถานที่');
  await p.evaluate(() => { const st = JSON.parse(localStorage.getItem('kn_meta')); st.place.at = 'room'; localStorage.setItem('kn_meta', JSON.stringify(st)); M = st });
  assert.strictEqual(await p.evaluate(() => pick1().c), 'อาหารและของกิน', 'อยู่ห้อง: ทบทวนตามกำหนดเดิม');
  assert.deepStrictEqual(p.errors, []);
});

test('แผนที่เมือง: ทุกที่มีตำแหน่ง/อาคาร/ฉาก วาดได้ทุกฤดูและเวลา ป้ายอยู่ในแผนที่ แปลงว่างขึ้น "เร็วๆ นี้" เลื่อนไปที่แมว ปิดแล้วหยุดวาด', async (b, base) => {
  const p = await fresh(b, base, { viewport: { width: 390, height: 760 } });
  await home(p);
  const r = await p.evaluate(() => { const out = { bad: [] }, T = TownMap;
    PLACES.forEach(q => { const m = q.map; if (!m || !T.SITE[q.id] || !PixelCat.places.includes(q.id)) out.bad.push(q.id); else [m.at, m.lb, m.cat].forEach(([x, y]) => { if (!(x >= 0 && x < T.W && y >= 0 && y < T.H)) out.bad.push(q.id + ':' + x + ',' + y) }) });
    // วาดได้ทุกฤดู ทุกช่วงเวลา และทุกเทศกาล (ภาพต่างกันตามฤดู/เวลา)
    const shot = (se, td, d) => { const c = document.createElement('canvas'); c.width = T.W; c.height = T.H; document.body.appendChild(c); const m = T.mount(c, { season: () => se, tod: () => td, date: () => new Date(d), here: 'room', locked: ['station'], places: PLACES, cat: { coat: 'cream' } }); m.stop(); m.redraw(); const u = c.toDataURL(); c.remove(); return u };
    const S = ['spring', 'summer', 'autumn', 'winter'].map(se => shot(se, 'day', '2026-10-10T12:00:00')); out.seasons = new Set(S).size;
    out.tods = new Set(['dawn', 'day', 'dusk', 'night'].map(td => shot('autumn', td, '2026-10-10T12:00:00'))).size;
    out.fest = ['2027-01-02', '2026-05-02', '2026-08-10', '2026-10-10'].map(d => T.festOf(new Date(d + 'T12:00:00')));
    ['2027-01-02', '2026-05-02', '2026-08-10'].forEach(d => shot('winter', 'night', d + 'T21:00:00'));
    // ถนนทุกเส้นจบที่ขอบแผนที่หรือแตะเส้นอื่น/ที่หมาย (ไม่จบกลางหญ้า)
    const P = T.paths, all = [P.RIVER, P.RAIL, P.MAIN, P.ONS, P.SHOT, P.WEST, P.HILL, P.SCH, P.RES1, P.RES2, P.RES3, ...P.LANES], edge = ([x, y]) => x <= 1 || x >= T.W - 1 || y <= 1 || y >= T.H - 1;
    const goal = [[29, 97], [90, 225], [146, 42], [68, 158], [52, 161], [62, 124], [126, 91]]; out.dead = []; // ที่หมาย: โทริอิ ประตูโรงเรียน ออนเซ็น ลานหน้าสถานี×2 ทางออกเหนือ ประตูสวน
    Object.entries(P).forEach(([k, v]) => (Array.isArray(v[0][0]) ? v : [v]).forEach((S, j) => { if (k === 'RIVER' || k === 'RAIL') return; [S[0], S[S.length - 1]].forEach(e => { const ok = edge(e) || goal.some(g => Math.hypot(e[0] - g[0], e[1] - g[1]) < 2) || all.some(o => o !== S && o.some(([x, y]) => Math.hypot(x - e[0], y - e[1]) < 3)); if (!ok) out.dead.push(k + j + ':' + e.map(Math.round)) }) }));
    out.xing = !!T.cross(P.RAIL, P.MAIN) && !!T.cross(P.RAIL, P.RIVER);
    // เดินทาง: ทุกคู่สถานที่มีทางเดินตามถนน (จุดห่างกันทีละ ≤1 px อยู่ในแผนที่ เริ่ม/จบที่จุดแมว) และไม่ไกลเกินเหตุ
    out.trip = []; PLACES.forEach(a => PLACES.forEach(z => { if (a === z) return; const r = T.trip(a, z); if (!r) return out.trip.push(a.id + '→' + z.id + ' ไม่มีทาง');
      const gap = r.slice(1).some((q, i) => Math.hypot(q[0] - r[i][0], q[1] - r[i][1]) > 1.01), off = r.some(([x, y]) => x < 0 || y < 0 || x >= T.W || y >= T.H), st = Math.hypot(r[0][0] - a.map.cat[0], r[0][1] - a.map.cat[1]) > .01 || Math.hypot(r[r.length - 1][0] - z.map.cat[0], r[r.length - 1][1] - z.map.cat[1]) > .01;
      if (gap || off || st || r.length > 400) out.trip.push(a.id + '→' + z.id + ':' + [gap, off, st, r.length]) }));
    return out });
  assert.deepStrictEqual(r.bad, [], 'ทุกที่ใน PLACES มี map อาคาร และฉาก');
  assert.strictEqual(r.seasons, 4); assert.strictEqual(r.tods, 4); assert.deepStrictEqual(r.fest, ['ny', 'koi', 'mat', '']);
  assert.deepStrictEqual(r.dead, [], 'ถนนจบกลางหญ้า ' + r.dead.join(' ')); assert(r.xing, 'มีทางข้ามรถไฟและสะพานรถไฟ'); assert.deepStrictEqual(r.trip, [], 'เส้นทางเดินทาง');
  // หน้าต่างจริง: ป้ายครบทุกที่ + แปลงว่าง 5 ป้ายอยู่ในแผนที่ · เปิดมาเลื่อนไปที่แมว (อยู่บ้าน = ด้านล่าง)
  await p.locator('.scgo').click(); await p.waitForSelector('.tmd canvas');
  const g = await p.evaluate(() => { const w = document.querySelector('.tmw'), c = document.querySelector('.tmc').getBoundingClientRect(), B = [...document.querySelectorAll('.tmp')].map(e => e.getBoundingClientRect());
    return { n: document.querySelectorAll('.tmp[data-p]').length, soon: document.querySelectorAll('.tmp.soon').length, inside: B.every(r => r.left >= c.left - .5 && r.right <= c.right + .5), hit: B.some((r, i) => B.some((q, j) => j > i && r.left < q.right && q.left < r.right && r.top < q.bottom && q.top < r.bottom)), top: w.scrollTop, max: w.scrollHeight - w.clientHeight, here: document.querySelector('.tmp.here').dataset.p } });
  assert.strictEqual(g.n, await p.evaluate(() => PLACES.length)); assert.strictEqual(g.soon, 5); assert(g.inside, 'ป้ายล้นขอบแผนที่'); assert(!g.hit, 'ป้ายทับกัน'); assert.strictEqual(g.here, 'room');
  assert(g.max > 0 && g.top > g.max * .6, 'เปิดมาแล้วเลื่อนไปที่บ้าน ' + g.top + '/' + g.max);
  await p.locator('.tmp.soon').first().click({ timeout: 4000 }); assert((await p.locator('.tmi').innerText()).includes('เร็วๆ นี้'));
  await p.locator('.tmi [data-c]').click({ timeout: 4000 }); assert.strictEqual(await p.locator('.tmi').count(), 0);
  await p.locator('.tmp[data-p="room"]').click({ timeout: 4000 }); assert.strictEqual(await p.locator('.tmi .go').innerText(), 'อยู่ที่นี่แล้ว'); assert(await p.locator('.tmi .go').isDisabled());
  await p.locator('.tmi [data-c]').click({ timeout: 4000 }); await p.locator('.cdl button[data-x]').click({ timeout: 4000 }); assert.strictEqual(await p.locator('.cov').count(), 0, 'ปิดหน้าต่าง');
  assert.deepStrictEqual(p.errors, []);
});

test('สถานที่: ทุกฉากใช้สีจาก token (มีครบทั้งโหมดสว่างและมืด) และประโยคประจำที่ใช้เฉพาะคันจิ N5', async () => {
  const css = fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8'), js = fs.readFileSync(path.join(ROOT, 'js/data/places.js'), 'utf8');
  const used = new Set([...js.matchAll(/\bf-([a-z]-[a-z0-9]+)/g)].map(m => m[1]));
  [...new Set([...js.matchAll(/\b(s-[a-z]-[a-z0-9]+)/g)].map(m => m[1]))].forEach(c => assert(css.includes('.' + c + '{'), 'ไม่มีสไตล์เส้น ' + c));
  const blk = re => (css.match(re) || ['', ''])[1];
  const lt = blk(/ฉากสถานที่[\s\S]*?\n:root\{([^}]*)\}/), dk = blk(/ฉากสถานที่[\s\S]*?:root\[data-theme="dark"\]\{([^}]*)\}/);
  used.forEach(t => { assert(lt.includes('--' + t + ':'), 'ไม่มีสีโหมดสว่าง ' + t); assert(dk.includes('--' + t + ':'), 'ไม่มีสีโหมดมืด ' + t) });
  [lt, dk].forEach(B => { const m = B.match(/[^;{\s]--[a-z]+-[a-z0-9]+:/); assert(!m, 'ลืม ; ก่อน token (token ถัดไปจะใช้ไม่ได้ทั้งตัว): ' + (m && m[0])) }); // v120 เคยต่อ token ท้าย --sc-gop:.22 ที่ไม่มี ; แล้วสีทั้งฉากหาย
  assert(!/(fill|stroke)="#/.test(js), 'ห้ามใส่สีตรงๆ ในฉาก ต้องใช้ class/token');
  const ctx = {}; new Function('ctx', js.replace(/^const (\w+)/gm, 'ctx.$1') )(ctx);
  const k5 = fs.readFileSync(path.join(ROOT, 'js/data/kanji-n5.js'), 'utf8');
  Object.values(ctx.PLACE_LINES).flat().forEach(l => [...l.replace(/\{([^|}]*)\|[^}]*\}/g, '$1')].filter(c => /\p{Script=Han}/u.test(c)).forEach(c => assert(new RegExp('^' + c + ',', 'm').test(k5), 'คันจิเกิน N5 ในประโยคประจำที่: ' + c)));
  ctx.PLACES.forEach(p => { assert(p.free || (p.unlock && p.unlock.n > 0), p.id); assert(p.pet.length === 2) });
});

test('สถานที่ใหม่ v120: ร้านสะดวกซื้อ ห้องเรียน ศาลเจ้า ปลดล็อกด้วยคำหมวดของตัวเอง · ฉากพิกเซลมีของขยับ · แมวระวังตัวในร้านกับห้องเรียน', async (b, base) => {
  const p = await fresh(b, base);
  await home(p); await p.locator('.scgo').click();
  const dlg = await p.locator('.cdl').innerText();
  for (const [id, n] of [['konbini', 'ร้านสะดวกซื้อ'], ['classroom', 'ห้องเรียน'], ['shrine', 'ศาลเจ้า']]) { assert(dlg.includes(n), n); assert.strictEqual(await p.locator(`.tmp[data-p="${id}"].tlk`).count(), 1, n + ' ยังล็อก') }
  await p.locator('.cdl button[data-x]').click();
  // จำคำหมวดของใช้ได้แม่น 10 คำ → ได้ตั๋วร้านสะดวกซื้ออย่างเดียว
  await p.evaluate(() => { const L = [...W, ...V].filter(x => x.c === 'ของใช้').slice(0, 10), sw = {}, sv = {}; L.forEach(x => { (W.includes(x) ? sw : sv)[x.k] = { b: 5, w: 0, d: Date.now() + 864e5 } }); localStorage.setItem('kw1', JSON.stringify(sw)); localStorage.setItem('kv1', JSON.stringify(sv)) });
  await home(p); await p.waitForSelector('.toast:has-text("ได้ตั๋วไปร้านสะดวกซื้อแล้ว")');
  assert.deepStrictEqual(await p.evaluate(() => JSON.parse(localStorage.getItem('kn_meta')).place.got), ['konbini']);
  await p.locator('.scgo').click(); await p.locator('.tmp[data-p="konbini"]').click(); await travel(p, 'ร้านสะดวกซื้อ');
  const h = await home(p); assert(h.includes('ร้านสะดวกซื้อ') && h.includes('ทบทวนคำหมวดของใช้'), h.slice(0, 300));
  assert.strictEqual(await p.locator('.scn.px[data-place="konbini"] > canvas#petcv').count(), 1);
  // ของขยับในฉาก (ไอโอเด้ง ป้ายแกว่ง · ม่านไหว นาฬิกา · เชือกกระดิ่ง แผ่นเอมะ) เปลี่ยนตามเวลา · ปิดแอนิเมชันแล้วนิ่ง · ช่วงปรับตัว: ร้าน/ห้องเรียนระวังตัว ศาลเจ้าไม่
  const r = await p.evaluate(() => { const T = PixelCat._t, cv = document.createElement('canvas'), out = {};
    for (const pl of ['konbini', 'classroom', 'shrine']) { PixelCat.mount(cv, { place: pl, coat: 'cream' }); const s = T.scenes[pl], k = T.palOf(pl, 'light');
      const shot = (ms, P) => { const c = document.createElement('canvas'); c.width = 160; c.height = 90; const x = c.getContext('2d'), A = { t: 0, ms, d: new Date(ms), P, td: 'day', sk: 'light' }; s.live(x, k, A); if (s.front) s.front(x, k, A); return c.toDataURL() };
      const t0 = new Date('2026-07-10T10:00:00').getTime(); out[pl] = [shot(t0, true) !== shot(t0 + 700, true), shot(t0, false) === shot(t0 + 700, false), s.bed === null, s.poi.length >= 4];
      T.setFam(1, 0); out[pl].push(T.wary() > .5) }
    T.setFam(99, 0); M.place = { at: 'room', got: [] }; render(); return out });
  assert.deepStrictEqual(r.konbini, [true, true, true, true, true]); assert.deepStrictEqual(r.classroom, [true, true, true, true, true]); assert.deepStrictEqual(r.shrine, [true, true, true, true, false]);
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
    for (const pl of Object.keys(T.scenes)) { const I = ['spring', 'summer', 'autumn', 'winter'].map(se => img(pl, se)); out[pl] = I; out[pl + 'N'] = img(pl, 'winter', 'dark') !== img(pl, 'summer', 'dark') }
    out.places = Object.keys(T.scenes);
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
  assert.strictEqual(r.places.length, 7, 'ฉาก ' + r.places); for (const pl of r.places) { assert.notStrictEqual(r[pl][1], r[pl][3], 'หนาวต่างจากร้อน ' + pl); assert(r[pl + 'N'], 'กลางคืนหนาวต่างจากร้อน ' + pl) }
  for (const pl of ['classroom', 'shrine', 'konbini']) assert.strictEqual(new Set(r[pl]).size, 4, 'ต่างกันทั้ง 4 ฤดู ' + pl);
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
    const scenes = { room: ['2026-11-24T23:00:00', '2026-12-17T19:30:00'], garden: ['2026-11-25T00:00:00', '2026-12-17T19:30:00'], cafe: ['2026-11-25T00:00:00', '2026-12-14T19:30:00'], station: ['2026-11-25T00:00:00', '2026-12-17T19:30:00'], konbini: ['2026-11-25T00:00:00', '2026-12-17T19:30:00'], classroom: ['2026-11-25T00:00:00', '2026-12-17T19:30:00'], shrine: ['2026-11-25T00:00:00', '2026-12-17T19:30:00'] };
    T.setTod('night');
    for (const [pl, [a, c]] of Object.entries(scenes)) { const none = img(pl, '2026-12-09T23:00:00'); out[pl] = [img(pl, a) !== none, img(pl, c) !== none, img(pl, a) !== img(pl, c)] }
    T.setTod('day'); T.setSeason('autumn'); T.setNow(new Date('2026-11-24T23:00:00').getTime()); PixelCat.mount(cv, { place: 'garden', coat: 'cream' }); out.day = T.sceneBg('light').toDataURL() === (T.setNow(new Date('2026-12-09T23:00:00').getTime()), T.sceneBg('light').toDataURL()); T.setSeason(null); // คนละเดือน คนละฤดู จึงตรึงฤดูไว้
    T.setNow(null); T.setTod(null); M.place = { at: 'room', got: [] }; render(); return out });
  for (const pl of ['room', 'garden', 'cafe', 'station', 'konbini', 'classroom', 'shrine']) assert.deepStrictEqual(draw[pl], [true, true, true], 'พระจันทร์ในฉาก ' + pl);
  assert(draw.day, 'กลางวันไม่มีพระจันทร์');
  assert.deepStrictEqual(p.errors, []);
});
