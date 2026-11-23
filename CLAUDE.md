# kotoneko

เว็บแอป PWA ทบทวนภาษาญี่ปุ่นระดับ JLPT N5: คันจิ คำศัพท์ บทสนทนาแบบสุภาพ/กันเอง ฮิระงะนะ/คะตะคะนะ และฝึกเขียนตามลำดับขีด
เรียนแล้วได้รางวัลไปเลี้ยงสัตว์เลี้ยง 2D ที่มีนิสัยต่างกัน · N4–N3 ล็อกไว้ก่อน (ปลดล็อกด้วยการซื้อ)
ใช้งานหลักบน iPad Safari (นิ้วและ Apple Pencil)

**อ่าน `FEATURE_MAP.md` ก่อนแก้ฟีเจอร์ใดๆ** (หน้าไหน เข้ายังไง ไฟล์ไหน selector ไหน flow ไหนห้ามพัง)

ตอบเป็นภาษาไทย

## คำสั่ง
| งาน | คำสั่ง |
|---|---|
| dev | `npm start` (= `python3 -m http.server 8000`) แล้วเปิด http://localhost:8000 |
| build | ไม่มี (HTML/CSS/JS ล้วน) |
| ติดตั้งครั้งแรก | `npm ci` แล้ว `npx playwright install chromium` |
| test เฉพาะข้อ | `node tests/e2e.js <คำในชื่อข้อ>` หรือ `node tests/flows.js <คำในชื่อข้อ>` |
| ภาพแมวพิกเซล | `node tests/pet-grid.js <โฟลเดอร์ผลลัพธ์>` |
| ตรวจข้อมูล | `npm run validate:data` (คันจิ คำศัพท์ บทสนทนา ตาม schema ใน `tools/data-schema.js` · รายงานเต็ม `test-results/validate-data.md`) |
| ตรวจทั้งหมด | `npm run check` (type → lint → schema → data → determinism → featuremap → version → test-count → unit → hooks → e2e → flows · ทุก push/PR บน CI ต้องผ่าน) |
| lint / type check | `npm run lint` · `npm run typecheck` (type ตรวจเฉพาะ `.ts` · แผนย้ายไป TypeScript ใน `docs/TYPESCRIPT_PLAN.md`) |

## Definition of Done
ก่อนบอกว่าเสร็จ ใช้ skill verify-app
ห้ามบอกว่าเสร็จ จนกว่าจะ:
1. แนบหลักฐานในคำตอบ: บรรทัดสรุปผล test (เช่น `ผ่านทั้งหมด 58 ข้อ`) และ screenshot หรือ log ของสิ่งที่เปลี่ยนถ้าเป็นงานหน้าจอ
2. บอกตรงๆ ว่าอะไรยังไม่ได้ทดสอบ (เช่น iPad จริง)
ถ้า test ไม่ผ่าน ให้รายงานว่าไม่ผ่านพร้อม output ห้ามผ่อนเงื่อนไข test เพื่อให้ผ่าน

## Comment
ห้ามเขียน comment แก้ตัว หรือ comment อธิบาย workaround
ถ้ามีข้อจำกัด ให้ทำเป็น test ที่ล้มเมื่อข้อจำกัดถูกละเมิด หรือเป็น error message ที่ผู้ใช้/นักพัฒนาเห็นตอนเกิดปัญหา
