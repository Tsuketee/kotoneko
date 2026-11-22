# แผนแก้ lint ในโค้ดเดิม (วัดเมื่อ 2026-11-22 · `npm run lint` = 134 error)

กฎทุกข้อเปิดอยู่และ CI แดงจนกว่าจะเหลือ 0 ห้ามปิดกฎหรือใส่ `eslint-disable` เพื่อให้ผ่าน
ทำทีละกลุ่ม หนึ่ง PR ต่อกลุ่ม · แต่ละกลุ่มต้องผ่าน `npm run check` และ skill `verify-app`

## จำนวนต่อกฎ
| กฎ | จำนวน | อยู่ที่ไหน | กลุ่ม |
|---|---|---|---|
| `no-unused-vars` | 63 | `catch (e)` ที่ไม่ใช้ `e` 53 · กำหนดค่าแล้วไม่ได้ใช้ 6 · พารามิเตอร์ไม่ได้ใช้ 4 | ง (53) · ข (10) |
| `no-empty` | 38 | `catch (e) {}` ว่างทั้งหมด (cloud 12 · packs 10 · core 3 · learn 3 · profile 3 · อื่นๆ ไฟล์ละ 1) | ง |
| `no-useless-escape` | 12 | `js/stats.js` ทั้งหมด | ค |
| `no-restricted-globals` | 9 | localStorage นอกชั้นเก็บข้อมูล: `grammar.js:4,5` `learn.js:28,79` `pet.js:29` `place.js:24` `profile.js:11,14,14` | จ |
| `@typescript-eslint/no-explicit-any` | 4 | `supabase/functions/stripe-webhook/index.ts:13,36,37,50` | ก |
| `no-misleading-character-class` | 3 | regex ตรวจอิโมจิใน `tests/e2e.js:63,457,458` | ข |
| `no-global-assign` | 2 | `js/packs.js:90,92` เขียนทับฟังก์ชัน `cloudForget` `cloudVerify` ของ `cloud.js` | ข |
| `preserve-caught-error` | 1 | `js/packs.js:51` โยน error ใหม่โดยไม่แนบสาเหตุเดิม | ข |
| `no-sparse-arrays` | 1 | `tests/e2e.js:223` | ข |
| `no-useless-assignment` | 1 | `tests/e2e.js:671` | ข |

## ลำดับแก้
### ก · `any` ใน Edge Function (4 · เล็ก · เสี่ยงน้อย)
เปลี่ยนเป็น `unknown` หรือ type ของ response/error จริง แล้วให้ `tests/payment.mjs` ยืนยันพฤติกรรมเดิม

### ข · โค้ดที่น่าจะผิดหรือไม่ได้ใช้ (18)
- `packs.js:90,92`: แทนการเขียนทับฟังก์ชันของ `cloud.js` ด้วยจุดเกาะที่ `cloud.js` เปิดให้ (เช่นรายการฟังก์ชันที่เรียกหลังออกจากระบบ/ตรวจสิทธิ์)
- `packs.js:51`: ใส่ `{ cause: e }` ตอนโยน error "พื้นที่ในเครื่องไม่พอ"
- ตัวแปรที่ไม่ได้ใช้ 10 จุด: `core.js:60` (`ic` บังชื่อ `ic()` ของไฟล์เดียวกัน) `cloud.js:91` `pixelcat.js:107,109,478,813,1434,1582` `town.js:241` `tests/e2e.js:1651` · ลบ หรือใช้ให้ถูก
- `tests/e2e.js:63,457,458` regex อิโมจิ: ใช้ `\p{Extended_Pictographic}` แทนการรวม `️` ในวงเล็บเหลี่ยม · `:223` `:671` แก้ตามที่กฎบอก

### ค · escape เกินใน `stats.js` (12 · แก้แบบกลไก)
ลบ `\` ที่ไม่จำเป็นใน regex แล้วรัน e2e ข้อ "ส่งออก/นำเข้า"

### จ · localStorage นอกชั้นเก็บข้อมูล (9 · เปลี่ยนโครง)
เพิ่มฟังก์ชันอ่าน/เขียนใน `core.js` (เช่น `readJSON(key, fallback)` `writeJSON(key, value)`) แล้วให้ `grammar` `learn` `pet` `place` `profile` เรียกผ่านฟังก์ชันนี้ · ต้องรัน flows ทุกข้อและ e2e ข้อซิงก์/ส่งออก

### ง · `catch` ที่กลืน error เงียบ (91 = no-empty 38 + catch ไม่ใช้ตัวแปร 53 · ใหญ่สุด · ทำหลัง จ)
ส่วนใหญ่เป็น `JSON.parse(localStorage…)` และ `localStorage.setItem` ที่ล้มได้ในโหมดส่วนตัวหรือพื้นที่เต็ม
- หลังทำกลุ่ม จ แล้ว จุดอ่าน/เขียน localStorage จะไปรวมอยู่ใน `readJSON`/`writeJSON` ทำให้เหลือ `catch` ไม่กี่ที่
- ที่เหลือแยกเป็น 2 แบบ: ล้มแล้วไม่เป็นไรจริงๆ → `catch {` (ไม่ประกาศตัวแปร) และเพิ่ม test ที่ยืนยันว่าแอปยังทำงานเมื่อที่เก็บข้อมูลล้ม · ล้มแล้วผู้ใช้เสียข้อมูล → แสดงข้อความให้ผู้ใช้เห็น (เช่นบันทึกไม่ได้เพราะพื้นที่เต็ม)
- ห้ามแก้ด้วยการใส่ comment ใน `catch` ว่างเพื่อให้กฎผ่าน (ขัดกับกฎ comment ใน CLAUDE.md)
