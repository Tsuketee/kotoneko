// e2e: ร้านสะดวกซื้อในฉาก (แมพ) · ตะกร้าแบบสมุดเมนู 4 หมวด · แคชเชียร์ถามเป็นประโยคญี่ปุ่น · ลดราคาตอนดึก · รันผ่าน node tests/e2e.js [คำในชื่อข้อ]
// แบบที่เจ้าของเลือก (2026-11-24): ต้นแบบ ข ตะกร้า + แคชเชียร์ · ช่องสินค้าแบบหน้าร้าน (แถวละ 3 รูป + ราคา + ×จำนวน) · แท็บ ขนมทานเล่น/อาหารรองท้อง/อาหารแช่แข็ง/ของหวาน
// กดและอ่านจากหน้าจอด้วย data-testid · ตั้งข้อมูลตั้งต้นผ่าน localStorage · เวลาใช้ page.clock
const { assert, test, SEED, snap } = require('./harness');

async function open(b, base, { pet = {}, at = 'konbini', clock = '2026-11-24T15:00:00' } = {}) {
  const ctx = await b.newContext({ viewport: { width: 820, height: 1180 }, serviceWorkers: 'block' });
  const p = await ctx.newPage(); p.errors = [];
  p.on('pageerror', e => p.errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error') p.errors.push(m.text()); });
  const T = new Date(clock).getTime();
  await p.clock.install({ time: T });
  await p.addInitScript(([seed, pet, at, T]) => {
    if (localStorage.getItem('kn_meta')) return;
    localStorage.setItem('kn_meta', JSON.stringify({ ...seed, place: { at, got: [at] }, pet: { ...seed.pet, energy: 200, hg: 80, ht: T, ...pet } }));
  }, [SEED, pet, at, T]);
  await p.goto(base);
  return p;
}
const kmeta = p => p.evaluate(() => JSON.parse(localStorage.getItem('kn_meta')));
const enter = async p => { await p.getByTestId('place-shop').click(); await p.getByTestId('kbn-sheet').waitFor(); };
const total = async p => +(await p.getByTestId('kbn-total').innerText()).replace(/\D/g, '');
const MENU = {
  snack: [['niboshi', 'にぼし', 10], ['treat', 'ねこのおやつ', 10], ['dry', 'カリカリ', 15]],
  light: [['konigiri', 'おにぎり', 25], ['kegg', 'ゆでたまご', 15], ['chicken', 'サラダチキン', 35], ['sand', 'たまごサンド', 25]],
  frozen: [['fudon', 'れいとううどん', 45], ['ffish', 'やきざかな', 45], ['bento', 'さけべんとう', 55]],
  sweet: [['kmilk', 'ねこようミルク', 15], ['pudding', 'ねこようプリン', 20], ['ice', 'ねこようアイス', 20]],
};

test('คอนบินิ: เข้าร้านจากฉาก · แท็บ ขนมทานเล่น/อาหารรองท้อง/อาหารแช่แข็ง/ของหวาน · แถวละ 3 ช่อง · แตะใส่ตะกร้า (×จำนวน) · เอาออกได้ · Energy ไม่พอหยิบเพิ่มไม่ได้', async (b, base) => {
  const away = await open(b, base, { at: 'room' });
  assert.strictEqual(await away.getByTestId('place-shop').count(), 0, 'อยู่ที่อื่นไม่มีปุ่มเข้าร้าน');
  const p = await open(b, base, { pet: { energy: 70 } });
  await enter(p);
  assert((await p.getByTestId('kbn-sheet').innerText()).includes('いらっしゃいませ'));
  const tabs = () => p.evaluate(() => [...document.querySelectorAll('[data-testid^="kbn-tab-"]')].map(e => [e.dataset.testid.slice(8), e.innerText.trim(), e.getAttribute('aria-selected')]));
  assert.deepStrictEqual(await tabs(), [['snack', 'ขนมทานเล่น', 'true'], ['light', 'อาหารรองท้อง', 'false'], ['frozen', 'อาหารแช่แข็ง', 'false'], ['sweet', 'ของหวาน', 'false']]);
  for (const [t, items] of Object.entries(MENU)) {
    await p.getByTestId('kbn-tab-' + t).click();
    const ids = await p.evaluate(() => [...document.querySelectorAll('[data-testid^="kbn-item-"]')].map(e => e.dataset.testid.slice(9)));
    assert.deepStrictEqual(ids, items.map(i => i[0]), 'ของในแท็บ ' + t);
    for (const [k, jp, e] of items) {
      const cell = p.getByTestId('kbn-item-' + k);
      assert((await cell.innerText()).includes(jp) && (await cell.innerText()).includes(String(e)), k + ': ' + await cell.innerText());
    }
    const rows = await p.evaluate(() => [...document.querySelectorAll('.kbn-sheet .shrow')].map(r => r.children.length));
    assert(rows.every(n => n <= 3), 'แถวละไม่เกิน 3 ช่อง ' + rows);
  }
  await p.getByTestId('kbn-tab-light').click();
  await snap(p, 'tabs');
  // ใส่ตะกร้า: ×จำนวนบนรูป ยอดรวม · เอาออกได้
  await p.getByTestId('kbn-item-chicken').click();
  await p.getByTestId('kbn-item-kegg').click();
  await p.getByTestId('kbn-item-kegg').click();
  assert.match(await p.getByTestId('kbn-item-kegg').innerText(), /×2/);
  assert.strictEqual(await total(p), 35 + 15 + 15);
  assert(await p.getByTestId('kbn-item-chicken').isDisabled(), 'Energy 70 ใช้ไป 65 หยิบอกไก่ (35) อีกชิ้นไม่ได้');
  await p.getByTestId('kbn-cart-dec-kegg').click();
  assert.strictEqual(await total(p), 50);
  assert.match(await p.getByTestId('kbn-basket').innerText(), /2 ชิ้น/);
  assert.strictEqual((await kmeta(p)).pet.energy, 70, 'ยังไม่จ่าย Energy ไม่ลด');
  // ออกจากร้านแล้วตะกร้าว่าง
  await p.getByTestId('kbn-close').click();
  await enter(p);
  assert.strictEqual(await total(p), 0);
  assert(await p.getByTestId('kbn-pay').isDisabled(), 'ตะกร้าว่างไปจ่ายไม่ได้');
  assert.deepStrictEqual([...away.errors, ...p.errors], []);
});

test('คอนบินิ: แคชเชียร์ถามเป็นประโยคญี่ปุ่น あたためますか (เฉพาะมีของอุ่นได้) → ふくろ (+1 Energy) → ありがとうございました · ของเข้าตู้กับข้าว · อุ่นแล้วสนิท +2', async (b, base) => {
  const p = await open(b, base, { pet: { energy: 200, bond: 0 } });
  await enter(p);
  await p.getByTestId('kbn-tab-frozen').click(); await p.getByTestId('kbn-item-fudon').click();
  await p.getByTestId('kbn-tab-snack').click(); await p.getByTestId('kbn-item-niboshi').click();
  await p.getByTestId('kbn-pay').click();
  const reg = p.getByTestId('kbn-register');
  assert.match(await reg.innerText(), /あたためますか/);
  assert.match(await reg.innerText(), /อุ่น/);
  await snap(p, 'warm-ask');
  await p.getByTestId('kbn-yes').click();
  assert.match(await reg.innerText(), /ふくろ/);
  assert.match(await reg.innerText(), /1 Energy/, 'บอกว่าถุงคิดเงิน');
  await p.getByTestId('kbn-yes').click();
  assert.match(await reg.innerText(), /ありがとうございました/);
  await snap(p, 'thanks');
  await p.getByTestId('kbn-done').click();
  let m = await kmeta(p);
  assert.strictEqual(m.pet.energy, 200 - 45 - 10 - 1, 'จ่ายของ + ถุง 1');
  assert.deepStrictEqual([m.pet.food['fudon^'], m.pet.food.niboshi], [1, 1], 'อุด้งอุ่นแล้วแยกกอง');
  // ป้อนของอุ่นแล้ว: สนิท 16 + 2
  await p.getByTestId('pet-feed').click();
  assert.match(await p.getByTestId('feed-fudon^').innerText(), /อุ่นแล้ว/);
  await p.getByTestId('feed-fudon^').click();
  m = await kmeta(p);
  assert.strictEqual(m.pet.bond, 18);
  // ซื้อแต่ของไม่ต้องอุ่น: ไม่ถาม あたためますか · ไม่เอาถุงไม่เสีย
  await enter(p);
  await p.getByTestId('kbn-item-treat').click(); await p.getByTestId('kbn-pay').click();
  assert.match(await reg.innerText(), /ふくろ/);
  await p.getByTestId('kbn-no').click();
  await p.getByTestId('kbn-done').click();
  assert.strictEqual((await kmeta(p)).pet.energy, 144 - 10);
  assert.deepStrictEqual(p.errors, []);
});

test('คอนบินิ: 22:00–05:00 ของสดติดป้ายลด 20–30% อัตราคงที่ทั้งคืน · ความสนิทที่ได้ ×0.8 · ของแห้ง/แช่แข็งไม่ลด · กลางวันไม่ลด', async (b, base) => {
  const read = p => p.evaluate(async () => {
    const out = {};
    for (const t of ['snack', 'light', 'frozen', 'sweet']) {
      document.querySelector(`[data-testid="kbn-tab-${t}"]`).click();
      await new Promise(r => setTimeout(r, 0));
      for (const e of document.querySelectorAll('[data-testid^="kbn-item-"]')) {
        const s = e.querySelector('.kbst'); out[e.dataset.testid.slice(9)] = [s ? +s.textContent.replace(/\D/g, '') : 0, +(e.querySelector('.shpr').textContent.match(/\d+/g) || []).pop()];
      }
    }
    return out;
  });
  const day = await open(b, base, { clock: '2026-11-24T15:00:00' });
  await enter(day);
  const d = await read(day);
  assert(Object.values(d).every(([r]) => r === 0), 'กลางวันไม่ลด ' + JSON.stringify(d));
  const night = await open(b, base, { clock: '2026-11-24T23:10:00', pet: { bond: 0 } });
  await enter(night);
  const n = await read(night);
  const fresh = ['konigiri', 'kegg', 'chicken', 'sand', 'bento', 'pudding'];
  for (const [k, [r, price]] of Object.entries(n)) {
    if (!fresh.includes(k)) assert.strictEqual(r, 0, k + ' ไม่ใช่ของสด ห้ามลด');
    else assert([0, 20, 30].includes(r), k + ' ลด ' + r);
    assert.strictEqual(price, Math.ceil(d[k][1] * (100 - r) / 100), k + ' ราคาหลังลด');
  }
  const disc = fresh.filter(k => n[k][0] > 0);
  assert(disc.length > 0, 'คืนนี้ต้องมีของลดอย่างน้อยหนึ่งชิ้น');
  await snap(night, 'night');
  // เปิดอีกครั้งตอนตีสอง (คืนเดียวกัน) อัตราเท่าเดิม
  const late = await open(b, base, { clock: '2026-11-25T02:00:00' });
  await enter(late);
  const l = await read(late);
  for (const k of fresh) assert.strictEqual(l[k][0], n[k][0], k + ' อัตราคงที่ทั้งคืน');
  // ซื้อของลดราคาแล้วป้อน: ความสนิท ×0.8 ปัดเศษ
  const k = disc[0], tab = ['bento'].includes(k) ? 'frozen' : k === 'pudding' ? 'sweet' : 'light';
  await night.getByTestId('kbn-tab-' + tab).click(); await night.getByTestId('kbn-item-' + k).click();
  await night.getByTestId('kbn-pay').click();
  if (k === 'bento') await night.getByTestId('kbn-no').click();
  await night.getByTestId('kbn-no').click(); await night.getByTestId('kbn-done').click();
  const m = await kmeta(night);
  assert.strictEqual(m.pet.food[k + '~'], 1, 'ของลดราคาแยกกอง');
  const base0 = await night.evaluate(k => FOOD.find(f => f.k === k).b, k);
  await night.getByTestId('pet-feed').click();
  assert.match(await night.getByTestId('feed-' + k + '~').innerText(), /ลดราคา/);
  await night.getByTestId('feed-' + k + '~').click();
  assert.strictEqual((await kmeta(night)).pet.bond, Math.round(base0 * 0.8));
  assert.deepStrictEqual([...day.errors, ...night.errors, ...late.errors], []);
});

test('คอนบินิ: ของคอนบินิไม่ขึ้นในร้านออนไลน์ · หน้าต่างให้อาหารแสดงของคอนบินิเฉพาะที่มีในตู้', async (b, base) => {
  const p = await open(b, base, { pet: { food: { niboshi: 2 } } });
  await p.getByTestId('nav-shop').click();
  const seen = [];
  for (const c of ['toy', 'home', 'acc', 'ffood', 'old']) { await p.getByTestId('shop-tab-' + c).click(); seen.push(...await p.evaluate(() => [...document.querySelectorAll('[data-testid^="food-item-"]')].map(e => e.dataset.testid.slice(10)))); }
  assert.deepStrictEqual(seen.sort(), ['dango', 'fish', 'jerky', 'katsuo', 'lamb', 'milk', 'onigiri', 'pate', 'salmon', 'stew', 'sushi', 'tamago', 'udon'], 'ร้านออนไลน์มีอาหารญี่ปุ่น 8 เมนูเดิม + อาหารต่างประเทศ 5 ไม่มีของคอนบินิ');
  await p.getByTestId('nav-home').click();
  await p.getByTestId('pet-feed').click();
  assert.match(await p.getByTestId('feed-niboshi').innerText(), /×2/);
  assert.strictEqual(await p.getByTestId('feed-treat').count(), 0, 'ของคอนบินิที่ไม่มีในตู้ไม่ขึ้น');
  assert.deepStrictEqual(p.errors, []);
});
