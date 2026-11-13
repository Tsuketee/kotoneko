# ระบบชำระเงิน (Stripe Checkout)

ผู้ใช้กดการ์ด N4 → เห็นราคาและกด "ไปหน้าชำระเงิน" → จ่ายในหน้าของ Stripe (บัตร / PromptPay) → Stripe ส่ง webhook → Supabase เพิ่มสิทธิ์ใน `entitlements` → แอปเห็นสิทธิ์แล้วดาวน์โหลดแพ็ก

```
แอป ──(token ผู้ใช้)──▶ Edge Function checkout ──(secret key)──▶ Stripe สร้างหน้าชำระเงิน
                                                                    │ ผู้ใช้จ่ายเงิน
แอป ◀── ?paid=n4 ◀──────────────── Stripe พากลับ                      ▼
 │ ตรวจสิทธิ์ซ้ำทุก 3 วินาที      entitlements ◀── Edge Function stripe-webhook ◀── webhook (มีลายเซ็น)
```

- **ราคาไม่อยู่ในโค้ด** ตั้งใน Stripe แล้วใส่ Price ID เป็นความลับ `STRIPE_PRICE_N4` แอปดึงราคามาแสดงเอง เปลี่ยนราคาได้โดยไม่ต้องแก้แอป
- **ยังไม่ติดตั้งฟังก์ชัน หรือยังไม่ใส่ `STRIPE_PRICE_N4`** = การ์ดขึ้น "เปิดขายเร็วๆ นี้" เหมือนเดิม จึง merge โค้ดนี้ได้ก่อนพร้อมขาย
- **N3 ใช้วิธีเดียวกันทุกอย่าง** สร้างสินค้า `Kotoneko N3` แล้วใส่ Price ID ในความลับ `STRIPE_PRICE_N3` (ไม่ต้องแก้โค้ด) ข้างล่างใช้ N4 เป็นตัวอย่าง
- **ความลับทั้งหมด** (Stripe secret key, webhook signing secret) อยู่ใน Supabase → Edge Functions → Secrets เท่านั้น ห้ามวางในแชท โค้ด หรือ commit
- ซื้อครั้งเดียว (`mode: payment`) ผูกกับบัญชี · คืนเงินเต็มจำนวนใน Stripe = ถอนสิทธิ์อัตโนมัติ (เฉพาะสิทธิ์ที่ได้จาก Stripe ไม่แตะสิทธิ์ที่ให้เองแบบ `manual`)

ไฟล์: `supabase/functions/checkout/index.ts` · `supabase/functions/stripe-webhook/index.ts` · ตาราง `purchases` ใน `supabase/schema.sql` · ฝั่งแอปอยู่ท้าย `js/packs.js` · ทดสอบด้วย `node tests/payment.mjs`

## ตั้งค่าโหมดทดสอบ (ทำครั้งเดียว ประมาณ 20 นาที)

### 1. ฐานข้อมูล
Supabase → SQL Editor → วางทั้งไฟล์ `supabase/schema.sql` → Run (รันซ้ำได้ ไฟล์นี้เพิ่มตาราง `purchases` และ `refund_requests`)

### 2. Stripe: สินค้าและราคา
1. สมัคร https://stripe.com แล้วเปิด **โหมดทดสอบ** (สวิตช์ Test mode หรือสร้าง Sandbox มุมซ้ายบน) ทุกขั้นข้างล่างทำในโหมดทดสอบ
2. Product catalog → **Add product** ชื่อ `Kotoneko N4` · ราคาแบบ **One-off** (ไม่ใช่ Recurring) · สกุล **THB** · ราคา **249** (สินค้า `Kotoneko N3` ราคา **349**)
3. เปิดสินค้านั้น → ในส่วน Pricing กดที่ราคา → คัดลอก **Price ID** (ขึ้นต้น `price_`)
4. Settings → Payment methods → เปิด **Cards** และ **PromptPay** (PromptPay ต้องเป็นบัญชีในไทย สกุล THB)

### 3. Supabase: ติดตั้งฟังก์ชัน 2 ตัว
Supabase → **Edge Functions** → Deploy a new function → **Via Editor** (ทำ 2 รอบ)

| ชื่อฟังก์ชัน (ต้องตรงตามนี้) | วางเนื้อหาไฟล์ |
|---|---|
| `checkout` | `supabase/functions/checkout/index.ts` |
| `stripe-webhook` | `supabase/functions/stripe-webhook/index.ts` |

หลัง deploy เปิดแต่ละฟังก์ชัน → Details (หรือ Settings) → **ปิด "Enforce JWT verification" (Verify JWT)** ทั้งสองตัว
(`checkout` ตรวจ token ผู้ใช้เอง ส่วน `stripe-webhook` ถูกเรียกจาก Stripe ซึ่งไม่มี token ความปลอดภัยมาจากการตรวจลายเซ็น)
> ถ้าใช้ Supabase CLI: `supabase functions deploy checkout --no-verify-jwt` และ `supabase functions deploy stripe-webhook --no-verify-jwt`

### 4. Stripe: webhook
1. Stripe → Developers → **Webhooks** → Add endpoint (หรือ Add destination → Webhook endpoint)
2. Endpoint URL: `https://<Project ID>.supabase.co/functions/v1/stripe-webhook` (ดู Project URL ใน `js/data/cloud-config.js`)
3. เลือกเหตุการณ์ 4 อย่าง: `checkout.session.completed` · `checkout.session.async_payment_succeeded` · `checkout.session.async_payment_failed` · `charge.refunded`
4. สร้างแล้วกด **Reveal** ที่ Signing secret (ขึ้นต้น `whsec_`)

### 5. Supabase: ใส่ความลับ
Supabase → Edge Functions → **Secrets** → Add new secret

| Name | Value |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys → **Secret key** (โหมดทดสอบขึ้นต้น `sk_test_`) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` จากข้อ 4 |
| `STRIPE_PRICE_N4` | `price_…` จากข้อ 2 |
| `STRIPE_PRICE_N3` | `price_…` ของสินค้า N3 (ใส่เมื่อพร้อมขาย N3) |
| `APP_URL` | `https://tsuketee.github.io/kotoneko/` (มี `/` ท้าย) |

`SUPABASE_URL` `SUPABASE_ANON_KEY` `SUPABASE_SERVICE_ROLE_KEY` มีให้อัตโนมัติ ไม่ต้องใส่
> ⚠️ แทนที่จะใช้ Secret key เต็มสิทธิ์ จะสร้าง **Restricted key** (Developers → API keys → Create restricted key) ให้สิทธิ์แค่ Checkout Sessions: Write และ Prices: Read ก็ได้ ปลอดภัยกว่า

### 6. ลองซื้อ (โหมดทดสอบ ไม่มีเงินจริง)
1. เปิดแอป → เข้าสู่ระบบด้วยบัญชีที่**ยังไม่มี**สิทธิ์ N4 (ถ้าเคยให้สิทธิ์ทดสอบ ให้ถอนก่อนตาม `docs/CLOUD.md`) → การ์ด N4 ต้องขึ้นราคา
2. กดการ์ด → ไปหน้าชำระเงิน → บัตร `4242 4242 4242 4242` วันหมดอายุอนาคตใดก็ได้ CVC 3 หลักใดก็ได้
3. กลับมาที่แอปแล้วภายในไม่กี่วินาทีต้องขึ้น "ปลดล็อก N4 แล้ว" → แตะการ์ดเริ่มเรียนได้
4. ตรวจ: SQL Editor `select * from public.purchases;` มีแถวสถานะ `paid` · Stripe → Webhooks → endpoint → เหตุการณ์ล่าสุดได้ 200
5. ลองขอคืนเงิน: แอป → หน้าสถิติ → ส่วนบัญชี → "ขอคืนเงิน N4" → เลือกเหตุผล → ส่ง → ต้องขึ้น "รอดำเนินการ" (บัญชีผู้ดูแลเห็นคำขอและสรุปเหตุผลในส่วนผู้ดูแล)
6. คืนเงิน: Stripe → Payments → เลือกรายการ → Refund เต็มจำนวน → เปิดแอปใหม่ N4 ต้องกลับเป็นล็อก และ `select status from public.refund_requests;` ต้องเป็น `refunded`
7. ลองกดยกเลิกที่หน้า Stripe → กลับมาแอปต้องขึ้น "ยกเลิกการชำระเงินแล้ว"

## แก้ปัญหา
- **การ์ดยังขึ้น "เปิดขายเร็วๆ นี้":** ยังไม่ได้ deploy `checkout` / ชื่อฟังก์ชันไม่ตรง / ยังไม่ใส่ `STRIPE_PRICE_N4` หรือ `STRIPE_SECRET_KEY` (ดู Edge Functions → checkout → Logs) · แอปจำราคาตอนตรวจสิทธิ์ ปิดแล้วเปิดแอปใหม่
- **กดแล้วขึ้น "เปิดหน้าชำระเงินไม่สำเร็จ":** ดู Logs ของ `checkout` มักเป็น `APP_URL` ว่าง หรือ Price ID เป็นของคนละโหมด (ทดสอบ/จริง) กับ secret key
- **จ่ายแล้วไม่ปลดล็อก:** Stripe → Webhooks → ดูเหตุการณ์ ถ้าได้ **400** = `STRIPE_WEBHOOK_SECRET` ผิด (แต่ละ endpoint และแต่ละโหมดมี secret ของตัวเอง) · **401** = ยังไม่ได้ปิด Verify JWT ของ `stripe-webhook` · **500** = ยังไม่ได้รัน `schema.sql` ใหม่ (ไม่มีตาราง `purchases`) · แก้แล้วกด **Resend** ที่เหตุการณ์นั้นใน Stripe
- **เห็นราคาแต่กดซื้อแล้ว "เปิดหน้าชำระเงินไม่สำเร็จ" และ Logs ของ `checkout` ขึ้น `entitlements: HTTP 403`:** ฐานข้อมูลยังไม่ให้สิทธิ์ `service_role` (โปรเจกต์ใหม่ไม่ให้อัตโนมัติ) รัน `schema.sql` ฉบับล่าสุดใหม่ ซึ่งมีบรรทัด `grant … to service_role`
- **ปุ่ม "ขอคืนเงิน" ไม่ขึ้น:** ปุ่มแสดงเฉพาะสิทธิ์ที่ได้จาก Stripe ภายใน 7 วัน (สิทธิ์แบบ `manual` ไม่มีปุ่ม) · ส่วนผู้ดูแลขึ้น "ยังไม่มีตาราง refund_requests" = ยังไม่ได้รัน `schema.sql` ใหม่
- **ผู้ใช้จ่ายแล้วแต่ลบบัญชีไปก่อน webhook มาถึง:** ตาราง `purchases` มีแถวสถานะ `paid_no_user` ให้คืนเงินใน Stripe
- **ให้สิทธิ์เองโดยไม่ผ่าน Stripe** (เช่นแจกรีวิว): ใช้คำสั่ง `manual` ใน `docs/CLOUD.md` ได้เหมือนเดิม

## เปิดขายจริง (หลังทดสอบผ่านครบ)
- [ ] ยืนยันตัวตน/ธุรกิจใน Stripe และผูกบัญชีธนาคารรับเงิน
- [x] ตัดสินใจราคาและนโยบายคืนเงิน (2026-11-13): **N4 ฿249 · N3 ฿349** ราคาเปิดตัว ซื้อครั้งเดียว (หลังผู้รู้ตรวจเนื้อหาแล้วพิจารณาขึ้นเป็นประมาณ ฿299 / ฿449) · ยังไม่มีแพ็กรวม (ต้องแก้โค้ดเพิ่ม) · คืนเงินได้ภายใน 7 วัน ขอผ่านปุ่มในแอปพร้อมเหตุผล (เหตุผลไม่มีผลต่อการคืนเงิน)
- [ ] ให้ผู้รู้กฎหมายตรวจ `terms.html` `privacy.html`
- [ ] เปิด PromptPay ใน Stripe → Settings → Payment methods
- [ ] ใน**โหมดจริง** (Live) ทำข้อ 2 และ 4 ซ้ำ (สินค้า ราคา และ webhook ของโหมดจริงแยกจากโหมดทดสอบ) แล้วเปลี่ยน Secrets ทั้ง 3 ตัวเป็นค่าโหมดจริง (`sk_live_…` / `rk_live_…`, `whsec_…` ใหม่, `price_…` ใหม่)
- [ ] ซื้อจริง 1 ครั้งด้วยบัญชีตัวเอง แล้วคืนเงินตัวเอง เพื่อยืนยันทั้งเส้นทาง
- [ ] แก้ FAQ "ฟรีจริงไหม" ใน `about.html` ให้บอกว่า N4 / N3 เปิดขายแล้ว
- [ ] Supabase แพ็กเกจฟรีถูกพักเมื่อไม่มีการใช้งาน 7 วัน ถ้ามีลูกค้าแล้วควรอัปเกรด (webhook ที่ส่งมาตอนโปรเจกต์ถูกพัก Stripe จะส่งซ้ำได้นานถึง 3 วัน)
- [ ] ภาษี: ถ้ารายได้ถึงเกณฑ์จด VAT ต้องปรับราคา/ใบเสร็จ (ปรึกษานักบัญชี) · Stripe ส่งใบเสร็จทางอีเมลได้: Settings → Customer emails → Successful payments
