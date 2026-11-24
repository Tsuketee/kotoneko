// e2e: ระดับ N4/N3 แพ็กเสียเงิน การซื้อ และคืนเงิน (Stripe จำลอง) · รันผ่าน node tests/e2e.js [คำในชื่อข้อ]
const { assert, fs, path, ROOT, SEED, test, snap, mockCloud, cloudPage, login, FAKE_PACK, FAKE_PACK_N3, learnHub } = require('./harness');

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

test('ผู้ดูแล: โหมดทดสอบ ปลดล็อกทุกสถานที่ในแผนที่ (เก็บถาวร ซิงก์ได้) · คืนสถานที่ที่ล็อกไว้เดิมได้ · ผู้ใช้ทั่วไปและคนที่ยังไม่เข้าสู่ระบบไม่เห็นปุ่ม', async (b, base) => {
  const db = mockCloud(); db.admin = true; const p = await cloudPage(b, base, db);
  await p.evaluate(() => goMe('acct'));
  assert.strictEqual(await p.getByTestId('dbg-unlock-places').count(), 0, 'ยังไม่เข้าสู่ระบบต้องไม่เห็น');
  await login(p); await p.waitForFunction(() => PS.t && !cloudBusy);
  await p.evaluate(() => { M.place = { at: 'room', got: ['station'] }; saveM(); render(); });
  const locked = await p.evaluate(() => PLACES.filter(x => !plHas(x)).map(x => x.id));
  assert(locked.length >= 3, 'ต้องมีที่ที่ยังล็อกอยู่ก่อนทดสอบ ' + locked);
  await p.getByTestId('dbg-unlock-places').scrollIntoViewIfNeeded(); await snap(p, 'acct-test-mode');
  await p.getByTestId('dbg-unlock-places').click();
  await p.waitForSelector('.toast:has-text("ปลดล็อกทุกสถานที่แล้ว")');
  assert.deepStrictEqual(await p.evaluate(() => PLACES.filter(x => !plHas(x)).map(x => x.id)), []);
  assert.deepStrictEqual(await p.evaluate(() => JSON.parse(localStorage.getItem('kn_meta')).place.got.sort()), await p.evaluate(() => PLACES.filter(x => !x.free).map(x => x.id).sort()), 'ต้องบันทึกลงเครื่อง (ซิงก์ขึ้นคลาวด์พร้อมข้อมูลอื่น)');
  await p.evaluate(() => goTab('home')); await p.locator('.scgo').click(); await p.waitForSelector('.tmp');
  assert.strictEqual(await p.locator('.tmp.tlk').count(), 0, 'แผนที่ต้องไม่มีป้ายล็อก');
  await snap(p, 'map-unlocked');
  await p.locator('.cdl button:text-is("ปิด")').click(); await p.evaluate(() => goMe('acct'));
  await p.getByTestId('dbg-restore-places').click();
  await p.waitForSelector('.toast:has-text("คืนสถานที่ที่ล็อกไว้เดิมแล้ว")');
  assert.deepStrictEqual(await p.evaluate(() => plState().got), ['station']);
  assert.strictEqual(await p.getByTestId('dbg-restore-places').count(), 0, 'คืนแล้วปุ่มคืนค่าต้องหาย');
  db.admin = false; await p.evaluate(() => packCheck().then(() => render()));
  assert.strictEqual(await p.getByTestId('dbg-unlock-places').count(), 0, 'ผู้ใช้ทั่วไปต้องไม่เห็น');
  assert.strictEqual(await p.evaluate(() => { PS.admin = false; dbgPlaces(true); return PLACES.filter(x => !plHas(x)).length > 0; }), true, 'เรียกฟังก์ชันตรงๆ โดยไม่ใช่ผู้ดูแลต้องไม่ปลดล็อก');
  assert.deepStrictEqual(p.errors, []);
});

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
