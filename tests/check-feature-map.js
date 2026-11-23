// บรรทัด **test** ของ FEATURE_MAP.md ต้องชี้ไปที่ข้อทดสอบที่มีอยู่จริง:
//   - `e2e.js "<คำ>"` ต้องมีข้อใน tests/e2e.js หรือ tests/e2e/*.js ที่ชื่อมีคำนั้น (ใช้คำเดียวกันรันได้: node tests/e2e.js "<คำ>")
//   - `flows.js` ตามด้วยรหัสข้อ เช่น 05-write-pen ต้องมีข้อนั้นใน tests/flows.js
//   - ห้ามอ้างด้วยเลขบรรทัด (`e2e.js:123`) เพราะเลื่อนทุกครั้งที่แก้ไฟล์
// รัน: node tests/check-feature-map.js [FEATURE_MAP.md]
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const map = process.argv[2] || path.join(ROOT, 'FEATURE_MAP.md');
const names = file => [...fs.readFileSync(path.join(ROOT, 'tests', file), 'utf8').matchAll(/^test\('([^']+)'/gm)].map(m => m[1]);
const e2e = [...names('e2e.js'), ...fs.readdirSync(path.join(ROOT, 'tests', 'e2e')).filter(f => f.endsWith('.js')).flatMap(f => names('e2e/' + f))], flows = names('flows.js');
const bad = [];
let refs = 0;
fs.readFileSync(map, 'utf8').split('\n').forEach((line, i) => {
  if (!line.startsWith('- **test**')) return;
  const at = `${path.basename(map)}:${i + 1}`;
  for (const m of line.matchAll(/`(?:e2e\.js)?:\d+`/g)) bad.push(`${at} อ้างด้วยเลขบรรทัด ${m[0]} · ให้ใช้ \`e2e.js "<คำในชื่อข้อ>"\` แทน`);
  for (const [, word] of line.matchAll(/`e2e\.js "([^"]+)"`/g)) {
    refs++;
    if (!e2e.some(n => n.includes(word))) bad.push(`${at} ไม่มีข้อใน tests/e2e.js ที่ชื่อมีคำว่า "${word}" (ชื่อข้อถูกเปลี่ยนหรือข้อถูกลบ?)`);
  }
  const fl = line.split('`flows.js`')[1];
  if (fl) for (const [id] of fl.matchAll(/\b\d\d[a-z]?-[a-z0-9-]+/g)) {
    refs++;
    if (!flows.includes(id)) bad.push(`${at} ไม่มีข้อ ${id} ใน tests/flows.js`);
  }
});
if (bad.length) {
  console.error('FEATURE_MAP.md อ้างข้อทดสอบที่ไม่มีอยู่จริง:\n  ' + bad.join('\n  ') + `\n\nไม่ผ่าน ${bad.length} จุด`);
  process.exit(1);
}
console.log(`ผ่านทั้งหมด ${refs} จุด (ทุกข้อที่ FEATURE_MAP อ้างมีอยู่จริงใน tests/e2e.js และ tests/flows.js)`);
