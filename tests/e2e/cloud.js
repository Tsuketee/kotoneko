// e2e: บัญชี ซิงก์คลาวด์ (Supabase จำลอง) และหน้าเอกสาร · รันผ่าน node tests/e2e.js [คำในชื่อข้อ]
const { assert, fs, path, ROOT, SEED, test, fresh, mockCloud, cloudPage, login } = require('./harness');

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
  void p.evaluate(() => cloudSync(true)).catch(() => 'pulled');
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
