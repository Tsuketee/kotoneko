// Supabase Edge Function "checkout": ราคาของแต่ละระดับ และสร้างหน้าชำระเงิน Stripe Checkout ให้ผู้ใช้ที่เข้าสู่ระบบแล้ว
// วิธีติดตั้งและตั้งค่าความลับ: docs/PAYMENT.md  · deploy ด้วย --no-verify-jwt (ฟังก์ชันตรวจ token ของผู้ใช้เองผ่าน /auth/v1/user)
// ไฟล์นี้ไม่ import อะไรเลย (เรียก Stripe และ Supabase ผ่าน REST) จึงวางในหน้า Dashboard ได้ทั้งไฟล์ และชุดทดสอบเรียกด้วย Node ได้
//
// POST { action: 'price', level: 'n4' }    → { level, amount, currency }        (ไม่ต้องเข้าสู่ระบบ)
// POST { action: 'checkout', level: 'n4' } → { url } ของหน้าชำระเงิน Stripe     (ต้องส่ง Authorization: Bearer <access token>)
//
// ความลับ (ตั้งใน Supabase → Edge Functions → Secrets เท่านั้น ห้ามใส่ในไฟล์ใดๆ):
//   STRIPE_SECRET_KEY   sk_test_… (โหมดทดสอบ) หรือ sk_live_…
//   STRIPE_PRICE_N4     price_… ของสินค้า N4 (ราคาตั้งใน Stripe ไม่ได้อยู่ในโค้ด) · ระดับอื่นใช้ STRIPE_PRICE_N3 ฯลฯ
//   APP_URL             เช่น https://tsuketee.github.io/kotoneko/ (หน้าที่ Stripe พากลับมาหลังจ่าย และ origin ที่อนุญาตให้เรียก)
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY มีให้อัตโนมัติใน Edge Functions

type Env = Record<string, string | undefined>;
const LEVEL = /^n[1-4]$/;

const svcHeaders = (k: string) => ({ apikey: k, ...(k.startsWith('eyJ') ? { Authorization: 'Bearer ' + k } : {}) });

// แปลงเป็น application/x-www-form-urlencoded แบบที่ Stripe ใช้ (a[b][0][c]=…)
export function form(o: Record<string, unknown>, pre = ''): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined || v === null) continue;
    const key = pre ? `${pre}[${k}]` : k;
    if (typeof v === 'object') out.push(...form(v as Record<string, unknown>, key));
    else out.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(v)));
  }
  return out;
}

export function makeHandler(env: Env, fx: typeof fetch = fetch) {
  const appUrl = env.APP_URL || '';
  const origin = appUrl ? new URL(appUrl).origin : '*';
  const cors = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin' };
  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
  const priceCache: Record<string, { t: number; v: { amount: number; currency: string } }> = {};

  async function stripe(path: string, body?: Record<string, unknown>) {
    const r = await fx('https://api.stripe.com/v1/' + path, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: 'Bearer ' + env.STRIPE_SECRET_KEY, ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
      body: body ? form(body).join('&') : undefined,
    });
    const j = await r.json();
    if (!r.ok) throw new Error('stripe: ' + (j.error && j.error.message || r.status));
    return j;
  }
  async function price(level: string) {
    const c = priceCache[level];
    if (c && Date.now() - c.t < 600000) return c.v;
    const p = await stripe('prices/' + encodeURIComponent(env['STRIPE_PRICE_' + level.toUpperCase()] as string));
    const v = { amount: p.unit_amount, currency: p.currency };
    priceCache[level] = { t: Date.now(), v };
    return v;
  }

  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'POST') return json(405, { error: 'method' });
    let b: { action?: string; level?: string };
    try { b = await req.json() } catch { return json(400, { error: 'bad json' }) }
    const level = String(b.level || '');
    if (!LEVEL.test(level)) return json(400, { error: 'level' });
    if (!env.STRIPE_SECRET_KEY || !env['STRIPE_PRICE_' + level.toUpperCase()]) return json(404, { error: 'not for sale' });   // ยังไม่เปิดขายระดับนี้
    try {
      if (b.action === 'price') return json(200, { level, ...(await price(level)) });
      if (b.action !== 'checkout') return json(400, { error: 'action' });
      if (!appUrl) return json(500, { error: 'APP_URL not set' });

      // ผู้ใช้คือใคร: ถาม Supabase Auth ด้วย token ที่แอปส่งมา (ปลอมไม่ได้)
      const auth = req.headers.get('authorization') || '';
      if (!/^Bearer \S+$/.test(auth)) return json(401, { error: 'login' });
      const sbUrl = (env.SUPABASE_URL || '').replace(/\/$/, '');
      const ur = await fx(sbUrl + '/auth/v1/user', { headers: { apikey: env.SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '', Authorization: auth } });
      if (!ur.ok) return json(401, { error: 'login' });
      const user = await ur.json();
      if (!user || !user.id) return json(401, { error: 'login' });

      // มีสิทธิ์อยู่แล้ว ไม่ต้องจ่ายซ้ำ
      const er = await fx(`${sbUrl}/rest/v1/entitlements?select=level&user_id=eq.${encodeURIComponent(user.id)}&level=eq.${level}`, { headers: svcHeaders(env.SUPABASE_SERVICE_ROLE_KEY || '') });
      if (!er.ok) throw new Error('entitlements: HTTP ' + er.status);
      if ((await er.json()).length) return json(409, { error: 'owned' });

      const back = (q: string) => appUrl + (appUrl.includes('?') ? '&' : '?') + q;
      const meta = { user_id: user.id, level };
      const s = await stripe('checkout/sessions', {
        mode: 'payment',
        line_items: { 0: { price: env['STRIPE_PRICE_' + level.toUpperCase()], quantity: 1 } },
        client_reference_id: user.id,
        customer_email: user.email || undefined,
        metadata: meta,
        payment_intent_data: { metadata: meta },
        locale: 'th',
        success_url: back('paid=' + level),
        cancel_url: back('buy=cancel'),
      });
      return json(200, { url: s.url });
    } catch (e) {
      console.error(e);
      return json(502, { error: 'upstream' });
    }
  };
}

// รันบน Supabase (Deno) เท่านั้น · ชุดทดสอบ import makeHandler ไปเรียกเอง
const D = (globalThis as { Deno?: { serve: (h: (r: Request) => Promise<Response>) => void; env: { toObject: () => Env } } }).Deno;
if (D) D.serve(makeHandler(D.env.toObject()));
