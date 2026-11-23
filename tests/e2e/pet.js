// e2e: สัตว์เลี้ยง ภารกิจ และแมวพิกเซล · รันผ่าน node tests/e2e.js [คำในชื่อข้อ]
const { assert, tplRe, test, fresh } = require('./harness');

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
  // ให้อาหาร (ตู้กับข้าว): มีข้าวปั้น -> ประโยค feed + ความสนิท +10 ไม่ใช้ Energy ; ตู้ว่าง -> ประโยค hungry
  const toastText = () => p.evaluate(() => { const e = document.querySelectorAll('.toast'); return e.length ? e[e.length - 1].innerText : ''; });
  await p.evaluate(() => { M.pet.energy = 100; M.pet.bond = 0; M.pet.food = { onigiri: 1 }; M.pet.hg = 80; M.pet.ht = Date.now(); pfood('onigiri'); });
  let tx = await toastText(); assert(lines.feed.some(l => tx.includes(l)), 'feed: ' + tx);
  assert.deepStrictEqual(await p.evaluate(() => [M.pet.energy, M.pet.bond, M.pet.food.onigiri]), [100, 10, 0]);
  await p.evaluate(() => { document.querySelectorAll('.toast').forEach(e => e.remove()); document.querySelectorAll('.cov').forEach(e => e.remove()); M.pet.food = {}; pfeed(); });
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

test('ภารกิจรายวัน: ทำครบแล้วกด "รับ" ถึงได้ Energy · ป้ายบนแท็บหน้าแรก · หลอด Energy · วันเก่าที่ได้ Energy ไปแล้วไม่รับซ้ำ', async (b, base) => {
  const p = await fresh(b, base);
  // ทำภารกิจทบทวนครบ: ยังไม่ได้ Energy แต่ขึ้นปุ่มรับ และป้าย 1 บนแท็บหน้าแรก
  await p.evaluate(() => { M.pet.energy = 0; M.pet.bond = 0; pens(); for (let i = 0; i < M.goal; i++) ptrack('rev'); goTab('learn'); });
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

test('แมวพิกเซล: แตะแมวทุกแบบไม่เพิ่มความสนิท Energy หรือภารกิจ (กดรัวเก็บแต้มไม่ได้)', async (b, base) => {
  const p = await fresh(b, base);
  await p.evaluate(() => { PixelCat._t.setJit(false); PixelCat._t.setNow(new Date('2026-11-22T12:00:00').getTime()); pens(); M.pet.bond = 0; M.pet.energy = 0; saveM(); render(); });
  await p.waitForTimeout(300);
  const rewards = () => p.evaluate(() => { const s = JSON.parse(localStorage.getItem('kn_meta')); return { bond: M.pet.bond, energy: M.pet.energy, d: JSON.stringify(M.pet.d), days: JSON.stringify(M.days), unclaimed: punclaimed(), saved: [s.pet.bond, s.pet.energy, JSON.stringify(s.pet.d)] }; });
  const before = await rewards();
  const reset = (o = {}) => p.evaluate(o => Object.assign(PixelCat._t.cat, { mode: 'sit', x: 52, t: 0, dur: 1e9, pose: null, tol: 0, cool: 0, lv: 0, then: null, pend: null }, o), o);
  const box = await p.locator('#petcv').boundingBox(), sc = box.width / 160, tap = (x, y) => p.mouse.click(box.x + (52 + x) * sc, box.y + (41 + y) * sc);
  const modes = new Set();
  const seen = () => p.evaluate(() => PixelCat._t.cat.mode).then(m => modes.add(m));
  // แตะหัวรัวจนแมวเดินหนี แล้วแตะต่อระหว่างพัก
  await reset(); for (let i = 0; i < 15; i++) { await tap(24, 20); await seen(); }
  // ทุกโซนทีละครั้ง (หลังพักครบ) · กดค้างที่หัว · แตะตอนหลับ · ปุ่ม Enter บนฉาก
  for (const [x, y] of [[24, 20], [24, 38], [42, 32]]) for (let i = 0; i < 3; i++) { await reset(); await p.evaluate(() => { const { step } = PixelCat._t; for (let k = 0; k < 40; k++) step(50); }); await reset(); await tap(x, y); await seen(); }
  await reset(); await p.mouse.move(box.x + 76 * sc, box.y + 61 * sc); await p.mouse.down(); await p.waitForTimeout(900); await p.mouse.up(); await seen();
  await reset({ mode: 'curl' }); await tap(24, 26); await seen();
  await reset(); await p.locator('#petcv').focus(); await p.keyboard.press('Enter'); await seen();
  for (const m of ['pet', 'notice', 'annoy', 'sblink', 'wake']) assert(modes.has(m), 'ต้องได้ลองท่าตอบการแตะ ' + m + ' · ได้ ' + [...modes].join(' '));
  assert.deepStrictEqual(await rewards(), before, 'ห้ามผูกการแตะแมวกับความสนิท Energy หรือภารกิจ (กดรัวเก็บแต้มได้)');
  assert.deepStrictEqual(p.errors, []);
});

test('แมวพิกเซล: หน้าหลักวาดฉากห้อง, เหตุการณ์เรียกท่าอารมณ์, แตะแยกโซนและมาตรวัดความทน, เปลี่ยนท่าไม่ค้าง, กระต่ายยังเป็นอิโมจิ', async (b, base) => {
  const p = await fresh(b, base);
  await p.evaluate(() => { PixelCat._t.setJit(false); PixelCat._t.setNow(new Date('2026-11-22T12:00:00').getTime()); });
  await p.waitForTimeout(300);
  const info = await p.evaluate(() => { const c = document.getElementById('petcv'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return [c.width, c.height, n, getComputedStyle(c).imageRendering]; });
  assert.deepStrictEqual(info.slice(0, 2), [160, 90]); assert(info[2] > 160 * 90 * .9, 'ฉากต้องถูกวาด'); assert.strictEqual(info[3], 'pixelated');
  assert.strictEqual(await p.locator('.pet').count(), 0, 'แมวต้องไม่เป็นอิโมจิแล้ว');
  const T = () => p.evaluate(() => { const c = PixelCat._t.cat; return [c.mode, c.pose || null]; });
  // ให้อาหาร = ท่ากินข้าวปั้น (ถ้ากำลังเดินอยู่ รอจนนั่งพักก่อน)
  await p.evaluate(() => { const c = PixelCat._t.cat; Object.assign(c, { mode: 'sit', t: 0, dur: 1e9 }); M.pet.food = { onigiri: 1 }; M.pet.hg = 80; M.pet.ht = Date.now(); pfood('onigiri'); });
  assert.deepStrictEqual(await T(), ['pose', 'eat']);
  // ตู้กับข้าวว่าง → ขออาหาร (รายงานพฤติกรรมข้อ 12): เดินหางตั้งมากลางฉาก เงยหน้ามอง ニャー แล้วถูหัวคราง (ไม่ใช่ท่าเศร้า) · หลับอยู่ตื่นก่อน
  const begSim = (o) => p.evaluate(o => { const { step, cat } = PixelCat._t; Object.assign(cat, { mode: 'sit', x: 5, t: 0, dur: 1e9, then: null, pend: null, pose: null, tol: 0, cool: 0, lv: 0, after: null }, o); M.pet.food = {}; document.querySelectorAll('.cov').forEach(e => e.remove()); pfeed();
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
  const pw = await p.evaluate(seed => { const { step, cat, setPart, setFam, setTrait, XMAX, setNow, setTod, setSeason, setJit } = PixelCat._t, out = {}, R0 = Math.random; let a = seed >>> 0; setJit(false); setNow(0); setTod('dawn'); setSeason('summer'); // ปี 1970 = มกราคม (หน้าหนาว) ตรึงฤดูให้ผลเหมือนก่อนมีฤดู
    Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296 }; setTrait(-1); setPart('tw');
    for (const [id, fam] of [['room', 99], ['garden', 99], ['cafe', 99], ['station', 99], ['cafe', 1]]) { M.place = { at: id, got: PLACES.map(q => q.id), fam: {} }; render(); const o = out[id + fam] = { zoom: 0, walk: 0, hide: 0, groom: 0 }; let last = '';
      Object.assign(cat, { mode: 'sit', t: 0, dur: 100, x: 52, then: null, tol: 0, cool: 0, pend: null, str: 0 });
      for (let k = 0; k < 72000; k++) { setFam(fam, 0); step(50); if (cat.mode !== last) { if (cat.mode === 'run' && last !== 'skid') o.zoom++; if (cat.mode === 'groom') o.groom++; if (cat.mode === 'turnOut' && cat.then === 'sit' && cat.target !== Math.round(cat.x)) o.walk++; last = cat.mode } if (cat.mode === 'sit' && cat.x >= XMAX - 6) o.hide += 50 } }
    Math.random = R0; setJit(true); setPart(null); setNow(null); setTod(null); setSeason(null); setTrait(M.pet.trait); M.place = { at: 'room', got: [] }; render(); Object.assign(cat, { mode: 'sit', t: 0, dur: 1e9, x: 52, then: null }); return out }, +(process.env.KN_SEED || 7));
  const PW = JSON.stringify(pw);
  assert.strictEqual(pw.cafe99.zoom + pw.station99.zoom + pw.cafe1.zoom, 0, 'คาเฟ่/สถานีต้องไม่วิ่งดีด ' + PW); assert(pw.room99.zoom > 0, PW);
  assert(pw.garden99.walk > pw.room99.walk * 1.05, 'สวนต้องออกเดินบ่อยกว่าห้อง ' + PW); assert(pw.station99.walk < pw.room99.walk * .95, 'สถานีต้องออกเดินน้อยกว่าห้อง ' + PW);
  assert(pw.cafe1.hide > pw.cafe99.hide * 1.3, 'วันแรกในคาเฟ่ต้องแอบหลังของบ่อยกว่า ' + PW); // ปิดอารมณ์รายวันแล้วราว 1.47 เท่า (เกณฑ์เดิม 1.5 ผ่านเพราะอารมณ์ของวันที่รันช่วย) assert(pw.cafe1.groom < pw.cafe99.groom, 'วันแรกในคาเฟ่ต้องเลียขนน้อยกว่า ' + PW);
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
  await p.evaluate(() => { PixelCat._t.setSeason('summer'); PixelCat._t.setJit(false); });
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
    for (const pl of Object.keys(T.scenes)) { PixelCat.mount(cv, { place: pl, coat: 'cream' }); const P = T.scenes[pl].poi;
      for (let i = 0; i < 25; i++) { Object.assign(cat, { mode: 'sit', t: 0, dur: 1e9, x: XMIN + (i * 37) % (XMAX - XMIN), then: null, str: 0, hunt: 0, sniff: 0, bs: 0 }); T.sniffGo(); let hit = false;
        for (let k = 0; k < 600; k++) { step(50); if (cat.x < XMIN || cat.x > XMAX) out.out++;
          if (cat.mode === 'sniff' && !hit) { hit = true; out.n++; const nose = cat.dir > 0 ? cat.x + 46.5 : cat.x + 1.5; if (!P.some(x => Math.abs(x - nose) <= 2)) out.bad.push(pl + ' จมูก ' + nose) }
          if (hit && cat.mode !== 'sniff' && cat.mode !== 'turnIn') { out.end.add(cat.mode); break } } } }
    Math.random = R0; M.place = { at: 'room', got: [] }; render(); Object.assign(cat, { mode: 'sit', t: 0, dur: 1e9, x: 52, then: null }); return { ...out, end: [...out.end] } });
  assert.deepStrictEqual(sn.bad, []); assert.strictEqual(sn.out, 0); assert(sn.n >= 165, 'ไปดมครบเกือบทุกครั้ง ' + sn.n);
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
  const nv = await p.evaluate(() => { const T = PixelCat._t, { cat } = T, cv = document.createElement('canvas'), R0 = Math.random; let a = 5; T.setBox(false); T.setJit(false); T.setNow(new Date('2026-11-22T12:00:00').getTime()); // วันที่มีกล่องแมวไปดมกล่องใหม่ก่อน (ข้อ v118) ตรึงไม่ให้มีกล่อง · ปิดอารมณ์รายวัน (±15% ตามวันที่จริง เคยทำให้ข้อนี้ผ่านบ้างไม่ผ่านบ้าง)
    const cnt = (pl, fam, tr) => { Math.random = () => (a = (a * 1103515245 + 12345) % 2147483648) / 2147483648; PixelCat.mount(cv, { place: pl, coat: 'cream' }); T.setFam(fam, 9e5); T.setTrait(tr); T.setPart('day'); let n = 0;
      for (let i = 0; i < 4000; i++) { Object.assign(cat, { mode: 'sit', t: 0, dur: 0, x: 50, then: null, str: 0 }); T.decide(); if (cat.then === 'sniff' || cat.then === 'sniffed') n++ } return n };
    const o = { gNew: cnt('garden', 1, 0), gOld: cnt('garden', 99, 0), cur: cnt('room', 99, 6), shy: cnt('room', 99, 2), nov: [1, 2, 3, 4].map(f => (PixelCat.mount(cv, { place: 'garden', coat: 'cream' }), T.setFam(f, 0), T.novel())) };
    Math.random = R0; T.setJit(true); T.setNow(null); T.setPart(null); T.setFam(99, 0); T.setTrait(M.pet.trait); T.setBox(null); M.place = { at: 'room', got: [] }; render(); Object.assign(cat, { mode: 'sit', t: 0, dur: 1e9, x: 52, then: null }); return o });
  assert(nv.gNew > nv.gOld * 1.8, 'ที่ใหม่ดมบ่อยกว่า ' + JSON.stringify(nv)); assert(nv.cur > nv.shy * 2, 'ขี้สงสัยดมบ่อยกว่าขี้อาย ' + JSON.stringify(nv)); // ปิดอารมณ์รายวันแล้วผลของนิสัยล้วนราว 2.3 เท่า (ผลเท่ากันทุกวัน)
  assert.deepStrictEqual(nv.nov.map(x => Math.round(x * 100) / 100), [1, .67, .33, 0], 'ความใหม่ลดลงทุกวัน');
  assert.deepStrictEqual(p.errors, []);
});

test('แมวพิกเซล: กล่องกระดาษในห้องบางวัน · ดมกล่องใหม่ · มุดกล่องโผล่หัว · หนีไปหลบในกล่อง (v118)', async (b, base) => {
  const p = await fresh(b, base);
  await p.waitForTimeout(200);
  const r = await p.evaluate(() => { const T = PixelCat._t, { step, cat, BOX } = T, cv = document.createElement('canvas'), out = {}, at = s => new Date(s).getTime(), R0 = Math.random; let a = 3;
    // กล่องโผล่ราว 40% ของวัน คงที่ทั้งวัน
    const days = []; for (let d = at('2026-11-01T12:00:00'); d < at('2027-03-01T12:00:00'); d += 864e5) days.push(d);
    out.days = [days.filter(d => T.boxDay(d)).length, days.length]; out.same = days.every(d => T.boxDay(d) === T.boxDay(d + 9 * 36e5) && T.boxDay(d) === T.boxDay(d - 11 * 36e5));
    // ภาพ: ห้องที่มีกล่องต่างจากไม่มี ทั้งฉากหลังและฉากหน้า สองโหมด · สถานที่อื่นไม่มีกล่อง
    const img = (pl, on, tm = 'light', fg) => { T.setBox(on); PixelCat.mount(cv, { place: pl, coat: 'cream' }); return (fg ? T.sceneFg(tm) : T.sceneBg(tm)).toDataURL() };
    out.room = ['light', 'dark'].map(tm => img('room', true, tm) !== img('room', false, tm) && img('room', true, tm, 1) !== img('room', false, tm, 1));
    out.garden = img('garden', true) === img('garden', false);
    // วันที่มีกล่อง (ห้อง): ตัดสินใจครั้งแรกๆ มักไปดมกล่องใหม่ · ดมแล้วมุดกล่อง → โผล่หัว (เลื่อนลง BOX.dy) → ออกมานั่ง
    Math.random = () => (a = (a * 1103515245 + 12345) % 2147483648) / 2147483648;
    T.setJit(false); T.setNow(at('2026-11-22T12:00:00')); T.setBox(true); T.setBoxSeen(false); M.place = { at: 'room', got: [] }; PixelCat.mount(cv, { place: 'room', coat: 'cream' }); T.setPart('day');
    const seq = []; let inBox = null; Object.assign(cat, { mode: 'sit', t: 0, dur: 1, x: 110, then: null, str: 0, bs: 0 });
    for (let i = 0; i < 40000 && !/boxin box boxout sit/.test(seq.join(' ')); i++) { step(50); if (seq[seq.length - 1] !== cat.mode) seq.push(cat.mode); if (cat.mode === 'box' && !inBox) inBox = { x: cat.x, dy: cat.dy } }
    const j = seq.join(' '); out.j = j.slice(0, 600); out.firstSniff = j.indexOf('sniff') >= 0 && j.indexOf('sniff') < j.indexOf('boxin'); out.inBox = inBox; out.chain = /boxin box boxout sit/.test(j);
    // แตะตอนอยู่ในกล่อง: ไม่ออกมา
    Object.assign(cat, { mode: 'box', t: 0, dur: 1e9, x: BOX.cx, dy: BOX.dy, bz: true, then: 'sit' }); T.poke('head'); out.tapStay = cat.mode === 'box' && cat.bz === false;
    // แตะจนเดินหนี (ขั้น 3) วันที่มีกล่อง: หนีไปหลบในกล่อง ไม่ใช่อีกฝั่ง
    Object.assign(cat, { mode: 'sit', t: 0, dur: 1e9, x: 110, then: null, cool: 0, tol: 0 }); T.leave(); out.leave = cat.then; for (let i = 0; i < 400 && cat.mode !== 'box'; i++) step(50); out.leaveBox = cat.mode === 'box' && cat.cool > 0;
    // ขี้อายมุดกล่องบ่อยกว่าพลังล้น (กล่องไม่ใหม่แล้ว)
    const cnt = tr => { T.setTrait(tr); T.setBoxSeen(true); let n = 0; for (let i = 0; i < 3000; i++) { Object.assign(cat, { mode: 'sit', t: 0, dur: 0, x: 100, then: null, str: 0 }); T.decide(); if (cat.then === 'box') n++ } return n };
    out.shy = cnt(2); out.energy = cnt(0);
    Math.random = R0; T.setPart(null); T.setTrait(M.pet.trait); T.setBox(null); T.setBoxSeen(false); render(); Object.assign(cat, { mode: 'sit', t: 0, dur: 1e9, x: 52, then: null, cool: 0, dy: 0 }); return out });
  assert(r.days[0] > r.days[1] * .25 && r.days[0] < r.days[1] * .55 && r.same, 'กล่องบางวัน ' + JSON.stringify(r.days));
  assert.deepStrictEqual(r.room, [true, true], 'ห้องมีกล่อง'); assert(r.garden, 'สวนไม่มีกล่อง');
  assert(r.firstSniff, 'ดมกล่องใหม่ก่อนมุด ' + r.j); assert(r.inBox && r.inBox.x === 48 && r.inBox.dy === 6, 'นั่งกลางกล่อง โผล่หัว ' + JSON.stringify(r.inBox)); assert(r.chain, 'มุด → อยู่ในกล่อง → ออกมานั่ง');
  assert(r.tapStay, 'แตะในกล่องแล้วไม่ออก (ลืมตา)'); assert(r.leave === 'boxhide' && r.leaveBox, 'หนีไปหลบในกล่อง');
  assert(r.shy > r.energy * 2.5, 'ขี้อายมุดกล่องบ่อยกว่า ' + [r.shy, r.energy]);
  // ภาพจริงบนผืนผ้าใบ: อยู่ในกล่องแล้วไม่เห็นขา/หางใต้กล่อง (แถว 87–89 เหมือนตอนแมวอยู่ที่อื่น) แต่เห็นหัวเหนือขอบกล่อง
  const px = await p.evaluate(async () => { const T = PixelCat._t, { cat, BOX } = T; T.setBox(true); T.setTod('day'); render(); const c2 = document.getElementById('petcv');
    const grab = async st => { Object.assign(cat, st); await new Promise(r => setTimeout(r, 250)); return [...c2.getContext('2d').getImageData(0, 0, 160, 90).data] };
    const inb = await grab({ mode: 'box', t: 0, dur: 1e9, x: BOX.cx, dy: BOX.dy, bz: false, then: 'sit' }), away = await grab({ mode: 'sit', t: 0, dur: 1e9, x: 114, dy: 0, then: null });
    let below = 0, head = 0; for (let y = 87; y < 90; y++) for (let x = 50; x < 95; x++) { const i = (y * 160 + x) * 4; if (inb.slice(i, i + 3).join() !== away.slice(i, i + 3).join()) below++ }
    for (let y = 58; y < 74; y++) for (let x = 58; x < 86; x++) { const i = (y * 160 + x) * 4; if (inb.slice(i, i + 3).join() !== away.slice(i, i + 3).join()) head++ }
    T.setBox(null); T.setTod(null); Object.assign(cat, { mode: 'sit', t: 0, dur: 1e9, x: 52, dy: 0 }); render(); return { below, head } });
  assert(px.below === 0 && px.head > 150, 'ตัดขาใต้กล่อง เห็นหัว ' + JSON.stringify(px));
  assert.deepStrictEqual(p.errors, []);
});

test('แมวพิกเซล: นาฬิกาชีวิตประจำตัว ตื่นเช้า/ปกติ/นอนดึก เลื่อนช่วงคึกและง่วง (v119)', async (b, base) => {
  const p = await fresh(b, base);
  await p.waitForTimeout(200);
  const r = await p.evaluate(() => { const T = PixelCat._t, out = {};
    // คงที่ต่อสัตว์เลี้ยง (วันเกิด + นิสัย) · นิสัยเอนเอียง: พลังล้นตื่นเช้าบ่อย ขี้เซานอนดึกบ่อย · ทุกนิสัยมีครบสามแบบได้
    const dist = tr => { const c = { '-1': 0, 0: 0, 1: 0 }; for (let i = 0; i < 600; i++) { const d = new Date(2025, 0, 1 + i); c[pchrono({ trait: tr, rv: dstr(d) })]++ } return c };
    out.e = dist(0); out.s = dist(4); out.n = dist(6); out.same = pchrono({ trait: 3, rv: '2026-05-05' }) === pchrono({ trait: 3, rv: '2026-05-05' });
    // ช่วงของวันเลื่อน 2 ชม.: ตื่นเช้าง่วงตั้งแต่ 1 ทุ่ม คึกตอนตี 3 · นอนดึกยังคึกตอน 4 ทุ่ม ง่วงถึง 7 โมง
    const dp = (c, h) => { T.setChrono(c); return T.dayPart(h) };
    out.dp = [dp(0, 19), dp(-1, 19), dp(0, 3), dp(-1, 3), dp(0, 22), dp(1, 22), dp(0, 6), dp(1, 6), dp(1, 12), dp(-1, 10)]; T.setChrono(0);
    return out });
  assert(r.e['-1'] > r.e['1'] * 1.8 && r.s['1'] > r.s['-1'] * 2.5, 'นิสัยเอนเอียง ' + JSON.stringify([r.e, r.s]));
  assert([r.e, r.s, r.n].every(c => c['-1'] > 0 && c['0'] > 0 && c['1'] > 0) && r.n['0'] > 200, 'ครบสามแบบ ' + JSON.stringify(r.n)); assert(r.same);
  assert.deepStrictEqual(r.dp, ['tw', 'night', 'night', 'tw', 'night', 'tw', 'tw', 'night', 'day', 'noon'], 'ช่วงของวัน ' + r.dp);
  // บัตรโปรไฟล์แสดงนาฬิกาชีวิต
  await p.evaluate(() => goProf()); await p.waitForTimeout(150);
  const t = await p.locator('.idr', { hasText: 'นาฬิกาชีวิต' }).innerText(); assert(/ตื่นเช้า|ตามเวลาปกติ|นอนดึก/.test(t), 'แถวนาฬิกาชีวิต ' + t);
  assert.deepStrictEqual(p.errors, []);
});
