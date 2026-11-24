// e2e: ร้านค้าโคบัง (小判) · ได้โคบังจากผลการเรียน · แลกของ · ถุงโชคดี · อาหารและตู้กับข้าว · รันผ่าน node tests/e2e.js [คำในชื่อข้อ]
// แบบที่เจ้าของเลือก (2026-11-23): หน้าร้านและแผ่นล่างแบบ ข · แลกแล้วไปใส่ที่คลังสะสมแบบ ค · ถุงโชคดีก่อนเปิดแบบ ก + อนิเมชัน · หลังเปิดแบบ ค · อาหารแบบ ค เป็นหน้าต่างรูปอาหาร
// ตั้งข้อมูลก่อนเปิดแอปผ่าน localStorage แล้วกดและอ่านจากหน้าจอด้วย data-testid เท่านั้น
// สมุดโคบัง kn_meta.kbl = [[คีย์, จำนวน, เวลา ms, เหตุผล]] · คีย์ buy:<รหัส> / bag:<รหัส> = ของที่มี
const { assert, test, SEED, snap } = require('./harness');

// เปิดแอปด้วยข้อมูลตั้งต้น · streak = จำนวนวันติดกันที่ถึงเป้าจนถึงวันนี้ · missions = ทำภารกิจวันนี้ครบแล้วแต่ยังไม่กดรับ
async function open(b, base, { pet = {}, meta = {}, store = {}, streak = 0, missions = false, clock, reduce, viewport } = {}) {
  const ctx = await b.newContext({ viewport: viewport || { width: 820, height: 1180 }, serviceWorkers: 'block', reducedMotion: reduce ? 'reduce' : 'no-preference' });
  const p = await ctx.newPage(); p.errors = [];
  p.on('pageerror', e => p.errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error') p.errors.push(m.text()); });
  if (clock) await p.clock.install({ time: clock });
  await p.addInitScript(([seed, pet, meta, store, streak, missions]) => {
    if (localStorage.getItem('kn_meta')) return;
    const ds = x => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
    const m = { ...seed, ...meta, pet: { ...seed.pet, ...pet }, days: {} };
    for (let i = 0; i < streak; i++) { const d = new Date(); d.setDate(d.getDate() - i); m.days[ds(d)] = m.goal; }
    if (missions) m.pet.d = { date: ds(new Date()), rev: 99, neu: 99, dlg: 1, done: { rev: 1, neu: 1, dlg: 1 }, cl: {}, r: [] };
    localStorage.setItem('kn_meta', JSON.stringify(m));
    for (const k in store) localStorage.setItem(k, JSON.stringify(store[k]));
  }, [SEED, pet, meta, store, streak, missions]);
  await p.goto(base);
  return p;
}
const kmeta = p => p.evaluate(() => JSON.parse(localStorage.getItem('kn_meta')));
const koban = async p => +(await p.getByTestId('shop-koban').innerText()).replace(/\D/g, '');
const shop = p => p.getByTestId('nav-shop').click();
const mastered = n => Object.fromEntries([...'一二三四五六七八九十百千万円日月火水木金土曜本人今年上下中大小山川田口目耳手足父母子女男先生学校'].slice(0, n).map(k => [k, { b: 4, d: '2026-01-01' }]));
const rich = n => ({ kbl: [['test:seed', n, 1, 'ทดสอบ']] });

test('ร้านโคบัง: ได้โคบังจากผลการเรียน (จำได้แม่นย้อนหลัง +2/ข้อ · รับภารกิจ +5 · ครบ 3 อย่าง +5 · สตรีค 7/30 วัน) · ไม่ได้ซ้ำ · ลืมแล้วจำได้ใหม่ไม่ได้อีก', async (b, base) => {
  const p = await open(b, base, { store: { kn5: mastered(31) }, streak: 7, missions: true });
  await shop(p);
  assert.strictEqual(await koban(p), 62 + 30, 'ย้อนหลัง 31 ข้อ = 62 + สตรีค 7 วัน 30');
  await p.getByTestId('shop-log-toggle').click();
  let log = await p.getByTestId('shop-log').innerText();
  await snap(p, 'wallet-log');
  assert(log.includes('จำได้แม่นเพิ่ม 31 ข้อ') && log.includes('+62') && log.includes('เรียนติดกัน 7 วัน') && log.includes('+30'), log);
  await p.reload(); await shop(p);
  assert.strictEqual(await koban(p), 92, 'เปิดแอปใหม่ต้องไม่ได้ซ้ำ');
  // รับภารกิจ: +5 ต่อภารกิจ และครบ 3 อย่างได้อีก +5 · Energy ได้ตามเดิม
  await p.getByTestId('nav-home').click();
  for (const id of ['rev', 'neu', 'dlg']) await p.getByTestId('mission-claim-' + id).click();
  await shop(p);
  assert.strictEqual(await koban(p), 92 + 15 + 5);
  await p.getByTestId('shop-log-toggle').click();
  log = await p.getByTestId('shop-log').innerText();
  assert(log.includes('รับภารกิจ') && log.includes('ภารกิจครบ 3 อย่าง'), log);
  assert.strictEqual((await kmeta(p)).pet.energy, 70, 'Energy จากภารกิจยังได้เหมือนเดิม');
  // ลืมไป 1 ข้อแล้วจำได้ใหม่: จุดสูงสุดเดิมคือ 31 จึงไม่ได้เพิ่ม · จำได้แม่นข้อใหม่จริง (32) ถึงได้ +2
  for (const [n, want] of [[30, 112], [31, 112], [32, 114]]) {
    await p.evaluate(k => localStorage.setItem('kn5', JSON.stringify(k)), mastered(n));
    await p.reload(); await shop(p);
    assert.strictEqual(await koban(p), want, 'จำได้แม่น ' + n + ' ข้อ');
  }
  // สตรีค 30 วัน: ได้ทั้ง 7 วัน (+30) และ 30 วัน (+100) ครั้งเดียวต่อรอบ
  const q = await open(b, base, { streak: 30 });
  await shop(q);
  assert.strictEqual(await koban(q), 130);
  await q.reload(); await shop(q);
  assert.strictEqual(await koban(q), 130, 'สตรีครอบเดิมไม่ได้ซ้ำ');
  assert.deepStrictEqual([...p.errors, ...q.errors], []);
});

test('ร้านโคบัง: หน้าร้านแบบตู้สะสม · แตะของแล้วแผ่นล่างลองใส่ · แลกแล้วไม่ใส่ให้เอง ไปใส่ที่คลังสะสม · ของจากเป้าการเรียนซื้อไม่ได้ · ไม่มีเงินจริง', async (b, base) => {
  const p = await open(b, base, { meta: rich(500) });
  await shop(p);
  const t = await p.locator('#app').innerText();
  assert(t.includes('ลายขน') && t.includes('ของแต่ง') && t.includes('อาหาร') && t.includes('ไม่ใช้เงินจริง') && !/฿|บาท|THB/.test(t), t.slice(0, 400));
  assert.strictEqual(await koban(p), 500);
  // แตะ → แผ่นล่างลองใส่ (ยังไม่จ่าย)
  await p.getByTestId('shop-tab-coat').click();
  await p.getByTestId('shop-item-coat:siamese').click();
  const sh = p.getByTestId('shop-sheet');
  await sh.waitFor();
  assert((await sh.innerText()).includes('วิเชียรมาศ') && (await sh.innerText()).includes('หายาก'));
  assert.strictEqual(await p.getByTestId('shop-preview').getAttribute('data-coat'), 'siamese', 'แผ่นล่างลองใส่ลายที่แตะ');
  assert.strictEqual(await p.getByTestId('shop-buy').innerText(), 'แลก 300 โคบัง');
  await snap(p, 'sheet-tryon');
  assert.strictEqual(await koban(p), 500, 'แค่แตะดูยังไม่จ่าย');
  await p.getByTestId('shop-buy').click();
  await p.getByTestId('toast').filter({ hasText: 'ใส่ได้ที่คลังสะสม' }).waitFor();
  assert.strictEqual(await koban(p), 200);
  assert((await sh.innerText()).includes('มีแล้ว'));
  await snap(p, 'sheet-bought');
  assert.strictEqual((await kmeta(p)).pet.coat || 'cream', 'cream', 'แลกแล้วยังไม่ใส่ให้เอง');
  // ไปใส่ที่คลังสะสม
  await p.getByTestId('shop-go-col').click();
  await p.getByTestId('col-coat:siamese').click();
  assert.strictEqual((await kmeta(p)).pet.coat, 'siamese');
  assert((await p.getByTestId('col-coat:siamese').innerText()).includes('ใส่อยู่'));
  await p.getByTestId('col-coat:siamese').scrollIntoViewIfNeeded(); await snap(p, 'collection-wear');
  // แลกครั้งที่สองจนโคบังหมด แล้วชิ้นถัดไปปุ่มแลกกดไม่ได้และบอกว่าขาดเท่าไร
  await shop(p);
  assert((await p.getByTestId('shop-item-coat:siamese').innerText()).includes('ใส่อยู่'));
  await p.getByTestId('shop-item-coat:orange').click(); await p.getByTestId('shop-buy').click();
  assert.strictEqual(await koban(p), 0);
  await p.getByTestId('shop-sheet-close').click();
  await p.getByTestId('shop-tab-deco').click();
  await p.getByTestId('shop-item-acc:bow').click();
  assert(await p.getByTestId('shop-buy').isDisabled());
  assert((await p.getByTestId('shop-sheet').innerText()).includes('ขาดอีก 120'));
  await p.getByTestId('shop-sheet-close').click();
  // สามสีได้จากเป้าการเรียนเท่านั้น · ของแต่งห้องยังไม่ได้วาด = เร็วๆ นี้ ซื้อไม่ได้
  await p.getByTestId('shop-tab-coat').click();
  await p.getByTestId('shop-item-coat:calico').click();
  assert((await p.getByTestId('shop-sheet').innerText()).includes('จำได้แม่นครบ 250 ข้อ'));
  assert.strictEqual(await p.getByTestId('shop-buy').count(), 0);
  await p.getByTestId('shop-sheet-close').click();
  await p.getByTestId('shop-tab-deco').click();
  await p.getByTestId('shop-item-room:daruma').click();
  assert((await p.getByTestId('shop-sheet').innerText()).includes('เร็วๆ นี้'));
  assert.strictEqual(await p.getByTestId('shop-buy').count(), 0);
  // เครื่องประดับใส่/ถอดที่คลังสะสม
  const q = await open(b, base, { meta: { kbl: [['test:seed', 120, 1, 'ทดสอบ']] } });
  await shop(q); await q.getByTestId('shop-tab-deco').click(); await q.getByTestId('shop-item-acc:bow').click(); await q.getByTestId('shop-buy').click(); await q.getByTestId('shop-go-col').click();
  await q.getByTestId('col-acc:bow').click(); assert.strictEqual((await kmeta(q)).pet.acc, 'bow');
  await q.getByTestId('col-acc:bow').click(); assert.strictEqual((await kmeta(q)).pet.acc, 'none', 'แตะอีกครั้ง = ถอด');
  // กระต่าย: ไม่มีลายขน/เครื่องประดับ (มีแต่แมว) แต่มีอาหาร
  const r = await open(b, base, { pet: { sp: 1 } });
  await shop(r);
  assert.strictEqual(await r.getByTestId('shop-tab-coat').count(), 0, 'กระต่ายไม่มีแท็บลายขน');
  await r.getByTestId('shop-tab-deco').click();
  assert.strictEqual(await r.locator('[data-testid^="shop-item-coat:"], [data-testid^="shop-item-acc:"]').count(), 0);
  await r.getByTestId('shop-tab-food').click();
  assert(await r.getByTestId('food-item-milk').isVisible());
  assert.deepStrictEqual([...p.errors, ...q.errors, ...r.errors], []);
});

test('ถุงโชคดี: ก่อนจ่ายบอกรายชื่อของและโอกาส · ราคา 150 หรือค่าเฉลี่ยของที่เหลือลบ 10% แล้วแต่อันไหนต่ำกว่า · อนิเมชันเปิดถุง · ได้ของที่ยังไม่มีไม่ซ้ำจนครบ', async (b, base) => {
  // เปิดหนึ่งครั้งพร้อมอนิเมชัน
  const p = await open(b, base, { meta: rich(1000) });
  await shop(p);
  await p.getByTestId('shop-bag-open').click();
  const dlg = p.getByTestId('shop-bag-dialog');
  await dlg.waitFor();
  const txt = await dlg.innerText();
  const names = ['ส้มลายเสือ', 'เทาลายเสือ', 'ขาวล้วน', 'ดำล้วน', 'ขาวดำ', 'สีสวาด', 'วิเชียรมาศ', 'ผ้าพันคอ', 'โบว์'];
  assert(names.every(n => txt.includes(n)) && !txt.includes('สามสี') && !txt.includes('ดารุมะ'), 'รายชื่อเฉพาะของที่สุ่มได้: ' + txt);
  assert((await p.getByTestId('shop-bag-odds').innerText()).includes('1/9'));
  assert.strictEqual(await p.getByTestId('shop-bag-price').innerText(), '150');
  await snap(p, 'bag-ask');
  await p.getByTestId('shop-bag-confirm').click();
  await p.getByTestId('bag-anim').waitFor();
  await p.waitForTimeout(400); await p.screenshot({ path: 'test-results/e2e/bag-anim-mid.png' });
  await p.getByTestId('bag-reveal').waitFor();
  const got = (await p.getByTestId('bag-reveal-name').innerText()).trim();
  assert(names.includes(got), got);
  await p.waitForTimeout(600); await snap(p, 'bag-reveal');
  assert.strictEqual(await p.getByTestId('bag-anim').count(), 0, 'อนิเมชันจบแล้วหายไป');
  await p.getByTestId('bag-reveal-close').click();
  assert.strictEqual(await koban(p), 850);
  const gotId = (await kmeta(p)).kbl.find(r => r[0].startsWith('bag:'))[0].slice(4);
  await p.getByTestId(gotId.startsWith('coat:') ? 'shop-tab-coat' : 'shop-tab-deco').click();
  assert((await p.getByTestId('shop-item-' + gotId).innerText()).includes('มีแล้ว'));
  // เปิดจนครบ (ปิดอนิเมชันในระบบ = ข้ามอนิเมชัน) ได้ครบ 9 ชิ้นไม่ซ้ำ แล้วถุงปิด
  const q = await open(b, base, { meta: rich(5000), reduce: true });
  await shop(q);
  const seen = [];
  for (let i = 0; i < 9; i++) {
    await q.getByTestId('shop-bag-open').click(); await q.getByTestId('shop-bag-confirm').click();
    assert.strictEqual(await q.getByTestId('bag-anim').count(), 0, 'ปิดอนิเมชันในระบบต้องไม่เล่น');
    seen.push((await q.getByTestId('bag-reveal-name').innerText()).trim());
    await q.getByTestId('bag-reveal-close').click();
  }
  assert.deepStrictEqual([...seen].sort(), [...names].sort(), 'ไม่ซ้ำและครบ: ' + seen);
  assert((await q.getByTestId('shop-bag-open').innerText()).includes('สะสมครบ'));
  assert(await q.getByTestId('shop-bag-open').isDisabled());
  // เหลือแต่ของ 120 สองชิ้น: ค่าเฉลี่ย 120 ลบ 10% = 108
  const own = ['coat:orange', 'coat:silver', 'coat:white', 'coat:black', 'coat:tuxedo', 'coat:korat', 'coat:siamese'].map(id => ['buy:' + id, -1, 1, 'ทดสอบ']);
  const r = await open(b, base, { meta: { kbl: [['test:seed', 500, 1, 'ทดสอบ'], ...own] } });
  await shop(r); await r.getByTestId('shop-bag-open').click();
  assert.strictEqual(await r.getByTestId('shop-bag-price').innerText(), '108');
  assert((await r.getByTestId('shop-bag-odds').innerText()).includes('1/2'));
  assert.deepStrictEqual([...p.errors, ...q.errors, ...r.errors], []);
});

test('อาหาร: ซื้อด้วย Energy เข้าตู้กับข้าว · หน้าต่างให้อาหารมีรูปอาหาร · ป้อนแล้วสนิทเพิ่ม หิวลด ของในตู้ลด Energy ไม่ลด · อิ่มแล้วไม่กิน · หิวเพิ่มชั่วโมงละ 4', async (b, base) => {
  const T = new Date('2026-11-23T10:00:00').getTime();
  const p = await open(b, base, { clock: T, pet: { energy: 100, bond: 0, hg: 60, ht: T } });
  await shop(p);
  assert((await p.getByTestId('food-item-fish').getAttribute('aria-label')).includes('ในตู้ 0'));
  await p.getByTestId('food-item-fish').click();
  await p.getByTestId('food-buy').click();
  assert.strictEqual((await kmeta(p)).pet.energy, 55);
  assert((await p.getByTestId('shop-sheet').innerText()).includes('ในตู้ 1'), 'ซื้อแล้วแผ่นยังเปิดอยู่ ซื้อเพิ่มได้');
  await p.getByTestId('shop-sheet-close').click();
  assert((await p.getByTestId('food-item-fish').getAttribute('aria-label')).includes('ในตู้ 1') && (await p.getByTestId('food-item-fish').innerText()).includes('×1'));
  await p.getByTestId('food-item-sushi').click();
  assert(await p.getByTestId('food-buy').isDisabled(), 'Energy 55 ไม่พอซูชิ 70');
  assert((await p.getByTestId('shop-sheet').innerText()).includes('Energy ไม่พอ'));
  await p.getByTestId('shop-sheet-close').click();
  // หน้าแรก → ให้อาหาร → หน้าต่างรูปอาหาร
  await p.getByTestId('nav-home').click();
  assert.strictEqual(await p.getByTestId('pet-hunger').getAttribute('aria-valuenow'), '60');
  await p.getByTestId('pet-feed').click();
  await p.getByTestId('feed-dialog').waitFor();
  for (const k of ['milk', 'katsuo', 'dango', 'tamago', 'onigiri', 'fish', 'udon', 'sushi']) assert(await p.getByTestId('food-img-' + k).isVisible(), 'รูปอาหาร ' + k);
  assert(await p.getByTestId('feed-milk').isDisabled(), 'ไม่มีในตู้กดไม่ได้');
  assert((await p.getByTestId('feed-fish').innerText()).includes('×1'));
  await snap(p, 'feed-dialog');
  await p.getByTestId('feed-fish').click();
  assert.strictEqual(await p.getByTestId('feed-dialog').count(), 0, 'ป้อนแล้วหน้าต่างปิด');
  const m = await kmeta(p);
  assert.deepStrictEqual([m.pet.energy, m.pet.bond, m.pet.food.fish], [55, 16, 0]);
  assert.strictEqual(await p.getByTestId('pet-hunger').getAttribute('aria-valuenow'), '0');
  assert.match(await p.getByTestId('pet-bond').innerText(), /16 \/ 120/);
  await p.getByTestId('pet-feed').scrollIntoViewIfNeeded(); await snap(p, 'after-feed');
  // อิ่มแล้ว (หิวน้อยกว่า 10) ไม่กิน ของในตู้ไม่ลด
  await shop(p); await p.getByTestId('food-item-milk').click(); await p.getByTestId('food-buy').click(); await p.getByTestId('shop-sheet-close').click();
  await p.getByTestId('nav-home').click(); await p.getByTestId('pet-feed').click(); await p.getByTestId('feed-milk').click();
  await p.getByTestId('toast').filter({ hasText: 'อิ่มแล้ว' }).waitFor();
  assert.deepStrictEqual([(await kmeta(p)).pet.food.milk, (await kmeta(p)).pet.bond], [1, 16]);
  await p.getByTestId('feed-close').click();
  // ผ่านไป 10 ชั่วโมง หิว 40
  await p.clock.fastForward('10:00:00');
  await p.getByTestId('nav-shop').click(); await p.getByTestId('nav-home').click();
  assert.strictEqual(await p.getByTestId('pet-hunger').getAttribute('aria-valuenow'), '40');
  // ตู้ว่าง: หน้าต่างบอกให้ไปซื้อที่ร้าน
  const q = await open(b, base, {});
  await q.getByTestId('pet-feed').click();
  assert((await q.getByTestId('feed-dialog').innerText()).includes('ตู้กับข้าวว่าง'));
  await q.getByTestId('feed-go-shop').click();
  assert(await q.getByTestId('food-item-milk').isVisible());
  assert.deepStrictEqual([...p.errors, ...q.errors], []);
});

test('สมุดโคบัง: ยาวเกิน 300 รายการแล้วย่อ · ยอดคงเหลือ ของที่มี และรายการกันได้ซ้ำยังอยู่', async (b, base) => {
  const old = Date.now() - 200 * 864e5;
  const rows = [['buy:acc:bow', -120, old, 'แลกโบว์'], ['mast:N5:10', 20, old, 'จำได้แม่นเพิ่ม 10 ข้อ'], ['s7:2026-01-01', 30, old, 'เรียนติดกัน 7 วัน']];
  for (let i = 0; i < 400; i++) rows.push(['m:2025-' + i + ':rev', 5, old, 'รับภารกิจ']);
  const p = await open(b, base, { meta: { kbl: rows }, missions: true });
  const m = await kmeta(p);
  assert(m.kbl.length <= 300, 'ย่อแล้วเหลือ ' + m.kbl.length);
  assert.strictEqual(m.kbl.reduce((a, r) => a + r[1], 0), -120 + 20 + 30 + 2000, 'ยอดคงเหลือเท่าเดิม');
  assert(['buy:acc:bow', 'mast:N5:10', 's7:2026-01-01'].every(k => m.kbl.some(r => r[0] === k)), 'คีย์ที่ต้องใช้กันได้ซ้ำยังอยู่');
  await shop(p);
  assert.strictEqual(await koban(p), 1930);
  await p.getByTestId('shop-tab-deco').click();
  assert((await p.getByTestId('shop-item-acc:bow').innerText()).includes('มีแล้ว'));
  assert.deepStrictEqual(p.errors, []);
});

test('อาหาร: รูปพิกเซลครบทั้ง 8 ชนิด (นม ข้าวโรยปลาโอแห้ง ดังโงะ ไข่ม้วน ข้าวปั้น ปลาย่าง อุด้ง ซูชิ) ตารางละ 32×32 ใช้แต่สีที่มีในชุดสี และวาดลงหน้าต่างให้อาหารจริง', async (b, base) => {
  const p = await open(b, base, { pet: { food: { milk: 1, katsuo: 1, dango: 1, tamago: 1, onigiri: 1, fish: 1, udon: 1, sushi: 1 } } });
  const bad = await p.evaluate(() => FOOD.flatMap(f => {
    const rows = FOODART[f.k];
    if (!rows) return [f.k + ': ไม่มีรูป'];
    if (rows.length !== 32) return [f.k + ': มี ' + rows.length + ' แถว'];
    return rows.flatMap((r, y) => [...(r.length !== 32 ? [f.k + ' แถว ' + y + ': กว้าง ' + r.length] : []), ...[...r].filter(ch => ch !== '.' && !FPAL[ch]).map(ch => f.k + ' แถว ' + y + ': ไม่มีสี "' + ch + '"')]);
  }));
  assert.deepStrictEqual(bad, []);
  assert.deepStrictEqual(await p.evaluate(() => FOOD.map(f => [f.k, f.n, f.e, f.b, f.h])), [['milk', 'นมอุ่นๆ', 15, 4, 20], ['katsuo', 'ข้าวโรยปลาโอแห้ง', 20, 6, 25], ['dango', 'ดังโงะ 3 สี', 20, 6, 20], ['tamago', 'ไข่ม้วนทามาโกะยากิ', 25, 8, 30], ['onigiri', 'ข้าวปั้นปลา', 30, 10, 40], ['fish', 'ปลาย่าง', 45, 16, 60], ['udon', 'อุด้งร้อน', 55, 20, 80], ['sushi', 'ซูชิมื้อพิเศษ', 70, 26, 100]], 'อาหาร 8 ชนิดเรียงตามราคา');
  await p.getByTestId('pet-feed').click();
  for (const k of ['milk', 'katsuo', 'dango', 'tamago', 'onigiri', 'fish', 'udon', 'sushi']) {
    const drawn = await p.getByTestId('food-img-' + k).evaluate(c => { const d = c.getContext('2d').getImageData(0, 0, 32, 32).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 200) n++; return n; });
    assert(drawn > 250, k + ' วาดได้ ' + drawn + ' พิกเซล');
  }
  // 8 เมนูต้องอยู่ในหน้าต่างบนจอ iPad แนวตั้งโดยไม่ต้องเลื่อน
  const box = await p.getByTestId('feed-dialog').boundingBox();
  assert(box.y >= 0 && box.y + box.height <= 1180, 'หน้าต่างล้นจอ ' + JSON.stringify(box));
  await snap(p, 'feed-dialog-art');
  assert.deepStrictEqual(p.errors, []);
});

test('ร้านค้า: สมุดเมนูแบ่งแท็บ อาหาร/ลายขน/ของแต่ง · แถวละ 3 ช่อง · ราคาใต้รูป · ของที่ซื้อไม่ได้เป็นฝาครอบติดแม่กุญแจ · พื้นหลังห้องแมว', async (b, base) => {
  const p = await open(b, base, { meta: rich(300) });
  await shop(p);
  const tabs = async () => p.evaluate(() => [...document.querySelectorAll('[data-testid^="shop-tab-"]')].map(e => [e.dataset.testid.slice(9), e.getAttribute('aria-selected')]));
  assert.deepStrictEqual(await tabs(), [['food', 'true'], ['coat', 'false'], ['deco', 'false']], 'เปิดมาที่แท็บอาหาร');
  assert.strictEqual(await p.locator('[data-testid^="food-item-"]').count(), 8);
  assert.strictEqual(await p.locator('[data-testid^="shop-item-"]').count(), 0, 'แท็บอาหารไม่มีของแต่ง');
  assert.match(await p.getByTestId('food-item-udon').innerText(), /อุด้งร้อน\s*55/);
  // แถวละไม่เกิน 3 ช่อง และทุกช่องในแถวเดียวกันอยู่บรรทัดเดียวกัน
  const rows = await p.evaluate(() => [...document.querySelectorAll('.shrow')].map(r => [...r.children].map(c => Math.round(c.getBoundingClientRect().top))));
  assert(rows.length === 3 && rows.every(r => r.length <= 3 && new Set(r).size === 1), JSON.stringify(rows));
  assert.strictEqual(await p.evaluate(() => document.body.dataset.tab), 'shop', 'พื้นหลังห้องแมวผูกกับแท็บร้านค้า');
  await p.getByTestId('shop-tab-coat').click();
  assert.deepStrictEqual((await tabs()).find(t => t[1] === 'true'), ['coat', 'true']);
  assert.strictEqual(await p.locator('[data-testid^="shop-item-coat:"]').count(), 9);
  assert.match(await p.getByTestId('shop-item-coat:orange').innerText(), /ส้มลายเสือ\s*200/);
  assert.strictEqual(await p.getByTestId('shop-item-coat:calico').locator('.shclo').count(), 1, 'สามสี (ได้จากเป้า) เป็นฝาครอบ');
  assert.strictEqual(await p.getByTestId('shop-item-coat:orange').locator('.shclo').count(), 0, 'ของที่ซื้อได้เห็นรูปจริง');
  await p.getByTestId('shop-tab-deco').click();
  for (const id of ['room:daruma', 'room:poster', 'room:plant', 'room:rug']) assert.strictEqual(await p.getByTestId('shop-item-' + id).locator('.shclo').count(), 1, id + ' ยังไม่ได้วาด เป็นฝาครอบ');
  assert.strictEqual(await p.locator('[data-testid^="shop-item-acc:"]').count(), 2);
  await p.getByTestId('nav-home').click();
  assert.strictEqual(await p.evaluate(() => document.body.dataset.tab), 'home', 'ออกจากร้านแล้วพื้นหลังกลับเป็นปกติ');
  assert.deepStrictEqual(p.errors, []);
});
