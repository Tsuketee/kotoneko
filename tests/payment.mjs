// ทดสอบ Edge Function ชำระเงิน (supabase/functions/*) ด้วย Node โดยจำลอง Stripe และ Supabase (ไม่ต่อเน็ตจริง ไม่ใช้คีย์จริง)
// รัน: node tests/payment.mjs  (Node 22.18+ อ่านไฟล์ .ts ได้เอง)
import assert from 'node:assert';
import { createHmac } from 'node:crypto';
import * as CO from '../supabase/functions/checkout/index.ts';
import * as WH from '../supabase/functions/stripe-webhook/index.ts';

const tests = [];
const test = (n, f) => tests.push([n, f]);
const U1 = '11111111-2222-4333-8444-555555555555';
const ENV = { STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_PRICE_N4: 'price_n4', STRIPE_WEBHOOK_SECRET: 'whsec_test', APP_URL: 'https://app.test/kotoneko/',
  SUPABASE_URL: 'https://sb.test', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'eyJservice' };

// ฐานข้อมูล + Stripe จำลอง: บันทึกทุกคำขอไว้ตรวจ
function fake() {
  const s = { ent: [], purchases: {}, calls: [], sessions: [], users: { 'Bearer good': { id: U1, email: 'a@b.co' } } };
  const res = (status, body) => new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  s.fetch = async (url, o = {}) => {
    const u = new URL(url), m = o.method || 'GET', h = o.headers || {};
    s.calls.push(m + ' ' + u.host + u.pathname);
    if (u.host === 'api.stripe.com') {
      assert.strictEqual(h.Authorization, 'Bearer sk_test_x');
      if (u.pathname === '/v1/prices/price_n4') return res(200, { id: 'price_n4', unit_amount: 39000, currency: 'thb' });
      if (u.pathname === '/v1/checkout/sessions' && m === 'POST') { const p = new URLSearchParams(o.body); s.sessions.push(p); return res(200, { id: 'cs_1', url: 'https://checkout.stripe.com/c/pay/cs_1' }) }
      return res(404, { error: { message: 'no' } });
    }
    assert.strictEqual(u.host, 'sb.test');
    if (u.pathname === '/auth/v1/user') { const user = s.users[h.Authorization]; return user ? res(200, user) : res(401, { msg: 'invalid JWT' }) }
    // REST ด้วย service role เท่านั้น
    assert.strictEqual(h.apikey, 'eyJservice'); assert.strictEqual(h.Authorization, 'Bearer eyJservice');
    const q = Object.fromEntries([...u.searchParams].map(([k, v]) => [k, v.replace(/^eq\./, '')])), body = o.body ? JSON.parse(o.body) : null;
    if (u.pathname === '/rest/v1/entitlements') {
      if (m === 'GET') return res(200, s.ent.filter(e => e.user_id === q.user_id && e.level === q.level));
      if (m === 'POST') {
        if (s.noUser) return res(409, { code: '23503', message: 'violates foreign key constraint' });
        if (s.dbDown) return res(503, { message: 'down' });
        if (!s.ent.some(e => e.user_id === body.user_id && e.level === body.level)) s.ent.push(body);
        return res(201);
      }
      if (m === 'DELETE') { s.ent = s.ent.filter(e => !(e.user_id === q.user_id && e.level === q.level && e.source === q.source)); return res(204) }
    }
    if (u.pathname === '/rest/v1/purchases') {
      if (m === 'POST') { s.purchases[body.session_id] = { ...s.purchases[body.session_id], ...body }; return res(201) }
      if (m === 'GET') return res(200, Object.values(s.purchases).filter(p => p.payment_intent === q.payment_intent));
      if (m === 'PATCH') { Object.assign(s.purchases[q.session_id], body); return res(204) }
    }
    return res(404, { message: 'not mocked ' + m + ' ' + u.pathname });
  };
  return s;
}
const post = (h, body, headers = {}) => h(new Request('https://fn.test/', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) }));

// ---------- checkout ----------
test('checkout: ราคามาจาก Stripe (ไม่อยู่ในโค้ด) และไม่ต้องเข้าสู่ระบบ', async () => {
  const s = fake(), h = CO.makeHandler(ENV, s.fetch);
  const r = await post(h, { action: 'price', level: 'n4' });
  assert.strictEqual(r.status, 200); assert.deepStrictEqual(await r.json(), { level: 'n4', amount: 39000, currency: 'thb' });
  assert.strictEqual(r.headers.get('access-control-allow-origin'), 'https://app.test');
  await post(h, { action: 'price', level: 'n4' });
  assert.strictEqual(s.calls.filter(c => c.includes('prices')).length, 1, 'ควรจำราคาไว้ ไม่ถาม Stripe ทุกครั้ง');
});

test('checkout: ระดับที่ยังไม่ตั้งราคา หรือยังไม่ใส่คีย์ → 404 (ยังไม่เปิดขาย) · ระดับแปลกๆ → 400', async () => {
  const s = fake();
  assert.strictEqual((await post(CO.makeHandler(ENV, s.fetch), { action: 'price', level: 'n3' })).status, 404);
  assert.strictEqual((await post(CO.makeHandler({ ...ENV, STRIPE_SECRET_KEY: '' }, s.fetch), { action: 'price', level: 'n4' })).status, 404);
  assert.strictEqual((await post(CO.makeHandler(ENV, s.fetch), { action: 'price', level: 'n4;drop' })).status, 400);
  assert.strictEqual((await CO.makeHandler(ENV, s.fetch)(new Request('https://fn.test/', { method: 'OPTIONS' }))).status, 204);
  assert.deepStrictEqual(s.calls, []);
});

test('checkout: สร้างหน้าชำระเงินผูกกับ user id จาก token จริง ไม่เชื่อค่าที่แอปส่งมา', async () => {
  const s = fake(), h = CO.makeHandler(ENV, s.fetch);
  const r = await post(h, { action: 'checkout', level: 'n4', user_id: 'someone-else' }, { Authorization: 'Bearer good' });
  assert.strictEqual(r.status, 200); assert.deepStrictEqual(await r.json(), { url: 'https://checkout.stripe.com/c/pay/cs_1' });
  const p = s.sessions[0];
  assert.strictEqual(p.get('mode'), 'payment');
  assert.strictEqual(p.get('line_items[0][price]'), 'price_n4'); assert.strictEqual(p.get('line_items[0][quantity]'), '1');
  assert.strictEqual(p.get('client_reference_id'), U1); assert.strictEqual(p.get('metadata[user_id]'), U1); assert.strictEqual(p.get('metadata[level]'), 'n4');
  assert.strictEqual(p.get('payment_intent_data[metadata][user_id]'), U1);
  assert.strictEqual(p.get('customer_email'), 'a@b.co');
  assert.strictEqual(p.get('success_url'), 'https://app.test/kotoneko/?paid=n4'); assert.strictEqual(p.get('cancel_url'), 'https://app.test/kotoneko/?buy=cancel');
});

test('checkout: ไม่ได้เข้าสู่ระบบ / token ปลอม → 401 · มีสิทธิ์แล้ว → 409 ไม่สร้างหน้าชำระเงินซ้ำ', async () => {
  const s = fake(), h = CO.makeHandler(ENV, s.fetch);
  assert.strictEqual((await post(h, { action: 'checkout', level: 'n4' })).status, 401);
  assert.strictEqual((await post(h, { action: 'checkout', level: 'n4' }, { Authorization: 'Bearer fake' })).status, 401);
  s.ent.push({ user_id: U1, level: 'n4', source: 'manual' });
  assert.strictEqual((await post(h, { action: 'checkout', level: 'n4' }, { Authorization: 'Bearer good' })).status, 409);
  assert.strictEqual(s.sessions.length, 0);
});

// ---------- webhook ----------
const sign = (body, t = Math.floor(Date.now() / 1000), secret = 'whsec_test') => `t=${t},v1=${createHmac('sha256', secret).update(t + '.' + body).digest('hex')}`;
const hook = (h, ev, sig) => { const body = JSON.stringify(ev); return h(new Request('https://fn.test/', { method: 'POST', headers: { 'Stripe-Signature': sig === undefined ? sign(body) : sig }, body })) };
const session = (x = {}) => ({ id: 'cs_1', object: 'checkout.session', mode: 'payment', payment_status: 'paid', client_reference_id: U1, metadata: { user_id: U1, level: 'n4' }, payment_intent: 'pi_1', amount_total: 39000, currency: 'thb', livemode: false, ...x });
const ev = (type, object) => ({ id: 'evt_1', type, data: { object } });

test('webhook: ลายเซ็นผิด / ไม่มี / หมดอายุ / คนละ secret → 400 และไม่แตะฐานข้อมูล', async () => {
  const s = fake(), h = WH.makeHandler(ENV, s.fetch), e = ev('checkout.session.completed', session()), body = JSON.stringify(e);
  assert.strictEqual((await hook(h, e, null)).status, 400);
  assert.strictEqual((await hook(h, e, 't=1,v1=abc')).status, 400);
  assert.strictEqual((await hook(h, e, sign(body, Math.floor(Date.now() / 1000) - 600))).status, 400);
  assert.strictEqual((await hook(h, e, sign(body, undefined, 'whsec_other'))).status, 400);
  assert.strictEqual((await hook(h, e, sign(body.replace('n4', 'n3')))).status, 400, 'ลายเซ็นของเนื้อหาอื่น → ไม่ผ่าน');
  assert.deepStrictEqual(s.calls, []);
  const s2 = fake(), h2 = WH.makeHandler(ENV, s2.fetch);
  assert.strictEqual((await h2(new Request('https://fn.test/', { method: 'POST', headers: { 'Stripe-Signature': sign(body) }, body: body.replace('n4', 'n3') }))).status, 400, 'แก้เนื้อหาหลังเซ็น → ไม่ผ่าน');
  assert.deepStrictEqual(s2.calls, []);
  assert.strictEqual(await WH.verify(body, sign(body), ''), false, 'ไม่มี secret ต้องไม่ผ่าน');
});

test('webhook: จ่ายสำเร็จ → ให้สิทธิ์ (source stripe) + บันทึกการซื้อ · ส่งซ้ำได้ไม่เกิดแถวซ้ำ', async () => {
  const s = fake(), h = WH.makeHandler(ENV, s.fetch), e = ev('checkout.session.completed', session());
  for (let i = 0; i < 2; i++) { const r = await hook(h, e); assert.strictEqual(r.status, 200); assert.strictEqual((await r.json()).r, 'granted') }
  assert.deepStrictEqual(s.ent, [{ user_id: U1, level: 'n4', source: 'stripe' }]);
  assert.deepStrictEqual(s.purchases.cs_1, { session_id: 'cs_1', user_id: U1, level: 'n4', status: 'paid', payment_intent: 'pi_1', amount: 39000, currency: 'thb', livemode: false });
});

test('webhook: จ่ายแบบยืนยันทีหลัง → รอก่อน แล้วให้สิทธิ์เมื่อสำเร็จ / ไม่ให้เมื่อไม่สำเร็จ', async () => {
  const s = fake(), h = WH.makeHandler(ENV, s.fetch);
  assert.strictEqual((await (await hook(h, ev('checkout.session.completed', session({ payment_status: 'unpaid' })))).json()).r, 'pending');
  assert.deepStrictEqual(s.ent, []); assert.strictEqual(s.purchases.cs_1.status, 'pending');
  assert.strictEqual((await (await hook(h, ev('checkout.session.async_payment_succeeded', session()))).json()).r, 'granted');
  assert.strictEqual(s.ent.length, 1); assert.strictEqual(s.purchases.cs_1.status, 'paid');
  const s2 = fake(), h2 = WH.makeHandler(ENV, s2.fetch);
  await hook(h2, ev('checkout.session.completed', session({ payment_status: 'unpaid' })));
  assert.strictEqual((await (await hook(h2, ev('checkout.session.async_payment_failed', session({ payment_status: 'unpaid' })))).json()).r, 'failed');
  assert.deepStrictEqual(s2.ent, []); assert.strictEqual(s2.purchases.cs_1.status, 'failed');
});

test('webhook: session ที่ไม่ได้มาจากแอป (ไม่มี user/ระดับ หรือค่าแปลก) → ข้าม ไม่ให้สิทธิ์ใคร', async () => {
  const s = fake(), h = WH.makeHandler(ENV, s.fetch);
  for (const x of [{ client_reference_id: null, metadata: {} }, { client_reference_id: 'abc', metadata: { level: 'n4' } }, { metadata: { level: 'n9' } }, { metadata: { level: "n4'" } }]) {
    const r = await hook(h, ev('checkout.session.completed', session(x)));
    assert.strictEqual(r.status, 200); assert.strictEqual((await r.json()).r, 'ignored');
  }
  assert.strictEqual((await (await hook(h, ev('customer.created', {}))).json()).r, 'ignored');
  assert.deepStrictEqual(s.ent, []); assert.deepStrictEqual(s.purchases, {});
});

test('webhook: คืนเงินเต็มจำนวน → ถอนสิทธิ์เฉพาะที่มาจาก Stripe · คืนบางส่วน → ไม่ถอน', async () => {
  const s = fake(), h = WH.makeHandler(ENV, s.fetch);
  await hook(h, ev('checkout.session.completed', session()));
  assert.strictEqual((await (await hook(h, ev('charge.refunded', { id: 'ch_1', payment_intent: 'pi_1', refunded: false, amount_refunded: 100 }))).json()).r, 'partial');
  assert.strictEqual(s.ent.length, 1);
  assert.strictEqual((await (await hook(h, ev('charge.refunded', { id: 'ch_1', payment_intent: 'pi_1', refunded: true }))).json()).r, 'revoked');
  assert.deepStrictEqual(s.ent, []); assert.strictEqual(s.purchases.cs_1.status, 'refunded');
  // สิทธิ์ที่ผู้ดูแลให้เอง (manual) ไม่ถูกถอนโดยการคืนเงิน
  s.ent.push({ user_id: U1, level: 'n4', source: 'manual' });
  await hook(h, ev('charge.refunded', { id: 'ch_1', payment_intent: 'pi_1', refunded: true }));
  assert.strictEqual(s.ent.length, 1);
  assert.strictEqual((await (await hook(h, ev('charge.refunded', { id: 'ch_2', payment_intent: 'pi_x', refunded: true }))).json()).r, 'unknown');
});

test('webhook: ฐานข้อมูลล่ม → 500 ให้ Stripe ส่งซ้ำ · ผู้ใช้ลบบัญชีไปแล้ว → 200 และบันทึกไว้ให้คืนเงิน', async () => {
  const s = fake(), h = WH.makeHandler(ENV, s.fetch); s.dbDown = true;
  assert.strictEqual((await hook(h, ev('checkout.session.completed', session()))).status, 500);
  s.dbDown = false; s.noUser = true;
  const r = await hook(h, ev('checkout.session.completed', session()));
  assert.strictEqual(r.status, 200); assert.strictEqual((await r.json()).r, 'no user');
  assert.strictEqual(s.purchases.cs_1.status, 'paid_no_user'); assert.strictEqual(s.purchases.cs_1.user_id, null);
});

test('ความลับไม่อยู่ใน repo: ไม่มีคีย์ Stripe จริงในไฟล์ที่ commit', async () => {
  const { execSync } = await import('node:child_process');
  const hits = execSync("git grep -nE '(sk|rk)_(live|test)_[0-9A-Za-z]{10,}|whsec_[0-9A-Za-z]{10,}|service_role\"?\\s*[:=]\\s*\"?eyJ' -- . ':!tests/payment.mjs' || true", { encoding: 'utf8' });
  assert.strictEqual(hits.trim(), '', hits);
});

let fail = 0;
console.warn = console.error = () => {};   // ฟังก์ชันพิมพ์ log ตอนเจอกรณีผิดปกติ ซึ่งชุดทดสอบตั้งใจสร้าง
for (const [n, f] of tests) {
  try { await f(); console.log('  ✓', n) } catch (e) { fail++; console.log('  ✗', n, '\n     ', (e.stack || e.message).split('\n').slice(0, 4).join(' | ')) }
}
console.log(fail ? `\nไม่ผ่าน ${fail}/${tests.length}` : `\nผ่านทั้งหมด ${tests.length} ข้อ`);
process.exit(fail ? 1 : 0);
