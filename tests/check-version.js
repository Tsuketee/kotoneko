// ตรวจว่าเพิ่มเลข VERSION ใน sw.js แล้ว (กฎใน CLAUDE.md: แก้ไฟล์ไหนก็ตามต้องเพิ่ม VERSION ไม่งั้นเครื่องผู้ใช้จะยังเห็นไฟล์เก่าจากแคช)
// รัน: node tests/check-version.js <ref ฐาน>   เช่น  node tests/check-version.js origin/main
// GitHub Actions รันให้ทุก PR (.github/workflows/test.yml) โดยเทียบกับ branch ปลายทางของ PR
// ผ่าน = VERSION ของงานนี้มากกว่าของฐาน · ไม่ผ่าน = เท่าเดิม ลดลง หรือรูปแบบผิด (exit code 1)
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const base = process.argv[2];
if (!base) { console.error('ต้องบอก ref ฐาน เช่น node tests/check-version.js origin/main'); process.exit(2); }
const ver = (src, where) => {
  const m = /const VERSION = 'v(\d+)'/.exec(src);
  if (!m) { console.error(`✗ หา VERSION ใน sw.js ของ${where === "งานนี้" ? "งานนี้" : " " + where} ไม่เจอ (ต้องเป็นรูปแบบ const VERSION = 'v123';)`); process.exit(1); }
  return +m[1];
};
const ROOT = path.join(__dirname, '..');
const head = ver(fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8'), 'งานนี้');
let baseSrc;
try { baseSrc = execFileSync('git', ['show', `${base}:sw.js`], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
catch (e) { console.error(`✗ อ่าน sw.js จาก ${base} ไม่ได้ (ลอง git fetch ก่อน): ${String(e.stderr || e.message).trim()}`); process.exit(1); }
const was = ver(baseSrc, base);
if (head > was) { console.log(`✓ VERSION v${was} → v${head}`); process.exit(0); }
console.error(`✗ VERSION ไม่ได้เพิ่ม: ${base} เป็น v${was} แต่งานนี้เป็น v${head} · แก้ const VERSION ใน sw.js เป็น 'v${was + 1}'`
  + (head === was ? '' : ' (ถ้ามี PR อื่น merge ไปก่อน ให้ merge main เข้ามาแล้วเพิ่มเลขต่อจากนั้น)'));
process.exit(1);
