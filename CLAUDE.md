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
| test ทั้งหมด | `npm test` (= `node tests/payment.mjs && node tests/e2e.js` ราว 3 นาที) |
| test เฉพาะข้อ | `node tests/e2e.js <คำในชื่อข้อ>` |
| ภาพแมวพิกเซล | `node tests/pet-grid.js <โฟลเดอร์ผลลัพธ์>` |
| เลข VERSION | `node tests/check-version.js origin/main` |
| lint / type check | ยังไม่มี |

GitHub Actions (`.github/workflows/test.yml`) รัน `npm test` และตรวจ VERSION ทุก PR

## Definition of Done
ห้ามบอกว่าเสร็จ จนกว่าจะ:
1. รัน test ที่เกี่ยวข้องผ่าน และ `npm test` ผ่านทั้งชุด
2. แนบหลักฐานในคำตอบ: บรรทัดสรุปผล test (เช่น `ผ่านทั้งหมด 58 ข้อ`) และ screenshot หรือ log ของสิ่งที่เปลี่ยนถ้าเป็นงานหน้าจอ
3. บอกตรงๆ ว่าอะไรยังไม่ได้ทดสอบ (เช่น iPad จริง)
ถ้า test ไม่ผ่าน ให้รายงานว่าไม่ผ่านพร้อม output ห้ามข้าม ปิด หรือผ่อนเงื่อนไข test เพื่อให้ผ่าน

## Comment
ห้ามเขียน comment แก้ตัว หรือ comment อธิบาย workaround
ถ้ามีข้อจำกัด ให้ทำเป็น test ที่ล้มเมื่อข้อจำกัดถูกละเมิด หรือเป็น error message ที่ผู้ใช้/นักพัฒนาเห็นตอนเกิดปัญหา
