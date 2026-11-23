// ส่วนกลางของชุด e2e (tests/e2e.js รันทุกไฟล์ใน tests/e2e/): server เล็กๆ เปิดแอป · fresh() เปิดหน้าใหม่พร้อมข้อมูลตั้งต้น · ตัวจำลองคลาวด์/แพ็ก · ทะเบียนข้อทดสอบ
const http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert');
let rec = null;
// ภาพหน้าจอระหว่างข้อ (เช่นตอนเปิดคำแปล) · ภาพตอนจบข้อถ่ายให้อัตโนมัติ: snap(p, 'translation-on') → test-results/e2e/<ข้อ>-translation-on.png
const snap = (p, step) => rec.shot(p, step); // หลักฐานทุกข้อ: test-results/e2e/ (ภาพหน้าจอ + console log + summary.md)
const ROOT = path.join(__dirname, '..', '..');
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

async function fresh(browser, base, { seed = true, viewport, hasTouch = false } = {}) {
  const ctx = await browser.newContext({ viewport: viewport || { width: 820, height: 1100 }, acceptDownloads: true, serviceWorkers: 'block', hasTouch });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', e => page.errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') page.errors.push(m.text()); });
  if (seed) await page.addInitScript(s => { if (!localStorage.getItem('kn_meta')) localStorage.setItem('kn_meta', JSON.stringify(s)); }, SEED);
  await page.goto(base);
  return page;
}

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
// กดไปเที่ยวในกล่องข้อมูลของแผนที่: แมวเดินทางไปก่อน (แถบบอกระยะทาง) แตะเพื่อข้าม แล้วหน้าต่างปิดเอง
async function travel(p, name) { await p.locator('.tmi .go').click(); await p.waitForSelector('.tmd.trip .tmv'); const t = await p.locator('.tmv').innerText();
  if (name) assert(t.includes('กำลังเดินไป' + name) && /ระยะทางราว [\d,]+ ม\. · เดินราว \d+ นาที/.test(t), t);
  await p.locator('.tmd h2').click(); await p.waitForSelector('.cov', { state: 'detached', timeout: 5000 }) }
async function home(p) { await p.evaluate(() => { tab = 'home'; render() }); return p.locator('#app').innerText() }
async function learnHub(p) { await p.evaluate(() => goTab('learn')); return p.locator('#app').innerText() } // การ์ดระดับอยู่ในหน้ารวมของแท็บเรียน (v73)

const setRec = r => { rec = r; };
module.exports = { assert, fs, path, ROOT, SEED, tplRe, test, fresh, snap, mockCloud, cloudPage, login, FAKE_PACK, FAKE_PACK_N3, travel, home, learnHub, server, tests, setRec };
