// ข้อทดสอบที่จำลองพฤติกรรมแมว (เรียก step() ของ PixelCat._t) ต้องได้ผลเท่ากันทุกวัน:
//   - ปิดอารมณ์รายวันด้วย setJit(false) (ไม่งั้นน้ำหนักพฤติกรรมเปลี่ยน ±15% ตามวันที่รัน)
//   - ตรึงนาฬิกาฉากด้วย setNow(...) (นก รถไฟ ผีเสื้อ แดด และวันของอารมณ์รายวันใช้นาฬิกานี้)
// ตรวจทีละข้อ test('...') ในไฟล์ · รัน: node tests/check-determinism.js [ไฟล์ ...] (ค่าเริ่มต้น tests/e2e.js)
const fs = require('fs'), path = require('path');
const files = process.argv.slice(2).length ? process.argv.slice(2) : [path.join(__dirname, 'e2e.js')];
const bad = [];
let sims = 0;
for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const starts = lines.flatMap((l, i) => /^test\(/.test(l) ? [i] : []);
  starts.forEach((a, k) => {
    const body = lines.slice(a, starts[k + 1] ?? lines.length).join('\n');
    if (!/\bstep\(/.test(body)) return;
    sims++;
    const miss = [/setJit\(false\)/.test(body) ? null : 'setJit(false)', /\bsetNow\(/.test(body) ? null : 'setNow(<เวลาคงที่>)'].filter(Boolean);
    if (miss.length) bad.push(`${path.relative(process.cwd(), file)}:${a + 1} ${(lines[a].match(/test\('([^']*)'/) || [])[1] || lines[a].trim()}\n    ขาด: ${miss.join(' และ ')}`);
  });
}
if (bad.length) {
  console.error(`ข้อทดสอบที่จำลองพฤติกรรมแมว (เรียก step()) ต้องปิดอารมณ์รายวันด้วย PixelCat._t.setJit(false) และตรึงนาฬิกาฉากด้วย PixelCat._t.setNow(...) ไม่งั้นผลจะเปลี่ยนตามวันที่รัน (ตัวอย่าง: ข้อ "ตื่นแล้วหาว/ยืดตัว" ใน tests/e2e.js):\n\n  ` + bad.join('\n  ') + `\n\nไม่ผ่าน ${bad.length}/${sims} ข้อ`);
  process.exit(1);
}
console.log(`ผ่านทั้งหมด ${sims} ข้อ (ทุกข้อที่จำลองพฤติกรรมแมวปิดอารมณ์รายวันและตรึงนาฬิกาฉากแล้ว)`);
