// Supabase Edge Function "stripe-webhook": รับ webhook จาก Stripe แล้วเพิ่ม/ถอนสิทธิ์ในตาราง entitlements
// วิธีติดตั้ง: docs/PAYMENT.md · deploy ด้วย --no-verify-jwt (Stripe ไม่มี token ของ Supabase ความปลอดภัยมาจากการตรวจลายเซ็น)
// ไฟล์นี้ไม่ import อะไรเลย ตรวจลายเซ็นด้วย Web Crypto และเขียนฐานข้อมูลผ่าน REST ด้วย service role (ฝั่งเซิร์ฟเวอร์เท่านั้น)
//
// เหตุการณ์ที่ใช้ (เลือกใน Stripe → Webhooks):
//   checkout.session.completed               จ่ายสำเร็จทันที (บัตร) → ให้สิทธิ์
//   checkout.session.async_payment_succeeded จ่ายแบบยืนยันทีหลังสำเร็จ → ให้สิทธิ์
//   checkout.session.async_payment_failed    จ่ายแบบยืนยันทีหลังไม่สำเร็จ → บันทึกไว้เฉยๆ
//   charge.refunded                          คืนเงินเต็มจำนวน → ถอนสิทธิ์ที่ได้จาก Stripe
// ความลับ: STRIPE_WEBHOOK_SECRET (whsec_…) · SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY มีให้อัตโนมัติ

type Env = Record<string, string | undefined>;
type Obj = Record<string, any>;
const LEVEL = /^n[1-4]$/, UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOLERANCE = 300;   // วินาที: กันการนำ webhook เก่ามาส่งซ้ำ

const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
function same(a: string, b: string) { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0 }

// ตรวจหัว Stripe-Signature: "t=เวลา,v1=ลายเซ็น[,v1=…]" ลายเซ็น = HMAC-SHA256(secret, "เวลา.เนื้อหาดิบ")
export async function verify(body: string, header: string | null, secret: string, now = Date.now() / 1000) {
  if (!header || !secret) return false;
  const parts = header.split(',').map(s => s.split('=')), t = Number((parts.find(p => p[0] === 't') || [])[1]);
  const sigs = parts.filter(p => p[0] === 'v1').map(p => p[1] || '');
  if (!Number.isFinite(t) || !sigs.length || Math.abs(now - t) > TOLERANCE) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const want = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(t + '.' + body)));
  return sigs.some(s => same(s, want));
}

export function makeHandler(env: Env, fx: typeof fetch = fetch) {
  const sbUrl = (env.SUPABASE_URL || '').replace(/\/$/, ''), k = env.SUPABASE_SERVICE_ROLE_KEY || '';
  const H = { apikey: k, ...(k.startsWith('eyJ') ? { Authorization: 'Bearer ' + k } : {}), 'Content-Type': 'application/json' };
  async function db(path: string, method: string, body?: unknown, prefer?: string) {
    const r = await fx(sbUrl + '/rest/v1/' + path, { method, headers: { ...H, ...(prefer ? { Prefer: prefer } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    const t = await r.text(); let j: any = null; try { j = t ? JSON.parse(t) : null } catch { /* ไม่ใช่ JSON */ }
    if (!r.ok) { const e: any = new Error(`db ${method} ${path.split('?')[0]}: HTTP ${r.status} ${t.slice(0, 200)}`); e.code = j && j.code; throw e }
    return j;
  }
  const record = (s: Obj, status: string, user_id: string | null, level: string) => db('purchases', 'POST', {
    session_id: s.id, user_id, level, status, payment_intent: typeof s.payment_intent === 'string' ? s.payment_intent : null,
    amount: s.amount_total ?? null, currency: s.currency ?? null, livemode: !!s.livemode,
  }, 'resolution=merge-duplicates,return=minimal');

  async function paid(s: Obj) {
    const user = String(s.client_reference_id || (s.metadata && s.metadata.user_id) || ''), level = String((s.metadata && s.metadata.level) || '');
    if (!UUID.test(user) || !LEVEL.test(level)) { console.warn('ข้าม session ที่ไม่ได้สร้างจากแอป', s.id); return 'ignored' }
    try {
      await db('entitlements', 'POST', { user_id: user, level, source: 'stripe' }, 'resolution=ignore-duplicates,return=minimal');
    } catch (e: any) {
      if (e.code !== '23503') throw e;   // ผู้ใช้ลบบัญชีไปแล้วก่อน webhook มาถึง: บันทึกไว้ให้ผู้ดูแลคืนเงิน ไม่ให้ Stripe ส่งซ้ำไม่จบ
      await record(s, 'paid_no_user', null, level); return 'no user';
    }
    await record(s, 'paid', user, level);
    return 'granted';
  }
  async function refunded(c: Obj) {
    if (!c.refunded || typeof c.payment_intent !== 'string') return 'partial';   // คืนเงินบางส่วน: ไม่ถอนสิทธิ์
    const rows = await db('purchases?select=session_id,user_id,level&payment_intent=eq.' + encodeURIComponent(c.payment_intent), 'GET');
    for (const p of rows || []) {
      if (p.user_id) await db(`entitlements?user_id=eq.${p.user_id}&level=eq.${p.level}&source=eq.stripe`, 'DELETE');
      await db('purchases?session_id=eq.' + encodeURIComponent(p.session_id), 'PATCH', { status: 'refunded' });
    }
    return rows && rows.length ? 'revoked' : 'unknown';
  }

  return async (req: Request): Promise<Response> => {
    if (req.method !== 'POST') return new Response('method', { status: 405 });
    const body = await req.text();
    if (!(await verify(body, req.headers.get('stripe-signature'), env.STRIPE_WEBHOOK_SECRET || ''))) return new Response('bad signature', { status: 400 });
    let ev: Obj; try { ev = JSON.parse(body) } catch { return new Response('bad json', { status: 400 }) }
    const o = (ev.data && ev.data.object) || {};
    try {
      let r = 'ignored';
      if (ev.type === 'checkout.session.completed' && o.mode === 'payment') {
        if (o.payment_status === 'paid' || o.payment_status === 'no_payment_required') r = await paid(o);
        else if (LEVEL.test(String(o.metadata && o.metadata.level))) { await record(o, 'pending', UUID.test(o.client_reference_id) ? o.client_reference_id : null, o.metadata.level); r = 'pending' }
      } else if (ev.type === 'checkout.session.async_payment_succeeded') r = await paid(o);
      else if (ev.type === 'checkout.session.async_payment_failed' && LEVEL.test(String(o.metadata && o.metadata.level))) { await record(o, 'failed', UUID.test(o.client_reference_id) ? o.client_reference_id : null, o.metadata.level); r = 'failed' }
      else if (ev.type === 'charge.refunded') r = await refunded(o);
      return new Response(JSON.stringify({ ok: true, r }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      console.error(e);   // ตอบ 500 ให้ Stripe ส่งซ้ำภายหลัง (ทุกขั้นตอนทำซ้ำได้ปลอดภัย)
      return new Response('error', { status: 500 });
    }
  };
}

const D = (globalThis as { Deno?: { serve: (h: (r: Request) => Promise<Response>) => void; env: { toObject: () => Env } } }).Deno;
if (D) D.serve(makeHandler(D.env.toObject()));
