# Kotoneko 🐱 (言葉ねこ)

เว็บแอปทบทวนภาษาญี่ปุ่นระดับ N5 ใช้บน iPad ได้เหมือนแอปจริง และเปิดได้ตอนออฟไลน์

## ทำอะไรได้บ้าง
- **คานะ:** ฮิระงะนะ/คะตะคะนะ พร้อมตาราง เคล็ดจำ และเสียงอ่าน
- **คันจิ N5:** 105 ตัว พร้อมตัวอย่างคำที่ใช้คันจินั้น
- **คำศัพท์และบทสนทนา**
- **3 โหมด:** การ์ด · ควิซ · ฝึกเขียนตามลำดับขีด (รองรับ Apple Pencil)
- **ระบบทบทวนแบบเว้นระยะ:** ตอบถูกต่อเนื่องจะห่างขึ้นถึง 150 วัน ตอบผิดจะกลับมาเร็วขึ้น (ดูรายละเอียดและเหตุผลของค่าใน `js/learn.js`)
- **ไวยากรณ์ N5:** 11 บท (です, こそあど, ตัวช่วย の・も・と・を・に・で・へ・から・まで, กริยา ます, あります/います, い-adjective/な-adjective, 〜たい/〜ましょう, て-form) พร้อมตัวอย่าง แบบฝึกหัด และระบบทบทวนเว้นระยะ
- **เพื่อนสัตว์เลี้ยง:** สุ่มนิสัยได้ 10 แบบ มีภารกิจรายวัน, streak และหน้าสถิติ

## โครงสร้างไฟล์
```
index.html              หน้าหลัก (โหลดไฟล์ด้านล่างตามลำดับ)
about.html             หน้าแนะนำแอป (ใช้รูปใน img/)
privacy.html, terms.html  นโยบายความเป็นส่วนตัวและข้อกำหนดการใช้งาน (ต้องใส่อีเมลติดต่อก่อนเปิดใช้จริง)
css/style.css           หน้าตาแอป
js/data/kanji-n5.js     รายการคันจิ N5
js/data/content.js      คำศัพท์และบทสนทนา (เขียนเอง)
js/data/strokes.js      ข้อมูลลำดับขีดสำหรับโหมดฝึกเขียน
js/data/kana.js        ตารางคานะ
js/data/examples.js    ตัวอย่างคำที่ใช้คันจิ
js/data/mnemonics.js   เคล็ดจำคานะ
js/data/pet-lines.js   บทพูดสัตว์เลี้ยง
js/data/grammar.js     บทเรียนไวยากรณ์ (เขียนเอง)
js/data/cloud-config.js  ที่อยู่และคีย์สาธารณะของ Supabase (ว่าง = ไม่ใช้คลาวด์)
js/level.js             เลือกระดับ: สลับข้อมูลเป็นแพ็กเสียเงิน (N4 N3) ที่ดาวน์โหลดไว้ ก่อน core.js
js/core.js              แกนกลาง: ชุดข้อมูล ที่เก็บความคืบหน้า ไอคอน นำทาง หน้าแรก
js/learn.js             การเรียน: การ์ด ควิซ ทบทวน ผิดบ่อย แผนที่การเรียน
js/dialogue.js          บทสนทนา
js/write.js             ฝึกเขียน
js/pet.js               สัตว์เลี้ยงและการตั้งค่าครั้งแรก
js/grammar.js           ไวยากรณ์: รายการบท บทเรียน แบบฝึกหัด
js/stats.js             สถิติ เครดิต ส่งออก/นำเข้า
js/cloud.js             บัญชีผู้ใช้และซิงก์คลาวด์ (Supabase)
js/packs.js             ตรวจสิทธิ์ ดาวน์โหลดแพ็กเนื้อหาเสียเงิน สลับระดับ ปุ่มซื้อ และอัปโหลดของผู้ดูแล
supabase/schema.sql     ตารางและสิทธิ์ในฐานข้อมูล (ดู docs/CLOUD.md)
supabase/functions/     Edge Function ชำระเงิน Stripe: checkout, stripe-webhook (ดู docs/PAYMENT.md)
js/main.js              จุดเริ่มต้นแอป (ต้องโหลดท้ายสุด)
sw.js, manifest.webmanifest, icons/   ส่วนของ PWA (ใช้ออฟไลน์ และเพิ่มลงหน้าจอโฮม)
docs/ROADMAP.md         รายการงานที่จะทำต่อ
CLAUDE.md               คำสั่งสำหรับ Claude Code
FEATURE_MAP.md          แผนที่ฟีเจอร์: หน้า วิธีเข้า ไฟล์ selector flow ที่ห้ามพัง
docs/corrections-log.md เรื่องที่ต้องบอก AI ซ้ำ และสถานะการทำเป็นกฎอัตโนมัติ
```

## ลองเปิดในเครื่อง
```
python3 -m http.server
```
แล้วเปิด http://localhost:8000

## เผยแพร่
repo นี้เป็น public จึงใช้ GitHub Pages ได้ฟรี
1. ไปที่ **Settings → Pages**
2. Source: **Deploy from a branch** → Branch: `main` โฟลเดอร์ `/ (root)` → Save
3. รอ 1–2 นาที ลิงก์จะเป็น `https://tsuketee.github.io/kotoneko/`

ได้ลิงก์แล้ว ให้เปิดใน Safari บน iPad → กดปุ่มแชร์ → **เพิ่มไปยังหน้าจอโฮม**

ย้ายความคืบหน้าจากเครื่องเก่า: หน้าสถิติ → **ส่งออก** แล้วไปหน้าสถิติของเครื่องใหม่ → **นำเข้า**
หรือเปิดระบบบัญชีและซิงก์คลาวด์ (ตั้งค่าครั้งเดียวตาม `docs/CLOUD.md`) แล้วเข้าสู่ระบบด้วยอีเมลเดียวกันทุกเครื่อง

## ปล่อยเวอร์ชันใหม่
ทุกครั้งที่แก้ไฟล์ ให้เพิ่มเลข `VERSION` ใน `sw.js` ไม่งั้นเครื่องที่เคยเปิดแอปแล้วจะยังเห็นไฟล์เก่า (ทุก PR ถูกตรวจอัตโนมัติ ดูหัวข้อ "ทดสอบ")

## ทดสอบ
ชุดทดสอบอัตโนมัติ 4 ชุด: `tests/hooks.js` 10 ข้อ (hook ของ Claude Code ที่ไม่ให้จบงานถ้าโค้ดเปลี่ยนหลัง `npm run check`), `tests/flows.js` 8 ข้อ (flow หลักแบบผู้ใช้จริง: กดปุ่มและอ่านจอผ่าน `data-testid` ไม่เรียกโค้ดภายใน · ดู FEATURE_MAP.md), `tests/payment.mjs` 12 ข้อ (Edge Function ชำระเงิน กับ Stripe/Supabase จำลอง ต้องใช้ Node 22.18 ขึ้นไป) และ `tests/e2e.js` 58 ข้อ (ข้อมูล, การใช้งานหลัก, สัตว์เลี้ยงและแมวพิกเซล, สถานที่และแผนที่เมือง, ส่งออก/นำเข้า, ซิงก์คลาวด์ด้วย Supabase จำลอง, แพ็กเสียเงินและการซื้อ, iPad แนวตั้ง/นอน, PWA ออฟไลน์) ใช้ Playwright เปิด Chromium จริง
```
npm install
npx playwright install chromium   # ครั้งแรกครั้งเดียว
npm test
```
ทุกข้อเก็บภาพหน้าจอและ console log ไว้ใน `test-results/` (ไม่ commit · สรุปใน `test-results/<ชุด>/summary.md`) · ใน Claude Code ใช้ skill `verify-app` ตรวจและสรุปผลก่อนบอกว่าเสร็จ

ควรรันก่อนปล่อยเวอร์ชันใหม่ทุกครั้ง ส่วนการทดสอบบน iPad Safari จริง (Apple Pencil, safe-area) ยังต้องลองด้วยมือ

**ตรวจทั้งหมดด้วยคำสั่งเดียว**: `npm run check` = type check (`tsc` strict) → lint (ESLint) → unit (`tests/payment.mjs`) → hooks (`tests/hooks.js`) → e2e (`tests/e2e.js`) → flows (`tests/flows.js`) แล้วสรุปเป็นตาราง และบันทึกผลใน `test-results/check-stamp.json` · แผนแก้โค้ดเดิมที่ยังไม่ผ่าน lint อยู่ใน `docs/LINT_PLAN.md` และแผนย้ายไป TypeScript ใน `docs/TYPESCRIPT_PLAN.md`

**GitHub Actions** (`.github/workflows/test.yml`) รันให้เองทุก push และทุก PR:
- **npm run check**: ผิดกฎข้อไหนก็แดง
- **เพิ่มเลข VERSION แล้ว** (เฉพาะ PR): `VERSION` ใน `sw.js` ต้องมากกว่าของ branch ปลายทาง · รันเองได้ด้วย `node tests/check-version.js origin/main`

ให้ GitHub ห้าม merge เมื่อไม่ผ่าน: Settings → Branches → เพิ่มกฎของ `main` → Require status checks to pass → เลือก "เพิ่มเลข VERSION แล้ว" และ "npm run check"
