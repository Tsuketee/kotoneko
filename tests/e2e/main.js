// e2e: การใช้งานหลัก (ตั้งค่าครั้งแรก นำทาง เรียน ทบทวน บทสนทนา ไวยากรณ์ สถิติ เป้าหมาย สำรองข้อมูล โปรไฟล์) · รันผ่าน node tests/e2e.js [คำในชื่อข้อ]
const { assert, fs, path, ROOT, SEED, test, fresh, snap, mockCloud, cloudPage } = require('./harness');

test('เปิดแอปครั้งแรก: เข้าหน้าตั้งค่า และตั้งค่าครบแล้วเข้าหน้าแรกได้', async (b, base) => {
  const p = await fresh(b, base, { seed: false });
  assert(await p.locator('text=ยินดีต้อนรับ').count());
  await p.evaluate(() => { obn('🐱 แมว'); document.getElementById('nm').value = 'มะลิ'; obt(); });
  // ขั้นชื่อเจ้าของ (v77): ช่องกรอก + ปุ่มข้าม · ตัดอักขระ HTML
  assert(await p.locator('button:text-is("ข้ามไปก่อน")').count() === 1 && await p.locator('#nm[placeholder="ชื่อของเธอ"]').count() === 1);
  await p.evaluate(() => { document.getElementById('nm').value = 'พ<อ>'; obt(); obn('N5'); obn('เพื่อไปสอบวัดระดับ JLPT'); obn('10'); });
  assert(await p.locator('nav#nav button').count() === 5);
  assert.deepStrictEqual(await p.evaluate(() => [M.me.name, M.pet.name, M.pet.owner, M.pet.lv, M.goal, M.pet.min]), ['พอ', 'มะลิ', undefined, 'N5', 10, undefined], 'คำตอบวันละกี่ข้อเป็นเป้าหมายต่อวันตัวเดียว (M.goal)');
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
  await p.evaluate(() => goProf());
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

test('คันจิ: เปิดการ์ด พลิก ตอบ "จำได้" แล้วบันทึกความคืบหน้า', async (b, base) => {
  const p = await fresh(b, base);
  await p.evaluate(() => openDs('k'));
  await p.locator('#app .card').first().click();
  await p.locator('button:text-is("จำได้")').click();
  const saved = await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('kn5') || '{}')).length);
  assert(saved >= 1);
  // ข้อมูลคุนแยกโอกุริงานะด้วย . (よ.っつ) แต่บนจอแสดงเป็นวงเล็บ และเสียงอ่านตัดโอกุริงานะออก (เหมือนก่อนเปลี่ยนรูปแบบข้อมูล)
  const kun = await p.evaluate(() => ['四', '生', '空'].map(c => { const x = K.find(k => k.k === c); return [x.u, rd(x), speakFor(x)] }));
  assert.deepStrictEqual(kun, [
    ['よん・よ.っつ', 'シ ・ よん・よ(っつ)', 'よん'],
    ['い.きる・う.まれる', 'セイ/ショウ ・ い(きる)・う(まれる)', 'い'],
    ['そら・あ.く・から', 'クウ ・ そら・あ(く)・から', 'そら'],
  ]);
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
test('บทสนทนา: คำแปลรายบรรทัด ผู้พูด|ประโยค|คำแปล อ่านถูกแม้มีฟุริงะนะ · ปุ่ม "คำแปล" ขึ้นเฉพาะบทที่มีคำแปล ปิดไว้ก่อน กดแล้วเห็นใต้ทุกบรรทัด', async (b, base) => {
  const p = await fresh(b, base);
  // รูปแบบข้อมูล: | ในฟุริงะนะไม่ถูกตัดเป็นคำแปล · ไม่มีคำแปลได้
  const parsed = await p.evaluate(() => parseD('@1|ทดสอบ (สุภาพ)\nけん|{今日|きょう}はいい{天気|てんき}ですね。|วันนี้อากาศดีนะครับ\nさくら|{今日|きょう}は。\nさくら|はい。|<b>ค่ะ</b>')[0].turns);
  assert.deepStrictEqual(parsed, [['けん', '{今日|きょう}はいい{天気|てんき}ですね。', 'วันนี้อากาศดีนะครับ'], ['さくら', '{今日|きょう}は。'], ['さくら', 'はい。', '<b>ค่ะ</b>']]);
  // ข้อมูลจริงทุกบทมีคำแปลแล้ว (npm run validate:data ตรวจ) → มีปุ่มทุกบท
  await p.evaluate(() => openDs('d'));
  for (let i = 0, n = await p.evaluate(() => D.length); i < n; i++) { await p.evaluate(i => dgo(i), i); assert.strictEqual(await p.getByTestId('dlg-translate').count(), 1, 'บทที่ ' + (i + 1)); }
  // บทที่ไม่มีคำแปล (ลบออกในหน้านี้เท่านั้น): ไม่มีปุ่ม
  await p.evaluate(() => { D[0].turns.forEach(t => { t.length = 2 }); dgo(0); });
  assert.strictEqual(await p.getByTestId('dlg-translate').count(), 0);
  // ใส่คำแปลให้บทแรก (ข้อมูลทดสอบ ไม่ใช่เนื้อหาจริง) → มีปุ่ม ปิดไว้ก่อน → กดแล้วเห็นครบทุกบรรทัด → กดอีกครั้งซ่อน
  const n = await p.evaluate(() => { D[0].turns.forEach((t, i) => { t[2] = i === 0 ? '<b>แปล</b>' : 'แปล ' + i }); render(); return D[0].turns.length; });
  const btn = p.getByTestId('dlg-translate');
  assert.strictEqual(await btn.getAttribute('aria-pressed'), 'false');
  assert.strictEqual(await p.getByTestId('dlg-translation').count(), 0);
  await btn.click();
  assert.strictEqual(await p.getByTestId('dlg-translation').count(), n);
  await snap(p, 'translation-on');
  assert.strictEqual(await p.getByTestId('dlg-translation').first().innerText(), '<b>แปล</b>', 'คำแปลต้องแสดงเป็นข้อความ ไม่ใช่ HTML');
  assert.strictEqual(await p.locator('.dtr b').count(), 0);
  await p.getByTestId('dlg-translate').click();
  assert.strictEqual(await p.getByTestId('dlg-translation').count(), 0);
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
  // เปิดแอปใหม่แล้วความคืบหน้าไวยากรณ์อ่านกลับมาครบ (GS โหลดจาก kg1 ตอนเริ่ม)
  await p.reload();
  assert.deepStrictEqual(await p.evaluate(() => GS), o.data.kg1);
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
  const emo = /[\u2600-\u27BF\u{1F300}-\u{1FAFF}]|\uFE0F/u, bad = [];
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
  await p.getByTestId('stats-goal').click();
  await p.locator('.glp button:text-is("50")').click();
  await p.getByTestId('goal-save').click();
  assert.strictEqual(await p.evaluate(() => JSON.parse(localStorage.getItem('kn_meta')).goal), 50);
  assert.match(await p.locator('.glr').innerText(), /50\s*ข้อต่อวัน/);
});

test('เป้าหมายต่อวัน: พิมพ์เองได้ 1–200 · ค่าผิดไม่บันทึกและบอกเหตุผล · เปิดจากวงหน้าแรกและเมนูโปรไฟล์ · วง ภารกิจทบทวน และเมนูใช้ค่าเดียวกัน · จำหลังเปิดใหม่', async (b, base) => {
  const p = await fresh(b, base);
  await p.getByTestId('home-goal').click();
  const inp = p.getByTestId('goal-input');
  assert.strictEqual(await inp.inputValue(), '20');
  for (const bad of ['0', '201', '', '-3', '2.5']) {
    await inp.fill(bad);
    await p.getByTestId('goal-save').click();
    assert.match(await p.getByTestId('goal-error').innerText(), /1–200/, 'ค่า "' + bad + '" ต้องขึ้นคำเตือน');
    assert.strictEqual(await p.evaluate(() => JSON.parse(localStorage.getItem('kn_meta')).goal), 20, 'ค่า "' + bad + '" ต้องไม่ถูกบันทึก');
  }
  await inp.fill('7');
  await inp.press('Enter');
  assert.strictEqual(await p.locator('.cov').count(), 0, 'บันทึกแล้วหน้าต่างต้องปิด');
  assert.match(await p.getByTestId('home-today').innerText(), /0\s*\/\s*7/);
  assert.match(await p.getByTestId('mission-rev').innerText(), /0 \/ 7/);
  assert.match(await p.getByTestId('mission-neu').innerText(), /0 \/ 4/);
  await p.reload();
  assert.match(await p.getByTestId('home-today').innerText(), /0\s*\/\s*7/, 'เปิดใหม่แล้วต้องยังเป็น 7');
  // ยกเลิกไม่เปลี่ยนค่า
  await p.getByTestId('home-goal').click();
  await p.getByTestId('goal-input').fill('99');
  await p.locator('.cov button:text-is("ยกเลิก")').click();
  assert.strictEqual(await p.evaluate(() => M.goal), 7);
  // เมนูโปรไฟล์แสดงค่าเดียวกันและเปิดหน้าต่างเดียวกัน
  await p.evaluate(() => goTab('me'));
  const row = p.locator('.mnr:has-text("เป้าหมายต่อวัน")');
  assert.match(await row.innerText(), /7 ข้อ/);
  await row.click();
  await p.getByTestId('goal-input').fill('120');
  await p.getByTestId('goal-save').click();
  assert.match(await p.locator('.mnr:has-text("เป้าหมายต่อวัน")').innerText(), /120 ข้อ/);
  assert.strictEqual(await p.evaluate(() => JSON.parse(localStorage.getItem('kn_meta')).goal), 120);
  assert.deepStrictEqual(p.errors, []);
});

test('ที่เก็บข้อมูล: เขียนความคืบหน้าวิธีเดียว writeProg (ดึงจากคลาวด์ลบ key ที่ไม่มี · นำเข้าไฟล์เขียนเฉพาะที่มี) · เขียนไม่ได้แจ้งผู้ใช้และไม่โหลดหน้าใหม่ · PK ใช้แค่ใน js/stats.js', async (b, base) => {
  const users = fs.readdirSync(path.join(ROOT, 'js')).filter(x => x.endsWith('.js') && /\bPK\b/.test(fs.readFileSync(path.join(ROOT, 'js', x), 'utf8').replace(/\/\/.*$/gm, '')));
  assert.deepStrictEqual(users, ['stats.js'], 'อ่าน/เขียนความคืบหน้าทุก key ต้องผ่าน snapshot()/writeProg() ใน js/stats.js');
  const p = await fresh(b, base);
  const r = await p.evaluate(() => {
    localStorage.setItem('kw1', JSON.stringify({ a: { b: 1 } })); localStorage.setItem('kv1', JSON.stringify({ x: { b: 2 } }));
    const ok1 = writeProg({ kw1: { c: { b: 3 } }, kv1: [1, 2] }, false), part = [localStorage.getItem('kw1'), localStorage.getItem('kv1')];
    const ok2 = writeProg({ kw1: { d: { b: 4 } }, kn_meta: JSON.parse(localStorage.getItem('kn_meta')) }, true), all = [localStorage.getItem('kw1'), localStorage.getItem('kv1')];
    return { ok1, part, ok2, all };
  });
  assert.deepStrictEqual(r, { ok1: true, part: ['{"c":{"b":3}}', '{"x":{"b":2}}'], ok2: true, all: ['{"d":{"b":4}}', null] }, 'นำเข้าไฟล์ไม่ลบ key อื่นและข้ามค่าที่ไม่ใช่ object · ดึงจากคลาวด์ลบ key ที่ไม่มี');
  // นำเข้าไฟล์ตอนที่เก็บข้อมูลเต็ม: แจ้ง "บันทึกไม่สำเร็จ" และอยู่หน้าเดิม
  const f = path.join(require('os').tmpdir(), 'kanji-e2e-quota-' + Date.now() + '.json');
  fs.writeFileSync(f, JSON.stringify({ app: 'kanji-app', format: 1, data: { kw1: { z: { b: 5 } } } }));
  await p.evaluate(() => { goMe('backup'); Storage.prototype.setItem = () => { throw new DOMException('ทดสอบ: เต็ม', 'QuotaExceededError') }; window.__same = 1; });
  p.on('dialog', d => d.accept());
  await p.setInputFiles('#imp', f);
  await p.getByTestId('toast').filter({ hasText: 'บันทึกไม่สำเร็จ' }).waitFor();
  assert.strictEqual(await p.evaluate(() => window.__same), 1, 'เขียนไม่ได้ต้องไม่โหลดหน้าใหม่');
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
  assert.deepStrictEqual(o.data, await p.evaluate(() => snapshot()), 'ไฟล์ส่งออกต้องเป็นข้อมูลชุดเดียวกับที่ซิงก์ขึ้นคลาวด์ (snapshot ใน js/stats.js)');
  const readers = fs.readdirSync(path.join(ROOT, 'js')).filter(x => x.endsWith('.js') && /PK\.(forEach|map|reduce)\(k\s*=>\s*\{?\s*const v\s*=\s*readJSON/.test(fs.readFileSync(path.join(ROOT, 'js', x), 'utf8')));
  assert.deepStrictEqual(readers, ['stats.js'], 'อ่านความคืบหน้าทุก key ต้องผ่าน snapshot() ใน js/stats.js วิธีเดียว');
  await p.evaluate(() => localStorage.removeItem('kw1')); p.on('dialog', d => d.accept());
  await Promise.all([p.waitForNavigation(), p.setInputFiles('#imp', f)]);
  assert.strictEqual(await p.evaluate(() => JSON.parse(localStorage.getItem('kw1'))['テスト'].b), 3);
  const bad = path.join(require('os').tmpdir(), 'kanji-e2e-bad.json'); fs.writeFileSync(bad, '{"hello":1}');
  await p.evaluate(() => goMe('backup')); await p.setInputFiles('#imp', bad);
  await p.waitForSelector('.toast');
  assert((await p.locator('.toast').innerText()).includes('ไม่ใช่ไฟล์'));
  fs.unlinkSync(f); fs.unlinkSync(bad);
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

test('แท็บโปรไฟล์ = บัตรสัตว์เลี้ยง: เปิดจากปุ่มบนการ์ดหน้าแรก · อายุ วันเกิด ระดับความสนิท เรียนเพื่อ · แท็บนิสัย · แก้ชื่อ · คลังสะสมล็อกไว้ก่อน · กลับหน้าแรก', async (b, base) => {
  const p = await fresh(b, base, { viewport: { width: 375, height: 812 } });
  // อยู่ด้วยกัน 10 วัน · ถึงเป้า 3 วันติด · ความสนิท 57 = เพื่อนกัน (ร่าง 2) อีก 23 ถึงเพื่อนสนิท
  await p.evaluate(() => { const ds = i => { const d = new Date(); d.setDate(d.getDate() - i); return dstr(d) };
    M.pet.rv = ds(9); M.pet.bond = 57; M.pet.trait = 3; M.pet.goal = 'เพื่อไปสอบวัดระดับ JLPT'; M.days = {}; [0, 1, 2, 6, 7, 8, 9].forEach(i => M.days[ds(i)] = M.goal); saveM(); render() });
  await p.locator('.ppf').click();
  assert.deepStrictEqual(await p.evaluate(() => [tab, meView]), ['me', 'card'], 'ปุ่มโปรไฟล์บนการ์ดหน้าแรกเปิดบัตรตรงๆ');
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

test('ที่เก็บข้อมูลในเครื่องเขียนไม่ได้ (พื้นที่เต็ม/โหมดส่วนตัว): แจ้งผู้ใช้ครั้งเดียว และไม่พาไปหน้า Google · ปุ่มฟังเสียงเล่นไม่ได้ก็แจ้งผู้ใช้', async (b, base) => {
  const db = mockCloud(); db.google = true;
  const p = await cloudPage(b, base, db);
  // เก็บทุกข้อความเด้งที่ขึ้นจอ · นับหลังคิวข้อความว่าง (toastFree) จะได้รู้ว่าไม่มีข้อความซ้ำรอขึ้นอยู่
  await p.evaluate(() => { window.__toasts = []; new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.dataset && n.dataset.testid === 'toast') window.__toasts.push(n.textContent) }))).observe(document.body, { childList: true }); });
  const shown = async s => { await p.waitForFunction(() => Date.now() > toastFree, null, { timeout: 15000 }); return p.evaluate(s => window.__toasts.filter(m => m.includes(s)).length, s) };
  // ปุ่มฟังเสียง: เบราว์เซอร์เล่นไม่ได้ → แจ้ง ไม่เงียบ
  await p.evaluate(() => { speechSynthesis.speak = () => { throw new Error('ทดสอบ: เล่นไม่ได้') }; speak('ねこ'); });
  assert.strictEqual(await shown('เล่นเสียงไม่ได้ค่ะ'), 1);
  // เขียนไม่ได้: บันทึกหลายครั้งแจ้งแค่ครั้งเดียว แอปยังทำงานต่อด้วยข้อมูลในหน่วยความจำ
  await p.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('ทดสอบ: เต็ม', 'QuotaExceededError') }; M.goal = 30; saveM(); save(); saveM(); render(); });
  assert.strictEqual(await shown('บันทึกข้อมูลในเครื่องไม่ได้'), 1);
  assert.strictEqual(await p.evaluate(() => M.goal), 30);
  // เข้าสู่ระบบด้วย Google: เก็บ code_verifier ไม่ได้ → ไม่ไปหน้า Google (กลับมาก็เข้าสู่ระบบไม่ได้อยู่ดี) และบอกให้ใช้อีเมล
  await p.evaluate(() => goMe('acct')); await p.waitForSelector('.sgg');
  const url = p.url();
  await p.locator('.sgg').click();
  await p.waitForSelector('text=เข้าสู่ระบบด้วย Google ไม่ได้ในโหมดนี้');
  assert.strictEqual(p.url(), url); assert(!db.auth, 'ต้องไม่เรียกหน้า authorize');
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

test('แถบล่าง 5 หมวด: หน้าแรก เรียน ความคืบหน้า (ภาพรวม/ผิดบ่อย) ร้านค้า (โคบัง) โปรไฟล์ (บัตร + เมนู: บัญชี สำรองข้อมูล เครดิต)', async (b, base) => {
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
  // ร้านค้า (โคบัง): ยอดโคบัง ถุงโชคดี ตู้สะสมทุกหมวด ไม่มีราคาเงินจริง (รายละเอียดใน tests/e2e/shop.js)
  await p.locator('#nav button:has-text("ร้านค้า")').click();
  t = await p.locator('#app').innerText();
  assert(t.includes('โคบัง') && t.includes('ถุงโชคดี') && t.includes('ลายขน') && t.includes('อาหาร') && t.includes('ไม่ใช้เงินจริง') && !/฿|บาท|THB/.test(t), t);
  // โปรไฟล์ (v123 เจ้าของขอสลับ): แท็บเปิดมาเป็นเมนู → ดูโปรไฟล์ = บัตรสัตว์เลี้ยง → กลับเมนู → หน้าย่อย (สำรองข้อมูล เครดิต) → กลับเมนู · แตะแท็บซ้ำกลับเมนู
  await p.locator('#nav button:has-text("โปรไฟล์")').click();
  assert.deepStrictEqual(await p.evaluate(() => [meView, document.querySelectorAll('.idc').length, document.querySelector('.mehd h1').textContent]), ['menu', 0, 'โปรไฟล์'], 'แท็บโปรไฟล์เปิดมาเป็นเมนู');
  await p.locator('.mnh .mnl:has-text("ดูโปรไฟล์")').click();
  assert.deepStrictEqual(await p.evaluate(() => [meView, document.querySelectorAll('.idc').length]), ['card', 1], 'ดูโปรไฟล์ = บัตร');
  await p.locator('.top .bk').click(); assert.strictEqual(await p.evaluate(() => meView), 'menu');
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
  await p.locator('#nav button:has-text("โปรไฟล์")').click();
  assert.strictEqual(await p.evaluate(() => meView), 'menu', 'แตะแท็บโปรไฟล์ซ้ำกลับเมนู');
  // ธีม: ตามเครื่อง (ไม่มี data-theme) → มืด → สว่าง จำไว้ใน kn_theme และใช้ทันทีตอนเปิดแอปใหม่ · กลับตามเครื่องลบค่าทิ้ง
  const th = () => p.evaluate(() => [document.documentElement.dataset.theme || 'auto', localStorage.getItem('kn_theme'), getComputedStyle(document.body).backgroundColor, document.querySelector('.seg2 [aria-pressed=true]').textContent]);
  assert.deepStrictEqual((await th()).slice(0, 2), ['auto', null]);
  await p.locator('.seg2 button:text-is("มืด")').click(); let v = await th(); assert.deepStrictEqual([v[0], v[1], v[3]], ['dark', 'dark', 'มืด']); const dk = v[2];
  await p.reload(); assert.strictEqual(await p.evaluate(() => document.documentElement.dataset.theme), 'dark', 'จำธีมหลังเปิดใหม่');
  await p.evaluate(() => goTab('me')); await p.locator('.seg2 button:text-is("สว่าง")').click(); v = await th(); assert.deepStrictEqual([v[0], v[1], v[3]], ['light', 'light', 'สว่าง']); assert.notStrictEqual(v[2], dk, 'พื้นหลังเปลี่ยนตามธีม');
  await p.locator('.seg2 button:text-is("ตามเครื่อง")').click(); assert.deepStrictEqual((await th()).slice(0, 2), ['auto', null]);
  for (const n of ['หน้าแรก', 'เรียน', 'ความคืบหน้า', 'ร้านค้า', 'โปรไฟล์']) { await p.locator(`#nav button:has-text("${n}")`).click(); assert(!(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)), n + ' ล้นจอแนวนอน'); }
  assert.deepStrictEqual(p.errors, []);
});
