# ส่งต่องาน · session 2026-11-22 รอบสี่ (โครงสร้างตรวจอัตโนมัติ)

อ่านไฟล์นี้ก่อนเริ่ม session ใหม่ แล้วอ่าน `CLAUDE.md` และ `FEATURE_MAP.md` · งานแมวพิกเซล/แผนที่อยู่ใน `docs/PET_PIXEL.md`

## สถานะ
- **branch** `claude/affectionate-hypatia-hmsdap` (v137–v142) **ยังไม่มี PR และยังไม่อยู่ใน main** · main อยู่ที่ v136 (PR #27)
- ถ้า PR ของ branch นี้ merge แล้ว ให้เริ่ม branch ใหม่จาก main ล่าสุด (งานที่ push หลัง merge จะค้างนอก main)
- **ผล `npm run check` ล่าสุด** (exit 1 · ตรงกับ CI [run #1](https://github.com/Tsuketee/kotoneko/actions/runs/45034707818) ที่แดงตามคาด):

| ขั้น | ผล |
|---|---|
| type (`tsc` strict เฉพาะ `.ts`) | ✅ 0 error |
| lint (ESLint) | ❌ 134 error ในโค้ดเดิม · ไม่ได้ปิดกฎ · แผนแก้ `docs/LINT_PLAN.md` |
| unit (`tests/payment.mjs`) | ✅ 12/12 |
| e2e (`tests/e2e.js`) | ✅ 58/58 |
| flows (`tests/flows.js`) | ❌ 6/7 · `06-write-finger` ลากนิ้วในหน้าฝึกเขียนไม่เกิดเส้น |

## เริ่ม session ใหม่ต้องทำก่อน
1. `npm ci` (container ใหม่ไม่มี `node_modules` · ESLint/tsc/hook ต้องใช้) · Chromium ของ Playwright ติดตั้งในเครื่องอยู่แล้ว
2. hook ตรวจไฟล์ (`.claude/settings.json` → `tools/hooks/check-file.js`) จะเริ่มทำงานตั้งแต่ session ใหม่ · แก้ไฟล์ที่มี lint error เดิมแล้วจะขึ้นรายการ error ทั้งไฟล์ เป็นเรื่องปกติจนกว่าจะแก้ตาม LINT_PLAN
3. skill `verify-app` เรียกใช้ได้แล้ว (`/verify-app`) · ใช้ก่อนบอกว่าเสร็จทุกครั้ง

## ทำไปใน session นี้
| เวอร์ชัน | งาน |
|---|---|
| v137 | ย้ายบันทึกส่งต่องานรอบสามจาก branch เก่ามาไว้ branch นี้ |
| v138 | CI ตรวจ VERSION ทุก PR (`tests/check-version.js`) · README แก้จำนวนข้อทดสอบ |
| v139 | `CLAUDE.md` ใหม่ (สั้น) · `FEATURE_MAP.md` (21 ฟีเจอร์) · `docs/corrections-log.md` |
| v140 | `tests/flows.js` 7 flow แบบผู้ใช้จริง · data-testid 37 จุด · ภาพหน้าจอ + console log ทุกข้อใน `test-results/` (`tests/artifacts.js`) · skill `verify-app` |
| v141 | `tsconfig.json` strict · `eslint.config.mjs` (กฎชั้น: localStorage เฉพาะ core/level/stats/cloud/packs · fetch เฉพาะ cloud · js/data ห้ามแตะ DOM) · `npm run check` (`tools/check.js`) · CI ทุก push/PR · hook · `docs/TYPESCRIPT_PLAN.md` `docs/LINT_PLAN.md` |
| v142 | บันทึกนี้ |

## รอเจ้าของตัดสิน
1. **เขียนด้วยนิ้ว** (`js/write.js:27` ข้าม pointer ชนิด touch แต่คำแนะนำบนจอบอกว่าเขียนด้วยนิ้วได้)
   - ก. ให้เขียนด้วยนิ้วได้ → แก้ `write.js` แล้ว test 06 จะผ่าน
   - ข. ตั้งใจให้ใช้แค่ Pencil (กันฝ่ามือ) → แก้ข้อความบนจอ และเปลี่ยน test 06 ให้ตรวจว่านิ้ว "ไม่" วาด
2. **เปิด PR หรือยัง**: ตอนนี้ CI จะแดงเพราะ lint 134 + test 06 · ถ้าตั้ง branch protection (Settings → Branches → require "npm run check" และ "เพิ่มเลข VERSION แล้ว") จะ merge ไม่ได้จนกว่าจะเขียว
3. **รายการปรับปรุงที่เสนอไว้ท้าย session (ยังไม่ได้ทำ รออนุมัติทีละรหัส)**:

| รหัส | เรื่อง |
|---|---|
| 1ก | ✅ v144 · corrections-log: แถว "แนบหลักฐาน" 1 → 4 ครั้ง |
| 1ข | ✅ v144 · แถวใหม่ "ขอบเขตงาน: ห้ามแก้เกินที่สั่ง เสนอก่อนรออนุมัติ" 4 ครั้ง |
| 1ค 1ง 1จ | ✅ v144 · แถวใหม่ "ห้ามเดา ต้องอ้างแหล่งจริง" 2 · "ห้ามปิดกฎ/ผ่อน test" 1 · "ทำทีละข้อ รายงานทีละข้อ" 1 |
| 2ก | ✅ v145 · Stop hook: บล็อกการจบ turn ถ้าโค้ดเปลี่ยนหลัง `npm run check` ครั้งล่าสุด (`check.js` เขียน `test-results/check-stamp.json`) |
| 2ข | ✅ v146 · งานที่ต้องอนุมัติก่อนแก้ → เจ้าของใช้ plan mode (Shift+Tab) แทนการเขียนกำกับในข้อความ |
| 2ค | ✅ v147 (แก้ข้อเดิม 3 ข้อ v148) · `tests/check-determinism.js` ในขั้น check: ข้อทดสอบที่จำลองพฤติกรรมแมวต้องมี `setJit(false)` และ `setNow(` |
| 3ก | ✅ v149 · FEATURE_MAP อ้าง e2e ด้วยคำในชื่อข้อแทนเลขบรรทัด + ขั้นตรวจว่าคำค้นเจอข้อจริง · SKILL ขั้น 2.4 ตาม |
| 3ข–3ฉ | ✅ v150 · SKILL verify-app: ภาพจาง/ว่าง = ยังไม่มีหลักฐาน · แยก 404/403 ที่ตั้งใจของ Supabase จำลอง (`pageerror` ต้องเป็น 0) · "KillShell" → `pkill -f "http.server 8000"` · ไม่รัน flows ซ้ำในขั้น 5 ถ้าไม่ได้แก้โค้ดหลังขั้น 3 · สถานะ "ไม่ผ่าน · ปัญหาเดิม" |
| 4ก | ✅ v151 · ESLint `linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: "error" }` แล้วลบ CLAUDE.md L24 |
| 4ข | ✅ v152 · ขั้น `version` ใน `check.js` แล้วลบแถว "เลข VERSION" (L20) |
| 4ค | ✅ v153 (ทำ 2ก แล้ว จึงลบข้อ 1) · ถ้าทำ 2ก ลบ DoD ข้อ 1 (L28–29) · ถ้าไม่ทำ อย่างน้อยแก้ `npm test` → `npm run check` (ตอนนี้ L29 ตกหล่น lint/type) |
| 4ง | ✅ v154 · ขั้น `test-count` (จำนวนข้อต้องไม่น้อยกว่า main) แล้วตัด "ข้าม ปิด" ออกจาก L32 |

4. เรื่องเดิมจากรอบก่อน (ดู `docs/PET_PIXEL.md` หัวข้อ "ส่งต่อ session 2026-11-22 รอบสาม"): ลองบน iPad จริง · หัวแมวตอนตอบข้อ · แผนที่เส้นทางเรียน · กติการ้านค้า · กติกาปลดล็อกลายขน/เครื่องประดับ

## งานถัดไปที่แนะนำ (เมื่อเจ้าของสั่ง)
1. ตัดสินข้อ 1 แล้วทำให้ flows ผ่าน 7/7
2. lint ~~กลุ่ม ก (`any` 4 จุดใน `stripe-webhook`)~~ ✅ v155 → ~~กลุ่ม ข (18 จุด รวม `packs.js:90,92` ที่เขียนทับฟังก์ชันของ `cloud.js`)~~ ✅ v156 → ~~ค~~ ✅ v157 → ~~จ~~ ✅ v158 → ง ตาม `docs/LINT_PLAN.md`
3. อัปเดต actions ใน CI (`checkout` `setup-node` `upload-artifact` @v4 ใช้ Node 20 ที่ GitHub เลิกรองรับ · ยังรันได้)
4. TypeScript ระยะ 1 ตาม `docs/TYPESCRIPT_PLAN.md`

## ข้อควรระวังที่เจอใน session นี้
- typescript-eslint 8.73 รองรับ TypeScript ถึง 6.0 จึงใช้ 6.0.3 (อย่าอัปเป็น 7.x จนกว่า typescript-eslint จะรองรับ)
- FEATURE_MAP อ้าง e2e ด้วยคำในชื่อข้อแล้ว (v149) · เปลี่ยนชื่อข้อ e2e ต้องแก้ FEATURE_MAP ด้วย ไม่งั้นขั้น featuremap ไม่ผ่าน
- ภาพหน้าจอต้องถ่ายด้วย `animations: 'disabled'` (`tests/artifacts.js`) ไม่งั้นได้ภาพจางระหว่างแอนิเมชัน
- skill หรือ hook ที่สร้างระหว่าง session จะยังใช้ไม่ได้จนกว่าจะเริ่ม session ใหม่ (หรือเปิด `/hooks`)
- 404/403 ใน console ของ e2e ข้อซิงก์/ซื้อ/แพ็ก มาจาก Supabase จำลองที่ตั้งใจตอบแบบนั้น

## ข้อความเริ่ม session ใหม่
> อ่าน `docs/HANDOFF.md` ก่อน รัน `npm ci` แล้วทำต่อจากหัวข้อ "รอเจ้าของตัดสิน"
